const mongoose = require('mongoose');

const importSchema = new mongoose.Schema({
  orderDate: { type: Date },
  items: { type: String, required: true },
  quantity: { type: Number },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportSupplier' },
  yNumber: { type: String },
  cashPaidAmount: { type: String },
  isCashPaid: { type: Boolean, default: false },
  isGoodsArrived: { type: Boolean, default: false },
  arrivedDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Import', importSchema);
