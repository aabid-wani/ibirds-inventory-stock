import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import stockManagementApis from "../apis/StockManagementApis";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
  Tabs,
  Tab,
  Modal,
  Form,
  Toast,
  Breadcrumb,
  ToastContainer,
} from "react-bootstrap";
import "../../App.css";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";

export default function UserDetailPage() {
  const { id } = useParams();
  const { permissions , loginData} = useContext(AuthContext);
  const [user, setUser] = useState({});
  const [order, setOrder] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserData, setEditUserData] = useState({
      name:"",
      contact:"",
      email:"",
      role_id:"",
      user_name:"",
      password:"",
      branch_id:"",
      status:"",
      updated_by: loginData?.id
  });
  const [showToast, setShowToast] = useState(false);

  const handleOrderData = async (userId) => {
    try {
      const result = await stockManagementApis.getOrderByUserId(userId);
      setOrder(result);
    } catch (error) {
      console.log("Order not fetched:", error);
    }
  };

  const handleUserData = async (userId) => {
    try {
      const result = await stockManagementApis.getUserById(userId);
      setUser(result[0]);
      console.log("user data", result[0]);
      setEditUserData(result[0]);
    } catch (error) {
      console.log("User not fetched:", error);
    }
  };

  const handleEditButtonClick = () => {
    setShowEditModal(true);
  };

  const handleEditUserDataChange = (e) => {
    const { name, value } = e.target;
    setEditUserData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSaveChanges = async () => {
   const payload = { ...editUserData, updated_by: loginData?.id };
   console.log('payload',payload);
   
  try {
    await stockManagementApis.updateUser(user.id, payload);
    setShowEditModal(false);
    setShowToast(true);
    handleUserData(user.id);
  } catch (error) {
    console.log("Error updating user:", error);
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

  return (
    <Main>
      <div className="my-2 mt-4" style={{ position: "relative", left: "10px" }}>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/user" }}>
            Users
          </Breadcrumb.Item>
          <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
            {"User Details"}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <Card style={{ boxShadow: "0 0 5px #a3a3a3" }}>
        <CardHeader
          style={{
            background:
              "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
            color: " #ecf0f1ff",
          }}
        >
          <span style={{ fontSize: "18px" }}>User Details</span>
          <Link to={`/user`}>
            <Button
              variant="danger"
              className="float-end btn-sm mx-2 border-0"
              style={{ padding: "3px 8px" }}
            >
              <i className="fa fa-close color-white border-0"></i>
            </Button>
          </Link>
          {hasUpdatePermission && (
            <Button
              className="float-end btn-sm border-0"
              style={{ padding: "3px 8px" }}
              onClick={handleEditButtonClick}
            >
              <i className="fa-regular fa-edit"></i>
            </Button>
          )}
        </CardHeader>
        <CardBody>
          <Container fluid style={{ fontSize: "16px" }}>
            <Row className="row">
              <Col sm={6} md={6} lg={12} xl={6}>
                <div style={{ fontWeight: "bold" }}>Name</div>
                <div>{user.name}</div>
                <div className="mt-3" style={{ fontWeight: "bold" }}>
                  Role
                </div>
                <div>{user.role_name}</div>
                <div className="mt-3" style={{ fontWeight: "bold" }}>
                  Branch
                </div>
                <div>{user.branch_name}</div>
                <div className="mt-3" style={{ fontWeight: "bold" }}>
                  Email
                </div>
                <div>{user.email}</div>
              </Col>

              <Col sm={6} md={6} lg={12} xl={6}>
                <div style={{ fontWeight: "bold" }}>Contact</div>
                <div>{user.contact}</div>
                <div className="mt-3" style={{ fontWeight: "bold" }}>
                  Username
                </div>
                <div>{user.user_name}</div>
                <div className="mt-3" style={{ fontWeight: "bold" }}>
                  Created At
                </div>
                <div>{user.created_at}</div>
                <div className="mt-3" style={{ fontWeight: "bold" }}>
                  Status
                </div>
                <div>{user.status ? "active" : "inactive"}</div>
              </Col>
            </Row>
          </Container>
        </CardBody>
      </Card>

      <Card style={{ boxShadow: "0 0 5px #a3a3a3", marginTop: "20px" }}>
        <CardHeader
          style={{
            background:
              "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
            color: " #ecf0f1ff",
          }}
        >
          <span style={{ fontSize: "18px" }}>Related</span>
        </CardHeader>
        <CardBody className="mt-1">
          <Tabs defaultActiveKey="orders" id="user-detail-tabs">
            <Tab eventKey="orders" title={`Orders: (${order.length})`}>
              <Container
                fluid
                className="mt-4"
                style={{ maxHeight: "30vh", overflow: "auto" }}
              >
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th
                        style={{
                          background:
                            "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                          color: " #ecf0f1ff",
                        }}
                      >
                        Name
                      </th>
                      <th
                        style={{
                          background:
                            "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                          color: " #ecf0f1ff",
                        }}
                      >
                        Order No.
                      </th>
                      <th
                        style={{
                          background:
                            "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                          color: " #ecf0f1ff",
                        }}
                      >
                        Order Date
                      </th>
                      <th
                        style={{
                          background:
                            "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                          color: " #ecf0f1ff",
                        }}
                      >
                        Order Status
                      </th>
                      <th
                        style={{
                          background:
                            "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                          color: " #ecf0f1ff",
                        }}
                      >
                        Total Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.length > 0 ? (
                      order.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <Link
                              to={`/orderDetailPage/${item.id}`}
                              style={{ textDecoration: "none" }}
                            >
                              {item.product_name}
                            </Link>
                          </td>
                          <td>{item.order_number}</td>
                          <td>{item.order_date}</td>
                          <td>{item.status ? "Active" : "Inactive"}</td>
                          <td>{item.total_amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          No orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Container>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        backdrop="static"
        size="lg"
      >
        <div className="container">
          <div className="row">
            <Modal.Header closeButton>
              <Modal.Title>Edit User</Modal.Title>
            </Modal.Header>
          </div>

          <Modal.Body>
            <Form>
              <div className="row">
                <div className="col-lg-6">
                  <Form.Group controlId="formName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={editUserData.name || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group controlId="formRole" className="mt-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Control
                      type="text"
                      name="role_name"
                      value={editUserData.role_name || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-6">
                  <Form.Group controlId="formBranch" className="mt-3">
                    <Form.Label>Branch</Form.Label>
                    <Form.Control
                      type="text"
                      name="branch_name"
                      value={editUserData.branch_name || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group controlId="formEmail" className="mt-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={editUserData.email || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-6">
                  <Form.Group controlId="formContact" className="mt-3">
                    <Form.Label>Contact</Form.Label>
                    <Form.Control
                      type="text"
                      name="contact"
                      value={editUserData.contact || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group controlId="formUsername" className="mt-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      type="text"
                      name="user_name"
                      value={editUserData.user_name || ""}
                      onChange={handleEditUserDataChange}
                    />
                  </Form.Group>
                </div>
              </div>
              <Form.Group controlId="formStatus" className="mt-3">
                <Form.Label>Status</Form.Label>
                <Form.Control
                  as="select"
                  name="user_status"
                  value={editUserData.status ? "Active" : "Inactive"}
                  onChange={handleEditUserDataChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Form.Control>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSaveChanges}>
              Update
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        delay={3000}
        autohide
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
        }}
      >
      <ToastContainer/>
      </Toast>
    </Main>
  );
}
