import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import stockManagementApis from "../apis/StockManagementApis";
import { ToastContainer, toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import Main from "../layout/Main";
import moment from "moment";
import {
  Button,
  Card,
  Col,
  Container,
  Row,
  Modal,
  Form,
  Table,
  Tabs,
  Tab,
} from "react-bootstrap";
import { AuthContext } from "../context/AuthProvider";

const PURPLE = "#534AB7";
const TEAL = "#1D9E75";
const CORAL = "#D85A30";

export default function OrderDetailPage() {
  const { id } = useParams();
  const { permissions } = useContext(AuthContext);

  const [order, setOrder] = useState({});
  const [orderLineItems, setOrderLineItems] = useState([]);
  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showLineModal, setShowLineModal] = useState(false);
  const [modalMode, setModalMode] = useState("return"); // "return" | "edit"

  const [orderForm, setOrderForm] = useState({
    user_name: "",
    branch_name: "",
    vendor_name: "",
    order_number: "",
    order_date: "",
    total_amount: "",
    invoice_number: "",
    status: true,
  });
  const [invoiceError, setInvoiceError] = useState("");

  const [returnDetails, setReturnDetails] = useState({
    product_id: "",
    product_name: "",
    quantity: "",
    return_date: "",
    issue_id: "",
    order_id: id,
    orderLineItem_id: "",
  });
  const [editDetails, setEditDetails] = useState({
    id: "",
    product_id: "",
    product_name: "",
    quantity: "",
    price: "",
    min_quantity: 1,
    max_quantity: undefined,
  });

  const hasRole = (names) => permissions?.some((r) => names.includes(r.name));
  const canUpdateHeader = hasRole(["Admin", "Super Admin"]);
  const canReturnOrEdit = canUpdateHeader || !hasRole(["Data Entry"]);

  const fetchHeader = async () => {
    try {
      const orderData = await stockManagementApis.getOrderById(id);
      const productData = await stockManagementApis.getProduct();
      if (orderData && orderData.length > 0) {
        setOrder(orderData[0]);
        setOrderForm(orderData[0]);
      }
      setProducts(productData || []);
    } catch (err) {
      console.error("Failed to fetch order header", err);
    }
  };

  const fetchLineItems = async () => {
    try {
      const items = await stockManagementApis.getOrderLineItemById(id);
      setOrderLineItems(items || []);
    } catch (err) {
      console.error("Failed to fetch order line items", err);
    }
  };

  const fetchReturns = async () => {
    try {
      const res = await stockManagementApis.getReturnByOrderId(id);
      setReturns(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to fetch returns", err);
    }
  };

  useEffect(() => {
    fetchHeader();
    fetchLineItems();
    fetchReturns();
  }, [id]);

  const openReturn = (item) => {
    setModalMode("return");
    setReturnDetails({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: "",
      return_date: moment().format("YYYY-MM-DD"),
      issue_id: item.issue_id || "",
      order_id: id,
      orderLineItem_id: item.id,
      max_available: item.quantity,
    });
    setShowLineModal(true);
  };

  const openEdit = (item) => {
    const productObj = products.find((p) => p.id === item.product_id) || {};
    setModalMode("edit");
    setEditDetails({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      min_quantity: productObj.min_quantity ?? 1,
      max_quantity: productObj.max_quantity ?? (productObj.total_buy_quantity || 0) + (productObj.max_quantity_increment ?? 0),
    });
    setShowLineModal(true);
  };

  const closeLineModal = () => setShowLineModal(false);

  const handleOrderFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "invoice_number" && value.length > 15) {
      setInvoiceError("Invoice number must be less than 15 characters");
    } else {
      setInvoiceError("");
    }
    setOrderForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveOrderHeader = async (e) => {
    e.preventDefault();
    try {
      await stockManagementApis.updateOrder(order.id, orderForm);
      toast.success("Order updated successfully");
      setShowOrderModal(false);
      fetchHeader();
    } catch (err) {
      toast.error("Failed to update order header");
    }
  };

  const submitLineModal = async (e) => {
    e.preventDefault();

    if (modalMode === "return") {
      const line = orderLineItems.find((li) => li.id === returnDetails.orderLineItem_id);
      const qty = parseInt(returnDetails.quantity, 10);

      if (!line || qty > line.quantity) {
        toast.error("Return qty exceeds line item qty");
        return;
      }
      const product = products.find((p) => p.id === line.product_id);
      const newTotalStock = (product?.total_buy_quantity || 0) - qty;

      if (newTotalStock < 0) {
        toast.error("Insufficient stock on hand to process return");
        return;
      }

      try {
        await stockManagementApis.addReturn(returnDetails);
        await stockManagementApis.updateStock(product.id, { total_buy_quantity: newTotalStock });
        toast.success("Return logged and inventory deducted");
        fetchReturns();
        fetchHeader();
        fetchLineItems();
        closeLineModal();
      } catch (err) {
        toast.error("Failed to add return");
      }
    } else {
      const line = orderLineItems.find((li) => li.id === editDetails.id);
      if (!line) {
        toast.error("Line item not found");
        return;
      }

      const newQty = parseInt(editDetails.quantity, 10);
      if (isNaN(newQty) || newQty <= 0) {
        toast.error("Please provide a valid quantity");
        return;
      }

      const product = products.find((p) => p.id === editDetails.product_id);
      if (!product) {
        toast.error("Product not found");
        return;
      }

      const delta = newQty - line.quantity;
      const updatedStock = parseFloat(product.total_buy_quantity || 0) + delta;

      if (updatedStock < 0) {
        toast.error("Insufficient stock for this update");
        return;
      }

      try {
        await stockManagementApis.updateOrderLineItemQuantity(editDetails.product_id, {
          quantity: newQty,
          price: editDetails.price,
        });

        await stockManagementApis.updateStock(product.id, { total_buy_quantity: updatedStock });

        toast.success("Line item and product stock updated");
        fetchLineItems();
        fetchHeader();
        closeLineModal();
      } catch (err) {
        toast.error("Failed to update line item");
      }
    }
  };

  const totalQuantity = orderLineItems.reduce((acc, item) => acc + (parseInt(item.quantity, 10) || 0), 0);
  const totalReturnsCount = returns.reduce((acc, r) => acc + (parseInt(r.quantity, 10) || 0), 0);

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
            /{" "}
            <Link to="/order" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Purchases
            </Link>{" "}
            / <span style={{ color: "#0f172a", fontWeight: 600 }}>{order.order_number || `PO-${id}`}</span>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/order"
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
              <i className="fa-solid fa-arrow-left me-1"></i> Back to Orders
            </Link>

            {canUpdateHeader && (
              <button
                onClick={() => setShowOrderModal(true)}
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
                <i className="fa-regular fa-pen-to-square"></i> Edit PO Header
              </button>
            )}
          </div>
        </div>

        {/* ── Hero Order Banner ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ height: "6px", background: `linear-gradient(90deg, ${PURPLE}, #818cf8)` }} />
          <div className="p-4" style={{ background: "#ffffff" }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <div className="d-flex align-items-center gap-3">
                  <h4 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                    Purchase Order #{order.order_number || `PO-${order.id}`}
                  </h4>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: "99px",
                      background: order.status ? "#dcfce7" : "#fee2e2",
                      color: order.status ? "#15803d" : "#b91c1c",
                    }}
                  >
                    {order.status ? "CONFIRMED & RECEIVED" : "INACTIVE / CANCELLED"}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3 mt-1 flex-wrap" style={{ fontSize: "13px", color: "#64748b" }}>
                  <span>
                    <i className="fa-regular fa-calendar me-1"></i> PO Date:{" "}
                    <strong>{order.order_date ? moment(order.order_date).format("DD MMM YYYY") : "—"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    <i className="fa-solid fa-file-invoice me-1"></i> Bill Ref:{" "}
                    <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                      {order.invoice_number || "NO-INVOICE"}
                    </span>
                  </span>
                  <span>•</span>
                  <span>
                    <i className="fa-solid fa-store me-1"></i> Supplier:{" "}
                    <strong style={{ color: "#0f172a" }}>{order.vendor_name || "—"}</strong>
                  </span>
                </div>
              </div>

              {/* Grand Total Value Badge */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "12px 20px",
                  textAlign: "right",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                  Total Valuation
                </div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#15803d", lineHeight: 1.2 }}>
                  ₹{parseFloat(order.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Metadata Spec Cards ── */}
        <Row className="g-3 mb-4">
          <Col md={3}>
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
                Total Line Items
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                {orderLineItems.length} SKUs
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Distinct products procured</div>
            </div>
          </Col>

          <Col md={3}>
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
                Total Inward Quantity
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: TEAL, marginTop: "4px" }}>
                {totalQuantity} Units
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Physical units received</div>
            </div>
          </Col>

          <Col md={3}>
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
                Returned Quantity
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: CORAL, marginTop: "4px" }}>
                {totalReturnsCount} Units
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Dispatched back to vendor</div>
            </div>
          </Col>

          <Col md={3}>
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
                Receiving Branch
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", marginTop: "6px" }}>
                {order.branch_name || "Head Office Ajmer"}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Operator: {order.user_name || "Staff"}</div>
            </div>
          </Col>
        </Row>

        {/* ── Related Tables (Line Items & Returns) ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
          <Tabs defaultActiveKey="lines" className="px-3 pt-3 border-bottom bg-white">
            <Tab eventKey="lines" title={`Procured Items (${orderLineItems.length})`}>
              <Table responsive hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
                <thead style={{ background: "#1e293b", color: "#f8fafc" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", width: "70px" }}>S.No</th>
                    <th style={{ padding: "12px 16px" }}>Product Name</th>
                    <th style={{ padding: "12px 16px" }}>Quantity Inward</th>
                    <th style={{ padding: "12px 16px" }}>Unit Price</th>
                    <th style={{ padding: "12px 16px" }} className="text-end">Subtotal</th>
                    {canReturnOrEdit && <th style={{ padding: "12px 16px" }} className="text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {orderLineItems.length > 0 ? (
                    orderLineItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>
                          {item.product_name}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{item.quantity}</span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>
                          ₹{parseFloat(item.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }} className="text-end">
                          ₹{(parseFloat(item.price || 0) * parseInt(item.quantity, 10)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        {canReturnOrEdit && (
                          <td style={{ padding: "12px 16px" }} className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn btn-sm"
                                onClick={() => openEdit(item)}
                                style={{
                                  border: "1px solid #c7d2fe",
                                  background: "#eeedfe",
                                  color: PURPLE,
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                }}
                                title="Edit Line Item"
                              >
                                <i className="fa-regular fa-pen-to-square"></i>
                              </button>
                              <button
                                className="btn btn-sm"
                                onClick={() => openReturn(item)}
                                style={{
                                  border: "1px solid #fed7aa",
                                  background: "#fff7ed",
                                  color: "#c2410c",
                                  borderRadius: "6px",
                                  padding: "4px 10px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                }}
                                title="Process Vendor Return"
                              >
                                <i className="fa-solid fa-arrow-rotate-left me-1"></i> Return
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canReturnOrEdit ? 6 : 5} className="p-4 text-center text-muted">
                        No order line items registered for this order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Tab>

            <Tab eventKey="returns" title={`Vendor Returns (${returns.length})`}>
              <Table responsive hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
                <thead style={{ background: "#1e293b", color: "#f8fafc" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", width: "70px" }}>S.No</th>
                    <th style={{ padding: "12px 16px" }}>Product Name</th>
                    <th style={{ padding: "12px 16px" }}>Quantity Returned</th>
                    <th style={{ padding: "12px 16px" }}>Return Date</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.length > 0 ? (
                    returns.map((r, idx) => (
                      <tr key={r.id || idx}>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>
                          {r.product_name}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "99px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                            }}
                          >
                            - {r.quantity} Units
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>
                          {r.return_date ? moment(r.return_date).format("DD MMM YYYY") : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted">
                        No returns recorded for this purchase order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Tab>
          </Tabs>
        </Card>

        {/* ── Line Modal (Return or Edit) ── */}
        <Modal show={showLineModal} onHide={closeLineModal} centered backdrop="static">
          <Form onSubmit={submitLineModal}>
            <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {modalMode === "return" ? "Log Vendor Return" : "Update Line Item"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Product
                </Form.Label>
                <Form.Control
                  value={modalMode === "return" ? returnDetails.product_name : editDetails.product_name}
                  readOnly
                  disabled
                  style={{ fontSize: "13px", borderRadius: "8px", background: "#f8fafc" }}
                />
              </Form.Group>

              {modalMode === "return" ? (
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                        Return Quantity *
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min={1}
                        max={returnDetails.max_available}
                        value={returnDetails.quantity}
                        onChange={(e) => setReturnDetails({ ...returnDetails, quantity: e.target.value })}
                        required
                        style={{ fontSize: "13px", borderRadius: "8px" }}
                      />
                      <small style={{ fontSize: "11px", color: "#94a3b8" }}>Max available: {returnDetails.max_available}</small>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                        Return Date *
                      </Form.Label>
                      <Form.Control
                        type="date"
                        max={moment().format("YYYY-MM-DD")}
                        value={returnDetails.return_date}
                        onChange={(e) => setReturnDetails({ ...returnDetails, return_date: e.target.value })}
                        required
                        style={{ fontSize: "13px", borderRadius: "8px" }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              ) : (
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                        Quantity *
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min={1}
                        value={editDetails.quantity}
                        onChange={(e) => setEditDetails({ ...editDetails, quantity: e.target.value })}
                        required
                        style={{ fontSize: "13px", borderRadius: "8px" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                        Unit Rate (₹) *
                      </Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min={0}
                        value={editDetails.price}
                        onChange={(e) => setEditDetails({ ...editDetails, price: e.target.value })}
                        required
                        style={{ fontSize: "13px", borderRadius: "8px" }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #f1f5f9" }}>
              <Button variant="light" onClick={closeLineModal} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>
                Cancel
              </Button>
              <Button
                type="submit"
                style={{
                  background: modalMode === "return" ? CORAL : PURPLE,
                  borderColor: modalMode === "return" ? CORAL : PURPLE,
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  padding: "7px 20px",
                }}
              >
                {modalMode === "return" ? "Confirm Return" : "Save Changes"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* ── Order Header Edit Modal ── */}
        <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} centered backdrop="static">
          <Form onSubmit={saveOrderHeader}>
            <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                Edit Purchase Order Header
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Invoice Number
                </Form.Label>
                <Form.Control
                  name="invoice_number"
                  value={orderForm.invoice_number || ""}
                  onChange={handleOrderFormChange}
                  isInvalid={!!invoiceError}
                  style={{ fontSize: "13px", borderRadius: "8px" }}
                />
                <Form.Control.Feedback type="invalid">{invoiceError}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Status
                </Form.Label>
                <Form.Select
                  name="status"
                  value={orderForm.status}
                  onChange={handleOrderFormChange}
                  style={{ fontSize: "13px", borderRadius: "8px" }}
                >
                  <option value={true}>Active / Confirmed</option>
                  <option value={false}>Inactive / Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #f1f5f9" }}>
              <Button variant="light" onClick={() => setShowOrderModal(false)} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>
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
                Save Header
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Main>
  );
}