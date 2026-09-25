const express = require('express');

const {
	createMatch,
	listMatches,
	getCandidateCvForMatch,
	getCandidateProfileForMatch,
	updateMatchStatus,
} = require('../controllers/matchController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', listMatches);
router.post('/offers/:jobOfferId', createMatch);
router.get('/:id/candidate-profile', getCandidateProfileForMatch);
router.get('/:id/candidate-cv', getCandidateCvForMatch);
router.patch('/:id/status', updateMatchStatus);

module.exports = router;