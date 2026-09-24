const express = require('express');

const {
  createJobOffer,
  listJobOffers,
  getJobOffer,
  updateJobOffer,
  deleteJobOffer,
} = require('../controllers/jobOfferController');
const { protect, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', listJobOffers);
router.get('/:id', getJobOffer);
router.post('/', requireRole('recruiter'), createJobOffer);
router.patch('/:id', requireRole('recruiter'), updateJobOffer);
router.delete('/:id', requireRole('recruiter'), deleteJobOffer);

module.exports = router;