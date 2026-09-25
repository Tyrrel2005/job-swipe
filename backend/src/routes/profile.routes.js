const express = require('express');

const {
	deleteCv,
	deleteCompanyLogo,
	deleteProfilePhoto,
	getCompanyLogo,
	getCv,
	getProfile,
	getProfilePhoto,
	updateProfile,
	uploadCv,
	uploadCompanyLogo,
	uploadProfilePhoto,
} = require('../controllers/profileController');
const { protect, requireRole } = require('../middlewares/authMiddleware');
const { handleCvUpload } = require('../middlewares/cvUpload');
const { handleCompanyLogoUpload, handleProfilePhotoUpload } = require('../middlewares/imageUpload');

const router = express.Router();

router.use(protect);
router.get('/', getProfile);
router.patch('/', updateProfile);
router.post('/cv', requireRole('candidate'), handleCvUpload, uploadCv);
router.get('/cv', requireRole('candidate'), getCv);
router.delete('/cv', requireRole('candidate'), deleteCv);
router.post('/photo', requireRole('candidate'), handleProfilePhotoUpload, uploadProfilePhoto);
router.get('/photo', requireRole('candidate'), getProfilePhoto);
router.delete('/photo', requireRole('candidate'), deleteProfilePhoto);
router.post('/company-logo', requireRole('recruiter'), handleCompanyLogoUpload, uploadCompanyLogo);
router.get('/company-logo', requireRole('recruiter'), getCompanyLogo);
router.delete('/company-logo', requireRole('recruiter'), deleteCompanyLogo);

module.exports = router;