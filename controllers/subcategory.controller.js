const Subcategory = require('../models/subcategory.model');
const Category = require('../models/category.model');
const catchAsync = require('../utilities/catchAsync.util');

const logger = require('../utilities/logger.util');
const AppError = require('../utilities/appError.util');

exports.getAllSubcategories = catchAsync(async (req, res, next) => {
  const mySubcategories = await Subcategory.find();
  logger.info(`Get all subcategory request by ${req.user.firstName} id: ${req.user._id}`);

  if (mySubcategories.length > 0) {
    logger.info(`Subcategories listed | count: ${mySubcategories.length}`, {
      action: 'admin',
      user: req.user._id,
    });
  } else {
    logger.warn('No subcategory found', { action: 'admin', user: req.user._id });
  }
  res.status(200).json({ message: `Subcategories list: `, data: mySubcategories });
});

exports.getActiveSubcategories = catchAsync(async (req, res, next) => {
  const filter = { isActive: true, isDeleted: false };

  if (req.query.category) {
    const myCategory = await Category.findOne({ slug: req.query.category });
    if (!myCategory) {
      logger.error(`Can't find category "${req.query.category}" by slug`);
      return next(new AppError(`Can't find category "${req.query.category}" by slug`, 404));
    }
    filter.categoryId = myCategory._id;
  }

  const mySubcategories = await Subcategory.find(filter);
  logger.info(`Get all active subcategories`);

  if (mySubcategories.length > 0) {
    logger.info(`Active Subcategories listed | count: ${mySubcategories.length}`);
  } else {
    logger.warn('No subcategory found');
  }
  res.status(200).json({ message: `Subcategories list: `, data: mySubcategories });
});

exports.getSubcategoryBySlug = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const mySubcategory = await Subcategory.findOne({ slug, isActive: true, isDeleted: false });
  if (!mySubcategory) {
    logger.error(`Can't find subcategory "${slug}" by slug`);
    return next(new AppError(`Can't find subcategory "${slug}" by slug`, 404));
  }
  logger.info(`Get subcategory "${slug}" by slug`);
  res.status(200).json({ message: `Get subcategory "${slug}" by slug`, data: mySubcategory });
});

exports.createSubcategory = catchAsync(async (req, res, next) => {
  const { name, slug, categoryId } = req.body;
  logger.info(`Create subcategory attempt: ${name} by ${req.user.firstName} id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });
  const myCategory = await Category.findById(categoryId);
  if (myCategory) {
    const mySubcategory = await Subcategory.create({ name, slug, categoryId });
    logger.info(`Subcategory ${name} created by ${req.user.firstName} id: ${req.user._id}`, {
      action: 'admin',
      user: req.user._id,
    });
    res.status(201).json({ message: 'Subcategory created', data: mySubcategory });
  } else {
    logger.error(`Category with id ${categoryId} not found`, {
      action: 'admin',
      user: req.user._id,
    });
    return next(new AppError(`Can't find category with id ${categoryId} `, 404));
  }
});

exports.updateSubcategory = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const updates = req.body;
  logger.info(`Update subcategory attempt: ${slug} by ${req.user.firstName} id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });

  const mySubcategory = await Subcategory.findOneAndUpdate({ slug }, updates, {
    new: true,
    runValidators: true,
  });
  if (!mySubcategory) {
    logger.error(`Can't find subcategory "${slug}" by slug`, {
      action: 'admin',
      user: req.user._id,
    });
    return next(new AppError(`Can't find subcategory "${slug}" by slug`, 404));
  }
  logger.info(`Subcategory "${slug}" updated by ${req.user.firstName} id: ${req.user._id}`, {
    changes: updates,
    action: 'admin',
    user: req.user._id,
  });
  res.status(200).json({ message: `Subcategory "${slug}" updated`, data: mySubcategory });
});
