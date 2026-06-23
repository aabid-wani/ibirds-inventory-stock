import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Container,
  Row,
  Col,
  Card,
  Modal,
  Button,
  Form,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { TextField, InputAdornment } from "@mui/material";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ProductCategory() {
  const [showAlert, setShowAlert] = useState(false);
  const [productCategory, setProductCategory] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "", status: "" });
  const { permissions, loginData } = useContext(AuthContext);

  const primaryColor = "#5650ce";

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getProductCategory();
      setProductCategory(result);
      setFilteredCategories(result);
    } catch (error) {
      console.error("Error fetching product category:", error);
      setProductCategory([]);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  useEffect(() => {
    const filteredData = productCategory.filter(
      (item) =>
        item.name.toLowerCase().includes(filterText.toLowerCase()) ||
        item.status.toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredCategories(filteredData);
  }, [filterText, productCategory]);

  const deleteHandle = async (id) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this record?');
    if (isConfirmed) {
      try {
        await stockManagementApis.deleteProductCategory(id);
        toast.success('Successfully deleted record');
        setProductCategory((prevPrd) => prevPrd.filter((ord) => ord.id !== id));
      } catch (error) {
        console.error('Error deleting record:', error);
        toast.error('Error deleting record');
        setShowAlert(true);
      }
    } else {
      setShowAlert(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCurrentCategory(null);
    setNewCategory({ name: "", status: "" });
  };

  const handleModalShow = (mode, category = null) => {
    setModalMode(mode);
    if (mode === "edit" && category) {
      setCurrentCategory(category);
      setNewCategory({ name: category.name, status: category.status });
    } else {
      setNewCategory({ name: "", status: "" });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      let resp;
      if (modalMode === "edit" && currentCategory) {
        const payload = { ...newCategory, updated_by: loginData?.id };
        resp = await stockManagementApis.updateProductCategory(
          currentCategory.id,
          payload
        );
        toast.success("Product category updated successfully");
      } else {
        const payload = { ...newCategory, created_by: loginData?.id };
        resp = await stockManagementApis.addProductCategory(payload);
        if (resp && resp.success) {
          toast.success(resp.message || "Product Category Added");
        } else {
          toast.error(resp.errors);
        }
      }
      handleGetData();
      handleModalClose();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Error saving category");
    }
  };

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
    },
    {
      name: "Category Status",
      selector: (row) => (row.status === "active" ? "active" : "inactive"),
      sortable: true,
    },
    {
      name: "Created At",
      selector: (row) => row.created_at,
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
            (role.name !== "Data Entry" && role.delete)
        );
        return (
          <div className="d-flex gap-2">
            {hasEditPermission && (
              <Button
                variant="outline-primary"
                className="btn-sm d-flex align-items-center justify-content-center"
                onClick={() => handleModalShow("edit", row)}
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
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>
          Home
        </Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Product Categories</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm" style={{ borderRadius: "8px" }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Product Category List</h5>
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
                  onClick={() => handleModalShow("add")}
                  style={{ backgroundColor: primaryColor }}
                >
                  <i className="fa fa-plus me-1" aria-hidden="true"></i> Add Category
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
      <Modal show={showModal} onHide={handleModalClose} backdrop="static">
        <Form onSubmit={handleSaveCategory}>
          <Modal.Header closeButton>
            <Modal.Title>
              {modalMode === "edit" ? "Update Product Category" : "Add Product Category"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Container>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter category name"
                      name="name"
                      value={newCategory.name}
                      onChange={handleInputChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter a name.
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
                      value={newCategory.status}
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
            <Button variant="secondary" onClick={handleModalClose}>
              Close
            </Button>
            <Button type="submit" style={{ backgroundColor: primaryColor, border: "none" }}>
              {modalMode === "edit" ? "Update" : "Add"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ToastContainer />
    </Main>
  );
}