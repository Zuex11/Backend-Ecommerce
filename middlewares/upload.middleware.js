const multer = require('multer');
const path = require('path');
const AppError = require('../utilities/appError.util');

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowed = ['.png', '.jpg', '.jpeg'];
  if (!allowed.includes(extension)) {
    return cb(new AppError('Only images allowed', 400), false);
  }
  cb(null, true);
};

let fileSequence = 0;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const base = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}_${fileSequence++}_${base}`);
  },
});

const MB = 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MB * 5 },
});

module.exports = { upload };
