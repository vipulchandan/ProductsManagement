const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');

const userRoutes = require('./routes/UserRoute');
const productRoutes = require('./routes/ProductRoute');
const cartRoutes = require('./routes/CartRoute');
const orderRoutes = require('./routes/OrderRoute');

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer middleware
app.use(multer().any());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.log(err);
});

app.get('/', (req, res) => {
    res.json('Welcome To Shopping Cart!');
})

app.use('/api/auth', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`app is listening on port ${PORT}`)
});