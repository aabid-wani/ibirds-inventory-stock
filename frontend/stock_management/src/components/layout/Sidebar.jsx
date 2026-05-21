import React, { useContext, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { AuthContext } from "../context/AuthProvider";
import { Image } from "react-bootstrap";
import '../css/Sidebar.css';
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from "cdbreact";

export default function Sidebar() {
  const { permissions, sidebarVisibility } = useContext(AuthContext);
  const [dropdownOpen1, setDropdownOpen1] = useState(false);
  const [dropdownOpen2, setDropdownOpen2] = useState(false);
  const [dropdownOpen3, setDropdownOpen3] = useState(false);

  const toggleReports = () => setDropdownOpen1(!dropdownOpen1);
  const toggleDropdown = () => setDropdownOpen2(!dropdownOpen2);
  const toggleDropdown1 = () => setDropdownOpen3(!dropdownOpen3);

  const isSidebarVisible = sidebarVisibility;

  const styles = {
    fa_icon: { marginLeft: "auto", fontSize: "12px"},
  };
  
  const hasUpdatePermission = permissions?.some(
    (role) => role.name === "Admin" || role.name === "Super Admin"
  );

  
  const usersModulePermission = permissions?.some(
    (role) => role.module_name === "users" && role.view
  );

  console.log("usersModulePermission:", usersModulePermission);
  

  return (
    <div className="fontFamilyDesign" style={{ display: "flex" }}>
      {isSidebarVisible && (
        <CDBSidebar
          style={{
            position: "sticky",
            top: 0,
            left: 0,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            width: "250px",
            height: "100vh",
            overflowY: "auto",
            zIndex: 1000,
            background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
            color:" #ecf0f1ff", /* light text for contrast */
            boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
          }}
        >
          <CDBSidebarHeader >
            <Image
              src="/images/ibirds_logo.png"
              style={{ height: "200px" }}
            />
            <b className="logoStyle">
              Inventory Management
            </b>
          </CDBSidebarHeader>

          <CDBSidebarContent className="sidebar-content" style={{
              flex: 1,
              overflowY: "auto",
              paddingBottom: "20px",
            }} >
            <CDBSidebarMenu className="sidebar-menu">
              <Link exact to={`/Home`} activeClassName="activeClicked">
                <CDBSidebarMenuItem className="sidebarItem navItems" >
                  <i className="fa fa-home sidebarIcon" style={{ marginRight: "9px",}}></i>
                  Home
                </CDBSidebarMenuItem>
              </Link>

              {usersModulePermission ? (
                <NavLink exact to="/user" activeClassName="activeClicked">
                  <CDBSidebarMenuItem className="sidebarItem navItems">
                    <i className="fa fa-user sidebarIcon"></i>
                    Users
                  </CDBSidebarMenuItem>
                </NavLink>
              ): <></>}

              <NavLink exact to="/employee" activeClassName="activeClicked">
                <CDBSidebarMenuItem className="sidebarItem navItems" >
                  <i className="fa fa-user sidebarIcon" ></i>
                  Employees
                </CDBSidebarMenuItem>
              </NavLink>

              <NavLink exact to="/branch" activeClassName="activeClicked">
                <CDBSidebarMenuItem className="sidebarItem navItems">
                  <i className="fa fa-building sidebarIcon"></i>
                  Branches
                </CDBSidebarMenuItem>
              </NavLink>

              <NavLink exact to="/productCategory" activeClassName="activeClicked">
                <CDBSidebarMenuItem className="sidebarItem navItems" >
                  <i className="fa-solid fa-layer-group sidebarIcon" style={{ fontSize: "11px" }}></i>
                  Categories
                </CDBSidebarMenuItem>
              </NavLink>

              <NavLink exact to="/product" activeClassName="activeClicked">
                <CDBSidebarMenuItem className="sidebarItem navItems">
                  <i className="fa-brands fa-product-hunt sidebarIcon"></i>
                  Products
                </CDBSidebarMenuItem>
              </NavLink>

              <NavLink exact to="/order" activeClassName="activeClicked">
                <CDBSidebarMenuItem className="sidebarItem navItems" >
                  <i className="fa fa-list sidebarIcon" ></i>
                  Purchases
                </CDBSidebarMenuItem>
              </NavLink>

              <NavLink exact to="/vendor" activeClassName="activeClicked">
                <CDBSidebarMenuItem className="sidebarItem navItems" >
                  <i className="fa fa-store sidebarIcon" style={{ fontSize: "11px"}}></i>
                  Vendors
                </CDBSidebarMenuItem>
              </NavLink>

              <NavLink exact to="/issue" activeClassName="activeClicked">
                <CDBSidebarMenuItem className="sidebarItem navItems">
                  <i className="fa fa-hand-holding sidebarIcon" ></i>
                  Provision
                </CDBSidebarMenuItem>
              </NavLink>

              {hasUpdatePermission ? (
                <>
                  <CDBSidebarMenuItem
                    subMenu
                    title="Reports"
                    onClick={toggleReports}
                    className="sidebar-menu sidebarItem navItems"
                    style={{ fontSize: "10px" }}
                  >
                    <i className="fa fa-chart-bar sidebarIcon" ></i>
                    Reports
                    <i className={`fa fa-chevron-${dropdownOpen1 ? "up" : "down"}`} style={styles.fa_icon}></i>
                  </CDBSidebarMenuItem>

                  {dropdownOpen1 && (
                    <div className="dropdown" style={{ marginLeft: "20px" }}>
                      <NavLink exact to="/monthly_report" activeClassName="activeClicked">
                        <CDBSidebarMenuItem className="navItems" >
                          <i className="fa fa-calendar-alt sidebarIcon" style={{ fontSize: "11px" }}></i>
                          Monthly Report
                        </CDBSidebarMenuItem>
                      </NavLink>
                      <NavLink exact to="/yearly_report" activeClassName="activeClicked">
                        <CDBSidebarMenuItem className="navItems">
                          <i className="fa fa-calendar sidebarIcon" style={{ fontSize: "11px" }}></i>
                          Yearly Report
                        </CDBSidebarMenuItem>
                      </NavLink>
                      <NavLink exact to="/inventory_report" activeClassName="activeClicked">
                        <CDBSidebarMenuItem className="navItems" >
                          <i className="fa fa-file-alt sidebarIcon" ></i>
                          Inventory Report
                        </CDBSidebarMenuItem>
                      </NavLink>
                      <NavLink exact to="/low_stock" activeClassName="activeClicked">
                        <CDBSidebarMenuItem className="navItems" >
                          <i className="fa fa-list-ol sidebarIcon"></i>
                          Low Stock Report
                        </CDBSidebarMenuItem>
                      </NavLink>
                      <NavLink exact to="/assets_report" activeClassName="activeClicked">
                        <CDBSidebarMenuItem className="navItems">
                          <i className="fa fa-list-ol sidebarIcon" ></i>
                          Assets Report
                        </CDBSidebarMenuItem>
                      </NavLink>
                    </div>
                  )}
                </>
              ): <></> }

              {usersModulePermission ? (
                <>
                  <CDBSidebarMenuItem
                    subMenu
                    title="Permissions"
                    onClick={toggleDropdown}
                    className="sidebar-menu sidebarItem navItems"
                    style={{ fontSize: "10px" }}
                  >
                    <i className="fa fa-tasks sidebarIcon" ></i>
                    Settings
                    <i className={`fa fa-chevron-${dropdownOpen2 ? "up" : "down"}`} style={styles.fa_icon}></i>
                  </CDBSidebarMenuItem>
                  {dropdownOpen2 && (
                    <div className="dropdown" style={{ marginLeft: "20px" }}>
                      <NavLink exact to="/permission" activeClassName="activeClicked">
                        <CDBSidebarMenuItem className="navItems" >
                          <i className="fa fa-lock sidebarIcon" style={{ fontSize: "11px"}}></i>
                          Permissions
                        </CDBSidebarMenuItem>
                      </NavLink>
                      <NavLink exact to="/Role" activeClassName="activeClicked">
                        <CDBSidebarMenuItem className="navItems">
                          <i className="fa fa-users sidebarIcon" style={{ fontSize: "11px"}}></i>
                          Roles
                        </CDBSidebarMenuItem>
                      </NavLink>
                      <NavLink exact to="/modules" activeClassName="activeClicked">
                        <CDBSidebarMenuItem className="navItems" >
                          <i className="fa fa-list-alt sidebarIcon"></i>
                          Modules
                        </CDBSidebarMenuItem>
                      </NavLink>
                    </div>
                  )}
                </>
              ) : <></>}

              {hasUpdatePermission ? (
                <>
                  <CDBSidebarMenuItem
                    subMenu
                    title="Assets"
                    onClick={toggleDropdown1}
                    className="sidebar-menu sidebarItem navItems"
                    style={{ fontSize: "10px"}}
                  >
                    <i className="fa-solid fa-boxes-stacked sidebarIcon"></i>
                    Assets
                    <i className={`fa fa-chevron-${dropdownOpen3 ? "up" : "down"}`} style={styles.fa_icon}></i>
                  </CDBSidebarMenuItem>
                  {dropdownOpen3 && (
                    <div className="dropdown" style={{ marginLeft: "20px" }}>
                      <NavLink exact to="/location" activeClassName="activeClicked">
                        <CDBSidebarMenuItem className="navItems" >
                          <i className="fa-solid fa-location-dot sidebarIcon" style={{ fontSize: "11px" }}></i>
                          Locations
                        </CDBSidebarMenuItem>
                      </NavLink>
                      <NavLink exact to="/assets_type" activeClassName="activeClicked">
                        <CDBSidebarMenuItem className="navItems">
                          <i className="fa-solid fa-folder-tree sidebarIcon" style={{ fontSize: "11px" }}></i>
                          Assets Types
                        </CDBSidebarMenuItem>
                      </NavLink>
                      <NavLink exact to="/assets" activeClassName="activeClicked">
                        <CDBSidebarMenuItem className="navItems" >
                          <i className="fa-solid fa-toolbox sidebarIcon" ></i>
                          Assets
                        </CDBSidebarMenuItem>
                      </NavLink>
                    </div>
                  )}
                </>
              ) : <></> }
            </CDBSidebarMenu>
          </CDBSidebarContent>

          <CDBSidebarFooter style={{
              flexShrink: 0,
              textAlign: "center",
              background: "rgba(255,255,255,0.05)",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              padding: "10px 5px",
            }}>
            <div style={{ padding: "20px 5px", }}>
              <p>Copyright © 2025</p>
              <p>iBirds Software Services Pvt.</p>
                  
            </div>
          </CDBSidebarFooter>
        </CDBSidebar>
      )}
    </div>
  );
}
