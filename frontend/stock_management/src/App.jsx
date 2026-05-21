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

const App = () => (
  <div className='container-fluid p-0 m-0'>
    <Router>
      <div style={{ backgroundColor: '#ecf0f4' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<HomePage />} />

          {/* ✅ Users routes with permission control */}
          <Route
            path="/AddUser"
            element={
              <ProtectedRoute
                element={<User />}
                permissionKey="users"
                can="add"
              />
            }
          />

          <Route
            path="/user"
            element={
              <ProtectedRoute
                element={<User />}
                permissionKey="users"
                can="read"
              />
            }
          />

          <Route
            path="/user/update/:id"
            element={
              <ProtectedRoute
                element={<User />}
                permissionKey="users"
                can="edit"
              />
            }
          />

          {/* Other routes remain same */}
          <Route path="/addmultiprovision" element={<AddMultipleProvision />} />
          <Route path="/assets_report" element={<AssetReport />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/assets_type" element={<AssetType />} />
          <Route path="/location" element={<Location />} />
          <Route path="/low_stock" element={<LowStockReport />} />
          <Route path="/monthly_report" element={<MonthlyReport />} />
          <Route path="/yearly_report" element={<YearlyReport />} />
          <Route path="/inventory_report" element={<InventoryReport />} />
          <Route path="/employee" element={<Employee />} />
          <Route path="/branch" element={<Branch />} />
          <Route path="/role" element={<Role />} />
          <Route path="/product" element={<Product />} />
          <Route path="/productCategory" element={<ProductCategory />} />
          <Route path="/vendor" element={<Vendor />} />
          <Route path="/issue" element={<Issue />} />
          <Route path="/order" element={<Order />} />
          <Route path="/addOrder" element={<AddOrder />} />
          <Route path="/order/update/:id" element={<AddOrder />} />
          <Route path="/orderLineItem" element={<OrderLineItem />} />
          <Route path="/addOrderLineItem" element={<AddOrderLineItem />} />
          <Route path="/orderLineItem/update/:id" element={<AddOrderLineItem />} />
          <Route path="/profile" element={<Profile />} />

          <Route
            path="/permission"
            element={
              <ProtectedRoute
                element={<Permissions />}
                permissionKey="Permission"
                can="read"
              />
            }
          />

          <Route path="/productDetailPage/:id" element={<ProductDetailPage />} />
          <Route path="/orderDetailPage/:id" element={<OrderDetailPage />} />
          <Route path="/userDetailPage/:id" element={<UserDetailPage />} />
          <Route path="/vendorDetailPage/:id" element={<VendorDetailPage />} />
          <Route path="/issueDetailPage/:id" element={<IssuedDetailPage />} />
          <Route path="/modules" element={<Module />} />
          <Route path="/module/update/:id" element={<Module />} />
          <Route path="/404" element={<Error />} />
          <Route path="*" element={<Error />} />
        </Routes>
      </div>
    </Router>
  </div>
);

export default App;
