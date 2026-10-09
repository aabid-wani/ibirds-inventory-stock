import React, { useContext, useEffect, useMemo, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import { Container, Row, Col, Card, Button, Modal, Form, Badge } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import DataTable from "react-data-table-component";
import { TextField, InputAdornment } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
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

export default function Vendor() {
  const { permissions, loginData, hasPermission } = useContext(AuthContext);

  const [vendor, setVendor] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [show, setShow] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'gst' | 'inactive'
  const [validated, setValidated] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [branches, setBranches] = useState([]);
  const [gstValidation, setGstValidation] = useState(null);
  const [phoneValidation, setPhoneValidation] = useState(null);
  const [loader, setLoader] = useState(false);

  const handleGetData = async () => {
    setLoader(true);
    try {
      const [vData, bData] = await Promise.all([
        stockManagementApis.getVendor(),
        stockManagementApis.getBranch(),
      ]);
      setVendor(Array.isArray(vData) ? vData : []);
      setBranches(Array.isArray(bData) ? bData : []);
    } catch (error) {
      setVendor([]);
      setBranches([]);
      toast.error("Failed to load vendors");
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  // Compute KPI metrics
  const kpis = useMemo(() => {
    let activeCount = 0;
    let inactiveCount = 0;
    let gstCount = 0;
    const citySet = new Set();

    vendor.forEach((v) => {
      if (v.status === "active") activeCount++;
      else inactiveCount++;

      if (v.gst_no && v.gst_no.trim().length >= 10) gstCount++;
      if (v.city) citySet.add(v.city.trim().toLowerCase());
    });

    return {
      totalVendors: vendor.length,
      activeCount,
      inactiveCount,
      gstCount,
      uniqueCities: citySet.size,
    };
  }, [vendor]);

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    const search = filterText.toLowerCase().trim();

    return vendor.filter((item) => {
      // Status filter
      if (statusFilter === "active" && item.status !== "active") return false;
      if (statusFilter === "inactive" && item.status === "active") return false;
      if (statusFilter === "gst" && (!item.gst_no || item.gst_no.trim().length < 10)) return false;

      // Text search
      if (!search) return true;
      const name = String(item.name || "").toLowerCase();
      const contact = String(item.contact_person || item.person_name || "").toLowerCase();
      const mobile = String(item.mobile || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const city = String(item.city || "").toLowerCase();
      const gst = String(item.gst_no || "").toLowerCase();

      return (
        name.includes(search) ||
        contact.includes(search) ||
        mobile.includes(search) ||
        email.includes(search) ||
        city.includes(search) ||
        gst.includes(search)
      );
    });
  }, [vendor, filterText, statusFilter]);

  const deleteHandle = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this vendor?");
    if (!isConfirmed) return;

    try {
      await stockManagementApis.deleteVendor(id);
      toast.success("Vendor deleted successfully!");
      handleGetData();
    } catch (e) {
      toast.error("Error deleting vendor: " + e.message);
    }
  };

  const handleClose = () => {
    setShow(false);
    setSelectedVendor(null);
    setValidated(false);
    setGstValidation(null);
    setPhoneValidation(null);
  };

  const handleShow = (v = null) => {
    setSelectedVendor(
      v
        ? { ...v }
        : {
            name: "",
            contact_person: "",
            mobile: "",
            email: "",
            gst_no: "",
            address: "",
            city: "",
            state: "",
            branch_id: "",
            status: "active",
          }
    );
    setIsUpdate(v !== null);
    setShow(true);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === "gst_no") {
      const isValidLengthGST = value.length === 15;
      const hasMixedChars = /[a-zA-Z0-9]/.test(value);
      setGstValidation(
        isValidLengthGST && hasMixedChars || value === ""
          ? null
          : "Please enter a valid 15-character GSTIN."
      );
    }

    if (name === "mobile") {
      const isValidLength = value.length === 10;
      const isNumeric = /^\d+$/.test(value);
      setPhoneValidation(
        (isValidLength && isNumeric) || value === ""
          ? null
          : "Please enter a valid 10-digit mobile number."
      );
    }

    setSelectedVendor((prev) => ({
      ...prev,
      [name]: value,
      created_by: loginData?.id,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (form.checkValidity() === false || gstValidation || phoneValidation) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      if (isUpdate) {
        await stockManagementApis.updateVendor(selectedVendor.id, selectedVendor);
        toast.success("Vendor updated successfully!");
      } else {
        await stockManagementApis.addVendor(selectedVendor);
        toast.success("Vendor created successfully!");
      }
      handleGetData();
      handleClose();
    } catch (error) {
      toast.error("Operation failed: " + error.message);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredVendors.length === 0) {
      toast.info("No records to export.");
      return;
    }

    const exportRows = filteredVendors.map((v, idx) => ({
      "S.No.": idx + 1,
      "Vendor Name": v.name,
      "Contact Person": v.contact_person || v.person_name || "-",
      "Phone / Mobile": v.mobile || "-",
      Email: v.email || "-",
      "GST Number": v.gst_no || "-",
      City: v.city || "-",
      Address: v.address || "-",
      Status: v.status === "active" ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");

    worksheet["!cols"] = Object.keys(exportRows[0]).map((key) => ({
      wch: Math.max(key.length + 3, 14),
    }));

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Vendor_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${exportRows.length} vendors!`);
  };

  const hasAdd = hasPermission('vendors', 'add');
  const hasEdit = hasPermission('vendors', 'edit');
  const hasDelete = hasPermission('vendors', 'del');

  const columns = [
    {
      name: "Vendor Name",
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="py-2">
          <NavLink
            to={`/vendorDetailPage/${row.id}`}
            style={{
              textDecoration: "none",
              color: COLORS.primary,
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            {row.name}
          </NavLink>
          {row.city && (
            <div className="text-muted mt-1" style={{ fontSize: "11px" }}>
              <i className="fa-solid fa-location-dot me-1 text-danger"></i>
              {row.city} {row.state ? `, ${row.state}` : ""}
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Contact Details",
      selector: (row) => row.mobile,
      grow: 1.5,
      cell: (row) => (
        <div style={{ fontSize: "13px" }}>
          {row.mobile ? (
            <div>
              <a href={`tel:${row.mobile}`} className="text-decoration-none text-dark fw-medium">
                <i className="fa-solid fa-phone me-1 text-primary" style={{ fontSize: "11px" }}></i>
                {row.mobile}
              </a>
            </div>
          ) : (
            <span className="text-muted">—</span>
          )}
          {row.email && (
            <div className="text-muted" style={{ fontSize: "11px" }}>
              <a href={`mailto:${row.email}`} className="text-decoration-none text-muted">
                <i className="fa-solid fa-envelope me-1" style={{ fontSize: "10px" }}></i>
                {row.email}
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      name: "GSTIN",
      selector: (row) => row.gst_no,
      sortable: true,
      width: "160px",
      cell: (row) =>
        row.gst_no ? (
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "11.5px",
              fontWeight: "600",
              color: "#334155",
              backgroundColor: "#F1F5F9",
              padding: "3px 7px",
              borderRadius: "5px",
            }}
          >
            {row.gst_no}
          </span>
        ) : (
          <span className="text-muted" style={{ fontSize: "12px" }}>
            Unregistered
          </span>
        ),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      width: "120px",
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
          {row.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      name: "Actions",
      width: "130px",
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (row) => (
        <div className="d-flex align-items-center gap-1">
          <NavLink to={`/vendorDetailPage/${row.id}`}>
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
              onClick={() => handleShow(row)}
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
              onClick={() => deleteHandle(row.id)}
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
    <Main>
      {/* Breadcrumb Header */}
      <div className="my-3 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div style={{ fontSize: "14px" }}>
          <Link to="/Home" className="text-decoration-none" style={{ color: COLORS.primary, fontWeight: "500" }}>
            <i className="fa-solid fa-house me-1"></i> Home
          </Link>
          <span className="text-muted mx-2">/</span>
          <span className="text-secondary fw-semibold">Supplier & Vendor Directory</span>
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
            <Button
              size="sm"
              onClick={() => handleShow()}
              style={{
                backgroundColor: COLORS.primary,
                borderColor: COLORS.primary,
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              <i className="fa-solid fa-plus me-1"></i> Add Supplier
            </Button>
          )}
        </div>
      </div>

      <Container fluid className="px-3">
        {/* Vendors KPI Metric Deck */}
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
                      Total Suppliers
                    </small>
                    <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.dark }}>
                      {kpis.totalVendors}
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
                    <i className="fa-solid fa-store"></i>
                  </div>
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                  Registered vendor directory
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={3}>
            <Card
              className="border-0 shadow-sm h-100 cursor-pointer"
              onClick={() => setStatusFilter("active")}
              style={{
                borderRadius: "12px",
                borderLeft: `4px solid ${COLORS.success}`,
                backgroundColor: statusFilter === "active" ? "#ECFDF5" : "#FFFFFF",
              }}
            >
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                      Active Partners
                    </small>
                    <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.success }}>
                      {kpis.activeCount}
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
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                  Ready for purchase orders
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={3}>
            <Card
              className="border-0 shadow-sm h-100 cursor-pointer"
              onClick={() => setStatusFilter("gst")}
              style={{
                borderRadius: "12px",
                borderLeft: "4px solid #2563EB",
                backgroundColor: statusFilter === "gst" ? "#EFF6FF" : "#FFFFFF",
              }}
            >
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                      GST Compliant
                    </small>
                    <h4 className="mb-0 fw-bold mt-1" style={{ color: "#2563EB" }}>
                      {kpis.gstCount}
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
                    <i className="fa-solid fa-file-invoice"></i>
                  </div>
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                  With verified GSTIN numbers
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
                      Supplier Cities
                    </small>
                    <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.warning }}>
                      {kpis.uniqueCities}
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
                    <i className="fa-solid fa-city"></i>
                  </div>
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                  Regional distribution
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
                  All Vendors <Badge bg="light" text="dark" className="ms-1">{kpis.totalVendors}</Badge>
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === "active" ? "btn-success" : "btn-light"}`}
                  onClick={() => setStatusFilter("active")}
                  style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                >
                  Active <Badge bg="light" text="dark" className="ms-1">{kpis.activeCount}</Badge>
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === "gst" ? "btn-primary" : "btn-light"}`}
                  onClick={() => setStatusFilter("gst")}
                  style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                >
                  GST Verified <Badge bg="light" text="dark" className="ms-1">{kpis.gstCount}</Badge>
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === "inactive" ? "btn-secondary" : "btn-light"}`}
                  onClick={() => setStatusFilter("inactive")}
                  style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                >
                  Inactive <Badge bg="light" text="dark" className="ms-1">{kpis.inactiveCount}</Badge>
                </button>
              </div>

              {/* Right Search Input */}
              <TextField
                id="search"
                placeholder="Search vendor, city, phone, GST..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                size="small"
                sx={{
                  minWidth: "260px",
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

            {/* Filter status summary line */}
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
              <small className="text-muted" style={{ fontSize: "12px" }}>
                Showing <b>{filteredVendors.length}</b> of {vendor.length} vendors
                {statusFilter !== "all" && ` (Filter: ${statusFilter})`}
                {filterText && ` matching "${filterText}"`}
              </small>

              {(filterText || statusFilter !== "all") && (
                <button
                  className="btn btn-link p-0 text-decoration-none"
                  style={{ fontSize: "12px", color: COLORS.primary }}
                  onClick={() => {
                    setFilterText("");
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
            data={filteredVendors}
            pagination
            paginationPerPage={15}
            paginationRowsPerPageOptions={[10, 15, 25, 50]}
            highlightOnHover
            customStyles={customTableStyles}
            noDataComponent={
              <div className="p-5 text-center text-muted">
                <i className="fa-solid fa-store-slash mb-2" style={{ fontSize: "36px", color: "#CBD5E1" }}></i>
                <p className="mb-0 fw-medium">No Vendors Found</p>
                <small>Try clearing your filters or adding a new vendor.</small>
              </div>
            }
          />
        </Card>

        {/* Add / Edit Vendor Modal */}
        <Modal show={show} onHide={handleClose} backdrop="static" size="lg">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Modal.Header closeButton style={{ backgroundColor: "#F8FAFC" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: "600", color: "#1E293B" }}>
                <i className="fa-solid fa-store me-2 text-primary"></i>
                {isUpdate ? "Update Supplier Information" : "Register New Supplier"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              {selectedVendor && (
                <Container fluid className="p-0">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Supplier / Company Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. ABC Stationery Traders"
                          name="name"
                          value={selectedVendor.name || ""}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Contact Person
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. Rajesh Kumar"
                          name="contact_person"
                          value={selectedVendor.contact_person || selectedVendor.person_name || ""}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Mobile Number
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          placeholder="10-digit mobile"
                          name="mobile"
                          value={selectedVendor.mobile || ""}
                          onChange={handleInputChange}
                          isInvalid={!!phoneValidation}
                        />
                        {phoneValidation && (
                          <Form.Control.Feedback type="invalid">
                            {phoneValidation}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Email Address
                        </Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="supplier@example.com"
                          name="email"
                          value={selectedVendor.email || ""}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          GSTIN Number
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="15-character GST number"
                          name="gst_no"
                          value={selectedVendor.gst_no || ""}
                          onChange={handleInputChange}
                          isInvalid={!!gstValidation}
                        />
                        {gstValidation && (
                          <Form.Control.Feedback type="invalid">
                            {gstValidation}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Branch
                        </Form.Label>
                        <Form.Select
                          name="branch_id"
                          value={selectedVendor.branch_id || ""}
                          onChange={handleInputChange}
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
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          City
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. Mumbai, Delhi, Ajmer"
                          name="city"
                          value={selectedVendor.city || ""}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Status
                        </Form.Label>
                        <Form.Select
                          name="status"
                          value={selectedVendor.status || "active"}
                          onChange={handleInputChange}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-2">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Office / Warehouse Address
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Street, area, postal code..."
                          name="address"
                          value={selectedVendor.address || ""}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Container>
              )}
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: "#F8FAFC" }}>
              <Button variant="secondary" size="sm" onClick={handleClose} style={{ borderRadius: "8px" }}>
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
                {isUpdate ? "Save Changes" : "Create Supplier"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <ToastContainer position="top-right" autoClose={3000} />
      </Container>
    </Main>
  );
}