const mongoose = require('mongoose');

const importSupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  whatsappNumber: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ImportSupplier', importSupplierSchema);
