const express = require('express');
const router = express.Router();
const {
  getSupplierEntries,
  addSupplierEntry,
  updateSupplierEntry,
  deleteSupplierEntry,
} = require('../controllers/supplierController');
const { protect, checkAdmin } = require('../middleware/auth');

router.use(protect);
router.use(checkAdmin);

router.route('/')
  .post(addSupplierEntry);

router.route('/:siteId')
  .get(getSupplierEntries);

router.route('/:id')
  .put(updateSupplierEntry)
  .delete(deleteSupplierEntry);

module.exports = router;
