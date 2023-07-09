const express = require('express');
const { addToCart, updateCart, getCartSummary, deleteCart } = require('../controllers/CartController');
const { auth } = require('../middlewares/auth');
const router = express.Router();

router.post('/users/:userId/cart', auth, addToCart);
router.put('/users/:userId/cart', auth, updateCart);
router.get('/users/:userId/cart', auth, getCartSummary);
router.delete('/users/:userId/cart', auth, deleteCart);

module.exports = router;