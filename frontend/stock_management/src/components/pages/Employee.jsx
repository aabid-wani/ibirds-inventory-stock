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
        // Pass updated_by when updating
        const payload = { ...newEmployee, updated_by: loginData?.id };
        await stockManagementApis.updateEmployee(selectedEmployee.id, payload);
        toast.success("Employee updated successfully");
      } else {
        // Pass created_by when creating
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

  
    // ...existing code...
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
      (role) => role.name === 'Admin' ||
        role.name === 'Super Admin' ||
        (role.name!== 'Data Entry' && role.add)
    );


  // Action Buttons
  const ActionColumn = ({ row }) => (
    <>
     { hasEditPermission &&
      <Button className="mx-2 btn-sm border-0" onClick={() => handleEditClick(row)}>
        <i className="fa-regular fa-edit" aria-hidden="true"></i>
      </Button>
     }
     { hasDeletePermission && 
      <Button className="bg-danger btn-sm border-0" onClick={() => deleteHandle(row.id)}>
        <i className="fa fa-trash" style={{ color: "white" }} aria-hidden="true"></i>
      </Button>
     }
    </>
  );

  // DataTable Columns
  const columns = [
    {
      name: <b>S.No.</b>,
      selector: (row, index) => index + 1,
      width: "70px",
      style: { borderRight: "2px solid #dee2e6", fontWeight: "bold" },
    },
    { name: <b>Name</b>, selector: (row) => row.name, sortable: true },
    { name: <b>Department</b>, selector: (row) => row.department, sortable: true },
    { name: <b>Status</b>, selector: (row) => row.status },
    {
      name: <b>Action</b>,
      cell: (row) => <ActionColumn row={row} />,
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // DataTable Styles
  const customStyles = {
    table: {
      style: { textAlign: "left" },
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
      <div className="my-2 mt-4" style={{position: "relative", left: "5px" }}>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
            Home
          </Breadcrumb.Item> 
          <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
            { "Employees List" }
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <Card style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 0, 0, 0.1)" }}>
        <Container fluid className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <TextField
              id="search"
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
            { hasAddPermission &&
              <Button className="btn-sm" onClick={handleModalShow}>
                <i className="fa fa-plus"></i>&nbsp;Add Employee
              </Button>
            }
          </div>

          <DataTable
            columns={columns}
            data={filteredEmployees}
            pagination
            highlightOnHover
            striped
            customStyles={customStyles}
          />
        </Container>
      </Card>

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
            <Button type="submit" variant="primary">
              {isUpdate ? "Update" : "Add"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ToastContainer />
    </Main>
  );
}
