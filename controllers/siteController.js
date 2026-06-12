const Site = require('../models/Site');
const WorkerEntry = require('../models/WorkerEntry');
const SupplierEntry = require('../models/SupplierEntry');
const OtherExpense = require('../models/OtherExpense');
const slugify = require('slugify');

// @desc    Get all sites for a contractor
// @route   GET /api/sites
// @access  Private
const getSites = async (req, res) => {
  try {
    const sites = await Site.find({ contractor: req.user.contractorId }).sort({ createdAt: -1 });
    
    // Enrich sites with stats
    const enrichedSites = await Promise.all(sites.map(async (site) => {
      const workerStats = await WorkerEntry.aggregate([
        { $match: { site: site._id } },
        { $group: { 
          _id: null, 
          labourSpend: { $sum: '$totalAmount' },
          uniqueWorkers: { $addToSet: '$workerName' }
        }}
      ]);

      const materialStats = await SupplierEntry.aggregate([
        { $match: { site: site._id } },
        { $group: { 
          _id: null, 
          materialSpend: { $sum: '$totalAmount' },
          materialPaid: { $sum: '$amountPaid' }
        } }
      ]);

      const otherExpenseStats = await OtherExpense.aggregate([
        { $match: { site: site._id } },
        { $group: { _id: null, otherExpenseSpend: { $sum: '$amount' } } }
      ]);

      return {
        ...site.toObject(),
        workerCount: workerStats.length > 0 ? workerStats[0].uniqueWorkers.length : 0,
        labourSpend: workerStats.length > 0 ? workerStats[0].labourSpend : 0,
        materialSpend: materialStats.length > 0 ? materialStats[0].materialSpend : 0,
        materialPaid: materialStats.length > 0 ? materialStats[0].materialPaid : 0,
        otherExpenseSpend: otherExpenseStats.length > 0 ? otherExpenseStats[0].otherExpenseSpend : 0
      };
    }));

    res.json(enrichedSites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single site by ID or Slug
// @route   GET /api/sites/:idOrSlug
// @access  Private
const getSite = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let site;

    // Check if valid ObjectId, else search by slug
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      site = await Site.findOne({ _id: idOrSlug, contractor: req.user.contractorId });
    } else {
      site = await Site.findOne({ slug: idOrSlug, contractor: req.user.contractorId });
    }

    if (site) {
      const workerStats = await WorkerEntry.aggregate([
        { $match: { site: site._id } },
        { $group: { 
          _id: null, 
          labourSpend: { $sum: '$totalAmount' },
          uniqueWorkers: { $addToSet: '$workerName' }
        }}
      ]);

      const materialStats = await SupplierEntry.aggregate([
        { $match: { site: site._id } },
        { $group: { 
          _id: null, 
          materialSpend: { $sum: '$totalAmount' },
          materialPaid: { $sum: '$amountPaid' }
        } }
      ]);

      const otherExpenseStats = await OtherExpense.aggregate([
        { $match: { site: site._id } },
        { $group: { _id: null, otherExpenseSpend: { $sum: '$amount' } } }
      ]);

      res.json({
        ...site.toObject(),
        workerCount: workerStats.length > 0 ? workerStats[0].uniqueWorkers.length : 0,
        labourSpend: workerStats.length > 0 ? workerStats[0].labourSpend : 0,
        materialSpend: materialStats.length > 0 ? materialStats[0].materialSpend : 0,
        materialPaid: materialStats.length > 0 ? materialStats[0].materialPaid : 0,
        otherExpenseSpend: otherExpenseStats.length > 0 ? otherExpenseStats[0].otherExpenseSpend : 0
      });
    } else {
      res.status(404).json({ message: 'Site not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new site
// @route   POST /api/sites
// @access  Private
const createSite = async (req, res) => {
  try {
    const { siteName, siteLocation, startDate, description, siteImage } = req.body;

    // Generate unique slug
    let baseSlug = slugify(siteName, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await Site.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const site = await Site.create({
      contractor: req.user.contractorId,
      siteName,
      siteLocation,
      startDate,
      description,
      siteImage,
      slug,
    });

    res.status(201).json(site);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a site
// @route   PUT /api/sites/:id
// @access  Private
const updateSite = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let site;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      site = await Site.findOne({ _id: idOrSlug, contractor: req.user.contractorId });
    } else {
      site = await Site.findOne({ slug: idOrSlug, contractor: req.user.contractorId });
    }

    if (site) {
      site.siteName = req.body.siteName || site.siteName;
      site.siteLocation = req.body.siteLocation || site.siteLocation;
      site.startDate = req.body.startDate || site.startDate;
      site.description = req.body.description || site.description;
      site.siteImage = req.body.siteImage || site.siteImage;
      site.status = req.body.status || site.status;

      // Update slug if name changed (optional, maybe better to keep slug constant)
      // Here we keep slug constant to avoid breaking existing links

      const updatedSite = await site.save();
      res.json(updatedSite);
    } else {
      res.status(404).json({ message: 'Site not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get contractor stats (Total Worker & Supplier spend)
// @route   GET /api/sites/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const allSites = await Site.find({ contractor: req.user.contractorId }).select('_id');
    const allSiteIds = allSites.map(site => site._id);

    const activeSites = await Site.find({ contractor: req.user.contractorId, status: 'active' }).select('_id');
    const activeSiteIds = activeSites.map(site => site._id);

    const workerStats = await WorkerEntry.aggregate([
      { $match: { site: { $in: activeSiteIds } } },
      { $group: { _id: null, totalSpend: { $sum: '$totalAmount' } } }
    ]);

    const supplierStats = await SupplierEntry.aggregate([
      { $match: { site: { $in: activeSiteIds } } },
      { $group: { 
        _id: null, 
        totalSpend: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$amountPaid' }
      } }
    ]);

    const otherExpenseStats = await OtherExpense.aggregate([
      { $match: { site: { $in: activeSiteIds } } },
      { $group: { _id: null, totalSpend: { $sum: '$amount' } } }
    ]);

    res.json({
      totalWorkerSpend: workerStats.length > 0 ? workerStats[0].totalSpend : 0,
      totalSupplierSpend: supplierStats.length > 0 ? supplierStats[0].totalSpend : 0,
      totalSupplierPaid: supplierStats.length > 0 ? supplierStats[0].totalPaid : 0,
      totalOtherExpense: otherExpenseStats.length > 0 ? otherExpenseStats[0].totalSpend : 0,
      totalSites: allSiteIds.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a site
// @route   DELETE /api/sites/:id
// @access  Private
const deleteSite = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let site;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      site = await Site.findOne({ _id: idOrSlug, contractor: req.user.contractorId });
    } else {
      site = await Site.findOne({ slug: idOrSlug, contractor: req.user.contractorId });
    }

    if (site) {
      // Also delete related worker, supplier, and other expense entries
      await WorkerEntry.deleteMany({ site: site._id });
      await SupplierEntry.deleteMany({ site: site._id });
      await OtherExpense.deleteMany({ site: site._id });
      
      await site.deleteOne();
      res.json({ message: 'Site removed' });
    } else {
      res.status(404).json({ message: 'Site not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  getStats,
};
