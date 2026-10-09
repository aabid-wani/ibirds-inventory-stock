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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PURPLE = "#534AB7";
const TEAL = "#1D9E75";
const CORAL = "#D85A30";

export default function Branch() {
  const [branches, setBranches] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState(null);
  const [validated, setValidated] = useState(false);

  const [newBranch, setNewBranch] = useState({
    name: "",
    location: "",
    city: "",
    state: "",
    status: "active",
  });

  const { permissions, loginData, hasPermission } = useContext(AuthContext);

  const hasAddPermission = hasPermission('branches', 'add');
  const hasEditPermission = hasPermission('branches', 'edit');
  const hasDeletePermission = hasPermission('branches', 'del');

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getBranch();
      setBranches(result || []);
    } catch (error) {
      setBranches([]);
      console.error("Error fetching branches", error);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  // Filtered dataset
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const q = filterText.toLowerCase();
      const matchSearch =
        !filterText ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.city && b.city.toLowerCase().includes(q)) ||
        (b.state && b.state.toLowerCase().includes(q)) ||
        (b.location && b.location.toLowerCase().includes(q));

      const isActive = b.status === "active" || b.status === true;
      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "inactive" && isActive) return false;

      return matchSearch;
    });
  }, [branches, filterText, statusFilter]);

  // KPIs
  const totalBranches = branches.length;
  const activeCount = branches.filter((b) => b.status === "active" || b.status === true).length;
  const citiesCount = new Set(branches.map((b) => b.city).filter(Boolean)).size;
  const statesCount = new Set(branches.map((b) => b.state).filter(Boolean)).size;

  const exportToExcel = () => {
    const dataToExport = filteredBranches.map((b, idx) => ({
      "S.No": idx + 1,
      "Branch Name": b.name,
      "Location / Address": b.location || "—",
      "City": b.city || "—",
      "State": b.state || "—",
      "Status": b.status === "active" || b.status === true ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Branches");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Branches_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleClose = () => {
    setShowModal(false);
    setNewBranch({
      name: "",
      location: "",
      city: "",
      state: "",
      status: "active",
    });
    setValidated(false);
    setIsUpdate(false);
    setCurrentBranchId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBranch((prev) => ({ ...prev, [name]: value }));
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
      if (isUpdate) {
        const payload = { ...newBranch, updated_by: loginData?.id };
        const resp = await stockManagementApis.updateBranch(currentBranchId, payload);
        if (resp.success) {
          toast.success("Branch location updated successfully");
        } else {
          toast.error(resp.errors || "Failed to update branch");
        }
      } else {
        const payload = { ...newBranch, created_by: loginData?.id };
        const resp = await stockManagementApis.addBranch(payload);
        if (resp.success) {
          toast.success("New branch location added");
        } else {
          toast.error(resp.errors || "Failed to add branch");
        }
      }
      handleClose();
      handleGetData();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleEdit = (branch) => {
    setNewBranch({
      name: branch.name,
      location: branch.location || "",
      city: branch.city || "",
      state: branch.state || "",
      status: branch.status === true || branch.status === "active" ? "active" : "inactive",
    });
    setIsUpdate(true);
    setCurrentBranchId(branch.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this branch?")) {
      try {
        await stockManagementApis.deleteBranch(id);
        toast.success("Branch removed successfully");
        setBranches((prev) => prev.filter((b) => b.id !== id));
      } catch (error) {
        toast.error("Error removing branch");
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
      name: "Branch Name",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div style={{ padding: "8px 0" }}>
          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13.5px" }}>
            <i className="fa-solid fa-building-columns me-2" style={{ color: PURPLE }}></i>
            {row.name}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>{row.location || "Corporate Hub"}</div>
        </div>
      ),
    },
    {
      name: "City",
      selector: (row) => row.city,
      sortable: true,
      cell: (row) => (
        <span style={{ fontSize: "12.5px", color: "#334155", fontWeight: 500 }}>
          {row.city || "—"}
        </span>
      ),
    },
    {
      name: "State / Territory",
      selector: (row) => row.state,
      sortable: true,
      cell: (row) => (
        <span style={{ fontSize: "12px", background: "#f1f5f9", padding: "3px 8px", borderRadius: "6px", color: "#475569" }}>
          {row.state || "—"}
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
          {hasEditPermission && (
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
              title="Edit Branch"
            >
              <i className="fa-regular fa-pen-to-square"></i>
            </button>
          )}
          {hasDeletePermission && (
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
              title="Delete Branch"
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
        {/* ── Top Bar ── */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <Link to="/Home" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Home
            </Link>{" "}
            / <span style={{ color: "#0f172a", fontWeight: 600 }}>Branches Network</span>
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
                onClick={() => setShowModal(true)}
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
                <i className="fa-solid fa-plus"></i> Add Branch
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
                Total Branches
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                {totalBranches}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Operational facilities</div>
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
                Active Locations
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: TEAL, marginTop: "4px" }}>
                {activeCount}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Receiving dispatches</div>
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
                Cities Covered
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: CORAL, marginTop: "4px" }}>
                {citiesCount}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Urban reach</div>
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
                States Covered
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
                {statesCount}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Regional footprint</div>
            </div>
          </Col>
        </Row>

        {/* ── Table Card ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ background: "#ffffff" }}>
            {/* Status Tabs */}
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
                All Branches ({totalBranches})
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
                Inactive ({totalBranches - activeCount})
              </button>
            </div>

            {/* Search Input */}
            <TextField
              id="search"
              placeholder="Search branch, city, state..."
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
            data={filteredBranches}
            pagination
            highlightOnHover
            customStyles={customStyles}
            noDataComponent={
              <div className="p-5 text-center text-muted">
                <i className="fa-solid fa-building-slash fs-3 mb-2 d-block text-secondary"></i>
                No branches found matching your search.
              </div>
            }
          />
        </Card>

        {/* ── Add / Edit Modal ── */}
        <Modal show={showModal} onHide={handleClose} centered backdrop="static">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {isUpdate ? "Edit Branch Facility" : "Add New Branch Location"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Branch Name *
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Head Office Ajmer"
                  name="name"
                  value={newBranch.name}
                  onChange={handleInputChange}
                  required
                  style={{ fontSize: "13px", borderRadius: "8px" }}
                />
                <Form.Control.Feedback type="invalid">Please provide a branch name.</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Location / Street Address
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Near Bus Stand, Vaishali Nagar"
                  name="location"
                  value={newBranch.location}
                  onChange={handleInputChange}
                  style={{ fontSize: "13px", borderRadius: "8px" }}
                />
              </Form.Group>

              <Row className="g-2 mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      City
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Ajmer"
                      name="city"
                      value={newBranch.city}
                      onChange={handleInputChange}
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      State
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Rajasthan"
                      name="state"
                      value={newBranch.state}
                      onChange={handleInputChange}
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Operational Status
                </Form.Label>
                <Form.Select
                  name="status"
                  value={newBranch.status}
                  onChange={handleInputChange}
                  style={{ fontSize: "13px", borderRadius: "8px" }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #f1f5f9" }}>
              <Button variant="light" onClick={handleClose} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>
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
                {isUpdate ? "Save Changes" : "Create Branch"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Main>
  );
}