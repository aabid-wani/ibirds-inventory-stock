import React, { useEffect, useState, useMemo } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Main from "../layout/Main";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from "moment";

const PURPLE = "#534AB7";
const TEAL = "#1D9E75";
const CORAL = "#D85A30";

const COMMON_SERVICE_TYPES = [
  "IT Support & AMC",
  "Hardware & Network Repair",
  "Printing & Stationery",
  "Electrical & Maintenance",
  "Plumbing & Sanitation",
  "Air Conditioning & HVAC",
  "Cleaning & Housekeeping",
  "Catering & Refreshments",
  "Courier & Logistics",
  "Security & Surveillance",
  "Furniture & Carpentry",
  "Other / General Service",
];

export default function ServiceProvider() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [validated, setValidated] = useState(false);

  // View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewProvider, setViewProvider] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service_type: "",
    description: "",
    rate: "",
    status: "active",
  });

  const handleGetData = async () => {
    try {
      setLoading(true);
      const result = await stockManagementApis.getServiceProviders();
      setProviders(Array.isArray(result) ? result : []);
    } catch (error) {
      setProviders([]);
      console.error("Error fetching service providers", error);
      toast.error("Failed to load service providers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  // Distinct service types
  const availableTypes = useMemo(() => {
    const set = new Set(providers.map((p) => p.service_type).filter(Boolean));
    return Array.from(set);
  }, [providers]);

  // Filtered dataset
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const q = filterText.toLowerCase();
      const matchSearch =
        !filterText ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.service_type && p.service_type.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

      const isActive = p.status === "active" || p.status === true;
      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "inactive" && isActive) return false;

      if (typeFilter !== "all" && p.service_type !== typeFilter) return false;

      return matchSearch;
    });
  }, [providers, filterText, statusFilter, typeFilter]);

  // KPIs
  const totalCount = providers.length;
  const activeCount = providers.filter((p) => p.status === "active" || p.status === true).length;
  const inactiveCount = totalCount - activeCount;

  const avgRate = useMemo(() => {
    const rated = providers.filter((p) => p.rate !== null && p.rate !== "" && !isNaN(parseFloat(p.rate)));
    if (rated.length === 0) return 0;
    const sum = rated.reduce((acc, curr) => acc + parseFloat(curr.rate), 0);
    return (sum / rated.length).toFixed(2);
  }, [providers]);

  const exportToExcel = () => {
    if (filteredProviders.length === 0) {
      toast.info("No service providers found to export.");
      return;
    }

    const dataToExport = filteredProviders.map((p, idx) => ({
      "S.No": idx + 1,
      "Provider Name": p.name,
      "Contact Phone": p.phone || "—",
      "Service Category": p.service_type || "General",
      "Rate (₹)": p.rate ? parseFloat(p.rate) : "Negotiable",
      "Description": p.description || "—",
      "Status": p.status === "active" || p.status === true ? "Active" : "Inactive",
      "Created Date": p.created_at ? moment(p.created_at).format("YYYY-MM-DD") : "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Service Providers");

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 18 },
      { wch: 24 },
      { wch: 16 },
      { wch: 35 },
      { wch: 14 },
      { wch: 16 },
    ];

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Service_Providers_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${filteredProviders.length} service providers!`);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setIsUpdate(false);
    setCurrentId(null);
    setValidated(false);
    setFormData({
      name: "",
      phone: "",
      service_type: "",
      description: "",
      rate: "",
      status: "active",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        service_type: formData.service_type.trim(),
        description: formData.description.trim(),
        rate: formData.rate !== "" ? parseFloat(formData.rate) : null,
        status: formData.status === "active",
      };

      if (isUpdate && currentId) {
        await stockManagementApis.updateServiceProvider(currentId, payload);
        toast.success("Service Provider updated successfully!");
      } else {
        await stockManagementApis.addServiceProvider(payload);
        toast.success("Service Provider registered successfully!");
      }

      handleModalClose();
      handleGetData();
    } catch (error) {
      console.error("Error saving service provider", error);
      toast.error("Operation failed. Please verify the input.");
    }
  };

  const handleEdit = (row) => {
    setCurrentId(row.id);
    setIsUpdate(true);
    setFormData({
      name: row.name || "",
      phone: row.phone || "",
      service_type: row.service_type || "",
      description: row.description || "",
      rate: row.rate !== null && row.rate !== undefined ? String(row.rate) : "",
      status: row.status === true || row.status === "active" ? "active" : "inactive",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this service provider?")) {
      try {
        await stockManagementApis.deleteServiceProvider(id);
        toast.success("Service Provider deleted successfully!");
        setProviders((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Error deleting service provider", error);
        toast.error("Failed to delete service provider.");
      }
    }
  };

  const handleView = (row) => {
    setViewProvider(row);
    setShowViewModal(true);
  };

  const columns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      width: "70px",
    },
    {
      name: "Provider Name",
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div style={{ padding: "8px 0" }}>
          <div
            onClick={() => handleView(row)}
            style={{
              fontWeight: 700,
              color: PURPLE,
              fontSize: "14px",
              cursor: "pointer",
            }}
            title="Click to view full details"
          >
            {row.name}
          </div>
          {row.phone && (
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              <i className="fa-solid fa-phone me-1" style={{ fontSize: "10px", color: TEAL }}></i>
              <a href={`tel:${row.phone}`} className="text-decoration-none text-muted">
                {row.phone}
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Service Type",
      selector: (row) => row.service_type,
      sortable: true,
      grow: 1.5,
      cell: (row) => (
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "6px",
            background: "#eeedfe",
            color: PURPLE,
            border: "1px solid #c7d2fe",
            display: "inline-block",
          }}
        >
          <i className="fa-solid fa-wrench me-1" style={{ fontSize: "10.5px" }}></i>
          {row.service_type || "General Service"}
        </span>
      ),
    },
    {
      name: "Standard Rate",
      selector: (row) => row.rate,
      sortable: true,
      cell: (row) => (
        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "13.5px" }}>
          {row.rate !== null && row.rate !== undefined && row.rate !== "" ? (
            <>₹{parseFloat(row.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</>
          ) : (
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>Negotiable</span>
          )}
        </div>
      ),
    },
    {
      name: "Description / Scope",
      selector: (row) => row.description,
      grow: 2,
      cell: (row) => (
        <div
          style={{
            fontSize: "12.5px",
            color: "#475569",
            maxWidth: "280px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={row.description}
        >
          {row.description || "—"}
        </div>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      width: "120px",
      cell: (row) => {
        const isActive = row.status === "active" || row.status === true;
        return (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: "99px",
              background: isActive ? "#dcfce7" : "#fee2e2",
              color: isActive ? "#15803d" : "#b91c1c",
              textTransform: "uppercase",
            }}
          >
            {isActive ? "ACTIVE" : "INACTIVE"}
          </span>
        );
      },
    },
    {
      name: "Actions",
      width: "140px",
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (row) => (
        <div className="d-flex gap-1 align-items-center">
          <button
            className="btn btn-sm"
            onClick={() => handleView(row)}
            style={{
              border: "1px solid #cbd5e1",
              background: "#f1f5f9",
              color: "#475569",
              borderRadius: "6px",
              padding: "4px 8px",
            }}
            title="View Details"
          >
            <i className="fa-regular fa-eye"></i>
          </button>
          <button
            className="btn btn-sm"
            onClick={() => handleEdit(row)}
            style={{
              border: "1px solid #c7d2fe",
              background: "#eeedfe",
              color: PURPLE,
              borderRadius: "6px",
              padding: "4px 8px",
            }}
            title="Edit Provider"
          >
            <i className="fa-regular fa-pen-to-square"></i>
          </button>
          <button
            className="btn btn-sm"
            onClick={() => handleDelete(row.id)}
            style={{
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#dc2626",
              borderRadius: "6px",
              padding: "4px 8px",
            }}
            title="Delete Provider"
          >
            <i className="fa-regular fa-trash-can"></i>
          </button>
        </div>
      ),
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#1e293b",
        color: "#f8fafc",
        fontWeight: "600",
        fontSize: "13px",
        minHeight: "46px",
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
        {/* ── Top Bar ── */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <Link to="/Home" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Home
            </Link>{" "}
            / <span style={{ color: "#0f172a", fontWeight: 600 }}>Service Providers</span>
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

            <button
              onClick={() => {
                setIsUpdate(false);
                setFormData({
                  name: "",
                  phone: "",
                  service_type: "",
                  description: "",
                  rate: "",
                  status: "active",
                });
                setShowModal(true);
              }}
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
              <i className="fa-solid fa-plus"></i> Add Service Provider
            </button>
          </div>
        </div>

        {/* ── KPI Summary Cards ── */}
        <Row className="g-3 mb-4">
          <Col xs={12} sm={6} lg={3}>
            <Card style={{ border: "1px solid #e2e8f0", borderRadius: "12px", background: "#ffffff" }}>
              <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Total Providers
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                    {totalCount}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Registered in system</div>
                </div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    background: "#ede9fe",
                    color: PURPLE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  <i className="fa-solid fa-handshake-angle"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <Card style={{ border: "1px solid #e2e8f0", borderRadius: "12px", background: "#ffffff" }}>
              <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Active Partners
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#16a34a", marginTop: "2px" }}>
                    {activeCount}
                  </div>
                  <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>Ready for services</div>
                </div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    background: "#dcfce7",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  <i className="fa-solid fa-circle-check"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <Card style={{ border: "1px solid #e2e8f0", borderRadius: "12px", background: "#ffffff" }}>
              <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Service Types
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: TEAL, marginTop: "2px" }}>
                    {availableTypes.length}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Distinct categories</div>
                </div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    background: "#e1f5ee",
                    color: TEAL,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  <i className="fa-solid fa-list-check"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <Card style={{ border: "1px solid #e2e8f0", borderRadius: "12px", background: "#ffffff" }}>
              <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Average Rate
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: CORAL, marginTop: "2px" }}>
                    ₹{avgRate}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Configured base rate</div>
                </div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    background: "#ffedd5",
                    color: CORAL,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  <i className="fa-solid fa-receipt"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* ── Main Data Card ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", background: "#ffffff" }}>
          {/* Controls Bar */}
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-3">
            {/* Filter Pills */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter("all")}
                style={{
                  background: statusFilter === "all" ? "#0f172a" : "#f1f5f9",
                  color: statusFilter === "all" ? "#ffffff" : "#475569",
                  border: "none",
                  borderRadius: "99px",
                  padding: "5px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                }}
              >
                All Providers <span className="ms-1 opacity-75">{totalCount}</span>
              </button>

              <button
                onClick={() => setStatusFilter("active")}
                style={{
                  background: statusFilter === "active" ? "#16a34a" : "#f1f5f9",
                  color: statusFilter === "active" ? "#ffffff" : "#475569",
                  border: "none",
                  borderRadius: "99px",
                  padding: "5px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                }}
              >
                Active <span className="ms-1 opacity-75">{activeCount}</span>
              </button>

              <button
                onClick={() => setStatusFilter("inactive")}
                style={{
                  background: statusFilter === "inactive" ? "#dc2626" : "#f1f5f9",
                  color: statusFilter === "inactive" ? "#ffffff" : "#475569",
                  border: "none",
                  borderRadius: "99px",
                  padding: "5px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                }}
              >
                Inactive <span className="ms-1 opacity-75">{inactiveCount}</span>
              </button>

              {/* Service Type Filter Dropdown */}
              {availableTypes.length > 0 && (
                <Form.Select
                  size="sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    width: "auto",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderColor: "#cbd5e1",
                    marginLeft: "6px",
                  }}
                >
                  <option value="all">All Service Types</option>
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Form.Select>
              )}
            </div>

            {/* Search Box */}
            <div style={{ width: "300px" }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search provider, phone, type..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fa-solid fa-magnifying-glass text-muted" style={{ fontSize: "13px" }}></i>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  },
                }}
              />
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={filteredProviders}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 20, 30, 50]}
            customStyles={customStyles}
            progressPending={loading}
            highlightOnHover
            responsive
            noDataComponent={
              <div className="py-5 text-center text-muted">
                <i className="fa-solid fa-handshake-slash mb-2" style={{ fontSize: "32px", color: "#cbd5e1" }}></i>
                <div>No service providers match the criteria.</div>
              </div>
            }
          />
        </Card>

        {/* ── Add / Edit Modal ── */}
        <Modal show={showModal} onHide={handleModalClose} backdrop="static" centered size="lg">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {isUpdate ? "Update Service Provider" : "Register New Service Provider"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Row className="g-3">
                <Col md={7}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Provider Name *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Apex Hardware & Networking Solutions"
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter the provider or agency name.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={5}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Phone / Contact Number
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 09876543210"
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Service Type / Category
                    </Form.Label>
                    <Form.Control
                      type="text"
                      list="serviceTypeList"
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleInputChange}
                      placeholder="Type or select a service category"
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                    <datalist id="serviceTypeList">
                      {COMMON_SERVICE_TYPES.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Standard Rate (₹)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="rate"
                      value={formData.rate}
                      onChange={handleInputChange}
                      placeholder="e.g. 1500.00"
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Partner Status
                    </Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Description & Scope of Services
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter contract terms, point of contact, service scope, SLA, or warranty details..."
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #f1f5f9" }}>
              <Button
                variant="light"
                onClick={handleModalClose}
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
                {isUpdate ? "Save Changes" : "Register Provider"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* ── View Details Modal ── */}
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="md">
          <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9" }}>
            <Modal.Title style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
              Service Provider Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {viewProvider && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h5 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{viewProvider.name}</h5>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      ID: <span style={{ fontFamily: "monospace" }}>{viewProvider.id}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: "99px",
                      background: viewProvider.status === true || viewProvider.status === "active" ? "#dcfce7" : "#fee2e2",
                      color: viewProvider.status === true || viewProvider.status === "active" ? "#15803d" : "#b91c1c",
                    }}
                  >
                    {viewProvider.status === true || viewProvider.status === "active" ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <Row className="g-3 mb-3">
                  <Col xs={6}>
                    <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Service Type
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: PURPLE, marginTop: "2px" }}>
                      {viewProvider.service_type || "General Service"}
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Standard Rate
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                      {viewProvider.rate !== null && viewProvider.rate !== undefined && viewProvider.rate !== ""
                        ? `₹${parseFloat(viewProvider.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        : "Negotiable / On Request"}
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                      Contact Phone
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#0f172a", marginTop: "2px" }}>
                      {viewProvider.phone ? (
                        <a href={`tel:${viewProvider.phone}`} className="text-decoration-none" style={{ color: TEAL }}>
                          <i className="fa-solid fa-phone me-1"></i> {viewProvider.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>
                  </Col>
                </Row>

                <div className="mb-3">
                  <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                    Scope of Services / Description
                  </div>
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "12px",
                      fontSize: "13px",
                      color: "#334155",
                      lineHeight: 1.5,
                    }}
                  >
                    {viewProvider.description || "No description or notes provided."}
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: "11.5px" }}>
                  <span>
                    Created:{" "}
                    {viewProvider.created_at ? moment(viewProvider.created_at).format("DD MMM YYYY, hh:mm A") : "—"}
                  </span>
                  <span>
                    Updated:{" "}
                    {viewProvider.updated_at ? moment(viewProvider.updated_at).format("DD MMM YYYY, hh:mm A") : "—"}
                  </span>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "1px solid #f1f5f9" }}>
            <Button
              variant="light"
              onClick={() => setShowViewModal(false)}
              style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowViewModal(false);
                handleEdit(viewProvider);
              }}
              style={{
                background: PURPLE,
                borderColor: PURPLE,
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              <i className="fa-regular fa-pen-to-square me-1"></i> Edit Provider
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Main>
  );
}
