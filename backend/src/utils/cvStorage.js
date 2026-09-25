const fs = require('fs');
const path = require('path');

const cvDirectory = path.resolve(__dirname, '../../uploads/cvs');

fs.mkdirSync(cvDirectory, { recursive: true });

function getCvPath(userId) {
  return path.join(cvDirectory, `${userId.toString()}.pdf`);
}

function getCvUrl() {
  return '/api/profile/cv';
}

module.exports = { cvDirectory, getCvPath, getCvUrl };