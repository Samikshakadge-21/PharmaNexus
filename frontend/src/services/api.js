const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Retrieve the stored authentication token.
 */
const getStoredToken = () => {
  return localStorage.getItem('pharmanexus_token');
};

/**
 * Build Authorization headers when a token exists.
 */
const getAuthHeaders = () => {
  const token = getStoredToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

/**
 * Safely parse a fetch response as JSON.
 */
const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await response.json();
  }

  const text = await response.text();

  return {
    success: response.ok,
    message: text || response.statusText,
  };
};

/* =========================================================
   INVENTORY
   ========================================================= */

/**
 * Fetch inventory items with optional pagination,
 * search, and filtering.
 */
export const getInventory = async (params = {}) => {
  const query = new URLSearchParams();

  if (params.page) {
    query.append('page', params.page);
  }

  if (params.limit) {
    query.append('limit', params.limit);
  }

  if (params.search) {
    query.append('search', params.search);
  }

  if (params.filter && params.filter !== 'All') {
    query.append('filter', params.filter);
  }

  const queryString = query.toString();

  const url = `${API_BASE_URL}/inventory${
    queryString ? `?${queryString}` : ''
  }`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to fetch inventory'
    );
  }

  return data;
};

/**
 * Create a new inventory record.
 */
export const createInventory = async (inventoryData) => {
  const response = await fetch(
    `${API_BASE_URL}/inventory`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inventoryData),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to create inventory record'
    );
  }

  return data;
};

/**
 * Update an existing inventory record.
 */
export const updateInventory = async (
  id,
  inventoryData
) => {
  const response = await fetch(
    `${API_BASE_URL}/inventory/${id}`,
    {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inventoryData),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to update inventory record'
    );
  }

  return data;
};

/**
 * Delete an inventory record.
 */
export const deleteInventory = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/inventory/${id}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to delete inventory record'
    );
  }

  return data;
};

/**
 * Upload CSV, XLS, or XLSX inventory file.
 *
 * Do NOT manually set Content-Type when using FormData.
 */
export const uploadInventory = async (file) => {
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/inventory/upload`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to upload inventory file'
    );
  }

  return data;
};

/* =========================================================
   DASHBOARD
   ========================================================= */

/**
 * Fetch dashboard summary metrics and statistics.
 */
export const getDashboardSummary = async () => {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/summary`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store',
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to fetch dashboard summary'
    );
  }

  return data;
};

/* =========================================================
   BILLING
   ========================================================= */

/**
 * Process a billing sale transaction.
 */
export const createSale = async (saleData) => {
  const response = await fetch(
    `${API_BASE_URL}/billing/create`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saleData),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to complete billing transaction'
    );
  }

  return data;
};

/**
 * Fetch sales history.
 */
export const getSalesHistory = async () => {
  const response = await fetch(
    `${API_BASE_URL}/billing/sales`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store',
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to fetch sales history'
    );
  }

  return data;
};

/* =========================================================
   AUTHENTICATION
   ========================================================= */

/**
 * Register a new user.
 *
 * Sends registration data as multipart/form-data so the
 * backend can receive both normal fields and the drug
 * license file.
 *
 * Expected userData:
 *
 * {
 *   email,
 *   password,
 *   pharmacyName,
 *   ownerName,
 *   phone,
 *   address,
 *   gstin,
 *   licenseNumber,
 *   licenseFile,
 *   role
 * }
 */
export const registerUser = async (userData) => {
  const formData = new FormData();

  formData.append(
    'email',
    userData.email || ''
  );

  formData.append(
    'password',
    userData.password || ''
  );

  formData.append(
    'pharmacyName',
    userData.pharmacyName || ''
  );

  formData.append(
    'ownerName',
    userData.ownerName || ''
  );

  formData.append(
    'phone',
    userData.phone || ''
  );

  formData.append(
    'address',
    userData.address || ''
  );

  formData.append(
    'gstin',
    userData.gstin || ''
  );

  formData.append(
    'licenseNumber',
    userData.licenseNumber || ''
  );

  formData.append(
    'role',
    userData.role || 'pharmacy'
  );

  // Attach drug license file.
  if (userData.licenseFile) {
    formData.append(
      'licenseFile',
      userData.licenseFile
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/register`,
    {
      method: 'POST',

      /*
       * IMPORTANT:
       * Do NOT set Content-Type manually.
       *
       * The browser automatically sets the correct
       * multipart/form-data boundary.
       */
      body: formData,
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Registration failed'
    );
  }

  return data;
};

/**
 * Login a user.
 *
 * Expected payload:
 *
 * {
 *   email,
 *   password
 * }
 */
export const loginUser = async (credentials) => {
  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Login failed'
    );
  }

  return data;
};

/**
 * Logout the current user.
 */
export const logoutUser = async () => {
  const response = await fetch(
    `${API_BASE_URL}/auth/logout`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || 'Logout failed'
    );
  }

  return data;
};

/**
 * Fetch the authenticated user's profile.
 *
 * If a token is passed, use it.
 * Otherwise, use the token stored in localStorage.
 */
export const getAuthUser = async (
  token = getStoredToken()
) => {
  if (!token) {
    throw new Error(
      'No authentication token found'
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Failed to authenticate session'
    );
  }

  return data;
};