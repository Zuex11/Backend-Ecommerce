const Cart = require('../models/cart.model');
const catchAsync = require('../utilities/catchAsync.util');
const logger = require('../utilities/logger.util');
const Product = require('../models/product.model');
const AppError = require('../utilities/appError.util');

exports.getCart = catchAsync(async (req, res) => {
  const myCart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name imgURL price stock');
  logger.info(`Get Cart by ${req.user.firstName} - id: ${req.user._id} `);

  if (!myCart) {
    logger.info(`Empty Cart`);
    return res.status(200).json({ message: 'Cart is empty', data: { items: [] } });
  }
  res.status(200).json({ message: `Retrieved Cart: `, data: myCart });
});

async function addItemToCart(userId, productId, quantity, importedPrice) {
  if (!Number.isInteger(quantity) || quantity === 0) {
    throw new AppError('Quantity must be a non-zero whole number', 400);
  }
  const myProduct = await Product.findOne({ _id: productId, isDeleted: false, isActive: true });
  if (!myProduct) {
    logger.error(`Product with id ${productId} not found`);
    throw new AppError(`Product with id ${productId} not found`, 404);
  }
  const price = myProduct.price;

  const myCart = await Cart.findOne({ userId });
  const existingItem = myCart?.items.find((item) => item.productId.equals(productId));
  const currentQty = existingItem ? existingItem.quantity : 0;

  if (quantity > 0 && currentQty + quantity > myProduct.stock) {
    logger.error(`Not enough stock for ${myProduct.name}`);
    throw new AppError(`Not enough stock for ${myProduct.name}`, 400);
  }
  if (quantity < 0 && currentQty + quantity < 1) {
    throw new AppError(`Quantity can't go below 1`, 400);
  }

  const result = await Cart.updateOne(
    { userId, 'items.productId': productId },
    { $inc: { 'items.$.quantity': quantity } },
  );

  if (result.modifiedCount === 0) {
    await Cart.findOneAndUpdate(
      { userId, 'items.productId': { $ne: productId } },
      { $push: { items: { productId, quantity, price: importedPrice ?? price, isPriceChanged: importedPrice != null && importedPrice !== price } } },
      { upsert: true, runValidators: true },
    );
  }
  return myProduct;
}
exports.addToCart = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;
  const myProduct = await addItemToCart(req.user._id, productId, quantity);
  const updatedCart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name imgURL price stock');
  logger.info(`${myProduct.name} added to cart by ${req.user.firstName} - id: ${req.user._id}`);
  res.status(200).json({ message: `${myProduct.name} added/updated`, data: updatedCart });
});
exports.importCart = catchAsync(async (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Items are required to import a cart', 400);
  }
  for (const item of items) {
    if (item.price !== undefined && item.price !== null && (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0)) {
      throw new AppError('Invalid price in cart import', 400);
    }
    await addItemToCart(req.user._id, item.productId, item.quantity, item.price);
  }
  const myCart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name imgURL price stock');
  logger.info(`Guest cart imported for ${req.user.firstName} - id: ${req.user._id}`);
  res.status(200).json({ message: 'Cart imported', data: myCart });
});
exports.confirmProduct = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const myCart = await Cart.findOne({ userId });
  if (!myCart || myCart.items.length === 0) {
    logger.error(`Cart is empty for user ${req.user.firstName} - id: ${req.user._id}`);
    return next(new AppError('Cart is empty', 400));
  }
  const { productId } = req.body;
  const myProduct = await Product.findById(productId);
  if (!myProduct) {
    logger.error(`Product with id ${productId} not found`);
    return next(new AppError('Product not found', 404));
  }
  const result = await Cart.updateOne(
    { userId, 'items.productId': productId },
    { $set: { 'items.$.isPriceChanged': false, 'items.$.price': myProduct.price } },
  );
  if (result.matchedCount === 0) {
    logger.error(`${myProduct.name} not in cart`);
    return next(new AppError(`${myProduct.name} not in cart`, 404)); 
  }
  logger.info(
    `Product ${myProduct.name} price change confirmed by ${req.user.firstName} - id: ${req.user._id}`,
  );
  const updatedCart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name imgURL price stock');
  res.status(200).json({ message: 'Product price change confirmed', data: updatedCart });
});

exports.removeFromCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const myProduct = await Product.findById(productId);
  if (!myProduct) {
    logger.error(`Product with id ${productId} not found`);
    return next(new AppError(`Product with id ${productId} not found`, 404));
  }

  const result = await Cart.updateOne(
    { userId: req.user._id },
    { $pull: { items: { productId } } },
  );
  if (result.modifiedCount === 0) {
    logger.error(`${myProduct.name} not in cart`);
    return next(new AppError(`${myProduct.name} not in cart`, 404)); //either cart doesn't exist or item doesn't exist
  }
  const myCart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name imgURL price stock');

  logger.info(`${myProduct.name} removed from cart by ${req.user.firstName} - id: ${req.user._id}`);
  res.status(200).json({ message: `${myProduct.name} removed`, data: myCart });
});
exports.emptyCart = catchAsync(async (req, res, next) => {
  const result = await Cart.updateOne({ userId: req.user._id }, { $set: { items: [] } });
  if (result.matchedCount === 0) {
    logger.error(`Cart not found for user ${req.user.firstName}`);
    return next(new AppError('Cart not found', 404));
  }
  logger.info(`Cart emptied by ${req.user.firstName} - id: ${req.user._id}`);
  res.status(200).json({ message: 'Cart emptied', data: { items: [] } });
});
