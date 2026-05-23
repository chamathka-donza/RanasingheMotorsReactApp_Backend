const express = require('express');
const router = express.Router();
const Import = require('../models/Import');
const ImportSupplier = require('../models/ImportSupplier');
const { protect, hasPermission } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const xlsx = require('xlsx');
const fs = require('fs');

// @desc Download import template with dropdowns
// @route GET /api/imports/template
router.get('/template', protect, hasPermission('import_add'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Imports');
    const dataSheet = workbook.addWorksheet('MetadataLists');
    dataSheet.state = 'hidden';

    // Fetch suppliers for dropdown
    const suppliers = await ImportSupplier.find({});
    suppliers.forEach((s, i) => dataSheet.getCell(`A${i + 1}`).value = s.name);

    const headers = [
      'OrderDate', 'Items', 'Quantity', 'Supplier', 'YNumber', 
      'CashPaidAmount', 'IsCashPaid', 'IsGoodsArrived', 'ArrivedDate'
    ];
    sheet.addRow(headers);

    for (let i = 2; i <= 100; i++) {
      sheet.getCell(`D${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`MetadataLists!$A$1:$A$${suppliers.length || 1}`]
      };
      sheet.getCell(`G${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"true,false"'] };
      sheet.getCell(`H${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"true,false"'] };
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=imports_template.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc Upload imports from Excel
// @route POST /api/imports/upload
router.post('/upload', protect, hasPermission('import_add'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (let row of data) {
      if (row.Items) {
        let supplierId = null;
        if (row.Supplier) {
          const supplier = await ImportSupplier.findOne({ name: row.Supplier });
          if (supplier) supplierId = supplier._id;
        }

        const isCashPaid = String(row.IsCashPaid).toLowerCase() === 'true';
        const isGoodsArrived = String(row.IsGoodsArrived).toLowerCase() === 'true';
        
        let orderDate = row.OrderDate;
        if (orderDate && !isNaN(orderDate)) {
           orderDate = new Date(Math.round((orderDate - 25569) * 86400 * 1000));
        }
        
        let arrivedDate = row.ArrivedDate;
        if (arrivedDate && !isNaN(arrivedDate)) {
           arrivedDate = new Date(Math.round((arrivedDate - 25569) * 86400 * 1000));
        }

        await Import.create({
          orderDate: orderDate || null,
          items: row.Items,
          quantity: row.Quantity || 0,
          supplier: supplierId,
          yNumber: row.YNumber || '',
          cashPaidAmount: row.CashPaidAmount ? String(row.CashPaidAmount) : '',
          isCashPaid,
          isGoodsArrived,
          arrivedDate: arrivedDate || null
        });
      }
    }

    fs.unlinkSync(req.file.path);
    res.json({ message: 'Imports uploaded successfully' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error.message });
  }
});

// @desc Get all imports
// @route GET /api/imports
router.get('/', protect, hasPermission('import_view'), async (req, res) => {
  try {
    const imports = await Import.find({}).populate('supplier', 'name email whatsappNumber');
    res.json(imports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc Create import
// @route POST /api/imports
router.post('/', protect, hasPermission('import_add'), async (req, res) => {
  try {
    const newImport = await Import.create(req.body);
    res.status(201).json(newImport);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Update import (can be used for full update or just toggles)
// @route PUT /api/imports/:id
router.put('/:id', protect, hasPermission('import_update'), async (req, res) => {
  try {
    const updatedImport = await Import.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedImport) {
      res.json(updatedImport);
    } else {
      res.status(404).json({ message: 'Import not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete import
// @route DELETE /api/imports/:id
router.delete('/:id', protect, hasPermission('import_delete'), async (req, res) => {
  try {
    const deletedImport = await Import.findByIdAndDelete(req.params.id);
    if (deletedImport) {
      res.json({ message: 'Import removed' });
    } else {
      res.status(404).json({ message: 'Import not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
