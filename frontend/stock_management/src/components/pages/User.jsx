import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Row,
  Col,
  Card,
  Breadcrumb,
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
import { create } from "@mui/material/styles/createTransitions";

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
  const { permissions, loginData} = useContext(AuthContext);

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
      <>
        {hasEditPermission && (
          <Button
            className="mx-2 btn-sm border-0"
            onClick={() => handleUpdateClick(row)}
          >
            <i className="fa-regular fa-edit" aria-hidden="true"></i>
          </Button>
        )}
        {hasDeletePermission && (
          <Button className="bg-danger btn-sm border-0">
            <i
              className="fa fa-trash"
              aria-hidden="true"
              onClick={() => deleteHandle(row.id)}
              style={{ color: "white" }}
            ></i>
          </Button>
        )}
      </>
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
      created_by: loginData?.id || null
    });
  };

  const handleModalShow = () => {
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const emailValue = e.target.value;
    setCurrentUser({ ...currentUser, [name]: value });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(emailValue));
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
        console.log("currentUser", currentUser);
        
        const result = await stockManagementApis.createUser(currentUser);
     
        if (result.success) {
          toast.success("User added successfully");
        } else {
          toast.error("Failed to add user");
        }
        setTimeout(()=>{
          navigate(`/userDetailPage/${result.result?.id}`);
        },2000)
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
      // console.log("Fetched Users:", result);
      
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
        toast.success('successfully to delete record')
   
        setUser((prevOrders) => prevOrders.filter((ord) => ord.id !== id));
      } catch (error) {
        console.error('Error deleting record:', error);
        toast.error('Error to deleting record');
        setShowAlert(true);
      }
    } else {
      setShowAlert(true);
    }
  };

  useEffect(() => {
    const filteredData = user.filter(
      (item) =>
        item.id.toLowerCase().includes(filterText.toLowerCase()) ||
        item.name.toLowerCase().includes(filterText.toLowerCase()) ||
        item.contact.toLowerCase().includes(filterText.toLowerCase()) ||
        item.email.toLowerCase().includes(filterText.toLowerCase()) ||
        item.role_name.toLowerCase().includes(filterText.toLowerCase()) ||
        item.user_name.toLowerCase().includes(filterText.toLowerCase()) ||
        item.password.toLowerCase().includes(filterText.toLowerCase()) ||
        item.status.toLowerCase().includes(filterText.toLowerCase()) ||
        item.branch_name.toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredCategories(filteredData);
  }, [filterText, user]);

  const columns = [
    {
      name: <b>S.No.</b>,
      selector: (row, index) => index + 1,
      sortable: true,
      width: "70px",
      style: {
        borderRight: "2px solid #dee2e6",
        fontWeight: "bold",
      },
    },
    {
      name: <b>Name</b>,
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <NavLink
          style={{ textDecoration: "none", color: "#007bff" }}
          to={`/userDetailPage/${row.id}`}
        >
          {row.name}
        </NavLink>
      ),
      className: "data-table-cell",
    },
    {
      name: <b>Email</b>,
      selector: (row) => row.email,
      sortable: true,
      className: "data-table-cell",
    },
    {
      name: <b>Roles</b>,
      selector: (row) => row.role_name,
      sortable: true,
      className: "data-table-cell",
    },
    {
      name: <b>User Name</b>,
      selector: (row) => row.user_name,
      sortable: true,
      className: "data-table-cell",
    },
    {
      name: <b>Status</b>,
      selector: (row) => (row.status === "active" ? "Active" : "Inactive"),
      className: "data-table-cell",
    },
    {
      name: <b>Action</b>,
      cell: (row) => (
        <ActionColumn row={row} deleteHandle={deleteHandleRecord} />
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      className: "data-table-cell",
    },
  ];

  const customStyles = {
    table: {
      style: {
        textAlign: "left",
      },
    },
    headCells: {
      style: {
        background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
        color:" #ecf0f1ff",
      },
    },
    headRow: {
      style: {
        minHeight: "30px",
      },
    },
    rows: {
      style: {
        minHeight: "34px",
      },
    },
  };

  return (
    <Main>
      
      <Container fluid>
        <div className="my-2 mt-4" style={{position: "relative", left: "5px" }}>
          <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
              Home
            </Breadcrumb.Item> 
            <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
              { "Users List" }
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <Row>
          <Col lg={12} sm={12} md={12} className="content-wrapper">
            <Card
              style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 0, 0, 0.1)"}}>
              <Card.Header style={{ backgroundColor: "white", height: "40px" }}>
                <p style={{ fontSize: "16px", fontWeight: "bold" }}>User List</p>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <TextField
                        id="search"
                        type="text"
                        placeholder="Search"
                        aria-label="Search Input"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <i
                                className="fa fa-search"
                                aria-hidden="true"
                              ></i>
                            </InputAdornment>
                          ),
                        }}
                        size="small"
                      />
                      {hasAddPermission ? (
                        <div className="d-flex">
                          <Button
                            variant="primary"
                            onClick={handleModalShow}
                            className="btn-sm"
                          >
                            <i className="fa fa-plus" aria-hidden="true"></i>
                            &nbsp;Add User
                          </Button>
                        </div>
                      ) : (
                        <div></div>
                      )}
                      {/* <div className='d-flex'>
                        <Button variant='primary' onClick={handleModalShow} className='btn-sm'>
                          <i className='fa fa-plus' aria-hidden='true'></i>&nbsp;Add User
                        </Button>
                      </div> */}
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <DataTable
                      columns={columns}
                      data={filteredCategories}
                      pagination
                      customStyles={customStyles}
                      noDataComponent="No Records Found"
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Modal
          show={showModal}
          onHide={handleModalClose}
          backdrop="static"
          size="lg"
        >
          <Form noValidate validated={validated} onSubmit={onSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>
                {" "}
                {currentUser.id ? "Update User" : "Add User"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="container">
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
                      {/* {!isValid && <p>Please enter a valid email address.</p>} */}
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
                            <i
                              className="fa fa-eye-slash"
                              aria-hidden="true"
                            ></i>
                          ) : (
                            <i className="fa fa-eye" aria-hidden="true"></i>
                          )}
                        </Button>
                      </InputGroup>
                      <Form.Control.Feedback type="invalid">
                        Please enter a password.
                      </Form.Control.Feedback>
                      {/* <Button className='mt-2' onClick={generatePassword}>Generate Password</Button> */}
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleModalClose}>
                Close
              </Button>
              <Button variant="primary" type="submit">
                {isUpdate ? "Update" : "Add"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>

      <ToastContainer />
    </Main>
  );
}
