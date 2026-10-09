import React, { useContext, useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import stockManagementApis from "../apis/StockManagementApis";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Badge,
  Table,
  InputGroup,
  Pagination,
  Spinner,
} from "react-bootstrap";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from "moment";

const PURPLE = "#534AB7";
const TEAL = "#1D9E75";

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const { permissions, loginData } = useContext(AuthContext);

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: "", department: "", status: "active" });
  const [validated, setValidated] = useState(false);

  // ─── Issues state ───
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  const fetchEmployeeData = async (employeeId) => {
    try {
      const result = await stockManagementApis.getEmployeeById(employeeId);
      if (result) {
        setEmployee(result);
        setEditData({
          name: result.name || "",
          department: result.department || "",
          status: result.status === true || result.status === "active" ? "active" : "inactive",
        });
      } else {
        toast.error("Employee not found.");
      }
    } catch (error) {
      console.error("Error fetching employee details", error);
      toast.error("Failed to load employee details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeIssues = async (employeeId) => {
    try {
      setIssuesLoading(true);
      const result = await stockManagementApis.getEmployeeIssues(employeeId);
      setIssues(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching employee issues", error);
      setIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployeeData(id);
      fetchEmployeeIssues(id);
    } else {
      setLoading(false);
      setIssuesLoading(false);
    }
  }, [id]);

  const hasUpdatePermission =
    loginData?.role_name === "Admin" ||
    loginData?.role_name === "Super Admin" ||
    permissions?.some((role) => role.name === "Admin" || role.name === "Super Admin");

  // ─── Month Filtering & Aggregations ───
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    issues.forEach((iss) => {
      if (iss.issue_date) {
        const ym = moment(iss.issue_date).format("YYYY-MM");
        monthsSet.add(ym);
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      // Month Filter
      if (selectedMonth !== "all") {
        const ym = iss.issue_date ? moment(iss.issue_date).format("YYYY-MM") : "";
        if (ym !== selectedMonth) return false;
      }
      // Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const pName = String(iss.product_name || "").toLowerCase();
        const desc = String(iss.description || "").toLowerCase();
        const userName = String(iss.user_name || "").toLowerCase();
        const branchName = String(iss.branch_name || "").toLowerCase();
        const issId = String(iss.id || "").toLowerCase();
        return (
          pName.includes(term) ||
          desc.includes(term) ||
          userName.includes(term) ||
          branchName.includes(term) ||
          issId.includes(term)
        );
      }
      return true;
    });
  }, [issues, selectedMonth, searchTerm]);

  const filteredTotalUnits = useMemo(() => {
    return filteredIssues.reduce((sum, iss) => sum + parseFloat(iss.quantity || 0), 0);
  }, [filteredIssues]);

  const allTimeTotalUnits = useMemo(() => {
    return issues.reduce((sum, iss) => sum + parseFloat(iss.quantity || 0), 0) || parseFloat(employee?.total_issued_items || 0);
  }, [issues, employee]);

  const allTimeIssuesCount = issues.length || parseInt(employee?.total_issues_count || 0, 10);

  // Most issued product calculation
  const mostIssuedProduct = useMemo(() => {
    if (!issues || issues.length === 0) return null;
    const tally = {};
    issues.forEach((iss) => {
      const p = iss.product_name || "Unknown Product";
      tally[p] = (tally[p] || 0) + parseFloat(iss.quantity || 0);
    });
    let topProduct = null;
    let maxQty = 0;
    Object.entries(tally).forEach(([name, qty]) => {
      if (qty > maxQty) {
        maxQty = qty;
        topProduct = { name, quantity: qty };
      }
    });
    return topProduct;
  }, [issues]);

  const totalPages = Math.ceil(filteredIssues.length / rowsPerPage) || 1;
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredIssues.slice(start, start + rowsPerPage);
  }, [filteredIssues, currentPage]);

  // ─── Export to Excel ───
  const handleExportExcel = () => {
    if (!filteredIssues || filteredIssues.length === 0) {
      toast.warning("No issued items to export for the selected filter.");
      return;
    }

    const exportRows = filteredIssues.map((iss, idx) => ({
      "S.No": idx + 1,
      "Issue ID": iss.id ? iss.id.slice(0, 8) : "—",
      "Issue Date": iss.issue_date ? moment(iss.issue_date).format("YYYY-MM-DD") : "—",
      "Employee Name": employee?.name || "Staff",
      "Department": employee?.department || "General Staff",
      "Product Name": iss.product_name || "—",
      "Quantity Issued": parseFloat(iss.quantity || 0),
      "Unit": iss.unit || "Units",
      "Purpose / Remarks": iss.description || "—",
      "Issued By": iss.user_name || "Admin Staff",
      "Branch": iss.branch_name || "Head Office",
      "Status": (iss.status || "Active").toUpperCase(),
    }));

    // Summary Row
    exportRows.push({
      "S.No": "TOTAL",
      "Issue ID": `${filteredIssues.length} Records`,
      "Issue Date": "",
      "Employee Name": "",
      "Department": "",
      "Product Name": "",
      "Quantity Issued": filteredTotalUnits,
      "Unit": "Units",
      "Purpose / Remarks": "",
      "Issued By": "",
      "Branch": "",
      "Status": "",
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Issued Items");

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 20 },
      { wch: 30 },
      { wch: 16 },
      { wch: 12 },
      { wch: 35 },
      { wch: 20 },
      { wch: 22 },
      { wch: 14 },
    ];

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const monthSuffix = selectedMonth !== "all" ? `_${selectedMonth}` : "_All_Time";
    const cleanEmpName = (employee?.name || "Employee").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    saveAs(blob, `Issued_Items_${cleanEmpName}${monthSuffix}.xlsx`);
    toast.success(`Exported ${filteredIssues.length} issued records to Excel!`);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setValidated(false);
  };

  const handleEditModalShow = () => setShowEditModal(true);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      const payload = {
        name: editData.name,
        department: editData.department,
        status: editData.status === "active",
        updated_by: loginData?.id,
      };
      await stockManagementApis.updateEmployee(id, payload);
      toast.success("Employee updated successfully!");
      handleEditModalClose();
      fetchEmployeeData(id);
    } catch (error) {
      console.error("Error updating employee", error);
      toast.error("Failed to update employee.");
    }
  };

  if (loading) {
    return (
      <Main>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
          <div className="text-center">
            <Spinner animation="border" style={{ color: PURPLE }} />
            <div className="mt-3 text-muted" style={{ fontWeight: 600 }}>
              Loading employee details...
            </div>
          </div>
        </div>
      </Main>
    );
  }

  if (!employee) {
    return (
      <Main>
        <Container className="py-5 text-center">
          <h4>Employee Record Not Found</h4>
          <p className="text-muted">The employee requested does not exist or may have been deleted.</p>
          <Link to="/employee" className="btn btn-primary" style={{ background: PURPLE, borderColor: PURPLE }}>
            Back to Employees Directory
          </Link>
        </Container>
      </Main>
    );
  }

  const isActive = employee.status === "active" || employee.status === true;

  return (
    <Main>
      <ToastContainer position="top-right" autoClose={3000} />

      <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
        {/* ── Top Bar ── */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <Link to="/home" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Home
            </Link>{" "}
            /{" "}
            <Link to="/employee" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Employees
            </Link>{" "}
            / <span style={{ color: "#0f172a", fontWeight: 600 }}>{employee.name}</span>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/employee"
              className="btn btn-sm"
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#334155",
                fontWeight: 600,
                borderRadius: "8px",
                padding: "6px 14px",
              }}
            >
              <i className="fa-solid fa-arrow-left me-1"></i> Back to Directory
            </Link>

            {hasUpdatePermission && (
              <button
                onClick={handleEditModalShow}
                className="btn btn-sm d-flex align-items-center gap-2"
                style={{
                  background: PURPLE,
                  color: "#ffffff",
                  fontWeight: 600,
                  borderRadius: "8px",
                  padding: "6px 16px",
                  boxShadow: "0 2px 6px rgba(83, 74, 183, 0.25)",
                }}
              >
                <i className="fa-regular fa-pen-to-square"></i> Edit Employee
              </button>
            )}
          </div>
        </div>

        {/* ── Hero Employee Profile Card ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ height: "6px", background: `linear-gradient(90deg, ${PURPLE}, #38bdf8)` }} />
          <div className="p-4" style={{ background: "#ffffff" }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "14px",
                    background: "#ede9fe",
                    color: PURPLE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    border: "1px solid #c7d2fe",
                  }}
                >
                  <i className="fa-solid fa-user-tie"></i>
                </div>
                <div>
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <h4 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{employee.name}</h4>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: "99px",
                        background: isActive ? "#dcfce7" : "#fee2e2",
                        color: isActive ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {isActive ? "ACTIVE EMPLOYEE" : "INACTIVE"}
                    </span>
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
                      <i className="fa-solid fa-briefcase me-1"></i>
                      {employee.department || "General Staff"}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-3 mt-1 flex-wrap" style={{ fontSize: "13px", color: "#64748b" }}>
                    <span>
                      <i className="fa-regular fa-calendar me-1"></i> Registered:{" "}
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>
                        {employee.created_at ? moment(employee.created_at).format("DD MMM YYYY") : "Active Member"}
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      <i className="fa-solid fa-id-badge me-1"></i> ID:{" "}
                      <span style={{ fontFamily: "monospace", color: "#0f172a", fontWeight: 600 }}>
                        {employee.id.slice(0, 8)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Items Received / Issues KPI */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "12px 20px",
                  textAlign: "right",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Cumulative Items Received
                </div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                  {allTimeTotalUnits.toLocaleString("en-IN")} <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748b" }}>units</span>
                </div>
                <div style={{ fontSize: "11px", color: TEAL, fontWeight: 600, marginTop: "2px" }}>
                  {allTimeIssuesCount} provision orders fulfilled
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Metadata Specifications ── */}
        <Row className="g-4 mb-4">
          <Col md={6}>
            <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", height: "100%", overflow: "hidden" }}>
              <div className="p-3 border-bottom" style={{ background: "#ffffff" }}>
                <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                  <i className="fa-solid fa-address-card me-2" style={{ color: PURPLE }}></i>
                  Professional Details
                </h6>
              </div>
              <Card.Body className="p-4" style={{ background: "#ffffff" }}>
                <Row className="g-3 mb-3">
                  <Col xs={6}>
                    <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Employee Full Name
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                      {employee.name}
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Assigned Department
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: PURPLE, marginTop: "2px" }}>
                      {employee.department || "General Staff"}
                    </div>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col xs={6}>
                    <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Employment Status
                    </div>
                    <div style={{ marginTop: "4px" }}>
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "99px",
                          background: isActive ? "#dcfce7" : "#fee2e2",
                          color: isActive ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Record ID
                    </div>
                    <div style={{ fontSize: "13px", fontFamily: "monospace", color: "#334155", marginTop: "2px" }}>
                      {employee.id}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", height: "100%", overflow: "hidden" }}>
              <div className="p-3 border-bottom" style={{ background: "#ffffff" }}>
                <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                  <i className="fa-solid fa-chart-pie me-2" style={{ color: TEAL }}></i>
                  Provisioning Analytics
                </h6>
              </div>
              <Card.Body className="p-4" style={{ background: "#ffffff" }}>
                <Row className="g-3 mb-3">
                  <Col xs={6}>
                    <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Total Units Received
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                      {allTimeTotalUnits.toLocaleString("en-IN")} units
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Total Provision Events
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: TEAL, marginTop: "2px" }}>
                      {allTimeIssuesCount} transactions
                    </div>
                  </Col>
                </Row>

                <div>
                  <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                    Most Frequently Issued Product
                  </div>
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "13px",
                      color: "#334155",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {mostIssuedProduct ? (
                      <>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                          <i className="fa-solid fa-box me-2" style={{ color: PURPLE }}></i>
                          {mostIssuedProduct.name}
                        </span>
                        <span style={{ fontWeight: 700, color: PURPLE }}>
                          {mostIssuedProduct.quantity} units total
                        </span>
                      </>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>No items issued yet.</span>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* ── Issued Items & Provisions Section ── */}
        <Card
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            overflow: "hidden",
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
          className="mb-4"
        >
          {/* Card Header & Controls */}
          <div className="p-4 border-bottom" style={{ background: "#ffffff" }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "#ede9fe",
                      color: PURPLE,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    <i className="fa-solid fa-hand-holding-hand"></i>
                  </div>
                  <h5 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                    Issued Items & Provision History
                  </h5>
                  <Badge
                    bg="secondary"
                    style={{
                      background: "#f1f5f9",
                      color: "#475569",
                      fontWeight: 600,
                      fontSize: "12px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {filteredIssues.length} {filteredIssues.length === 1 ? "Record" : "Records"}
                  </Badge>
                </div>
                <p style={{ margin: "4px 0 0 44px", fontSize: "12.5px", color: "#64748b" }}>
                  Items, stationary, and assets issued to {employee.name} with monthly filtering and instant Excel export.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <Button
                  onClick={handleExportExcel}
                  disabled={issuesLoading || filteredIssues.length === 0}
                  style={{
                    background: "#059669",
                    borderColor: "#059669",
                    color: "#ffffff",
                    fontWeight: 600,
                    borderRadius: "8px",
                    fontSize: "13px",
                    padding: "7px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
                  }}
                  title="Download filtered issued items report as Excel spreadsheet"
                >
                  <i className="fa-solid fa-file-excel"></i>
                  <span>Download Excel Report</span>
                  {filteredIssues.length > 0 && (
                    <span
                      style={{
                        background: "rgba(255,255,255,0.25)",
                        padding: "1px 6px",
                        borderRadius: "10px",
                        fontSize: "11px",
                      }}
                    >
                      {filteredIssues.length}
                    </span>
                  )}
                </Button>

                <Link
                  to="/issue"
                  className="btn btn-sm"
                  style={{
                    background: PURPLE,
                    color: "#ffffff",
                    fontWeight: 600,
                    borderRadius: "8px",
                    fontSize: "13px",
                    padding: "7px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Issue Item</span>
                </Link>
              </div>
            </div>

            {/* Filter Bar */}
            <div
              className="mt-3 p-3 rounded-3 d-flex justify-content-between align-items-center flex-wrap gap-3"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
            >
              <div className="d-flex align-items-center gap-2 flex-wrap" style={{ flex: 1, minWidth: "260px" }}>
                {/* Month Filter */}
                <div className="d-flex align-items-center gap-2" style={{ minWidth: "240px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#475569",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <i className="fa-regular fa-calendar me-1" style={{ color: PURPLE }}></i> Month:
                  </label>
                  <Form.Select
                    size="sm"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      borderColor: "#cbd5e1",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">All Months (All Time - {issues.length} records)</option>
                    {availableMonths.map((ym) => (
                      <option key={ym} value={ym}>
                        {moment(ym, "YYYY-MM").format("MMMM YYYY")}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                {/* Search Item / Purpose */}
                <div style={{ minWidth: "240px", flex: 1 }}>
                  <InputGroup size="sm">
                    <InputGroup.Text style={{ background: "#ffffff", borderColor: "#cbd5e1", color: "#94a3b8" }}>
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search product, purpose, issued by..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{
                        borderRadius: "0 8px 8px 0",
                        fontSize: "13px",
                        borderColor: "#cbd5e1",
                      }}
                    />
                    {searchTerm && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                        style={{ borderLeft: "none" }}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </Button>
                    )}
                  </InputGroup>
                </div>

                {/* Reset button if active filter */}
                {(selectedMonth !== "all" || searchTerm) && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSelectedMonth("all");
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    style={{
                      fontSize: "12px",
                      color: "#dc2626",
                      textDecoration: "none",
                      fontWeight: 600,
                      padding: "4px 8px",
                    }}
                  >
                    <i className="fa-solid fa-rotate-left me-1"></i> Reset Filters
                  </Button>
                )}
              </div>

              {/* Summary Stats Badges */}
              <div className="d-flex align-items-center gap-3">
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Period Units
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: PURPLE }}>
                    {filteredTotalUnits.toLocaleString("en-IN")} units
                  </div>
                </div>
                <div style={{ width: "1px", height: "30px", background: "#e2e8f0" }} />
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Transactions
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                    {filteredIssues.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="p-0">
            {issuesLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" style={{ color: PURPLE }} />
                <div className="mt-2" style={{ fontSize: "13px", color: "#64748b" }}>
                  Loading issued records...
                </div>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-5 px-3">
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#f1f5f9",
                    color: "#94a3b8",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    marginBottom: "12px",
                  }}
                >
                  <i className="fa-regular fa-folder-open"></i>
                </div>
                <h6 style={{ fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  No Issued Items Found
                </h6>
                <p style={{ fontSize: "13px", color: "#64748b", maxWidth: "420px", margin: "6px auto 16px" }}>
                  {selectedMonth !== "all" || searchTerm
                    ? "No records match your selected month or search criteria. Try choosing another month or clearing filters."
                    : "No items have been issued to this employee yet."}
                </p>
                {selectedMonth !== "all" || searchTerm ? (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedMonth("all");
                      setSearchTerm("");
                    }}
                    style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}
                  >
                    Clear Filter
                  </Button>
                ) : (
                  <Link
                    to="/issue"
                    className="btn btn-sm btn-primary"
                    style={{
                      background: PURPLE,
                      borderColor: PURPLE,
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    Issue First Item
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
                    <thead style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <tr>
                        <th style={{ color: "#475569", fontWeight: 700, fontSize: "11.5px", padding: "12px 16px" }}>
                          ISSUE ID
                        </th>
                        <th style={{ color: "#475569", fontWeight: 700, fontSize: "11.5px", padding: "12px 14px" }}>
                          DATE
                        </th>
                        <th style={{ color: "#475569", fontWeight: 700, fontSize: "11.5px", padding: "12px 14px", minWidth: "220px" }}>
                          ITEM / PRODUCT
                        </th>
                        <th style={{ color: "#475569", fontWeight: 700, fontSize: "11.5px", padding: "12px 14px", textAlign: "center" }}>
                          QUANTITY
                        </th>
                        <th style={{ color: "#475569", fontWeight: 700, fontSize: "11.5px", padding: "12px 14px", minWidth: "200px" }}>
                          PURPOSE / REMARKS
                        </th>
                        <th style={{ color: "#475569", fontWeight: 700, fontSize: "11.5px", padding: "12px 14px" }}>
                          ISSUED BY
                        </th>
                        <th style={{ color: "#475569", fontWeight: 700, fontSize: "11.5px", padding: "12px 14px" }}>
                          BRANCH
                        </th>
                        <th style={{ color: "#475569", fontWeight: 700, fontSize: "11.5px", padding: "12px 14px" }}>
                          STATUS
                        </th>
                        <th style={{ color: "#475569", fontWeight: 700, fontSize: "11.5px", padding: "12px 16px", textAlign: "center" }}>
                          ACTION
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedIssues.map((iss) => {
                        const isApproved = iss.status === "approved" || iss.status === "active";
                        return (
                          <tr key={iss.id}>
                            <td style={{ padding: "12px 16px" }}>
                              <Link
                                to={`/issueDetailPage/${iss.id}`}
                                style={{
                                  fontWeight: 700,
                                  color: PURPLE,
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <i className="fa-solid fa-receipt" style={{ fontSize: "12px" }}></i>
                                {iss.id ? iss.id.slice(0, 8) : "—"}
                              </Link>
                            </td>
                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                {iss.issue_date ? moment(iss.issue_date).format("DD MMM YYYY") : "—"}
                              </div>
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                {iss.issue_date ? moment(iss.issue_date).fromNow() : ""}
                              </div>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                                <i className="fa-solid fa-box-open" style={{ color: PURPLE, fontSize: "12px" }}></i>
                                <span>{iss.product_name || "Unspecified Product"}</span>
                              </div>
                              {iss.unit && (
                                <div style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "18px" }}>
                                  Unit: {iss.unit}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center" }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  background: "#f1f5f9",
                                  padding: "3px 10px",
                                  borderRadius: "12px",
                                  fontSize: "12.5px",
                                }}
                              >
                                {iss.quantity || 0}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              {iss.description ? (
                                <span style={{ color: "#334155", fontSize: "12.5px" }}>
                                  {iss.description}
                                </span>
                              ) : (
                                <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "12px" }}>
                                  No remarks entered
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                              <div style={{ color: "#334155", fontWeight: 500, fontSize: "12.5px" }}>
                                <i className="fa-regular fa-user me-1 text-muted"></i>
                                {iss.user_name || "Staff"}
                              </div>
                            </td>
                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: "12px", color: "#64748b" }}>
                                {iss.branch_name || "—"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "3px 9px",
                                  borderRadius: "99px",
                                  background: isApproved ? "#dcfce7" : "#fef3c7",
                                  color: isApproved ? "#15803d" : "#b45309",
                                  textTransform: "uppercase",
                                }}
                              >
                                {iss.status || "Active"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                              <Link
                                to={`/issueDetailPage/${iss.id}`}
                                className="btn btn-sm btn-outline-secondary"
                                style={{
                                  borderRadius: "6px",
                                  padding: "4px 10px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                }}
                                title="View Issue Details"
                              >
                                <i className="fa-regular fa-eye me-1"></i> View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>

                {/* Table Footer / Pagination */}
                <div
                  className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2"
                  style={{ background: "#ffffff" }}
                >
                  <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                    Showing{" "}
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      {Math.min((currentPage - 1) * rowsPerPage + 1, filteredIssues.length)}
                    </span>{" "}
                    to{" "}
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      {Math.min(currentPage * rowsPerPage, filteredIssues.length)}
                    </span>{" "}
                    of{" "}
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{filteredIssues.length}</span> issued records
                    {selectedMonth !== "all" && ` in ${moment(selectedMonth, "YYYY-MM").format("MMMM YYYY")}`}
                  </div>

                  {totalPages > 1 && (
                    <Pagination size="sm" className="mb-0">
                      <Pagination.Prev
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      />
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <Pagination.Item
                              key={pageNum}
                              active={pageNum === currentPage}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Pagination.Item>
                          );
                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <Pagination.Ellipsis key={pageNum} disabled />;
                        }
                        return null;
                      })}
                      <Pagination.Next
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      />
                    </Pagination>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* ── Edit Employee Modal ── */}
        <Modal show={showEditModal} onHide={handleEditModalClose} backdrop="static" centered>
          <Form noValidate validated={validated} onSubmit={handleEditSubmit}>
            <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                Update Employee Details
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Employee Name *
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  required
                  placeholder="e.g. John Doe"
                  style={{ fontSize: "13px", borderRadius: "8px" }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Department
                </Form.Label>
                <Form.Control
                  type="text"
                  name="department"
                  value={editData.department}
                  onChange={handleEditChange}
                  placeholder="e.g. Engineering, Sales, HR"
                  style={{ fontSize: "13px", borderRadius: "8px" }}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Status
                </Form.Label>
                <Form.Select
                  name="status"
                  value={editData.status}
                  onChange={handleEditChange}
                  style={{ fontSize: "13px", borderRadius: "8px" }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #f1f5f9" }}>
              <Button
                variant="light"
                onClick={handleEditModalClose}
                style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}
              >
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
                Save Changes
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Main>
  );
}
