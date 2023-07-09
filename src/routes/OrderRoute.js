const express = require('express');
const { createOrder, updateOrder } = require('../controllers/OrderController');
const { auth } = require('../middlewares/auth');
const router = express.Router();

router.post('/users/:userId/orders', auth, createOrder);
router.put('/users/:userId/orders', auth, updateOrder);

module.exports = router