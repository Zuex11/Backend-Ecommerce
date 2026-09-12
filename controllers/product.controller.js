const Product = require('../models/product.model');
const catchAsync = require('../utilities/catchAsync.util');
const AppError = require('../utilities/appError.util');
const logger = require('../utilities/logger.util');
const Category = require('../models/category.model');
const Subcategory = require('../models/subcategory.model');
const Cart = require('../models/cart.model');
exports.createProduct = catchAsync(async (req, res, next) => {
  const {
    name,
    desc,
    price,
    slug,
    stock,
    categoryId,
    subcategoryId,
    isTopSale,
    isNewArrival,
    isActive,
  } = req.body;
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Product image is required', 400));
  }
  const imgURL = req.files.map((file) => file.filename);
  logger.info(`Create product attempt: ${name} by ${req.user.firstName} id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });
  const myCategory = await Category.findById(categoryId);
  const mySubcategory = await Subcategory.findById(subcategoryId);
  if (!myCategory) {
    logger.error(`Category with id ${categoryId} not found`);
    return next(new AppError(`Category with id ${categoryId} not found`, 404));
  }
  if (!mySubcategory) {
    logger.error(`Subcategory with id ${subcategoryId} not found`);
    return next(new AppError(`Subcategory with id ${subcategoryId} not found`, 404));
  }
  if (!mySubcategory.categoryId.equals(myCategory._id)) {
    return next(new AppError('Subcategory does not belong to this category', 400));
  }
  const myProduct = await Product.create({
    name,
    desc,
    price,
    slug,
    stock,
    imgURL,
    categoryId,
    subcategoryId,
    isTopSale,
    isNewArrival,
    isActive,
  });
  logger.info(`Product ${req.body.name} created by ${req.user.firstName} - id: ${req.user._id}`);
  res.status(201).json({ message: 'product created', data: myProduct });
});

exports.getAllProducts = catchAsync(async (req, res) => {
  const myProducts = await Product.find().populate('categoryId subcategoryId', 'name');
  logger.info(`Get all Products request by ${req.user.firstName} id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });

  if (myProducts.length > 0) {
    logger.info(`Products listed | count: ${myProducts.length}`, {
      action: 'admin',
      user: req.user._id,
    });
  } else {
    logger.warn('No products found', { action: 'admin', user: req.user._id });
  }
  res.status(200).json({ message: `Products list: `, data: myProducts });
});

exports.getActiveProducts = catchAsync(async (req, res, next) => {
  const filter = { isActive: true, isDeleted: false };

  if (req.query.category) {
    const myCategory = await Category.findOne({ slug: req.query.category });
    if (!myCategory) {
      logger.error(`Can't find category "${req.query.category}" by slug`);
      return next(new AppError(`Can't find category "${req.query.category}" by slug`, 404));
    }
    filter.categoryId = myCategory._id;
  }
  if (req.query.subcategory) {
    const mySubcategory = await Subcategory.findOne({ slug: req.query.subcategory });
    if (!mySubcategory) {
      logger.error(`Can't find subcategory "${req.query.subcategory}" by slug`);
      return next(new AppError(`Can't find subcategory "${req.query.subcategory}" by slug`, 404));
    }
    filter.subcategoryId = mySubcategory._id;
  }
  if (req.query.isTopSale) {
    filter.isTopSale = req.query.isTopSale;
  }
  if (req.query.isNewArrival) {
    filter.isNewArrival = req.query.isNewArrival;
  }
  const myProducts = await Product.find(filter)
    .populate('categoryId subcategoryId')
    .lean();
  const visibleProducts = myProducts.filter(
    (product) =>
      product.categoryId?.isActive !== false &&
      product.categoryId?.isDeleted !== true &&
      product.subcategoryId?.isActive !== false &&
      product.subcategoryId?.isDeleted !== true,
  );
  logger.info(`Get all active products`);

  if (visibleProducts.length > 0) {
    logger.info(`Active products listed | count: ${visibleProducts.length}`);
  } else {
    logger.warn('No products found');
  }
  res.status(200).json({ message: `Products list: `, data: visibleProducts });
});
exports.getProductBySlug = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const myProduct = await Product.findOne({
    slug,
    isActive: true,
    isDeleted: false,
  }).populate('categoryId subcategoryId', 'name');
  if (!myProduct) {
    logger.error(`Can't find Product "${slug}" by slug`);
    return next(new AppError(`Can't find Product "${slug}" by slug`, 404));
  }
  logger.info(`Get product "${slug}" by slug`);
  res.status(200).json({ message: `Get product "${slug}" by slug`, data: myProduct });
});
exports.updateProduct = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const updates = req.body;
  if (req.files && req.files.length > 0) {
    updates.imgURL = req.files.map((file) => file.filename);
  }
  logger.info(`Update product attempt: ${slug} by ${req.user.firstName} id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });

  const myProduct = await Product.findOne({ slug });
  if (!myProduct) {
    logger.error(`Can't find product "${slug}" by slug`, { action: 'admin', user: req.user._id });
    return next(new AppError(`Can't find product "${slug}" by slug`, 404));
  }

  const oldPrice = myProduct.price;
  myProduct.set(updates);
  await myProduct.save();
  await myProduct.populate('categoryId subcategoryId', 'name');
  if (updates.price !== undefined && Number(updates.price) !== oldPrice) {
    await Cart.updateMany(
      { 'items.productId': myProduct._id },
      { $set: { 'items.$.isPriceChanged': true } },
    );
    logger.info(`Price changed for "${slug}" - flagged in affected carts`, {
      action: 'admin',
      user: req.user._id,
    });
  }

  logger.info(`Product "${slug}" updated by ${req.user.firstName} id: ${req.user._id}`, {
    changes: updates,
    action: 'admin',
    user: req.user._id,
  });
  res.status(200).json({ message: `Product "${slug}" updated`, data: myProduct });
});
exports.getRelatedProducts = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const myProduct = await Product.findOne({ slug, isActive: true, isDeleted: false });

  if (!myProduct) {
    logger.error(`Can't find product "${slug}" by slug`);
    return next(new AppError(`Can't find product "${slug}" by slug`, 404));
  }

  const { categoryId, subcategoryId } = myProduct;

  const relatedSubcatProducts = await Product.find({
    subcategoryId: { $eq: subcategoryId },
    isActive: true,
    isDeleted: false,
    slug: { $ne: slug },
  })
    .limit(4)
    .populate('categoryId subcategoryId', 'name');

  if (!relatedSubcatProducts || relatedSubcatProducts.length === 0) {
    const relatedCatProducts = await Product.find({
      categoryId: { $eq: categoryId },
      isActive: true,
      isDeleted: false,
      slug: { $ne: slug },
    })
      .limit(4)
      .populate('categoryId subcategoryId', 'name');
    logger.info(`Get related products for "${slug}" | fallback to category | count: ${relatedCatProducts.length}`);
    return res.status(200).json({ message: `Get related products:`, data: relatedCatProducts });
  }

  logger.info(`Get related products for "${slug}" | count: ${relatedSubcatProducts.length}`);
  res.status(200).json({ message: `Get related products:`, data: relatedSubcatProducts });
});