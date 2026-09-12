const dotEnv = require('dotenv');
dotEnv.config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const { connectDB } = require('./config/db.config');
const AppError = require('./utilities/appError.util');
const path = require('path');

app.use(require('./middlewares/cors.middleware'));
connectDB();

app.use(express.json());
app.use('/files', express.static(path.join(__dirname, 'uploads')));
app.use('/api/v1/auth', require('./routes/auth.route'));
app.use('/api/v1/user', require('./routes/user.route'));
app.use('/api/v1/category', require('./routes/category.route'));
app.use('/api/v1/subcategory', require('./routes/subcategory.route'));
app.use('/api/v1/product', require('./routes/product.route'));
app.use('/api/v1/cart', require('./routes/cart.route'));
app.use('/api/v1/order', require('./routes/order.route'));
app.use('/api/v1/testimonials', require('./routes/testimonials.route'));
app.use('/api/v1/report', require('./routes/report.route'));

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use(require('./middlewares/errorHandler.middleware'));
app.listen(port, (_) => console.log(`Server started  at port: ${port}`));
