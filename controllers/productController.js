const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

exports.getProducts = async (req, res, next) => {
  try {
    const { keyword, category, brand, minPrice, maxPrice, rating, inStock, featured, newArrival, dealOfDay, bestSeller, sort, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (keyword) query.$text = { $search: keyword };
    if (category) query.category = category;
    if (brand) query.brand = { $in: brand.split(',') };
    if (minPrice || maxPrice) {
      query.$or = [
        { discountPrice: { $gt: 0, ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) } },
        { $and: [{ discountPrice: 0 }, { price: { ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) } }] },
      ];
    }
    if (rating) query.ratings = { $gte: Number(rating) };
    if (inStock === 'true') query.stock = { $gt: 0 };
    if (featured === 'true') query.isFeatured = true;
    if (newArrival === 'true') query.isNewArrival = true;
    if (dealOfDay === 'true') query.isDealOfDay = true;
    if (bestSeller === 'true') query.isBestSeller = true;

    const sortMap = {
      newest: { createdAt: -1 },
      popular: { numReviews: -1 },
      rating: { ratings: -1 },
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      discount: { discountPrice: -1 },
    };
    const sortBy = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('category', 'name slug').sort(sortBy).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(f => ({
        url: `/uploads/${f.filename}`,
        public_id: f.filename,
      }));
    }
    if (typeof data.specs === 'string') data.specs = JSON.parse(data.specs);
    if (typeof data.tags === 'string') data.tags = data.tags.split(',').map(t => t.trim());
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const data = { ...req.body };
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => ({ url: `/uploads/${f.filename}`, public_id: f.filename }));
      let existing = [];
      if (data.existingImages) {
        existing = typeof data.existingImages === 'string' ? JSON.parse(data.existingImages) : data.existingImages;
      }
      data.images = [...existing, ...newImages];
    }

    if (typeof data.specs === 'string') data.specs = JSON.parse(data.specs);
    if (typeof data.tags === 'string') data.tags = data.tags.split(',').map(t => t.trim());
    delete data.existingImages;

    const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    res.json({ success: true, product: updated });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    // Delete local image files
    product.images.forEach(img => {
      const filePath = path.join(__dirname, '../uploads', img.public_id);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};

exports.getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const products = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    }).limit(8);
    res.json({ success: true, products });
  } catch (err) { next(err); }
};

exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.json({ success: true, brands: brands.sort() });
  } catch (err) { next(err); }
};

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const images = req.files.map(f => ({ url: `/uploads/${f.filename}`, public_id: f.filename }));
    res.json({ success: true, images });
  } catch (err) { next(err); }
};