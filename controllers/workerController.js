const WorkerEntry = require('../models/WorkerEntry');
const Site = require('../models/Site');

// @desc    Get all worker entries for a specific site
// @route   GET /api/workers/:siteId
// @access  Private
const getWorkerEntries = async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.siteId, contractor: req.user._id });
    if (!site) return res.status(404).json({ message: 'Site not found or unauthorized' });

    const workers = await WorkerEntry.find({ site: req.params.siteId }).sort({ dateOfPayment: -1 });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new worker entry
// @route   POST /api/workers
// @access  Private
const addWorkerEntry = async (req, res) => {
  try {
    const { siteId, workerName, role, phoneNumber, dailyWage, daysWorked, dateOfPayment, paymentMode, notes } = req.body;

    const site = await Site.findOne({ _id: siteId, contractor: req.user._id });
    if (!site) return res.status(404).json({ message: 'Site not found or unauthorized' });

    if (site.status === 'completed') {
      return res.status(400).json({ message: 'Cannot add entries to a completed site. Please reactivate the site first.' });
    }

    const totalAmount = Number(dailyWage) * (Number(daysWorked) || 1);

    const workerEntry = await WorkerEntry.create({
      site: siteId,
      workerName,
      role,
      phoneNumber,
      dailyWage,
      daysWorked,
      totalAmount,
      dateOfPayment,
      paymentMode,
      notes,
    });

    res.status(201).json(workerEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a worker entry
// @route   PUT /api/workers/:id
// @access  Private
const updateWorkerEntry = async (req, res) => {
  try {
    const workerEntry = await WorkerEntry.findById(req.params.id).populate('site');

    if (!workerEntry) {
      return res.status(404).json({ message: 'Worker entry not found' });
    }

    if (workerEntry.site.contractor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this entry' });
    }

    if (workerEntry.site.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update entries of a completed site. Please reactivate the site first.' });
    }

    workerEntry.workerName = req.body.workerName || workerEntry.workerName;
    workerEntry.role = req.body.role || workerEntry.role;
    workerEntry.phoneNumber = req.body.phoneNumber || workerEntry.phoneNumber;
    workerEntry.dailyWage = req.body.dailyWage || workerEntry.dailyWage;
    workerEntry.daysWorked = req.body.daysWorked || workerEntry.daysWorked || 1;
    workerEntry.totalAmount = workerEntry.dailyWage * workerEntry.daysWorked; // Recalculate
    workerEntry.dateOfPayment = req.body.dateOfPayment || workerEntry.dateOfPayment;
    workerEntry.paymentMode = req.body.paymentMode || workerEntry.paymentMode;
    workerEntry.notes = req.body.notes !== undefined ? req.body.notes : workerEntry.notes;

    const updatedWorker = await workerEntry.save();
    res.json(updatedWorker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a worker entry
// @route   DELETE /api/workers/:id
// @access  Private
const deleteWorkerEntry = async (req, res) => {
  try {
    const workerEntry = await WorkerEntry.findById(req.params.id).populate('site');

    if (!workerEntry) {
      return res.status(404).json({ message: 'Worker entry not found' });
    }

    if (workerEntry.site.contractor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (workerEntry.site.status === 'completed') {
      return res.status(400).json({ message: 'Cannot delete entries from a completed site. Please reactivate the site first.' });
    }

    await workerEntry.deleteOne();
    res.json({ message: 'Worker entry removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWorkerEntries,
  addWorkerEntry,
  updateWorkerEntry,
  deleteWorkerEntry,
};
