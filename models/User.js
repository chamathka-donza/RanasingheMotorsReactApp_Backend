const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  capability: { type: String, enum: ['admin', 'normal'], default: 'normal' },
  permissions: {
    product_view: { type: Boolean, default: false },
    product_add: { type: Boolean, default: false },
    product_update: { type: Boolean, default: false },
    product_delete: { type: Boolean, default: false },
    brand_view: { type: Boolean, default: false },
    brand_add: { type: Boolean, default: false },
    brand_update: { type: Boolean, default: false },
    brand_delete: { type: Boolean, default: false },
    location_view: { type: Boolean, default: false },
    location_add: { type: Boolean, default: false },
    location_update: { type: Boolean, default: false },
    location_delete: { type: Boolean, default: false },
    supplier_view: { type: Boolean, default: false },
    supplier_add: { type: Boolean, default: false },
    supplier_update: { type: Boolean, default: false },
    supplier_delete: { type: Boolean, default: false },
    import_view: { type: Boolean, default: false },
    import_add: { type: Boolean, default: false },
    import_update: { type: Boolean, default: false },
    import_delete: { type: Boolean, default: false },
    importSupplier_view: { type: Boolean, default: false },
    importSupplier_add: { type: Boolean, default: false },
    importSupplier_update: { type: Boolean, default: false },
    importSupplier_delete: { type: Boolean, default: false },
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
