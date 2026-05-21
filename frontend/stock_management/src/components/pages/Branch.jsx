import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Container,
  Row,
  Col,
  Card,
  Breadcrumb,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { TextField, InputAdornment } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../App.css";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";

export default function Branch() {
  const [showAlert, setShowAlert] = useState(false);
  const [branch, setBranch] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [show, setShow] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: "",
    location: "",
    city: "",
    state: "",
    status: "",
  });
  const [validated, setValidated] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState(null);
  const { permissions, loginData } = useContext(AuthContext);
  const handleClose = () => {
    setShow(false);
    setNewBranch({
      name: "",
      location: "",
      city: "",
      state: "",
      status: "",
    });
    setValidated(false);
    setIsUpdate(false);
    setCurrentBranchId(null);
  };
  const handleShow = () => setShow(true);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBranch((prevState) => ({
      ...prevState,
      [name]: value === "status" ? value === "Active" : value,
    }));
  };

  // console.log(isUpdate);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      try {
        let resp;
        if (isUpdate) {
          // Pass updated_by when updating
          const payload = { ...newBranch, updated_by: loginData?.id };
          resp = await stockManagementApis.updateBranch(currentBranchId, payload);
          if(resp.success){
            toast.success(resp.message ||"Branch updated successfully");
          }else{
            toast.error(resp.errors)
          }
        } else {
          // Pass created_by when creating||
          const payload = { ...newBranch, created_by: loginData?.id };
          resp = await stockManagementApis.addBranch(payload);
          // console.log(resp);
          if(resp.success){
            toast.success(resp.message ||"Branch added successfully");
          }else{
            toast.error(resp.errors);
          }
        }
        handleGetData();
        // handleClose();
          setShow(false);
      } catch (error) {
        console.error("Error adding/updating branch:", error);
        toast.error("Error adding/updating branch");
      }
    }
    setValidated(true);
  };

  const handleEdit = (branch) => {
    setNewBranch(branch);
    setIsUpdate(true);
    setCurrentBranchId(branch.id);
    handleShow();
  };

  const ActionColumn = ({ row, deleteHandle }) => {
    const hasEditPermission = permissions?.some(
      (role) =>
        role.name === "Admin" ||
        role.name === "Super Admin" ||
        (role.name === "Data Entry" && role.edit)
    );
    const hasDeletePermission = permissions?.some(
      (role) =>
        role.name === "Admin" ||
        role.name === "Super Admin" ||
        (role.name === "Data Entry" && role.del)
    );

    return (
      <>
        {hasEditPermission && (
          <Button className="mx-2 btn-sm border-0" onClick={() => handleEdit(row)} >
            <i className="fa-regular fa-edit" aria-hidden="true"></i>
          </Button>
        )}
        {hasDeletePermission && (
          <Button
            className="bg-danger btn-sm border-0"
            onClick={() => deleteHandle(row.id)}
          >
            <i
              className="fa fa-trash"
              aria-hidden="true"
              style={{ color: "white" }}
            ></i>
          </Button>
        )}
      </>
    );
  };

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getBranch();
      console.log('result ===>', result);
      
      setBranch(result);
      setFilteredCategories(result);
      // console.log("branch fetched:", result);
    } catch (error) {
      console.error("Error fetching branch:", error);
      setBranch([]);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  useEffect(() => {
    // console.log("Branch: ", branch);
    const filteredData = branch.filter(
      (item) =>
        item.name.toLowerCase().includes(filterText.toLowerCase()) ||
        item.location.toLowerCase().includes(filterText.toLowerCase()) ||
        item.city.toLowerCase().includes(filterText.toLowerCase()) ||
        item.state.toLowerCase().includes(filterText.toLowerCase()) ||
        item.status.toLowerCase().includes(filterText.toLowerCase())
    );
    // console.log(filteredData);
    setFilteredCategories(filteredData);
  }, [filterText, branch]);

  const deleteHandle = async (id) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this record?');
    if (isConfirmed) {
      try {
        const response = await stockManagementApis.deleteBranch(id);
        toast.success('successfully to delete record')
        // If the deletion is successful, remove the record from the state
        setBranch((prevOrders) => prevOrders.filter((ord) => ord.id !== id));
      } catch (error) {
        console.error('Error deleting record:', error);
        toast.error('Error to deleting record');
        setShowAlert(true);
      }
    } else {
      setShowAlert(true);
    }
  };

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
      className: "data-table-cell",
    },
    {
      name: <b>Location</b>,
      selector: (row) => row.location,
      sortable: true,
      className: "data-table-cell",
    },
    {
      name: <b>City</b>,
      selector: (row) => row.city,
      sortable: true,
      className: "data-table-cell",
    },
    {
      name: <b>State</b>,
      selector: (row) => row.state,
      sortable: true,
      className: "data-table-cell",
    },
    {
      name: <b>Status</b>,
      selector: (row) => (row.status === "active" ? "active" : "inactive"),
      sortable: true,
      className: "data-table-cell",
    },
    {
      name: <b>Action</b>,
      cell: (row) => <ActionColumn row={row} deleteHandle={deleteHandle} />,
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
     style:{ 
          background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
          color:" #ecf0f1ff",
      }
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

  const hasAddPermission = permissions?.some(
    (role) =>
      role.name === "Admin" ||
      role.name === "Super Admin" ||
      (role.name === "Data Entry" && role.add)
  );

  return (
    <Main>
      <ToastContainer />
      <Container fluid>
        <div className="my-2 mt-4" style={{ position: "relative", left: "5px" }}>
          <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
              Home
            </Breadcrumb.Item>
            <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
              {"Branches List"}
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <Card style={{boxShadow:"0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 0, 0, 0.1)",}}>
          <Card.Header style={{ backgroundColor: "white", height: "40px" }}>
            <p style={{ fontSize: "15px", fontWeight: "bold" }}>Branch List</p>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <TextField
                    id="search"
                    type="text"
                    placeholder="Search..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <i className="fa fa-search"></i>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {hasAddPermission && (
                    <Button className="btn-sm" onClick={handleShow}>
                      <i className="fa fa-plus" aria-hidden="true"></i>&nbsp;Add
                      Branch
                    </Button>
                  )}
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

        <Modal show={show} onHide={handleClose} backdrop="static" size="lg">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>
                {isUpdate ? "Update Branch" : "Add Branch"}
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
                        value={newBranch.name}
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
                      <Form.Label>Location</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Location"
                        name="location"
                        value={newBranch.location}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter a location.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="City"
                        name="city"
                        value={newBranch.city}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter a city.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="State"
                        name="state"
                        value={newBranch.state}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter a state.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={16}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={newBranch.status}
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
                </Row>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
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
