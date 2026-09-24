const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    title: { type: String, trim: true },
    location: { type: String, trim: true },
    experience: { type: String, trim: true },
    availability: {
      type: String,
      enum: ['immediate', 'within1Month', 'within3Months'],
    },
    workMode: {
      type: String,
      enum: ['onsite', 'hybrid', 'remote'],
    },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    languages: [languageSchema],
    degree: { type: String, default: '' },
    diploma: { type: String, default: '' },
    school: { type: String, default: '' },
    graduationYear: { type: Number, default: null },
    cvUrl: { type: String, default: '' },
  },
  { _id: false }
);

const recruiterProfileSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true },
    companySector: { type: String, trim: true },
    companySize: { type: String, trim: true },
    companyCity: { type: String, trim: true },
    recruiterName: { type: String, trim: true },
    recruiterPosition: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['candidate', 'recruiter'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'disabled'],
      default: 'active',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    candidateProfile: {
      type: candidateProfileSchema,
      default: undefined,
    },
    recruiterProfile: {
      type: recruiterProfileSchema,
      default: undefined,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
