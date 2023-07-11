const Cart = require('../models/CartModel');
const User = require('../models/UserModel');
const Product = require('../models/ProductModel');
const mongoose = require('mongoose');


/*
POST /users/:userId/cart (Add to cart)
Create a cart for the user if it does not exist. Else add product(s) in cart.
Get cart id in request body.
Get productId in request body.
Make sure that cart exist.
Add a product(s) for a user in the cart.
Make sure the userId in params and in JWT token match.
Make sure the user exist
Make sure the product(s) are valid and not deleted.
Get product(s) details in response body
*/
const addToCart = async (req, res) => {
    try {
        const { userId } = req.params;
        let { productId, quantity, cartId } = req.body;
        const userIdFromToken = req.userId;

        // Check if the userId is valid
        if(!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid userId"
            });
        }

        // Check if the user exists
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        // Check if the userId in params and in JWT token match
        if(user._id.toString() !== userIdFromToken) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized! You are not the owner of this cart"
            });
        }

        // Check if the productId is valid
        if(!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid productId"
            });
        }
        
        // Check if the product exists
        const product = await Product.findOne({ _id: productId, isDeleted: false });
        if(!product) {
            return res.status(404).json({
                status: false,
                message: "Product not found"
            });
        }

        let cart;
        if(cartId) {
            // If cartId is provided in the request body, find the cart by cartId
            cart = await Cart.findOne({ _id: cartId, userId });
        } else {
            // If cartId is not provided in the request body, find the cart by userId
            cart = await Cart.findOne({ userId });

        }
        
        // Check if the cart exists
        if (!cart) {
            // Create a new cart if it doesn't exist
            cart = new Cart({
                userId,
                items: [{ productId, quantity }],
                totalPrice: product.price * quantity,
                totalItems: quantity,
            });
        } else {
            // Check if the product already exists in the cart
            const existingCartItem = cart.items.find(item => item.productId.toString() === productId);

            if(existingCartItem) {
                // If the item already exists in the cart, increase its quantity by 1
                existingCartItem.quantity += Number(quantity);
            } else {
                // If the item doesn't exist, create a new item with quantity that is in request body
                cart.items.push({
                    productId,
                    quantity
                });
                // cart.items.addToSet({  // The addToSet method adds an item to an array only if it doesn't already exist in the array
                //     productId,
                //     quantity: 1
                // });
            }

            // Update total price and total items
            cart.totalItems += Number(quantity);
            cart.totalPrice += product.price * quantity;
        }

        await cart.save();

        res.status(200).json({
            status: true,
            message: "Product added to cart",
            cart
        });
        
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
}



/*
PUT /users/:userId/cart (Remove product / Reduce a product's quantity from the cart)
Updates a cart by either decrementing the quantity of a product by 1 or deleting a product from the cart.
Get cart id in request body.
Get productId in request body.
Get key 'removeProduct' in request body.
Make sure that cart exist.
Key 'removeProduct' denotes whether a product is to be removed({removeProduct: 0}) or its quantity has to be decremented by 1({removeProduct: 1}).
Make sure the userId in params and in JWT token match.
Make sure the user exist
Get product(s) details in response body.
Check if the productId exists and is not deleted before updating the cart.
*/

const updateCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const { cartId, productId, removeProduct } = req.body;
        const userIdFromToken = req.userId;

        // Check if the userId is valid
        if(!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid userId"
            });
        }

        // Check if the user exists
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        // Check if the userId in params and in JWT token match
        if(user._id.toString() !== userIdFromToken) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized! You are not the owner of this cart"
            });
        }

        // Check if the cartId is valid
        if(!mongoose.Types.ObjectId.isValid(cartId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid cartId"
            });
        }

        // Check if the cart exists
        let cart = await Cart.findOne({ _id: cartId, userId });
        if(!cart) {
            return res.status(404).json({
                status: false,
                message: "Cart not found"
            });
        }

        // Check if the productId is valid
        if(!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid productId"
            });
        }
        // Check if the product exists
        const product = await Product.findOne({ _id: productId, isDeleted: false });
        if(!product) {
            return res.status(404).json({
                status: false,
                message: "Product not found"
            });
        }

        // Check if the productId exists and is not deleted before updating the cart
        const item = cart.items.find(item => item.productId.toString() === productId);
        if(!item) {
            return res.status(404).json({
                status: false,
                message: "Product not found in cart"
            });
        }

        if(removeProduct === 0) {
            // If removeProduct is 0, decrement the quantity of the product by 1
            cart.items = cart.items.filter(item => item.productId.toString() !== productId);
            // empty total price and total items
            cart.totalItems = cart.items.length;
            cart.totalPrice = cart.totalItems * product.price;
            // cart.totalItems -= item.quantity;
            // cart.totalPrice -= item.quantity * product.price;
        } else if(removeProduct === 1) {

            if (item.quantity > 1) {
                // If removeProduct is greater than 1, decrement the quantity of the product by 1
                item.quantity -= 1;
                // Update total price and total items
                cart.totalItems -= 1;
                cart.totalPrice -= product.price;
            } else {
                // If removeProduct is 1, delete the product from the cart
                cart.items = cart.items.filter(item => item.productId.toString() !== productId);
                // empty total price and total items
                cart.totalItems = cart.items.length;
                cart.totalPrice = cart.totalItems * product.price;
            }
        }

        await cart.save();

        res.status(200).json({
            status: true,
            message: "Cart updated successfully",
            cart
        })
    } catch(err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
}


/*
GET /users/:userId/cart
Returns cart summary of the user.
Make sure that cart exist.
Make sure the userId in params and in JWT token match.
Make sure the user exist
Get product(s) details in response body.
*/

const getCartSummary = async (req, res) => {
    try {
        const { userId } = req.params;
        const userIdFromToken = req.userId;
        
        // Check if the userId is valid
        if(!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid userId"
            });
        }

        // Check if the user exists
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        // Check if the userId in params and in JWT token match
        if(user._id.toString() !== userIdFromToken) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized! You are not the owner of this cart"
            });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if(!cart) {
            return res.status(404).json({
                status: false,
                message: "Cart not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Cart summary retrieved successfully",
            cart
        })
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
}


/*
DELETE /users/:userId/cart
Deletes the cart for the user.
Make sure that cart exist.
Make sure the userId in params and in JWT token match.
Make sure the user exist
cart deleting means array of items is empty, totalItems is 0, totalPrice is 0.
*/

const deleteCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const userIdFromToken = req.userId;

        // Check if the userId is valid
        if(!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid userId"
            });
        }

        // Check if the user exists
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        // Check if the userId in params and in JWT token match
        if(user._id.toString() !== userIdFromToken) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized! You are not the owner of this cart"
            });
        }

        const cart = await Cart.findOne({ userId });
        if(!cart) {
            return res.status(404).json({
                status: false,
                message: "Cart not found"
            });
        }

        cart.items = [];
        cart.totalItems = 0;
        cart.totalPrice = 0;

        await cart.save();

        res.status(200).json({
            status: true,
            message: "Cart deleted successfully",
            cart
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
}




module.exports = {
    addToCart,
    updateCart,
    getCartSummary,
    deleteCart
}