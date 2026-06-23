import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  InputGroup,
  Container,
} from "react-bootstrap";
import { Link, useNavigate, NavLink } from "react-router-dom";
import DataTable from "react-data-table-component";
import Main from "../layout/Main";
import { TextField, InputAdornment } from "@mui/material";
import "../../App.css";
import { AuthContext } from "../context/AuthProvider";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function User() {
  const [showAlert, setShowAlert] = useState(false);
  const [user, setUser] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const navigate = useNavigate();
  const { permissions, loginData } = useContext(AuthContext);

  const primaryColor = "#5650ce";

  const [currentUser, setCurrentUser] = useState({
    name: "",
    contact: "",
    email: "",
    role_id: "",
    user_name: "",
    status: "",
    branch_id: "",
    password: "",
    created_by: loginData?.id || null,
  });

  const hasAddPermission = permissions?.some(
    (role) =>
      role.name === "Admin" ||
      role.name === "Super Admin" ||
      (role.name !== "Data Entry" && role.add)
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    generatePassword();
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.stopPropagation();
    } else {
      await handleSubmit();
    }
    setValidated(true);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    if (name === "contact") {
      if (value.length > 10) {
        setContactError(true);
      } else {
        setContactError(false);
      }
    }
    handleInputChange(e);
  };

  const handleToggleVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const passwordInputType = isPasswordVisible ? "text" : "password";

  const generatePassword = () => {
    let newPassword = "";
    newPassword = currentUser.name.substring(0, 4);
    let charset = "0123456789";
    newPassword += "@";
    for (let i = 1; i <= 3; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(newPassword);
    setCurrentUser({ ...currentUser, password: newPassword });
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await stockManagementApis.getRoles();
        const branchData = await stockManagementApis.getBranch();
        setRoles(rolesData);
        setBranches(branchData);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, []);

  const ActionColumn = ({ row, deleteHandle }) => {
    const hasEditPermission = permissions?.some(
      (role) =>
        role.name === "Admin" ||
        role.name === "Super Admin" ||
        (role.name !== "Data Entry" && role.edit)
    );
    const hasDeletePermission = permissions?.some(
      (role) =>
        role.name === "Admin" ||
        role.name === "Super Admin" ||
        (role.name !== "Data Entry" && role.del)
    );

    return (
      <div className="d-flex gap-2">
        {hasEditPermission && (
          <Button
            variant="outline-primary"
            className="btn-sm d-flex align-items-center justify-content-center"
            onClick={() => handleUpdateClick(row)}
            style={{ width: "32px", height: "32px", borderColor: "#a3a6dd", color: primaryColor }}
          >
            <i className="fa-regular fa-edit" aria-hidden="true"></i>
          </Button>
        )}
        {hasDeletePermission && (
          <Button
            variant="outline-danger"
            className="btn-sm d-flex align-items-center justify-content-center"
            onClick={() => deleteHandle(row.id)}
            style={{ width: "32px", height: "32px", borderColor: "#f5c2c7", color: "#dc3545" }}
          >
            <i className="fa fa-trash" aria-hidden="true"></i>
          </Button>
        )}
      </div>
    );
  };

  const handleModalClose = () => {
    setShowModal(false);
    setIsUpdate(false);
    setCurrentUser({
      name: "",
      contact: "",
      email: "",
      role_id: "",
      user_name: "",
      status: "",
      branch_id: "",
      password: "",
      created_by: loginData?.id || null,
    });
    setValidated(false);
  };

  const handleModalShow = () => {
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const emailValue = e.target.value;
    setCurrentUser({ ...currentUser, [name]: value });
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setIsValid(emailRegex.test(emailValue));
    }
  };

  const handleSubmit = async () => {
    try {
      if (isUpdate) {
        currentUser.updated_by = loginData?.id || null;
        const result = await stockManagementApis.updateUser(
          currentUser.id,
          currentUser
        );
        if (result.success) {
          toast.success("User updated successfully");
        } else {
          toast.error("Failed to update user");
        }
      } else {
        const result = await stockManagementApis.createUser(currentUser);
        if (result.success) {
          toast.success("User added successfully");
        } else {
          toast.error("Failed to add user");
        }
        setTimeout(() => {
          if (result.result?.id) navigate(`/userDetailPage/${result.result.id}`);
        }, 2000);
      }
      handleModalClose();
      handleGetData();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleUpdateClick = (user) => {
    setCurrentUser(user);
    setIsUpdate(true);
    handleModalShow();
  };

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getUsers();
      setUser(result);
      setFilteredCategories(result);
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser([]);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  const deleteHandleRecord = async (id) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this record?');
    if (isConfirmed) {
      try {
        await stockManagementApis.deleteUserById(id);
        toast.success('Successfully deleted record');
        setUser((prevOrders) => prevOrders.filter((ord) => ord.id !== id));
      } catch (error) {
        console.error('Error deleting record:', error);
        toast.error('Error deleting record');
        setShowAlert(true);
      }
    } else {
      setShowAlert(true);
    }
  };

  useEffect(() => {
    const filteredData = user.filter(
      (item) =>
        (item.id || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.name || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.contact || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.email || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.role_name || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.user_name || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.status || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.branch_name || "").toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredCategories(filteredData);
  }, [filterText, user]);

  const columns = [
    {
      name: "S.No.",
      selector: (row, index) => index + 1,
      sortable: true,
      width: "80px",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <NavLink
          style={{ textDecoration: "none", color: primaryColor, fontWeight: "500" }}
          to={`/userDetailPage/${row.id}`}
        >
          {row.name}
        </NavLink>
      ),
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
    },
    {
      name: "Roles",
      selector: (row) => row.role_name,
      sortable: true,
    },
    {
      name: "User Name",
      selector: (row) => row.user_name,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => (row.status === "active" ? "Active" : "Inactive"),
    },
    {
      name: "Actions",
      cell: (row) => (
        <ActionColumn row={row} deleteHandle={deleteHandleRecord} />
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "120px",
    },
  ];

  const customStyles = {
    table: {
      style: { textAlign: "left" },
    },
    headRow: {
      style: {
        backgroundColor: "#212529",
        color: "#ffffff",
        minHeight: "45px",
        fontWeight: "600",
        fontSize: "14px",
      },
    },
    rows: {
      style: {
        minHeight: "50px",
        fontSize: "14px",
        color: "#495057",
      },
    },
  };

  return (
    <Main>
      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Users</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm" style={{ borderRadius: '8px' }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">User List</h5>
              <small className="text-muted">{filteredCategories.length} records</small>
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <TextField
                id="search"
                placeholder="Search..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                size="small"
                sx={{ minWidth: "200px", backgroundColor: "#fcfcfc" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fa fa-search text-muted"></i>
                    </InputAdornment>
                  ),
                }}
              />

              {hasAddPermission && (
                <Button
                  className="px-3 border-0 d-flex align-items-center gap-2"
                  onClick={handleModalShow}
                  style={{ backgroundColor: primaryColor }}
                >
                  <i className="fa fa-plus" aria-hidden="true"></i> Add User
                </Button>
              )}
            </div>
          </div>

          {/* Data Table Section */}
          <div className="p-0">
            <DataTable
              columns={columns}
              data={filteredCategories}
              pagination
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={<div className="p-4 text-muted">No Records Found</div>}
            />
          </div>
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          show={showModal}
          onHide={handleModalClose}
          backdrop="static"
          size="lg"
        >
          <Form noValidate validated={validated} onSubmit={onSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>
                {currentUser.id ? "Update User" : "Add User"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Container>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Name"
                        name="name"
                        value={currentUser.name}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter a name.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Email"
                        name="email"
                        value={currentUser.email}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter a valid email.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      <Form.Select
                        name="role_id"
                        value={currentUser.role_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        Please select a role.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>User Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="User Name"
                        name="user_name"
                        value={currentUser.user_name}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter a user name.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Branch</Form.Label>
                      <Form.Select
                        name="branch_id"
                        value={currentUser.branch_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Branch</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        Please select a branch.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contact</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Contact"
                        name="contact"
                        value={currentUser.contact}
                        onChange={handleContactChange}
                        isInvalid={contactError}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter a valid contact number (10 digits).
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={currentUser.status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        Please select a status.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={passwordInputType}
                          placeholder="Password"
                          name="password"
                          value={currentUser.password}
                          onChange={(e) =>
                            setCurrentUser({
                              ...currentUser,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={handleToggleVisibility}
                        >
                          {isPasswordVisible ? (
                            <i className="fa fa-eye-slash" aria-hidden="true"></i>
                          ) : (
                            <i className="fa fa-eye" aria-hidden="true"></i>
                          )}
                        </Button>
                      </InputGroup>
                      <Form.Control.Feedback type="invalid">
                        Please enter a password.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </Container>
            </Modal.Body>
            <Modal.Footer className="bg-light">
              <Button variant="secondary" onClick={handleModalClose}>
                Close
              </Button>
              <Button type="submit" style={{ backgroundColor: primaryColor, border: 'none' }}>
                {isUpdate ? "Update" : "Add User"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>

      <ToastContainer />
    </Main>
  );
}