const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb+srv://dripverse35_db_user:MyPass12345@dripversecluster.jwum2j4.mongodb.net/businessDB?retryWrites=true&w=majority")
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('DB Error:', err));

// SCHEMAS
const userSchema = new mongoose.Schema({ email: { type: String, required: true, unique: true }, password: { type: String, required: true } }, { timestamps: true });
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({ name: { type: String, required: true }, price: { type: Number, required: true }, description: String, category: String, stock: { type: Number, default: 0 }, imageUrl: String }, { timestamps: true });
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({ customerName: { type: String, required: true }, customerPhone: { type: String, required: true }, product: { type: String, required: true }, quantity: { type: Number, required: true }, amount: { type: Number, required: true }, status: { type: String, default: 'Pending' } }, { timestamps: true });
const Order = mongoose.model('Order', orderSchema);

// USER ROUTES
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    await new User({ email, password: hashed }).save();
    res.status(201).json({ message: 'Signup successful' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Wrong password' });
    res.status(200).json({ message: 'Login successful' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// PRODUCT ROUTES
app.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ message: 'Product added', product });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/products', async (req, res) => {
  try {
    const { search, category } = req.query;
    let filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = { $regex: category, $options: 'i' };
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ORDER ROUTES
app.post('/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json({ message: 'Order added', order });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.patch('/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.status(200).json({ message: 'Status updated' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.delete('/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Order deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// STATS ROUTE
app.get('/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
    res.status(200).json({ totalProducts, totalOrders, totalUsers, totalRevenue });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
