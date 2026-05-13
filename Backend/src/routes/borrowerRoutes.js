const express = require('express');
const router = express.Router();
const { 
  createBorrower, 
  getAllBorrowers, 
  getBorrowerById, 
  updateBorrower, 
  deleteBorrower,
  freezeBorrower,
  blacklistBorrower 
} = require('../controllers/borrowerController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { restrictInactive } = require('../middlewares/operationalMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All routes here are protected
router.use(protect);

/**
 * @route   GET /api/admin/borrowers
 * @desc    Get all borrowers with search and filter
 * @access  Private (Admin, Staff)
 */
router.get('/', authorize('admin', 'staff'), getAllBorrowers);

/**
 * @route   POST /api/admin/borrowers/create
 * @desc    Create a new borrower manually
 * @access  Private (Admin, Staff, Agent)
 */
router.post('/create', authorize('admin', 'staff', 'agent'), restrictInactive, upload.single('profilePhoto'), createBorrower);

/**
 * @route   GET /api/admin/borrowers/:id
 * @desc    Get single borrower
 * @access  Private (Admin, Staff, Agent)
 */
router.get('/:id', authorize('admin', 'staff', 'agent'), getBorrowerById);

/**
 * @route   PUT /api/admin/borrowers/:id
 * @desc    Update borrower
 * @access  Private (Admin, Staff, Agent)
 */
router.put('/:id', authorize('admin', 'staff', 'agent'), restrictInactive, upload.single('profilePhoto'), updateBorrower);

/**
 * @route   PATCH /api/admin/borrowers/:id/freeze
 * @desc    Freeze borrower
 * @access  Private (Admin, Staff)
 */
router.patch('/:id/freeze', authorize('admin', 'staff'), restrictInactive, freezeBorrower);

/**
 * @route   PATCH /api/admin/borrowers/:id/blacklist
 * @desc    Blacklist borrower
 * @access  Private (Admin, Staff)
 */
router.patch('/:id/blacklist', authorize('admin', 'staff'), restrictInactive, blacklistBorrower);

/**
 * @route   DELETE /api/admin/borrowers/:id
 * @desc    Delete borrower
 * @access  Private (Admin)
 */
router.delete('/:id', authorize('admin'), deleteBorrower);

module.exports = router;
