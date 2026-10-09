import React, { useState, useEffect, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useForm, useFieldArray } from "react-hook-form";
import stockManagementApis from "../apis/StockManagementApis";
import { AuthContext } from "../context/AuthProvider";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
} from "react-bootstrap";
import { useParams, Link, NavLink, useNavigate } from "react-router-dom";
import Main from "../layout/Main";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";

const PURPLE = "#534AB7";
const TEAL = "#1D9E75";
const CORAL = "#D85A30";

export default function AddOrder() {
  const { loginData } = useContext(AuthContext);
  const { id } = useParams();
  const [vendor, setVendor] = useState([]);
  const [branch, setBranch] = useState([]);
  const [product, setProduct] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm({
    defaultValues: {
      id: "",
      name: "",
      vendor_id: "",
      invoice_number: "",
      order_date: moment().format("YYYY-MM-DD"),
      status: "active",
      total_amount: 0,
      user_id: loginData?.id,
      branch_id: "",
      orderLineItems: [{ product_id: "", price: "", quantity: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "orderLineItems",
  });

  const orderLineItems = watch("orderLineItems") || [];
  const grandTotal = orderLineItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity, 10) || 0;
    return sum + price * quantity;
  }, 0);

  const totalQuantityOrdered = orderLineItems.reduce((sum, item) => {
    return sum + (parseInt(item.quantity, 10) || 0);
  }, 0);

  useEffect(() => {
    if (loginData?.id) {
      setValue("user_id", loginData.id);
    }
  }, [loginData, setValue]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [vendors, branches, products] = await Promise.all([
          stockManagementApis.getVendor(),
          stockManagementApis.getBranch(),
          stockManagementApis.getProduct(),
        ]);
        setVendor(vendors || []);
        setBranch(branches || []);
        setProduct(products || []);

        if (id) {
          const orderData = await stockManagementApis.getOrderById(id);
          if (orderData && orderData.length > 0) {
            const data = orderData[0];
            for (const key in data) {
              if (key !== "orderLineItems") {
                setValue(key, data[key]);
              }
            }
            if (data.orderLineItems && data.orderLineItems.length > 0) {
              reset({ ...data, orderLineItems: data.orderLineItems });
            } else {
              reset(data);
            }
          }
        }
      } catch (error) {
        toast.error("Error loading master data: " + error.message);
      }
    }
    fetchData();
  }, [id, reset, setValue]);

  useEffect(() => {
    setValue("total_amount", grandTotal);
  }, [grandTotal, setValue]);

  // Calculate capacity validation across all orderLineItems
  const capacityIssues = orderLineItems.map((item, idx) => {
    if (!item.product_id) return null;
    const prod = product.find((p) => p.id === item.product_id);
    if (!prod) return null;

    const hasMax = prod.max_quantity !== null && prod.max_quantity !== undefined && parseFloat(prod.max_quantity) > 0;
    if (!hasMax) return null;

    const onHand = Math.max(0, (parseFloat(prod.total_buy_quantity) || 0) - (parseFloat(prod.total_issue_quantity) || 0));
    const maxCapacity = parseFloat(prod.max_quantity);
    const maxCanBuy = Math.max(0, maxCapacity - onHand);
    const enteredQty = parseInt(item.quantity, 10) || 0;

    if (enteredQty > maxCanBuy) {
      return {
        index: idx,
        productName: prod.name,
        maxCanBuy,
        maxCapacity,
        onHand,
        enteredQty,
        overBy: enteredQty - maxCanBuy,
      };
    }
    return null;
  }).filter(Boolean);

  const hasAnyCapacityError = capacityIssues.length > 0;

  const onSubmit = async (data) => {
    try {
      if (!data.orderLineItems || data.orderLineItems.length === 0) {
        toast.error("Please add at least one order line item.");
        return;
      }

      if (hasAnyCapacityError) {
        const firstIssue = capacityIssues[0];
        toast.error(`Order quantity for "${firstIssue.productName}" exceeds max purchase capacity (${firstIssue.maxCanBuy} allowed).`);
        return;
      }

      setSubmitting(true);
      data.total_amount = grandTotal;
      data.updated_by = loginData?.id;

      if (id) {
        await stockManagementApis.updateOrder(id, data);
        await stockManagementApis.updateOrderLineItem(id, data.orderLineItems);
        toast.success("Purchase order updated successfully");
        navigate(`/orderDetailPage/${id}`);
      } else {
        const payload = { ...data, created_by: loginData?.id };
        const response = await stockManagementApis.AddOrder(payload);
        if (response.success) {
          toast.success("Purchase order created and stock replenished!");
        }
        const createdId = response.data?.id || (Array.isArray(response) && response[0]?.id);
        setTimeout(() => {
          if (createdId) {
            navigate(`/orderDetailPage/${createdId}`);
          } else {
            navigate("/order");
          }
        }, 1200);
      }
    } catch (error) {
      toast.error("Failed to submit purchase order.");
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => append({ product_id: "", price: "", quantity: "" });

  return (
    <Main>
      <ToastContainer position="top-right" autoClose={3000} />

      <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {/* ── Top Header & Actions ── */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                <Link to="/Home" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
                  Home
                </Link>{" "}
                /{" "}
                <Link to="/order" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
                  Purchases (POs)
                </Link>{" "}
                / <span style={{ color: "#0f172a", fontWeight: 600 }}>{id ? "Edit PO" : "Create Inward PO"}</span>
              </div>
              <h4 style={{ margin: "4px 0 0", fontWeight: 700, color: "#0f172a" }}>
                {id ? "Update Purchase Order" : "New Procurement Purchase Order"}
              </h4>
            </div>

            <div className="d-flex align-items-center gap-2">
              <NavLink to="/order" className="btn btn-sm btn-light border" style={{ borderRadius: "8px", fontWeight: 600, padding: "7px 16px" }}>
                Cancel
              </NavLink>
              <Button
                type="submit"
                disabled={submitting || hasAnyCapacityError}
                style={{
                  background: hasAnyCapacityError ? "#94a3b8" : PURPLE,
                  borderColor: hasAnyCapacityError ? "#94a3b8" : PURPLE,
                  cursor: hasAnyCapacityError ? "not-allowed" : "pointer",
                  borderRadius: "8px",
                  fontWeight: 600,
                  padding: "7px 22px",
                  boxShadow: hasAnyCapacityError ? "none" : "0 2px 6px rgba(83, 74, 183, 0.25)",
                }}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : hasAnyCapacityError ? (
                  <>
                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                    Exceeds Max Limit
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check me-2"></i>
                    {id ? "Save Changes" : "Post & Restock PO"}
                  </>
                )}
              </Button>
            </div>
          </div>

          <Row className="g-4">
            {/* ── Left Column: Order Header & Line Items ── */}
            <Col lg={8}>
              {/* Header Info Card */}
              <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
                <div style={{ height: "4px", background: PURPLE }} />
                <div className="p-3 border-bottom" style={{ background: "#ffffff" }}>
                  <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                    <i className="fa-solid fa-file-invoice me-2" style={{ color: PURPLE }}></i>
                    Purchase Order Metadata & Vendor Details
                  </h6>
                </div>
                <Card.Body className="p-4">
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                          Vendor / Supplier *
                        </Form.Label>
                        <Form.Select
                          {...register("vendor_id", { required: "Vendor is required" })}
                          isInvalid={!!errors.vendor_id}
                          style={{ fontSize: "13px", borderRadius: "8px" }}
                        >
                          <option value="">Select Vendor...</option>
                          {vendor.map((vnd) => (
                            <option key={vnd.id} value={vnd.id}>
                              {vnd.name} {vnd.gst_number ? `(${vnd.gst_number})` : ""}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.vendor_id?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                          Destination Branch *
                        </Form.Label>
                        <Form.Select
                          {...register("branch_id", { required: "Branch is required" })}
                          isInvalid={!!errors.branch_id}
                          style={{ fontSize: "13px", borderRadius: "8px" }}
                        >
                          <option value="">Select Branch...</option>
                          {branch.map((brc) => (
                            <option key={brc.id} value={brc.id}>
                              {brc.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.branch_id?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                          Vendor Invoice / Bill No. *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. INV-2026-0891"
                          {...register("invoice_number", {
                            required: "Invoice number is required",
                            pattern: {
                              value: /^[a-zA-Z0-9\-_/]+$/,
                              message: "Alphanumeric only",
                            },
                          })}
                          isInvalid={!!errors.invoice_number}
                          style={{ fontSize: "13px", borderRadius: "8px" }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.invoice_number?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                          PO / Invoice Date *
                        </Form.Label>
                        <Form.Control
                          type="date"
                          max={moment().format("YYYY-MM-DD")}
                          {...register("order_date", { required: "Order Date is required" })}
                          isInvalid={!!errors.order_date}
                          style={{ fontSize: "13px", borderRadius: "8px" }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Line Items Card */}
              <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ background: "#ffffff" }}>
                  <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                    <i className="fa-solid fa-boxes-stacked me-2" style={{ color: PURPLE }}></i>
                    Order Line Items ({fields.length})
                  </h6>
                  <Button
                    variant="outline-primary"
                    size="small"
                    onClick={addItem}
                    style={{
                      borderRadius: "8px",
                      borderColor: PURPLE,
                      color: PURPLE,
                      fontWeight: 600,
                      fontSize: "12px",
                      padding: "4px 12px",
                    }}
                  >
                    <i className="fa-solid fa-plus me-1"></i> Add Product Row
                  </Button>
                </div>

                <div className="p-3" style={{ background: "#ffffff" }}>
                  {/* Table Header */}
                  <Row className="gx-2 py-2 px-1 mb-2" style={{ background: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                    <Col xs={5}>Product / Item Specification</Col>
                    <Col xs={2}>Price (₹)</Col>
                    <Col xs={2}>Quantity (Max to Buy)</Col>
                    <Col xs={2} className="text-end">Subtotal (₹)</Col>
                    <Col xs={1} className="text-center"></Col>
                  </Row>

                  {/* Rows */}
                  {fields.map((item, index) => {
                    const selectedProductId = watch(`orderLineItems.${index}.product_id`);
                    const selectedProduct = product.find((p) => p.id === selectedProductId);

                    const hasMax = selectedProduct && selectedProduct.max_quantity !== null && selectedProduct.max_quantity !== undefined && parseFloat(selectedProduct.max_quantity) > 0;
                    const onHand = selectedProduct ? Math.max(0, (parseFloat(selectedProduct.total_buy_quantity) || 0) - (parseFloat(selectedProduct.total_issue_quantity) || 0)) : 0;
                    const maxCapacity = hasMax ? parseFloat(selectedProduct.max_quantity) : null;
                    const maxCanBuy = hasMax ? Math.max(0, maxCapacity - onHand) : null;
                    const isAtCapacity = hasMax && maxCanBuy === 0;

                    const linePrice = parseFloat(watch(`orderLineItems.${index}.price`)) || 0;
                    const rawQty = watch(`orderLineItems.${index}.quantity`);
                    const lineQty = parseInt(rawQty, 10) || 0;
                    const isExceeded = hasMax && lineQty > maxCanBuy;
                    const lineSubtotal = linePrice * lineQty;

                    return (
                      <div
                        key={item.id}
                        className="py-2 px-2 mb-2"
                        style={{
                          background: isExceeded ? "#FFF5F5" : "#f8fafc",
                          borderRadius: "8px",
                          border: `1px solid ${isExceeded ? "#FCA5A5" : "#e2e8f0"}`,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Row className="gx-2 align-items-center">
                          <Col xs={5}>
                            <Form.Select
                              {...register(`orderLineItems.${index}.product_id`, {
                                required: "Product required",
                              })}
                              isInvalid={!!errors?.orderLineItems?.[index]?.product_id}
                              style={{ fontSize: "12.5px", borderRadius: "6px" }}
                            >
                              <option value="">Select product...</option>
                              {product.map((prod) => {
                                const pOnHand = Math.max(0, (parseFloat(prod.total_buy_quantity) || 0) - (parseFloat(prod.total_issue_quantity) || 0));
                                const pHasMax = prod.max_quantity !== null && prod.max_quantity !== undefined && parseFloat(prod.max_quantity) > 0;
                                const pMaxLimit = pHasMax ? parseFloat(prod.max_quantity) : null;
                                const pMaxCanBuy = pHasMax ? Math.max(0, pMaxLimit - pOnHand) : null;

                                let badge = "";
                                if (pHasMax) {
                                  if (pMaxCanBuy === 0) {
                                    badge = ` — [FULL: 0 can buy (Max: ${pMaxLimit})]`;
                                  } else {
                                    badge = ` — [Can Buy: ${pMaxCanBuy} (Max: ${pMaxLimit})]`;
                                  }
                                } else {
                                  badge = ` — [Stock: ${pOnHand} | No Max Limit]`;
                                }

                                return (
                                  <option key={prod.id} value={prod.id}>
                                    {prod.name} ({prod.measurement_unit || "Units"}){badge}
                                  </option>
                                );
                              })}
                            </Form.Select>
                          </Col>

                          <Col xs={2}>
                            <Form.Control
                              type="number"
                              step="0.01"
                              placeholder="Price"
                              {...register(`orderLineItems.${index}.price`, {
                                required: "Required",
                                min: { value: 0.01, message: "> 0" },
                              })}
                              isInvalid={!!errors?.orderLineItems?.[index]?.price}
                              style={{ fontSize: "12.5px", borderRadius: "6px" }}
                            />
                          </Col>

                          <Col xs={2}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              {hasMax && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: (isAtCapacity || isExceeded) ? "#DC2626" : "#0D9488",
                                  }}
                                >
                                  Max to Buy: {maxCanBuy}
                                </span>
                              )}
                            </div>
                            <Form.Control
                              type="number"
                              placeholder={hasMax ? `Max: ${maxCanBuy}` : "Qty"}
                              disabled={isAtCapacity || isExceeded}
                              {...register(`orderLineItems.${index}.quantity`, {
                                required: "Required",
                                min: { value: 1, message: ">= 1" },
                              })}
                              isInvalid={isExceeded || !!errors?.orderLineItems?.[index]?.quantity}
                              style={{
                                fontSize: "12.5px",
                                borderRadius: "6px",
                                borderColor: isExceeded ? "#DC2626" : undefined,
                                backgroundColor: (isAtCapacity || isExceeded) ? "#FEE2E2" : undefined,
                                cursor: (isAtCapacity || isExceeded) ? "not-allowed" : undefined,
                              }}
                            />
                            {isExceeded && (
                              <div className="mt-1 d-flex flex-column gap-1">
                                <span style={{ fontSize: "10.5px", color: "#DC2626", fontWeight: 700 }}>
                                  <i className="fa-solid fa-lock me-1"></i>
                                  Exceeded limit ({maxCanBuy})! Field disabled.
                                </span>
                                <div className="d-flex gap-1">
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-danger px-1 py-0"
                                    style={{ fontSize: "10px", borderRadius: "4px" }}
                                    onClick={() => setValue(`orderLineItems.${index}.quantity`, maxCanBuy)}
                                    title="Set quantity to maximum allowed"
                                  >
                                    Set to {maxCanBuy}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline-secondary px-1 py-0"
                                    style={{ fontSize: "10px", borderRadius: "4px" }}
                                    onClick={() => setValue(`orderLineItems.${index}.quantity`, "")}
                                    title="Reset quantity to enable editing"
                                  >
                                    Reset
                                  </button>
                                </div>
                              </div>
                            )}
                            {isAtCapacity && (
                              <span style={{ fontSize: "10.5px", color: "#DC2626", fontWeight: 700 }}>
                                <i className="fa-solid fa-ban me-1"></i> Storage Full (0 allowed)
                              </span>
                            )}
                          </Col>

                          <Col xs={2} className="text-end">
                            <span style={{ fontSize: "13px", fontWeight: 700, color: isExceeded ? "#DC2626" : "#0f172a" }}>
                              ₹{lineSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </Col>

                          <Col xs={1} className="text-center">
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="btn btn-sm btn-link text-danger p-0"
                                title="Delete Item"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            )}
                          </Col>
                        </Row>

                        {/* Capacity Limit Feedback & Indicator */}
                        {selectedProduct && (
                          <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top flex-wrap gap-1" style={{ fontSize: "11.5px" }}>
                            <div>
                              {hasMax ? (
                                <span>
                                  <span style={{ color: "#475569" }}>
                                    Current Stock: <strong>{onHand}</strong> / Max Limit: <strong>{maxCapacity} {selectedProduct.measurement_unit || "units"}</strong>
                                  </span>
                                  <span className="mx-2">•</span>
                                  <span style={{ color: isAtCapacity ? "#DC2626" : isExceeded ? "#DC2626" : TEAL, fontWeight: 700 }}>
                                    <i className={`fa-solid ${isAtCapacity ? "fa-ban" : isExceeded ? "fa-circle-exclamation text-danger" : "fa-cart-plus text-success"} me-1`}></i>
                                    Max quantity you can buy: {maxCanBuy} {selectedProduct.measurement_unit || "units"}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted">
                                  <i className="fa-solid fa-check text-success me-1"></i>
                                  Current Stock: <strong>{onHand} {selectedProduct.measurement_unit || "units"}</strong> (No max capacity limit set)
                                </span>
                              )}
                            </div>

                            {/* Warning badge and 1-click Set to Max button */}
                            {isExceeded && (
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-danger">
                                  <i className="fa-solid fa-triangle-exclamation me-1"></i>
                                  Exceeds Max Limit by {lineQty - maxCanBuy} units
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger py-0 px-2"
                                  style={{ fontSize: "11px", borderRadius: "4px" }}
                                  onClick={() => setValue(`orderLineItems.${index}.quantity`, maxCanBuy)}
                                >
                                  Set to Max ({maxCanBuy})
                                </button>
                              </div>
                            )}

                            {isAtCapacity && (
                              <span className="badge bg-danger">
                                <i className="fa-solid fa-ban me-1"></i>
                                Storage Full (At Max Capacity of {maxCapacity})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Col>

            {/* ── Right Column: Summary Card ── */}
            <Col lg={4}>
              <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", position: "sticky", top: "84px" }}>
                <div style={{ height: "4px", background: TEAL }} />
                <div className="p-3 border-bottom" style={{ background: "#ffffff" }}>
                  <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                    <i className="fa-solid fa-calculator me-2" style={{ color: TEAL }}></i>
                    Order Financial Summary
                  </h6>
                </div>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: "13px", color: "#64748b" }}>
                    <span>Total Line Items</span>
                    <strong style={{ color: "#0f172a" }}>{fields.length} SKU(s)</strong>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: "13px", color: "#64748b" }}>
                    <span>Total Quantity Inward</span>
                    <strong style={{ color: "#0f172a" }}>{totalQuantityOrdered} units</strong>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3" style={{ fontSize: "13px", color: "#64748b" }}>
                    <span>Operator in Charge</span>
                    <strong style={{ color: PURPLE }}>{loginData?.name || "Staff"}</strong>
                  </div>

                  <hr style={{ borderColor: "#e2e8f0", margin: "16px 0" }} />

                  <div className="p-3 mb-3 rounded" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                      Grand Total Amount
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#15803d", marginTop: "2px" }}>
                      ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: "11px", color: "#166534", marginTop: "4px" }}>
                      Calculated automatically from itemized rows
                    </div>
                  </div>

                  {hasAnyCapacityError && (
                    <div className="p-3 mb-3 rounded" style={{ backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5" }}>
                      <div className="d-flex align-items-center text-danger fw-bold" style={{ fontSize: "12.5px" }}>
                        <i className="fa-solid fa-circle-exclamation me-2 fs-6"></i>
                        Storage Limit Exceeded
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#991B1B", marginTop: "4px", lineHeight: 1.4 }}>
                        {capacityIssues.length} product(s) exceed maximum inventory storage limits. Please reduce line quantities to the allowed maximum before submitting.
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting || hasAnyCapacityError}
                    className="w-100 py-2"
                    style={{
                      background: hasAnyCapacityError ? "#94a3b8" : PURPLE,
                      borderColor: hasAnyCapacityError ? "#94a3b8" : PURPLE,
                      cursor: hasAnyCapacityError ? "not-allowed" : "pointer",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "14px",
                      boxShadow: hasAnyCapacityError ? "none" : "0 2px 6px rgba(83, 74, 183, 0.25)",
                    }}
                  >
                    {submitting
                      ? "Processing..."
                      : hasAnyCapacityError
                      ? "Cannot Order (Exceeds Max Limit)"
                      : id
                      ? "Update PO Order"
                      : "Confirm & Restock Stock"}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </Main>
  );
}
