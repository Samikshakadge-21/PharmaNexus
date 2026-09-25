const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error('Only PDF, JPG, and PNG license files are allowed')
    );
  }

  cb(null, true);
};

const uploadLicense = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
}).single('licenseFile');

module.exports = uploadLicense;