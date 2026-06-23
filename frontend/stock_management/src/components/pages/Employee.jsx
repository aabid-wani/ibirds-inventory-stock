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
import Main from "../layout/Main";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../context/AuthProvider";

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    department: "",
    status: "",
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const { permissions, loginData } = useContext(AuthContext);

  const handleModalClose = () => {
    setShowModal(false);
    setIsUpdate(false);
    setNewEmployee({
      name: "",
      department: "",
      status: "",
    });
    setSelectedEmployee(null);
  };

  const handleModalShow = () => setShowModal(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isUpdate && selectedEmployee) {
        const payload = { ...newEmployee, updated_by: loginData?.id };
        await stockManagementApis.updateEmployee(selectedEmployee.id, payload);
        toast.success("Employee updated successfully");
      } else {
        const payload = { ...newEmployee, created_by: loginData?.id };
        await stockManagementApis.addEmployee(payload);
        toast.success("Employee created successfully");
      }
      handleModalClose();
      handleGetData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Operation failed");
    }
  };

  // Edit Click Handler
  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setNewEmployee({
      name: employee.name,
      department: employee.department,
      status: employee.status,
    });
    setIsUpdate(true);
    handleModalShow();
  };

  // Fetch Data
  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getEmployees();
      setEmployees(result);
      setFilteredEmployees(result);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    }
  };

  // Filter Employees
  useEffect(() => {
    handleGetData();
  }, []);

  useEffect(() => {
    const filtered = employees.filter((emp) =>
      (emp.name || "").toLowerCase().includes(filterText.toLowerCase()) ||
      (emp.department || "").toLowerCase().includes(filterText.toLowerCase()) ||
      (emp.status || "").toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [filterText, employees]);

  // Delete Handler
  const deleteHandle = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this employee?");
    if (isConfirmed) {
      try {
        await stockManagementApis.deleteEmployee(id);
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
        toast.success("Employee deleted successfully");
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast.error("Failed to delete employee");
      }
    }
  };

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
  const hasAddPermission = permissions?.some(
    (role) =>
      role.name === "Admin" ||
      role.name === "Super Admin" ||
      (role.name !== "Data Entry" && role.add)
  );

  // Action Buttons updated to match UI
  const ActionColumn = ({ row }) => (
    <div className="d-flex gap-2">
      {hasEditPermission && (
        <Button 
          variant="outline-primary" 
          className="btn-sm d-flex align-items-center justify-content-center" 
          onClick={() => handleEditClick(row)}
          style={{ width: '32px', height: '32px', borderColor: '#a3a6dd', color: '#5650ce' }}
        >
          <i className="fa-regular fa-edit" aria-hidden="true"></i>
        </Button>
      )}
      {hasDeletePermission && (
        <Button 
          variant="outline-danger" 
          className="btn-sm d-flex align-items-center justify-content-center" 
          onClick={() => deleteHandle(row.id)}
          style={{ width: '32px', height: '32px', borderColor: '#f5c2c7', color: '#dc3545' }}
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
    { name: "Department", selector: (row) => row.department, sortable: true },
    { name: "Status", selector: (row) => row.status },
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

  const primaryColor = "#5650ce"; // Indigo/Purple color from the image

  return (
    <Main>
      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Employees</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm" style={{ borderRadius: '8px' }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Employee List</h5>
              <small className="text-muted">{filteredEmployees.length} records</small>
            </div>
            
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <TextField
                id="search"
                placeholder="Search..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                size="small"
                sx={{ minWidth: '200px', backgroundColor: '#fcfcfc' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fa fa-search text-muted"></i>
                    </InputAdornment>
                  ),
                }}
              />
              
              {hasAddPermission && (
                <>
                  <Button 
                    className="px-3 border-0" 
                    onClick={handleModalShow}
                    style={{ backgroundColor: primaryColor }}
                  >
                    + Add Employee
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Data Table Section */}
          <div className="p-0">
            <DataTable
              columns={columns}
              data={filteredEmployees}
              pagination
              highlightOnHover
              customStyles={customStyles}
            />
          </div>
        </Card>
      </Container>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleModalClose} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{isUpdate ? "Update Employee" : "Add Employee"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={newEmployee.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control
                    type="text"
                    name="department"
                    value={newEmployee.department}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={newEmployee.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" style={{ backgroundColor: primaryColor, border: 'none' }}>
              {isUpdate ? "Update" : "Add"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ToastContainer />
    </Main>
  );
}