const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
});
subcategorySchema.index({ categoryId: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('Subcategory', subcategorySchema);
