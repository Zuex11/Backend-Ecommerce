const Category = require('../models/category.model');
const catchAsync = require('../utilities/catchAsync.util');
const logger = require('../utilities/logger.util');
const AppError = require('../utilities/appError.util');

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const myCategories = await Category.find();
  logger.info(`Get all categories request by ${req.user.firstName} id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });

  if (myCategories.length > 0) {
    logger.info(`Categories listed | count: ${myCategories.length}`, {
      action: 'admin',
      user: req.user._id,
    });
  } else {
    logger.warn('No categories found', { action: 'admin', user: req.user._id });
  }
  res.status(200).json({ message: `Categories list: `, data: myCategories });
});

exports.getActiveCategories = catchAsync(async (req, res) => {
  const myCategories = await Category.find({ isActive: true, isDeleted: false });
  logger.info(`Get all active categories`);

  if (myCategories.length > 0) {
    logger.info(`Active Categories listed | count: ${myCategories.length}`);
  } else {
    logger.warn('No categories found');
  }
  res.status(200).json({ message: `Categories list: `, data: myCategories });
});

exports.getCategoryBySlug = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const myCategory = await Category.findOne({ slug, isActive: true, isDeleted: false });
  if (!myCategory) {
    logger.error(`Can't find category "${slug}" by slug`);
    return next(new AppError(`Can't find category "${slug}" by slug`, 404));
  }
  logger.info(`Get category "${slug}" by slug`);
  res.status(200).json({ message: `Get category "${slug}" by slug`, data: myCategory });
});

exports.createCategory = catchAsync(async (req, res) => {
  const { name, slug } = req.body;
  logger.info(`Create category attempt: ${name} by ${req.user.firstName} id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });
  const myCategory = await Category.create({ name, slug });
  logger.info(`Category ${name} created by ${req.user.firstName} id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });
  res.status(201).json({ message: 'Category created', data: myCategory });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const updates = req.body;
  logger.info(`Update category attempt: ${slug} by ${req.user.firstName} id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });

  const myCategory = await Category.findOneAndUpdate({ slug }, updates, {
    new: true,
    runValidators: true,
  });
  if (!myCategory) {
    logger.error(`Can't find category "${slug}" by slug`, { action: 'admin', user: req.user._id });
    return next(new AppError(`Can't find category "${slug}" by slug`, 404));
  }
  logger.info(`Category "${slug}" updated by ${req.user.firstName} id: ${req.user._id}`, {
    changes: updates,
    action: 'admin',
    user: req.user._id,
  });
  res.status(200).json({ message: `Category "${slug}" updated`, data: myCategory });
});
