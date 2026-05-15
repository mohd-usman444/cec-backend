const express = require('express');
const router = express.Router();
const {
  getPayments,
  addPayment,
  updatePayment,
  deletePayment,
} = require('../controllers/paymentController');
const { protect, checkAdmin } = require('../middleware/auth');

router.use(protect); // All routes are protected
router.use(checkAdmin); // Write ops blocked for employees

router.route('/')
  .get(getPayments)
  .post(addPayment);

router.route('/:id')
  .put(updatePayment)
  .delete(deletePayment);

module.exports = router;
