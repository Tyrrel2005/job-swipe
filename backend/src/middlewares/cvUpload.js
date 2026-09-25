const multer = require('multer');

const { cvDirectory } = require('../utils/cvStorage');

const storage = multer.diskStorage({
  destination: cvDirectory,
  filename: (request, _file, callback) => {
    callback(null, `${request.user._id.toString()}.pdf`);
  },
});

const uploadCv = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const isPdf = file.mimetype === 'application/pdf' && file.originalname.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return callback(new Error('Le CV doit être un fichier PDF.'));
    }

    return callback(null, true);
  },
});

function handleCvUpload(request, response, next) {
  return uploadCv.single('cv')(request, response, (error) => {
    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return next();
  });
}

module.exports = { handleCvUpload };