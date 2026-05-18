const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String }
}, { timestamps: true });

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  address: { type: String, required: true }
}, { timestamps: true });

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  contactNo: { type: String, required: true }
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
  shopName: { type: String, default: 'Ranasinghe Motors' },
  address: { type: String, default: 'No-01, Colombo 4, Panchikawatta, Sri Lanka' },
  contact: { type: String, default: '0714100525' },
  email: { type: String, default: 'abc123@gmail.com' }
}, { timestamps: true });

module.exports = {
  Brand: mongoose.model('Brand', brandSchema),
  Location: mongoose.model('Location', locationSchema),
  Supplier: mongoose.model('Supplier', supplierSchema),
  Settings: mongoose.model('Settings', settingsSchema)
};
