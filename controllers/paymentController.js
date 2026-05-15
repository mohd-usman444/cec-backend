const Payment = require('../models/Payment');

// @desc    Get all payments for the logged-in contractor
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ contractor: req.user._id }).sort({ date: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new payment
// @route   POST /api/payments
// @access  Private
const addPayment = async (req, res) => {
  try {
    const { name, date, amount, action, type, reason } = req.body;

    const payment = await Payment.create({
      contractor: req.user._id,
      name,
      date,
      amount,
      action,
      type,
      reason,
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a payment
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.contractor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    payment.name = req.body.name || payment.name;
    payment.date = req.body.date || payment.date;
    payment.amount = req.body.amount || payment.amount;
    payment.action = req.body.action || payment.action;
    payment.type = req.body.type || payment.type;
    payment.reason = req.body.reason || payment.reason;

    const updatedPayment = await payment.save();
    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.contractor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await payment.deleteOne();
    res.json({ message: 'Payment removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPayments,
  addPayment,
  updatePayment,
  deletePayment,
};
