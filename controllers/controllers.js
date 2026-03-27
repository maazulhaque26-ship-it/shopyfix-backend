const Product  = require('../models/Product');
const Category = require('../models/Category');
const User     = require('../models/User');
const Review   = require('../models/Review');
const Settings = require('../models/Settings');
const { Cart, Wishlist, Coupon } = require('../models/index');

// ─── Cart ─────────────────────────────────────────────────────────────────────
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name images price discountPrice stock isActive slug');
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive)
      return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < quantity)
      return res.status(400).json({ success: false, message: 'Insufficient stock' });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });

    const price    = product.discountPrice > 0 ? product.discountPrice : product.price;
    const existing = cart.items.find(i => i.product.toString() === productId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock);
      existing.price    = price;
    } else {
      cart.items.push({ product: productId, quantity, price });
    }

    await cart.save();
    cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name images price discountPrice stock isActive slug');
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.find(i => i._id.toString() === req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    } else {
      item.quantity = quantity;
    }
    await cart.save();
    cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name images price discountPrice stock isActive slug');
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    await cart.save();
    cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name images price discountPrice stock isActive slug');
    res.json({ success: true, cart });
  } catch (err) { next(err); }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products', 'name images price discountPrice ratings numReviews stock slug isActive');
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    res.json({ success: true, wishlist });
  } catch (err) { next(err); }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user.id, products: [] });

    const idx = wishlist.products.findIndex(p => p.toString() === productId);
    if (idx > -1) wishlist.products.splice(idx, 1);
    else wishlist.products.push(productId);

    await wishlist.save();
    wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products', 'name images price discountPrice ratings numReviews stock slug isActive');
    res.json({ success: true, wishlist });
  } catch (err) { next(err); }
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar').sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) { next(err); }
};

exports.addReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;
    const existing = await Review.findOne({ user: req.user.id, product: req.params.productId });
    if (existing)
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    const review = await Review.create({ user: req.user.id, product: req.params.productId, rating, title, comment });
    await review.populate('user', 'name avatar');
    res.status(201).json({ success: true, review });
  } catch (err) { next(err); }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
};

exports.getAllReviews = async (req, res, next) => {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 20;
    const [reviews, total] = await Promise.all([
      Review.find().populate('user','name').populate('product','name').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
      Review.countDocuments(),
    ]);
    res.json({ success: true, reviews, total, page, pages: Math.ceil(total/limit) });
  } catch (err) { next(err); }
};

// ─── Categories ───────────────────────────────────────────────────────────────
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) { next(err); }
};

exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};

// ─── Coupons ──────────────────────────────────────────────────────────────────
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon || !coupon.isValid())
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
    if (orderAmount < coupon.minOrderAmount)
      return res.status(400).json({ success: false, message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}` });
    const discount = coupon.calculateDiscount(orderAmount);
    res.json({ success: true, discount, coupon: { code: coupon.code, type: coupon.type, value: coupon.value } });
  } catch (err) { next(err); }
};

exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) { next(err); }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) { next(err); }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, coupon });
  } catch (err) { next(err); }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { next(err); }
};

// ─── Stripe Payment Intent ────────────────────────────────────────────────────
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const key = process.env.STRIPE_SECRET_KEY;

    // Validate Stripe key before attempting
    if (!key) {
      return res.status(400).json({ success: false, message: 'Stripe secret key is not configured on the server. Add STRIPE_SECRET_KEY to backend/.env' });
    }
    if (!key.startsWith('sk_')) {
      return res.status(400).json({ success: false, message: 'Invalid Stripe secret key format. It must start with sk_test_ or sk_live_' });
    }

    // Lazy-load Stripe — env vars guaranteed available here
    const stripe = require('stripe')(key);

    const { amount } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(Number(amount) * 100), // ₹ to paise
      currency: 'inr',
      metadata: { userId: req.user.id.toString() },
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });

    res.json({
      success:         true,
      clientSecret:    paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('Stripe createPaymentIntent error:', err.message);
    // Return specific Stripe error messages to frontend
    if (err.type === 'StripeAuthenticationError') {
      return res.status(400).json({ success: false, message: 'Invalid Stripe API key. Please check your backend/.env file.' });
    }
    if (err.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ success: false, message: `Stripe error: ${err.message}` });
    }
    next(err);
  }
};

// ─── Admin: Users ─────────────────────────────────────────────────────────────
exports.getAdminUsers = async (req, res, next) => {
  try {
    const page   = Number(req.query.page)  || 1;
    const limit  = Number(req.query.limit) || 20;
    const search = req.query.search || '';
    const filter = { role: 'user' };
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, users, total, page, pages: Math.ceil(total/limit) });
  } catch (err) { next(err); }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// ─── Settings ─────────────────────────────────────────────────────────────────
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ success: true, settings });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create(req.body);
    else { Object.assign(settings, req.body); await settings.save(); }
    res.json({ success: true, settings });
  } catch (err) { next(err); }
};

// ─── Image Upload ─────────────────────────────────────────────────────────────
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({ success: true, image: { url: `/uploads/${req.file.filename}`, public_id: req.file.filename } });
  } catch (err) { next(err); }
};