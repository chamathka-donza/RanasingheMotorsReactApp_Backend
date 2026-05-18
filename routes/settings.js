const express = require('express');
const router = express.Router();
const { Settings } = require('../models/Metadata');
const { protect, admin } = require('../middleware/auth');

// @desc Get shop settings
// @route GET /api/settings
router.get('/', async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  res.json(settings);
});

// @desc Update shop settings
// @route PUT /api/settings
router.put('/', protect, admin, async (req, res) => {
  let settings = await Settings.findOne();
  if (settings) {
    Object.assign(settings, req.body);
    const updated = await settings.save();
    res.json(updated);
  } else {
    const created = await Settings.create(req.body);
    res.json(created);
  }
});

module.exports = router;
