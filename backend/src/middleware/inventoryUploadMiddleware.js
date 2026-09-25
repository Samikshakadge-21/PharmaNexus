const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];

  const allowedExtensions = [
    '.xlsx',
    '.xls',
  ];

  const originalName = file.originalname || '';
  const extension = originalName
    .substring(originalName.lastIndexOf('.'))
    .toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    allowedExtensions.includes(extension)
  ) {
    return cb(null, true);
  }

  return cb(
    new Error(
      'Only Excel files (.xlsx or .xls) are allowed'
    )
  );
};

const uploadInventoryFile = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter,
});

module.exports = uploadInventoryFile;