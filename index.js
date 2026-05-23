const express = require('express');

// Polyfill for Object.hasOwn to support older Node.js versions (v14)
if (!Object.hasOwn) {
  Object.hasOwn = function(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };
}

const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const metadataRoutes = require('./routes/metadata');
const settingsRoutes = require('./routes/settings');
const uploadRoutes = require('./routes/upload');
const importSupplierRoutes = require('./routes/importSuppliers');
const importRoutes = require('./routes/imports');
const path = require('path');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/importSuppliers', importSupplierRoutes);
app.use('/api/imports', importRoutes);

const __dirname_path = path.resolve();
app.use('/uploads', express.static(path.join(__dirname_path, '/uploads')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
