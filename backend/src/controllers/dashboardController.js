const {
  getDashboardSummary,
} = require('../services/dashboardService');

const getDashboardSummaryController = async (req, res) => {
  try {
    if (!req.authUser || !req.authUser.id) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user is required',
      });
    }

    const data = await getDashboardSummary(
      req.authUser.id
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      'Dashboard summary error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Unable to load dashboard data',
    });
  }
};

module.exports = {
  getDashboardSummary:
    getDashboardSummaryController,
};