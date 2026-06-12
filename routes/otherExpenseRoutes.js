const express = require('express');
const router = express.Router();
const {
  getOtherExpenses,
  addOtherExpense,
  updateOtherExpense,
  deleteOtherExpense,
} = require('../controllers/otherExpenseController');
const { protect, checkAdmin } = require('../middleware/auth');

router.use(protect);
router.use(checkAdmin);

router.route('/')
  .post(addOtherExpense);

router.route('/:siteId')
  .get(getOtherExpenses);

router.route('/:id')
  .put(updateOtherExpense)
  .delete(deleteOtherExpense);

module.exports = router;
