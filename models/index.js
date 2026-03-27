const mongoose = require('mongoose');

// ── Coupon ────────────────────────────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:           { type: String, enum: ['percentage', 'flat'], required: true },
  value:          { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount:    { type: Number, default: 0 },
  expiryDate:     { type: Date,   required: true },
  usageLimit:     { type: Number, default: 100 },
  usageCount:     { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true });

couponSchema.methods.isValid = function () {
  return this.isActive &&
         this.expiryDate > new Date() &&
         this.usageCount < this.usageLimit;
};

couponSchema.methods.calculateDiscount = function (orderAmount) {
  if (orderAmount < this.minOrderAmount) return 0;
  if (this.type === 'percentage') {
    const disc = (orderAmount * this.value) / 100;
    return this.maxDiscount > 0 ? Math.min(disc, this.maxDiscount) : disc;
  }
  return Math.min(this.value, orderAmount);
};

// ── Cart ──────────────────────────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price:    { type: Number, required: true },
});

const cartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
}, { timestamps: true });

// ── Wishlist ──────────────────────────────────────────────────────────────────
const wishlistSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

// ── Exports ───────────────────────────────────────────────────────────────────
const Coupon   = mongoose.model('Coupon',   couponSchema);
const Cart     = mongoose.model('Cart',     cartSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = { Coupon, Cart, Wishlist };