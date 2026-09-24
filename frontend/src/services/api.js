const API_BASE_URL = 'http://localhost:5000/api';

// Helper to retrieve auth token from localStorage and build Authorization header
const getAuthHeaders = () => {
  const token = localStorage.getItem('pharmanexus_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fetch inventory items with optional pagination, search, and filtering
 */
export const getInventory = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);
  if (params.filter && params.filter !== 'All') query.append('filter', params.filter);

  const queryString = query.toString();
  const url = `${API_BASE_URL}/inventory${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, { headers: getAuthHeaders(), cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch inventory: ${response.statusText}`);
  }
  return await response.json();
};

/**
 * Create a new inventory record
 */
export const createInventory = async (inventoryData) => {
  const response = await fetch(`${API_BASE_URL}/inventory`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(inventoryData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create inventory record');
  }
  return data;
};

/**
 * Update an existing inventory record by _id or inventoryId
 */
export const updateInventory = async (id, inventoryData) => {
  const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(inventoryData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update inventory record');
  }
  return data;
};

/**
 * Delete an inventory record by _id or inventoryId
 */
export const deleteInventory = async (id) => {
  const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete inventory record');
  }
  return data;
};

/**
 * Upload CSV, XLS, or XLSX inventory file
 */
export const uploadInventory = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/inventory/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    // Do NOT set Content-Type header when using FormData
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload inventory file');
  }
  return data;
};

/**
 * Fetch dashboard summary metrics and statistics from backend
 */
export const getDashboardSummary = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/summary`, { headers: getAuthHeaders(), cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dashboard summary');
  }
  return data;
};

/**
 * Process a billing sale transaction, validate stock in Supabase, and update inventory
 */
export const createSale = async (saleData) => {
  const response = await fetch(`${API_BASE_URL}/billing/create`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to complete billing transaction');
  }
  return data;
};

/**
 * Fetch sales history from backend
 */
export const getSalesHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/billing/sales`, { headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch sales history');
  }
  return data;
};

/**
 * Register a new Pharmacist account via backend
 */
export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
};

/**
 * Login a user via backend
 */
export const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
};

/**
 * Logout user session via backend
 */
export const logoutUser = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
  });
  const data = await response.json();
  return data;
};

/**
 * Fetch authenticated user profile using session token
 */
export const getAuthUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to authenticate session');
  }
  return data;
};

