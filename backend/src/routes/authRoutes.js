const express = require('express');

const {
  register,
  login,
  logout,
  getCurrentUser,
} = require('../controllers/authController');

const uploadLicense = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', uploadLicense, register);

router.post('/login', login);

router.post('/logout', authMiddleware, logout);

router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;