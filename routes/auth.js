const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc Auth user & get token
// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      capability: user.capability,
      permissions: user.permissions,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

// @desc Register a new user (Admin only)
// @route POST /api/auth/register
router.post('/register', protect, admin, async (req, res) => {
  const { username, password, capability, permissions } = req.body;
  const userExists = await User.findOne({ username });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const user = await User.create({ username, password, capability, permissions });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      capability: user.capability,
      permissions: user.permissions,
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// @desc Get all users (Admin only)
// @route GET /api/auth/users
router.get('/users', protect, admin, async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc Update user profile
// @route PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = req.body.username || user.username;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        capability: updatedUser.capability,
        permissions: updatedUser.permissions,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Username already taken' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// @desc Delete user (Admin only)
// @route DELETE /api/auth/users/:id
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the main admin or self if necessary, but for now just allow it or prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.remove();
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
