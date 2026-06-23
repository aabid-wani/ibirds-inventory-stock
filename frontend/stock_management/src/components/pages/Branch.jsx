import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Container,
  Row,
  Col,
  Card,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      try {
        let resp;
        if (isUpdate) {
          const payload = { ...newBranch, updated_by: loginData?.id };
          resp = await stockManagementApis.updateBranch(currentBranchId, payload);
          if (resp.success) {
            toast.success(resp.message || "Branch updated successfully");
          } else {
            toast.error(resp.errors);
          }
        } else {
          const payload = { ...newBranch, created_by: loginData?.id };
          resp = await stockManagementApis.addBranch(payload);
          if (resp.success) {
            toast.success(resp.message || "Branch added successfully");
          } else {
            toast.error(resp.errors);
          }
        }
        handleGetData();
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

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getBranch();
      setBranch(result);
      setFilteredCategories(result);
    } catch (error) {
      console.error("Error fetching branch:", error);
      setBranch([]);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  useEffect(() => {
    const filteredData = branch.filter(
      (item) =>
        item.name.toLowerCase().includes(filterText.toLowerCase()) ||
        item.location.toLowerCase().includes(filterText.toLowerCase()) ||
        item.city.toLowerCase().includes(filterText.toLowerCase()) ||
        item.state.toLowerCase().includes(filterText.toLowerCase()) ||
        item.status.toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredCategories(filteredData);
  }, [filterText, branch]);

  const deleteHandle = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this record?");
    if (isConfirmed) {
      try {
        await stockManagementApis.deleteBranch(id);
        toast.success("Successfully deleted record");
        setBranch((prevOrders) => prevOrders.filter((ord) => ord.id !== id));
      } catch (error) {
        console.error("Error deleting record:", error);
        toast.error("Error deleting record");
        setShowAlert(true);
      }
    } else {
      setShowAlert(true);
    }
  };

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

  const hasAddPermission = permissions?.some(
    (role) =>
      role.name === "Admin" ||
      role.name === "Super Admin" ||
      (role.name === "Data Entry" && role.add)
  );

  // Action Buttons updated to match UI
  const ActionColumn = ({ row }) => (
    <div className="d-flex gap-2">
      {hasEditPermission && (
        <Button
          variant="outline-primary"
          className="btn-sm d-flex align-items-center justify-content-center"
          onClick={() => handleEdit(row)}
          style={{ width: "32px", height: "32px", borderColor: "#a3a6dd", color: "#5650ce" }}
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

  // DataTable Columns cleaned up
  const columns = [
    {
      name: "S.No.",
      selector: (row, index) => index + 1,
      width: "80px",
    },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Location", selector: (row) => row.location, sortable: true },
    { name: "City", selector: (row) => row.city, sortable: true },
    { name: "State", selector: (row) => row.state, sortable: true },
    {
      name: "Status",
      selector: (row) => (row.status === "active" ? "active" : "inactive"),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => <ActionColumn row={row} />,
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "120px",
    },
  ];

  // DataTable Styles updated to match UI
  const customStyles = {
    table: {
      style: { textAlign: "left" },
    },
    headRow: {
      style: {
        backgroundColor: "#212529", // Dark header background
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

  const primaryColor = "#5650ce";

  return (
    <Main>
      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>
          Home
        </Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Branches</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm" style={{ borderRadius: "8px" }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Branch List</h5>
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
                  className="px-3 border-0"
                  onClick={handleShow}
                  style={{ backgroundColor: primaryColor }}
                >
                  <i className="fa fa-plus me-1" aria-hidden="true"></i> Add Branch
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
      </Container>

      {/* Add/Edit Modal */}
      <Modal show={show} onHide={handleClose} backdrop="static" size="lg">
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{isUpdate ? "Update Branch" : "Add Branch"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Container>
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
                <Col md={12}>
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
            </Container>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button type="submit" style={{ backgroundColor: primaryColor, border: "none" }}>
              {isUpdate ? "Update" : "Add"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ToastContainer />
    </Main>
  );
}