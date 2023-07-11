const UserModel = require('../models/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { uploadUserProfile } = require('../utils/awsConfig');

/*
POST /register
Create a user document from request body. Request body must contain image.
Upload image to S3 bucket and save it's public url in user document.
Save password in encrypted format. (use bcrypt)
*/
const registerUser = async (req, res) => {
    try {
        const { fname, lname, email, phone, password, address } = req.body;
        const files = req.files;

        // profileImage upload validation
        if(files && files.length > 0) {
            const file = files[0];
            const fileUrl = await uploadUserProfile(file);
            req.body.profileImage = fileUrl;
        } else {
            return res.status(400).json({
                status: false,
                message: "No File Found"
            });
        }
        
        // fname validation 
        if (!fname) {
            return res.status(400).json({
                status: false,
                message: "Please enter first name"
            });
        }

        // lname validation
        if (!lname) {
            return res.status(400).json({
                status: false,
                message: "Please enter last name"
            });
        }

        // email validation
        if (!email) {
            return res.status(400).json({
                status: false,
                message: "Please enter email address"
            });
        }
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: false,
                message: "Please enter a valid email address"
            });
        }
        const emailExists = await UserModel.findOne({ email });
        if(emailExists) {
            return res.status(400).json({
                status: false,
                message: "Email already exists"
            });
        }

        // phone validation
        if (!phone) {
            return res.status(400).json({
                status: false,
                message: "Please enter phone number"
            });
        }
        const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}$/im;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                status: false,
                message: "Please enter a valid phone number"
            });
        }
        const phoneExists = await UserModel.findOne({ phone });
        if(phoneExists) {
            return res.status(400).json({
                status: false,
                message: "Phone number already exists"
            });
        }

        // password validation
        if (!password) {
            return res.status(400).json({
                status: false,
                message: "Please enter password"
            });
        }
        if(password.length < 8 || password.length > 15) {
            return res.status(400).json({
                status: false,
                message: "Password must be between 8 and 15 characters long"
            });
        }
        if(!password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/)) {
            return res.status(400).json({
                status: false,
                message: "Password must contain at least one number, one uppercase and lowercase letter, one special character and one non alphanumeric character"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // address validation
        if (!address) {
            return res.status(400).json({
                status: false,
                message: "Please enter address"
            });
        }

        if(!address.shipping) {
            return res.status(400).json({
                status: false,
                message: "Please enter shipping address"
            });
        }

        if(!address.shipping.street) {
            return res.status(400).json({
                status: false,
                message: "Please enter shipping street address"
            });
        }
        if(!address.shipping.city) {
            return res.status(400).json({
                status: false,
                message: "Please enter shipping city address"
            });
        }
        if(!address.shipping.pincode) {
            return res.status(400).json({
                status: false,
                message: "Please enter shipping pincode address"
            });
        }

        if(!address.billing) {
            return res.status(400).json({
                status: false,
                message: "Please enter billing address"
            });
        }
        if(!address.billing.street) {
            return res.status(400).json({
                status: false,
                message: "Please enter billing street address"
            });
        }
        if(!address.billing.city) {
            return res.status(400).json({
                status: false,
                message: "Please enter billing city address"
            });
        }
        if(!address.billing.pincode) {
            return res.status(400).json({
                status: false,
                message: "Please enter billing pincode address"
            });
        }

        const newUser = await UserModel.create({ 
            fname,
            lname,
            email,
            profileImage: req.body.profileImage,
            phone,
            password: hashedPassword,
            address
         });
        return res.status(201).json({
            status: true,
            message: "User created successfully",
            data: newUser
        })
    } catch(err) {
        res.status(500).json({
            status: false,
            message: err.message
        })
    }
}





/*
POST /login
Allow an user to login with their email and password.
On a successful login attempt return the userId and a JWT token contatining the userId, exp, iat.
NOTE: There is a slight change in response body. You should also return userId in addition to the JWT token.
*/
const loginUser  = async (req, res) => {
    try {
        const { email, password } = req.body;

        // email validation
        if(!email) {
            return res.status(400).json({
                status: false,
                message: "Please enter email address"
            });
        }
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: false,
                message: "Please enter a valid email address"
            });
        }

        // password validation
        if(!password) {
            return res.status(400).json({
                status: false,
                message: "Please enter password"
            });
        }

        const user = await UserModel.findOne({ email });
        if(!user) {
            return res.status(401).json({
                status: false,
                message: "Invalid email or password!!!"
            });
        }

        // compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(400).json({
                status: false,
                message: "Invalid email or password"
            })
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET_KEY, 
            {
                expiresIn: "1d"
            }
        )

        res.setHeader('x-api-key', token);
        
        res.status(200).json({
            status: true,
            message: "User logged in successfully",
            data: {
                userId: user._id,
                token
            }
        })
    } catch (err) {
        res.status(500).json({
            status:false,
            message: err.message
        });
    }
}





/*
GET /user/:userId/profile (Authentication required)
Allow an user to fetch details of their profile.
Make sure that userId in url param and in token is same
*/
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const userIdFromToken = req.userId;
        if(!userId) {
            return res.status(400).json({
                status: false,
                message: "Please enter userId"
            });
        }

        if(!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid userId"
            });
        }

        const user = await UserModel.findById(userId);
        if(!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        // console.log(user._id.toString());
        // console.log(userIdFromToken);
        if(user._id.toString() !== userIdFromToken) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized! You are not the owner of this profile"
            });
        }

        return res.status(200).json({
            status: true,
            message: "User profile details",
            data: user
        })

    } catch(err) {
        res.status(500).json({
            status:false,
            message: err.message
        })
    }
}





/*
PUT /user/:userId/profile (Authentication and Authorization required)
Allow an user to update their profile.
A user can update all the fields
Make sure that userId in url param and in token is same
*/
const updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const userIdFromToken = req.userId;

        if(!userId) {
            return res.status(400).json({
                status: false,
                message: "Please enter userId"
            });
        }
        if(!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid userId"
            });
        }

        const user = await UserModel.findById(userId);
        if(!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        if(user._id.toString() !== userIdFromToken) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized! You are not allowed to update this profile"
            });
        }

        const { fname, lname, email, phone, password, address } = req.body;
        const files = req.files;

        // profileImage upload validation
        if(files && files.length > 0) {
            const file = files[0];
            const fileUrl = await uploadUserProfile(file);
            req.body.profileImage = fileUrl;
        }


        if(email) {
            const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    status: false,
                    message: "Please enter a valid email address"
                });
            }
        }

        if(phone) {
            const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}$/im;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    status: false,
                    message: "Please enter a valid phone number"
                });
            }
            // const phoneExists = await UserModel.findOne({ phone });
            // if(phoneExists) {
            //     return res.status(400).json({
            //         status: false,
            //         message: "Phone number already exists"
            //     });
            // }
        }

        if(password) {
            if(password.length < 8 || password.length > 15) {
                return res.status(400).json({
                    status: false,
                    message: "Password must be between 8 and 15 characters long"
                });
            }
            if(!password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/)) {
                return res.status(400).json({
                    status: false,
                    message: "Password must contain at least one number, one uppercase and lowercase letter, one special character and one non alphanumeric character"
                });
            }

        }

        const salt = await bcrypt.genSalt(10);
        let hashedPassword = "";

        if(password) {
            hashedPassword = await bcrypt.hash(password, salt);
        } else {
            hashedPassword = user.password;
        }

        if(address) {
            req.body.address = address;
        } else {
            req.body.address = user.address;
        }

        if(address.shipping) {
            req.body.address.shipping = address.shipping;
        } else {
            req.body.address.shipping = user.address.shipping;
        }

        if(address.shipping.street) {
            req.body.address.shipping.street = address.shipping.street;
        } else {
            req.body.address.shipping.street = user.address.shipping.street;
        }

        if(address.shipping.city) {
            req.body.address.shipping.city = address.shipping.city;
        } else {
            req.body.address.shipping.city = user.address.shipping.city;
        }

        if(address.shipping.pincode) {
            req.body.address.shipping.pincode = address.shipping.pincode;
        } else {
            req.body.address.shipping.pincode = user.address.shipping.pincode;
        }

        if(address.billing) {
            req.body.address.billing = address.billing;
        } else {
            req.body.address.billing = user.address.billing;
        }

        if(address.billing.street) {
            req.body.address.billing.street = address.billing.street;
        } else {
            req.body.address.billing.street = user.address.billing.street;
        }

        if(address.billing.city) {
            req.body.address.billing.city = address.billing.city;
        } else {
            req.body.address.billing.city = user.address.billing.city;
        }

        if(address.billing.pincode) {
            req.body.address.billing.pincode = address.billing.pincode;
        } else {
            req.body.address.billing.pincode = user.address.billing.pincode;
        }
        


        const updatedUser = await UserModel.findByIdAndUpdate(
            userId, 
            {
                ...req.body,
                profileImage: req.body.profileImage,
                password: hashedPassword,
            },
            { new: true }
        );

        return res.status(200).json({
            status: true,
            message: "User profile updated successfully",
            data: updatedUser
        });

    } catch(err) {
        res.status(500).json({
            status:false,
            message: err.message
        })
    }
}



module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile
}