const mongoose = require('mongoose');

const productsSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  priceAtOrderTime: {
    type: Number,
    required: true,
    min: 0,
  },
});
const addressSchema = new mongoose.Schema({
  title: {
    required: true,
    type: String,
  },
  fullName: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  governorate: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: {
    type: String,
  },
  postalCode: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
  },
});
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: [productsSchema],
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: [
        'pending',
        'in progress',
        'shipped',
        'received',
        'cancelled by user',
        'cancelled by admin',
        'rejected',
        'refunded',
      ],
      default: 'pending',
    },
    orderedAt: {
      type:Date,
      default:Date.now
    },
    address:addressSchema
  },
  { timestamps: true },
);


module.exports = mongoose.model('Order', orderSchema);
