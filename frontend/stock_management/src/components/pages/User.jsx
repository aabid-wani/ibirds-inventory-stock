import React, { useContext, useEffect, useState, useMemo } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  InputGroup,
  Container,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import Main from "../layout/Main";
import { TextField, InputAdornment } from "@mui/material";
import { AuthContext } from "../context/AuthProvider";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PURPLE = "#534AB7";
const TEAL = "#1D9E75";
const CORAL = "#D85A30";

export default function User() {
  const [users, setUsers] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive' | 'admin'
  const [showModal, setShowModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [validated, setValidated] = useState(false);
  const navigate = useNavigate();
  const { permissions, loginData, hasPermission } = useContext(AuthContext);

  const [currentUser, setCurrentUser] = useState({
    name: "",
    contact: "",
    email: "",
    role_id: "",
    user_name: "",
    status: "active",
    branch_id: "",
    password: "",
    created_by: loginData?.id || null,
  });

  const hasAddPermission = hasPermission('users', 'add');
  const hasEditPermission = hasPermission('users', 'edit');
  const hasDeletePermission = hasPermission('users', 'del');

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [rolesData, branchData] = await Promise.all([
          stockManagementApis.getRoles(),
          stockManagementApis.getBranch(),
        ]);
        setRoles(rolesData || []);
        setBranches(branchData || []);
      } catch (error) {
        console.error("Error fetching roles/branches", error);
      }
    };
    fetchDropdowns();
  }, []);

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getUsers();
      setUsers(result || []);
    } catch (error) {
      setUsers([]);
      console.error("Error fetching users", error);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = filterText.toLowerCase();
      const matchSearch =
        !filterText ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.contact && u.contact.toString().includes(q)) ||
        (u.role_name && u.role_name.toLowerCase().includes(q)) ||
        (u.branch_name && u.branch_name.toLowerCase().includes(q));

      const isActive = u.status === "active" || u.status === true;
      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "inactive" && isActive) return false;
      if (statusFilter === "admin" && !(u.role_name && u.role_name.toLowerCase().includes("admin"))) return false;

      return matchSearch;
    });
  }, [users, filterText, statusFilter]);

  // KPI calculations
  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.status === "active" || u.status === true).length;
  const adminCount = users.filter((u) => u.role_name && u.role_name.toLowerCase().includes("admin")).length;
  const branchUserCount = users.filter((u) => u.branch_name).length;

  const exportToExcel = () => {
    const dataToExport = filteredUsers.map((u, idx) => ({
      "S.No": idx + 1,
      "Full Name": u.name,
      "Email Address": u.email,
      "Contact": u.contact,
      "Role": u.role_name,
      "Assigned Branch": u.branch_name || "Head Office",
      "Status": u.status === "active" || u.status === true ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Users_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setIsUpdate(false);
    setCurrentUser({
      name: "",
      contact: "",
      email: "",
      role_id: "",
      user_name: "",
      status: "active",
      branch_id: "",
      password: "",
      created_by: loginData?.id || null,
    });
    setValidated(false);
    setContactError(false);
  };

  const handleModalShow = () => setShowModal(true);

  const handleUpdateClick = (user) => {
    setCurrentUser({
      ...user,
      status: user.status === true || user.status === "active" ? "active" : "inactive",
    });
    setIsUpdate(true);
    setShowModal(true);
  };

  const generatePassword = () => {
    const prefix = (currentUser.name || "User").replace(/\s+/g, "").substring(0, 4);
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const autoPass = `${prefix}@${randomDigits}`;
    setCurrentUser((prev) => ({ ...prev, password: autoPass }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "contact") {
      setContactError(value.length > 10);
    }
    setCurrentUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.checkValidity() === false || contactError) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      if (isUpdate) {
        const payload = { ...currentUser, updated_by: loginData?.id || null };
        const result = await stockManagementApis.updateUser(currentUser.id, payload);
        if (result.success) {
          toast.success("User updated successfully");
        } else {
          toast.error(result.message || "Failed to update user");
        }
      } else {
        const payload = { ...currentUser, created_by: loginData?.id || null };
        const result = await stockManagementApis.createUser(payload);
        if (result.success) {
          toast.success("User registered successfully");
        } else {
          toast.error(result.message || "Failed to register user");
        }
      }
      handleModalClose();
      handleGetData();
    } catch (error) {
      toast.error("Operation failed. Check server connection.");
    }
  };

  const deleteHandleRecord = async (id) => {
    if (window.confirm("Are you sure you want to deactivate or remove this user?")) {
      try {
        await stockManagementApis.deleteUserById(id);
        toast.success("User deleted successfully");
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } catch (error) {
        toast.error("Error deleting user record");
      }
    }
  };

  const columns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      width: "70px",
    },
    {
      name: "User Identity",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div style={{ padding: "6px 0" }}>
          <Link
            to={`/userDetailPage/${row.id}`}
            style={{ fontWeight: 600, color: PURPLE, textDecoration: "none", fontSize: "13.5px" }}
          >
            {row.name}
          </Link>
          <div style={{ fontSize: "11.5px", color: "#64748b" }}>
            <i className="fa-regular fa-envelope me-1"></i> {row.email}
          </div>
        </div>
      ),
    },
    {
      name: "Role & Privileges",
      selector: (row) => row.role_name,
      sortable: true,
      cell: (row) => (
        <span
          style={{
            fontSize: "11.5px",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: "6px",
            background: row.role_name?.toLowerCase().includes("admin") ? "#eeedfe" : "#f1f5f9",
            color: row.role_name?.toLowerCase().includes("admin") ? PURPLE : "#334155",
            border: `1px solid ${row.role_name?.toLowerCase().includes("admin") ? "#c7d2fe" : "#e2e8f0"}`,
          }}
        >
          {row.role_name || "Staff"}
        </span>
      ),
    },
    {
      name: "Assigned Branch",
      selector: (row) => row.branch_name,
      sortable: true,
      cell: (row) => (
        <span style={{ fontSize: "12.5px", color: "#334155" }}>
          <i className="fa-solid fa-building-columns me-1" style={{ color: "#94a3b8" }}></i>
          {row.branch_name || "Head Office Ajmer"}
        </span>
      ),
    },
    {
      name: "Contact Phone",
      selector: (row) => row.contact,
      cell: (row) => (
        <span style={{ fontSize: "12.5px", color: "#475569" }}>
          <i className="fa-solid fa-phone me-1" style={{ color: "#94a3b8", fontSize: "11px" }}></i>
          {row.contact || "—"}
        </span>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        const isActive = row.status === "active" || row.status === true;
        return (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "99px",
              background: isActive ? "#dcfce7" : "#fee2e2",
              color: isActive ? "#15803d" : "#b91c1c",
            }}
          >
            {isActive ? "ACTIVE" : "INACTIVE"}
          </span>
        );
      },
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Link
            to={`/userDetailPage/${row.id}`}
            className="btn btn-sm"
            style={{
              border: "1px solid #e2e8f0",
              color: "#475569",
              borderRadius: "6px",
              padding: "4px 8px",
            }}
            title="View Details"
          >
            <i className="fa-regular fa-eye"></i>
          </Link>
          {hasEditPermission && (
            <button
              className="btn btn-sm"
              onClick={() => handleUpdateClick(row)}
              style={{
                border: "1px solid #c7d2fe",
                background: "#eeedfe",
                color: PURPLE,
                borderRadius: "6px",
                padding: "4px 8px",
              }}
              title="Edit User"
            >
              <i className="fa-regular fa-pen-to-square"></i>
            </button>
          )}
          {hasDeletePermission && (
            <button
              className="btn btn-sm"
              onClick={() => deleteHandleRecord(row.id)}
              style={{
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#dc2626",
                borderRadius: "6px",
                padding: "4px 8px",
              }}
              title="Delete User"
            >
              <i className="fa-regular fa-trash-can"></i>
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "140px",
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#1e293b",
        color: "#f8fafc",
        fontWeight: "600",
        fontSize: "13px",
        minHeight: "44px",
      },
    },
    rows: {
      style: {
        minHeight: "56px",
        fontSize: "13px",
        color: "#334155",
        "&:hover": {
          backgroundColor: "#f8fafc !important",
        },
      },
    },
  };

  return (
    <Main>
      <ToastContainer position="top-right" autoClose={3000} />

      <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
        {/* ── Breadcrumb & Top Bar ── */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <Link to="/Home" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Home
            </Link>{" "}
            / <span style={{ color: "#0f172a", fontWeight: 600 }}>System Users</span>
          </div>

          <div className="d-flex gap-2">
            <button
              onClick={exportToExcel}
              className="btn btn-sm d-flex align-items-center gap-2"
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#334155",
                fontWeight: 600,
                borderRadius: "8px",
                padding: "7px 14px",
              }}
            >
              <i className="fa-solid fa-file-excel text-success"></i> Export Excel
            </button>

            {hasAddPermission && (
              <button
                onClick={handleModalShow}
                className="btn btn-sm d-flex align-items-center gap-2"
                style={{
                  background: PURPLE,
                  color: "#ffffff",
                  fontWeight: 600,
                  borderRadius: "8px",
                  padding: "7px 16px",
                  boxShadow: "0 2px 6px rgba(83, 74, 183, 0.25)",
                }}
              >
                <i className="fa-solid fa-user-plus"></i> Add New User
              </button>
            )}
          </div>
        </div>

        {/* ── KPI Deck ── */}
        <Row className="g-3 mb-4">
          <Col xs={12} sm={6} md={3}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px 20px",
                borderTop: `3px solid ${PURPLE}`,
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Total Accounts
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                {totalUsers}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Across all branches</div>
            </div>
          </Col>

          <Col xs={12} sm={6} md={3}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px 20px",
                borderTop: `3px solid ${TEAL}`,
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Active Users
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: TEAL, marginTop: "4px" }}>
                {activeCount}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Operational profiles</div>
            </div>
          </Col>

          <Col xs={12} sm={6} md={3}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px 20px",
                borderTop: `3px solid ${CORAL}`,
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Admin Privileges
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: CORAL, marginTop: "4px" }}>
                {adminCount}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Full access operators</div>
            </div>
          </Col>

          <Col xs={12} sm={6} md={3}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px 20px",
                borderTop: "3px solid #3b82f6",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Branch Assigned
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
                {branchUserCount}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Distributed workforce</div>
            </div>
          </Col>
        </Row>

        {/* ── Main Data Card ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ background: "#ffffff" }}>
            {/* Filter Tabs */}
            <div className="d-flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                style={{
                  background: statusFilter === "all" ? "#eeedfe" : "transparent",
                  color: statusFilter === "all" ? PURPLE : "#64748b",
                  border: statusFilter === "all" ? `1px solid ${PURPLE}` : "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                All Users ({totalUsers})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                style={{
                  background: statusFilter === "active" ? "#dcfce7" : "transparent",
                  color: statusFilter === "active" ? "#15803d" : "#64748b",
                  border: statusFilter === "active" ? "1px solid #86efac" : "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                style={{
                  background: statusFilter === "inactive" ? "#fee2e2" : "transparent",
                  color: statusFilter === "inactive" ? "#b91c1c" : "#64748b",
                  border: statusFilter === "inactive" ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Inactive ({totalUsers - activeCount})
              </button>
              <button
                onClick={() => setStatusFilter("admin")}
                style={{
                  background: statusFilter === "admin" ? "#faece7" : "transparent",
                  color: statusFilter === "admin" ? CORAL : "#64748b",
                  border: statusFilter === "admin" ? `1px solid ${CORAL}` : "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Admins ({adminCount})
              </button>
            </div>

            {/* Search Input */}
            <TextField
              id="search"
              placeholder="Search by name, email, role..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              size="small"
              sx={{
                width: 280,
                "& .MuiOutlinedInput-root": {
                  fontSize: "12.5px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  "& fieldset": { borderColor: "#cbd5e1" },
                  "&:hover fieldset": { borderColor: PURPLE },
                  "&.Mui-focused fieldset": { borderColor: PURPLE },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="fa fa-search text-muted" style={{ fontSize: "13px" }}></i>
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredUsers}
            pagination
            highlightOnHover
            customStyles={customStyles}
            noDataComponent={
              <div className="p-5 text-center text-muted">
                <i className="fa-solid fa-users-slash fs-3 mb-2 d-block text-secondary"></i>
                No users found matching your search.
              </div>
            }
          />
        </Card>

        {/* ── Add / Edit Modal ── */}
        <Modal show={showModal} onHide={handleModalClose} backdrop="static" size="lg" centered>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {isUpdate ? "Edit User Account" : "Register New System User"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Full Name *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      name="name"
                      value={currentUser.name}
                      onChange={handleInputChange}
                      required
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                    <Form.Control.Feedback type="invalid">Please provide a valid full name.</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Email Address *
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="e.g. rahul@ibirdsservices.com"
                      name="email"
                      value={currentUser.email}
                      onChange={handleInputChange}
                      required
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                    <Form.Control.Feedback type="invalid">Please enter a valid email address.</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Contact Number
                    </Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="10-digit mobile"
                      name="contact"
                      value={currentUser.contact}
                      onChange={handleInputChange}
                      isInvalid={contactError}
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                    {contactError && (
                      <div className="text-danger mt-1" style={{ fontSize: "11px" }}>
                        Contact cannot exceed 10 digits.
                      </div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      User System Handle / Username *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. rsharma"
                      name="user_name"
                      value={currentUser.user_name}
                      onChange={handleInputChange}
                      required
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      System Role *
                    </Form.Label>
                    <Form.Select
                      name="role_id"
                      value={currentUser.role_id}
                      onChange={handleInputChange}
                      required
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    >
                      <option value="">Select assigned role...</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Branch Location
                    </Form.Label>
                    <Form.Select
                      name="branch_id"
                      value={currentUser.branch_id}
                      onChange={handleInputChange}
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    >
                      <option value="">Select branch...</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155", margin: 0 }}>
                        {isUpdate ? "Reset Password" : "Password *"}
                      </Form.Label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        style={{
                          background: "none",
                          border: "none",
                          color: PURPLE,
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Auto-Generate
                      </button>
                    </div>
                    <InputGroup>
                      <Form.Control
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder={isUpdate ? "Leave blank to keep unchanged" : "Password"}
                        name="password"
                        value={currentUser.password}
                        onChange={handleInputChange}
                        required={!isUpdate}
                        style={{ fontSize: "13px", borderRadius: "8px 0 0 8px" }}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={{ borderRadius: "0 8px 8px 0", borderColor: "#cbd5e1" }}
                      >
                        <i className={`fa-solid ${isPasswordVisible ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Account Status
                    </Form.Label>
                    <Form.Select
                      name="status"
                      value={currentUser.status}
                      onChange={handleInputChange}
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #f1f5f9" }}>
              <Button variant="light" onClick={handleModalClose} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>
                Cancel
              </Button>
              <Button
                type="submit"
                style={{
                  background: PURPLE,
                  borderColor: PURPLE,
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  padding: "7px 20px",
                }}
              >
                {isUpdate ? "Save Changes" : "Create Account"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Main>
  );
}