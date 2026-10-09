import React, { useContext, useEffect, useMemo, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import { Container, Row, Col, Card, Modal, Button, Form, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { TextField, InputAdornment } from "@mui/material";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from "moment";

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

export default function ProductCategory() {
  const { permissions, loginData, hasPermission } = useContext(AuthContext);

  const [productCategory, setProductCategory] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "", status: "active" });
  const [loader, setLoader] = useState(false);

  const handleGetData = async () => {
    setLoader(true);
    try {
      const result = await stockManagementApis.getProductCategory();
      setProductCategory(Array.isArray(result) ? result : []);
    } catch (error) {
      setProductCategory([]);
      toast.error("Failed to load categories");
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

    productCategory.forEach((cat) => {
      if (cat.status === "active") activeCount++;
      else inactiveCount++;
    });

    return {
      totalCategories: productCategory.length,
      activeCount,
      inactiveCount,
    };
  }, [productCategory]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const search = filterText.toLowerCase().trim();

    return productCategory.filter((item) => {
      if (statusFilter === "active" && item.status !== "active") return false;
      if (statusFilter === "inactive" && item.status === "active") return false;

      if (!search) return true;
      const name = String(item.name || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();
      return name.includes(search) || status.includes(search);
    });
  }, [productCategory, filterText, statusFilter]);

  const deleteHandle = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this category?");
    if (!isConfirmed) return;

    try {
      await stockManagementApis.deleteProductCategory(id);
      toast.success("Category deleted successfully!");
      handleGetData();
    } catch (error) {
      toast.error("Error deleting category: " + error.message);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCurrentCategory(null);
    setNewCategory({ name: "", status: "active" });
  };

  const handleModalShow = (mode, category = null) => {
    setModalMode(mode);
    if (mode === "edit" && category) {
      setCurrentCategory(category);
      setNewCategory({ name: category.name, status: category.status || "active" });
    } else {
      setNewCategory({ name: "", status: "active" });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    try {
      let resp;
      if (modalMode === "edit" && currentCategory) {
        resp = await stockManagementApis.updateProductCategory(currentCategory.id, {
          ...newCategory,
          updated_by: loginData?.id,
        });
      } else {
        resp = await stockManagementApis.addProductCategory({
          ...newCategory,
          created_by: loginData?.id,
        });
      }

      if (resp && resp.message) {
        toast.success(resp.message);
      } else {
        toast.success("Category saved successfully!");
      }
      handleGetData();
      handleModalClose();
    } catch (error) {
      toast.error("Error saving category: " + error.message);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredCategories.length === 0) {
      toast.info("No records to export.");
      return;
    }

    const exportRows = filteredCategories.map((c, idx) => ({
      "S.No.": idx + 1,
      "Category Name": c.name,
      Status: c.status === "active" ? "Active" : "Inactive",
      "Created Date": c.created_at ? moment(c.created_at).format("DD/MM/YYYY") : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");

    worksheet["!cols"] = Object.keys(exportRows[0]).map((key) => ({
      wch: Math.max(key.length + 3, 16),
    }));

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Product_Categories_${moment().format("YYYY-MM-DD")}.xlsx`);
    toast.success(`Exported ${exportRows.length} categories!`);
  };

  const hasAddPermission = hasPermission('productCategory', 'add');
  const hasEditPermission = hasPermission('productCategory', 'edit');
  const hasDeletePermission = hasPermission('productCategory', 'del');

  const columns = [
    {
      name: "S.No.",
      selector: (_, index) => index + 1,
      sortable: true,
      width: "80px",
    },
    {
      name: "Category Name",
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="d-flex align-items-center gap-2 py-2">
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "7px",
              backgroundColor: COLORS.primaryLight,
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
            }}
          >
            <i className="fa-solid fa-layer-group"></i>
          </div>
          <div>
            <span className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
              {row.name}
            </span>
          </div>
        </div>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      width: "140px",
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
      width: "120px",
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (row) => (
        <div className="d-flex align-items-center gap-1">
          {hasEditPermission && (
            <Button
              size="sm"
              variant="light"
              onClick={() => handleModalShow("edit", row)}
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

          {hasDeletePermission && (
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
          <span className="text-secondary fw-semibold">Product Categories</span>
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
              onClick={() => handleModalShow("add")}
              style={{
                backgroundColor: COLORS.primary,
                borderColor: COLORS.primary,
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              <i className="fa-solid fa-plus me-1"></i> Add Category
            </Button>
          )}
        </div>
      </div>

      <Container fluid className="px-3">
        {/* Categories KPI Metric Deck */}
        <Row className="g-3 mb-4">
          <Col xs={12} sm={4}>
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
                      Total Categories
                    </small>
                    <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.dark }}>
                      {kpis.totalCategories}
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
                    <i className="fa-solid fa-layer-group"></i>
                  </div>
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                  Product classification taxonomy
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={4}>
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
                      Active Categories
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
                  In active catalog use
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={4}>
            <Card
              className="border-0 shadow-sm h-100 cursor-pointer"
              onClick={() => setStatusFilter("inactive")}
              style={{
                borderRadius: "12px",
                borderLeft: "4px solid #64748B",
                backgroundColor: statusFilter === "inactive" ? "#F1F5F9" : "#FFFFFF",
              }}
            >
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                      Inactive / Archived
                    </small>
                    <h4 className="mb-0 fw-bold mt-1" style={{ color: "#64748B" }}>
                      {kpis.inactiveCount}
                    </h4>
                  </div>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      backgroundColor: "#F1F5F9",
                      color: "#64748B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="fa-solid fa-folder-closed"></i>
                  </div>
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                  Disabled categories
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
                  All Categories <Badge bg="light" text="dark" className="ms-1">{kpis.totalCategories}</Badge>
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
                  Inactive <Badge bg="light" text="dark" className="ms-1">{kpis.inactiveCount}</Badge>
                </button>
              </div>

              {/* Right Search Input */}
              <TextField
                id="search"
                placeholder="Search category..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                size="small"
                sx={{
                  minWidth: "240px",
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
                Showing <b>{filteredCategories.length}</b> of {productCategory.length} categories
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
            data={filteredCategories}
            pagination
            paginationPerPage={15}
            paginationRowsPerPageOptions={[10, 15, 25, 50]}
            highlightOnHover
            customStyles={customTableStyles}
            noDataComponent={
              <div className="p-5 text-center text-muted">
                <i className="fa-solid fa-folder-open mb-2" style={{ fontSize: "36px", color: "#CBD5E1" }}></i>
                <p className="mb-0 fw-medium">No Categories Found</p>
                <small>Try clearing your search query or add a new category.</small>
              </div>
            }
          />
        </Card>

        {/* Add / Edit Category Modal */}
        <Modal show={showModal} onHide={handleModalClose} backdrop="static">
          <Form onSubmit={handleSaveCategory}>
            <Modal.Header closeButton style={{ backgroundColor: "#F8FAFC" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: "600", color: "#1E293B" }}>
                <i className="fa-solid fa-layer-group me-2 text-primary"></i>
                {modalMode === "edit" ? "Update Category" : "Add Product Category"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                  Category Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Stationery, Electronics, Groceries"
                  name="name"
                  value={newCategory.name}
                  onChange={handleInputChange}
                  required
                  autoFocus
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                  Status
                </Form.Label>
                <Form.Select
                  name="status"
                  value={newCategory.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: "#F8FAFC" }}>
              <Button variant="secondary" size="sm" onClick={handleModalClose} style={{ borderRadius: "8px" }}>
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
                {modalMode === "edit" ? "Save Changes" : "Create Category"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <ToastContainer position="top-right" autoClose={3000} />
      </Container>
    </Main>
  );
}