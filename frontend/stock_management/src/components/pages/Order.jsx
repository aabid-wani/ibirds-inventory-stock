import React, { useContext, useEffect, useMemo, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import { Container, Row, Col, Card, Button, Modal, Form, Badge } from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { TextField, InputAdornment } from "@mui/material";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

export default function Order() {
  const navigate = useNavigate();
  const { permissions, loginData, hasPermission } = useContext(AuthContext);

  const [order, setOrder] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'this_month' | 'active' | 'inactive'
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [branches, setBranches] = useState([]);
  const [user, setUser] = useState([]);
  const [vendor, setVendor] = useState([]);
  const [loader, setLoader] = useState(false);

  const hasAddPermission = hasPermission('orders', 'add');
  const hasEditPermission = hasPermission('orders', 'edit');

  useEffect(() => {
    const fetchRelations = async () => {
      try {
        const [vendorData, userData, branchData] = await Promise.all([
          stockManagementApis.getVendor(),
          stockManagementApis.getAllUsers(),
          stockManagementApis.getBranch(),
        ]);
        setVendor(Array.isArray(vendorData) ? vendorData : []);
        setUser(Array.isArray(userData) ? userData : []);
        setBranches(Array.isArray(branchData) ? branchData : []);
      } catch (error) {
        setVendor([]);
        setUser([]);
        setBranches([]);
      }
    };
    fetchRelations();
  }, []);

  const handleGetData = async () => {
    setLoader(true);
    try {
      const result = await stockManagementApis.getOrder();
      setOrder(Array.isArray(result) ? result : []);
    } catch (error) {
      setOrder([]);
      toast.error("Failed to fetch purchase orders");
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  // Compute KPI metrics
  const kpis = useMemo(() => {
    const currentMonthStr = moment().format("YYYY-MM");
    let totalSpend = 0;
    let thisMonthSpend = 0;
    let thisMonthCount = 0;
    let activeCount = 0;
    let inactiveCount = 0;
    const vendorSet = new Set();

    order.forEach((o) => {
      const amt = parseFloat(o.total_amount || 0);
      totalSpend += amt;
      if (o.vendor_name) vendorSet.add(o.vendor_name);

      if (o.status === "active") activeCount++;
      else inactiveCount++;

      const isCurrentMonth = moment(o.order_date).format("YYYY-MM") === currentMonthStr;
      if (isCurrentMonth) {
        thisMonthCount++;
        thisMonthSpend += amt;
      }
    });

    return {
      totalOrders: order.length,
      totalSpend: Math.round(totalSpend),
      thisMonthSpend: Math.round(thisMonthSpend),
      thisMonthCount,
      activeCount,
      inactiveCount,
      uniqueVendors: vendorSet.size,
    };
  }, [order]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const search = filterText.toLowerCase().trim();
    const currentMonthStr = moment().format("YYYY-MM");

    return order.filter((item) => {
      const orderDateFormatted = item.order_date ? moment(item.order_date).format("DD/MM/YYYY") : "";
      const itemMonth = item.order_date ? moment(item.order_date).format("YYYY-MM") : "";

      // Month filter
      if (filterMonth && itemMonth !== filterMonth) {
        return false;
      }

      // Status pill filter
      if (statusFilter === "this_month") {
        if (itemMonth !== currentMonthStr) return false;
      } else if (statusFilter === "active") {
        if (item.status !== "active") return false;
      } else if (statusFilter === "inactive") {
        if (item.status === "active") return false;
      }

      // Text search
      if (!search) return true;
      const orderNo = String(item.order_number || "").toLowerCase();
      const userName = String(item.user_name || "").toLowerCase();
      const branchName = String(item.branch_name || "").toLowerCase();
      const vendorName = String(item.vendor_name || "").toLowerCase();
      const totalAmt = String(item.total_amount || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();

      return (
        orderNo.includes(search) ||
        userName.includes(search) ||
        branchName.includes(search) ||
        vendorName.includes(search) ||
        totalAmt.includes(search) ||
        orderDateFormatted.toLowerCase().includes(search) ||
        status.includes(search)
      );
    });
  }, [order, filterText, filterMonth, statusFilter]);

  const handleEditClick = (ord) => {
    setSelectedOrder(ord);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const payload = { ...selectedOrder, updated_by: loginData?.id };
      let resp = await stockManagementApis.updateOrder(selectedOrder.id, payload);

      if (resp?.success) {
        toast.success("Order updated successfully!");
        handleCloseModal();
        handleGetData();
      } else {
        toast.error("Failed to update order");
      }
    } catch (error) {
      toast.error("Error updating order: " + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedOrder((prev) => ({ ...prev, [name]: value }));
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      toast.info("No records to export.");
      return;
    }

    const exportRows = filteredOrders.map((o, idx) => ({
      "S.No.": idx + 1,
      "PO / Order Number": `PO-${o.order_number || o.id}`,
      "Order Date": o.order_date ? moment(o.order_date).format("DD/MM/YYYY") : "-",
      Vendor: o.vendor_name || "Unassigned",
      Branch: o.branch_name || "Headquarters",
      "Created By": o.user_name || "System",
      "Total Amount (INR)": parseFloat(o.total_amount || 0),
      Status: o.status === "active" ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Orders");

    worksheet["!cols"] = Object.keys(exportRows[0]).map((key) => ({
      wch: Math.max(key.length + 3, 14),
    }));

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Purchase_Orders_Export_${moment().format("YYYY-MM-DD")}.xlsx`);
    toast.success(`Exported ${exportRows.length} purchase orders!`);
  };

  const columns = [
    {
      name: "PO Number",
      selector: (row) => row.order_number || row.id,
      sortable: true,
      width: "150px",
      cell: (row) => (
        <NavLink
          to={`/orderDetailPage/${row.id}`}
          style={{
            textDecoration: "none",
            color: COLORS.primary,
            fontWeight: "700",
            fontFamily: "monospace",
            fontSize: "13px",
            backgroundColor: COLORS.primaryLight,
            padding: "4px 8px",
            borderRadius: "6px",
          }}
        >
          {`PO-${row.order_number || row.id.slice(0, 6)}`}
        </NavLink>
      ),
    },
    {
      name: "Vendor & Branch",
      selector: (row) => row.vendor_name,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="py-2">
          <div className="fw-semibold" style={{ color: "#1E293B", fontSize: "14px" }}>
            <i className="fa-solid fa-store me-2" style={{ color: COLORS.primary, fontSize: "12px" }}></i>
            {row.vendor_name || "Direct Purchase"}
          </div>
          <div className="d-flex align-items-center gap-2 mt-1 text-muted" style={{ fontSize: "12px" }}>
            <span>
              <i className="fa-solid fa-building me-1" style={{ fontSize: "11px" }}></i>
              {row.branch_name || "Main Branch"}
            </span>
            <span>•</span>
            <span>
              <i className="fa-solid fa-user me-1" style={{ fontSize: "11px" }}></i>
              {row.user_name || "Admin"}
            </span>
          </div>
        </div>
      ),
    },
    {
      name: "Order Date",
      selector: (row) => row.order_date,
      sortable: true,
      width: "140px",
      cell: (row) => (
        <div style={{ fontSize: "13px" }}>
          <div className="fw-medium text-dark">
            {row.order_date ? moment(row.order_date).format("DD MMM YYYY") : "—"}
          </div>
          <small className="text-muted">{row.order_date ? moment(row.order_date).fromNow() : ""}</small>
        </div>
      ),
    },
    {
      name: "Total Amount",
      selector: (row) => parseFloat(row.total_amount || 0),
      sortable: true,
      width: "150px",
      cell: (row) => {
        const amt = parseFloat(row.total_amount || 0);
        return (
          <div className="fw-bold" style={{ fontSize: "14px", color: COLORS.success }}>
            ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        );
      },
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      width: "130px",
      cell: (row) => (
        <Badge
          bg={row.status === "active" ? "success" : "secondary"}
          style={{
            padding: "5px 10px",
            borderRadius: "20px",
            fontSize: "11px",
            backgroundColor: row.status === "active" ? "#10B981 !important" : "#64748B !important",
          }}
        >
          <i
            className={`fa-solid ${row.status === "active" ? "fa-circle-check" : "fa-circle-xmark"} me-1`}
          ></i>
          {row.status === "active" ? "Active" : "Archived"}
        </Badge>
      ),
    },
    {
      name: "Actions",
      width: "120px",
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (row) => (
        <div className="d-flex align-items-center gap-1">
          <NavLink to={`/orderDetailPage/${row.id}`}>
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

          {hasEditPermission && (
            <Button
              size="sm"
              variant="light"
              onClick={() => handleEditClick(row)}
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
    <Main>
      {/* Breadcrumb Header */}
      <div className="my-3 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div style={{ fontSize: "14px" }}>
          <Link to="/Home" className="text-decoration-none" style={{ color: COLORS.primary, fontWeight: "500" }}>
            <i className="fa-solid fa-house me-1"></i> Home
          </Link>
          <span className="text-muted mx-2">/</span>
          <span className="text-secondary fw-semibold">Purchases & Orders</span>
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
          {hasAddPermission && (
            <Button
              size="sm"
              onClick={() => navigate("/addOrder")}
              style={{
                backgroundColor: COLORS.primary,
                borderColor: COLORS.primary,
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              <i className="fa-solid fa-plus me-1"></i> Create Purchase Order
            </Button>
          )}
        </div>
      </div>

      <Container fluid className="px-3">
        {/* Purchases KPI Metrics Deck */}
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
                      Total Purchase Orders
                    </small>
                    <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.dark }}>
                      {kpis.totalOrders}
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
                    <i className="fa-solid fa-cart-shopping"></i>
                  </div>
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                  <span className="text-success fw-semibold">{kpis.activeCount} Active</span> • {kpis.inactiveCount} Archived
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
                      Cumulative Spend
                    </small>
                    <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.success }}>
                      ₹{kpis.totalSpend.toLocaleString("en-IN")}
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
                    <i className="fa-solid fa-receipt"></i>
                  </div>
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                  Across all recorded purchase orders
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
                      This Month's Inward
                    </small>
                    <h4 className="mb-0 fw-bold mt-1" style={{ color: "#2563EB" }}>
                      ₹{kpis.thisMonthSpend.toLocaleString("en-IN")}
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
                    <i className="fa-solid fa-calendar-check"></i>
                  </div>
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                  {kpis.thisMonthCount} order(s) placed in {moment().format("MMMM")}
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
                      Active Suppliers
                    </small>
                    <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.warning }}>
                      {kpis.uniqueVendors}
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
                    <i className="fa-solid fa-truck"></i>
                  </div>
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                  Distinct vendors transacted with
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
                  All Orders <Badge bg="light" text="dark" className="ms-1">{kpis.totalOrders}</Badge>
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === "this_month" ? "btn-primary" : "btn-light"}`}
                  onClick={() => setStatusFilter("this_month")}
                  style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                >
                  This Month <Badge bg="light" text="dark" className="ms-1">{kpis.thisMonthCount}</Badge>
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === "active" ? "btn-success" : "btn-light"}`}
                  onClick={() => setStatusFilter("active")}
                  style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                >
                  Active <Badge bg="light" text="dark" className="ms-1">{kpis.activeCount}</Badge>
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === "inactive" ? "btn-secondary" : "btn-light"}`}
                  onClick={() => setStatusFilter("inactive")}
                  style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                >
                  Archived <Badge bg="light" text="dark" className="ms-1">{kpis.inactiveCount}</Badge>
                </button>
              </div>

              {/* Right Filter Inputs */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Month Picker */}
                <Form.Control
                  type="month"
                  size="sm"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  style={{ width: "160px", borderRadius: "8px", fontSize: "13px" }}
                />

                {/* Search Field */}
                <TextField
                  id="search"
                  placeholder="Search PO, vendor, user..."
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
                          className="fa-solid fa-xmark text-muted"
                          style={{ cursor: "pointer", fontSize: "12px" }}
                          onClick={() => setFilterText("")}
                        ></i>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
            </div>

            {/* Filter status summary line */}
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
              <small className="text-muted" style={{ fontSize: "12px" }}>
                Showing <b>{filteredOrders.length}</b> of {order.length} orders
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
            data={filteredOrders}
            pagination
            paginationPerPage={15}
            paginationRowsPerPageOptions={[10, 15, 25, 50]}
            highlightOnHover
            customStyles={customTableStyles}
            noDataComponent={
              <div className="p-5 text-center text-muted">
                <i className="fa-solid fa-cart-arrow-down mb-2" style={{ fontSize: "36px", color: "#CBD5E1" }}></i>
                <p className="mb-0 fw-medium">No Purchase Orders Found</p>
                <small>Try selecting a different month or search term.</small>
              </div>
            }
          />
        </Card>

        {/* Edit Order Modal */}
        <Modal show={showModal} onHide={handleCloseModal} backdrop="static">
          <Form onSubmit={handleUpdateOrder}>
            <Modal.Header closeButton style={{ backgroundColor: "#F8FAFC" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: "600", color: "#1E293B" }}>
                <i className="fa-regular fa-pen-to-square me-2 text-primary"></i>
                Update Order Details
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              {selectedOrder && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                      Order / PO Number
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="order_number"
                      value={selectedOrder.order_number || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                      Vendor
                    </Form.Label>
                    <Form.Select
                      name="vendor_id"
                      value={selectedOrder.vendor_id || ""}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Vendor</option>
                      {vendor.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                      Branch
                    </Form.Label>
                    <Form.Select
                      name="branch_id"
                      value={selectedOrder.branch_id || ""}
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

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                      Status
                    </Form.Label>
                    <Form.Select
                      name="status"
                      value={selectedOrder.status || "active"}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive / Archived</option>
                    </Form.Select>
                  </Form.Group>
                </>
              )}
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: "#F8FAFC" }}>
              <Button variant="secondary" size="sm" onClick={handleCloseModal} style={{ borderRadius: "8px" }}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                style={{
                  backgroundColor: COLORS.primary,
                  borderColor: COLORS.primary,
                  borderRadius: "8px",
                }}
              >
                Save Changes
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <ToastContainer position="top-right" autoClose={3000} />
      </Container>
    </Main>
  );
}