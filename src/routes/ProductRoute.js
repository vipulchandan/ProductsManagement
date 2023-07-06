const express = require('express');
const { 
    createProduct, 
    getProducts, 
    getProductsById, 
    updateProduct, 
    deleteProduct 
} = require('../controllers/ProductController');
const router = express.Router();

router.post('/', createProduct)
router.get('/', getProducts)
router.get('/:productId', getProductsById)
router.put('/:productId', updateProduct)
router.delete('/:productId', deleteProduct)

module.exports = router;