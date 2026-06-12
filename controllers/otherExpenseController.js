const OtherExpense = require('../models/OtherExpense');
const Site = require('../models/Site');

// @desc    Get all other expenses for a specific site
// @route   GET /api/other-expenses/:siteId
// @access  Private
const getOtherExpenses = async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.siteId, contractor: req.user.contractorId });
    if (!site) return res.status(404).json({ message: 'Site not found or unauthorized' });

    const expenses = await OtherExpense.find({ site: req.params.siteId }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new other expense entry
// @route   POST /api/other-expenses
// @access  Private
const addOtherExpense = async (req, res) => {
  try {
    const { siteId, itemName, amount, date, paymentMode, reason } = req.body;

    const site = await Site.findOne({ _id: siteId, contractor: req.user.contractorId });
    if (!site) return res.status(404).json({ message: 'Site not found or unauthorized' });

    if (site.status === 'completed') {
      return res.status(400).json({ message: 'Cannot add entries to a completed site. Please reactivate the site first.' });
    }

    const expense = await OtherExpense.create({
      site: siteId,
      itemName,
      amount: Number(amount),
      date,
      paymentMode,
      reason,
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an other expense entry
// @route   PUT /api/other-expenses/:id
// @access  Private
const updateOtherExpense = async (req, res) => {
  try {
    const expense = await OtherExpense.findById(req.params.id).populate('site');

    if (!expense) {
      return res.status(404).json({ message: 'Expense entry not found' });
    }

    if (expense.site.contractor.toString() !== req.user.contractorId.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this entry' });
    }

    if (expense.site.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update entries of a completed site. Please reactivate the site first.' });
    }

    expense.itemName = req.body.itemName || expense.itemName;
    expense.amount = req.body.amount !== undefined ? Number(req.body.amount) : expense.amount;
    expense.date = req.body.date || expense.date;
    expense.paymentMode = req.body.paymentMode || expense.paymentMode;
    expense.reason = req.body.reason !== undefined ? req.body.reason : expense.reason;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an other expense entry
// @route   DELETE /api/other-expenses/:id
// @access  Private
const deleteOtherExpense = async (req, res) => {
  try {
    const expense = await OtherExpense.findById(req.params.id).populate('site');

    if (!expense) {
      return res.status(404).json({ message: 'Expense entry not found' });
    }

    if (expense.site.contractor.toString() !== req.user.contractorId.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this entry' });
    }

    if (expense.site.status === 'completed') {
      return res.status(400).json({ message: 'Cannot delete entries from a completed site. Please reactivate the site first.' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense entry removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOtherExpenses,
  addOtherExpense,
  updateOtherExpense,
  deleteOtherExpense,
};
