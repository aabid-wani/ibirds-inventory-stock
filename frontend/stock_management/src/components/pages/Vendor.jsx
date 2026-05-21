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
  FormText,
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


  useEffect(() => {
      const handleGetData = async () => {
        try {
          const result1 = await stockManagementApis.getVendor();
          const result2 = await stockManagementApis.getBranch();
          setVendor(result1);
          setBranches(result2);
        } catch (error) {
          setVendor([]);
          setBranches([])
        }
      };
    handleGetData();
  }, []);

  
  const deleteHandle = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this record?"  );

    if (isConfirmed) {
      setVendor((prevVendors) => prevVendors.filter((vnd) => vnd.id !== id));
    } else {
      setShowAlert(true);
    }
  };

  const handleClose = () => {
    setShow(false);
    setSelectedVendor(null);
  };

  const handleShow = (vendor = null) => {

    setSelectedVendor(vendor);
    setIsUpdate(vendor !== null);
    setShow(true);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const newMobile = event.target.value;
    const isValidLengthGST = value.length === 15;
    const hasMixedChars = /[a-zA-Z0-9]/.test(value);
    const isValidFormat = isValidLengthGST && hasMixedChars;
    setGstValidation(
      isValidFormat ? null : "Please enter a valid 15-digit GST number."
    );

    const isValidLength = newMobile.length === 10;
    const isNumeric = /^\d+$/.test(newMobile);
    setPhoneValidation(
      isValidLength && isNumeric ? null : "Invalid mobile number"
    );

 

    setSelectedVendor((prevVendor) => ({
    ...prevVendor,
    [name]: value,
    created_by: loginData?.id, 
  }));


  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.stopPropagation();
    } else {
      try {
        if (isUpdate) {
         const updatedVendor = {
          ...selectedVendor,
          updated_by: loginData?.id,
        };
        console.log('Sending to API:', updatedVendor);
        await stockManagementApis.updateVendor(updatedVendor.id, updatedVendor);
          toast.success("Vendor updated successfully!");
        } else {

          console.log(selectedVendor);
          await stockManagementApis.addVendor(selectedVendor);
          toast.success("Vendor added successfully!");
        }
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
        item.id.toLowerCase().includes(filterText.toLowerCase()) ||
        item.name.toLowerCase().includes(filterText.toLowerCase()) ||
        item.gst_no.toLowerCase().includes(filterText.toLowerCase()) ||
        item.mobile.toLowerCase().includes(filterText.toLowerCase()) ||
        item.address.toLowerCase().includes(filterText.toLowerCase()) ||
        item.city.toLowerCase().includes(filterText.toLowerCase()) ||
        item.state.toLowerCase().includes(filterText.toLowerCase()) ||
        (item.status ? "active" : "inactive").includes(filterText.toLowerCase()) ||
        item.branch_name.toLowerCase().includes(filterText.toLowerCase()) 
    );
    setFilteredCategories(filteredData);
  }, [filterText, vendor]);

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
          to={`/vendorDetailPage/${row.id}`}
        >
          {row.name}
        </NavLink>
      ),
    },
    { name: <b>City</b>, selector: (row) => row.city, sortable: true },
    { name: <b>State</b>, selector: (row) => row.state, sortable: true },
    { name: <b>Branch</b>, selector: (row) => row.branch_name, sortable: true },
    {
      name: <b>Status</b>,
      selector: (row) => (row.status === "active" ? "active" : "inactive"),
      sortable: true,
    },
    {
      name: <b>Actions</b>,
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
          <>
            {hasEditPermission && (
              <Button
                className="mx-2 btn-sm border-0"
                onClick={() => handleShow(row)}
              >
                <i className="fa-regular fa-edit" aria-hidden="true"></i>
              </Button>
            )}
            {hasDeletePermission && (
              <Button
                className="bg-danger btn-sm border-0"
                onClick={() => deleteHandle(row.id)}
              >
                <i className="fa fa-trash" aria-hidden="true"></i>
              </Button>
            )}
          </>
        );
      },
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
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
    (role) => role.name === "Admin" || role.name === "Super Admin"
  );

  return (
    <Main>
      
      <div className="my-2 mt-4" style={{ position: "relative", left: "5px" }}>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
            {"Vendors List"}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <Card style={{ boxShadow:"0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 0, 0, 0.1)", }}>
        <Container fluid className="p-3">
          <p style={{ fontSize: "16px", fontWeight: "bold" }}>Vendor List</p>
          <hr />
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
                <div>
                  {hasAddPermission && (
                    <Button className="btn-sm" onClick={() => handleShow()}>
                      <i className="fa fa-plus" aria-hidden="true"></i>&nbsp;Add
                      Vendor
                    </Button>
                  )}
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col>
              <DataTable
                variant="dark"
                columns={columns}
                data={filteredCategories}
                pagination
                highlightOnHover
                striped
                customStyles={customStyles}
              />
            </Col>
          </Row>

          <Modal show={show} onHide={handleClose} backdrop="static" size="lg">
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Modal.Header closeButton>
                <Modal.Title>
                  {isUpdate ? "Update Vendor" : "Add Vendor"}
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
                        />{" "}
                        <Form.Control.Feedback type="invalid">
                          {gstValidation}
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
                          {phoneValidation}
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
                          rows={0}
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
                          value={selectedVendor?.status || true}
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
          <ToastContainer />
        </Container>
      </Card>
    </Main>
  );
}
