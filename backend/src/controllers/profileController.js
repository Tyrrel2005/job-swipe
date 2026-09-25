const fs = require('fs');

const { getCvPath, getCvUrl } = require('../utils/cvStorage');
const { calculateCompletion } = require('../utils/profileCompletion');
const { profileFields } = require('../utils/profileFields');

function serializeProfileUser(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    profile: user.role === 'candidate' ? user.candidateProfile || null : user.recruiterProfile || null,
    profileCompletion: calculateCompletion(
      user.role === 'candidate' ? user.candidateProfile : user.recruiterProfile,
      user.role
    ),
  };
}

function extractProfileData(role, body) {
  const allowedFields = profileFields[role] || [];
  const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    const error = new Error(`Champ(s) de profil non autorisé(s) : ${unknownFields.join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }

  return allowedFields.reduce((profile, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      profile[field] = body[field];
    }

    return profile;
  }, {});
}

async function getProfile(request, response) {
  return response.status(200).json({ user: serializeProfileUser(request.user) });
}

async function updateProfile(request, response) {
  try {
    if (!request.body || Array.isArray(request.body) || typeof request.body !== 'object') {
      return response.status(400).json({ message: 'Le profil doit être un objet JSON.' });
    }

    const profileData = extractProfileData(request.user.role, request.body);

    for (const field of ['skills', 'languages', 'desiredContractTypes']) {
      if (Object.prototype.hasOwnProperty.call(profileData, field) && !Array.isArray(profileData[field])) {
        return response.status(400).json({ message: `${field} doit être un tableau.` });
      }
    }

    if (request.user.role === 'candidate'
      && Object.prototype.hasOwnProperty.call(profileData, 'skills')
      && profileData.skills.length < 3) {
      return response.status(400).json({ message: 'Le profil candidat doit contenir au moins 3 compétences.' });
    }

    const profileField = request.user.role === 'candidate' ? 'candidateProfile' : 'recruiterProfile';
    const currentProfile = request.user[profileField] ? request.user[profileField].toObject() : {};

    request.user[profileField] = { ...currentProfile, ...profileData };
    await request.user.save();

    return response.status(200).json({
      message: 'Profil mis à jour avec succès.',
      user: serializeProfileUser(request.user),
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.statusCode === 400) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(500).json({
      message: 'Erreur lors de la mise à jour du profil.',
      error: error.message,
    });
  }
}

async function uploadCv(request, response) {
  try {
    if (request.user.role !== 'candidate') {
      return response.status(403).json({ message: 'Seul un candidat peut gérer un CV.' });
    }

    if (!request.file) {
      return response.status(400).json({ message: 'Le fichier CV est requis dans le champ cv.' });
    }

    const currentProfile = request.user.candidateProfile
      ? request.user.candidateProfile.toObject()
      : {};

    request.user.candidateProfile = {
      ...currentProfile,
      cvUrl: getCvUrl(),
    };
    await request.user.save();

    return response.status(201).json({
      message: 'CV enregistré avec succès.',
      cvUrl: getCvUrl(),
    });
  } catch (error) {
    if (request.file) {
      fs.rmSync(request.file.path, { force: true });
    }

    return response.status(500).json({
      message: "Erreur lors de l'enregistrement du CV.",
      error: error.message,
    });
  }
}

async function getCv(request, response) {
  if (request.user.role !== 'candidate') {
    return response.status(403).json({ message: 'Seul le candidat peut accéder à cette route.' });
  }

  if (!request.user.candidateProfile?.cvUrl) {
    return response.status(404).json({ message: 'Aucun CV enregistré.' });
  }

  const cvPath = getCvPath(request.user._id);

  if (!fs.existsSync(cvPath)) {
    return response.status(404).json({ message: 'Fichier CV introuvable.' });
  }

  return response.sendFile(cvPath, { headers: { 'Content-Type': 'application/pdf' } });
}

async function deleteCv(request, response) {
  try {
    if (request.user.role !== 'candidate') {
      return response.status(403).json({ message: 'Seul un candidat peut supprimer un CV.' });
    }

    fs.rmSync(getCvPath(request.user._id), { force: true });

    const currentProfile = request.user.candidateProfile
      ? request.user.candidateProfile.toObject()
      : {};

    request.user.candidateProfile = { ...currentProfile, cvUrl: '' };
    await request.user.save();

    return response.status(204).send();
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors de la suppression du CV.',
      error: error.message,
    });
  }
}

module.exports = { getProfile, updateProfile, uploadCv, getCv, deleteCv };