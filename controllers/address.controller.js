const User = require('../models/user.model');
const catchAsync = require('../utilities/catchAsync.util');
const logger = require('../utilities/logger.util');
const AppError = require('../utilities/appError.util');
const mongoose = require('mongoose');

exports.addAddress = catchAsync(async (req, res, next) => {
  const {
    title,
    fullName,
    country,
    governorate,
    phoneNumber,
    city,
    addressLine1,
    addressLine2,
    postalCode,
    isDefault,
  } = req.body;
  const userId = req.user._id;
  const name = req.user.firstName;
  logger.info(`Add address attempt by ${name} - id: ${userId}`);

  const existingUser = await User.findById(userId);
  if (!existingUser) {
    logger.error(`User not found - id: ${userId}`);
    throw new AppError('User not found', 404);
  }
  if (existingUser.addresses.length >= 5) {
    logger.warn(`Address limit reached by ${name} - id: ${userId}`);
    throw new AppError('Address limit reached (max 5)', 400);
  }

  const shouldBeDefault = existingUser.addresses.length === 0 || isDefault === true;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    if (shouldBeDefault) {
      await User.updateOne(
        { _id: userId },
        { $set: { 'addresses.$[].isDefault': false } },
        { session },
      );
    }
    const myUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        $push: {
          addresses: {
            title,
            fullName,
            country,
            governorate,
            phoneNumber,
            city,
            addressLine1,
            addressLine2,
            postalCode,
            isDefault: shouldBeDefault,
          },
        },
      },
      { new: true, runValidators: true, session },
    ).select('-password');
    await session.commitTransaction();
    session.endSession();

    logger.info(`Address added by ${name} - id: ${userId}`);
    res.status(201).json({ message: `Address added by ${name}`, data: myUser });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});

exports.editAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const {
    title,
    fullName,
    country,
    governorate,
    phoneNumber,
    city,
    addressLine1,
    addressLine2,
    postalCode,
    isDefault,
  } = req.body;
  const userId = req.user._id;
  const name = req.user.firstName;
  logger.info(`Edit address attempt by ${name} - id: ${userId}`);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    if (isDefault === true) {
      await User.updateOne(
        { _id: userId },
        { $set: { 'addresses.$[].isDefault': false } },
        { session },
      );
    }
    const myUser = await User.findOneAndUpdate(
      { _id: userId, 'addresses._id': addressId },
      {
        $set: {
          'addresses.$.title': title,
          'addresses.$.fullName': fullName,
          'addresses.$.country': country,
          'addresses.$.governorate': governorate,
          'addresses.$.phoneNumber': phoneNumber,
          'addresses.$.city': city,
          'addresses.$.addressLine1': addressLine1,
          'addresses.$.addressLine2': addressLine2,
          'addresses.$.postalCode': postalCode,
          'addresses.$.isDefault': isDefault,
        },
      },
      { new: true, runValidators: true, session },
    ).select('-password');

    if (!myUser) {
      logger.error(`Address ${addressId} not found for user - id: ${userId}`);
      throw new AppError('Address not found', 404);
    }
    await session.commitTransaction();
    session.endSession();

    logger.info(`Address ${addressId} updated by ${name} - id: ${userId}`);
    res.status(200).json({ message: `Address updated by ${name}`, data: myUser });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const userId = req.user._id;
  const name = req.user.firstName;
  logger.info(`Delete address attempt by ${name} - id: ${userId}`);

  const myUser = await User.findOneAndUpdate(
    { _id: userId, 'addresses._id': addressId },
    { $pull: { addresses: { _id: addressId } } },
    { new: true },
  ).select('-password');

  if (!myUser) {
    logger.error(`Address ${addressId} not found for user - id: ${userId}`);
    return next(new AppError('Address not found', 404));
  }

  logger.info(`Address ${addressId} deleted by ${name} - id: ${userId}`);
  res.status(200).json({ message: `Address deleted by ${name}`, data: myUser });
});
exports.setDefaultAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const userId = req.user._id;
  const name = req.user.firstName;
  logger.info(`Set default address attempt by ${name} - id: ${userId}`);

  const existingUser = await User.findOne({ _id: userId, 'addresses._id': addressId });
  if (!existingUser) {
    logger.error(`Address ${addressId} not found for ${name} - id: ${userId}`);
    throw new AppError('Address not found', 404);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await User.updateOne(
      { _id: userId },
      { $set: { 'addresses.$[].isDefault': false } },
      { session },
    );
    const myUser = await User.findOneAndUpdate(
      { _id: userId, 'addresses._id': addressId },
      { $set: { 'addresses.$.isDefault': true } },
      { new: true, session },
    ).select('-password');
    await session.commitTransaction();
    session.endSession();

    logger.info(`Address ${addressId} set as default by ${name} - id: ${userId}`);
    res.status(200).json({ message: `Default address updated by ${name}`, data: myUser });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});
