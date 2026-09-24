const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken } = require('../utils/token');

function serializeUser(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    candidateProfile: user.candidateProfile || null,
    recruiterProfile: user.recruiterProfile || null,
  };
}

async function register(request, response) {
  try {
    const { email, password, role } = request.body;

    if (!email || !password || !role) {
      return response.status(400).json({ message: 'Email, password et role sont requis.' });
    }

    if (!['candidate', 'recruiter'].includes(role)) {
      return response.status(400).json({ message: 'Role invalide. Utilisez candidate ou recruiter.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return response.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userData = {
      email: normalizedEmail,
      passwordHash,
      role,
      status: 'active',
      emailVerified: false,
    };

    if (role === 'candidate') {
      userData.candidateProfile = {
        firstName: request.body.firstName || '',
        lastName: request.body.lastName || '',
        title: request.body.title || '',
        location: request.body.location || '',
        experience: request.body.experience || '',
        availability: request.body.availability || 'immediate',
        workMode: request.body.workMode || 'hybrid',
        salaryMin: Number(request.body.salaryMin || 0),
        salaryMax: Number(request.body.salaryMax || 0),
        bio: request.body.bio || '',
        skills: Array.isArray(request.body.skills) ? request.body.skills : [],
        languages: Array.isArray(request.body.languages) ? request.body.languages : [],
        degree: request.body.degree || '',
        diploma: request.body.diploma || '',
        school: request.body.school || '',
        graduationYear: request.body.graduationYear || null,
        cvUrl: request.body.cvUrl || '',
      };
    }

    if (role === 'recruiter') {
      userData.recruiterProfile = {
        companyName: request.body.companyName || '',
        companySector: request.body.companySector || '',
        companySize: request.body.companySize || '',
        companyCity: request.body.companyCity || '',
        recruiterName: request.body.recruiterName || '',
        recruiterPosition: request.body.recruiterPosition || '',
      };
    }

    const user = await User.create(userData);
    const token = generateToken(user);

    return response.status(201).json({
      message: 'Compte créé avec succès.',
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors de l’inscription.',
      error: error.message,
    });
  }
}

async function login(request, response) {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ message: 'Email et password sont requis.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return response.status(401).json({ message: 'Identifiants invalides.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return response.status(401).json({ message: 'Identifiants invalides.' });
    }

    const token = generateToken(user);

    return response.status(200).json({
      message: 'Connexion réussie.',
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors de la connexion.',
      error: error.message,
    });
  }
}

async function getCurrentUser(request, response) {
  return response.status(200).json({
    user: serializeUser(request.user),
  });
}

module.exports = {
  register,
  login,
  getCurrentUser,
};
