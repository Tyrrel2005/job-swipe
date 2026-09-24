const { User } = require('../models');
const { verifyToken } = require('../utils/token');

async function protect(request, response, next) {
  try {
    const authHeader = request.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return response.status(401).json({ message: 'Token manquant. Veuillez vous connecter.' });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.id).select('-passwordHash');

    if (!user) {
      return response.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    request.user = user;
    return next();
  } catch (error) {
    return response.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return response.status(403).json({ message: 'Accès interdit pour ce rôle.' });
    }

    return next();
  };
}

module.exports = { protect, requireRole };
