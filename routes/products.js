const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin, hasPermission } = require('../middleware/auth');
const ExcelJS = require('exceljs');

// @desc Download product template with dropdowns
// @route GET /api/products/template
router.get('/template', protect, hasPermission('product_add'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Products');
    const dataSheet = workbook.addWorksheet('MetadataLists');
    dataSheet.state = 'hidden';

    // Fetch metadata for dropdowns
    const [brands, locations, suppliers] = await Promise.all([
      Brand.find({}),
      Location.find({}),
      Supplier.find({})
    ]);

    // Populate metadata sheet
    brands.forEach((b, i) => dataSheet.getCell(`A${i + 1}`).value = b.name);
    locations.forEach((l, i) => dataSheet.getCell(`B${i + 1}`).value = l.name);
    suppliers.forEach((s, i) => dataSheet.getCell(`C${i + 1}`).value = s.name);

    // Headers
    const headers = [
      'ModelNumber', 'Brand', 'Description', 'ManufactureCountry', 
      'TeethQuantity', 'Size', 'EngineModel', 'Vehicle', 
      'Location', 'Vendor', 'SellingPrice', 'BuyingPrice', 
      'Quantity', 'OrderQuantity', 'IsRack'
    ];
    sheet.addRow(headers);

    // Add Data Validation (Dropdowns)
    for (let i = 2; i <= 100; i++) { // Apply to first 100 rows
      sheet.getCell(`B${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`MetadataLists!$A$1:$A$${brands.length || 1}`]
      };
      sheet.getCell(`I${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`MetadataLists!$B$1:$B$${locations.length || 1}`]
      };
      sheet.getCell(`J${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`MetadataLists!$C$1:$C$${suppliers.length || 1}`]
      };
      sheet.getCell(`O${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"true,false"']
      };
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product_template.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc Get all products
// @route GET /api/products
router.get('/', protect, hasPermission('product_view'), async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('brand', 'name')
      .populate('location', 'name')
      .populate('vendor', 'name');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc Get product notifications (low stock)
// @route GET /api/products/notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$quantity', '$orderQuantity'] }
    })
    .populate('brand', 'name')
    .populate('location', 'name')
    .populate('vendor', 'name');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc Create a product
// @route POST /api/products
router.post('/', protect, hasPermission('product_add'), async (req, res) => {
  try {
    const product = new Product(req.body);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Update a product
// @route PUT /api/products/:id
router.put('/:id', protect, hasPermission('product_update'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      Object.assign(product, req.body);
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete a product
// @route DELETE /api/products/:id
router.delete('/:id', protect, hasPermission('product_delete'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.remove();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const multer = require('multer');
const xlsx = require('xlsx');
const { Brand, Location, Supplier } = require('../models/Metadata');

const upload = multer({ dest: 'uploads/' });

// @desc Upload products via Excel
// @route POST /api/products/upload
router.post('/upload', protect, hasPermission('product_add'), upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (const row of data) {
      // Look up references by name
      const [brand, location, vendor] = await Promise.all([
        Brand.findOne({ name: row.Brand }),
        Location.findOne({ name: row.Location }),
        Supplier.findOne({ name: row.Supplier || row.Vendor })
      ]);

      if (!brand || !location || !vendor) {
        console.warn(`Skipping row ${row.ModelNumber}: Missing metadata reference`);
        continue;
      }

      const productData = {
        modelNumber: row.ModelNumber,
        brand: brand._id,
        description: row.Description,
        manufactureCountry: row.ManufactureCountry,
        teethQuantity: row.TeethQuantity,
        size: row.Size,
        engineModel: row.EngineModel,
        vehicle: row.Vehicle,
        location: location._id,
        vendor: vendor._id,
        sellingPrice: String(row.SellingPrice),
        buyingPrice: String(row.BuyingPrice),
        orderQuantity: Number(row.OrderQuantity || 0),
        quantity: Number(row.Quantity || 0),
        isRack: row.IsRack === 'true' || row.IsRack === true,
      };

      await Product.findOneAndUpdate(
        { modelNumber: row.ModelNumber },
        productData,
        { upsert: true, new: true }
      );
    }
    res.json({ message: 'Products uploaded successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
