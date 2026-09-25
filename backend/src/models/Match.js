const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOffer',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    compatibilityScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

matchSchema.index({ candidateId: 1, jobOfferId: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
