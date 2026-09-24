const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const jobOfferSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    contractType: {
      type: String,
      enum: ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance', 'Temps partiel'],
      required: true,
    },
    city: { type: String, required: true, trim: true },
    remoteMode: {
      type: String,
      enum: ['onsite', 'hybrid', 'remote'],
      required: true,
    },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    minimumDegree: { type: String, default: '' },
    requiredSkills: [{ type: String }],
    requiredLanguages: [languageSchema],
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['published', 'closed'],
      default: 'published',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobOffer', jobOfferSchema);
