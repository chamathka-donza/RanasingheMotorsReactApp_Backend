const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  modelNumber: { type: String, required: true, unique: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  description: { type: String },
  manufactureCountry: { type: String },
  teethQuantity: { type: String },
  size: { type: String },
  engineModel: { type: String },
  vehicle: { type: String },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  sellingPrice: { type: String, required: true }, // Alphabetical code
  buyingPrice: { type: String, required: true },  // Alphabetical code
  orderQuantity: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  isRack: { type: Boolean, default: false },
  image: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
