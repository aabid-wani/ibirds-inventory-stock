import React, { useContext, useEffect, useMemo, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import { Container, Row, Col, Card, Button, Modal, Form, Badge } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import DataTable from "react-data-table-component";
import { TextField, InputAdornment } from "@mui/material";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../css/loader.css";

// Theme Tokens
const COLORS = {
  primary: "#534AB7",
  primaryHover: "#4338CA",
  primaryLight: "#EEEDFE",
  success: "#1D9E75",
  successLight: "#E1F5EE",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  dark: "#1E293B",
  cardBorder: "rgba(0, 0, 0, 0.08)",
};

export default function Issue() {
  const { loginData, permissions, hasPermission } = useContext(AuthContext);

  const [issue, setIssue] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'this_month' | 'approved' | 'pending'
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [availableQty, setAvailableQty] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loader, setLoader] = useState(false);

  const [currentIssue, setCurrentIssue] = useState({
    id: "",
    user_id: loginData?.id || "",
    product_id: "",
    branch_id: "",
    status: "approved",
    description: "",
    quantity: "",
    issue_date: moment().format("YYYY-MM-DD"),
    employee_id: "",
    updated_by: loginData?.id || null,
  });

  const handleGetData = async () => {
    setLoader(true);
    try {
      const result = await stockManagementApis.getIssue();
      setIssue(Array.isArray(result) ? result : []);
    } catch (error) {
      setIssue([]);
      toast.error("Failed to load provisions");
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  useEffect(() => {
    const fetchRelations = async () => {
      try {
        const [emp, branch, product] = await Promise.all([
          stockManagementApis.getEmployees(),
          stockManagementApis.getBranch(),
          stockManagementApis.getProduct(),
        ]);
        setEmployees(Array.isArray(emp) ? emp : []);
        setBranches(Array.isArray(branch) ? branch : []);
        setProducts(Array.isArray(product) ? product : []);
      } catch (e) {
        setEmployees([]);
        setBranches([]);
        setProducts([]);
      }
    };
    fetchRelations();
  }, []);

  useEffect(() => {
    if (currentIssue.product_id) {
      const p = products.find((p) => p.id === currentIssue.product_id);
      const avail = p ? parseFloat(p.total_buy_quantity || 0) - parseFloat(p.total_issue_quantity || 0) : 0;
      setAvailableQty(Math.max(0, avail));
    } else {
      setAvailableQty(null);
    }
  }, [currentIssue.product_id, products]);

  // Compute KPI metrics
  const kpis = useMemo(() => {
    const currentMonthStr = moment().format("YYYY-MM");
    let totalQty = 0;
    let thisMonthQty = 0;
    let thisMonthCount = 0;
    const recipientSet = new Set();
    const branchSet = new Set();

    issue.forEach((item) => {
      const q = parseFloat(item.quantity || 0);
      totalQty += q;
      if (item.employee_name) recipientSet.add(item.employee_name);
      if (item.branch_name) branchSet.add(item.branch_name);

      const isCurrentMonth = moment(item.issue_date).format("YYYY-MM") === currentMonthStr;
      if (isCurrentMonth) {
        thisMonthCount++;
        thisMonthQty += q;
      }
    });

    return {
      totalDispatches: issue.length,
      totalUnits: Math.round(totalQty),
      thisMonthCount,
      thisMonthUnits: Math.round(thisMonthQty),
      uniqueRecipients: recipientSet.size,
      uniqueBranches: branchSet.size,
    };
  }, [issue]);

  // Filtered issue list
  const filteredIssues = useMemo(() => {
    const search = filterText.toLowerCase().trim();
    const currentMonthStr = moment().format("YYYY-MM");

    return issue.filter((item) => {
      const issueDateFormatted = item.issue_date ? moment(item.issue_date).format("DD/MM/YYYY") : "";
      const itemMonth = item.issue_date ? moment(item.issue_date).format("YYYY-MM") : "";

      // Month filter
      if (filterMonth && itemMonth !== filterMonth) {
        return false;
      }

      // Status pill filter
      if (statusFilter === "this_month") {
        if (itemMonth !== currentMonthStr) return false;
      } else if (statusFilter === "approved") {
        if (item.status && item.status !== "approved" && item.status !== "issued") return false;
      } else if (statusFilter === "pending") {
        if (item.status !== "pending") return false;
      }

      // Search filter
      if (!search) return true;
      const user = String(item.user_name || "").toLowerCase();
      const emp = String(item.employee_name || "").toLowerCase();
      const prod = String(item.product_name || "").toLowerCase();
      const branch = String(item.branch_name || "").toLowerCase();
      const qty = String(item.quantity || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();
      const desc = String(item.description || "").toLowerCase();

      return (
        user.includes(search) ||
        emp.includes(search) ||
        prod.includes(search) ||
        branch.includes(search) ||
        qty.includes(search) ||
        status.includes(search) ||
        desc.includes(search) ||
        issueDateFormatted.toLowerCase().includes(search)
      );
    });
  }, [issue, filterText, filterMonth, statusFilter]);

  const isValidIssueDate = (date) => {
    const today = moment().endOf("day");
    const start = moment().subtract(2, "months").startOf("month");
    const ok = moment(date).isSameOrBefore(today) && moment(date).isSameOrAfter(start);
    if (!ok) toast.error("Issue date must be within the past 2 months.");
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);
    if (!isValidIssueDate(currentIssue.issue_date)) {
      setLoader(false);
      return;
    }

    const prod = products.find((p) => p.id === currentIssue.product_id);
    if (!prod) {
      toast.error("Please select a product!");
      setLoader(false);
      return;
    }

    const qty = parseFloat(currentIssue.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity!");
      setLoader(false);
      return;
    }

    setIsSubmitting(true);
    try {
      if (currentIssue.id) {
        const prev = issue.find((i) => i.id === currentIssue.id);
        const diff = qty - parseFloat(prev.quantity || 0);
        const avail = parseFloat(prod.total_buy_quantity || 0) - parseFloat(prod.total_issue_quantity || 0);
        if (diff > 0 && avail < diff) {
          toast.error(`Insufficient stock! Only ${avail} available.`);
          setLoader(false);
          setIsSubmitting(false);
          return;
        }

        await stockManagementApis.updateIssue(currentIssue.id, currentIssue);
        await stockManagementApis.updateProduct(prod.id, {
          ...prod,
          total_issue_quantity: parseFloat(prod.total_issue_quantity || 0) + diff,
        });
        toast.success("Provision updated successfully!");
      } else {
        const avail = parseFloat(prod.total_buy_quantity || 0) - parseFloat(prod.total_issue_quantity || 0);
        if (avail < qty) {
          toast.error(`Insufficient stock! Only ${avail} available.`);
          setLoader(false);
          setIsSubmitting(false);
          return;
        }

        const res = await stockManagementApis.addIssue(currentIssue);
        if (res.success) toast.success("Provision recorded successfully!");
        await stockManagementApis.updateProductById(prod.id, {
          ...prod,
          total_issue_quantity: parseFloat(prod.total_issue_quantity || 0) + qty,
        });
      }

      setShowModal(false);
      handleGetData();
    } catch (err) {
      toast.error("Error submitting provision: " + err.message);
    } finally {
      setLoader(false);
      setIsSubmitting(false);
    }
  };

  const handleShowModal = (iss = null) => {
    setCurrentIssue(
      iss
        ? {
            id: iss.id,
            user_id: iss.user_id || loginData?.id,
            product_id: iss.product_id,
            branch_id: iss.branch_id,
            status: iss.status || "approved",
            description: iss.description || "",
            quantity: iss.quantity,
            issue_date: iss.issue_date ? moment(iss.issue_date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
            employee_id: iss.employee_id || iss.employee_name,
            updated_by: loginData?.id,
          }
        : {
            id: "",
            user_id: loginData?.id,
            product_id: "",
            branch_id: "",
            status: "approved",
            description: "",
            quantity: "",
            issue_date: moment().format("YYYY-MM-DD"),
            employee_id: "",
            created_by: loginData?.id,
            updated_by: loginData?.id,
          }
    );
    setShowModal(true);
  };

  const deleteHandle = async (issueId) => {
    if (!window.confirm("Are you sure you want to delete this provision?")) return;
    try {
      const iss = issue.find((i) => i.id === issueId);
      const prod = products.find((p) => p.id === iss?.product_id);
      if (!iss) {
        toast.error("Record not found.");
        return;
      }

      if (prod) {
        await stockManagementApis.updateProductById(prod.id, {
          ...prod,
          total_issue_quantity: Math.max(0, parseFloat(prod.total_issue_quantity || 0) - parseFloat(iss.quantity || 0)),
        });
      }
      await stockManagementApis.deleteIssue(issueId);
      toast.success("Provision deleted and stock restored!");
      handleGetData();
    } catch {
      toast.error("Failed to delete provision.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentIssue((prev) => ({ ...prev, [name]: value }));
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredIssues.length === 0) {
      toast.info("No records to export.");
      return;
    }

    const exportRows = filteredIssues.map((iss, idx) => ({
      "S.No.": idx + 1,
      "Dispatch Date": iss.issue_date ? moment(iss.issue_date).format("DD/MM/YYYY") : "-",
      Recipient: iss.employee_name || "-",
      Product: iss.product_name || "-",
      "Issued Quantity": parseFloat(iss.quantity || 0),
      Branch: iss.branch_name || "Main",
      "Issued By": iss.user_name || "System",
      Status: iss.status || "Approved",
      Notes: iss.description || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Provisions");

    worksheet["!cols"] = Object.keys(exportRows[0]).map((key) => ({
      wch: Math.max(key.length + 3, 14),
    }));

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Provisions_Report_${moment().format("YYYY-MM-DD")}.xlsx`);
    toast.success(`Exported ${exportRows.length} dispatch records!`);
  };

  const hasAdd = hasPermission('provisions', 'add');
  const hasEdit = hasPermission('provisions', 'edit');
  const hasDelete = hasPermission('provisions', 'del');

  const columns = [
    {
      name: "Ref",
      selector: (_, i) => `ISS-${String(i + 1).padStart(3, "0")}`,
      width: "90px",
      cell: (_, i) => (
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            fontWeight: "600",
            color: "#475569",
            backgroundColor: "#F1F5F9",
            padding: "3px 7px",
            borderRadius: "5px",
          }}
        >
          {`ISS-${String(i + 1).padStart(3, "0")}`}
        </span>
      ),
    },
    {
      name: "Product & Recipient",
      selector: (r) => r.product_name,
      sortable: true,
      grow: 2,
      cell: (r) => (
        <div className="py-2">
          <NavLink
            to={`/issueDetailPage/${r.id}`}
            style={{
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "14px",
              color: COLORS.primary,
            }}
          >
            {r.product_name || "Item"}
          </NavLink>
          <div className="d-flex align-items-center gap-2 mt-1 text-muted" style={{ fontSize: "12px" }}>
            <span>
              <i className="fa-solid fa-user-tie me-1" style={{ color: "#64748B" }}></i>
              <b>{r.employee_name || "Employee"}</b>
            </span>
            <span>•</span>
            <span>
              <i className="fa-solid fa-building me-1"></i>
              {r.branch_name || "Main Branch"}
            </span>
          </div>
        </div>
      ),
    },
    {
      name: "Dispatch Date",
      selector: (r) => r.issue_date,
      sortable: true,
      width: "140px",
      cell: (r) => (
        <div style={{ fontSize: "13px" }}>
          <div className="fw-medium text-dark">
            {r.issue_date ? moment(r.issue_date).format("DD MMM YYYY") : "—"}
          </div>
          <small className="text-muted">{r.issue_date ? moment(r.issue_date).fromNow() : ""}</small>
        </div>
      ),
    },
    {
      name: "Quantity",
      selector: (r) => parseFloat(r.quantity || 0),
      sortable: true,
      width: "120px",
      cell: (r) => (
        <Badge
          bg="primary"
          style={{
            backgroundColor: `${COLORS.primaryLight} !important`,
            color: `${COLORS.primary} !important`,
            fontSize: "12px",
            padding: "5px 10px",
            fontWeight: "700",
            borderRadius: "6px",
          }}
        >
          {r.quantity} units
        </Badge>
      ),
    },
    {
      name: "Status",
      selector: (r) => r.status,
      sortable: true,
      width: "125px",
      cell: (r) => (
        <Badge
          bg={r.status === "approved" || r.status === "issued" ? "success" : "warning"}
          style={{
            padding: "5px 10px",
            borderRadius: "20px",
            fontSize: "11px",
            backgroundColor:
              r.status === "approved" || r.status === "issued"
                ? "#10B981 !important"
                : "#F59E0B !important",
          }}
        >
          <i
            className={`fa-solid ${
              r.status === "approved" || r.status === "issued" ? "fa-circle-check" : "fa-clock"
            } me-1`}
          ></i>
          {r.status || "Approved"}
        </Badge>
      ),
    },
    {
      name: "Actions",
      width: "140px",
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (r) => (
        <div className="d-flex align-items-center gap-1">
          <NavLink to={`/issueDetailPage/${r.id}`}>
            <Button
              size="sm"
              variant="light"
              style={{
                width: "32px",
                height: "32px",
                padding: 0,
                borderRadius: "7px",
                backgroundColor: "#F1F5F9",
                color: "#475569",
                border: "0.5px solid #CBD5E1",
              }}
            >
              <i className="fa-regular fa-eye" style={{ fontSize: "12px" }}></i>
            </Button>
          </NavLink>

          {hasEdit && (
            <Button
              size="sm"
              variant="light"
              onClick={() => handleShowModal(r)}
              style={{
                width: "32px",
                height: "32px",
                padding: 0,
                borderRadius: "7px",
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                border: "0.5px solid #BFDBFE",
              }}
            >
              <i className="fa-regular fa-pen-to-square" style={{ fontSize: "12px" }}></i>
            </Button>
          )}

          {hasDelete && (
            <Button
              size="sm"
              variant="light"
              onClick={() => deleteHandle(r.id)}
              style={{
                width: "32px",
                height: "32px",
                padding: 0,
                borderRadius: "7px",
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                border: "0.5px solid #FECACA",
              }}
            >
              <i className="fa-regular fa-trash-can" style={{ fontSize: "12px" }}></i>
            </Button>
          )}
        </div>
      ),
    },
  ];

  const customTableStyles = {
    headRow: {
      style: {
        backgroundColor: "#1E293B",
        color: "#F8FAFC",
        minHeight: "48px",
        fontWeight: "600",
        fontSize: "13px",
      },
    },
    headCells: {
      style: { color: "#F8FAFC" },
    },
    rows: {
      style: {
        minHeight: "56px",
        fontSize: "13.5px",
        color: "#334155",
        "&:not(:last-of-type)": {
          borderBottomStyle: "solid",
          borderBottomWidth: "1px",
          borderBottomColor: "#F1F5F9",
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: "#F8FAFC",
        borderBottomColor: "#E2E8F0",
        outline: "none",
      },
    },
  };

  return (
    <>
      {loader && (
        <div className="loading-state">
          <div className="loading"></div>
        </div>
      )}

      <Main>
        {/* Breadcrumb Header */}
        <div className="my-3 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div style={{ fontSize: "14px" }}>
            <Link to="/Home" className="text-decoration-none" style={{ color: COLORS.primary, fontWeight: "500" }}>
              <i className="fa-solid fa-house me-1"></i> Home
            </Link>
            <span className="text-muted mx-2">/</span>
            <span className="text-secondary fw-semibold">Provisions & Dispatches</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleGetData}
              style={{ borderRadius: "8px", fontSize: "13px" }}
            >
              <i className="fa-solid fa-arrows-rotate me-1"></i> Refresh
            </Button>
            <Button
              variant="outline-success"
              size="sm"
              onClick={exportToExcel}
              style={{ borderRadius: "8px", fontSize: "13px" }}
            >
              <i className="fa-solid fa-file-excel me-1"></i> Export Excel
            </Button>
            {hasAdd && (
              <>
                <NavLink to="/addmultiprovision" style={{ textDecoration: "none" }}>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    style={{
                      borderRadius: "8px",
                      fontSize: "13px",
                      borderColor: COLORS.primary,
                      color: COLORS.primary,
                    }}
                  >
                    <i className="fa-solid fa-layer-group me-1"></i> Bulk Provision
                  </Button>
                </NavLink>

                <Button
                  size="sm"
                  onClick={() => handleShowModal()}
                  style={{
                    backgroundColor: COLORS.primary,
                    borderColor: COLORS.primary,
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  <i className="fa-solid fa-plus me-1"></i> Add Provision
                </Button>
              </>
            )}
          </div>
        </div>

        <Container fluid className="px-3">
          {/* Provisions KPI Metric Deck */}
          <Row className="g-3 mb-4">
            <Col xs={12} sm={6} md={3}>
              <Card
                className="border-0 shadow-sm h-100 cursor-pointer"
                onClick={() => setStatusFilter("all")}
                style={{
                  borderRadius: "12px",
                  borderLeft: `4px solid ${COLORS.primary}`,
                  backgroundColor: statusFilter === "all" ? "#FAF5FF" : "#FFFFFF",
                }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        Total Provisions
                      </small>
                      <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.dark }}>
                        {kpis.totalDispatches}
                      </h4>
                    </div>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: COLORS.primaryLight,
                        color: COLORS.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="fa-solid fa-hand-holding"></i>
                    </div>
                  </div>
                  <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                    Lifetime dispatch transactions
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} md={3}>
              <Card
                className="border-0 shadow-sm h-100"
                style={{ borderRadius: "12px", borderLeft: `4px solid ${COLORS.success}`, backgroundColor: "#FFFFFF" }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        Units Dispatched
                      </small>
                      <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.success }}>
                        {kpis.totalUnits.toLocaleString()}
                      </h4>
                    </div>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: COLORS.successLight,
                        color: COLORS.success,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="fa-solid fa-box-open"></i>
                    </div>
                  </div>
                  <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                    Total stock units consumed
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} md={3}>
              <Card
                className="border-0 shadow-sm h-100 cursor-pointer"
                onClick={() => setStatusFilter("this_month")}
                style={{
                  borderRadius: "12px",
                  borderLeft: "4px solid #2563EB",
                  backgroundColor: statusFilter === "this_month" ? "#EFF6FF" : "#FFFFFF",
                }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        This Month's Issues
                      </small>
                      <h4 className="mb-0 fw-bold mt-1" style={{ color: "#2563EB" }}>
                        {kpis.thisMonthUnits}
                      </h4>
                    </div>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: "#DBEAFE",
                        color: "#2563EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="fa-solid fa-calendar-day"></i>
                    </div>
                  </div>
                  <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                    {kpis.thisMonthCount} transaction(s) in {moment().format("MMMM")}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} md={3}>
              <Card
                className="border-0 shadow-sm h-100"
                style={{ borderRadius: "12px", borderLeft: `4px solid ${COLORS.warning}`, backgroundColor: "#FFFFFF" }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        Beneficiaries
                      </small>
                      <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.warning }}>
                        {kpis.uniqueRecipients}
                      </h4>
                    </div>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: COLORS.warningLight,
                        color: COLORS.warning,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="fa-solid fa-users"></i>
                    </div>
                  </div>
                  <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                    Across {kpis.uniqueBranches} branch location(s)
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Master Table Card */}
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "12px", overflow: "hidden" }}>
            {/* Filter Toolbar */}
            <div className="p-3 bg-white border-bottom">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                {/* Segmented Filter Pills */}
                <div className="d-flex align-items-center gap-1 flex-wrap">
                  <button
                    className={`btn btn-sm ${statusFilter === "all" ? "btn-dark" : "btn-light"}`}
                    onClick={() => setStatusFilter("all")}
                    style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                  >
                    All Provisions <Badge bg="light" text="dark" className="ms-1">{kpis.totalDispatches}</Badge>
                  </button>
                  <button
                    className={`btn btn-sm ${statusFilter === "this_month" ? "btn-primary" : "btn-light"}`}
                    onClick={() => setStatusFilter("this_month")}
                    style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                  >
                    This Month <Badge bg="light" text="dark" className="ms-1">{kpis.thisMonthCount}</Badge>
                  </button>
                  <button
                    className={`btn btn-sm ${statusFilter === "approved" ? "btn-success" : "btn-light"}`}
                    onClick={() => setStatusFilter("approved")}
                    style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                  >
                    Approved
                  </button>
                  <button
                    className={`btn btn-sm ${statusFilter === "pending" ? "btn-warning" : "btn-light"}`}
                    onClick={() => setStatusFilter("pending")}
                    style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                  >
                    Pending
                  </button>
                </div>

                {/* Right Filter Inputs */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Form.Control
                    type="month"
                    size="sm"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{ width: "160px", borderRadius: "8px", fontSize: "13px" }}
                  />

                  <TextField
                    id="search"
                    placeholder="Search product, staff, branch..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    size="small"
                    sx={{
                      minWidth: "220px",
                      backgroundColor: "#fcfcfc",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        fontSize: "13px",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <i className="fa-solid fa-magnifying-glass text-muted" style={{ fontSize: "12px" }}></i>
                        </InputAdornment>
                      ),
                      endAdornment: filterText && (
                        <InputAdornment position="end">
                          <i
                            className="fa-solid fa-xmark text-muted cursor-pointer"
                            style={{ cursor: "pointer", fontSize: "12px" }}
                            onClick={() => setFilterText("")}
                          ></i>
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>
              </div>

              {/* Filter summary status line */}
              <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                <small className="text-muted" style={{ fontSize: "12px" }}>
                  Showing <b>{filteredIssues.length}</b> of {issue.length} provisions
                  {filterMonth && ` (Month: ${moment(filterMonth, "YYYY-MM").format("MMMM YYYY")})`}
                  {statusFilter !== "all" && ` (Filter: ${statusFilter.replace("_", " ")})`}
                  {filterText && ` matching "${filterText}"`}
                </small>

                {(filterText || filterMonth || statusFilter !== "all") && (
                  <button
                    className="btn btn-link p-0 text-decoration-none"
                    style={{ fontSize: "12px", color: COLORS.primary }}
                    onClick={() => {
                      setFilterText("");
                      setFilterMonth("");
                      setStatusFilter("all");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* DataTable */}
            <DataTable
              columns={columns}
              data={filteredIssues}
              pagination
              paginationPerPage={15}
              paginationRowsPerPageOptions={[10, 15, 25, 50]}
              highlightOnHover
              customStyles={customTableStyles}
              noDataComponent={
                <div className="p-5 text-center text-muted">
                  <i className="fa-solid fa-box-open mb-2" style={{ fontSize: "36px", color: "#CBD5E1" }}></i>
                  <p className="mb-0 fw-medium">No Provisions Found</p>
                  <small>Try selecting a different month or search query.</small>
                </div>
              }
            />
          </Card>

          {/* Add / Edit Provision Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
            <Form onSubmit={handleSubmit}>
              <Modal.Header closeButton style={{ backgroundColor: "#F8FAFC" }}>
                <Modal.Title style={{ fontSize: "16px", fontWeight: "600", color: "#1E293B" }}>
                  <i className="fa-solid fa-hand-holding me-2 text-primary"></i>
                  {currentIssue.id ? "Update Provision" : "Issue / Dispatch Product"}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                <Container fluid className="p-0">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Select Product <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="product_id"
                          value={currentIssue.product_id}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Product to Dispatch</option>
                          {products.map((p) => {
                            const avail = Math.max(0, parseFloat(p.total_buy_quantity || 0) - parseFloat(p.total_issue_quantity || 0));
                            return (
                              <option key={p.id} value={p.id} disabled={avail <= 0}>
                                {p.name} (Stock: {avail} {p.measurement_unit || "units"})
                              </option>
                            );
                          })}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Recipient Staff / Employee <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="employee_id"
                          value={currentIssue.employee_id}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Recipient Employee</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.designation || emp.role_name || "Staff"})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Dispatch Quantity <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          step="any"
                          placeholder="e.g. 5"
                          name="quantity"
                          value={currentIssue.quantity}
                          onChange={handleInputChange}
                          required
                        />
                        {availableQty !== null && (
                          <Form.Text className={availableQty <= 0 ? "text-danger" : "text-success"} style={{ fontSize: "11px" }}>
                            Current stock available: <b>{availableQty}</b>
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Branch Location <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="branch_id"
                          value={currentIssue.branch_id}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Branch</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Dispatch Date <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="issue_date"
                          value={currentIssue.issue_date}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-2">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Reason / Description / Purpose
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Project allocation, employee onboarding kit, general office supply..."
                          name="description"
                          value={currentIssue.description}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Container>
              </Modal.Body>
              <Modal.Footer style={{ backgroundColor: "#F8FAFC" }}>
                <Button variant="secondary" size="sm" onClick={() => setShowModal(false)} style={{ borderRadius: "8px" }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: COLORS.primary,
                    borderColor: COLORS.primary,
                    borderRadius: "8px",
                  }}
                >
                  {isSubmitting ? "Submitting..." : currentIssue.id ? "Update Provision" : "Confirm Dispatch"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          <ToastContainer position="top-right" autoClose={3000} />
        </Container>
      </Main>
    </>
  );
}