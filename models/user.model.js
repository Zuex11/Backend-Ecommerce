const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'admin'],
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female'],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    addresses: [addressSchema],
  },
  { timestamps: true },
);
userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});
userSchema.methods.isCorrectPassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};
module.exports = mongoose.model('User', userSchema);
