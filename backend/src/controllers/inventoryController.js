const {
  getInventory: getInventoryService,
  importInventoryExcel,
} = require('../services/inventoryService');

const getInventory = async (req, res) => {
  try {
    if (!req.authUser?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await getInventoryService(
      req.authUser.id,
      {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
      }
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      'Get inventory error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Unable to load inventory',
    });
  }
};

const uploadInventory = async (req, res) => {
  try {
    if (!req.authUser?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is required',
      });
    }

    const result = await importInventoryExcel(
      req.authUser.id,
      req.file.buffer
    );

    return res.status(200).json({
      success: true,
      message: 'Inventory Excel processed successfully',
      data: result,
    });
  } catch (error) {
    console.error(
      'Inventory upload error:',
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        'Unable to import inventory',
    });
  }
};

module.exports = {
  getInventory,
  uploadInventory,
};