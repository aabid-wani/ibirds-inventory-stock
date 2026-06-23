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
  FormControl,
} from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import DataTable from "react-data-table-component";
import { TextField, InputAdornment } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";

export default function Vendor() {
  const [showAlert, setShowAlert] = useState(false);
  const [vendor, setVendor] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [show, setShow] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [validated, setValidated] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [branches, setBranches] = useState([]);
  const [gstValidation, setGstValidation] = useState(null);
  const [phoneValidation, setPhoneValidation] = useState(null);

  const { permissions, loginData } = useContext(AuthContext);
  const primaryColor = "#5650ce";

  useEffect(() => {
    const handleGetData = async () => {
      try {
        const result1 = await stockManagementApis.getVendor();
        const result2 = await stockManagementApis.getBranch();
        setVendor(result1);
        setBranches(result2);
      } catch (error) {
        setVendor([]);
        setBranches([]);
      }
    };
    handleGetData();
  }, []);

  const deleteHandle = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this record?");

    if (isConfirmed) {
      setVendor((prevVendors) => prevVendors.filter((vnd) => vnd.id !== id));
      toast.success("Vendor deleted successfully!");
    } else {
      setShowAlert(true);
    }
  };

  const handleClose = () => {
    setShow(false);
    setSelectedVendor(null);
    setValidated(false);
    setGstValidation(null);
    setPhoneValidation(null);
  };

  const handleShow = (vendor = null) => {
    setSelectedVendor(vendor);
    setIsUpdate(vendor !== null);
    setShow(true);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    
    if (name === 'gst_no') {
        const isValidLengthGST = value.length === 15;
        const hasMixedChars = /[a-zA-Z0-9]/.test(value);
        const isValidFormat = isValidLengthGST && hasMixedChars;
        setGstValidation(
            isValidFormat || value === '' ? null : "Please enter a valid 15-digit GST number."
        );
    }

    if (name === 'mobile') {
        const isValidLength = value.length === 10;
        const isNumeric = /^\d+$/.test(value);
        setPhoneValidation(
            isValidLength && isNumeric || value === '' ? null : "Invalid mobile number"
        );
    }

    setSelectedVendor((prevVendor) => ({
      ...prevVendor,
      [name]: value,
      created_by: loginData?.id,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.checkValidity() === false || gstValidation !== null || phoneValidation !== null) {
      event.stopPropagation();
    } else {
      try {
        if (isUpdate) {
          const updatedVendor = {
            ...selectedVendor,
            updated_by: loginData?.id,
          };
          await stockManagementApis.updateVendor(updatedVendor.id, updatedVendor);
          toast.success("Vendor updated successfully!");
        } else {
          await stockManagementApis.addVendor(selectedVendor);
          toast.success("Vendor added successfully!");
        }
        
        // Refresh data
        const result1 = await stockManagementApis.getVendor();
        setVendor(result1);
        handleClose();
      } catch (error) {
        console.error("Error saving vendor:", error);
        toast.error("Error saving vendor.");
      }
    }
    setValidated(true);
  };

  useEffect(() => {
    const filteredData = vendor.filter(
      (item) =>
        (item.id || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.name || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.gst_no || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.mobile || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.address || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.city || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.state || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.status ? "active" : "inactive").includes(filterText.toLowerCase()) ||
        (item.branch_name || "").toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredCategories(filteredData);
  }, [filterText, vendor]);

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
          to={`/vendorDetailPage/${row.id}`}
        >
          {row.name}
        </NavLink>
      ),
    },
    { name: "City", selector: (row) => row.city, sortable: true },
    { name: "State", selector: (row) => row.state, sortable: true },
    { name: "Branch", selector: (row) => row.branch_name, sortable: true },
    {
      name: "Status",
      selector: (row) => (row.status === "active" ? "active" : "inactive"),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => {
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
                onClick={() => handleShow(row)}
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
      },
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

  const hasAddPermission = permissions?.some(
    (role) => role.name === "Admin" || role.name === "Super Admin"
  );

  return (
    <Main>
      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Vendors</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm" style={{ borderRadius: '8px' }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Vendor List</h5>
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
                  onClick={() => handleShow()}
                  style={{ backgroundColor: primaryColor }}
                >
                  <i className="fa fa-plus" aria-hidden="true"></i> Add Vendor
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
        <Modal show={show} onHide={handleClose} backdrop="static" size="lg">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>{isUpdate ? "Update Vendor" : "Add Vendor"}</Modal.Title>
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
                        value={selectedVendor?.name || ""}
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
                      <Form.Label>GST No</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="GST No"
                        name="gst_no"
                        value={selectedVendor?.gst_no || ""}
                        onChange={handleInputChange}
                        isInvalid={gstValidation !== null}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {gstValidation || "Please enter a GST number."}
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
                        value={selectedVendor?.branch_id || ""}
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
                      <Form.Label>Mobile</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Enter phone number"
                        name="mobile"
                        min={0}
                        value={selectedVendor?.mobile || ""}
                        onChange={handleInputChange}
                        isInvalid={phoneValidation !== null}
                        required
                      />
                      <FormControl.Feedback type="invalid">
                        {phoneValidation || "Please enter a valid mobile number."}
                      </FormControl.Feedback>
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
                        value={selectedVendor?.city || ""}
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
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        placeholder="Enter Address"
                        name="address"
                        rows={1}
                        value={selectedVendor?.address || ""}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter an address.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="State"
                        name="state"
                        value={selectedVendor?.state || ""}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter a state.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={selectedVendor?.status || "active"}
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
            <Modal.Footer className="bg-light">
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
              <Button type="submit" style={{ backgroundColor: primaryColor, border: 'none' }}>
                {isUpdate ? "Update" : "Add Vendor"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

      </Container>
      <ToastContainer />
    </Main>
  );
}