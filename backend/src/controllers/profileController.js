const { profileFields } = require('../utils/profileFields');

function serializeProfileUser(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    profile: user.role === 'candidate' ? user.candidateProfile || null : user.recruiterProfile || null,
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

module.exports = { getProfile, updateProfile };