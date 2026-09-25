const express = require('express');

const { createMatch, listMatches, updateMatchStatus } = require('../controllers/matchController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', listMatches);
router.post('/offers/:jobOfferId', createMatch);
router.patch('/:id/status', updateMatchStatus);

module.exports = router;