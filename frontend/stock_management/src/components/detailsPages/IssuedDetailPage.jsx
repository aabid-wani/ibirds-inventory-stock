import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import stockManagementApis from "../apis/StockManagementApis";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Card, Col, Container, Row, Modal, Form, Table } from "react-bootstrap";
import Main from "../layout/Main";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";
import { AuthContext } from "../context/AuthProvider";

const PURPLE = "#534AB7";
const TEAL = "#1D9E75";
const CORAL = "#D85A30";

export default function IssuedDetailPage() {
  const { permissions } = useContext(AuthContext);
  const hasNotReturnProduct = permissions?.some(
    (role) => role.name === "Admin" || role.name === "Super Admin" || role.name !== "Data Entry"
  );
  const { id } = useParams();
  const [returns, setReturns] = useState([]);
  const [totalReturns, setTotalReturns] = useState(0);
  const [issue, setIssue] = useState({});
  const [show, setShow] = useState(false);
  const [validated, setValidated] = useState(false);

  const [returnDetails, setReturnDetails] = useState({
    product_id: "",
    product_name: "",
    quantity: "",
    return_date: moment().format("YYYY-MM-DD"),
    issue_date: "",
    issue_id: id,
  });

  const handleIssueData = async (issueId) => {
    try {
      const data = await stockManagementApis.getIssueById(issueId);
      const item = (data.result && data.result[0]) || (Array.isArray(data) && data[0]) || {};
      setIssue(item);
      if (item.id) {
        setReturnDetails((prev) => ({
          ...prev,
          product_name: item.product_name,
          product_id: item.product_id,
          quantity: "",
          issue_date: item.issue_date,
          issue_id: item.id,
        }));
      }
    } catch (error) {
      console.error("Error fetching issue data", error);
    }
  };

  const getReturnDetails = async () => {
    try {
      const result = await stockManagementApis.getReturnById(id);
      const returnData = Array.isArray(result) ? result : [];
      setReturns(returnData);
      const sum = returnData.reduce((acc, ret) => acc + parseInt(ret.quantity || 0, 10), 0);
      setTotalReturns(sum);
    } catch (error) {
      setReturns([]);
      setTotalReturns(0);
    }
  };

  useEffect(() => {
    if (id) {
      handleIssueData(id);
      getReturnDetails();
    }
  }, [id]);

  const handleClose = () => {
    setShow(false);
    setValidated(false);
  };
  const handleShow = () => setShow(true);

  const updateProductStock = async (productId, addedQuantity) => {
    try {
      const product = await stockManagementApis.getProductById(productId);
      if (product && product.length > 0) {
        const total_issue = parseFloat(product[0].total_issue_quantity || 0) - parseFloat(addedQuantity);
        await stockManagementApis.updateProductById(productId, { total_issue_quantity: Math.max(0, total_issue) });
      }
    } catch (error) {
      console.error("Error updating product stock", error);
    }
  };

  const updateIssueQuantity = async (issueId, returnedQuantity) => {
    try {
      const issueData = await stockManagementApis.getIssueById(issueId);
      const currentIssue = (issueData.result && issueData.result[0]) || issueData[0];
      if (currentIssue) {
        const updatedIssueQuantity = currentIssue.quantity - parseInt(returnedQuantity, 10);
        await stockManagementApis.updateIssueQuantity(issueId, {
          quantity: Math.max(0, updatedIssueQuantity),
        });
      }
    } catch (error) {
      console.error("Error updating issue quantity", error);
    }
  };

  const handleAddReturn = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    const qty = parseInt(returnDetails.quantity, 10);
    if (!qty || qty <= 0 || qty > (issue.quantity || 0)) {
      toast.error(`Return quantity cannot exceed active issued quantity (${issue.quantity || 0})`);
      return;
    }

    try {
      await stockManagementApis.addReturn(returnDetails);
      toast.success("Return recorded successfully and inventory adjusted");
      await updateProductStock(returnDetails.product_id, returnDetails.quantity);
      await updateIssueQuantity(returnDetails.issue_id, returnDetails.quantity);
      handleClose();
      getReturnDetails();
      handleIssueData(id);
    } catch (error) {
      toast.error("Failed to add return record");
    }
  };

  const isActive = issue?.status === "active" || issue?.status === true;
  const currentHolding = Math.max(0, (issue?.quantity || 0));

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
            <Link to="/issue" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Provisions
            </Link>{" "}
            / <span style={{ color: "#0f172a", fontWeight: 600 }}>Provision #{id?.slice(0, 8)}</span>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/issue"
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
              <i className="fa-solid fa-arrow-left me-1"></i> Back to Provisions
            </Link>

            {hasNotReturnProduct && currentHolding > 0 && (
              <button
                onClick={handleShow}
                className="btn btn-sm d-flex align-items-center gap-2"
                style={{
                  background: CORAL,
                  color: "#ffffff",
                  fontWeight: 600,
                  borderRadius: "8px",
                  padding: "6px 16px",
                  boxShadow: "0 2px 6px rgba(216, 90, 48, 0.25)",
                }}
              >
                <i className="fa-solid fa-arrow-rotate-left"></i> Process Return
              </button>
            )}
          </div>
        </div>

        {/* ── Hero Voucher Card ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ height: "6px", background: `linear-gradient(90deg, ${CORAL}, #fb923c)` }} />
          <div className="p-4" style={{ background: "#ffffff" }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <div className="d-flex align-items-center gap-3">
                  <h4 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                    Provision Voucher #{issue.id ? issue.id.slice(0, 8).toUpperCase() : id.slice(0, 8).toUpperCase()}
                  </h4>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: "99px",
                      background: isActive ? "#dcfce7" : "#fee2e2",
                      color: isActive ? "#15803d" : "#b91c1c",
                    }}
                  >
                    {isActive ? "ACTIVE DISPATCH" : "RETURNED / ARCHIVED"}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3 mt-1 flex-wrap" style={{ fontSize: "13px", color: "#64748b" }}>
                  <span>
                    <i className="fa-regular fa-calendar me-1"></i> Issued:{" "}
                    <strong>{issue.issue_date ? moment(issue.issue_date).format("DD MMM YYYY") : "—"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    <i className="fa-solid fa-user-tie me-1"></i> Recipient:{" "}
                    <strong style={{ color: "#0f172a" }}>{issue.employee_name || "Unassigned"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    <i className="fa-solid fa-building me-1"></i> Branch:{" "}
                    <strong>{issue.branch_name || "Head Office"}</strong>
                  </span>
                </div>
              </div>

              {/* Product Badge on Right */}
              <div
                style={{
                  background: "#eeedfe",
                  border: "1px solid #c7d2fe",
                  borderRadius: "12px",
                  padding: "12px 20px",
                  textAlign: "right",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: PURPLE, textTransform: "uppercase" }}>
                  Material Dispatched
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e1b4b" }}>
                  {issue.product_name || "Material SKU"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── KPI Deck ── */}
        <Row className="g-3 mb-4">
          <Col md={4}>
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
                Active Quantity in Custody
              </div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: PURPLE, marginTop: "4px" }}>
                {currentHolding} Units
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Currently held by employee</div>
            </div>
          </Col>

          <Col md={4}>
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
                Total Units Returned
              </div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: TEAL, marginTop: "4px" }}>
                {totalReturns} Units
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Returned back to warehouse</div>
            </div>
          </Col>

          <Col md={4}>
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
                Issuing Operator
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", marginTop: "6px" }}>
                {issue.user_name || "System Operator"}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Staff authorization handle</div>
            </div>
          </Col>
        </Row>

        {/* ── Returns Ledger Table ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ background: "#ffffff" }}>
            <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
              <i className="fa-solid fa-clock-rotate-left me-2" style={{ color: CORAL }}></i>
              Return History Ledger ({returns.length} records)
            </h6>
          </div>

          <Table responsive hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead style={{ background: "#1e293b", color: "#f8fafc" }}>
              <tr>
                <th style={{ padding: "12px 16px", width: "70px" }}>S.No</th>
                <th style={{ padding: "12px 16px" }}>Product Item</th>
                <th style={{ padding: "12px 16px" }}>Units Returned</th>
                <th style={{ padding: "12px 16px" }}>Date of Return</th>
                <th style={{ padding: "12px 16px" }}>Stock Adjustment</th>
              </tr>
            </thead>
            <tbody>
              {returns.length > 0 ? (
                returns.map((ret, idx) => (
                  <tr key={ret.id || idx}>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{idx + 1}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>
                      {issue.product_name}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "99px",
                          background: "#fee2e2",
                          color: "#b91c1c",
                        }}
                      >
                        - {ret.quantity} Units
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>
                      {ret.return_date ? moment(ret.return_date).format("DD MMM YYYY") : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "12px", color: TEAL, fontWeight: 600 }}>
                        <i className="fa-solid fa-arrow-down me-1"></i> Deducted from Issued, Credited to Inventory
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted">
                    No returns logged for this provision voucher.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>

        {/* ── Process Return Modal ── */}
        <Modal show={show} onHide={handleClose} centered backdrop="static">
          <Form noValidate validated={validated} onSubmit={handleAddReturn}>
            <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                Process Material Return
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Product Name
                </Form.Label>
                <Form.Control
                  value={issue.product_name || ""}
                  readOnly
                  disabled
                  style={{ fontSize: "13px", borderRadius: "8px", background: "#f8fafc" }}
                />
              </Form.Group>

              <Row className="g-2">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                      Return Quantity *
                    </Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      max={issue.quantity}
                      value={returnDetails.quantity}
                      onChange={(e) => setReturnDetails({ ...returnDetails, quantity: e.target.value })}
                      required
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                    <small style={{ fontSize: "11px", color: "#94a3b8" }}>Max active: {issue.quantity}</small>
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
            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #f1f5f9" }}>
              <Button variant="light" onClick={handleClose} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>
                Cancel
              </Button>
              <Button
                type="submit"
                style={{
                  background: CORAL,
                  borderColor: CORAL,
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  padding: "7px 20px",
                }}
              >
                Confirm Return
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Main>
  );
}