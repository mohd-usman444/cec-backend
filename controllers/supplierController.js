const SupplierEntry = require('../models/SupplierEntry');
const Site = require('../models/Site');

// @desc    Get all supplier entries for a site
// @route   GET /api/suppliers/:siteId
// @access  Private
const getSupplierEntries = async (req, res) => {
  try {
    const site = await Site.findOne({ _id: req.params.siteId, contractor: req.user.contractorId });
    if (!site) return res.status(404).json({ message: 'Site not found or unauthorized' });

    const suppliers = await SupplierEntry.find({ site: req.params.siteId }).sort({ dateOfPurchase: -1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a supplier entry
// @route   POST /api/suppliers
// @access  Private
const addSupplierEntry = async (req, res) => {
  try {
    const { siteId, supplierName, supplierContact, materialName, quantity, unit, ratePerUnit, dateOfPurchase, paymentStatus, amountPaid, notes } = req.body;

    const site = await Site.findOne({ _id: siteId, contractor: req.user.contractorId });
    if (!site) return res.status(404).json({ message: 'Site not found' });

    if (site.status === 'completed') {
      return res.status(400).json({ message: 'Cannot add entries to a completed site. Please reactivate the site first.' });
    }

    const totalAmount = Number(quantity) * Number(ratePerUnit);
    const amountPaidNum = Number(amountPaid || 0);
    const balanceDue = req.body.balanceDue !== undefined ? Number(req.body.balanceDue) : totalAmount - amountPaidNum;

    // Calculate status
    let calculatedStatus = 'Due';
    if (balanceDue <= 0) {
      calculatedStatus = 'Paid';
    } else if (amountPaidNum > 0) {
      calculatedStatus = 'Partial';
    }

    const supplierEntry = await SupplierEntry.create({
      site: siteId,
      supplierName,
      supplierContact,
      materialName,
      quantity,
      unit,
      ratePerUnit,
      totalAmount,
      dateOfPurchase,
      paymentStatus: calculatedStatus,
      amountPaid: amountPaidNum,
      balanceDue,
      notes,
    });

    res.status(201).json(supplierEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update supplier entry
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplierEntry = async (req, res) => {
  try {
    const entry = await SupplierEntry.findById(req.params.id).populate('site');

    if (!entry) return res.status(404).json({ message: 'Supplier entry not found' });
    if (entry.site.contractor.toString() !== req.user.contractorId.toString()) return res.status(401).json({ message: 'Not authorized' });

    if (entry.site.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update entries of a completed site. Please reactivate the site first.' });
    }

    entry.supplierName = req.body.supplierName || entry.supplierName;
    entry.supplierContact = req.body.supplierContact !== undefined ? req.body.supplierContact : entry.supplierContact;
    entry.materialName = req.body.materialName || entry.materialName;
    entry.quantity = req.body.quantity || entry.quantity;
    entry.unit = req.body.unit || entry.unit;
    entry.ratePerUnit = req.body.ratePerUnit || entry.ratePerUnit;
    entry.dateOfPurchase = req.body.dateOfPurchase || entry.dateOfPurchase;
    entry.paymentStatus = req.body.paymentStatus || entry.paymentStatus;
    entry.amountPaid = req.body.amountPaid !== undefined ? req.body.amountPaid : entry.amountPaid;
    entry.notes = req.body.notes !== undefined ? req.body.notes : entry.notes;

    entry.totalAmount = entry.quantity * entry.ratePerUnit;
    entry.balanceDue = entry.totalAmount - entry.amountPaid;

    // update status based on payment
    if (entry.balanceDue <= 0) {
      entry.paymentStatus = 'Paid';
    } else if (entry.amountPaid > 0) {
      entry.paymentStatus = 'Partial';
    } else {
      entry.paymentStatus = 'Due';
    }

    const updatedEntry = await entry.save();
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete supplier entry
// @route   DELETE /api/suppliers/:id
// @access  Private
const deleteSupplierEntry = async (req, res) => {
  try {
    const entry = await SupplierEntry.findById(req.params.id).populate('site');

    if (!entry) return res.status(404).json({ message: 'Supplier entry not found' });
    if (entry.site.contractor.toString() !== req.user.contractorId.toString()) return res.status(401).json({ message: 'Not authorized' });

    if (entry.site.status === 'completed') {
      return res.status(400).json({ message: 'Cannot delete entries from a completed site. Please reactivate the site first.' });
    }

    await entry.deleteOne();
    res.json({ message: 'Supplier entry removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSupplierEntries,
  addSupplierEntry,
  updateSupplierEntry,
  deleteSupplierEntry,
};
