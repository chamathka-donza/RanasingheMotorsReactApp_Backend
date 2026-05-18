const express = require('express');
const router = express.Router();
const { Brand, Location, Supplier } = require('../models/Metadata');
const { protect, admin, hasPermission } = require('../middleware/auth');
const multer = require('multer');
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');

// @desc Download metadata template
// @route GET /api/metadata/:path/template
router.get('/:path/template', protect, async (req, res, next) => {
  const entity = req.params.path.slice(0, -1);
  hasPermission(`${entity}_add`)(req, res, next);
}, async (req, res) => {
  try {
    const { path } = req.params;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(path.toUpperCase());
    
    let headers = [];
    if (path === 'brands') headers = ['name', 'description'];
    else if (path === 'locations') headers = ['name', 'address'];
    else if (path === 'suppliers') headers = ['name', 'contactNo'];
    
    sheet.addRow(headers);
    
    // Format contactNo column as text to preserve leading zeros
    if (path === 'suppliers') {
      sheet.getColumn('B').numFmt = '@';
      // Explicitly format the first 100 rows to ensure Excel respects it
      for (let i = 2; i <= 100; i++) {
        sheet.getCell(`B${i}`).numFmt = '@';
      }
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${path}_template.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const upload = multer({ dest: 'uploads/' });

// Generic CRUD helper
const createMetadataRoutes = (Model, path) => {
  const entity = path.slice(0, -1);

  router.get(`/${path}`, protect, hasPermission(`${entity}_view`), async (req, res) => {
    const items = await Model.find({});
    res.json(items);
  });

  router.post(`/${path}`, protect, hasPermission(`${entity}_add`), async (req, res) => {
    try {
      const item = new Model(req.body);
      const created = await item.save();
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  router.put(`/${path}/:id`, protect, hasPermission(`${entity}_update`), async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (item) {
      Object.assign(item, req.body);
      const updated = await item.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  });

  router.delete(`/${path}/:id`, protect, hasPermission(`${entity}_delete`), async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (item) {
      await item.remove();
      res.json({ message: 'Item removed' });
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  });

  // Excel Upload
  router.post(`/${path}/upload`, protect, hasPermission(`${entity}_add`), upload.single('file'), async (req, res) => {
    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      for (const row of data) {
        // Simple logic: update if exists (by name), else create
        const filter = { name: row.name || row.Name };
        if (filter.name) {
          await Model.findOneAndUpdate(filter, row, { upsert: true, new: true });
        }
      }
      res.json({ message: 'Upload successful' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
};

createMetadataRoutes(Brand, 'brands');
createMetadataRoutes(Location, 'locations');
createMetadataRoutes(Supplier, 'suppliers');

module.exports = router;
