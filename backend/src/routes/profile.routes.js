const express = require('express');

const {
	deleteCv,
	getCv,
	getProfile,
	updateProfile,
	uploadCv,
} = require('../controllers/profileController');
const { protect, requireRole } = require('../middlewares/authMiddleware');
const { handleCvUpload } = require('../middlewares/cvUpload');

const router = express.Router();

router.use(protect);
router.get('/', getProfile);
router.patch('/', updateProfile);
router.post('/cv', requireRole('candidate'), handleCvUpload, uploadCv);
router.get('/cv', requireRole('candidate'), getCv);
router.delete('/cv', requireRole('candidate'), deleteCv);

module.exports = router;