const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const catchAsync = require('../utilities/catchAsync.util');
const logger = require('../utilities/logger.util');
const AppError = require('../utilities/appError.util');
const mongoose = require('mongoose');

const cancelledStatuses = ['cancelled by user', 'cancelled by admin', 'rejected', 'refunded'];

exports.createOrder = catchAsync(async (req, res, next) => {
  const { addressId } = req.body;
  const myAddress = req.user.addresses.find((address) => address._id.toString() === addressId);
  if (!myAddress) {
    logger.error(`Address with id ${addressId} not found for user ${req.user._id}`);
    return next(new AppError(`Address with id ${addressId} not found`, 404));
  }
  const userId = req.user._id;
  const products = [];
  let totalPrice = 0;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    logger.info(`Order attempt by ${req.user.firstName} - id: ${req.user._id}`);
    const myCart = await Cart.findOne({ userId }).session(session);
    if (!myCart) {
      throw new AppError('Cart is empty', 404);
    } else {
      if (myCart.items.length === 0) {
        throw new AppError('Cart is empty', 404);
      }
      if (myCart.items.find((item) => item.isPriceChanged) !== undefined) {
        logger.error(
          `Failed to create order because price change detected in cart for user ${req.user._id}`,
        );
        throw new AppError(
          'Price change detected in cart. Please review your cart before placing the order.',
          400,
        );
      }
      for (const item of myCart.items) {
        const myProduct = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity }, isDeleted: false, isActive: true },
          { $inc: { stock: -item.quantity } },
          { new: true, session },
        );
        if (!myProduct) {
          logger.error(`Product ${item.productId} not found or out of stock`);
          throw new AppError('Product is unavailable or out of stock', 400);
        }
        products.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrderTime: myProduct.price,
        });
        totalPrice += myProduct.price * item.quantity;
      }
      const myOrder = await Order.create([{ userId, products, address: myAddress, totalPrice }], {
        session,
      });
      await Cart.updateOne({ userId }, { $set: { items: [] } }, { session });
      await session.commitTransaction();
      session.endSession();
      logger.info(`Order created by ${req.user.firstName} - id: ${req.user._id}`);
      res.status(201).json({ message: `Order created by ${req.user.firstName}`, data: myOrder[0] });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user._id;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const myOrder = await Order.findOneAndUpdate(
      { _id: orderId, userId, status: { $in: ['pending', 'in progress'] } },
      { status: 'cancelled by user' },
      { new: true, session },
    ).populate('products.productId', 'name imgURL');
    logger.info(`Cancelling order attempt by ${req.user.firstName} - id: ${req.user._id}`);
    if (!myOrder) {
      logger.error(
        `Order ${orderId} requested by ${req.user.firstName} - id: ${req.user._id} not found`,
      );
      throw new AppError(`Order ${orderId} requested by ${req.user._id} not found`, 404);
    }

    for (const item of myOrder.products) {
      const myProduct = await Product.findOneAndUpdate(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
        { new: true, session },
      );
      if (!myProduct) {
        logger.error(`Product ${item.productId} not found`);
        throw new AppError(`${item.productId} not found`, 404);
      }
    }
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ message: `Order ${orderId} cancelled`, data: myOrder });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});
exports.adminUpdateOrderStatus = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    let myOrder = await Order.findOne({ _id: orderId }).session(session);
    if (!myOrder) {
      logger.error(
        `Order ${orderId} requested by ${req.user.firstName} - id: ${req.user._id} not found`,
        { action: 'admin', user: req.user._id },
      );
      throw new AppError(`Order ${orderId} requested by ${req.user._id} not found`, 404);
    }
    const wasCancelled = cancelledStatuses.includes(myOrder.status);
    const willBeCancelled = cancelledStatuses.includes(status);
    const wasReceived = myOrder.status === 'received';
    myOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      { status: status },
      { new: true, session, runValidators: true },
    );
    logger.info(`Order status change attempt by ${req.user.firstName} - id: ${req.user._id}`, {
      action: 'admin',
      user: req.user._id,
    });

    if (willBeCancelled && !wasCancelled && !wasReceived) {
      for (const item of myOrder.products) {
        const myProduct = await Product.findOneAndUpdate(
          { _id: item.productId },
          { $inc: { stock: item.quantity } },
          { new: true, session },
        );
        if (!myProduct) {
          logger.error(`Product ${item.productId} not found`, {
            action: 'admin',
            user: req.user._id,
          });
          throw new AppError(`${item.productId} not found`, 404);
        }
      }
    }
    if (wasCancelled && !willBeCancelled) {
      for (const item of myOrder.products) {
        const myProduct = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session },
        );
        if (!myProduct) {
          logger.error(`Not enough stock to reactivate order ${orderId}`, {
            action: 'admin',
            user: req.user._id,
          });
          throw new AppError(`Not enough stock to reactivate this order`, 400);
        }
      }
    }
    await session.commitTransaction();
    session.endSession();
    logger.info(
      `Order status changed into ${status} by ${req.user.firstName} - id: ${req.user._id}`,
      {
        action: 'admin',
        user: req.user._id,
      },
    );
    res
      .status(200)
      .json({ message: `Order ${orderId} status changed to ${status}`, data: myOrder });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});
exports.getUserOrders = catchAsync(async (req, res) => {
  const userId = req.user._id;
  logger.info(`Get user orders by ${userId}`);

  const myOrders = await Order.find({ userId }).populate('products.productId', 'name imgURL');
  if (myOrders.length === 0) {
    logger.info(`${userId} has no orders`);
    return res.status(200).json({ message: `You have no orders`, data: [] });
  }
  res.status(200).json({ message: 'Your orders:', data: myOrders });
});
exports.getAllOrders = catchAsync(async (req, res) => {
  logger.info(`Get all orders by ${req.user.firstName} - id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });

  const myOrders = await Order.find().populate('products.productId', 'name imgURL').populate('userId', 'firstName lastName');
  if (myOrders.length === 0) {
    logger.info(`There are no orders`, { action: 'admin', user: req.user._id });
    return res.status(200).json({ message: `There are no orders`, data: [] });
  }
  res.status(200).json({ message: 'All orders:', data: myOrders });
});
exports.adminGetOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  logger.info(`Get order ${orderId} by admin ${req.user.firstName} - id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });

  const myOrder = await Order.findOne({ _id: orderId })
    .populate('products.productId', 'name imgURL')
    .populate('userId', 'firstName lastName');
  if (!myOrder) {
    logger.error(`Order ${orderId} not found`, { action: 'admin', user: req.user._id });
    return next(new AppError(`Order ${orderId} not found`, 404));
  }
  res.status(200).json({ message: 'Order:', data: myOrder });
});
exports.adminGetUserOrder = catchAsync(async (req, res) => {  const { id } = req.params;
  logger.info(`Get user orders by ${id}`, { action: 'admin', user: req.user._id });

  const myOrders = await Order.find({ userId: id }).populate('products.productId', 'name imgURL').populate('userId', 'firstName lastName');
  if (myOrders.length === 0) {
    logger.info(`${id} has no orders`, { action: 'admin', user: req.user._id });
    return res.status(200).json({ message: `${id} has no orders`, data: [] });
  }
  res.status(200).json({ message: 'Orders:', data: myOrders });
});
exports.getUserOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user._id;
  logger.info(`Get order ${orderId} by ${req.user.firstName} - id: ${userId}`);

  const myOrder = await Order.findOne({ _id: orderId, userId }).populate(
    'products.productId',
    'name imgURL',
  );
  if (!myOrder) {
    logger.error(`Order ${orderId} not found for user ${userId}`);
    return next(new AppError(`Order ${orderId} not found`, 404));
  }
  res.status(200).json({ message: 'Order:', data: myOrder });
});