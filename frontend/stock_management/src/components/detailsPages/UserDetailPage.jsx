import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import stockManagementApis from "../apis/StockManagementApis";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Button,
  Card,
  Col,
  Container,
  Row,
  Table,
  Tabs,
  Tab,
  Modal,
  Form,
} from "react-bootstrap";
import "../../App.css";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UserDetailPage() {
  const { id } = useParams();
  const { permissions, loginData } = useContext(AuthContext);
  const [user, setUser] = useState({});
  const [order, setOrder] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserData, setEditUserData] = useState({
    name: "",
    contact: "",
    email: "",
    role_id: "",
    user_name: "",
    password: "",
    branch_id: "",
    status: "",
    updated_by: loginData?.id
  });

  const primaryColor = "#5650ce";

  const handleOrderData = async (userId) => {
    try {
      const result = await stockManagementApis.getOrderByUserId(userId);
      setOrder(result);
    } catch (error) {
      console.error("Order not fetched:", error);
    }
  };

  const handleUserData = async (userId) => {
    try {
      const result = await stockManagementApis.getUserById(userId);
      setUser(result[0]);
      setEditUserData(result[0]);
    } catch (error) {
      console.error("User not fetched:", error);
    }
  };

  const handleEditButtonClick = () => {
    setShowEditModal(true);
  };

  const handleEditUserDataChange = (e) => {
    const { name, value } = e.target;
    setEditUserData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    const payload = { ...editUserData, updated_by: loginData?.id };
    
    try {
      await stockManagementApis.updateUser(user.id, payload);
      setShowEditModal(false);
      toast.success("User updated successfully");
      handleUserData(user.id);
    } catch (error) {
      toast.error("Error updating user");
      console.error("Error updating user:", error);
    }
  };

  useEffect(() => {
    handleUserData(id);
  }, [id]);

  useEffect(() => {
    if (user.id) {
      handleOrderData(user.id);
    }
  }, [user.id]);

  const hasUpdatePermission = permissions?.some(
    (role) => role.name === "Admin" || role.name === "Super Admin"
  );

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
        <Link to="/user" className="text-decoration-none" style={{ color: primaryColor }}>Users</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">User Details</span>
      </div>

      <Container fluid className="px-3">
        {/* ─── User Profile Card ─── */}
        <Card className="border-0 shadow-sm p-4 mb-4" style={{ borderRadius: "12px" }}>
          
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
            <div>
              <div className="d-flex align-items-center gap-3 mb-2">
                <h4 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                  {user.name || "..."}
                </h4>
                <span className={`badge rounded-pill px-3 py-2 ${user.status === 'active' || user.status === true ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`} style={{ fontSize: "12px" }}>
                  {user.status === 'active' || user.status === true ? "Active" : "Inactive"}
                </span>
              </div>
              <span className="text-muted" style={{ fontSize: "14px" }}>
                <i className="fa-regular fa-envelope me-2"></i>
                {user.email || "No email available"}
              </span>
            </div>
            
            <div className="d-flex gap-3">
              {hasUpdatePermission && (
                <Button
                  variant="outline-primary"
                  className="d-flex align-items-center"
                  onClick={handleEditButtonClick}
                  style={{ borderColor: primaryColor, color: primaryColor, borderRadius: "6px" }}
                >
                  <i className="fa-regular fa-edit me-2" aria-hidden="true"></i> Edit
                </Button>
              )}
              <Link to={`/user`}>
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
                    <i className="fa-regular fa-id-badge me-2"></i>Account Information
                  </h6>
                  <DetailItem label="Username" value={user.user_name} highlight={true} />
                  <DetailItem label="Role" value={user.role_name} />
                  <DetailItem label="Branch" value={user.branch_name} />
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 h-100" style={{ backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
                <Card.Body className="p-4">
                  <h6 className="text-uppercase text-muted mb-4 fw-bold" style={{ fontSize: "13px", letterSpacing: "1px" }}>
                    <i className="fa-solid fa-address-book me-2"></i>Contact & Activity
                  </h6>
                  <DetailItem label="Contact Number" value={user.contact} />
                  <DetailItem label="Account Created" value={user.created_at} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* ─── Related Orders ─── */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "12px", overflow: "hidden" }}>
          <div className="bg-light p-3 border-bottom">
            <h6 className="mb-0 fw-bold text-uppercase text-muted" style={{ fontSize: "14px", letterSpacing: "1px" }}>Activity History</h6>
          </div>
          <Card.Body className="p-0">
            <Tabs defaultActiveKey="orders" id="user-detail-tabs" className="px-3 pt-3 border-bottom-0 custom-tabs">
              <Tab eventKey="orders" title={`Orders (${order.length})`}>
                <div className="p-3" style={{ maxHeight: "40vh", overflowY: "auto" }}>
                  <Table responsive hover className="align-middle mb-0" style={{ fontSize: 14 }}>
                    <thead style={{ backgroundColor: "#212529", color: "#ffffff", position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", borderTopLeftRadius: "6px" }}>Product Name</th>
                        <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px" }}>Order No.</th>
                        <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px" }}>Order Date</th>
                        <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px" }}>Order Status</th>
                        <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", borderTopRightRadius: "6px" }}>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="border-top-0">
                      {order.length > 0 ? (
                        order.map((item, index) => (
                          <tr key={index}>
                            <td className="p-3 fw-medium">
                              <Link
                                to={`/orderDetailPage/${item.id}`}
                                style={{ textDecoration: "none", color: primaryColor }}
                              >
                                {item.product_name}
                              </Link>
                            </td>
                            <td className="p-3 text-muted">{item.order_number}</td>
                            <td className="p-3">{item.order_date}</td>
                            <td className="p-3">
                              <span className={`badge rounded-pill px-2 py-1 ${item.status ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                {item.status ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="p-3 fw-semibold text-dark">{item.total_amount}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center p-4 text-muted">
                            No orders found for this user.
                          </td>
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

      {/* ─── Edit Modal ─── */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        backdrop="static"
        size="lg"
      >
        <Form onSubmit={handleSaveChanges}>
          <Modal.Header closeButton>
            <Modal.Title>Edit User Profile</Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            <Container>
              <Row>
                <Col lg={6}>
                  <Form.Group controlId="formName" className="mb-4">
                    <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={editUserData.name || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </Col>
                <Col lg={6}>
                  <Form.Group controlId="formRole" className="mb-4">
                    <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Role</Form.Label>
                    <Form.Control
                      type="text"
                      name="role_name"
                      value={editUserData.role_name || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col lg={6}>
                  <Form.Group controlId="formBranch" className="mb-4">
                    <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Branch</Form.Label>
                    <Form.Control
                      type="text"
                      name="branch_name"
                      value={editUserData.branch_name || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </Col>
                <Col lg={6}>
                  <Form.Group controlId="formEmail" className="mb-4">
                    <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={editUserData.email || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col lg={6}>
                  <Form.Group controlId="formContact" className="mb-4">
                    <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Contact</Form.Label>
                    <Form.Control
                      type="text"
                      name="contact"
                      value={editUserData.contact || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </Col>
                <Col lg={6}>
                  <Form.Group controlId="formUsername" className="mb-4">
                    <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Username</Form.Label>
                    <Form.Control
                      type="text"
                      name="user_name"
                      value={editUserData.user_name || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col lg={6}>
                  <Form.Group controlId="formStatus" className="mb-4">
                    <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Status</Form.Label>
                    <Form.Control
                      as="select"
                      name="status"
                      value={editUserData.status}
                      onChange={handleEditUserDataChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
            </Container>
          </Modal.Body>

          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
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