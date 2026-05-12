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
const upload = require('../middlewares/uploadMiddleware');

// All routes here are protected and restricted to Admin
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/borrowers
 * @desc    Get all borrowers with search and filter
 * @access  Private/Admin
 */
router.get('/', getAllBorrowers);

/**
 * @route   POST /api/admin/borrowers/create
 * @desc    Create a new borrower manually
 * @access  Private/Admin
 */
router.post('/create', upload.single('profilePhoto'), createBorrower);

/**
 * @route   GET /api/admin/borrowers/:id
 * @desc    Get single borrower
 * @access  Private/Admin
 */
router.get('/:id', getBorrowerById);

/**
 * @route   PUT /api/admin/borrowers/:id
 * @desc    Update borrower
 * @access  Private/Admin
 */
router.put('/:id', upload.single('profilePhoto'), updateBorrower);

/**
 * @route   PATCH /api/admin/borrowers/:id/freeze
 * @desc    Freeze borrower
 * @access  Private/Admin
 */
router.patch('/:id/freeze', freezeBorrower);

/**
 * @route   PATCH /api/admin/borrowers/:id/blacklist
 * @desc    Blacklist borrower
 * @access  Private/Admin
 */
router.patch('/:id/blacklist', blacklistBorrower);

/**
 * @route   DELETE /api/admin/borrowers/:id
 * @desc    Delete borrower
 * @access  Private/Admin
 */
router.delete('/:id', deleteBorrower);

module.exports = router;
