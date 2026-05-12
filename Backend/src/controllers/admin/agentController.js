const Agent = require('../../models/Agent');
const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/responseHandler');
const imagekit = require('../../config/imagekit');
const crypto = require('crypto');

// @desc    Create new agent
// @route   POST /api/admin/agents/create
// @access  Private/Admin
exports.createAgent = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phoneNumber,
    idNumber,
    physicalAddress,
    assignedRegion,
    joiningDate,
    reportingManager,
    baseCommission,
    recoveryBonus,
    commissionTier,
    role,
    internalNotes,
    password,
  } = req.body;

  // Check if agent already exists
  const agentExists = await Agent.findOne({ 
    $or: [{ email }, { phoneNumber }, { idNumber }] 
  });

  if (agentExists) {
    let field = 'Agent';
    if (agentExists.email === email) field = 'Email';
    if (agentExists.phoneNumber === phoneNumber) field = 'Phone number';
    if (agentExists.idNumber === idNumber) field = 'ID number';
    return sendError(res, `${field} already exists`, 400);
  }

  // Check if email already exists in User model (Auth system)
  const userExists = await User.findOne({ email });
  if (userExists) {
    return sendError(res, 'This email is already registered in the authentication system. Please use a unique email.', 400);
  }

  // Handle Profile Photo Upload
  let profilePhoto = null;
  let profilePhotoFileId = null;

  if (req.file) {
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer,
      fileName: `agent_${Date.now()}_${req.file.originalname}`,
      folder: '/agents/profiles',
    });
    profilePhoto = uploadResponse.url;
    profilePhotoFileId = uploadResponse.fileId;
  }

  // Create User for authentication
  const user = await User.create({
    fullName,
    email,
    phone: phoneNumber,
    password,
    role: 'agent',
    profilePhoto: profilePhoto || 'no-photo.jpg',
  });

  // Create Agent Profile
  const agent = await Agent.create({
    userId: user._id,
    fullName,
    email,
    password, 
    phoneNumber,
    idNumber,
    physicalAddress,
    profilePhoto,
    profilePhotoFileId,
    assignedRegion,
    joiningDate,
    reportingManager,
    baseCommission,
    recoveryBonus,
    commissionTier,
    role,
    internalNotes,
    createdBy: req.user._id,
  });

  sendSuccess(res, 'Agent created successfully', {
    agent
  }, 201);
});

// @desc    Get all agents
// @route   GET /api/admin/agents
// @access  Private/Admin
exports.getAgents = asyncHandler(async (req, res) => {
  const agents = await Agent.find({ isDeleted: false })
    .sort({ createdAt: -1 });

  sendSuccess(res, 'Agents retrieved successfully', agents);
});

// @desc    Get single agent
// @route   GET /api/admin/agents/:id
// @access  Private/Admin
exports.getAgentById = asyncHandler(async (req, res) => {
  const agent = await Agent.findOne({ _id: req.params.id, isDeleted: false });

  if (!agent) {
    return sendError(res, 'Agent not found', 404);
  }

  sendSuccess(res, 'Agent retrieved successfully', agent);
});

// @desc    Update agent
// @route   PUT /api/admin/agents/:id
// @access  Private/Admin
exports.updateAgent = asyncHandler(async (req, res) => {
  let agent = await Agent.findOne({ _id: req.params.id, isDeleted: false });

  if (!agent) {
    return sendError(res, 'Agent not found', 404);
  }

  const {
    fullName,
    email,
    phoneNumber,
    idNumber,
    physicalAddress,
    assignedRegion,
    joiningDate,
    reportingManager,
    baseCommission,
    recoveryBonus,
    commissionTier,
    accountStatus,
    role,
    internalNotes,
    password
  } = req.body;

  // Check uniqueness if email, phone, or idNumber are being changed
  const uniquenessCheck = [];
  if (email && email !== agent.email) uniquenessCheck.push({ email });
  if (phoneNumber && phoneNumber !== agent.phoneNumber) uniquenessCheck.push({ phoneNumber });
  if (idNumber && idNumber !== agent.idNumber) uniquenessCheck.push({ idNumber });

  if (uniquenessCheck.length > 0) {
    const existing = await Agent.findOne({
      $or: uniquenessCheck,
      _id: { $ne: agent._id },
      isDeleted: false
    });

    if (existing) {
      let field = 'Agent';
      if (existing.email === email) field = 'Email';
      if (existing.phoneNumber === phoneNumber) field = 'Phone number';
      if (existing.idNumber === idNumber) field = 'ID number';
      return sendError(res, `${field} already exists`, 400);
    }
  }

  // Handle Profile Photo Update
  if (req.file) {
    // Delete old photo if exists
    if (agent.profilePhotoFileId) {
      try {
        await imagekit.deleteFile(agent.profilePhotoFileId);
      } catch (err) {
        console.error('Error deleting old photo:', err);
      }
    }

    const uploadResponse = await imagekit.upload({
      file: req.file.buffer,
      fileName: `agent_${Date.now()}_${req.file.originalname}`,
      folder: '/agents/profiles',
    });
    
    agent.profilePhoto = uploadResponse.url;
    agent.profilePhotoFileId = uploadResponse.fileId;
  }

  // Update Agent fields manually to support .save() hooks
  const fields = [
    'fullName', 'email', 'phoneNumber', 'idNumber', 'physicalAddress',
    'assignedRegion', 'joiningDate', 'reportingManager', 'baseCommission',
    'recoveryBonus', 'commissionTier', 'accountStatus', 'role', 'internalNotes',
    'password'
  ];

  fields.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== '') {
      agent[field] = req.body[field];
    }
  });

  await agent.save();

  // Sync with User model
  try {
    const userUpdate = {};
    if (fullName) userUpdate.fullName = fullName;
    if (email) userUpdate.email = email;
    if (phoneNumber) userUpdate.phone = phoneNumber;
    if (password) userUpdate.password = password;
    
    // Status sync
    if (accountStatus === 'Active') {
      userUpdate.isActive = true;
      userUpdate.isFrozen = false;
    } else if (accountStatus === 'Suspended' || accountStatus === 'Inactive') {
      userUpdate.isFrozen = true;
    }

    if (Object.keys(userUpdate).length > 0) {
      const user = await User.findById(agent.userId);
      if (user) {
        Object.keys(userUpdate).forEach(key => {
          user[key] = userUpdate[key];
        });
        await user.save(); // Triggers hashing
      }
    }
  } catch (syncError) {
    console.error('Agent User Sync Error:', syncError);
  }

  sendSuccess(res, 'Agent updated successfully', agent);
});

// @desc    Delete agent (Hard delete)
// @route   DELETE /api/admin/agents/:id
// @access  Private/Admin
exports.deleteAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id);

  if (!agent) {
    return sendError(res, 'Agent not found', 404);
  }

  // 1. Delete Profile Photo from ImageKit
  if (agent.profilePhotoFileId) {
    try {
      await imagekit.deleteFile(agent.profilePhotoFileId);
    } catch (err) {
      console.error('Error deleting agent photo from ImageKit:', err);
    }
  }

  // 2. Delete linked User record
  if (agent.userId) {
    await User.findByIdAndDelete(agent.userId);
  }

  // 3. Delete Agent record from database
  await Agent.findByIdAndDelete(req.params.id);

  sendSuccess(res, 'Agent and associated user deleted permanently');
});
