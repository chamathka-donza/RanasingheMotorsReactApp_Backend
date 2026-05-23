const express = require('express');
const router = express.Router();
const ImportSupplier = require('../models/ImportSupplier');
const { protect, hasPermission } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const xlsx = require('xlsx');
const fs = require('fs');

// @desc Download import supplier template
// @route GET /api/importSuppliers/template
router.get('/template', protect, hasPermission('importSupplier_add'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ImportSuppliers');
    const headers = ['Name', 'Email', 'WhatsappNumber'];
    sheet.addRow(headers);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=import_suppliers_template.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc Upload import suppliers from Excel
// @route POST /api/importSuppliers/upload
router.post('/upload', protect, hasPermission('importSupplier_add'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (let row of data) {
      if (row.Name) {
        await ImportSupplier.create({
          name: row.Name,
          email: row.Email || '',
          whatsappNumber: row.WhatsappNumber || ''
        });
      }
    }

    fs.unlinkSync(req.file.path); // clean up file
    res.json({ message: 'Suppliers uploaded successfully' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error.message });
  }
});

// @desc Get all import suppliers
// @route GET /api/importSuppliers
router.get('/', protect, hasPermission('importSupplier_view'), async (req, res) => {
  try {
    const suppliers = await ImportSupplier.find({});
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc Create import supplier
// @route POST /api/importSuppliers
router.post('/', protect, hasPermission('importSupplier_add'), async (req, res) => {
  try {
    const supplier = await ImportSupplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Update import supplier
// @route PUT /api/importSuppliers/:id
router.put('/:id', protect, hasPermission('importSupplier_update'), async (req, res) => {
  try {
    const supplier = await ImportSupplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (supplier) {
      res.json(supplier);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete import supplier
// @route DELETE /api/importSuppliers/:id
router.delete('/:id', protect, hasPermission('importSupplier_delete'), async (req, res) => {
  try {
    const supplier = await ImportSupplier.findByIdAndDelete(req.params.id);
    if (supplier) {
      res.json({ message: 'Supplier removed' });
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
