const fs = require('fs');
const mongoose = require('mongoose');
const { JobOffer, User } = require('../models');
const { getCompanyLogoPath } = require('../utils/mediaStorage');
const { calculateMatchingScore } = require('../utils/matchingScore');

const writableFields = [
  'title',
  'contractType',
  'city',
  'remoteMode',
  'salaryMin',
  'salaryMax',
  'minimumDegree',
  'requiredSkills',
  'requiredLanguages',
  'description',
  'status',
];

function extractOfferData(body, includeStatus = false) {
  const allowedFields = includeStatus ? writableFields : writableFields.filter((field) => field !== 'status');
  const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    const error = new Error(`Champ(s) d'offre non autorisé(s) : ${unknownFields.join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  return allowedFields.reduce((offer, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      offer[field] = body[field];
    }

    return offer;
  }, {});
}

function parsePagination(request) {
  const page = Math.max(Number.parseInt(request.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(request.query.limit, 10) || 10, 1), 50);

  return { page, limit, skip: (page - 1) * limit };
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getCompanyLogoForJob(request, response) {
  try {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: "Identifiant d'offre invalide." });
    }

    const jobOffer = await JobOffer.findOne({ _id: request.params.id, status: 'published' });
    if (!jobOffer) {
      return response.status(404).json({ message: 'Offre introuvable.' });
    }

    const recruiter = await User.findById(jobOffer.recruiterId).select('recruiterProfile');
    const logoPath = getCompanyLogoPath(jobOffer.recruiterId);

    if (!recruiter?.recruiterProfile?.companyLogoUrl || !fs.existsSync(logoPath)) {
      return response.status(404).json({ message: "Logo d'entreprise introuvable." });
    }

    return response.sendFile(logoPath, {
      headers: { 'Content-Type': recruiter.recruiterProfile.companyLogoMimeType || 'image/png' },
    });
  } catch (error) {
    return response.status(500).json({ message: "Erreur lors de la récupération du logo d'entreprise.", error: error.message });
  }
}

async function createJobOffer(request, response) {
  try {
    const offerData = extractOfferData(request.body || {});
    const jobOffer = await JobOffer.create({
      ...offerData,
      recruiterId: request.user._id,
    });

    return response.status(201).json({
      message: 'Offre créée avec succès.',
      jobOffer,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.statusCode === 400) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(500).json({
      message: "Erreur lors de la création de l'offre.",
      error: error.message,
    });
  }
}

async function listJobOffers(request, response) {
  try {
    const { page, limit, skip } = parsePagination(request);
    const filters = {};

    if (request.user.role === 'candidate') {
      filters.status = 'published';
    } else {
      filters.recruiterId = request.user._id;
      if (request.query.status) filters.status = request.query.status;
    }

    if (request.query.city) filters.city = new RegExp(request.query.city, 'i');
    if (request.query.contractType) filters.contractType = request.query.contractType;
    if (request.query.remoteMode) filters.remoteMode = request.query.remoteMode;
    if (request.query.skill) filters.requiredSkills = request.query.skill;

    const [jobOffers, total] = await Promise.all([
      JobOffer.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
      JobOffer.countDocuments(filters),
    ]);

    const serializedOffers = jobOffers.map((jobOffer) => {
      const serializedOffer = jobOffer.toObject();

      if (request.user.role === 'candidate') {
        serializedOffer.compatibilityScore = calculateMatchingScore(
          request.user.candidateProfile,
          jobOffer
        ).score;
      }

      return serializedOffer;
    });

    return response.status(200).json({
      jobOffers: serializedOffers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors de la récupération des offres.',
      error: error.message,
    });
  }
}

async function getJobOffer(request, response) {
  try {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: "Identifiant d'offre invalide." });
    }

    const jobOffer = await JobOffer.findById(request.params.id);

    if (!jobOffer) {
      return response.status(404).json({ message: 'Offre introuvable.' });
    }

    const canView = jobOffer.status === 'published'
      || jobOffer.recruiterId.equals(request.user._id);

    if (!canView) {
      return response.status(404).json({ message: 'Offre introuvable.' });
    }

    const serializedOffer = jobOffer.toObject();
    if (request.user.role === 'candidate') {
      serializedOffer.compatibilityScore = calculateMatchingScore(
        request.user.candidateProfile,
        jobOffer
      ).score;
    }

    return response.status(200).json({ jobOffer: serializedOffer });
  } catch (error) {
    return response.status(500).json({
      message: "Erreur lors de la récupération de l'offre.",
      error: error.message,
    });
  }
}

async function updateJobOffer(request, response) {
  try {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: "Identifiant d'offre invalide." });
    }

    const jobOffer = await JobOffer.findOne({
      _id: request.params.id,
      recruiterId: request.user._id,
    });

    if (!jobOffer) {
      return response.status(404).json({ message: 'Offre introuvable.' });
    }

    Object.assign(jobOffer, extractOfferData(request.body || {}, true));
    await jobOffer.save();

    return response.status(200).json({
      message: 'Offre mise à jour avec succès.',
      jobOffer,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.statusCode === 400) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(500).json({
      message: "Erreur lors de la mise à jour de l'offre.",
      error: error.message,
    });
  }
}

async function deleteJobOffer(request, response) {
  try {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: "Identifiant d'offre invalide." });
    }

    const deletedOffer = await JobOffer.findOneAndDelete({
      _id: request.params.id,
      recruiterId: request.user._id,
    });

    if (!deletedOffer) {
      return response.status(404).json({ message: 'Offre introuvable.' });
    }

    return response.status(204).send();
  } catch (error) {
    return response.status(500).json({
      message: "Erreur lors de la suppression de l'offre.",
      error: error.message,
    });
  }
}

module.exports = {
  createJobOffer,
  listJobOffers,
  getJobOffer,
  updateJobOffer,
  deleteJobOffer,
  getCompanyLogoForJob,
};