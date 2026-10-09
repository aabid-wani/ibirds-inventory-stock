import React, { useContext, useEffect, useMemo, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import unitData from "../../components/json/measurement.json";
import { Container, Row, Col, Card, Button, Modal, Form, Badge, ProgressBar } from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../context/AuthProvider";
import { InputAdornment, TextField } from "@mui/material";
import Main from "../layout/Main";
import "../css/loader.css";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import pluralize from "pluralize";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function normalizeProductName(raw) {
  return pluralize.singular((raw || "").trim().toLowerCase());
}

// Visual Theme Tokens
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
  neutral: "#64748B",
  neutralLight: "#F1F5F9",
  dark: "#1E293B",
  cardBorder: "rgba(0, 0, 0, 0.08)",
};

export default function Product() {
  const navigate = useNavigate();
  const { permissions, loginData, hasPermission } = useContext(AuthContext);

  const [product, setProduct] = useState([]);
  const [category, setCategory] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all"); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'inactive'
  const [selectedRows, setSelectedRows] = useState([]);
  const [loader, setLoader] = useState(false);

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [newProduct, setNewProduct] = useState({
    id: "",
    name: "",
    description: "",
    category_id: "",
    total_buy_quantity: "",
    total_issue_quantity: "",
    min_quantity: "",
    max_quantity: "",
    measurement_units: "",
    status: "active",
  });

  // Quick Restock / Stock Adjust Modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustType, setAdjustType] = useState("restock"); // 'restock' | 'deduct' | 'set'
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const hasEditPermission = hasPermission('products', 'edit');
  const hasDeletePermission = hasPermission('products', 'del');
  const hasAddPermission = hasPermission('products', 'add');

  const handleGetData = async () => {
    setLoader(true);
    try {
      const [productData, categoryData] = await Promise.all([
        stockManagementApis.getProduct(),
        stockManagementApis.getProductCategory(),
      ]);
      setProduct(Array.isArray(productData) ? productData : []);
      setCategory(Array.isArray(categoryData) ? categoryData : []);
    } catch (e) {
      setProduct([]);
      toast.error("Failed to load products: " + e.message);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  // Compute Inventory Intelligence KPIs
  const kpis = useMemo(() => {
    const totalCount = product.length;
    let totalStockUnits = 0;
    let totalIssuedUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;
    let inactiveCount = 0;
    let totalValuation = 0;

    product.forEach((p) => {
      const buy = parseFloat(p.total_buy_quantity || 0);
      const issue = parseFloat(p.total_issue_quantity || 0);
      const available = Math.max(0, buy - issue);
      const minQty = parseFloat(p.min_quantity || 0);
      const isInactive = p.status === "inactive";
      const unitPrice = parseFloat(p.latest_price || p.avg_price || 0);

      totalStockUnits += available;
      totalIssuedUnits += issue;
      totalValuation += available * unitPrice;

      if (isInactive) {
        inactiveCount++;
      } else {
        if (available <= 0) {
          outOfStockCount++;
        } else if (minQty > 0 && available <= minQty) {
          lowStockCount++;
        } else {
          inStockCount++;
        }
      }
    });

    return {
      totalCount,
      activeCount: totalCount - inactiveCount,
      inactiveCount,
      totalStockUnits: Math.round(totalStockUnits),
      totalIssuedUnits: Math.round(totalIssuedUnits),
      lowStockCount,
      outOfStockCount,
      inStockCount,
      totalValuation: Math.round(totalValuation),
    };
  }, [product]);

  // Filtered Products
  const filteredProduct = useMemo(() => {
    const term = filterText.toLowerCase().trim();

    return product.filter((item) => {
      const buy = parseFloat(item.total_buy_quantity || 0);
      const issue = parseFloat(item.total_issue_quantity || 0);
      const available = Math.max(0, buy - issue);
      const minQty = parseFloat(item.min_quantity || 0);
      const isInactive = item.status === "inactive";

      // 1. Stock Status Filter
      if (stockStatusFilter === "in_stock") {
        if (isInactive || available <= 0 || (minQty > 0 && available <= minQty)) return false;
      } else if (stockStatusFilter === "low_stock") {
        if (isInactive || available <= 0 || minQty <= 0 || available > minQty) return false;
      } else if (stockStatusFilter === "out_of_stock") {
        if (isInactive || available > 0) return false;
      } else if (stockStatusFilter === "inactive") {
        if (!isInactive) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== "all") {
        if (item.category_id !== selectedCategory && String(item.category_name).toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 3. Search text filter
      if (!term) return true;
      const name = String(item.name || "").toLowerCase();
      const cat = String(item.category_name || "").toLowerCase();
      const desc = String(item.description || "").toLowerCase();
      const unit = String(item.measurement_unit || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();

      return (
        name.includes(term) ||
        cat.includes(term) ||
        desc.includes(term) ||
        unit.includes(term) ||
        status.includes(term)
      );
    });
  }, [product, filterText, selectedCategory, stockStatusFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModalClose = () => {
    setShowModal(false);
    setValidated(false);
    setNewProduct({
      id: "",
      name: "",
      description: "",
      category_id: "",
      total_buy_quantity: "",
      total_issue_quantity: "",
      min_quantity: "",
      max_quantity: "",
      measurement_units: "",
      status: "active",
    });
  };

  const handleAddProduct = () => {
    setIsUpdate(false);
    setShowModal(true);
  };

  const handleEditProduct = (prod) => {
    setNewProduct({
      ...prod,
      total_buy_quantity: prod.total_buy_quantity || 0,
      total_issue_quantity: prod.total_issue_quantity || 0,
      min_quantity: prod.min_quantity || 0,
      max_quantity: prod.max_quantity || 0,
      measurement_units: prod.measurement_unit || prod.measurement_units || "",
    });
    setIsUpdate(true);
    setShowModal(true);
  };

  // Status toggle handler
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      if (stockManagementApis.toggleProductStatus) {
        const resp = await stockManagementApis.toggleProductStatus(id);
        const nextStatus = currentStatus === "active" ? "inactive" : "active";
        toast.success(resp.message || `Product marked as ${nextStatus}`);
      } else {
        await stockManagementApis.deleteProduct(id);
        toast.success("Product status toggled successfully");
      }
      handleGetData();
    } catch (e) {
      toast.error(e.message || "Error updating status");
    }
  };

  // Bulk status toggle handler
  const handleBulkToggleStatus = async () => {
    if (selectedRows.length === 0) return;
    const isConfirmed = window.confirm(
      `Are you sure you want to toggle status for ${selectedRows.length} selected product(s)?`
    );
    if (!isConfirmed) return;

    try {
      setLoader(true);
      for (const row of selectedRows) {
        if (stockManagementApis.toggleProductStatus) {
          await stockManagementApis.toggleProductStatus(row.id);
        } else {
          await stockManagementApis.deleteProduct(row.id);
        }
      }
      toast.success(`${selectedRows.length} product(s) updated successfully`);
      setSelectedRows([]);
      handleGetData();
    } catch (error) {
      toast.error("Failed to update selected records: " + error.message);
    } finally {
      setLoader(false);
    }
  };

  // Open Quick Restock / Stock Adjust Modal
  const openAdjustModal = (row) => {
    setAdjustTarget(row);
    setAdjustType("restock");
    setAdjustQty("");
    setAdjustNotes("");
    setShowAdjustModal(true);
  };

  const handleQuickAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustTarget || !adjustQty || parseFloat(adjustQty) <= 0) {
      toast.error("Please enter a valid positive quantity");
      return;
    }

    const currentTotalBuy = parseFloat(adjustTarget.total_buy_quantity || 0);
    const currentIssue = parseFloat(adjustTarget.total_issue_quantity || 0);
    const currentRemaining = Math.max(0, currentTotalBuy - currentIssue);
    const maxLimit = adjustTarget.max_quantity !== null && adjustTarget.max_quantity !== undefined && parseFloat(adjustTarget.max_quantity) > 0
      ? parseFloat(adjustTarget.max_quantity)
      : null;
    const maxCanAdd = maxLimit !== null ? Math.max(0, maxLimit - currentRemaining) : null;
    const qtyVal = parseFloat(adjustQty) || 0;

    if (maxLimit !== null) {
      if (adjustType === "restock" && qtyVal > maxCanAdd) {
        toast.error(`Cannot add ${qtyVal} units. Maximum allowed to add is ${maxCanAdd} (Max Limit: ${maxLimit}).`);
        return;
      }
      if (adjustType === "set" && qtyVal > maxLimit) {
        toast.error(`Cannot set total stock to ${qtyVal}. Maximum capacity is ${maxLimit}.`);
        return;
      }
    }

    setIsAdjusting(true);
    try {
      const resp = await stockManagementApis.adjustProductStock(adjustTarget.id, {
        adjustment_type: adjustType,
        quantity: parseFloat(adjustQty),
        notes: adjustNotes,
      });

      if (resp.success) {
        toast.success(resp.message || "Stock adjusted successfully");
        setShowAdjustModal(false);
        handleGetData();
      } else {
        toast.error(resp.message || "Could not adjust stock");
      }
    } catch (err) {
      toast.error(err.message || "Failed to adjust stock");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Submit Add / Edit Product Form
  const onSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);
    setLoader(true);

    if (!e.currentTarget.checkValidity()) {
      e.stopPropagation();
      setLoader(false);
      return;
    }

    const normalizedName = normalizeProductName(newProduct.name);
    const duplicate = product.some(
      (prod) =>
        normalizeProductName(prod.name) === normalizedName && (!isUpdate || prod.id !== newProduct.id)
    );
    if (duplicate) {
      toast.error("A product with this name already exists.");
      setLoader(false);
      return;
    }

    let payload = {
      ...newProduct,
      name: normalizedName,
      total_buy_quantity: newProduct.total_buy_quantity,
      total_issue_quantity: newProduct.total_issue_quantity || 0,
      min_quantity: newProduct.min_quantity || null,
      max_quantity: newProduct.max_quantity || null,
      measurement_units: newProduct.measurement_units || null,
    };

    try {
      let resp;
      if (isUpdate) {
        payload = { ...payload, updated_by: loginData?.id };
        resp = await stockManagementApis.updateProduct(newProduct.id, payload);
        if (resp.success) {
          toast.success(resp.message || "Product updated successfully");
          handleModalClose();
          handleGetData();
        } else {
          toast.error(resp.errors || "Error updating product");
        }
      } else {
        payload = { ...payload, created_by: loginData?.id };
        resp = await stockManagementApis.addProduct(payload);
        if (resp?.success) {
          toast.success(resp.message || "Product saved successfully");
          handleModalClose();
          handleGetData();
          if (resp.data?.[0]?.id) {
            navigate(`/productDetailPage/${resp.data[0].id}`);
          }
        } else {
          toast.error(resp.message || "Operation failed");
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Error saving product";
      toast.error(msg);
    } finally {
      setLoader(false);
    }
  };

  // Export Inventory Report to Excel
  const exportToExcel = () => {
    if (filteredProduct.length === 0) {
      toast.info("No records to export.");
      return;
    }

    const exportRows = filteredProduct.map((p, idx) => {
      const buy = parseFloat(p.total_buy_quantity || 0);
      const issue = parseFloat(p.total_issue_quantity || 0);
      const available = Math.max(0, buy - issue);
      const minQty = parseFloat(p.min_quantity || 0);
      const maxQty = parseFloat(p.max_quantity || 0);
      const unitPrice = parseFloat(p.latest_price || p.avg_price || 0);

      let healthStatus = "Healthy";
      if (p.status === "inactive") healthStatus = "Inactive";
      else if (available <= 0) healthStatus = "Out of Stock";
      else if (minQty > 0 && available <= minQty) healthStatus = "Low Stock Alert";

      return {
        "SKU / Code": `PRD-${String(idx + 1).padStart(3, "0")}`,
        "Product Name": p.name,
        Category: p.category_name || "Uncategorized",
        "Measurement Unit": p.measurement_unit || "units",
        "Total Buy Qty": buy,
        "Total Issued Qty": issue,
        "Available Stock": available,
        "Min Reorder Qty": minQty || "-",
        "Max Capacity Qty": maxQty || "-",
        "Stock Health": healthStatus,
        "Latest Unit Price (INR)": unitPrice > 0 ? unitPrice : "-",
        "Est. Inventory Value (INR)": unitPrice > 0 ? available * unitPrice : "-",
        Status: p.status === "active" ? "Active" : "Inactive",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Products");

    // Auto-fit column widths
    const colKeys = Object.keys(exportRows[0]);
    worksheet["!cols"] = colKeys.map((key) => ({
      wch: Math.max(key.length + 2, 14),
    }));

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Inventory_Products_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${exportRows.length} product(s) to Excel!`);
  };

  const uniqueUnits = useMemo(() => {
    const allUnits = Object.values(unitData).flat();
    return [...new Set(allUnits)];
  }, []);

  // Columns definition for DataTable
  const columns = [
    {
      name: "SKU",
      selector: (row, idx) => `PRD-${String(idx + 1).padStart(3, "0")}`,
      width: "90px",
      cell: (row, idx) => (
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            fontWeight: "600",
            color: "#475569",
            backgroundColor: "#F1F5F9",
            padding: "3px 7px",
            borderRadius: "5px",
            letterSpacing: "0.5px",
          }}
        >
          {`PRD-${String(idx + 1).padStart(3, "0")}`}
        </span>
      ),
    },
    {
      name: "Product & Category",
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      minWidth: "220px",
      cell: (row) => (
        <div className="py-2">
          <div className="d-flex align-items-center gap-2">
            <NavLink
              to={`/productDetailPage/${row.id}`}
              style={{
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "14px",
                color: COLORS.primary,
                letterSpacing: "0.2px",
              }}
              className="text-truncate"
            >
              {row.name}
            </NavLink>
          </div>
          <div className="d-flex align-items-center gap-2 mt-1">
            <span
              style={{
                fontSize: "11px",
                color: "#64748B",
                backgroundColor: "#F8FAFC",
                padding: "1px 6px",
                borderRadius: "4px",
                border: "0.5px solid #E2E8F0",
              }}
            >
              <i className="fa-solid fa-layer-group me-1" style={{ fontSize: "10px", color: COLORS.primary }}></i>
              {row.category_name || "General"}
            </span>
            {row.measurement_unit && (
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                ({row.measurement_unit})
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      name: "Stock Health",
      selector: (row) => {
        const buy = parseFloat(row.total_buy_quantity || 0);
        const issue = parseFloat(row.total_issue_quantity || 0);
        return Math.max(0, buy - issue);
      },
      sortable: true,
      minWidth: "175px",
      cell: (row) => {
        const buy = parseFloat(row.total_buy_quantity || 0);
        const issue = parseFloat(row.total_issue_quantity || 0);
        const available = Math.max(0, buy - issue);
        const minQty = parseFloat(row.min_quantity || 0);
        const maxQty = parseFloat(row.max_quantity || 0);
        const capacity = maxQty > 0 ? maxQty : buy > 0 ? buy : 1;
        const pct = Math.min(100, Math.round((available / capacity) * 100));

        let barVariant = "success";
        let barColor = COLORS.success;
        if (available <= 0) {
          barVariant = "danger";
          barColor = COLORS.danger;
        } else if (minQty > 0 && available <= minQty) {
          barVariant = "warning";
          barColor = COLORS.warning;
        } else if (pct < 35) {
          barVariant = "warning";
          barColor = COLORS.warning;
        }

        return (
          <div style={{ width: "100%", paddingRight: "10px" }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: "12px", fontWeight: "600", color: barColor }}>
                {available} / {buy}
              </span>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>{pct}%</span>
            </div>
            <ProgressBar
              now={pct}
              style={{
                height: "6px",
                borderRadius: "3px",
                backgroundColor: "#E2E8F0",
              }}
              variant={barVariant}
            />
          </div>
        );
      },
    },
    {
      name: "Inventory Status",
      selector: (row) => row.status,
      sortable: true,
      width: "150px",
      cell: (row) => {
        const buy = parseFloat(row.total_buy_quantity || 0);
        const issue = parseFloat(row.total_issue_quantity || 0);
        const available = Math.max(0, buy - issue);
        const minQty = parseFloat(row.min_quantity || 0);
        const isInactive = row.status === "inactive";

        if (isInactive) {
          return (
            <Badge
              bg="secondary"
              className="fw-medium"
              style={{
                padding: "5px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                backgroundColor: "#64748B !important",
              }}
            >
              <i className="fa-regular fa-circle-xmark me-1"></i> Inactive
            </Badge>
          );
        }

        if (available <= 0) {
          return (
            <Badge
              bg="danger"
              className="fw-medium"
              style={{
                padding: "5px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                backgroundColor: "#EF4444 !important",
              }}
            >
              <i className="fa-solid fa-triangle-exclamation me-1"></i> Out of Stock
            </Badge>
          );
        }

        if (minQty > 0 && available <= minQty) {
          return (
            <Badge
              bg="warning"
              className="fw-medium text-dark"
              style={{
                padding: "5px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                backgroundColor: "#F59E0B !important",
                color: "#78350F !important",
              }}
            >
              <i className="fa-solid fa-bell me-1"></i> Low Stock
            </Badge>
          );
        }

        return (
          <Badge
            bg="success"
            className="fw-medium"
            style={{
              padding: "5px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              backgroundColor: "#10B981 !important",
            }}
          >
            <i className="fa-solid fa-circle-check me-1"></i> In Stock
          </Badge>
        );
      },
    },
    {
      name: "Valuation",
      selector: (row) => {
        const available = Math.max(0, parseFloat(row.total_buy_quantity || 0) - parseFloat(row.total_issue_quantity || 0));
        const price = parseFloat(row.latest_price || row.avg_price || 0);
        return available * price;
      },
      sortable: true,
      width: "125px",
      cell: (row) => {
        const available = Math.max(0, parseFloat(row.total_buy_quantity || 0) - parseFloat(row.total_issue_quantity || 0));
        const price = parseFloat(row.latest_price || row.avg_price || 0);
        const value = available * price;

        return (
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1E293B" }}>
              {value > 0 ? `₹${value.toLocaleString("en-IN")}` : "—"}
            </div>
            {price > 0 && (
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                @ ₹{price.toFixed(1)}/ea
              </div>
            )}
          </div>
        );
      },
    },
    {
      name: "Actions",
      width: "170px",
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (row) => {
        const isActive = row.status === "active";

        return (
          <div className="d-flex align-items-center gap-1">
            {/* Quick Restock / Stock Adjust */}
            {hasEditPermission && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`tt-restock-${row.id}`}>Smart Restock / Adjust</Tooltip>}
              >
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => openAdjustModal(row)}
                  style={{
                    width: "32px",
                    height: "32px",
                    padding: 0,
                    borderRadius: "7px",
                    backgroundColor: "#EEEDFE",
                    color: COLORS.primary,
                    border: "0.5px solid rgba(83, 74, 183, 0.2)",
                  }}
                >
                  <i className="fa-solid fa-bolt" style={{ fontSize: "12px" }}></i>
                </Button>
              </OverlayTrigger>
            )}

            {/* View Details */}
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`tt-view-${row.id}`}>View Details</Tooltip>}
            >
              <NavLink to={`/productDetailPage/${row.id}`}>
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
            </OverlayTrigger>

            {/* Edit */}
            {hasEditPermission && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`tt-edit-${row.id}`}>Edit Product</Tooltip>}
              >
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => handleEditProduct(row)}
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
              </OverlayTrigger>
            )}

            {/* Status Toggle */}
            {hasDeletePermission && (
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id={`tt-toggle-${row.id}`}>
                    {isActive ? "Deactivate Product" : "Activate Product"}
                  </Tooltip>
                }
              >
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => handleToggleStatus(row.id, row.status)}
                  style={{
                    width: "32px",
                    height: "32px",
                    padding: 0,
                    borderRadius: "7px",
                    backgroundColor: isActive ? "#ECFDF5" : "#FEF2F2",
                    color: isActive ? "#059669" : "#DC2626",
                    border: isActive ? "0.5px solid #A7F3D0" : "0.5px solid #FECACA",
                  }}
                >
                  <i
                    className={`fa-solid ${isActive ? "fa-toggle-on" : "fa-toggle-off"}`}
                    style={{ fontSize: "14px" }}
                  ></i>
                </Button>
              </OverlayTrigger>
            )}
          </div>
        );
      },
    },
  ];

  const customTableStyles = {
    table: {
      style: { textAlign: "left", backgroundColor: "#FFFFFF" },
    },
    headRow: {
      style: {
        backgroundColor: "#1E293B",
        color: "#F8FAFC",
        minHeight: "48px",
        fontWeight: "600",
        fontSize: "13px",
        letterSpacing: "0.4px",
      },
    },
    headCells: {
      style: {
        color: "#F8FAFC",
        "&:hover": { color: "#FFFFFF" },
      },
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
            <span className="text-secondary fw-semibold">Inventory Products</span>
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
                onClick={handleAddProduct}
                style={{
                  backgroundColor: COLORS.primary,
                  borderColor: COLORS.primary,
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                <i className="fa-solid fa-plus me-1"></i> Add Product
              </Button>
            )}
          </div>
        </div>

        <Container fluid className="px-3">
          {/* Smart Inventory Intelligence KPI Deck */}
          <Row className="g-3 mb-4">
            {/* Total Products */}
            <Col xs={12} sm={6} md={3} lg={2}>
              <Card
                className="border-0 shadow-sm h-100 cursor-pointer"
                onClick={() => setStockStatusFilter("all")}
                style={{
                  borderRadius: "12px",
                  borderLeft: `4px solid ${COLORS.primary}`,
                  backgroundColor: stockStatusFilter === "all" ? "#FAF5FF" : "#FFFFFF",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        Total SKUs
                      </small>
                      <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.dark }}>
                        {kpis.totalCount}
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
                      <i className="fa-solid fa-boxes-stacked"></i>
                    </div>
                  </div>
                  <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                    <span className="text-success fw-semibold">{kpis.activeCount} Active</span> • {kpis.inactiveCount} Inactive
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Total Stock Units */}
            <Col xs={12} sm={6} md={3} lg={3}>
              <Card
                className="border-0 shadow-sm h-100"
                style={{
                  borderRadius: "12px",
                  borderLeft: "4px solid #2563EB",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        Stock On Hand
                      </small>
                      <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.dark }}>
                        {kpis.totalStockUnits.toLocaleString()}
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
                      <i className="fa-solid fa-cubes"></i>
                    </div>
                  </div>
                  <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                    {kpis.totalIssuedUnits.toLocaleString()} units issued to date
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Low Stock Alerts */}
            <Col xs={12} sm={6} md={3} lg={2}>
              <Card
                className="border-0 shadow-sm h-100 cursor-pointer"
                onClick={() => setStockStatusFilter("low_stock")}
                style={{
                  borderRadius: "12px",
                  borderLeft: `4px solid ${COLORS.warning}`,
                  backgroundColor: stockStatusFilter === "low_stock" ? "#FEF3C7" : "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        Low Stock Alert
                      </small>
                      <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.warning }}>
                        {kpis.lowStockCount}
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
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                  </div>
                  <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                    At or below safety threshold
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Out of Stock */}
            <Col xs={12} sm={6} md={3} lg={2}>
              <Card
                className="border-0 shadow-sm h-100 cursor-pointer"
                onClick={() => setStockStatusFilter("out_of_stock")}
                style={{
                  borderRadius: "12px",
                  borderLeft: `4px solid ${COLORS.danger}`,
                  backgroundColor: stockStatusFilter === "out_of_stock" ? "#FEE2E2" : "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        Out of Stock
                      </small>
                      <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.danger }}>
                        {kpis.outOfStockCount}
                      </h4>
                    </div>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: COLORS.dangerLight,
                        color: COLORS.danger,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="fa-solid fa-ban"></i>
                    </div>
                  </div>
                  <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                    0 remaining units
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Valuation */}
            <Col xs={12} sm={6} md={3} lg={3}>
              <Card
                className="border-0 shadow-sm h-100"
                style={{
                  borderRadius: "12px",
                  borderLeft: `4px solid ${COLORS.success}`,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        Est. Inventory Value
                      </small>
                      <h4 className="mb-0 fw-bold mt-1" style={{ color: COLORS.success }}>
                        ₹{kpis.totalValuation.toLocaleString("en-IN")}
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
                      <i className="fa-solid fa-coins"></i>
                    </div>
                  </div>
                  <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                    Based on latest purchase cost
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Master Table Card Container */}
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "12px", overflow: "hidden" }}>
            {/* Filter & Toolbar Area */}
            <div className="p-3 bg-white border-bottom">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                {/* Segmented Filter Pills */}
                <div className="d-flex align-items-center gap-1 flex-wrap">
                  <button
                    className={`btn btn-sm ${stockStatusFilter === "all" ? "btn-dark" : "btn-light"}`}
                    onClick={() => setStockStatusFilter("all")}
                    style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                  >
                    All Items <Badge bg="light" text="dark" className="ms-1">{kpis.totalCount}</Badge>
                  </button>
                  <button
                    className={`btn btn-sm ${stockStatusFilter === "in_stock" ? "btn-success" : "btn-light"}`}
                    onClick={() => setStockStatusFilter("in_stock")}
                    style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                  >
                    In Stock <Badge bg="light" text="dark" className="ms-1">{kpis.inStockCount}</Badge>
                  </button>
                  <button
                    className={`btn btn-sm ${stockStatusFilter === "low_stock" ? "btn-warning" : "btn-light"}`}
                    onClick={() => setStockStatusFilter("low_stock")}
                    style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                  >
                    Low Stock <Badge bg="danger" className="ms-1">{kpis.lowStockCount}</Badge>
                  </button>
                  <button
                    className={`btn btn-sm ${stockStatusFilter === "out_of_stock" ? "btn-danger" : "btn-light"}`}
                    onClick={() => setStockStatusFilter("out_of_stock")}
                    style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                  >
                    Out of Stock <Badge bg="secondary" className="ms-1">{kpis.outOfStockCount}</Badge>
                  </button>
                  <button
                    className={`btn btn-sm ${stockStatusFilter === "inactive" ? "btn-secondary" : "btn-light"}`}
                    onClick={() => setStockStatusFilter("inactive")}
                    style={{ borderRadius: "20px", fontSize: "12px", padding: "5px 12px" }}
                  >
                    Inactive <Badge bg="light" text="dark" className="ms-1">{kpis.inactiveCount}</Badge>
                  </button>
                </div>

                {/* Right Search & Category Filter */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {/* Category Dropdown */}
                  <Form.Select
                    size="sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ width: "170px", borderRadius: "8px", fontSize: "13px" }}
                  >
                    <option value="all">All Categories</option>
                    {category.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Form.Select>

                  {/* Search Input */}
                  <TextField
                    id="search"
                    placeholder="Search products..."
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

                  {/* Bulk Actions */}
                  {hasDeletePermission && selectedRows.length > 0 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleBulkToggleStatus}
                      style={{ borderRadius: "8px", fontSize: "12px" }}
                    >
                      <i className="fa-solid fa-toggle-on me-1"></i> Toggle Status ({selectedRows.length})
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter summary status line */}
              <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                <small className="text-muted" style={{ fontSize: "12px" }}>
                  Showing <b>{filteredProduct.length}</b> of {product.length} products
                  {selectedCategory !== "all" && " (filtered by category)"}
                  {stockStatusFilter !== "all" && ` (filtered by ${stockStatusFilter.replace("_", " ")})`}
                  {filterText && ` matching "${filterText}"`}
                </small>

                {(filterText || selectedCategory !== "all" || stockStatusFilter !== "all") && (
                  <button
                    className="btn btn-link p-0 text-decoration-none"
                    style={{ fontSize: "12px", color: COLORS.primary }}
                    onClick={() => {
                      setFilterText("");
                      setSelectedCategory("all");
                      setStockStatusFilter("all");
                    }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>

            {/* Data Table */}
            <DataTable
              columns={columns}
              data={filteredProduct}
              pagination
              paginationPerPage={15}
              paginationRowsPerPageOptions={[10, 15, 25, 50, 100]}
              highlightOnHover
              customStyles={customTableStyles}
              selectableRows
              onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
              noDataComponent={
                <div className="p-5 text-center text-muted">
                  <i className="fa-solid fa-box-open mb-2" style={{ fontSize: "36px", color: "#CBD5E1" }}></i>
                  <p className="mb-0 fw-medium">No Products Found</p>
                  <small>Try adjusting your search query or status filter.</small>
                </div>
              }
            />
          </Card>

          {/* Quick Restock / Stock Adjust Modal */}
          <Modal
            show={showAdjustModal}
            onHide={() => setShowAdjustModal(false)}
            backdrop="static"
            centered
          >
            <Form onSubmit={handleQuickAdjustSubmit}>
              <Modal.Header closeButton style={{ backgroundColor: "#F8FAFC" }}>
                <Modal.Title style={{ fontSize: "16px", fontWeight: "600", color: "#1E293B" }}>
                  <i className="fa-solid fa-bolt me-2 text-warning"></i>
                  Quick Stock Adjustment
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                {adjustTarget && (() => {
                  const currentTotalBuy = parseFloat(adjustTarget.total_buy_quantity || 0);
                  const currentIssue = parseFloat(adjustTarget.total_issue_quantity || 0);
                  const currentRemaining = Math.max(0, currentTotalBuy - currentIssue);
                  const maxLimit = adjustTarget.max_quantity !== null && adjustTarget.max_quantity !== undefined && parseFloat(adjustTarget.max_quantity) > 0
                    ? parseFloat(adjustTarget.max_quantity)
                    : null;
                  const minLimit = parseFloat(adjustTarget.min_quantity || 0);
                  const maxCanAdd = maxLimit !== null ? Math.max(0, maxLimit - currentRemaining) : null;
                  const qtyVal = parseFloat(adjustQty) || 0;

                  let isAdjustOverMax = false;
                  let overMaxMessage = "";

                  if (maxLimit !== null && qtyVal > 0) {
                    if (adjustType === "restock") {
                      if (qtyVal > maxCanAdd) {
                        isAdjustOverMax = true;
                        overMaxMessage = `Adding ${qtyVal} units will exceed the max storage capacity of ${maxLimit} units! (Current: ${currentRemaining} + Adding: ${qtyVal} = ${currentRemaining + qtyVal}, Max: ${maxLimit}). You can add up to ${maxCanAdd} units.`;
                      }
                    } else if (adjustType === "set") {
                      if (qtyVal > maxLimit) {
                        isAdjustOverMax = true;
                        overMaxMessage = `New total buy quantity (${qtyVal}) cannot exceed maximum capacity limit of ${maxLimit} units.`;
                      }
                    }
                  }

                  return (
                    <>
                      <div
                        className="p-3 mb-3 rounded"
                        style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <div className="fw-bold fs-6" style={{ color: COLORS.dark }}>
                              {adjustTarget.name}
                            </div>
                            <small className="text-muted">
                              Category: {adjustTarget.category_name || "General"} • Unit: {adjustTarget.measurement_unit || "units"}
                            </small>
                          </div>
                          <Badge bg="primary" style={{ backgroundColor: `${COLORS.primary} !important`, fontSize: "12px", padding: "5px 10px" }}>
                            Remaining: {currentRemaining} {adjustTarget.measurement_unit || "units"}
                          </Badge>
                        </div>

                        {/* Limits Summary Deck */}
                        <div className="d-flex flex-wrap gap-2 pt-2 border-top" style={{ fontSize: "12px" }}>
                          <div className="px-2 py-1 rounded d-flex align-items-center gap-1" style={{ background: "#EEEDFE", color: "#534AB7", fontWeight: 700 }}>
                            <i className="fa-solid fa-boxes-stacked"></i>
                            <span>Max Storage Limit: <strong>{maxLimit !== null ? `${maxLimit} ${adjustTarget.measurement_unit || "units"}` : "Unlimited"}</strong></span>
                          </div>
                          <div className="px-2 py-1 rounded d-flex align-items-center gap-1" style={{ background: "#FEF3C7", color: "#92400E", fontWeight: 600 }}>
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            <span>Min Stock Alert: {minLimit > 0 ? `${minLimit} ${adjustTarget.measurement_unit || "units"}` : "None"}</span>
                          </div>
                          {maxLimit !== null && (
                            <div className="px-2 py-1 rounded d-flex align-items-center gap-1" style={{ background: maxCanAdd > 0 ? "#DCFCE7" : "#FEE2E2", color: maxCanAdd > 0 ? "#166534" : "#991B1B", fontWeight: 700 }}>
                              <i className={`fa-solid ${maxCanAdd > 0 ? "fa-arrow-up-right-dots" : "fa-ban"}`}></i>
                              <span>Headroom: {maxCanAdd > 0 ? `Can add up to ${maxCanAdd} ${adjustTarget.measurement_unit || "units"}` : `Full (${maxLimit} max reached)`}</span>
                            </div>
                          )}
                        </div>

                        {/* Capacity Utilization Progress Bar */}
                        {maxLimit !== null && (
                          <div className="mt-2 pt-1">
                            <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: "11px", color: "#64748B" }}>
                              <span>Warehouse Capacity Used</span>
                              <span className="fw-bold" style={{ color: currentRemaining >= maxLimit ? "#DC2626" : "#334155" }}>
                                {Math.min(100, Math.round((currentRemaining / maxLimit) * 100))}% ({currentRemaining} / {maxLimit})
                              </span>
                            </div>
                            <div className="progress" style={{ height: "6px", backgroundColor: "#E2E8F0", borderRadius: "3px" }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${Math.min(100, (currentRemaining / maxLimit) * 100)}%`,
                                  backgroundColor: currentRemaining >= maxLimit ? "#DC2626" : currentRemaining / maxLimit > 0.8 ? "#F59E0B" : "#10B981",
                                  borderRadius: "3px",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Action Type
                        </Form.Label>
                        <div className="d-flex gap-2">
                          <Button
                            type="button"
                            variant={adjustType === "restock" ? "primary" : "outline-secondary"}
                            size="sm"
                            className="flex-fill"
                            onClick={() => {
                              setAdjustType("restock");
                              setAdjustQty("");
                            }}
                            style={{
                              borderRadius: "8px",
                              backgroundColor: adjustType === "restock" ? COLORS.primary : "transparent",
                              borderColor: adjustType === "restock" ? COLORS.primary : "#CBD5E1",
                            }}
                          >
                            <i className="fa-solid fa-plus me-1"></i> Restock (Add)
                          </Button>
                          <Button
                            type="button"
                            variant={adjustType === "deduct" ? "danger" : "outline-secondary"}
                            size="sm"
                            className="flex-fill"
                            onClick={() => {
                              setAdjustType("deduct");
                              setAdjustQty("");
                            }}
                            style={{ borderRadius: "8px" }}
                          >
                            <i className="fa-solid fa-minus me-1"></i> Deduct Stock
                          </Button>
                          <Button
                            type="button"
                            variant={adjustType === "set" ? "dark" : "outline-secondary"}
                            size="sm"
                            className="flex-fill"
                            onClick={() => {
                              setAdjustType("set");
                              setAdjustQty("");
                            }}
                            style={{ borderRadius: "8px" }}
                          >
                            <i className="fa-solid fa-equals me-1"></i> Set Exact Total
                          </Button>
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <Form.Label className="fw-semibold text-secondary mb-0" style={{ fontSize: "13px" }}>
                            {adjustType === "restock"
                              ? "Quantity to Add (Incoming Shipment)"
                              : adjustType === "deduct"
                              ? "Quantity to Deduct (Damage/Correction)"
                              : "New Total Buy Quantity"}
                          </Form.Label>
                          {maxLimit !== null && adjustType === "restock" && (
                            <span style={{ fontSize: "11.5px", color: maxCanAdd > 0 ? "#166534" : "#DC2626", fontWeight: 700 }}>
                              Max Limit: {maxLimit} | Max Allowed to Add: {maxCanAdd} {adjustTarget.measurement_unit || "units"}
                            </span>
                          )}
                          {maxLimit !== null && adjustType === "set" && (
                            <span style={{ fontSize: "11.5px", color: "#DC2626", fontWeight: 700 }}>
                              Max Storage Limit: {maxLimit} {adjustTarget.measurement_unit || "units"}
                            </span>
                          )}
                        </div>
                        <Form.Control
                          type="number"
                          min="0.01"
                          step="any"
                          placeholder={
                            adjustType === "restock" && maxLimit !== null
                              ? `Max allowed: ${maxCanAdd}`
                              : adjustType === "set" && maxLimit !== null
                              ? `Max limit: ${maxLimit}`
                              : "e.g. 10"
                          }
                          value={adjustQty}
                          disabled={isAdjustOverMax || (adjustType === "restock" && maxLimit !== null && maxCanAdd === 0)}
                          onChange={(e) => setAdjustQty(e.target.value)}
                          isInvalid={isAdjustOverMax}
                          required
                          autoFocus
                          style={{
                            borderColor: isAdjustOverMax ? "#DC2626" : undefined,
                            backgroundColor: isAdjustOverMax || (adjustType === "restock" && maxLimit !== null && maxCanAdd === 0) ? "#FEE2E2" : undefined,
                            cursor: isAdjustOverMax || (adjustType === "restock" && maxLimit !== null && maxCanAdd === 0) ? "not-allowed" : undefined,
                          }}
                        />

                        {isAdjustOverMax && (
                          <div className="mt-2 p-2 rounded" style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: "12px" }}>
                            <div className="d-flex align-items-center gap-1 mb-1 fw-bold">
                              <i className="fa-solid fa-lock"></i>
                              <span>Quantity exceeds max limit! Field disabled.</span>
                            </div>
                            <div>{overMaxMessage}</div>
                            <div className="mt-2 d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-danger py-0 px-2"
                                style={{ fontSize: "11px", borderRadius: "4px" }}
                                onClick={() => setAdjustQty(adjustType === "restock" ? maxCanAdd : maxLimit)}
                              >
                                Set to Max Allowed ({adjustType === "restock" ? maxCanAdd : maxLimit})
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0 px-2"
                                style={{ fontSize: "11px", borderRadius: "4px" }}
                                onClick={() => setAdjustQty("")}
                              >
                                Reset & Re-enter
                              </button>
                            </div>
                          </div>
                        )}

                        {adjustType === "restock" && maxLimit !== null && maxCanAdd === 0 && !isAdjustOverMax && (
                          <div className="mt-2 p-2 rounded" style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: "12px" }}>
                            <i className="fa-solid fa-ban me-1"></i>
                            <strong>Warehouse is at maximum capacity ({maxLimit} units).</strong> No more items can be restocked.
                          </div>
                        )}
                      </Form.Group>

                      {/* Live Preview Calculation */}
                      {adjustQty && parseFloat(adjustQty) > 0 && !isAdjustOverMax && (
                        <div
                          className="p-2 mb-3 rounded text-center"
                          style={{
                            backgroundColor: "#ECFDF5",
                            border: "0.5px solid #A7F3D0",
                            fontSize: "13px",
                            color: "#065F46",
                          }}
                        >
                          {(() => {
                            const qty = parseFloat(adjustQty);
                            let nextTotalBuy = currentTotalBuy;
                            if (adjustType === "restock") nextTotalBuy += qty;
                            else if (adjustType === "deduct") nextTotalBuy = Math.max(currentIssue, currentTotalBuy - qty);
                            else if (adjustType === "set") nextTotalBuy = qty;
                            const nextAvail = Math.max(0, nextTotalBuy - currentIssue);

                            return (
                              <span>
                                Preview: Total Buy <b>{nextTotalBuy}</b> → Available Stock will be{" "}
                                <b>{nextAvail} {adjustTarget.measurement_unit || "units"}</b>
                              </span>
                            );
                          })()}
                        </div>
                      )}

                      <Form.Group className="mb-2">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Notes / Reason (Optional)
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. Restock from vendor, inventory physical recount"
                          value={adjustNotes}
                          onChange={(e) => setAdjustNotes(e.target.value)}
                        />
                      </Form.Group>

                      <div className="d-flex justify-content-end gap-2 pt-3 border-top mt-3">
                        <Button variant="secondary" size="sm" onClick={() => setShowAdjustModal(false)} style={{ borderRadius: "8px" }}>
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isAdjusting || isAdjustOverMax}
                          style={{
                            backgroundColor: isAdjustOverMax ? "#94a3b8" : COLORS.primary,
                            borderColor: isAdjustOverMax ? "#94a3b8" : COLORS.primary,
                            cursor: isAdjustOverMax ? "not-allowed" : "pointer",
                            borderRadius: "8px",
                            fontWeight: 600,
                            padding: "6px 18px",
                          }}
                        >
                          {isAdjusting ? "Updating..." : isAdjustOverMax ? "Exceeds Max Limit" : "Save Stock Adjustment"}
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </Modal.Body>
            </Form>
          </Modal>

          {/* Add / Edit Product Modal */}
          <Modal show={showModal} onHide={handleModalClose} backdrop="static" size="lg">
            <Form noValidate validated={validated} onSubmit={onSubmit}>
              <Modal.Header closeButton style={{ backgroundColor: "#F8FAFC" }}>
                <Modal.Title style={{ fontSize: "17px", fontWeight: "600", color: "#1E293B" }}>
                  <i className={`fa-solid ${isUpdate ? "fa-pen-to-square" : "fa-plus"} me-2 text-primary`}></i>
                  {isUpdate ? "Update Product Details" : "Add New Inventory Product"}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                <Container fluid className="p-0">
                  <h6
                    className="text-uppercase text-muted fw-bold mb-3"
                    style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                  >
                    1. Identity & Classification
                  </h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Product Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. A4 Paper Rim, Ball Pen"
                          name="name"
                          value={newProduct.name}
                          onChange={handleInputChange}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Please enter a product name.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Category <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="category_id"
                          value={newProduct.category_id}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Category</option>
                          {category.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          Please select a category.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <h6
                    className="text-uppercase text-muted fw-bold mt-3 mb-3"
                    style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                  >
                    2. Inventory Quantities & Controls
                  </h6>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Opening / Total Buy Quantity <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="Opening stock"
                          name="total_buy_quantity"
                          min="0"
                          step="any"
                          value={newProduct.total_buy_quantity}
                          onChange={handleInputChange}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Please enter initial buy quantity.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Measurement Unit
                        </Form.Label>
                        <Form.Select
                          name="measurement_units"
                          value={newProduct.measurement_units || ""}
                          onChange={handleInputChange}
                        >
                          <option value="">Select unit</option>
                          {uniqueUnits.map((unit, index) => (
                            <option key={index} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Status
                        </Form.Label>
                        <Form.Select
                          name="status"
                          value={newProduct.status}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Min Reorder Alert Threshold
                        </Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="e.g. 5"
                          name="min_quantity"
                          value={newProduct.min_quantity}
                          onChange={handleInputChange}
                        />
                        <Form.Text className="text-muted" style={{ fontSize: "11px" }}>
                          Triggers low stock alert when inventory falls to or below this.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Max Capacity Threshold
                        </Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="e.g. 100"
                          name="max_quantity"
                          value={newProduct.max_quantity}
                          onChange={handleInputChange}
                        />
                        <Form.Text className="text-muted" style={{ fontSize: "11px" }}>
                          Maximum expected storage level.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <h6
                    className="text-uppercase text-muted fw-bold mt-3 mb-3"
                    style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                  >
                    3. Description & Notes
                  </h6>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-2">
                        <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                          Description
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Specifications, brand, model, storage location..."
                          name="description"
                          value={newProduct.description}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Container>
              </Modal.Body>
              <Modal.Footer style={{ backgroundColor: "#F8FAFC" }}>
                <Button variant="secondary" onClick={handleModalClose} style={{ borderRadius: "8px" }}>
                  Close
                </Button>
                <Button
                  type="submit"
                  style={{
                    backgroundColor: COLORS.primary,
                    borderColor: COLORS.primary,
                    borderRadius: "8px",
                    fontWeight: "500",
                  }}
                >
                  {isUpdate ? "Save Changes" : "Create Product"}
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