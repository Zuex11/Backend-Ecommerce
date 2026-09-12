const catchAsync = require('../utilities/catchAsync.util');
const logger = require('../utilities/logger.util');
const AppError = require('../utilities/appError.util');
const Testimonial = require('../models/testimonials.model');

exports.upsertTestimonial = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const name = req.user.firstName;
  const { text } = req.body;
  logger.info(`Testimonial upsert attempt by ${name} - id: ${userId}`);
  const myTestimonial = await Testimonial.findOneAndUpdate(
    { userId },
    { text, isApproved: false, isDeleted: false },
    { upsert: true, new: true, runValidators: true },
  );
  logger.info(`Testimonial saved by ${name} id: ${userId}`);
  res.status(200).json({ message: `Testimonial saved by ${name}`, data: myTestimonial });
});
exports.deleteTestimonial = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const name = req.user.firstName;
  logger.info(`Testimonial delete attempt by ${name} - id: ${userId}`);

  const myTestimonial = await Testimonial.findOneAndUpdate(
    { userId },
    { isDeleted: true },
    { new: true },
  );
  if (!myTestimonial) {
    logger.error(`Testimonial not found for user ${name} id: ${userId}`);
    return next(new AppError(`Testimonial not found for user ${name} id: ${userId}`, 404));
  }
  logger.info(`Testimonial deleted by ${name} id: ${userId}`);
  res.status(200).json({ message: `Testimonial deleted by ${name}`, data: myTestimonial });
});
exports.getAllTestimonials = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const name = req.user.firstName;
  logger.info(`Get all Testimonials attempt by ${name} - id: ${userId}`, {
    action: 'admin',
    user: req.user._id,
  });
  const myTestimonials = await Testimonial.find();
  if (myTestimonials.length === 0) {
    logger.warn(`No testimonials found`, {
      action: 'admin',
      user: req.user._id,
    });
    return res.status(200).json({ message: 'No Testimonials found', data: myTestimonials });
  }
  logger.info(`Testimonials listed | count: ${myTestimonials.length}`, {
    action: 'admin',
    user: req.user._id,
  });
  res.status(200).json({ message: 'Testimonials list: ', data: myTestimonials });
});
exports.getApprovedTestimonials = catchAsync(async (req, res) => {
  logger.info(`Get all approved testimonials attempt`);
  const myTestimonials = await Testimonial.find({
    isApproved: true,
    isDeleted: false,
  }).populate('userId', 'firstName lastName');
  if (myTestimonials.length === 0) {
    logger.warn(`No approved testimonials found`);
    return res
      .status(200)
      .json({ message: 'No approved testimonials found', data: myTestimonials });
  }
  logger.info(`Approved testimonials listed | count: ${myTestimonials.length}`);
  res.status(200).json({ message: 'Approved testimonials list: ', data: myTestimonials });
});
exports.getUnapprovedTestimonials = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const name = req.user.firstName;
  logger.info(`Get all unapproved testimonials attempt by ${name} - id: ${userId}`, {
    action: 'admin',
    user: req.user._id,
  });
  const myTestimonials = await Testimonial.find({
    isApproved: false,
    isDeleted: false,
  }).populate('userId', 'firstName lastName');
  if (myTestimonials.length === 0) {
    logger.warn(`No unapproved testimonials found`, {
      action: 'admin',
      user: req.user._id,
    });
    return res
      .status(200)
      .json({ message: 'No unapproved testimonials found', data: myTestimonials });
  }
  logger.info(`Unapproved testimonials listed | count: ${myTestimonials.length}`, {
    action: 'admin',
    user: req.user._id,
  });
  res.status(200).json({ message: 'Unapproved testimonials list: ', data: myTestimonials });
});
exports.approveTestimonial = catchAsync(async (req, res, next) => {
  const { testimonialId } = req.params;
  const adminName = req.user.firstName;
  logger.info(`Approve testimonial attempt by ${adminName} - id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });

  const myTestimonial = await Testimonial.findOneAndUpdate(
    { _id: testimonialId, isDeleted: false },
    { isApproved: true },
    { new: true },
  );

  if (!myTestimonial) {
    logger.error(`Testimonial ${testimonialId} not found`, {
      action: 'admin',
      user: req.user._id,
    });
    return next(new AppError('Testimonial not found', 404));
  }

  logger.info(`Testimonial ${testimonialId} approved by ${adminName} - id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });
  res.status(200).json({ message: `Testimonial approved by ${adminName}`, data: myTestimonial });
});
