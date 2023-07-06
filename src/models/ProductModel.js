const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String, 
        required: true,
        unique: true,
    },
    description: {
        type: String, 
        required: true,
    },
    price: {
        type: Number, 
        required: true,
        validate: {
            validator: (price) => {
                return !isNaN(price) && isFinite(price);
            },
            message: "Price must be a valid number or decimal.",
        }
    },
    currencyId: {
        type: String, 
        required: true,
        enum: ['INR']
    },
    currencyFormat: {
        type: String,
        required: true,
        validate: {
            validator: (currencyFormat) => {
                return /^₹/.test(currencyFormat);
            },
            message: "Currency format must start with the Rupee symbol (₹).",
        }
    },
    isFreeShipping: {
        type: Boolean, 
        default: false,
    },
    productImage: {
        type: String,
        required: true,
    },
    style: {
        type: String,
    },
    availableSizes: {
        type: [
            {
                type: String,
                enum: ["S", "XS", "M", "X", "L", "XXL", "XL"],
            }
        ],
        required: true,
        validate: {
            validator: (sizes) => {
                return sizes.length > 0;
            },
            message: "Please select at least one size.",
        }
    },
    installments: {
        type: Number,
    },
    deletedAt: {
        type: Date, 
        default: null
    },
    isDeleted: {
        type: Boolean, 
        default: false,
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);