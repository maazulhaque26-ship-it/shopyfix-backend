const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'HomeKitchen' },
  storeTagline: { type: String, default: 'Your one-stop destination for home & kitchen appliances' },
  storeAddress: { type: String, default: '' },
  copyrightText: { type: String, default: '© 2024 HomeKitchen. All rights reserved.' },
  maintenanceMode: { type: Boolean, default: false },
  phone: { type: String, default: '1800-123-4567' },
  email: { type: String, default: 'support@homekitchen.com' },
  fullAddress: { type: String, default: '' },
  facebook: { type: String, default: '' },
  twitter: { type: String, default: '' },
  instagram: { type: String, default: '' },
  youtube: { type: String, default: '' },
  currency: { type: String, default: '₹' },
  freeShippingAbove: { type: Number, default: 500 },
  taxRate: { type: Number, default: 18 },
  metaTitle: { type: String, default: 'HomeKitchen - Best Appliances Online' },
  metaDescription: { type: String, default: 'Shop best home appliances at lowest prices' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);