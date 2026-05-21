import { API_BASE_URL } from '../CONSTANT/CONSTANT';

// Generic fetch with Bearer token and error handling
const fetchWithToken = async (url, options = {}) => {
  // console.log("Fetching URL:", url, 'options ' ,options);
  
  const token = sessionStorage.getItem('token');
  // console.log("Using Token:", token);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  try {
    // console.log("Headers:", headers, 'options ' ,options);
    const response = await fetch(url, { ...options, headers });
    // let data = await response.json();
    // console.log("Response Data:", data);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    // For DELETE, some APIs may not return JSON
    if (options.method === 'DELETE') {
      try { return await response.json(); } catch { return response.status; }
    }
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};

const stockManagementApis = {
  // User APIs
  getUsers : async () => fetchWithToken(`${API_BASE_URL}/auth`),

  getUserLogin: async (email, password) =>
    fetchWithToken(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
  }),


  getAllUsers: async () => fetchWithToken(`${API_BASE_URL}/auth/getAllUsers`),
  getUserById: async (id) => fetchWithToken(`${API_BASE_URL}/auth/${id}`),
  createUser: async (user) =>
    fetchWithToken(`${API_BASE_URL}/auth/add`, {
      method: 'POST',
      body: JSON.stringify(user),
  }),
  updateUser: async (id, user) =>
    fetchWithToken(`${API_BASE_URL}/auth/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    }),
  deleteUserById: async (userId) =>
    fetchWithToken(`${API_BASE_URL}/auth/delete/${userId}`, { method: 'DELETE' }),

  // Branch APIs
  getBranch: async () => fetchWithToken(`${API_BASE_URL}/branch`),
  getBranchById: async (id) => fetchWithToken(`${API_BASE_URL}/branch/${id}`),
  addBranch: async (branch) => fetchWithToken(`${API_BASE_URL}/branch/create`,
  {
      method: 'POST',
      body: JSON.stringify(branch),
  }),

  updateBranch: async (id, branch) => fetchWithToken(`${API_BASE_URL}/branch/update/${id}`,
  {
    method: 'PUT',
    body: JSON.stringify(branch),
  }),

  deleteBranch: async (branchId) => fetchWithToken(`${API_BASE_URL}/branch/delete/${branchId}`, { method: 'DELETE' }),

  // Role APIs
  getRoles: async () => fetchWithToken(`${API_BASE_URL}/role`),
  getRoleById: async (id) => fetchWithToken(`${API_BASE_URL}/role/${id}`),
  getRoleByName: async (name) => fetchWithToken(`${API_BASE_URL}/role/${name}`),
  updateRole: async (id, data) =>
    fetchWithToken(`${API_BASE_URL}/role/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRole: async (roleId) => fetchWithToken(`${API_BASE_URL}/role/delete/${roleId}`, { method: 'DELETE' }),
  addRole: async (role) =>
    fetchWithToken(`${API_BASE_URL}/role/create`, {
      method: 'POST',
      body: JSON.stringify(role),
    }),

  // Product Category APIs
  getProductCategory: async () => fetchWithToken(`${API_BASE_URL}/productCategory`),
  getProductCategoryById: async (id) => fetchWithToken(`${API_BASE_URL}/productCategory/${id}`),
  addProductCategory: async (productCategory) =>
    fetchWithToken(`${API_BASE_URL}/productCategory/create`, {
      method: 'POST',
      body: JSON.stringify(productCategory),
    }),
  updateProductCategory: async (id, productCategory) =>
    fetchWithToken(`${API_BASE_URL}/productCategory/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productCategory),
    }),
  deleteProductCategory: async (id) =>
    fetchWithToken(`${API_BASE_URL}/productCategory/delete/${id}`, { method: 'DELETE' }),

  // Product APIs
  getProduct: async () => fetchWithToken(`${API_BASE_URL}/product`),
  getProductById: async (id) => fetchWithToken(`${API_BASE_URL}/product/${id}`),
  addProduct: async (product) => fetchWithToken(`${API_BASE_URL}/product/create`,
  {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  updateStock: async (id, product) =>
    fetchWithToken(`${API_BASE_URL}/product/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
  updateProduct: async (id, product) =>
    fetchWithToken(`${API_BASE_URL}/product/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
  updateProductById: async (id, product) =>
    fetchWithToken(`${API_BASE_URL}/product/updateProduct/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
  deleteProduct: async (productId) =>
    fetchWithToken(`${API_BASE_URL}/product/delete/${productId}`, { method: 'DELETE' }),

  // Vendor APIs
  getVendor: async () => fetchWithToken(`${API_BASE_URL}/vendor`),
  getVendorById: async (id) => fetchWithToken(`${API_BASE_URL}/vendor/${id}`),
  addVendor: async (vendor) =>
    fetchWithToken(`${API_BASE_URL}/vendor/create`, {
      method: 'POST',
      body: JSON.stringify(vendor),
    }),
  updateVendor: async (id, vendor) =>
    fetchWithToken(`${API_BASE_URL}/vendor/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vendor),
    }),
  deleteVendor: async (vendorId) =>
    fetchWithToken(`${API_BASE_URL}/vendor/delete/${vendorId}`, { method: 'DELETE' }),

  // Issue APIs
  getIssue: async () => fetchWithToken(`${API_BASE_URL}/issue`),
  getIssueById: async (id) => fetchWithToken(`${API_BASE_URL}/issue/${id}`),
  addIssue: async (issue) =>
    fetchWithToken(`${API_BASE_URL}/issue/create`, {
      method: 'POST',
      body: JSON.stringify(issue),
    }),
  updateIssueQuantity: async (id, issue) =>
    fetchWithToken(`${API_BASE_URL}/issue/updateQuantity/${id}`, {
      method: 'PUT',
      body: JSON.stringify(issue),
    }),
  updateIssue: async (id, issue) =>
    fetchWithToken(`${API_BASE_URL}/issue/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(issue),
    }),
  deleteIssue: async (id) =>
    fetchWithToken(`${API_BASE_URL}/issue/delete/${id}`, { method: 'DELETE' }),

  // Order APIs
  getOrder: async () => fetchWithToken(`${API_BASE_URL}/order`),
  getOrderById: async (id) => fetchWithToken(`${API_BASE_URL}/order/${id}`),
  getOrderByUserId: async (userId) => fetchWithToken(`${API_BASE_URL}/order/user/${userId}`),
  AddOrder: async (order) =>  fetchWithToken(`${API_BASE_URL}/order/create`, {
      method: 'POST',
      body: JSON.stringify(order),
  }),
  updateOrder: async (id, order) =>  fetchWithToken(`${API_BASE_URL}/order/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
  }),
  deleteOrder: async (orderId) => fetchWithToken(`${API_BASE_URL}/order/delete/${orderId}`, { method: 'DELETE' }),

  // Order Line Item APIs
  getOrderLineItem: async () => fetchWithToken(`${API_BASE_URL}/orderlineitem`),
  getOrderLineItemById: async (id) => fetchWithToken(`${API_BASE_URL}/orderlineitem/${id}`),
  AddOrderLineItem: async (item) =>  fetchWithToken(`${API_BASE_URL}/orderlineItem`, {
    method: 'POST',
    body: JSON.stringify(item),
  }),
  updateOrderLineItemQuantity: async (id, orderLineItem) =>
    fetchWithToken(`${API_BASE_URL}/orderlineitem/updateQuantity/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderLineItem),
  }),
  updateOrderLineItem: async (id, orderLineItem) =>
    fetchWithToken(`${API_BASE_URL}/orderlineitem/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderLineItem),
    }),
  deleteOrderLineItem: async (orderLineItemId) =>
    fetchWithToken(`${API_BASE_URL}/orderlineitem/delete/${orderLineItemId}`, { method: 'DELETE' }),

  // Permission APIs
  getPermission: async () => fetchWithToken(`${API_BASE_URL}/permission`),
  getPermissionById: async (id) => fetchWithToken(`${API_BASE_URL}/permission/${id}`),
  getPermissionByRoleId: async (id) => fetchWithToken(`${API_BASE_URL}/permission/roles/${id}`),
  getPermissionByRoleIdAndModuleId: async ({ roleId, moduleId }) =>
    fetchWithToken(`${API_BASE_URL}/permission/roleId/${roleId}/moduleId/${moduleId}`),
  getPermissionByUserId: async (email, password) =>
    fetchWithToken(`${API_BASE_URL}/permission/${email}/${password}`),
  updatePermission: async (id, permission) =>
    fetchWithToken(`${API_BASE_URL}/permission/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(permission),
    }),
  createPermission: async (permission) =>
    fetchWithToken(`${API_BASE_URL}/permission/create`, {
      method: 'POST',
      body: JSON.stringify(permission),
    }),
  deletePermissionById: async (Id) =>
    fetchWithToken(`${API_BASE_URL}/permission/delete/${Id}`, { method: 'DELETE' }),

  // Module APIs
  getModule: async () => fetchWithToken(`${API_BASE_URL}/module`),
  getModuleById: async (id) => fetchWithToken(`${API_BASE_URL}/module/${id}`),
  updateModule: async (id, module) =>
    fetchWithToken(`${API_BASE_URL}/module/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(module),
    }),
  addModule: async (module) =>
    fetchWithToken(`${API_BASE_URL}/module/create`, {
      method: 'POST',
      body: JSON.stringify(module),
    }),
  deleteModuleById: async (Id) =>
    fetchWithToken(`${API_BASE_URL}/module/delete/${Id}`, { method: 'DELETE' }),

  // Return APIs
  getReturnAll: async () => fetchWithToken(`${API_BASE_URL}/return/all`),
  getReturn: async () => fetchWithToken(`${API_BASE_URL}/return`),
  getReturnByOrderId: async (id) => fetchWithToken(`${API_BASE_URL}/return/orderId/${id}`),
  getReturnById: async (id) => fetchWithToken(`${API_BASE_URL}/return/${id}`),
  updateReturn: async (id, data) =>
    fetchWithToken(`${API_BASE_URL}/return/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addReturn: async (data) =>
    fetchWithToken(`${API_BASE_URL}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Employee APIs
  getEmployees: async () => fetchWithToken(`${API_BASE_URL}/employee`),
  addEmployee: async (data) =>
    fetchWithToken(`${API_BASE_URL}/employee/create`, {
      method: 'POST',
      body: JSON.stringify(data),
  }),
  updateEmployee: async (id, data) =>
    fetchWithToken(`${API_BASE_URL}/employee/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
  }),
  deleteEmployee: async (id) => fetchWithToken(`${API_BASE_URL}/employee/delete/${id}`, { method: 'DELETE' }),


  // Reports
  getMonthlyReports: async (selectedMonth) =>
    fetchWithToken(`${API_BASE_URL}/reports/monthly_report?month=${selectedMonth}`),
  getYearlyReports: async (selectedMonth, product, dayIndex) =>
    fetchWithToken(`${API_BASE_URL}/reports/daywise_employees?month=${selectedMonth}&product=${product}&day=${dayIndex + 1}`),
  YearlyReport: async (selectedYear) =>
    fetchWithToken(`${API_BASE_URL}/reports/yearly_report?year=${selectedYear}`),
  getInventoryReport: async (selectedYear) =>
    fetchWithToken(`${API_BASE_URL}/reports/inventory-report?year=${selectedYear}`),

  // Location APIs
  getLcations: async () => fetchWithToken(`${API_BASE_URL}/location/`),
  addLocation: async (data) =>
    fetchWithToken(`${API_BASE_URL}/location/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLocation: async (id, data) =>
    fetchWithToken(`${API_BASE_URL}/location/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteLocation: async (id) =>
    fetchWithToken(`${API_BASE_URL}/location/delete/${id}`, { method: 'DELETE' }),

  // Asset Type APIs
  getAssetTypes: async () => fetchWithToken(`${API_BASE_URL}/asset_type/`),
  addAssetType: async (data) =>
    fetchWithToken(`${API_BASE_URL}/asset_type/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAssetType: async (id, data) =>
    fetchWithToken(`${API_BASE_URL}/asset_type/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAssetType: async (id) =>
    fetchWithToken(`${API_BASE_URL}/asset_type/delete/${id}`, { method: 'DELETE' }),

  // Assets APIs
  getAssets: async () => fetchWithToken(`${API_BASE_URL}/assets/`),
  addAssets: async (data) =>
    fetchWithToken(`${API_BASE_URL}/assets/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAssets: async (id, data) =>
    fetchWithToken(`${API_BASE_URL}/assets/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAssets: async (id) =>
    fetchWithToken(`${API_BASE_URL}/assets/delete/${id}`, { method: 'DELETE' }),

  getQuarterlyAssetReport: async (from, to) => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const url = `${API_BASE_URL}/assets/report/quarterly${params.toString() ? `?${params}` : ""}`;
    return fetchWithToken(url);
  },
  getAssetsByQuarter: async (year, quarter) => {
    if (!year || !quarter) throw new Error("Both year and quarter are required");
    const params = new URLSearchParams({ year, q: quarter });
    const url = `${API_BASE_URL}/assets/list/quarterly?${params}`;
    return fetchWithToken(url);
  },
};

export default stockManagementApis;