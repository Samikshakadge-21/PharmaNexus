const supabase = require('../config/supabase');

const getPharmacyId = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('pharmacy_id, role')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(
      `Unable to load user profile: ${error.message}`
    );
  }

  if (!data) {
    throw new Error('User profile not found');
  }

  if (!data.pharmacy_id) {
    throw new Error(
      'No pharmacy is associated with this account'
    );
  }

  return data.pharmacy_id;
};

const getDashboardSummary = async (userId) => {
  const pharmacyId = await getPharmacyId(userId);

  /*
   * Get all active medicines for this pharmacy.
   */
  const {
    data: medicines,
    error: medicinesError,
  } = await supabase
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
      reorder_level,
      is_active
    `)
    .eq('pharmacy_id', pharmacyId)
    .eq('is_active', true);

  if (medicinesError) {
    throw new Error(
      `Unable to load medicines: ${medicinesError.message}`
    );
  }

  /*
   * TEMPORARY TEST:
   * Read inventory_batches directly without using
   * the medicine_id .in() filter.
   *
   * This helps us isolate the Bad Request issue.
   */
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
      supplier_name,
      is_active
    `)
    .eq('is_active', true);

  if (batchesError) {
    console.error(
      'Inventory batches Supabase error:',
      batchesError
    );

    throw new Error(
      `Unable to load inventory batches: ${batchesError.message}`
    );
  }

  /*
   * Keep only batches belonging to medicines
   * from this pharmacy.
   */
  const medicineIds = new Set(
    (medicines || []).map(
      (medicine) => medicine.id
    )
  );

  const batches = (batchData || []).filter(
    (batch) =>
      medicineIds.has(batch.medicine_id)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inThirtyDays = new Date(today);
  inThirtyDays.setDate(
    inThirtyDays.getDate() + 30
  );

  /*
   * Build medicine-level inventory information.
   */
  const inventoryMap = new Map();

  for (const medicine of medicines || []) {
    inventoryMap.set(medicine.id, {
      medicine,
      quantity: 0,
      batches: [],
      hasExpired: false,
      hasExpiringSoon: false,
    });
  }

  for (const batch of batches) {
    const item = inventoryMap.get(
      batch.medicine_id
    );

    if (!item) continue;

    const quantity = Number(
      batch.quantity || 0
    );

    item.quantity += quantity;
    item.batches.push(batch);

    if (batch.expiry_date) {
      const expiry = new Date(
        batch.expiry_date
      );

      expiry.setHours(0, 0, 0, 0);

      if (
        expiry < today &&
        quantity > 0
      ) {
        item.hasExpired = true;
      }

      if (
        expiry >= today &&
        expiry <= inThirtyDays &&
        quantity > 0
      ) {
        item.hasExpiringSoon = true;
      }
    }
  }

  let totalStockUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiredCount = 0;
  let expiringSoonCount = 0;
  let inStockCount = 0;

  const lowStockMedicines = [];
  const expiringMedicines = [];

  for (const item of inventoryMap.values()) {
    const medicine = item.medicine;

    const quantity = item.quantity;

    const reorderLevel = Number(
      medicine.reorder_level || 0
    );

    totalStockUnits += quantity;

    /*
     * Expired takes priority.
     */
    if (item.hasExpired) {
      expiredCount++;
    } else if (quantity <= 0) {
      outOfStockCount++;
    } else if (
      quantity <= reorderLevel
    ) {
      lowStockCount++;

      lowStockMedicines.push({
        id: medicine.id,
        medicineName:
          medicine.medicine_name,
        genericName:
          medicine.generic_name,
        skuCode:
          medicine.sku_code,
        quantity,
        reorderLevel,
        category:
          medicine.category,
      });
    } else {
      inStockCount++;
    }

    /*
     * Expiring medicines.
     */
    if (
      item.hasExpiringSoon &&
      !item.hasExpired
    ) {
      expiringSoonCount++;

      const expiringBatches =
        item.batches
          .filter((batch) => {
            if (
              !batch.expiry_date ||
              Number(batch.quantity || 0) <= 0
            ) {
              return false;
            }

            const expiry = new Date(
              batch.expiry_date
            );

            expiry.setHours(
              0,
              0,
              0,
              0
            );

            return (
              expiry >= today &&
              expiry <= inThirtyDays
            );
          })
          .sort(
            (a, b) =>
              new Date(a.expiry_date) -
              new Date(b.expiry_date)
          );

      const nearestBatch =
        expiringBatches[0];

      if (nearestBatch) {
        const expiry = new Date(
          nearestBatch.expiry_date
        );

        expiry.setHours(
          0,
          0,
          0,
          0
        );

        const daysLeft = Math.ceil(
          (expiry - today) /
            (1000 * 60 * 60 * 24)
        );

        expiringMedicines.push({
          id: medicine.id,
          medicineName:
            medicine.medicine_name,
          genericName:
            medicine.generic_name,
          skuCode:
            medicine.sku_code,
          quantity: item.quantity,
          batchNumber:
            nearestBatch.batch_number,
          expiryDate:
            nearestBatch.expiry_date,
          daysLeft,
          category:
            medicine.category,
        });
      }
    }
  }

  /*
   * Sort dashboard lists.
   */
  lowStockMedicines.sort(
    (a, b) =>
      a.quantity - b.quantity
  );

  expiringMedicines.sort(
    (a, b) =>
      a.daysLeft - b.daysLeft
  );

  /*
   * Today's sales.
   */
  const startOfToday = new Date(today);

  const startOfTomorrow = new Date(
    today
  );

  startOfTomorrow.setDate(
    startOfTomorrow.getDate() + 1
  );

  const {
    data: todaySales,
    error: salesError,
  } = await supabase
    .from('sales')
    .select(`
      id,
      total_amount,
      status,
      created_at
    `)
    .eq('pharmacy_id', pharmacyId)
    .gte(
      'created_at',
      startOfToday.toISOString()
    )
    .lt(
      'created_at',
      startOfTomorrow.toISOString()
    );

  if (salesError) {
    throw new Error(
      `Unable to load sales: ${salesError.message}`
    );
  }

  const completedSales =
    (todaySales || []).filter(
      (sale) =>
        sale.status !== 'CANCELLED'
    );

  const todaySalesAmount =
    completedSales.reduce(
      (sum, sale) =>
        sum +
        Number(
          sale.total_amount || 0
        ),
      0
    );

  const transactionsToday =
    completedSales.length;

  /*
   * Last 7 days sales chart.
   */
  const sevenDaysAgo = new Date(
    today
  );

  sevenDaysAgo.setDate(
    sevenDaysAgo.getDate() - 6
  );

  const {
    data: recentSales,
    error: recentSalesError,
  } = await supabase
    .from('sales')
    .select(`
      id,
      total_amount,
      status,
      created_at
    `)
    .eq('pharmacy_id', pharmacyId)
    .gte(
      'created_at',
      sevenDaysAgo.toISOString()
    )
    .lt(
      'created_at',
      startOfTomorrow.toISOString()
    )
    .order('created_at', {
      ascending: true,
    });

  if (recentSalesError) {
    throw new Error(
      `Unable to load sales chart: ${recentSalesError.message}`
    );
  }

  const salesByDate = {};

  for (let i = 0; i < 7; i++) {
    const date = new Date(
      sevenDaysAgo
    );

    date.setDate(
      sevenDaysAgo.getDate() + i
    );

    const key = date
      .toISOString()
      .split('T')[0];

    salesByDate[key] = {
      date: key,
      sales: 0,
      transactions: 0,
    };
  }

  for (const sale of recentSales || []) {
    if (
      sale.status === 'CANCELLED'
    ) {
      continue;
    }

    const key = new Date(
      sale.created_at
    )
      .toISOString()
      .split('T')[0];

    if (!salesByDate[key]) {
      continue;
    }

    salesByDate[key].sales += Number(
      sale.total_amount || 0
    );

    salesByDate[key].transactions += 1;
  }

  const salesChart =
    Object.values(salesByDate).map(
      (item) => ({
        date: item.date,

        label: new Date(
          `${item.date}T00:00:00`
        ).toLocaleDateString(
          'en-IN',
          {
            weekday: 'short',
          }
        ),

        sales: Number(
          item.sales.toFixed(2)
        ),

        transactions:
          item.transactions,
      })
    );

  return {
    totalMedicines:
      medicines?.length || 0,

    totalStockUnits,

    lowStock: lowStockCount,

    expiringSoon:
      expiringSoonCount,

    expired:
      expiredCount,

    stockStatus: {
      inStock:
        inStockCount,

      lowStock:
        lowStockCount,

      outOfStock:
        outOfStockCount,

      expired:
        expiredCount,
    },

    today: {
      sales: Number(
        todaySalesAmount.toFixed(2)
      ),

      transactions:
        transactionsToday,
    },

    salesChart,

    lowStockMedicines:
      lowStockMedicines.slice(0, 10),

    expiringMedicines:
      expiringMedicines.slice(0, 10),
  };
};

module.exports = {
  getDashboardSummary,
};