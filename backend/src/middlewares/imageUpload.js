const multer = require('multer');

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

function createImageUploadHandler(fieldName, allowedMimeTypes) {
  return (request, response, next) => imageUpload.single(fieldName)(request, response, (error) => {
    if (error) {
      return response.status(400).json({ message: error.message });
    }

    if (!request.file || !allowedMimeTypes.includes(request.file.mimetype)) {
      return response.status(400).json({ message: 'Format image invalide.' });
    }

    return next();
  });
}

module.exports = {
  handleCompanyLogoUpload: createImageUploadHandler('logo', ['image/png', 'image/jpeg', 'image/svg+xml']),
  handleProfilePhotoUpload: createImageUploadHandler('photo', ['image/png', 'image/jpeg']),
};