const express = require('express');

const {
  getInventory,
  uploadInventory,
} = require('../controllers/inventoryController');

const authMiddleware = require('../middleware/authMiddleware');
const uploadInventoryFile = require('../middleware/inventoryUploadMiddleware');

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  getInventory
);

router.post(
  '/upload',
  authMiddleware,
  uploadInventoryFile.single('file'),
  uploadInventory
);

module.exports = router;