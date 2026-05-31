const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100,
  },
  icon: {
    type: String,
    default: '📌',
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

categorySchema.index({ order: 1 });

module.exports = mongoose.model('Category', categorySchema);