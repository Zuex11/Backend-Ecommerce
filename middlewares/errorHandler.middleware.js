const logger = require('../utilities/logger.util');
const AppError = require('../utilities/appError.util');
module.exports = (err, req, res, next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new AppError(`${field} already exists: ${err.keyValue[field]}`, 400);
  }
  if (err.name === 'CastError') {
    err = new AppError('Invalid ID format', 400);
  }
  if (err.name === 'MulterError') {
    err = new AppError(err.message, 400);
  }
  if (err.name === 'ValidationError') {
    err = new AppError(err.message, 400);
  }
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  logger.error(`Error found | ${req.method} - ${req.originalUrl} : ${err.message}`, {
    stack: err.stack,
    user: req.user?._id,
    statusCode: err.statusCode,
  });
  if (process.env.NODE_ENV === 'dev') {
    return res
      .status(err.statusCode)
      .json({ status: err.status, error: err, message: err.message, stack: err.stack });
  } else {
    if (err.isOperational) {
      return res.status(err.statusCode).json({ status: err.status, message: err.message });
    } else {
      return res.status(500).json({ status: 'error', message: 'Something went wrong' });
    }
  }
};
