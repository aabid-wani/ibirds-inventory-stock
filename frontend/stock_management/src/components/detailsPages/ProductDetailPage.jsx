import React, { useContext, useEffect, useState, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import stockManagementApis from "../apis/StockManagementApis";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Button,
  Card,
  Col,
  Container,
  Row,
  Modal,
  Form,
  Badge,
  ProgressBar,
  Nav,
  Table,
} from "react-bootstrap";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import unitData from "../../components/json/measurement.json";

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

export default function ProductDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { permissions, addNotification, loginData } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState([]);
  const [history, setHistory] = useState({ issues: [], purchases: [] });
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'issues' | 'purchases'
  const [loader, setLoader] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProductData, setEditProductData] = useState({});

  // Quick Restock Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState("restock");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const hasUpdatePermission =
    loginData?.role_name === "Admin" ||
    loginData?.role_name === "Super Admin" ||
    permissions?.some(
      (role) =>
        ["Admin", "Super Admin"].includes(role.role_name || role.name) ||
        (role.module_name?.toLowerCase() === "products" && (role.edit || role.add)) ||
        (!["Data Entry"].includes(role.name) && role.edit)
    );

  const handleCloseAdjustModal = () => {
    setShowAdjustModal(false);
    if (searchParams.get("action") === "restock" || searchParams.get("restock") === "true") {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("action");
      nextParams.delete("restock");
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleProductData = async (productId) => {
    setLoader(true);
    try {
      const [prodResult, historyResult, catResult] = await Promise.all([
        stockManagementApis.getProductById(productId),
        stockManagementApis.getProductHistory ? stockManagementApis.getProductHistory(productId).catch(() => ({ issues: [], purchases: [] })) : Promise.resolve({ issues: [], purchases: [] }),
        stockManagementApis.getProductCategory().catch(() => []),
      ]);

      if (prodResult && prodResult.length > 0) {
        const prodData = prodResult[0];
        setProduct(prodData);
        setEditProductData(prodData);

        const buy = parseFloat(prodData.total_buy_quantity || 0);
        const issue = parseFloat(prodData.total_issue_quantity || 0);
        const available = Math.max(0, buy - issue);
        const minQty = parseFloat(prodData.min_quantity || 0);

        if (available <= (minQty || 5) && addNotification) {
          addNotification(`Low stock warning for "${prodData.name}" (${available} remaining)`);
        }
      }

      setHistory(historyResult || { issues: [], purchases: [] });
      setCategory(catResult || []);
    } catch (error) {
      toast.error("Error fetching product data: " + error.message);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    if (id) {
      handleProductData(id);
    }
  }, [id]);

  // Auto-open Restock Modal when redirected from notification with ?action=restock
  useEffect(() => {
    if (product && (searchParams.get("action") === "restock" || searchParams.get("restock") === "true")) {
      setAdjustType("restock");
      setShowAdjustModal(true);
    }
  }, [product, searchParams]);

  const uniqueUnits = useMemo(() => {
    const allUnits = Object.values(unitData).flat();
    return [...new Set(allUnits)];
  }, []);

  // Compute calculated metrics
  const metrics = useMemo(() => {
    if (!product) return null;
    const buy = parseFloat(product.total_buy_quantity || 0);
    const issue = parseFloat(product.total_issue_quantity || 0);
    const available = Math.max(0, buy - issue);
    const minQty = parseFloat(product.min_quantity || 0);
    const maxQty = parseFloat(product.max_quantity || 0);
    const unitPrice = parseFloat(product.latest_price || product.avg_price || 0);
    const valuation = available * unitPrice;
    const turnoverPct = buy > 0 ? Math.min(100, Math.round((issue / buy) * 100)) : 0;
    const capacity = maxQty > 0 ? maxQty : buy > 0 ? buy : 1;
    const stockLevelPct = Math.min(100, Math.round((available / capacity) * 100));

    let healthStatus = "healthy";
    if (product.status === "inactive") healthStatus = "inactive";
    else if (available <= 0) healthStatus = "out_of_stock";
    else if (minQty > 0 && available <= minQty) healthStatus = "low_stock";

    return {
      buy,
      issue,
      available,
      minQty,
      maxQty,
      unitPrice,
      valuation,
      turnoverPct,
      stockLevelPct,
      healthStatus,
    };
  }, [product]);

  // Edit Handlers
  const handleEditProductDataChange = (e) => {
    const { name, value } = e.target;
    setEditProductData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editProductData,
        updated_by: loginData?.id,
      };
      const response = await stockManagementApis.updateProduct(product.id, payload);
      if (response.success) {
        toast.success("Product updated successfully");
        setShowEditModal(false);
        handleProductData(product.id);
      } else {
        toast.error(response.errors || "Product update failed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update product");
    }
  };

  // Quick Restock / Adjust Handlers
  const handleQuickAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustQty || parseFloat(adjustQty) <= 0) {
      toast.error("Please enter a valid positive quantity");
      return;
    }

    setIsAdjusting(true);
    try {
      const resp = await stockManagementApis.adjustProductStock(product.id, {
        adjustment_type: adjustType,
        quantity: parseFloat(adjustQty),
        notes: adjustNotes,
      });

      if (resp.success) {
        toast.success(resp.message || "Stock adjusted successfully");
        handleCloseAdjustModal();
        setAdjustQty("");
        setAdjustNotes("");
        handleProductData(product.id);
      } else {
        toast.error(resp.message || "Failed to adjust stock");
      }
    } catch (err) {
      toast.error(err.message || "Failed to adjust stock");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Toggle Status Handler
  const handleToggleStatus = async () => {
    try {
      if (stockManagementApis.toggleProductStatus) {
        const resp = await stockManagementApis.toggleProductStatus(product.id);
        toast.success(resp.message || "Product status toggled");
      } else {
        await stockManagementApis.deleteProduct(product.id);
        toast.success("Product status changed");
      }
      handleProductData(product.id);
    } catch (err) {
      toast.error(err.message || "Failed to change status");
    }
  };

  if (!product) {
    return (
      <Main>
        <Container fluid className="px-4 py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading product details...</p>
        </Container>
      </Main>
    );
  }

  return (
    <Main>
      {/* Breadcrumb Header */}
      <div className="my-3 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div style={{ fontSize: "14px" }}>
          <Link to="/Home" className="text-decoration-none" style={{ color: COLORS.primary, fontWeight: "500" }}>
            <i className="fa-solid fa-house me-1"></i> Home
          </Link>
          <span className="text-muted mx-2">/</span>
          <Link to="/product" className="text-decoration-none" style={{ color: COLORS.primary, fontWeight: "500" }}>
            Products
          </Link>
          <span className="text-muted mx-2">/</span>
          <span className="text-secondary fw-semibold">{product.name}</span>
        </div>

        <Link to="/product">
          <Button
            variant="outline-secondary"
            size="sm"
            style={{ borderRadius: "8px", fontSize: "13px" }}
          >
            <i className="fa-solid fa-arrow-left me-1"></i> Back to Products
          </Button>
        </Link>
      </div>

      <Container fluid className="px-3">
        {/* Product Master Cockpit Card */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "12px", overflow: "hidden" }}>
          {/* Hero Header */}
          <div className="p-4 bg-white border-bottom">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#475569",
                      backgroundColor: "#F1F5F9",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    SKU #{product.id ? product.id.slice(0, 8).toUpperCase() : "PRD"}
                  </span>

                  <h3 className="mb-0 fw-bold" style={{ color: COLORS.dark }}>
                    {product.name}
                  </h3>

                  {/* Active / Inactive Badge */}
                  <Badge
                    bg={product.status === "active" ? "success" : "secondary"}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      backgroundColor:
                        product.status === "active" ? "#10B981 !important" : "#64748B !important",
                    }}
                  >
                    <i
                      className={`fa-solid ${
                        product.status === "active" ? "fa-circle-check" : "fa-circle-xmark"
                      } me-1`}
                    ></i>
                    {product.status === "active" ? "Active" : "Inactive"}
                  </Badge>

                  {/* Stock Health Alert Pill */}
                  {metrics && (
                    <>
                      {metrics.healthStatus === "out_of_stock" && (
                        <Badge
                          bg="danger"
                          style={{
                            padding: "5px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            backgroundColor: "#EF4444 !important",
                          }}
                        >
                          <i className="fa-solid fa-triangle-exclamation me-1"></i> Out of Stock
                        </Badge>
                      )}
                      {metrics.healthStatus === "low_stock" && (
                        <Badge
                          bg="warning"
                          className="text-dark"
                          style={{
                            padding: "5px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            backgroundColor: "#F59E0B !important",
                            color: "#78350F !important",
                          }}
                        >
                          <i className="fa-solid fa-bell me-1"></i> Low Stock Alert (Reorder Required)
                        </Badge>
                      )}
                      {metrics.healthStatus === "healthy" && (
                        <Badge
                          bg="light"
                          text="success"
                          style={{
                            padding: "5px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            border: "1px solid #A7F3D0",
                          }}
                        >
                          <i className="fa-solid fa-check-double me-1"></i> Healthy Stock
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                <div className="d-flex align-items-center gap-3 text-muted" style={{ fontSize: "13px" }}>
                  <span>
                    <i className="fa-solid fa-layer-group me-1" style={{ color: COLORS.primary }}></i>
                    {product.category_name || "Uncategorized"}
                  </span>
                  <span>•</span>
                  <span>
                    <i className="fa-solid fa-scale-balanced me-1" style={{ color: COLORS.primary }}></i>
                    Unit: <b>{product.measurement_unit || "units"}</b>
                  </span>
                  {product.description && (
                    <>
                      <span>•</span>
                      <span className="text-secondary">{product.description}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {hasUpdatePermission && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setShowAdjustModal(true)}
                      style={{
                        backgroundColor: COLORS.primary,
                        borderColor: COLORS.primary,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      <i className="fa-solid fa-bolt me-1 text-warning"></i> Quick Restock / Adjust
                    </Button>

                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                      style={{
                        borderRadius: "8px",
                        fontSize: "13px",
                        borderColor: COLORS.primary,
                        color: COLORS.primary,
                      }}
                    >
                      <i className="fa-regular fa-pen-to-square me-1"></i> Edit Details
                    </Button>

                    <Button
                      variant={product.status === "active" ? "outline-danger" : "outline-success"}
                      size="sm"
                      onClick={handleToggleStatus}
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                    >
                      <i className={`fa-solid ${product.status === "active" ? "fa-ban" : "fa-check"} me-1`}></i>
                      {product.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Banner */}
          {metrics && (
            <div className="p-4" style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <Row className="g-3">
                {/* Available Stock */}
                <Col xs={12} sm={6} md={3}>
                  <Card className="border-0 shadow-none h-100 p-3" style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                      Available Stock
                    </small>
                    <div className="d-flex align-items-baseline gap-2 mt-1">
                      <span
                        className="fw-bold"
                        style={{
                          fontSize: "28px",
                          color:
                            metrics.available <= 0
                              ? COLORS.danger
                              : metrics.minQty > 0 && metrics.available <= metrics.minQty
                              ? COLORS.warning
                              : COLORS.success,
                        }}
                      >
                        {metrics.available}
                      </span>
                      <span className="text-muted" style={{ fontSize: "13px" }}>
                        {product.measurement_unit || "units"}
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar
                        now={metrics.stockLevelPct}
                        style={{ height: "6px", borderRadius: "3px" }}
                        variant={
                          metrics.available <= 0
                            ? "danger"
                            : metrics.minQty > 0 && metrics.available <= metrics.minQty
                            ? "warning"
                            : "success"
                        }
                      />
                      <div className="d-flex justify-content-between mt-1 text-muted" style={{ fontSize: "11px" }}>
                        <span>Capacity: {metrics.maxQty > 0 ? metrics.maxQty : metrics.buy} max</span>
                        <span>{metrics.stockLevelPct}% filled</span>
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* Total Buy vs Issued */}
                <Col xs={12} sm={6} md={3}>
                  <Card className="border-0 shadow-none h-100 p-3" style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                      Lifetime Movements
                    </small>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <div>
                        <div className="text-muted" style={{ fontSize: "11px" }}>Total Purchased</div>
                        <div className="fw-bold fs-5" style={{ color: "#1E293B" }}>{metrics.buy}</div>
                      </div>
                      <div className="text-end">
                        <div className="text-muted" style={{ fontSize: "11px" }}>Total Issued</div>
                        <div className="fw-bold fs-5" style={{ color: "#475569" }}>{metrics.issue}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                      Consumption rate: <span className="fw-semibold text-primary">{metrics.turnoverPct}%</span>
                    </div>
                  </Card>
                </Col>

                {/* Safety Stock Thresholds */}
                <Col xs={12} sm={6} md={3}>
                  <Card className="border-0 shadow-none h-100 p-3" style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                      Threshold Safeguards
                    </small>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <div>
                        <div className="text-muted" style={{ fontSize: "11px" }}>Min Reorder Limit</div>
                        <div className="fw-bold fs-5 text-warning">{metrics.minQty || "None"}</div>
                      </div>
                      <div className="text-end">
                        <div className="text-muted" style={{ fontSize: "11px" }}>Max Storage Cap</div>
                        <div className="fw-bold fs-5 text-secondary">{metrics.maxQty || "None"}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                      {metrics.minQty > 0 && metrics.available <= metrics.minQty ? (
                        <span className="text-danger fw-semibold">
                          <i className="fa-solid fa-triangle-exclamation me-1"></i>Reorder Recommended
                        </span>
                      ) : (
                        <span className="text-success">
                          <i className="fa-solid fa-shield-halved me-1"></i>Within safety limits
                        </span>
                      )}
                    </div>
                  </Card>
                </Col>

                {/* Valuation */}
                <Col xs={12} sm={6} md={3}>
                  <Card className="border-0 shadow-none h-100 p-3" style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                      Stock Valuation
                    </small>
                    <div className="d-flex align-items-baseline gap-2 mt-1">
                      <span className="fw-bold text-success" style={{ fontSize: "24px" }}>
                        {metrics.valuation > 0 ? `₹${metrics.valuation.toLocaleString("en-IN")}` : "—"}
                      </span>
                    </div>
                    <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
                      {metrics.unitPrice > 0 ? (
                        <span>Last purchase unit price: ₹{metrics.unitPrice.toFixed(2)}</span>
                      ) : (
                        <span>No purchase price record</span>
                      )}
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {/* Interactive Navigation Tabs */}
          <div className="px-4 pt-3 bg-white border-bottom">
            <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav.Item>
                <Nav.Link eventKey="overview" className="fw-semibold">
                  <i className="fa-solid fa-circle-info me-2"></i> Specifications & Details
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="issues" className="fw-semibold">
                  <i className="fa-solid fa-hand-holding me-2"></i> Issue History (
                  {history.issues.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="purchases" className="fw-semibold">
                  <i className="fa-solid fa-cart-shopping me-2"></i> Purchase Orders (
                  {history.purchases.length})
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          {/* Tab Content Area */}
          <div className="p-4 bg-white">
            {activeTab === "overview" && (
              <Row className="g-4">
                <Col md={6}>
                  <div className="p-3 rounded" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
                      <i className="fa-solid fa-tag me-2 text-primary"></i> General Specifications
                    </h6>
                    <Table borderless size="sm" className="mb-0">
                      <tbody>
                        <tr>
                          <td className="text-muted" style={{ width: "40%", fontSize: "13px" }}>Product Name:</td>
                          <td className="fw-semibold" style={{ fontSize: "13px" }}>{product.name}</td>
                        </tr>
                        <tr>
                          <td className="text-muted" style={{ fontSize: "13px" }}>Category:</td>
                          <td className="fw-semibold" style={{ fontSize: "13px" }}>{product.category_name || "Uncategorized"}</td>
                        </tr>
                        <tr>
                          <td className="text-muted" style={{ fontSize: "13px" }}>Measurement Unit:</td>
                          <td className="fw-semibold" style={{ fontSize: "13px" }}>{product.measurement_unit || "units"}</td>
                        </tr>
                        <tr>
                          <td className="text-muted" style={{ fontSize: "13px" }}>Current Status:</td>
                          <td>
                            <Badge bg={product.status === "active" ? "success" : "secondary"}>
                              {product.status || "active"}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted" style={{ fontSize: "13px" }}>Description:</td>
                          <td style={{ fontSize: "13px" }}>{product.description || "No description provided."}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="p-3 rounded" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
                      <i className="fa-solid fa-sliders me-2 text-primary"></i> Inventory Controls & Quantities
                    </h6>
                    <Table borderless size="sm" className="mb-0">
                      <tbody>
                        <tr>
                          <td className="text-muted" style={{ width: "40%", fontSize: "13px" }}>Total Buy / Inward:</td>
                          <td className="fw-semibold" style={{ fontSize: "13px" }}>{product.total_buy_quantity || 0} {product.measurement_unit}</td>
                        </tr>
                        <tr>
                          <td className="text-muted" style={{ fontSize: "13px" }}>Total Issued:</td>
                          <td className="fw-semibold" style={{ fontSize: "13px" }}>{product.total_issue_quantity || 0} {product.measurement_unit}</td>
                        </tr>
                        <tr>
                          <td className="text-muted" style={{ fontSize: "13px" }}>Available In Stock:</td>
                          <td className="fw-bold text-success" style={{ fontSize: "14px" }}>
                            {metrics ? metrics.available : 0} {product.measurement_unit}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted" style={{ fontSize: "13px" }}>Min Reorder Limit:</td>
                          <td className="fw-semibold text-warning" style={{ fontSize: "13px" }}>{product.min_quantity || "None"}</td>
                        </tr>
                        <tr>
                          <td className="text-muted" style={{ fontSize: "13px" }}>Max Storage Cap:</td>
                          <td className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>{product.max_quantity || "None"}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </Col>
              </Row>
            )}

            {activeTab === "issues" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0">
                    <i className="fa-solid fa-hand-holding me-2 text-primary"></i>
                    Recent Dispatches & Employee Issues
                  </h6>
                  <small className="text-muted">Showing up to 25 latest issue records</small>
                </div>

                {history.issues.length === 0 ? (
                  <div className="p-5 text-center text-muted border rounded" style={{ backgroundColor: "#F8FAFC" }}>
                    <i className="fa-solid fa-inbox mb-2" style={{ fontSize: "32px", color: "#CBD5E1" }}></i>
                    <p className="mb-0 fw-medium">No issue history recorded yet.</p>
                    <small>Items dispatched to staff or branches will appear here.</small>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle border" style={{ fontSize: "13px" }}>
                      <thead style={{ backgroundColor: "#F1F5F9" }}>
                        <tr>
                          <th>Date</th>
                          <th>Recipient</th>
                          <th>Branch</th>
                          <th>Issued Qty</th>
                          <th>Status</th>
                          <th>Issued By</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.issues.map((iss, i) => (
                          <tr key={iss.id || i}>
                            <td className="fw-medium">
                              {iss.issue_date ? new Date(iss.issue_date).toLocaleDateString() : "—"}
                            </td>
                            <td>
                              <span className="fw-semibold text-dark">{iss.employee_name || "—"}</span>
                            </td>
                            <td>{iss.branch_name || "—"}</td>
                            <td>
                              <Badge bg="primary" style={{ backgroundColor: `${COLORS.primary} !important` }}>
                                {iss.quantity} {product.measurement_unit}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={iss.status === "approved" || iss.status === "issued" ? "success" : "secondary"}>
                                {iss.status || "completed"}
                              </Badge>
                            </td>
                            <td className="text-muted">{iss.user_name || "System"}</td>
                            <td className="text-muted">{iss.description || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "purchases" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0">
                    <i className="fa-solid fa-cart-shopping me-2 text-primary"></i>
                    Purchase Orders & Inward Deliveries
                  </h6>
                  <small className="text-muted">Showing inward shipments and PO line items</small>
                </div>

                {history.purchases.length === 0 ? (
                  <div className="p-5 text-center text-muted border rounded" style={{ backgroundColor: "#F8FAFC" }}>
                    <i className="fa-solid fa-receipt mb-2" style={{ fontSize: "32px", color: "#CBD5E1" }}></i>
                    <p className="mb-0 fw-medium">No purchase order items found.</p>
                    <small>Purchases created through the Purchases module will show here.</small>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle border" style={{ fontSize: "13px" }}>
                      <thead style={{ backgroundColor: "#F1F5F9" }}>
                        <tr>
                          <th>Order #</th>
                          <th>Order Date</th>
                          <th>Vendor</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.purchases.map((po, i) => (
                          <tr key={po.id || i}>
                            <td className="fw-bold text-primary">
                              {po.order_number || `#PO-${String(i + 1).padStart(4, "0")}`}
                            </td>
                            <td>{po.order_date ? new Date(po.order_date).toLocaleDateString() : "—"}</td>
                            <td className="fw-medium">{po.vendor_name || "—"}</td>
                            <td>
                              <Badge bg="success" style={{ backgroundColor: `${COLORS.success} !important` }}>
                                +{po.quantity} {product.measurement_unit}
                              </Badge>
                            </td>
                            <td>₹{parseFloat(po.price || 0).toFixed(2)}</td>
                            <td className="fw-bold text-dark">
                              ₹{(parseFloat(po.quantity || 0) * parseFloat(po.price || 0)).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </Container>

      {/* Quick Restock / Stock Adjust Modal */}
      <Modal show={showAdjustModal} onHide={handleCloseAdjustModal} backdrop="static" centered>
        <Form onSubmit={handleQuickAdjustSubmit}>
          <Modal.Header closeButton style={{ backgroundColor: "#F8FAFC" }}>
            <Modal.Title style={{ fontSize: "16px", fontWeight: "600", color: "#1E293B" }}>
              <i className="fa-solid fa-bolt me-2 text-warning"></i>
              Quick Restock: {product.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                Adjustment Action
              </Form.Label>
              <div className="d-flex gap-2">
                <Button
                  type="button"
                  variant={adjustType === "restock" ? "primary" : "outline-secondary"}
                  size="sm"
                  className="flex-fill"
                  onClick={() => setAdjustType("restock")}
                  style={{
                    borderRadius: "8px",
                    backgroundColor: adjustType === "restock" ? COLORS.primary : "transparent",
                    borderColor: adjustType === "restock" ? COLORS.primary : "#CBD5E1",
                  }}
                >
                  <i className="fa-solid fa-plus me-1"></i> Inward Restock
                </Button>
                <Button
                  type="button"
                  variant={adjustType === "deduct" ? "danger" : "outline-secondary"}
                  size="sm"
                  className="flex-fill"
                  onClick={() => setAdjustType("deduct")}
                  style={{ borderRadius: "8px" }}
                >
                  <i className="fa-solid fa-minus me-1"></i> Deduct
                </Button>
                <Button
                  type="button"
                  variant={adjustType === "set" ? "dark" : "outline-secondary"}
                  size="sm"
                  className="flex-fill"
                  onClick={() => setAdjustType("set")}
                  style={{ borderRadius: "8px" }}
                >
                  <i className="fa-solid fa-equals me-1"></i> Set Total
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                {adjustType === "restock"
                  ? "Units to Add"
                  : adjustType === "deduct"
                  ? "Units to Deduct"
                  : "New Total Buy Quantity"}
              </Form.Label>
              <Form.Control
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 10"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>

            {/* Live Calculation Preview */}
            {adjustQty && parseFloat(adjustQty) > 0 && (
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
                  const currentBuy = parseFloat(product.total_buy_quantity || 0);
                  const currentIssue = parseFloat(product.total_issue_quantity || 0);
                  const qty = parseFloat(adjustQty);
                  let nextBuy = currentBuy;
                  if (adjustType === "restock") nextBuy += qty;
                  else if (adjustType === "deduct") nextBuy = Math.max(currentIssue, currentBuy - qty);
                  else if (adjustType === "set") nextBuy = qty;
                  const nextAvail = Math.max(0, nextBuy - currentIssue);

                  return (
                    <span>
                      Preview: Buy Qty <b>{nextBuy}</b> → Available Stock will be{" "}
                      <b>{nextAvail} {product.measurement_unit || "units"}</b>
                    </span>
                  );
                })()}
              </div>
            )}

            <Form.Group className="mb-2">
              <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                Notes / Reference (Optional)
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Inward from Supplier, physical inventory verification"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: "#F8FAFC" }}>
            <Button variant="secondary" size="sm" onClick={handleCloseAdjustModal} style={{ borderRadius: "8px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isAdjusting}
              style={{
                backgroundColor: COLORS.primary,
                borderColor: COLORS.primary,
                borderRadius: "8px",
              }}
            >
              {isAdjusting ? "Updating..." : "Save Stock Adjustment"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} backdrop="static" size="lg">
        <Form onSubmit={handleSaveChanges}>
          <Modal.Header closeButton style={{ backgroundColor: "#F8FAFC" }}>
            <Modal.Title style={{ fontSize: "16px", fontWeight: "600", color: "#1E293B" }}>
              <i className="fa-regular fa-pen-to-square me-2 text-primary"></i>
              Update Product Information
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Container fluid className="p-0">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                      Product Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={editProductData.name || ""}
                      onChange={handleEditProductDataChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                      Category
                    </Form.Label>
                    <Form.Select
                      name="category_id"
                      value={editProductData.category_id || ""}
                      onChange={handleEditProductDataChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {category.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
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
                      Total Buy Quantity
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="total_buy_quantity"
                      value={editProductData.total_buy_quantity || ""}
                      onChange={handleEditProductDataChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                      Measurement Unit
                    </Form.Label>
                    <Form.Select
                      name="measurement_units"
                      value={editProductData.measurement_unit || editProductData.measurement_units || ""}
                      onChange={(e) => {
                        setEditProductData((p) => ({
                          ...p,
                          measurement_unit: e.target.value,
                          measurement_units: e.target.value,
                        }));
                      }}
                    >
                      <option value="">Select unit</option>
                      {uniqueUnits.map((u, i) => (
                        <option key={i} value={u}>
                          {u}
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
                      value={editProductData.status || "active"}
                      onChange={handleEditProductDataChange}
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
                      Min Reorder Quantity
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="min_quantity"
                      value={editProductData.min_quantity || ""}
                      onChange={handleEditProductDataChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                      Max Quantity
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="max_quantity"
                      value={editProductData.max_quantity || ""}
                      onChange={handleEditProductDataChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Form.Group className="mb-2">
                    <Form.Label className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                      Description
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={editProductData.description || ""}
                      onChange={handleEditProductDataChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Container>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: "#F8FAFC" }}>
            <Button variant="secondary" size="sm" onClick={() => setShowEditModal(false)} style={{ borderRadius: "8px" }}>
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
    </Main>
  );
}