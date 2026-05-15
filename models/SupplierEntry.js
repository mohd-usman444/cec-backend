const mongoose = require('mongoose');

const supplierEntrySchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Site',
    },
    supplierName: {
      type: String,
      required: true,
    },
    supplierContact: {
      type: String,
    },
    materialName: {
      type: String,
      required: true, // Cement, Sand, Bricks, Steel, etc.
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true, // Bags, Tonnes, Cft, etc.
    },
    ratePerUnit: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true, // Auto-calculated: quantity * ratePerUnit
    },
    dateOfPurchase: {
      type: Date,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Partial', 'Due'],
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      required: true, // Auto-calculated: totalAmount - amountPaid
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const SupplierEntry = mongoose.model('SupplierEntry', supplierEntrySchema);
module.exports = SupplierEntry;
