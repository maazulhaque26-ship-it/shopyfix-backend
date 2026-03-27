const express = require('express');
const router = express.Router();

const { protect, admin, optionalAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const auth = require('../controllers/authController');
const product = require('../controllers/productController');
const order = require('../controllers/orderController');
const ctrl = require('../controllers/controllers');

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', protect, auth.getMe);
router.put('/auth/profile', protect, auth.updateProfile);
router.put('/auth/password', protect, auth.changePassword);
router.post('/auth/addresses', protect, auth.addAddress);
router.put('/auth/addresses/:addressId', protect, auth.updateAddress);
router.delete('/auth/addresses/:addressId', protect, auth.deleteAddress);

// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/products', product.getProducts);
router.get('/products/brands', product.getBrands);
router.get('/products/slug/:slug', product.getProductBySlug);
router.get('/products/id/:id', product.getProductById);
router.get('/products/:id/related', product.getRelatedProducts);
router.post('/products', protect, admin, upload.array('images', 10), product.createProduct);
router.put('/products/:id', protect, admin, upload.array('images', 10), product.updateProduct);
router.delete('/products/:id', protect, admin, product.deleteProduct);

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', ctrl.getCategories);
router.get('/categories/:slug', ctrl.getCategoryBySlug);
router.post('/categories', protect, admin, ctrl.createCategory);
router.put('/categories/:id', protect, admin, ctrl.updateCategory);
router.delete('/categories/:id', protect, admin, ctrl.deleteCategory);

// ─── Cart ─────────────────────────────────────────────────────────────────────
router.get('/cart', protect, ctrl.getCart);
router.post('/cart', protect, ctrl.addToCart);
router.put('/cart/:itemId', protect, ctrl.updateCartItem);
router.delete('/cart/:itemId', protect, ctrl.removeFromCart);
router.delete('/cart', protect, ctrl.clearCart);

// ─── Wishlist ─────────────────────────────────────────────────────────────────
router.get('/wishlist', protect, ctrl.getWishlist);
router.post('/wishlist', protect, ctrl.toggleWishlist);

// ─── Reviews ─────────────────────────────────────────────────────────────────
router.get('/products/:productId/reviews', ctrl.getProductReviews);
router.post('/products/:productId/reviews', protect, ctrl.addReview);
router.delete('/reviews/:id', protect, ctrl.deleteReview);

// ─── Orders ───────────────────────────────────────────────────────────────────
router.post('/orders', protect, order.createOrder);
router.get('/orders/my-orders', protect, order.getMyOrders);
router.get('/orders/:id', protect, order.getOrderById);
router.put('/orders/:id/cancel', protect, order.cancelOrder);

// ─── Coupons ──────────────────────────────────────────────────────────────────
router.post('/coupons/validate', protect, ctrl.validateCoupon);
router.get('/admin/coupons', protect, admin, ctrl.getCoupons);
router.post('/admin/coupons', protect, admin, ctrl.createCoupon);
router.put('/admin/coupons/:id', protect, admin, ctrl.updateCoupon);
router.delete('/admin/coupons/:id', protect, admin, ctrl.deleteCoupon);

// ─── Stripe Payment ───────────────────────────────────────────────────────────
router.post('/payment/create-intent', protect, ctrl.createPaymentIntent);

// ─── Admin: Orders ────────────────────────────────────────────────────────────
router.get('/admin/orders', protect, admin, order.getAllOrders);
router.put('/admin/orders/:id/status', protect, admin, order.updateOrderStatus);

// ─── Admin: Stats ─────────────────────────────────────────────────────────────
router.get('/admin/stats', protect, admin, order.getDashboardStats);

// ─── Admin: Users ─────────────────────────────────────────────────────────────
router.get('/admin/users', protect, admin, ctrl.getAdminUsers);
router.put('/admin/users/:id/toggle', protect, admin, ctrl.toggleUserStatus);

// ─── Admin: Reviews ───────────────────────────────────────────────────────────
router.get('/admin/reviews', protect, admin, ctrl.getAllReviews);

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get('/settings', ctrl.getSettings);
router.put('/admin/settings', protect, admin, ctrl.updateSettings);

// ─── Newsletter Subscribers ───────────────────────────────────────────────────
const sub = require('../controllers/subscriberController');
router.post('/newsletter/subscribe',           sub.subscribe);
router.get('/admin/subscribers',               protect, admin, sub.getSubscribers);
router.get('/admin/subscribers/export',        protect, admin, sub.exportSubscribers);
router.delete('/admin/subscribers/:id',        protect, admin, sub.deleteSubscriber);

// ─── Image Upload ─────────────────────────────────────────────────────────────
router.post('/upload', protect, admin, upload.single('image'), ctrl.uploadImage);

module.exports = router;