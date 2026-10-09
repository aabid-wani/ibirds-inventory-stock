import React, { useContext, useEffect, useState, useMemo } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { TextField, InputAdornment } from "@mui/material";
import Main from "../layout/Main";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../context/AuthProvider";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PURPLE = "#534AB7";
const TEAL = "#1D9E75";
const CORAL = "#D85A30";

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    department: "",
    status: "active",
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const { permissions, loginData, hasPermission } = useContext(AuthContext);

  const hasAddPermission = hasPermission('employees', 'add');
  const hasEditPermission = hasPermission('employees', 'edit');
  const hasDeletePermission = hasPermission('employees', 'del');

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getEmployees();
      setEmployees(result || []);
    } catch (error) {
      setEmployees([]);
      console.error("Error fetching employees", error);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [employees]);

  // Filtered dataset
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const q = filterText.toLowerCase();
      const matchesSearch =
        !filterText ||
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q));

      const matchesDept = selectedDept === "all" || e.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [employees, filterText, selectedDept]);

  // KPIs
  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === "active" || e.status === true).length;
  const deptCount = departments.filter((d) => d !== "all").length;

  const exportToExcel = () => {
    const dataToExport = filteredEmployees.map((e, idx) => ({
      "S.No": idx + 1,
      "Employee Name": e.name,
      "Department": e.department || "General",
      "Status": e.status === "active" || e.status === true ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Employees_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setIsUpdate(false);
    setNewEmployee({
      name: "",
      department: "",
      status: "active",
    });
    setSelectedEmployee(null);
  };

  const handleModalShow = () => setShowModal(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isUpdate && selectedEmployee) {
        const payload = { ...newEmployee, updated_by: loginData?.id };
        await stockManagementApis.updateEmployee(selectedEmployee.id, payload);
        toast.success("Employee updated successfully");
      } else {
        const payload = { ...newEmployee, created_by: loginData?.id };
        await stockManagementApis.addEmployee(payload);
        toast.success("Employee registered successfully");
      }
      handleModalClose();
      handleGetData();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setNewEmployee({
      name: employee.name,
      department: employee.department,
      status: employee.status === true || employee.status === "active" ? "active" : "inactive",
    });
    setIsUpdate(true);
    handleModalShow();
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await stockManagementApis.deleteEmployeeById(id);
        toast.success("Employee deleted successfully");
        setEmployees((prev) => prev.filter((e) => e.id !== id));
      } catch (error) {
        toast.error("Error deleting employee");
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
      name: "Employee Name",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div style={{ padding: "8px 0" }}>
          <Link
            to={`/employeeDetailPage/${row.id}`}
            style={{
              fontWeight: 600,
              color: PURPLE,
              fontSize: "13.5px",
              textDecoration: "none",
            }}
          >
            {row.name}
          </Link>
        </div>
      ),
    },
    {
      name: "Department",
      selector: (row) => row.department,
      sortable: true,
      cell: (row) => (
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: "6px",
            background: "#eeedfe",
            color: PURPLE,
            border: "1px solid #c7d2fe",
          }}
        >
          {row.department || "General Staff"}
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
            to={`/employeeDetailPage/${row.id}`}
            className="btn btn-sm"
            style={{
              border: "1px solid #cbd5e1",
              background: "#f1f5f9",
              color: "#475569",
              borderRadius: "6px",
              padding: "4px 8px",
            }}
            title="View Employee Details & Issued Items"
          >
            <i className="fa-regular fa-eye"></i>
          </Link>
          {hasEditPermission && (
            <button
              className="btn btn-sm"
              onClick={() => handleEditClick(row)}
              style={{
                border: "1px solid #c7d2fe",
                background: "#eeedfe",
                color: PURPLE,
                borderRadius: "6px",
                padding: "4px 8px",
              }}
              title="Edit Employee"
            >
              <i className="fa-regular fa-pen-to-square"></i>
            </button>
          )}
          {hasDeletePermission && (
            <button
              className="btn btn-sm"
              onClick={() => handleDeleteRecord(row.id)}
              style={{
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#dc2626",
                borderRadius: "6px",
                padding: "4px 8px",
              }}
              title="Delete Employee"
            >
              <i className="fa-regular fa-trash-can"></i>
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "120px",
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
        minHeight: "54px",
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
        {/* ── Breadcrumb & Actions ── */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <Link to="/Home" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Home
            </Link>{" "}
            / <span style={{ color: "#0f172a", fontWeight: 600 }}>Employees Directory</span>
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
                <i className="fa-solid fa-user-plus"></i> Add Employee
              </button>
            )}
          </div>
        </div>

        {/* ── KPI Deck ── */}
        <Row className="g-3 mb-4">
          <Col md={4}>
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
                Total Registered Staff
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                {totalEmployees}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Eligible for inventory issuance</div>
            </div>
          </Col>

          <Col md={4}>
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
                Active Employees
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: TEAL, marginTop: "4px" }}>
                {activeCount}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Currently employed</div>
            </div>
          </Col>

          <Col md={4}>
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
                Active Departments
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: CORAL, marginTop: "4px" }}>
                {deptCount}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Organizational divisions</div>
            </div>
          </Col>
        </Row>

        {/* ── Table Card ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ background: "#ffffff" }}>
            {/* Department Pills */}
            <div className="d-flex gap-2 flex-wrap">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  style={{
                    background: selectedDept === dept ? "#eeedfe" : "transparent",
                    color: selectedDept === dept ? PURPLE : "#64748b",
                    border: selectedDept === dept ? `1px solid ${PURPLE}` : "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {dept === "all" ? "All Departments" : dept}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <TextField
              id="search"
              placeholder="Search by name, department..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              size="small"
              sx={{
                width: 260,
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
            data={filteredEmployees}
            pagination
            highlightOnHover
            customStyles={customStyles}
            noDataComponent={
              <div className="p-5 text-center text-muted">
                <i className="fa-solid fa-user-xmark fs-3 mb-2 d-block text-secondary"></i>
                No employees found matching your search.
              </div>
            }
          />
        </Card>

        {/* ── Add / Edit Modal ── */}
        <Modal show={showModal} onHide={handleModalClose} centered backdrop="static">
          <Form onSubmit={handleSubmit}>
            <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {isUpdate ? "Edit Employee Information" : "Register New Employee"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Employee Full Name *
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Ankit Verma"
                  name="name"
                  value={newEmployee.name}
                  onChange={handleInputChange}
                  required
                  style={{ fontSize: "13px", borderRadius: "8px" }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Department / Division *
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Engineering, Sales, HR"
                  name="department"
                  value={newEmployee.department}
                  onChange={handleInputChange}
                  required
                  style={{ fontSize: "13px", borderRadius: "8px" }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Employment Status
                </Form.Label>
                <Form.Select
                  name="status"
                  value={newEmployee.status}
                  onChange={handleInputChange}
                  style={{ fontSize: "13px", borderRadius: "8px" }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
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
                {isUpdate ? "Save Changes" : "Create Employee"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Main>
  );
}