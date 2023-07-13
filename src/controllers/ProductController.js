const mongoose = require("mongoose");
const ProductModel = require("../models/ProductModel");
const { uploadProductImage } = require("../utils/awsConfig");


const createProduct = async (req, res) => {
    try {
        const { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments } = req.body;
        const files = req.files;

        // title validation
        if(!title) {
            return res.status(400).json({
                status: false,
                message: "Title is required"
            });
        }
        const existingTitle = await ProductModel.findOne({ title });
        if(existingTitle) {
            return res.status(400).json({
                status: false,
                message: "Title already exists"
            });
        }

        // description validation
        if(!description) {
            return res.status(400).json({
                status: false,
                message: "Description is required"
            });
        }

        // price validation
        if(!price) {
            return res.status(400).json({
                status: false,
                message: "Price is required"
            });
        }
        if (price === undefined || isNaN(price) || !isFinite(price)) {
            return res.status(400).json({
                status: false,
                message: "Price must be a valid number or decimal."
            });
        }

        // currencyId validation
        if(!currencyId) {
            return res.status(400).json({
                status: false,
                message: "Currency Id is required"
            });
        }
        if(!["INR"].includes(currencyId)) {
            return res.status(400).json({
                status: false,
                message: "Currency Id must be INR"
            });
        }

        // currencyFormat validation
        if(!currencyFormat) {
            return res.status(400).json({
                status: false,
                message: "Currency Format is required"
            });
        }
        if(!["₹"].includes(currencyFormat)) {
            return res.status(400).json({
                status: false,
                message: "Currency Format must be Rupee symbol (₹)."
            });  
        }

        // productImage upload validation
        if(files && files.length > 0) {
            const file = files[0];
            const fileUrl = await uploadProductImage(file);
            req.body.productImage = fileUrl;
        } else {
            return res.status(400).json({
                status: false,
                message: "No File Found"
            });
        }

        // availableSizes validation
        if(!availableSizes) {
            return res.status(400).json({
                status: false,
                message: "Available Sizes is required"
            });
        }
        // if(!["S","XS","M","X","L","XXL","XL"].includes(availableSizes)) {
        //     return res.status(400).json({
        //         status: false,
        //         message: "Available Sizes must be S, XS, M, X, L, XXL, XL."
        //     });
        // }
        const validSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];
        const invalidSizes = availableSizes.filter(size => !validSizes.includes(size));
        if (invalidSizes.length > 0) {
            return res.status(400).json({
                status: false,
                message: "Available Sizes must be S, XS, M, X, L, XXL, XL."
            });
        }
        if(availableSizes.length < 1) {
            return res.status(400).json({
                status: false,
                message: "Please select at least one size."
            });
        }

        const newProduct = await ProductModel.create({
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            productImage: req.body.productImage,
            style,
            availableSizes,
            installments
        });
        
        return res.status(201).json({
            status: true,
            message: "Product created successfully",
            data: newProduct
        })

    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message
        });
    }
}




const getProducts = async (req, res) => {
    try {
        const { size, name, priceGreaterThan, priceLessThan, priceSort } = req.query;

        const query = { isDeleted: false };

        if(size) {
            query.availableSizes = size;
        }

        if(name) {
            query.title = { $regex: name, $options: 'i' };
        }

        if(priceGreaterThan && priceLessThan) {
            query.price = { $gt: parseFloat(priceGreaterThan), $lt: parseFloat(priceLessThan) };
        } else if(priceGreaterThan) {
            query.price = { $gt: parseFloat(priceGreaterThan) };
        } else if(priceLessThan) {
            query.price = { $lt: parseFloat(priceLessThan) };
        }

        let products = await ProductModel.find(query);
        
        if (priceSort) {
            const sortValue = priceSort === "1" ? 1 : -1;
            // products = products.sort({ price: sortValue });
            products = products.sort((a, b) => (a.price - b.price) * sortValue);
        }

        if(products.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No products found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Products fetched successfully",
            data: products
        })

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        })
    }
}




const getProductsById = async (req, res) => {
    try {
        const { productId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid productId"
            });
        }

        const product = await ProductModel.findOne({ _id: productId, isDeleted: false });
        if(!product) {
            return res.status(404).json({
                status: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Product fetched successfully",
            data: product
        });

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        })
    }
}



const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid productId"
            });
        }

        const product = await ProductModel.findOne({ _id: productId, isDeleted: false });
        if(!product) {
            return res.status(404).json({
                status: false,
                message: "Product not found"
            });
        }

        const { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments } = req.body;
        const files = req.files;

        if(files && files.length > 0) {
            const file = files[0];
            const fileUrl = await uploadProductImage(file);
            req.body.productImage = fileUrl;
        }

        if(title) {
            product.title = title || product.title;
        }

        if(description) {
            product.description = description || product.description;
        }

        if(price) {
            product.price = price || product.price;
        }

        // Validation for Products
        if(price) {
            if (price === undefined || isNaN(price) || !isFinite(price)) {
                return res.status(400).json({
                    status: false,
                    message: "Price must be a valid number or decimal."
                });
            }
        }

        if(isFreeShipping) {
            product.isFreeShipping = isFreeShipping || product.isFreeShipping;
        }

        if(style) {
            product.style = style || product.style;
        }

        if(installments) {
            product.installments = installments || product.installments;
        }

        if(currencyId) {
            product.currencyId = currencyId || product.currencyId;
        }

        // Currency Id
        if(currencyId) {
            if(!["INR"].includes(currencyId)) {
                return res.status(400).json({
                    status: false,
                    message: "Currency Id must be INR"
                });
            }
        }

        if(currencyFormat) {
            product.currencyFormat = currencyFormat || product.currencyFormat;
        }

        // Currency Format
        if(currencyFormat) {
            if(!["₹"].includes(currencyFormat)) {
                return res.status(400).json({
                    status: false,
                    message: "Currency Format must be Rupee symbol (₹)."
                });  
            }
        }

        if(availableSizes) {
            product.availableSizes = availableSizes || product.availableSizes;
        }

        if(availableSizes) {
            const validSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];
            const invalidSizes = availableSizes.filter(size => !validSizes.includes(size));
            if (invalidSizes.length > 0) {
                return res.status(400).json({
                    status: false,
                    message: "Available Sizes must be S, XS, M, X, L, XXL, XL."
                });
            }
            if(availableSizes.length < 1) {
                return res.status(400).json({
                    status: false,
                    message: "Please select at least one size."
                });
            }
        }


        const updatedProduct = await ProductModel.findOneAndUpdate(
            { _id: productId, isDeleted: false },
            {
                title,
                description,
                price,
                currencyId,
                currencyFormat,
                isFreeShipping,
                productImage: req.body.productImage,
                style,
                availableSizes,
                installments
            },
            { new: true }
        );

        return res.status(200).json({
            status: true,
            message: "Product updated successfully",
            data: updatedProduct
        });

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
}





const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid productId"
            });
        }

        const product = await ProductModel.findOne({ _id: productId, isDeleted: false });
        if(!product) {
            return res.status(404).json({
                status: false,
                message: "Product not found"
            });
        }

        product.isDeleted = true;
        product.deletedAt = new Date();

        await product.save();

        res.status(200).json({
            status: true,
            message: "Product deleted successfully",
        })
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
}


module.exports = {
    createProduct,
    getProducts,
    getProductsById,
    updateProduct,
    deleteProduct,
}