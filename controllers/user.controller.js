const User = require('../models/user.model');
const catchAsync = require('../utilities/catchAsync.util');
const logger = require('../utilities/logger.util');
const AppError = require('../utilities/appError.util');
exports.getAllUsers = catchAsync(async (req, res) => {
  const myUsers = await User.find().select('-password');
  logger.info(`Get all users request by ${req.user.firstName} id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });

  if (myUsers.length > 0) {
    logger.info(`Users listed | count: ${myUsers.length}`, {
      action: 'admin',
      user: req.user._id,
    });
  } else {
    logger.warn('No users found', { action: 'admin', user: req.user._id });
  }
  res.status(200).json({ message: 'User list:', data: myUsers });
});
exports.getProfile = catchAsync(async (req, res) => {
  logger.info(`Get profile by ${req.user.firstName} - id: ${req.user._id} `)
  res.status(200).json({ message: 'Profile: ', data: req.user });
});
exports.createUser = (role) =>
  catchAsync(async (req, res) => {
    const { firstName, lastName, email, password, gender } = req.body;

    if (req.user) {
      logger.info(
        `Create user attempt: ${firstName} by ${req.user.firstName} id: ${req.user._id}`,
        {
          action: 'admin',
          user: req.user._id,
        },
      );
    } else {
      logger.info(`Signup attempt: ${firstName}`);
    }

    const myUser = await User.create({ firstName, lastName, email, password, role, gender });
    myUser.password = undefined;
    if (req.user) {
      logger.info(
        `User ${firstName} created (role: ${role}) by ${req.user.firstName} id: ${req.user._id}`,
        {
          action: 'admin',
          user: req.user._id,
        },
      );
    } else {
      logger.info(`User ${firstName} signed up (role: ${role})`);
    }

    res.status(201).json({ message: 'user created', data: myUser });
  });
exports.editUser = catchAsync(async (req, res) => {
  const { firstName, lastName, gender } = req.body;
  const myUser = await User.findByIdAndUpdate(
    req.user._id,
    { firstName, lastName, gender },
    { new: true, runValidators: true },
  ).select('-password');

  logger.info(`Edit user by ${req.user.firstName} - id: ${req.user._id}`);
  res.status(200).json({ message: 'User updated', data: myUser });
});
exports.editAdmin = catchAsync(async (req, res, next) => {
  const { firstName, lastName, gender, addresses, isBlocked, isDeleted, role } = req.body;
  logger.info(`Edit user attempt by admin ${req.user.firstName} - id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });
  const myUser = await User.findByIdAndUpdate(
    req.params.id,
    { firstName, lastName, gender, addresses, isBlocked, isDeleted, role },
    { new: true, runValidators: true },
  ).select('-password');
  if (!myUser) {
    logger.error(`User ${req.params.id} not found`, { action: 'admin', user: req.user._id });
    return next(new AppError('User not found', 404));
  }
  logger.info(
    `User ${myUser.firstName} updated by admin ${req.user.firstName} - id: ${req.user._id}`,
    { action: 'admin', user: req.user._id },
  );
  res.status(200).json({ message: `User ${myUser.firstName} updated`, data: myUser });
});

