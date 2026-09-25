const express = require('express');

const {
  getDashboardSummary,
} = require('../controllers/dashboardController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/summary', authMiddleware, getDashboardSummary);

module.exports = router;