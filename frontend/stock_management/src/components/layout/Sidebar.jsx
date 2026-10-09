import React, { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { AuthContext } from "../context/AuthProvider";

export default function Sidebar() {
  const { sidebarVisibility, hasPermission, loginData } = useContext(AuthContext);
  const [openServices, setOpenServices] = useState(true);
  const [openReports, setOpenReports] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openAssets, setOpenAssets] = useState(false);

  const canViewUsers = loginData?.role_name === 'Super Admin';
  const canViewEmployees = hasPermission('employees', 'view');
  const canViewBranches = hasPermission('branches', 'view');
  const canViewCategories = hasPermission('productCategory', 'view');
  const canViewProducts = hasPermission('products', 'view');
  const canViewOrders = hasPermission('orders', 'view');
  const canViewVendors = hasPermission('vendors', 'view');
  const canViewProvisions = hasPermission('provisions', 'view');
  const canViewReports = hasPermission('reports', 'view') || hasPermission('monthly reports', 'view');
  const canViewPermissions = (loginData?.role_name === 'System Admin' || loginData?.role_name === 'Super Admin') && hasPermission('permissions', 'view');
  const canViewFixedAssets = (hasPermission('products', 'view') || hasPermission('branches', 'view')) && (loginData?.role_name === 'Super Admin' || loginData?.role_name === 'Admin');
  const hasInventoryOps = canViewCategories || canViewProducts || canViewOrders || canViewVendors || canViewProvisions;

  if (!sidebarVisibility) return null;

  return (
    <>
      <style>{`
        /* Global Layout Integration */
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .wrapper {
          display: flex;
          width: 100%;
          align-items: stretch;
          min-height: 100vh;
        }
        #content {
          flex: 1;
          min-height: 100vh;
          overflow-x: hidden;
          background: #f8fafc;
        }
        @media (max-width: 768px) {
          #content {
            margin-left: 0;
          }
        }

        /* Sidebar Base */
        .sb-root {
          width: 250px;
          min-height: 100vh;
          height: 100vh;
          position: sticky;
          top: 0;
          left: 0;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: #0f172a;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
          z-index: 1000;
          overflow: hidden;
        }

        /* Brand & Logo Header */
        .sb-brand {
          padding: 18px 14px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          background: #0f172a;
          flex-shrink: 0;
          text-align: center;
        }
        .sb-logo-card {
          width: 100%;
          background: #0f172a;
          border-radius: 14px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .sb-logo-card:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.16);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
        }
        .sb-logo-card img {
          max-width: 100%;
          height: 110px;
          object-fit: contain;
          display: block;
        }
        .sb-brand-meta {
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .sb-brand-title {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #e8dede;
          text-transform: uppercase;
          line-height: 1.2;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sb-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          display: inline-block;
        }
        .sb-brand-subtitle {
          font-size: 10.5px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* Navigation & Scrolling */
        .sb-nav {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          padding: 12px 10px 24px;
        }
        .sb-nav::-webkit-scrollbar { 
          width: 5px; 
        }
        .sb-nav::-webkit-scrollbar-track { 
          background: rgba(0, 0, 0, 0.15); 
          border-radius: 4px;
        }
        .sb-nav::-webkit-scrollbar-thumb { 
          background: rgba(255, 255, 255, 0.18); 
          border-radius: 4px; 
        }
        .sb-nav::-webkit-scrollbar-thumb:hover { 
          background: rgba(255, 255, 255, 0.35); 
        }

        /* Section Headings */
        .sb-section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #bcd4f5;
          padding: 16px 12px 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Navigation Links */
        .sb-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
          border-radius: 8px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          transition: all 0.18s ease;
          margin-bottom: 2px;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          position: relative;
        }
        .sb-link:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
          transform: translateX(2px);
        }
        .sb-link.active {
          background: linear-gradient(90deg, rgba(83, 74, 183, 0.35) 0%, rgba(83, 74, 183, 0.1) 100%);
          color: #ffffff;
          font-weight: 600;
          border-left: 3px solid #818cf8;
        }
        .sb-link.active .sb-icon {
          color: #a5b4fc;
        }
        .sb-icon {
          width: 18px;
          text-align: center;
          font-size: 14px;
          color: #64748b;
          flex-shrink: 0;
          transition: color 0.18s;
        }
        .sb-link:hover .sb-icon { 
          color: #cbd5e1; 
        }

        /* Dropdowns & Chevron */
        .sb-chevron {
          margin-left: auto;
          font-size: 10px;
          color: #64748b;
          transition: transform 0.2s ease;
        }
        .sb-chevron.open { 
          transform: rotate(180deg); 
          color: #cbd5e1;
        }
        .sb-submenu {
          margin: 3px 0 5px 16px;
          padding-left: 12px;
          border-left: 1.5px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        .sb-submenu .sb-link {
          padding: 8px 10px;
          font-size: 12.5px;
        }

        /* Footer Area */
        .sb-footer {
          flex-shrink: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px 18px;
          background: rgba(0, 0, 0, 0.15);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sb-footer-info {
          font-size: 11px;
          color: #64748b;
          line-height: 1.4;
        }
        .sb-badge-version {
          font-size: 10px;
          font-weight: 600;
          color: #818cf8;
          background: rgba(129, 140, 248, 0.15);
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid rgba(129, 140, 248, 0.25);
        }
      `}</style>

      <aside className="sb-root">
        {/* Brand & Logo */}
        <div className="sb-brand">
          <div className="sb-logo-card">
            <img
              src="/images/ibirds_logo_dark_theme.png"
              alt="iBirds Services - Implement Thinking"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/ibirds_logo.png";
              }}
            />
          </div>
          <div className="sb-brand-meta">
            <span className="sb-brand-title">
              iBirds Inventory
            </span>
          </div>
         
        </div>

        {/* Navigation Menu */}
        <nav className="sb-nav">
          <div className="sb-section-label">Main Hub</div>

          <NavLink to="/Home" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
            <i className="fa-solid fa-gauge-high sb-icon"></i> Dashboard
          </NavLink>

          {canViewUsers && (
            <NavLink to="/user" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
              <i className="fa-solid fa-users-gear sb-icon"></i> System Users
            </NavLink>
          )}

          {canViewEmployees && (
            <NavLink to="/employee" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
              <i className="fa-solid fa-user-tie sb-icon"></i> Employees
            </NavLink>
          )}

          {canViewBranches && (
            <NavLink to="/branch" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
              <i className="fa-solid fa-building-columns sb-icon"></i> Branches
            </NavLink>
          )}

          {hasInventoryOps && (
            <>
              <div className="sb-section-label">Inventory Ops</div>

              {canViewCategories && (
                <NavLink to="/productCategory" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                  <i className="fa-solid fa-layer-group sb-icon"></i> Categories
                </NavLink>
              )}

              {canViewProducts && (
                <NavLink to="/product" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                  <i className="fa-solid fa-boxes-stacked sb-icon"></i> Products & Stock
                </NavLink>
              )}

              {canViewOrders && (
                <NavLink to="/order" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                  <i className="fa-solid fa-cart-shopping sb-icon"></i> Purchases (POs)
                </NavLink>
              )}

              {canViewVendors && (
                <NavLink to="/vendor" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                  <i className="fa-solid fa-store sb-icon"></i> Suppliers & Vendors
                </NavLink>
              )}

              {canViewProvisions && (
                <NavLink to="/issue" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                  <i className="fa-solid fa-hand-holding-dollar sb-icon"></i> Provisions & Issues
                </NavLink>
              )}
            </>
          )}

          {/* Services */}
          <div className="sb-section-label">Services</div>

          <button className="sb-link" onClick={() => setOpenServices(!openServices)}>
            <i className="fa-solid fa-handshake-angle sb-icon"></i>
            Services
            <i className={`fa-solid fa-chevron-down sb-chevron${openServices ? " open" : ""}`}></i>
          </button>
          {openServices && (
            <div className="sb-submenu">
              <NavLink to="/service_provider" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                <i className="fa-solid fa-truck-fast sb-icon"></i> Service Providers
              </NavLink>
            </div>
          )}

          {/* Analytics & Reports */}
          {canViewReports && (
            <>
              <div className="sb-section-label">Intelligence</div>

              <button className="sb-link" onClick={() => setOpenReports(!openReports)}>
                <i className="fa-solid fa-chart-pie sb-icon"></i>
                Analytics & Reports
                <i className={`fa-solid fa-chevron-down sb-chevron${openReports ? " open" : ""}`}></i>
              </button>
              {openReports && (
                <div className="sb-submenu">
                  {hasPermission('monthly reports', 'view') && (
                    <NavLink to="/monthly_report" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                      <i className="fa-regular fa-calendar-days sb-icon"></i> Monthly Report
                    </NavLink>
                  )}
                  {hasPermission('reports', 'view') && (
                    <>
                      <NavLink to="/yearly_report" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                        <i className="fa-regular fa-calendar sb-icon"></i> Yearly Report
                      </NavLink>
                      <NavLink to="/inventory_report" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                        <i className="fa-solid fa-file-invoice-dollar sb-icon"></i> Valuation Report
                      </NavLink>
                      <NavLink to="/low_stock" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                        <i className="fa-solid fa-triangle-exclamation sb-icon text-warning"></i> Low Stock Alerts
                      </NavLink>
                      <NavLink to="/assets_report" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                        <i className="fa-solid fa-file-shield sb-icon"></i> Asset Audit
                      </NavLink>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Settings & Access Control */}
          {canViewPermissions && (
            <>
              <div className="sb-section-label">Administration</div>

              <button className="sb-link" onClick={() => setOpenSettings(!openSettings)}>
                <i className="fa-solid fa-sliders sb-icon"></i>
                Settings & RBAC
                <i className={`fa-solid fa-chevron-down sb-chevron${openSettings ? " open" : ""}`}></i>
              </button>
              {openSettings && (
                <div className="sb-submenu">
                  <NavLink to="/permission" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa-solid fa-shield-halved sb-icon"></i> Permissions Matrix
                  </NavLink>
                  <NavLink to="/Role" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa-solid fa-user-shield sb-icon"></i> Roles & Privileges
                  </NavLink>
                  <NavLink to="/modules" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa-solid fa-cubes sb-icon"></i> System Modules
                  </NavLink>
                </div>
              )}
            </>
          )}

          {/* Asset Management */}
          {canViewFixedAssets && (
            <>
              <div className="sb-section-label">Fixed Assets</div>

              <button className="sb-link" onClick={() => setOpenAssets(!openAssets)}>
                <i className="fa-solid fa-laptop-file sb-icon"></i>
                Asset Registry
                <i className={`fa-solid fa-chevron-down sb-chevron${openAssets ? " open" : ""}`}></i>
              </button>
              {openAssets && (
                <div className="sb-submenu">
                  <NavLink to="/location" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa-solid fa-location-dot sb-icon"></i> Locations
                  </NavLink>
                  <NavLink to="/assets_type" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa-solid fa-folder-tree sb-icon"></i> Asset Categories
                  </NavLink>
                  <NavLink to="/assets" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa-solid fa-toolbox sb-icon"></i> Asset Items
                  </NavLink>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <div className="sb-footer-info">
            <div style={{ color: "#cbd5e1", fontWeight: "600" }}>iBirds Software Services Pvt. Ltd <span>© {new Date().getFullYear()}</span></div>
          </div>
         
        </div>
      </aside>
    </>
  );
}