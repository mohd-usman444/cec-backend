const mongoose = require('mongoose');

const workerEntrySchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Site',
    },
    workerName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true, // Mason, Electrician, Helper, etc.
    },
    phoneNumber: {
      type: String,
    },
    dailyWage: {
      type: Number,
      required: true,
    },
    daysWorked: {
      type: Number,
      default: 1,
    },
    totalAmount: {
      type: Number,
      required: true, // Auto-calculated: dailyWage * daysWorked
    },
    dateOfPayment: {
      type: Date,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Online', 'Pending'],
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const WorkerEntry = mongoose.model('WorkerEntry', workerEntrySchema);
module.exports = WorkerEntry;
