const express = require('express');
const router = express.Router();
const {
  getSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  getStats,
} = require('../controllers/siteController');
const { protect, checkAdmin } = require('../middleware/auth');

// All site routes are protected; write ops blocked for employees
router.use(protect);
router.use(checkAdmin);

router.route('/')
  .get(getSites)
  .post(createSite);

router.get('/stats', getStats);

router.route('/:idOrSlug')
  .get(getSite)
  .put(updateSite)
  .delete(deleteSite);

module.exports = router;
