import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Button,
  Card,
  Col,
  Container,
  Row,
  Table,
  Modal,
  Form,
} from "react-bootstrap";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";

const PURPLE = "#534AB7";
const TEAL = "#1D9E75";
const CORAL = "#D85A30";

export default function UserDetailPage() {
  const { id } = useParams();
  const { permissions, loginData } = useContext(AuthContext);
  const [user, setUser] = useState({});
  const [orders, setOrders] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserData, setEditUserData] = useState({
    name: "",
    contact: "",
    email: "",
    role_id: "",
    user_name: "",
    branch_id: "",
    status: "active",
    updated_by: loginData?.id,
  });

  const handleOrderData = async (userId) => {
    try {
      const result = await stockManagementApis.getOrderByUserId(userId);
      setOrders(result || []);
    } catch (error) {
      console.error("Error fetching orders for user", error);
    }
  };

  const handleUserData = async (userId) => {
    try {
      const result = await stockManagementApis.getUserById(userId);
      if (result && result.length > 0) {
        const u = result[0];
        setUser(u);
        setEditUserData({
          ...u,
          status: u.status === true || u.status === "active" ? "active" : "inactive",
        });
      }
    } catch (error) {
      console.error("Error fetching user data", error);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [rolesData, branchData] = await Promise.all([
          stockManagementApis.getRoles(),
          stockManagementApis.getBranch(),
        ]);
        setRoles(rolesData || []);
        setBranches(branchData || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (id) {
      handleUserData(id);
      handleOrderData(id);
    }
  }, [id]);

  const hasUpdatePermission = permissions?.some(
    (role) => role.name === "Admin" || role.name === "Super Admin"
  );

  const handleEditUserDataChange = (e) => {
    const { name, value } = e.target;
    setEditUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    const payload = { ...editUserData, updated_by: loginData?.id };
    try {
      await stockManagementApis.updateUser(user.id, payload);
      setShowEditModal(false);
      toast.success("User profile updated successfully");
      handleUserData(user.id);
    } catch (error) {
      toast.error("Failed to update user profile");
    }
  };

  const isActive = user.status === "active" || user.status === true;
  const totalSpend = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  return (
    <Main>
      <ToastContainer position="top-right" autoClose={3000} />

      <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
        {/* ── Breadcrumb Navigation ── */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <Link to="/Home" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Home
            </Link>{" "}
            /{" "}
            <Link to="/user" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Users
            </Link>{" "}
            / <span style={{ color: "#0f172a", fontWeight: 600 }}>{user.name || "User Dossier"}</span>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/user"
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
              <i className="fa-solid fa-arrow-left me-1"></i> Back to Directory
            </Link>

            {hasUpdatePermission && (
              <button
                onClick={() => setShowEditModal(true)}
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
                <i className="fa-regular fa-pen-to-square"></i> Edit User Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Hero Profile Card ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ height: "6px", background: `linear-gradient(90deg, ${PURPLE}, #818cf8)` }} />
          <div className="p-4" style={{ background: "#ffffff" }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "#eeedfe",
                    color: PURPLE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    fontWeight: 700,
                    border: "2px solid #c7d2fe",
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h4 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{user.name || "..."}</h4>
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
                      {isActive ? "ACTIVE PROFILE" : "DEACTIVATED"}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-3 mt-1 flex-wrap" style={{ fontSize: "13px", color: "#64748b" }}>
                    <span>
                      <i className="fa-regular fa-envelope me-1"></i> {user.email || "No email"}
                    </span>
                    <span>•</span>
                    <span>
                      <i className="fa-solid fa-phone me-1"></i> {user.contact || "No phone"}
                    </span>
                    <span>•</span>
                    <span>
                      <i className="fa-solid fa-id-badge me-1"></i> @{user.user_name || "username"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges on right */}
              <div className="d-flex flex-column align-items-end gap-1">
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    background: "#eeedfe",
                    color: PURPLE,
                    padding: "4px 12px",
                    borderRadius: "8px",
                    border: "1px solid #c7d2fe",
                  }}
                >
                  <i className="fa-solid fa-shield-halved me-1"></i> {user.role_name || "Standard Staff"}
                </span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  <i className="fa-solid fa-building me-1"></i> {user.branch_name || "Head Office Ajmer"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── KPI Metrics for this User ── */}
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
                Total Purchase Orders
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                {orders.length}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Orders created by this user</div>
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
                Cumulative Order Value
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: TEAL, marginTop: "4px" }}>
                ₹{totalSpend.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Financial throughput recorded</div>
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
                Account Created
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", marginTop: "6px" }}>
                {user.createdAt ? moment(user.createdAt).format("DD MMM YYYY") : "System Baseline"}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Registration timestamp</div>
            </div>
          </Col>
        </Row>

        {/* ── Order History Ledger ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ background: "#ffffff" }}>
            <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
              <i className="fa-solid fa-cart-shopping me-2" style={{ color: PURPLE }}></i>
              Purchase Orders Created by {user.name} ({orders.length})
            </h6>
            <Link
              to="/addOrder"
              className="btn btn-sm"
              style={{
                background: "#eeedfe",
                color: PURPLE,
                fontWeight: 600,
                fontSize: "12px",
                borderRadius: "6px",
                border: "1px solid #c7d2fe",
              }}
            >
              + Create New PO
            </Link>
          </div>

          <Table responsive hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead style={{ background: "#1e293b", color: "#f8fafc" }}>
              <tr>
                <th style={{ padding: "12px 16px" }}>PO Number</th>
                <th style={{ padding: "12px 16px" }}>Order Date</th>
                <th style={{ padding: "12px 16px" }}>Supplier / Vendor</th>
                <th style={{ padding: "12px 16px" }}>Branch</th>
                <th style={{ padding: "12px 16px" }}>Invoice Ref</th>
                <th style={{ padding: "12px 16px" }} className="text-end">Total Amount</th>
                <th style={{ padding: "12px 16px" }} className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ padding: "12px 16px" }}>
                      <Link
                        to={`/orderDetailPage/${ord.id}`}
                        style={{ color: PURPLE, fontWeight: 600, textDecoration: "none" }}
                      >
                        {ord.order_number || `PO-${ord.id}`}
                      </Link>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>
                      {ord.order_date ? moment(ord.order_date).format("DD-MM-YYYY") : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 500, color: "#0f172a" }}>
                      {ord.vendor_name || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>
                      {ord.branch_name || "Head Office"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>
                        {ord.invoice_number || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }} className="text-end">
                      ₹{parseFloat(ord.total_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 16px" }} className="text-center">
                      <Link
                        to={`/orderDetailPage/${ord.id}`}
                        className="btn btn-sm"
                        style={{
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          borderRadius: "6px",
                          fontSize: "12px",
                          padding: "3px 8px",
                        }}
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted">
                    No purchase orders recorded for this user yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>

        {/* ── Edit Modal ── */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
          <Form onSubmit={handleSaveChanges}>
            <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9" }}>
              <Modal.Title style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                Update Profile: {user.name}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={editUserData.name || ""}
                      onChange={handleEditUserDataChange}
                      required
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={editUserData.email || ""}
                      onChange={handleEditUserDataChange}
                      required
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>Contact Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="contact"
                      value={editUserData.contact || ""}
                      onChange={handleEditUserDataChange}
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>System Role</Form.Label>
                    <Form.Select
                      name="role_id"
                      value={editUserData.role_id || ""}
                      onChange={handleEditUserDataChange}
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>Branch Location</Form.Label>
                    <Form.Select
                      name="branch_id"
                      value={editUserData.branch_id || ""}
                      onChange={handleEditUserDataChange}
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    >
                      <option value="">Select branch...</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>Status</Form.Label>
                    <Form.Select
                      name="status"
                      value={editUserData.status}
                      onChange={handleEditUserDataChange}
                      style={{ fontSize: "13px", borderRadius: "8px" }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #f1f5f9" }}>
              <Button variant="light" onClick={() => setShowEditModal(false)} style={{ borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>
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
                Save Changes
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </Main>
  );
}