const express = require('express');
const router = express.Router();
const {
  getWorkerEntries,
  addWorkerEntry,
  updateWorkerEntry,
  deleteWorkerEntry,
} = require('../controllers/workerController');
const { protect, checkAdmin } = require('../middleware/auth');

router.use(protect);
router.use(checkAdmin);

router.route('/')
  .post(addWorkerEntry);

router.route('/:siteId')
  .get(getWorkerEntries);

router.route('/:id')
  .put(updateWorkerEntry)
  .delete(deleteWorkerEntry);

module.exports = router;
