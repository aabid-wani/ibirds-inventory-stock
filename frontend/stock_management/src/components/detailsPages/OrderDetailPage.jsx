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
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Modal,
  Form,
  Table,
  Breadcrumb,
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

  /* ───────── Helpers ───────── */
  const hasRole = (names) => permissions?.some((r) => names.includes(r.name));
  const canUpdateHeader = hasRole(["Admin", "Super Admin"]);
  const canReturnOrEdit = canUpdateHeader || !hasRole(["Data Entry"]);

  /* ───────── Fetch Functions ───────── */
  const fetchHeader = async () => {
    console.log("[fetchHeader] fetching order & product data for order id", id);
    try {
      const [orderData] = await stockManagementApis.getOrderById(id);
      const productData = await stockManagementApis.getProduct();
      setOrder(orderData);
      setOrderForm(orderData);
      setProducts(productData);
      console.log("[fetchHeader] order", orderData);
    } catch (err) {
      console.error("[fetchHeader] error", err);
    }
  };

  const fetchLineItems = async () => {
    console.log("[fetchLineItems] fetching line items for order", id);
    try {
      const items = await stockManagementApis.getOrderLineItemById(id);
      setOrderLineItems(items);
      console.log("[fetchLineItems] items", items);
    } catch (err) {
      console.error("[fetchLineItems] error", err);
    }
  };

  const fetchReturns = async () => {
    console.log("[fetchReturns] fetching returns for order", id);
    try {
      const res = await stockManagementApis.getReturnByOrderId(id);
      setReturns(Array.isArray(res) ? res : []);
      console.log("[fetchReturns] returns", res);
    } catch (err) {
      console.error("[fetchReturns] error", err);
    }
  };

  /* ───────── Lifecycle ───────── */
  useEffect(() => {
    console.log("[useEffect] OrderDetailPage mounted / id changed", id);
    fetchHeader();
    fetchLineItems();
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ───────── Modal Openers ───────── */
  const openReturn = (item) => {
    console.log("[openReturn] item", item);
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
    console.log("[openEdit] item", item);
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
    console.log("[handleOrderFormChange]", name, value);
    if (name === "invoice_number" && value.length > 10) {
      setInvoiceError("Invoice number must be less than 10 digits");
    } else {
      setInvoiceError("");
    }
    setOrderForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveOrderHeader = async (e) => {
    e.preventDefault();
    console.log("[saveOrderHeader] saving", orderForm);
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
      console.log("[submitLineModal] mode=return details", returnDetails);
      const line = orderLineItems.find((li) => li.id === returnDetails.orderLineItem_id);
      const qty = parseInt(returnDetails.quantity, 10);
      console.log("[return] original line", line, "qty", qty);

      if (!line || qty > line.quantity) {
        toast.error("Return qty exceeds available qty");
        return;
      }
      const product = products.find((p) => p.id === line.product_id);
      const newTotalStock = (product.total_buy_quantity || 0) - qty;
      console.log("[return] stock calculation", product.total_buy_quantity, "->", newTotalStock);

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
         console.log("[submitLineModal] mode=edit details", editDetails);
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

        // if (newQty < editDetails.min_quantity) {
        //   toast.error(`Quantity must be at least ${editDetails.min_quantity}`);
        //   return;
        // }
      

        let maxQty = editDetails.max_quantity === 0 ? 0 : editDetails.max_quantity; // Using strict equality

        let minQty = editDetails.min_quantity === 0 ? 0 : editDetails.min_quantity; // Check if min_quantity is zero

        // Check if both min_quantity and max_quantity are 0, and if so, skip validation
        if (minQty === 0 && maxQty === 0) {
            // If both are 0, we assume no validation is needed, so just return
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


        console.log('newQty:', newQty, 'lineQuantity:', line.quantity);

        const product = products.find((p) => p.id === editDetails.product_id);
        if (!product) {
          toast.error("Product not found");
          return;
        }

        var delta;
        let updatedStock = parseFloat(product.total_buy_quantity);

        // Quantity increased → add to stock
        if (newQty > line.quantity) {
          delta = newQty - line.quantity;
          updatedStock += delta;
        }

        // Quantity decreased → subtract from stock
        else if (newQty < line.quantity) {
          delta = line.quantity - newQty;
          updatedStock -= delta;
        }

        // If updated stock goes negative (which shouldn’t happen in purchase), block
        if (updatedStock < 0) {
          toast.error("Insufficient stock for this update");
          return;
        }

        console.log("[edit] delta:", delta, "updatedStock:", updatedStock);

        try {
          // Update the line item quantity & price
          await stockManagementApis.updateOrderLineItemQuantity(editDetails.product_id, {
            quantity: newQty,
            price: editDetails.price,
          });

          // Update the product's total stock
          
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

  // console.log('return details=>',returnDetails);
  console.log('edit details=>',editDetails);
  /* ───────── render ───────── */
  return (
  <Main>
    <ToastContainer />

    {/* ─── Breadcrumbs ─── */}
    <div className="my-2" style={{ position: "relative", left: 5 }}>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/order" }}>
          Order
        </Breadcrumb.Item>
        <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
          Order Details
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>

    {/* ─── Order header card ─── */}
    <Card style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 0 20px rgba(0,0,0,0.1)" }}>
      <CardHeader style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }}>
        <span style={{ fontSize: 18 }}>Order Details</span>
        <Link to="/order">
          <Button className="float-end btn-sm mx-2 bg-danger border-0" style={{ padding: "2px 8px" }}>
            <i className="fa fa-close" />
          </Button>
        </Link>
        {/* {canUpdateHeader && (
          <Button
            className="float-end btn-sm border-0"
            style={{ padding: "2px 8px" }}
            onClick={() => setShowOrderModal(true)}
          >
            <i className="fa-regular fa-edit" />
          </Button>
        )} */}
      </CardHeader>

      {/* Header‑body */}
      <CardBody>
        <Container fluid style={{ fontSize: 16 }}>
          <Row>
            <Col sm={6} md={6} lg={12} xl={6}>
              <div style={{ fontWeight: "bold" }}>User</div>
              <div>{order.user_name}</div>

              <div className="mt-3" style={{ fontWeight: "bold" }}>Branch</div>
              <div>{order.branch_name}</div>

              <div className="mt-3" style={{ fontWeight: "bold" }}>Vendor</div>
              <div>{order.vendor_name}</div>

              <div className="mt-3" style={{ fontWeight: "bold" }}>Order Number</div>
              <div>{order.order_number}</div>
            </Col>

            <Col sm={6} md={6} lg={12} xl={6}>
              <div style={{ fontWeight: "bold" }}>Date</div>
              <div>{moment(order.order_date).format("DD-MM-YYYY")}</div>

              <div className="mt-3" style={{ fontWeight: "bold" }}>Total Amount</div>
              <div>{order.total_amount}</div>

              <div className="mt-3" style={{ fontWeight: "bold" }}>Invoice Number</div>
              <div>{order.invoice_number}</div>

              <div className="mt-3" style={{ fontWeight: "bold" }}>Status</div>
              <div>{order.status ? "Active" : "Inactive"}</div>
            </Col>
          </Row>
        </Container>
      </CardBody>
    </Card>

    {/* ─── Related (line items & returns) ─── */}
    <Card
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 0 20px rgba(0,0,0,0.1)", marginTop: 20 }}
    >
      <CardHeader style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }}>
        <span style={{ fontSize: 18 }}>Related</span>
      </CardHeader>

      <CardBody className="mt-1">
        <Tabs defaultActiveKey="orders" id="user-detail-tabs">
          {/* Line‑items Tab */}
          <Tab eventKey="orders" title={`Order Line Items (${orderLineItems.length})`}>
            <Container fluid className="p-2">
              <Row>
                <Col>
                  <Table responsive bordered hover className="text-center" style={{ fontSize: 14 }}>
                    <thead className="thead-dark">
                      <tr>
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }}>S.No.</th>
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Product Name</th>
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Quantity</th>
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Rate</th>
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Amount</th>
                        {canReturnOrEdit && <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }}  >Actions</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {orderLineItems.length ? (
                        orderLineItems.map((item, idx) => (
                          <tr key={item.id}>
                            <td>{idx + 1}</td>
                            <td>{item.product_name}</td>
                            <td>{item.quantity}</td>
                            <td>{item.price}</td>
                            <td>{item.price * item.quantity}</td>

                            {canReturnOrEdit && (
                              <td style={{ width: 250 }}>
                                <div className="d-flex justify-content-center gap-2">
                                  <Button size="sm" variant="primary" onClick={() => openEdit(item)}>
                                    <i className="fa fa-edit" />
                                  </Button>
                                  <Button size="sm" variant="success" onClick={() => openReturn(item)}>
                                    Return
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={canReturnOrEdit ? 6 : 5}>No order line items found.</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Container>
          </Tab>

          {/* Returns Tab */}
          <Tab eventKey="returns" title={`Returns (${returns.length})`}>
            <Container fluid className="p-2">
              <Row>
                <Col>
                  <Table responsive bordered hover className="text-center" style={{ fontSize: 14 }}>
                    <thead className="thead-dark">
                      <tr>
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }}  >S.No.</th>
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Product Name</th>
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Quantity</th>
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Return Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returns.length ? (
                        returns.map((r, idx) => (
                          <tr key={r.id}>
                            <td>{idx + 1}</td>
                            <td>{r.product_name}</td>
                            <td>{r.quantity}</td>
                            <td>{moment(r.return_date).format("DD-MM-YYYY")}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4}>No returns found.</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Container>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>

    {/* Return / Edit Modal */}
    <Modal show={showLineModal} onHide={closeLineModal} backdrop="static">
      <Form onSubmit={submitLineModal}>
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === "return" ? "Add Return" : "Update Line Item"}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Product Name</Form.Label>
            <Form.Control
              value={modalMode === "return" ? returnDetails.product_name : editDetails.product_name}
              readOnly
              disabled
            />
          </Form.Group>

          {modalMode === "return" ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Return Quantity</Form.Label>
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

              <Form.Group className="mb-3">
                <Form.Label>Return Date</Form.Label>
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
            </>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Quantity</Form.Label>
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

              <Form.Group className="mb-3">
                <Form.Label>Rate</Form.Label>
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
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={closeLineModal}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
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
        <Modal.Body>
          {/* -- header form rows here, unchanged -- */}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save Changes
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  </Main>
);
}
