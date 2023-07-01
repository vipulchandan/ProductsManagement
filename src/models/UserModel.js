const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fname: {
        type: String, 
        required: true,
    },
    lname: {
        type: String, 
        required: true,    
    },
    email: {
        type: String, 
        required: true, 
        unique: true,
        validate: {
            validator: (email) => {
                const emailRegex =  /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
                return emailRegex.test(email);
            },
            message: "Please enter a valid email address",
        }
    },
    profileImage: {
        type: String, 
        required: true,
    }, // s3 link
    phone: {
        type: String, 
        required: true,
        unique: true, 
        validate: {
            validator: (phone) => {
                const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
                // const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
                return phoneRegex.test(phone);
            },
            message: "Please enter a valid phone number",
        }
    }, 
    password: {
        type: String, 
        required: true, 
        // minlength: 8,
        // maxlength: 15
    }, // encrypted password
    address: {
        shipping: {
            street: {
                type: String, 
                required: true,
            },
            city: {
                type: String, 
                required: true,
            },
            pincode: {
                type: Number, 
                required: true,
            }
        },
        billing: {
            street: {
                type: String,
                required: true, 
            },
            city: {
                type: String, 
                required: true,
            },
            pincode: {
                type: Number, 
                required: true,
            }
        }
    },
}, { timestamps: true });

module.exports = mongoose.model('user', userSchema);