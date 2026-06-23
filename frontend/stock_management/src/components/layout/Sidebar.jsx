import React, { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { AuthContext } from "../context/AuthProvider";

export default function Sidebar() {
  const { permissions, sidebarVisibility } = useContext(AuthContext);
  const [openReports, setOpenReports] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openAssets, setOpenAssets] = useState(false);

  const hasUpdatePermission = permissions?.some(
    (role) => role.name === "Admin" || role.name === "Super Admin"
  );
  const usersModulePermission = permissions?.some(
    (role) => role.module_name === "users" && role.view
  );

  if (!sidebarVisibility) return null;

  return (
    <>
      <style>{`
        /* Global Layout Integration */
        body {
          margin: 0;
          padding: 0;
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
          background: #f6f7fb;
        }
        @media (max-width: 768px) {
          #content {
            margin-left: 0;
          }
        }

        /* Sidebar Base */
        .sb-root {
          width: 240px;
          min-height: 100vh;
          height: 100vh;
          position: sticky;
          top: 0;
          left: 0;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: #1e2128;
          z-index: 1000;
          overflow: hidden;
        }
        .sb-logo {
          padding: 20px 16px 14px;
          border-bottom: 0.5px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .sb-logo img {
          width: 100%;
          height: 150px;
          object-fit: contain;
          border-radius: 8px;
          display: block;
          margin-bottom: 10px;
        }
        .sb-logo-label {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(241, 189, 189, 0.4);
        }

        /* Navigation & Scrolling */
        .sb-nav {
          flex: 1;
          overflow-y: auto;
          min-height: 0; /* CRITICAL: Allows flex child to scroll properly */
          padding: 10px 10px 20px;
        }

        /* Visible Scrollbar Styling */
        .sb-nav::-webkit-scrollbar { 
          width: 6px; 
        }
        .sb-nav::-webkit-scrollbar-track { 
          background: rgba(0, 0, 0, 0.15); 
          border-radius: 4px;
        }
        .sb-nav::-webkit-scrollbar-thumb { 
          background: rgba(255, 255, 255, 0.25); 
          border-radius: 4px; 
        }
        .sb-nav::-webkit-scrollbar-thumb:hover { 
          background: rgba(255, 255, 255, 0.4); 
        }

        /* Links & Typoography */
        .sb-section-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          padding: 14px 8px 6px;
        }
        .sb-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-size: 13px;
          font-weight: 400;
          transition: background 0.15s, color 0.15s;
          margin-bottom: 1px;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }
        .sb-link:hover {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.9);
        }
        .sb-link.active {
          background: rgba(83,74,183,0.25);
          color: #a89ff5;
        }
        .sb-link.active .sb-icon {
          color: #a89ff5;
        }
        .sb-icon {
          width: 16px;
          text-align: center;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .sb-link:hover .sb-icon { color: rgba(255,255,255,0.7); }
        .sb-chevron {
          margin-left: auto;
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          transition: transform 0.2s;
        }
        .sb-chevron.open { transform: rotate(180deg); }
        .sb-submenu {
          margin: 2px 0 2px 14px;
          padding-left: 14px;
          border-left: 0.5px solid rgba(255,255,255,0.1);
          overflow: hidden;
        }
        .sb-submenu .sb-link {
          padding: 7px 10px;
          font-size: 12px;
        }

        /* Footer */
        .sb-footer {
          flex-shrink: 0;
          border-top: 0.5px solid rgba(255,255,255,0.07);
          padding: 14px 16px;
        }
        .sb-footer p {
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          margin: 0;
          line-height: 1.6;
        }
      `}</style>

      <aside className="sb-root">

        {/* Logo */}
        <div className="sb-logo">
          <img src="/images/ibirds_logo.png" alt="iBirds logo" />
          <div className="sb-logo-label">Inventory Stock</div>
        </div>

        {/* Navigation */}
        <nav className="sb-nav">

          <div className="sb-section-label">Main</div>

          <NavLink to="/Home" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
            <i className="fa fa-home sb-icon"></i> Home
          </NavLink>

          {usersModulePermission && (
            <NavLink to="/user" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
              <i className="fa fa-user sb-icon"></i> Users
            </NavLink>
          )}

          <NavLink to="/employee" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
            <i className="fa fa-user-tie sb-icon"></i> Employees
          </NavLink>

          <NavLink to="/branch" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
            <i className="fa fa-building sb-icon"></i> Branches
          </NavLink>

          <div className="sb-section-label">Inventory</div>

          <NavLink to="/productCategory" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
            <i className="fa-solid fa-layer-group sb-icon"></i> Categories
          </NavLink>

          <NavLink to="/product" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
            <i className="fa-brands fa-product-hunt sb-icon"></i> Products
          </NavLink>

          <NavLink to="/order" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
            <i className="fa fa-cart-plus sb-icon"></i> Purchases
          </NavLink>

          <NavLink to="/vendor" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
            <i className="fa fa-store sb-icon"></i> Vendors
          </NavLink>

          <NavLink to="/issue" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
            <i className="fa fa-hand-holding sb-icon"></i> Provision
          </NavLink>

          {/* Reports dropdown */}
          {hasUpdatePermission && (
            <>
              <div className="sb-section-label">Analytics</div>

              <button className="sb-link" onClick={() => setOpenReports(!openReports)}>
                <i className="fa fa-chart-bar sb-icon"></i>
                Reports
                <i className={`fa fa-chevron-down sb-chevron${openReports ? " open" : ""}`}></i>
              </button>
              {openReports && (
                <div className="sb-submenu">
                  <NavLink to="/monthly_report" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa fa-calendar-alt sb-icon"></i> Monthly
                  </NavLink>
                  <NavLink to="/yearly_report" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa fa-calendar sb-icon"></i> Yearly
                  </NavLink>
                  <NavLink to="/inventory_report" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa fa-file-alt sb-icon"></i> Inventory
                  </NavLink>
                  <NavLink to="/low_stock" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa fa-exclamation-triangle sb-icon"></i> Low Stock
                  </NavLink>
                  <NavLink to="/assets_report" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa fa-file-invoice sb-icon"></i> Assets Report
                  </NavLink>
                </div>
              )}
            </>
          )}

          {/* Settings dropdown */}
          {usersModulePermission && (
            <>
              <div className="sb-section-label">Admin</div>

              <button className="sb-link" onClick={() => setOpenSettings(!openSettings)}>
                <i className="fa fa-sliders-h sb-icon"></i>
                Settings
                <i className={`fa fa-chevron-down sb-chevron${openSettings ? " open" : ""}`}></i>
              </button>
              {openSettings && (
                <div className="sb-submenu">
                  <NavLink to="/permission" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa fa-lock sb-icon"></i> Permissions
                  </NavLink>
                  <NavLink to="/Role" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa fa-users sb-icon"></i> Roles
                  </NavLink>
                  <NavLink to="/modules" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa fa-th-large sb-icon"></i> Modules
                  </NavLink>
                </div>
              )}
            </>
          )}

          {/* Assets dropdown */}
          {hasUpdatePermission && (
            <>
              <button className="sb-link" onClick={() => setOpenAssets(!openAssets)}>
                <i className="fa-solid fa-boxes-stacked sb-icon"></i>
                Assets
                <i className={`fa fa-chevron-down sb-chevron${openAssets ? " open" : ""}`}></i>
              </button>
              {openAssets && (
                <div className="sb-submenu">
                  <NavLink to="/location" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa-solid fa-location-dot sb-icon"></i> Locations
                  </NavLink>
                  <NavLink to="/assets_type" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa-solid fa-folder-tree sb-icon"></i> Asset Types
                  </NavLink>
                  <NavLink to="/assets" className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}>
                    <i className="fa-solid fa-toolbox sb-icon"></i> Assets
                  </NavLink>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <p>Copyright © {new Date().getFullYear()}</p>
          <p>iBirds Software Services Pvt.</p>
        </div>
      </aside>
    </>
  );
}