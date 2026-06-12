const mongoose = require('mongoose');

const otherExpenseSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Site',
    },
    itemName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Online'],
      required: true,
    },
    reason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const OtherExpense = mongoose.model('OtherExpense', otherExpenseSchema);
module.exports = OtherExpense;
