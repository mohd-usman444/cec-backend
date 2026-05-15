const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    siteName: {
      type: String,
      required: true,
    },
    siteLocation: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
    },
    siteImage: {
      type: String, // URL to image or local path
    },
    slug: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'on-hold'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Site = mongoose.model('Site', siteSchema);
module.exports = Site;
