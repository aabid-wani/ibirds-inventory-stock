import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import User from './components/pages/User';
import HomePage from './components/pages/HomePage';
import Branch from './components/pages/Branch';
import Role from './components/permissions/Role';
import ProductCategory from './components/pages/ProductCategory';
import Product from './components/pages/Product';
import Vendor from './components/pages/Vendor';
import Issue from './components/pages/Issue';
import AddOrder from './components/pages/AddOrder';
import Order from './components/pages/Order';
import OrderLineItem from './components/pages/OrderLineItem';
import AddOrderLineItem from './components/pages/AddOrderLineItem';
import Login from './components/login/Login';
import Profile from './components/pages/Profile';
import Permissions from './components/permissions/Permissions';
import ProductDetailPage from './components/detailsPages/ProductDetailPage';
import OrderDetailPage from './components/detailsPages/OrderDetailPage';
import UserDetailPage from './components/detailsPages/UserDetailPage';
import VendorDetailPage from './components/detailsPages/VendorDetailPage';
import IssuedDetailPage from './components/detailsPages/IssuedDetailPage';
import EmployeeDetailPage from './components/detailsPages/EmployeeDetailPage';
import Module from './components/permissions/Module';
import Error from './components/pages/Error';
import ProtectedRoute from './components/login/ProtectedRoute';
import Employee from './components/pages/Employee';
import MonthlyReport from './components/reports/MonthlyReport';
import YearlyReport from './components/reports/YearlyReport';
import InventoryReport from './components/reports/InventoryReport';
import LowStockReport from './components/reports/LowStockReport';
import Location from './components/assets/Location';
import AssetType from './components/assets/AssetType';
import Assets from './components/assets/Assets';
import AssetReport from './components/reports/AssetReport';
import AddMultipleProvision from './components/pages/AddMultipleProvision';
import ServiceProvider from './components/pages/ServiceProvider';

const App = () => (
  <div className='container-fluid p-0 m-0'>
    <Router>
      <div style={{ backgroundColor: '#ecf0f4' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<ProtectedRoute element={<HomePage />} />} />

          {/* User Management */}
          <Route path="/AddUser" element={<ProtectedRoute element={<User />} permissionKey="users" can="add" />} />
          <Route path="/user" element={<ProtectedRoute element={<User />} permissionKey="users" can="read" />} />
          <Route path="/user/update/:id" element={<ProtectedRoute element={<User />} permissionKey="users" can="edit" />} />
          <Route path="/userDetailPage/:id" element={<ProtectedRoute element={<UserDetailPage />} permissionKey="users" can="read" />} />
          <Route path="/userdetailpage/:id" element={<ProtectedRoute element={<UserDetailPage />} permissionKey="users" can="read" />} />

          {/* Employee & Branch */}
          <Route path="/employee" element={<ProtectedRoute element={<Employee />} permissionKey="employees" can="read" />} />
          <Route path="/employeeDetailPage/:id" element={<ProtectedRoute element={<EmployeeDetailPage />} permissionKey="employees" can="read" />} />
          <Route path="/employeedetailpage/:id" element={<ProtectedRoute element={<EmployeeDetailPage />} permissionKey="employees" can="read" />} />
          <Route path="/branch" element={<ProtectedRoute element={<Branch />} permissionKey="branches" can="read" />} />

          {/* Products & Categories */}
          <Route path="/product" element={<ProtectedRoute element={<Product />} permissionKey="products" can="read" />} />
          <Route path="/productDetailPage/:id" element={<ProtectedRoute element={<ProductDetailPage />} permissionKey="products" can="read" />} />
          <Route path="/productdetailpage/:id" element={<ProtectedRoute element={<ProductDetailPage />} permissionKey="products" can="read" />} />
          <Route path="/productCategory" element={<ProtectedRoute element={<ProductCategory />} permissionKey="productCategory" can="read" />} />
          <Route path="/productcategory" element={<ProtectedRoute element={<ProductCategory />} permissionKey="productCategory" can="read" />} />

          {/* Vendors */}
          <Route path="/vendor" element={<ProtectedRoute element={<Vendor />} permissionKey="vendors" can="read" />} />
          <Route path="/vendorDetailPage/:id" element={<ProtectedRoute element={<VendorDetailPage />} permissionKey="vendors" can="read" />} />
          <Route path="/vendordetailpage/:id" element={<ProtectedRoute element={<VendorDetailPage />} permissionKey="vendors" can="read" />} />

          {/* Service Providers */}
          <Route path="/service_provider" element={<ProtectedRoute element={<ServiceProvider />} />} />
          <Route path="/serviceProvider" element={<ProtectedRoute element={<ServiceProvider />} />} />

          {/* Orders */}
          <Route path="/order" element={<ProtectedRoute element={<Order />} permissionKey="orders" can="read" />} />
          <Route path="/addOrder" element={<ProtectedRoute element={<AddOrder />} permissionKey="orders" can="add" />} />
          <Route path="/addorder" element={<ProtectedRoute element={<AddOrder />} permissionKey="orders" can="add" />} />
          <Route path="/order/update/:id" element={<ProtectedRoute element={<AddOrder />} permissionKey="orders" can="edit" />} />
          <Route path="/orderDetailPage/:id" element={<ProtectedRoute element={<OrderDetailPage />} permissionKey="orders" can="read" />} />
          <Route path="/orderdetailpage/:id" element={<ProtectedRoute element={<OrderDetailPage />} permissionKey="orders" can="read" />} />
          <Route path="/orderLineItem" element={<ProtectedRoute element={<OrderLineItem />} permissionKey="orders" can="read" />} />
          <Route path="/orderlineitem" element={<ProtectedRoute element={<OrderLineItem />} permissionKey="orders" can="read" />} />
          <Route path="/addOrderLineItem" element={<ProtectedRoute element={<AddOrderLineItem />} permissionKey="orders" can="add" />} />
          <Route path="/addorderlineitem" element={<ProtectedRoute element={<AddOrderLineItem />} permissionKey="orders" can="add" />} />
          <Route path="/orderLineItem/update/:id" element={<ProtectedRoute element={<AddOrderLineItem />} permissionKey="orders" can="edit" />} />

          {/* Provisions / Issues */}
          <Route path="/issue" element={<ProtectedRoute element={<Issue />} permissionKey="provisions" can="read" />} />
          <Route path="/addmultiprovision" element={<ProtectedRoute element={<AddMultipleProvision />} permissionKey="provisions" can="add" />} />
          <Route path="/addMultipleProvision" element={<ProtectedRoute element={<AddMultipleProvision />} permissionKey="provisions" can="add" />} />
          <Route path="/add-provision" element={<ProtectedRoute element={<AddMultipleProvision />} permissionKey="provisions" can="add" />} />
          <Route path="/issueDetailPage/:id" element={<ProtectedRoute element={<IssuedDetailPage />} permissionKey="provisions" can="read" />} />
          <Route path="/issuedetailpage/:id" element={<ProtectedRoute element={<IssuedDetailPage />} permissionKey="provisions" can="read" />} />

          {/* Reports */}
          <Route path="/monthly_report" element={<ProtectedRoute element={<MonthlyReport />} permissionKey="monthly reports" can="read" />} />
          <Route path="/yearly_report" element={<ProtectedRoute element={<YearlyReport />} permissionKey="reports" can="read" />} />
          <Route path="/inventory_report" element={<ProtectedRoute element={<InventoryReport />} permissionKey="reports" can="read" />} />
          <Route path="/low_stock" element={<ProtectedRoute element={<LowStockReport />} permissionKey="reports" can="read" />} />
          <Route path="/assets_report" element={<ProtectedRoute element={<AssetReport />} permissionKey="reports" can="read" />} />

          {/* Assets & Locations */}
          <Route path="/assets" element={<ProtectedRoute element={<Assets />} permissionKey="products" can="read" />} />
          <Route path="/assets_type" element={<ProtectedRoute element={<AssetType />} permissionKey="products" can="read" />} />
          <Route path="/location" element={<ProtectedRoute element={<Location />} permissionKey="branches" can="read" />} />

          {/* Administration & RBAC */}
          <Route path="/permission" element={<ProtectedRoute element={<Permissions />} permissionKey="permissions" can="read" />} />
          <Route path="/role" element={<ProtectedRoute element={<Role />} permissionKey="permissions" can="read" />} />
          <Route path="/modules" element={<ProtectedRoute element={<Module />} permissionKey="permissions" can="read" />} />
          <Route path="/module/update/:id" element={<ProtectedRoute element={<Module />} permissionKey="permissions" can="read" />} />

          {/* Profile & Fallback */}
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/404" element={<Error />} />
          <Route path="*" element={<Error />} />
        </Routes>
      </div>
    </Router>
  </div>
);

export default App;
