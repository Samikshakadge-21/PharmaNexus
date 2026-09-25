const XLSX = require('xlsx');

const supabase = require('../config/supabase');

// GET PHARMAID

const getPharmacyId = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('pharmacy_id')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(
      `Unable to load user profile: ${error.message}`
    );
  }

  if (!data?.pharmacy_id) {
    throw new Error(
      'No pharmacy is associated with this account'
    );
  }

  return data.pharmacy_id;
};

// HEADER NORMALIZATION

const normalizeHeader = (header) => {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-\/]+/g, '_')
    .replace(/[()]/g, '')
    .replace(/_+/g, '_');
};

// NUMBER PARSER

const parseNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const number = Number(
    String(value).replace(/,/g, '').trim()
  );

  return Number.isFinite(number) ? number : null;
};

// BOOLEAN PARSER

const parseBoolean = (value) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value)
    .trim()
    .toLowerCase();

  if (['true', 'yes', 'y', '1'].includes(normalized)) {
    return true;
  }

  if (['false', 'no', 'n', '0'].includes(normalized)) {
    return false;
  }

  return null;
};

// DATE PARSER EXCEL

const parseExcelDate = (value) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }

  /* Excel serial date */
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);

    if (!date) {
      return null;
    }

    return `${String(date.y).padStart(4, '0')}-${String(
      date.m
    ).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }

  const raw = String(value).trim();

  /* YYYY-MM-DD */
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(raw)) {
    const [year, month, day] = raw.split('-');

    return `${year}-${String(month).padStart(
      2,
      '0'
    )}-${String(day).padStart(2, '0')}`;
  }

  /* DD/MM/YYYY or DD-MM-YYYY */
  const indianDate = raw.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
  );

  if (indianDate) {
    const [, day, month, year] = indianDate;

    return `${year}-${String(month).padStart(
      2,
      '0'
    )}-${String(day).padStart(2, '0')}`;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().split('T')[0];
};

// REQUIRED ATTRIBUTES

const REQUIRED_COLUMNS = [
  'medicine_name',
  'generic_name',
  'sku_code',
  'category',
  'strength',
  'dosage_form',
  'manufacturer',
  'batch_number',
  'quantity',
  'manufacturing_date',
  'expiry_date',
  'purchase_price',
  'selling_price',
  'reorder_level',
];

// OPTIONAL ATTRIBUTES

const OPTIONAL_COLUMNS = [
  'unit_of_measure',
  'prescription_required',
  'storage_location',
  'supplier_name',
  'discount_percent',
  'tax_code_hsn',
];

// READ EXCEL

const parseExcelRows = (buffer) => {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: false,
  });

  if (!workbook.SheetNames.length) {
    throw new Error(
      'The Excel file does not contain any worksheet'
    );
  }

  const firstSheet =
    workbook.Sheets[workbook.SheetNames[0]];

  const rawRows = XLSX.utils.sheet_to_json(
    firstSheet,
    {
      defval: '',
      raw: true,
    }
  );

  return rawRows.map((row) => {
    const normalizedRow = {};

    Object.entries(row).forEach(([key, value]) => {
      normalizedRow[normalizeHeader(key)] = value;
    });

    return normalizedRow;
  });
};

// VALIDATE EXCEL HEADERS 


const validateHeaders = (rows) => {
  if (!rows.length) {
    throw new Error(
      'The Excel file does not contain any data rows'
    );
  }

  const headers = Object.keys(rows[0]);

  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !headers.includes(column)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Missing mandatory Excel columns: ${missingColumns.join(
        ', '
      )}`
    );
  }
};

// VALIDATE ONE ROW

const validateRow = (row, rowNumber) => {
  const errors = [];

  const requiredTextFields = [
    ['medicine_name', 'Medicine Name'],
    ['generic_name', 'Generic Name'],
    ['sku_code', 'SKU Code'],
    ['category', 'Category'],
    ['strength', 'Strength'],
    ['dosage_form', 'Dosage Form'],
    ['manufacturer', 'Manufacturer'],
    ['batch_number', 'Batch Number'],
  ];

  requiredTextFields.forEach(
    ([field, label]) => {
      if (
        row[field] === null ||
        row[field] === undefined ||
        String(row[field]).trim() === ''
      ) {
        errors.push(`${label} is required`);
      }
    }
  );

  /* Quantity */
  const quantity = parseNumber(row.quantity);

  if (quantity === null) {
    errors.push('Quantity is required and must be a number');
  } else if (quantity < 0) {
    errors.push('Quantity cannot be negative');
  }

  /* Reorder level */
  const reorderLevel = parseNumber(
    row.reorder_level
  );

  if (reorderLevel === null) {
    errors.push(
      'Reorder Level is required and must be a number'
    );
  } else if (reorderLevel < 0) {
    errors.push(
      'Reorder Level cannot be negative'
    );
  }

  /* Purchase price */
  const purchasePrice = parseNumber(
    row.purchase_price
  );

  if (purchasePrice === null) {
    errors.push(
      'Purchase Price is required and must be a number'
    );
  } else if (purchasePrice < 0) {
    errors.push(
      'Purchase Price cannot be negative'
    );
  }

  /* Selling price */
  const sellingPrice = parseNumber(
    row.selling_price
  );

  if (sellingPrice === null) {
    errors.push(
      'Selling Price is required and must be a number'
    );
  } else if (sellingPrice < 0) {
    errors.push(
      'Selling Price cannot be negative'
    );
  }

  /* Manufacturing date */
  const manufacturingDate =
    parseExcelDate(
      row.manufacturing_date
    );

  if (!manufacturingDate) {
    errors.push(
      'Manufacturing Date is required and must be a valid date'
    );
  }

  /* Expiry date */
  const expiryDate = parseExcelDate(
    row.expiry_date
  );

  if (!expiryDate) {
    errors.push(
      'Expiry Date is required and must be a valid date'
    );
  }

  /* Date relationship */
  if (
    manufacturingDate &&
    expiryDate &&
    manufacturingDate > expiryDate
  ) {
    errors.push(
      'Manufacturing Date cannot be after Expiry Date'
    );
  }

  /* Optional prescription field */
  if (
    row.prescription_required !== undefined &&
    String(row.prescription_required).trim() !== ''
  ) {
    const prescriptionRequired =
      parseBoolean(
        row.prescription_required
      );

    if (prescriptionRequired === null) {
      errors.push(
        'Prescription Required must be Yes/No or True/False'
      );
    }
  }

  /* Optional discount */
  if (
    row.discount_percent !== undefined &&
    String(row.discount_percent).trim() !== ''
  ) {
    const discount = parseNumber(
      row.discount_percent
    );

    if (discount === null) {
      errors.push(
        'Discount (%) must be a number'
      );
    } else if (
      discount < 0 ||
      discount > 100
    ) {
      errors.push(
        'Discount (%) must be between 0 and 100'
      );
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      rowNumber,
      errors,
    };
  }

  return {
    valid: true,
    rowNumber,
  };
};

// IMPORT EXCEL INVENTORY

const importInventoryExcel = async (
  userId,
  buffer
) => {
  const pharmacyId =
    await getPharmacyId(userId);

  const rows = parseExcelRows(buffer);

  validateHeaders(rows);

  /*
   * Validate ALL rows BEFORE inserting anything.
   *
   * This prevents a half-imported Excel file.
   */
  const validationErrors = [];

  rows.forEach((row, index) => {
    const result = validateRow(
      row,
      index + 2
    );

    if (!result.valid) {
      validationErrors.push(result);
    }
  });

  if (validationErrors.length > 0) {
    return {
      success: false,
      totalRows: rows.length,
      importedRows: 0,
      skippedRows: validationErrors.length,
      validationErrors,
    };
  }

  let importedRows = 0;
  const imported = [];

  /*
   * Process each valid row.
   */
  for (
    let index = 0;
    index < rows.length;
    index++
  ) {
    const row = rows[index];

    const medicineName =
      String(row.medicine_name).trim();

    const genericName =
      String(row.generic_name).trim();

    const skuCode =
      String(row.sku_code).trim();

    const category =
      String(row.category).trim();

    const strength =
      String(row.strength).trim();

    const dosageForm =
      String(row.dosage_form).trim();

    const manufacturer =
      String(row.manufacturer).trim();

    const batchNumber =
      String(row.batch_number).trim();

    const quantity =
      parseNumber(row.quantity);

    const manufacturingDate =
      parseExcelDate(
        row.manufacturing_date
      );

    const expiryDate =
      parseExcelDate(row.expiry_date);

    const purchasePrice =
      parseNumber(row.purchase_price);

    const sellingPrice =
      parseNumber(row.selling_price);

    const reorderLevel =
      parseNumber(row.reorder_level);

    /*
     * Optional fields.
     */
    const unitOfMeasure =
      String(
        row.unit_of_measure || 'UNIT'
      ).trim();

    const prescriptionRequired =
      row.prescription_required === undefined ||
      String(
        row.prescription_required
      ).trim() === ''
        ? false
        : parseBoolean(
            row.prescription_required
          );

    const storageLocation =
      String(
        row.storage_location || ''
      ).trim() || null;

    const supplierName =
      String(
        row.supplier_name || ''
      ).trim() || null;

    const discountPercent =
      row.discount_percent === undefined ||
      String(
        row.discount_percent
      ).trim() === ''
        ? 0
        : parseNumber(
            row.discount_percent
          );

    const taxCodeHsn =
      String(
        row.tax_code_hsn || ''
      ).trim() || null;

// FIND MEDICINE

    const {
      data: existingMedicine,
      error: medicineLookupError,
    } = await supabase
      .from('medicines')
      .select('id')
      .eq('pharmacy_id', pharmacyId)
      .eq('sku_code', skuCode)
      .maybeSingle();

    if (medicineLookupError) {
      throw new Error(
        `Row ${index + 2}: unable to check medicine: ${medicineLookupError.message}`
      );
    }

    let medicineId;


// UPDATE EXISTING MEDICINE


    if (existingMedicine) {
      medicineId =
        existingMedicine.id;

      const {
        error: medicineUpdateError,
      } = await supabase
        .from('medicines')
        .update({
          medicine_name: medicineName,
          generic_name: genericName,
          category,
          strength,
          dosage_form: dosageForm,
          manufacturer,
          unit_of_measure: unitOfMeasure,
          prescription_required:
            prescriptionRequired,
          reorder_level: reorderLevel,
          is_active: true,
        })
        .eq('id', medicineId)
        .eq(
          'pharmacy_id',
          pharmacyId
        );

      if (medicineUpdateError) {
        throw new Error(
          `Row ${index + 2}: unable to update medicine: ${medicineUpdateError.message}`
        );
      }
    }

// CREATE NEW MEDICINE

    else {
      const {
        data: newMedicine,
        error: medicineInsertError,
      } = await supabase
        .from('medicines')
        .insert({
          pharmacy_id: pharmacyId,
          medicine_name: medicineName,
          generic_name: genericName,
          sku_code: skuCode,
          category,
          strength,
          dosage_form: dosageForm,
          manufacturer,
          unit_of_measure: unitOfMeasure,
          prescription_required:
            prescriptionRequired,
          reorder_level: reorderLevel,
          is_active: true,
        })
        .select('id')
        .single();

      if (medicineInsertError) {
        throw new Error(
          `Row ${index + 2}: unable to create medicine: ${medicineInsertError.message}`
        );
      }

      medicineId =
        newMedicine.id;
    }

// FIND EXISTING BATCH 

    const {
      data: existingBatch,
      error: batchLookupError,
    } = await supabase
      .from('inventory_batches')
      .select('id')
      .eq('medicine_id', medicineId)
      .eq(
        'batch_number',
        batchNumber
      )
      .maybeSingle();

    if (batchLookupError) {
      throw new Error(
        `Row ${index + 2}: unable to check batch: ${batchLookupError.message}`
      );
    }

    const batchData = {
      medicine_id: medicineId,
      batch_number: batchNumber,
      quantity,
      manufacturing_date:
        manufacturingDate,
      expiry_date: expiryDate,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      discount_percent:
        discountPercent,
      tax_code_hsn: taxCodeHsn,
      storage_location:
        storageLocation,
      supplier_name: supplierName,
      is_active: true,
    };

// UPDATE EXISTING BATCH 

    if (existingBatch) {
      const {
        error: batchUpdateError,
      } = await supabase
        .from('inventory_batches')
        .update(batchData)
        .eq(
          'id',
          existingBatch.id
        );

      if (batchUpdateError) {
        throw new Error(
          `Row ${index + 2}: unable to update batch: ${batchUpdateError.message}`
        );
      }
    }

// CREATE NEW BATCH 

    else {
      const {
        error: batchInsertError,
      } = await supabase
        .from('inventory_batches')
        .insert(batchData);

      if (batchInsertError) {
        throw new Error(
          `Row ${index + 2}: unable to create batch: ${batchInsertError.message}`
        );
      }
    }

    importedRows++;

    imported.push({
      row: index + 2,
      medicineName,
      skuCode,
      batchNumber,
      quantity,
      purchasePrice,
      sellingPrice,
    });
  }

  return {
    success: true,
    totalRows: rows.length,
    importedRows,
    skippedRows: 0,
    validationErrors: [],
    imported,
  };
};

// GET INVENTORY

const getInventory = async (
  userId,
  options = {}
) => {
  const pharmacyId =
    await getPharmacyId(userId);

  const page = Math.max(
    Number(options.page) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number(options.limit) || 10,
      1
    ),
    100
  );

  const search = String(
    options.search || ''
  ).trim();

  let medicineQuery = supabase
    .from('medicines')
    .select(`
      id,
      medicine_name,
      generic_name,
      sku_code,
      category,
      strength,
      dosage_form,
      manufacturer,
      unit_of_measure,
      prescription_required,
      reorder_level,
      is_active,
      created_at
    `)
    .eq(
      'pharmacy_id',
      pharmacyId
    )
    .eq('is_active', true)
    .order('created_at', {
      ascending: false,
    });

  if (search) {
    medicineQuery =
      medicineQuery.or(
        `medicine_name.ilike.%${search}%,generic_name.ilike.%${search}%,sku_code.ilike.%${search}%`
      );
  }

  const {
    data: medicines,
    error: medicinesError,
  } = await medicineQuery;

  if (medicinesError) {
    throw new Error(
      `Unable to load inventory: ${medicinesError.message}`
    );
  }

  const medicineIds =
    (medicines || []).map(
      (medicine) => medicine.id
    );

  let batches = [];

  if (medicineIds.length > 0) {
    const {
      data: batchData,
      error: batchesError,
    } = await supabase
      .from('inventory_batches')
      .select(`
        id,
        medicine_id,
        batch_number,
        quantity,
        manufacturing_date,
        expiry_date,
        purchase_price,
        selling_price,
        discount_percent,
        tax_code_hsn,
        storage_location,
        supplier_name,
        is_active,
        created_at
      `)
      .in(
        'medicine_id',
        medicineIds
      )
      .eq('is_active', true);

    if (batchesError) {
      throw new Error(
        `Unable to load inventory batches: ${batchesError.message}`
      );
    }

    batches = batchData || [];
  }

  const batchesByMedicine =
    new Map();

  for (const batch of batches) {
    if (
      !batchesByMedicine.has(
        batch.medicine_id
      )
    ) {
      batchesByMedicine.set(
        batch.medicine_id,
        []
      );
    }

    batchesByMedicine
      .get(batch.medicine_id)
      .push(batch);
  }

  const today = new Date();
  today.setHours(
    0,
    0,
    0,
    0
  );

  const items =
    (medicines || []).map(
      (medicine) => {
        const medicineBatches =
          batchesByMedicine.get(
            medicine.id
          ) || [];

        const quantity =
          medicineBatches.reduce(
            (sum, batch) =>
              sum +
              Number(
                batch.quantity || 0
              ),
            0
          );

        const reorderLevel =
          Number(
            medicine.reorder_level ||
              0
          );

        const expiredBatches =
          medicineBatches.filter(
            (batch) => {
              if (
                !batch.expiry_date ||
                Number(
                  batch.quantity || 0
                ) <= 0
              ) {
                return false;
              }

              const expiry =
                new Date(
                  batch.expiry_date
                );

              expiry.setHours(
                0,
                0,
                0,
                0
              );

              return expiry < today;
            }
          );

        const sortedBatches =
          [...medicineBatches].sort(
            (a, b) =>
              new Date(
                a.expiry_date
              ) -
              new Date(
                b.expiry_date
              )
          );

        const nearestBatch =
          sortedBatches[0] ||
          null;

        let status =
          'In Stock';

        if (
          expiredBatches.length > 0
        ) {
          status = 'Expired';
        } else if (
          quantity <= 0
        ) {
          status = 'Out of Stock';
        } else if (
          quantity <=
          reorderLevel
        ) {
          status = 'Low Stock';
        }

        return {
          id: medicine.id,

          medicineName:
            medicine.medicine_name,

          genericName:
            medicine.generic_name,

          skuCode:
            medicine.sku_code,

          category:
            medicine.category,

          strength:
            medicine.strength,

          dosageForm:
            medicine.dosage_form,

          manufacturer:
            medicine.manufacturer,

          unitOfMeasure:
            medicine.unit_of_measure,

          prescriptionRequired:
            medicine.prescription_required,

          quantity,

          stock: quantity,

          reorderLevel,

          status,

          availability:
            status,

          expiryDate:
            nearestBatch?.expiry_date ||
            null,

          expiry:
            nearestBatch?.expiry_date ||
            null,

          batches:
            medicineBatches,

          batchCount:
            medicineBatches.length,

          sellingPrice:
            nearestBatch
              ?.selling_price || 0,

          purchasePrice:
            nearestBatch
              ?.purchase_price || 0,

          discountPercent:
            nearestBatch
              ?.discount_percent || 0,

          supplierName:
            nearestBatch
              ?.supplier_name ||
            null,

          storageLocation:
            nearestBatch
              ?.storage_location ||
            null,

          taxCodeHsn:
            nearestBatch
              ?.tax_code_hsn ||
            null,

          createdAt:
            medicine.created_at,
        };
      }
    );

  const total =
    items.length;

  const totalPages =
    total === 0
      ? 1
      : Math.ceil(
          total / limit
        );

  const startIndex =
    (page - 1) * limit;

  const paginatedItems =
    items.slice(
      startIndex,
      startIndex + limit
    );

  const summary = {
    totalMedicines:
      total,

    totalStockUnits:
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantity || 0
          ),
        0
      ),

    lowStock:
      items.filter(
        (item) =>
          item.status ===
          'Low Stock'
      ).length,

    outOfStock:
      items.filter(
        (item) =>
          item.status ===
          'Out of Stock'
      ).length,

    expired:
      items.filter(
        (item) =>
          item.status ===
          'Expired'
      ).length,
  };

  return {
    data: paginatedItems,
    total,
    page,
    limit,
    totalPages,
    summary,
  };
};

module.exports = {
  importInventoryExcel,
  getInventory,
};