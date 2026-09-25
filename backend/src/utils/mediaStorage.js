const fs = require('fs');
const path = require('path');

const profilePhotoDirectory = path.resolve(__dirname, '../../uploads/profile-photos');
const companyLogoDirectory = path.resolve(__dirname, '../../uploads/company-logos');

fs.mkdirSync(profilePhotoDirectory, { recursive: true });
fs.mkdirSync(companyLogoDirectory, { recursive: true });

function getProfilePhotoPath(userId) {
  return path.join(profilePhotoDirectory, userId.toString());
}

function getCompanyLogoPath(userId) {
  return path.join(companyLogoDirectory, userId.toString());
}

module.exports = {
  companyLogoDirectory,
  getCompanyLogoPath,
  getProfilePhotoPath,
  profilePhotoDirectory,
};