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

export default function OrderDetailPage() {
  const { id } = useParams();
  const { permissions } = useContext(AuthContext);

  // ───────── State ─────────
  const [order, setOrder] = useState({});
  const [orderLineItems, setOrderLineItems] = useState([]);
  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);

  const [showOrderModal, setShowOrderModal] = useState(false); // header edit
  const [showLineModal, setShowLineModal] = useState(false);   // return / edit
  const [modalMode, setModalMode] = useState("return");        // "return" | "edit"

  const [orderForm, setOrderForm] = useState({
    user_name: "",
    branch_name: "",
    vendor_name: "",
    order_number: "",
    order_date: "",
    total_amount: "",
    invoice_number: "",
    status: false,
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

  const primaryColor = "#5650ce";

  /* ───────── Helpers ───────── */
  const hasRole = (names) => permissions?.some((r) => names.includes(r.name));
  const canUpdateHeader = hasRole(["Admin", "Super Admin"]);
  const canReturnOrEdit = canUpdateHeader || !hasRole(["Data Entry"]);

  /* ───────── Fetch Functions ───────── */
  const fetchHeader = async () => {
    try {
      const [orderData] = await stockManagementApis.getOrderById(id);
      const productData = await stockManagementApis.getProduct();
      setOrder(orderData);
      setOrderForm(orderData);
      setProducts(productData);
    } catch (err) {
      console.error("[fetchHeader] error", err);
    }
  };

  const fetchLineItems = async () => {
    try {
      const items = await stockManagementApis.getOrderLineItemById(id);
      setOrderLineItems(items);
    } catch (err) {
      console.error("[fetchLineItems] error", err);
    }
  };

  const fetchReturns = async () => {
    try {
      const res = await stockManagementApis.getReturnByOrderId(id);
      setReturns(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("[fetchReturns] error", err);
    }
  };

  /* ───────── Lifecycle ───────── */
  useEffect(() => {
    fetchHeader();
    fetchLineItems();
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ───────── Modal Openers ───────── */
  const openReturn = (item) => {
    setModalMode("return");
    setReturnDetails({
      ...returnDetails,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: "",
      return_date: moment().format("YYYY-MM-DD"),
      issue_id: item.issue_id || "",
      orderLineItem_id: item.id,
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
      max_quantity: productObj.max_quantity ?? productObj.total_buy_quantity + (productObj.max_quantity_increment ?? 0),
    });
    setShowLineModal(true);
  };

  const closeLineModal = () => setShowLineModal(false);

  /* ───────── Header Form Handlers ───────── */
  const handleOrderFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "invoice_number" && value.length > 10) {
      setInvoiceError("Invoice number must be less than 10 digits");
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
      toast.error("Failed to update order");
      console.error("[saveOrderHeader] error", err);
    }
  };

  /* ───────── Submit Return / Edit ───────── */
  const submitLineModal = async (e) => {
    e.preventDefault();

    if (modalMode === "return") {
      const line = orderLineItems.find((li) => li.id === returnDetails.orderLineItem_id);
      const qty = parseInt(returnDetails.quantity, 10);

      if (!line || qty > line.quantity) {
        toast.error("Return qty exceeds available qty");
        return;
      }
      const product = products.find((p) => p.id === line.product_id);
      const newTotalStock = (product.total_buy_quantity || 0) - qty;

      if (newTotalStock < 0) {
        toast.error("Insufficient stock to process return");
        return;
      }

      try {
        await stockManagementApis.addReturn(returnDetails);
        await stockManagementApis.updateStock(product.id, { total_buy_quantity: newTotalStock });
        toast.success("Return added & stock updated");
        fetchReturns();
        fetchHeader();
        closeLineModal();
      } catch (err) {
        toast.error("Failed to add return");
        console.error("[return] API error", err);
      }
    } else {
        const line = orderLineItems.find((li) => li.id === editDetails.id);
        if (!line) {
          toast.error("Line item not found");
          return;
        }

        const newQty = parseInt(editDetails.quantity, 10);
        if (isNaN(newQty)) {
          toast.error("Invalid quantity");
          return;
        }

        let maxQty = editDetails.max_quantity === 0 ? 0 : editDetails.max_quantity;
        let minQty = editDetails.min_quantity === 0 ? 0 : editDetails.min_quantity;

        if (minQty === 0 && maxQty === 0) {
            return;
        }

        if (newQty > editDetails.max_quantity) {
            toast.error(`Quantity must not exceed ${editDetails.max_quantity}`);
            return;
        }

        if (editDetails.min_quantity !== minQty && newQty < editDetails.min_quantity) {
            toast.error(`Quantity must be at least ${editDetails.min_quantity}`);
            return;
        }

        const product = products.find((p) => p.id === editDetails.product_id);
        if (!product) {
          toast.error("Product not found");
          return;
        }

        var delta;
        let updatedStock = parseFloat(product.total_buy_quantity);

        if (newQty > line.quantity) {
          delta = newQty - line.quantity;
          updatedStock += delta;
        }
        else if (newQty < line.quantity) {
          delta = line.quantity - newQty;
          updatedStock -= delta;
        }

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

          toast.success("Line item & stock updated");
          fetchLineItems();
          fetchHeader();
          closeLineModal();
        } catch (err) {
          toast.error("Failed to update line item");
          console.error("[edit] API error", err);
        }
      }
  };

  // Helper component for rendering detail rows cleanly
  const DetailItem = ({ label, value, highlight = false }) => (
    <div className="mb-4">
        <small className="text-muted d-block text-uppercase fw-semibold mb-1" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
            {label}
        </small>
        <div className={`fs-6 ${highlight ? 'fw-bold' : 'text-dark'}`} style={{ color: highlight ? primaryColor : 'inherit' }}>
            {value || "-"}
        </div>
    </div>
  );

  return (
  <Main>
    <ToastContainer />

    {/* ─── Breadcrumbs ─── */}
    <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <Link to="/order" className="text-decoration-none" style={{ color: primaryColor }}>Orders</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Order Details</span>
    </div>

    <Container fluid className="px-3">
        {/* ─── Order header card ─── */}
        <Card className="border-0 shadow-sm p-4 mb-4" style={{ borderRadius: "12px" }}>
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                <div>
                    <div className="d-flex align-items-center gap-3 mb-2">
                        <h4 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                            Order #{order.order_number || "..."}
                        </h4>
                        <span className={`badge rounded-pill px-3 py-2 ${order.status ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`} style={{ fontSize: "12px" }}>
                            {order.status ? "Active" : "Inactive"}
                        </span>
                    </div>
                    <span className="text-muted" style={{ fontSize: "14px" }}>
                        <i className="fa-regular fa-calendar me-2"></i>
                        {order.order_date ? moment(order.order_date).format("DD-MM-YYYY") : "..."}
                    </span>
                </div>
                
                <div className="d-flex gap-3">
                    {/* {canUpdateHeader && (
                        <Button
                            variant="outline-primary"
                            className="d-flex align-items-center"
                            onClick={() => setShowOrderModal(true)}
                            style={{ borderColor: primaryColor, color: primaryColor, borderRadius: "6px" }}
                        >
                            <i className="fa-regular fa-edit me-2" aria-hidden="true"></i> Edit
                        </Button>
                    )} */}
                    <Link to={`/order`}>
                        <Button
                            variant="outline-secondary"
                            className="d-flex align-items-center"
                            style={{ borderRadius: "6px" }}
                        >
                            <i className="fa-solid fa-arrow-left me-2" aria-hidden="true"></i> Back
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Content Section */}
            <Row className="g-4">
                <Col md={6}>
                    <Card className="border-0 h-100" style={{ backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
                        <Card.Body className="p-4">
                            <h6 className="text-uppercase text-muted mb-4 fw-bold" style={{ fontSize: "13px", letterSpacing: "1px" }}>
                                <i className="fa-regular fa-address-card me-2"></i>Contact Information
                            </h6>
                            <DetailItem label="User" value={order.user_name} />
                            <DetailItem label="Branch" value={order.branch_name} />
                            <DetailItem label="Vendor" value={order.vendor_name} />
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="border-0 h-100" style={{ backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
                        <Card.Body className="p-4">
                            <h6 className="text-uppercase text-muted mb-4 fw-bold" style={{ fontSize: "13px", letterSpacing: "1px" }}>
                                <i className="fa-solid fa-file-invoice-dollar me-2"></i>Billing Information
                            </h6>
                            
                            <div className="p-3 mb-4 rounded" style={{ backgroundColor: "rgba(86, 80, 206, 0.05)", border: `1px solid rgba(86, 80, 206, 0.2)` }}>
                                <DetailItem label="Total Amount" value={order.total_amount ? `₹${order.total_amount}` : "-"} highlight={true} />
                            </div>

                            <DetailItem label="Invoice Number" value={order.invoice_number} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Card>

        {/* ─── Related (line items & returns) ─── */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="bg-light p-3 border-bottom">
                <h6 className="mb-0 fw-bold text-uppercase text-muted" style={{ fontSize: "14px", letterSpacing: "1px" }}>Related Records</h6>
            </div>
            
            <Card.Body className="p-0">
                <Tabs defaultActiveKey="orders" id="user-detail-tabs" className="px-3 pt-3 border-bottom-0 custom-tabs">
                
                {/* Line‑items Tab */}
                <Tab eventKey="orders" title={`Order Line Items (${orderLineItems.length})`}>
                    <div className="p-3">
                        <Table responsive hover className="align-middle mb-0" style={{ fontSize: 14 }}>
                            <thead style={{ backgroundColor: "#212529", color: "#ffffff" }}>
                            <tr>
                                <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", borderTopLeftRadius: "6px" }}>S.No.</th>
                                <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px" }}>Product Name</th>
                                <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px" }}>Quantity</th>
                                <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px" }}>Rate</th>
                                <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px" }}>Amount</th>
                                {canReturnOrEdit && <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", borderTopRightRadius: "6px" }} className="text-center">Actions</th>}
                            </tr>
                            </thead>
                            <tbody className="border-top-0">
                            {orderLineItems.length ? (
                                orderLineItems.map((item, idx) => (
                                <tr key={item.id}>
                                    <td className="p-3 text-muted">{idx + 1}</td>
                                    <td className="p-3 fw-medium">{item.product_name}</td>
                                    <td className="p-3">{item.quantity}</td>
                                    <td className="p-3">{item.price}</td>
                                    <td className="p-3 fw-semibold text-dark">{item.price * item.quantity}</td>

                                    {canReturnOrEdit && (
                                    <td className="p-3" style={{ width: 200 }}>
                                        <div className="d-flex justify-content-center gap-2">
                                            <Button 
                                                variant="outline-primary" 
                                                className="btn-sm d-flex align-items-center justify-content-center"
                                                onClick={() => openEdit(item)}
                                                style={{ width: "32px", height: "32px", borderColor: "#a3a6dd", color: primaryColor }}
                                            >
                                                <i className="fa-regular fa-edit" />
                                            </Button>
                                            <Button 
                                                variant="outline-success" 
                                                className="btn-sm d-flex align-items-center"
                                                onClick={() => openReturn(item)}
                                                style={{ height: "32px", fontWeight: "500" }}
                                            >
                                                <i className="fa-solid fa-rotate-left me-1"></i> Return
                                            </Button>
                                        </div>
                                    </td>
                                    )}
                                </tr>
                                ))
                            ) : (
                                <tr>
                                <td colSpan={canReturnOrEdit ? 6 : 5} className="text-center p-4 text-muted">No order line items found.</td>
                                </tr>
                            )}
                            </tbody>
                        </Table>
                    </div>
                </Tab>

                {/* Returns Tab */}
                <Tab eventKey="returns" title={`Returns (${returns.length})`}>
                    <div className="p-3">
                        <Table responsive hover className="align-middle mb-0" style={{ fontSize: 14 }}>
                            <thead style={{ backgroundColor: "#212529", color: "#ffffff" }}>
                            <tr>
                                <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", borderTopLeftRadius: "6px" }}>S.No.</th>
                                <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px" }}>Product Name</th>
                                <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px" }}>Quantity</th>
                                <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", borderTopRightRadius: "6px" }}>Return Date</th>
                            </tr>
                            </thead>
                            <tbody className="border-top-0">
                            {returns.length ? (
                                returns.map((r, idx) => (
                                <tr key={r.id}>
                                    <td className="p-3 text-muted">{idx + 1}</td>
                                    <td className="p-3 fw-medium">{r.product_name}</td>
                                    <td className="p-3">
                                        <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1 border border-danger border-opacity-25 rounded-pill">
                                            {r.quantity}
                                        </span>
                                    </td>
                                    <td className="p-3 text-muted">{moment(r.return_date).format("DD-MM-YYYY")}</td>
                                </tr>
                                ))
                            ) : (
                                <tr>
                                <td colSpan={4} className="text-center p-4 text-muted">No returns found.</td>
                                </tr>
                            )}
                            </tbody>
                        </Table>
                    </div>
                </Tab>
                </Tabs>
            </Card.Body>
        </Card>
    </Container>

    {/* Return / Edit Modal */}
    <Modal show={showLineModal} onHide={closeLineModal} backdrop="static">
      <Form onSubmit={submitLineModal}>
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === "return" ? "Add Return" : "Update Line Item"}</Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          <Form.Group className="mb-4">
            <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Product Name</Form.Label>
            <Form.Control
              value={modalMode === "return" ? returnDetails.product_name : editDetails.product_name}
              readOnly
              disabled
              className="bg-light"
            />
          </Form.Group>

          {modalMode === "return" ? (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Return Quantity</Form.Label>
                  <Form.Control
                    name="quantity"
                    type="number"
                    min={1}
                    max={returnDetails.max_available}
                    value={returnDetails.quantity}
                    onChange={(e) => setReturnDetails({ ...returnDetails, quantity: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Return Date</Form.Label>
                  <Form.Control
                    name="return_date"
                    type="date"
                    min={moment(order.order_date).format("YYYY-MM-DD")}
                    max={moment().format("YYYY-MM-DD")}
                    value={returnDetails.return_date}
                    onChange={(e) => setReturnDetails({ ...returnDetails, return_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          ) : (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Quantity</Form.Label>
                  <Form.Control
                    name="quantity"
                    type="number"
                    min={"0"}
                    max={editDetails.max_quantity==0 ? "": editDetails.max_quantity}
                    value={editDetails.quantity}
                    onChange={(e) => setEditDetails({ ...editDetails, quantity: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Rate</Form.Label>
                  <Form.Control
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={editDetails.price}
                    onChange={(e) => setEditDetails({ ...editDetails, price: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={closeLineModal}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" style={{ backgroundColor: primaryColor, border: "none" }}>
            {modalMode === "return" ? "Add Return" : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>

    {/* Order header edit Modal */}
    <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} backdrop="static" size="lg">
      <Form onSubmit={saveOrderHeader}>
        <Modal.Header closeButton>
          <Modal.Title>Update Order</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="text-muted" style={{ fontSize: "13px" }}>User Name</Form.Label>
                <Form.Control
                  name="user_name"
                  value={orderForm.user_name}
                  onChange={handleOrderFormChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Branch Name</Form.Label>
                <Form.Control
                  name="branch_name"
                  value={orderForm.branch_name}
                  onChange={handleOrderFormChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Invoice Number</Form.Label>
                <Form.Control
                  name="invoice_number"
                  value={orderForm.invoice_number}
                  onChange={handleOrderFormChange}
                  isInvalid={!!invoiceError}
                />
                <Form.Control.Feedback type="invalid">{invoiceError}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={orderForm.status}
                  onChange={handleOrderFormChange}
                >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" style={{ backgroundColor: primaryColor, border: "none" }}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  </Main>
  );
}