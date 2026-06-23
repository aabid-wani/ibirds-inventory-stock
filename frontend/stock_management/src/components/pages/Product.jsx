import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import unitData from "../../components/json/measurement.json";
import { Container, Row, Col, Card, Button, Modal, Form } from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../context/AuthProvider";
import { InputAdornment, TextField } from "@mui/material";
import Main from "../layout/Main";
import '../css/loader.css';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import pluralize from 'pluralize';

function normalizeProductName(raw) {
  return pluralize.singular(raw.trim().toLowerCase());
}

export default function Product() {
  let navigate = useNavigate();
  const [product, setProduct] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filteredProduct, setFilteredProduct] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [category, setCategory] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loader, setLoader] = useState(false);
  const { permissions, loginData } = useContext(AuthContext);
  const [newProduct, setNewProduct] = useState({
    id: "",
    name: "",
    description: "",
    category_id: "",
    total_buy_quantity: "",
    total_issue_quantity: "",
    min_quantity: "",
    max_quantity: "",
    status: "active",
  });

  const primaryColor = "#5650ce";

  const hasEditPermission = permissions?.some(
    role => ["Admin", "Super Admin"].includes(role.name) || (!["Data Entry"].includes(role.name) && role.edit)
  );
  const hasDeletePermission = permissions?.some(
    role => ["Admin", "Super Admin"].includes(role.name) || (!["Data Entry"].includes(role.name) && role.del)
  );
  const hasAddPermission = permissions?.some(role => ["Admin", "Super Admin"].includes(role.name));

  const handleGetData = async () => {
    try {
      const [productData, categoryData] = await Promise.all([
        stockManagementApis.getProduct(),
        stockManagementApis.getProductCategory()
      ]);
      setProduct(productData);
      setCategory(categoryData);
      setFilteredProduct(productData);
    } catch (e) {
      console.error("Error fetching product:", e);
      setProduct([]);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  useEffect(() => {
    const term = filterText.toLowerCase();
    setFilteredProduct(product.filter(item =>
      item.name.toLowerCase().includes(term) ||
      (item.category_name?.toLowerCase().includes(term)) ||
      (item.description?.toLowerCase().includes(term)) ||
      (item.status?.toLowerCase().includes(term))
    ));
  }, [filterText, product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleModalClose = () => {
    setShowModal(false);
    setValidated(false);
    setNewProduct({
      id: "", name: "", description: "", category_id: "",
      total_buy_quantity: "", total_issue_quantity: "",
      min_quantity: "", max_quantity: "", status: "active"
    });
  };

  const handleEditProduct = (prod) => {
    setNewProduct({
      ...prod,
      total_buy_quantity: prod.total_buy_quantity || 0,
      total_issue_quantity: prod.total_issue_quantity || 0,
      min_quantity: prod.min_quantity || 0,
      max_quantity: prod.max_quantity || 0,
    });
    setIsUpdate(true);
    setShowModal(true);
  };

  const deleteHandle = async (id) => {
    try {
      await stockManagementApis.deleteProduct(id);
      toast.success('Successfully toggled status');
      handleGetData();
    } catch (e) {
      console.error(e);
      toast.error('Error deleting record');
    }
  };

  const handleBulkDelete = async () => {
    const isConfirmed = window.confirm(
      `Are you sure you want to change the status of ${selectedRows.length} selected product(s)?`
    );
    if (!isConfirmed) return;

    try {
      for (const row of selectedRows) {
        await stockManagementApis.deleteProduct(row.id);
      }
      toast.success(`${selectedRows.length} product(s) status changed successfully`);
      setProduct((prev) =>
        prev.filter((prod) => !selectedRows.some((r) => r.id === prod.id))
      );
      setSelectedRows([]);
      handleGetData();
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("An error occurred while modifying selected records.");
    }
  };

  const ActionColumn = ({ row, deleteHandle }) => (
    <div className="d-flex gap-2">
      {hasEditPermission && (
        <Button
          variant="outline-primary"
          className="btn-sm d-flex align-items-center justify-content-center"
          onClick={() => handleEditProduct(row)}
          style={{ width: "32px", height: "32px", borderColor: "#a3a6dd", color: "#5650ce" }}
        >
          <i className="fa-regular fa-edit" aria-hidden="true"></i>
        </Button>
      )}
      {hasDeletePermission && (
        <Button
          variant={row.status === "active" ? "outline-success" : "outline-danger"}
          className="btn-sm d-flex align-items-center justify-content-center"
          onClick={() => deleteHandle(row.id)}
          style={{ 
            width: "32px", 
            height: "32px", 
            borderColor: row.status === "active" ? "#badbcc" : "#f5c2c7",
            color: row.status === "active" ? "#198754" : "#dc3545"
          }}
        >
          <i
            className={`fa ${row.status === "active" ? "fa-check-circle" : "fa-times-circle"}`}
            aria-hidden="true"
          ></i>
        </Button>
      )}
    </div>
  );

  const handleAddProduct = () => {
    setIsUpdate(false);
    setShowModal(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);
    setLoader(true);
    if (!e.currentTarget.checkValidity()) {
      e.stopPropagation();
      setLoader(false);
      return;
    }

    const normalizedName = normalizeProductName(newProduct.name);
    const duplicate = product.some(prod =>
      normalizeProductName(prod.name) === normalizedName && (!isUpdate || prod.id !== newProduct.id)
    );
    if (duplicate) {
      toast.error("A product with this name already exists.");
      setLoader(false);
      return;
    }

    let payload = {
      ...newProduct,
      name: normalizedName,
      total_buy_quantity: newProduct.total_buy_quantity,
      total_issue_quantity: newProduct.total_issue_quantity,
      min_quantity: newProduct.min_quantity,
      max_quantity: newProduct.max_quantity,
    };

    try {
      let resp;
      if (isUpdate) {
        payload = { ...payload, updated_by: loginData?.id };
        resp = await stockManagementApis.updateProduct(newProduct.id, payload);
        if (resp.success) {
          toast.success(resp.message || "Product updated successfully");
          handleModalClose();
          handleGetData();
        } else {
          toast.error(resp.errors || "Error updating product");
        }
      } else {
        payload = { ...payload, created_by: loginData?.id };
        resp = await stockManagementApis.addProduct(payload);
        if (resp?.success) {
          toast.success(resp.message || "Product saved successfully");
          handleModalClose();
          handleGetData();
          navigate(`/productDetailPage/${resp.data[0]?.id}`);
        } else {
          toast.error(resp.message || "Operation failed");
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Error saving product";
      toast.error(msg);
    } finally {
      setLoader(false);
    }
  };

  const getUniqueUnits = () => {
    const allUnits = Object.values(unitData).flat();
    const uniqueUnits = [...new Set(allUnits)];
    return uniqueUnits;
  };

  const uniqueUnits = getUniqueUnits();

  const columns = [
    {
      name: "S.No.",
      selector: (row, index) => index + 1,
      sortable: true,
      width: "80px",
    },
    {
      name: "Name",
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <OverlayTrigger
            placement="right"
            delay={{ show: 200, hide: 100 }}
            overlay={
              <Tooltip id={`tooltip-buyqty-${row.id}`} style={{ backgroundColor: '#212529' }}>
                Remaining: <b>{(row.total_buy_quantity - row.total_issue_quantity)}</b>
              </Tooltip>
            }
          >
            <NavLink
              style={{ textDecoration: 'none', color: primaryColor, fontWeight: '500' }}
              to={`/productDetailPage/${row.id}`}
            >
              <span>{row.name}</span>
            </NavLink>
          </OverlayTrigger>
        </div>
      ),
    },
    {
      name: "Category",
      selector: (row) => row.category_name || "",
      sortable: true,
    },
    {
      name: "Unit",
      selector: (row) => row.measurement_unit || "",
      sortable: true,
    },
    {
      name: "Total Qty",
      selector: (row) => row.total_buy_quantity || 0,
      sortable: true,
    },
    {
      name: "Issued Qty",
      selector: (row) => row.total_issue_quantity || 0,
      sortable: true,
    },
    {
      name: "Remaining Qty",
      selector: (row) => row.total_buy_quantity - row.total_issue_quantity,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => (row.status === "active" ? "active" : "inactive"),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => <ActionColumn row={row} deleteHandle={deleteHandle} />,
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "120px"
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
    <>
      {loader &&
        <div className="loading-state">
          <div className="loading"></div>
        </div>
      }
      <Main>
        <div className="my-3 px-3" style={{ fontSize: "14px" }}>
          <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>
            Home
          </Link>
          <span className="text-muted mx-2">/</span>
          <span className="text-muted">Products</span>
        </div>

        <Container fluid className="px-3">
          <Card className="border-0 shadow-sm" style={{ borderRadius: "8px" }}>
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom flex-wrap gap-3">
              <div>
                <h5 className="mb-0 fw-normal">Product List</h5>
                <small className="text-muted">{filteredProduct.length} records</small>
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

                {hasDeletePermission && selectedRows.length > 0 && (
                  <Button
                    variant="outline-danger"
                    className="px-3"
                    onClick={handleBulkDelete}
                  >
                    <i className="fa fa-ban me-1" aria-hidden="true"></i> Change Status
                  </Button>
                )}

                {hasAddPermission && (
                  <Button
                    className="px-3 border-0"
                    onClick={handleAddProduct}
                    style={{ backgroundColor: primaryColor }}
                  >
                    <i className="fa fa-plus me-1" aria-hidden="true"></i> Add Product
                  </Button>
                )}
              </div>
            </div>

            {/* Data Table Section */}
            <div className="p-0">
              <DataTable
                columns={columns}
                data={filteredProduct}
                pagination
                highlightOnHover
                customStyles={customStyles}
                selectableRows
                onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
                noDataComponent={<div className="p-4 text-muted">No Records Found</div>}
              />
            </div>
          </Card>

          {/* Add/Edit Modal */}
          <Modal show={showModal} onHide={handleModalClose} backdrop="static" size="lg">
            <Form noValidate validated={validated}>
              <Modal.Header closeButton>
                <Modal.Title>
                  {isUpdate ? "Update Product" : "Add Product"}
                </Modal.Title>
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
                          value={newProduct.name}
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
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          name="category_id"
                          value={newProduct.category_id}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Category</option>
                          {category.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          Please select a category.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Opening Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="Opening Quantity"
                          name="total_buy_quantity"
                          min="0"
                          value={newProduct.total_buy_quantity}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value, 10);
                            if (value >= 0 || e.target.value === "") {
                              handleInputChange(e);
                            } else {
                              e.target.disabled = true;
                              setTimeout(() => {
                                e.target.disabled = false;
                                e.target.value = "";
                              }, 500);
                            }
                          }}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Please enter the buy quantity.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group className="mb-3">
                        <Form.Label>Units</Form.Label>
                        <Form.Select
                          name="measurement_units"
                          value={newProduct.measurement_units || ""}
                          onChange={handleInputChange}
                        >
                          <option value="" disabled>Select unit</option>
                          {uniqueUnits.map((unit, index) => (
                            <option key={index} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          name="status"
                          value={newProduct.status}
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
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Min Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="Min Quantity"
                          name="min_quantity"
                          value={newProduct.min_quantity}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Max Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="Max Quantity"
                          name="max_quantity"
                          value={newProduct.max_quantity}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="description"
                          value={newProduct.description}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Container>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleModalClose}>
                  Close
                </Button>
                <Button type="submit" onClick={onSubmit} style={{ backgroundColor: primaryColor, border: "none" }}>
                  {isUpdate ? "Update" : "Add"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          <ToastContainer />
        </Container>
      </Main>
    </>
  );
}