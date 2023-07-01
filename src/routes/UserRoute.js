const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile 
} = require('../controllers/UserController');
const { auth } = require('../middlewares/auth');

router.get('/test', (req, res) => {
    res.send('Welcome To Shopping Cart!');
});

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/user/:userId/profile', auth, getUserProfile);
router.put('/user/:userId/profile', auth, updateUserProfile);

module.exports = router;