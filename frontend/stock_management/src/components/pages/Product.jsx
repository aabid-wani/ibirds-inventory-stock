import "react-toastify/dist/ReactToastify.css";
import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import unitData from "../../components/json/measurement.json";
import { Container, Row, Col, Card, Breadcrumb, Button, Modal, Form} from "react-bootstrap";
import { Link, NavLink,useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { toast, ToastContainer } from "react-toastify";
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
  let   navigate = useNavigate();
  const [product, setProduct] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filteredProduct, setFilteredProduct] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [category, setCategory] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loader ,setLoader] = useState(false);
  const { permissions, loginData } = useContext(AuthContext);
  const [newProduct, setNewProduct] = useState({
    id: "",                name: "",
    description: "",       category_id: "",
    total_buy_quantity: "",total_issue_quantity: "",
    min_quantity: "",      max_quantity: "",
    status: "active",
  });


 const hasEditPermission = permissions?.some(
    role => ["Admin", "Super Admin"].includes(role.name) || (!["Data Entry"].includes(role.name) && role.edit)
  );
  const hasDeletePermission = permissions?.some(
    role => ["Admin", "Super Admin"].includes(role.name) || (!["Data Entry"].includes(role.name) && role.del)
  );
  const hasAddPermission = permissions?.some( role => ["Admin", "Super Admin"].includes(role.name));

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
      `Are you sure you want to delete ${selectedRows.length} selected product(s)?`
    );
    if (!isConfirmed) return;

    try {
      for (const row of selectedRows) {
   
        await stockManagementApis.deleteProduct(row.id);
      }

      toast.success(`${selectedRows.length} product(s) deleted successfully`);
      setProduct((prev) =>
        prev.filter((prod) => !selectedRows.some((r) => r.id === prod.id))
      );
      setSelectedRows([]);
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("An error occurred while deleting selected records.");
    }
  };
  const ActionColumn = ({ row, deleteHandle }) => (
    <>
      {hasEditPermission && (
        <Button
          className="mx-2 btn-sm border-0"
          onClick={() => handleEditProduct(row)}
        >
          <i className="fa-regular fa-edit" aria-hidden="true"></i>
        </Button>
      )}
      {hasDeletePermission && (
        <Button
          className={`btn-sm border-0 ${row.status === "active" ? "bg-success" : "bg-danger"}`}
          onClick={() => deleteHandle(row.id)}
        >
          <i
            className={`fa ${row.status === "active" ? "fa-check-circle" : "fa-times-circle"}`}
            aria-hidden="true"
            style={{ color: "white" }}
          ></i>
        </Button>

      )}
    </>
  );

 
  useEffect(() => {
    const filteredData = product.filter((item) =>
         item.name.toLowerCase().includes(filterText.toLowerCase()) ||
        (item.category_name && item.category_name.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.status && item.status.toLowerCase().includes(filterText.toLowerCase()))
    );
    setFilteredProduct(filteredData);
  }, [filterText, product]);



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
          // Pass updated_by when updating
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
          // Pass created_by when creating
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


  // Flatten all measurement units from JSON and get unique units
  const getUniqueUnits = () => {
    const allUnits = Object.values(unitData).flat();
    const uniqueUnits = [...new Set(allUnits)];
    return uniqueUnits;
  };

  const uniqueUnits = getUniqueUnits();
  const columns = [
    {
      name: <b>S.No.</b>,
      selector: (row, index) => index + 1,
      sortable: true,
      width: "70px",
      style: { borderRight: "2px solid #dee2e6", fontWeight: "bold" },
    },
   {
    name: <b>Name</b>,
    selector: row => row.name,
    sortable: true,
    cell: row => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <OverlayTrigger
          placement="right"
          delay={{ show: 200, hide: 100 }}
          style={{backgroundColor:'blue'}}
          overlay={
            <Tooltip id={`tooltip-buyqty-${row.id}`} style={{backgroundColor:'gray'}}>
              {/* Total Qty: <b>{row.total_buy_quantity}</b><br></br> */}
              Remaining: <b>{(row.total_buy_quantity - row.total_issue_quantity)}</b>
            </Tooltip>
          }
        >
            <NavLink
          style={{ textDecoration: 'none', color: '#007bff' }}
          to={`/productDetailPage/${row.id}`}
        >
            <span>
          {row.name}
          </span>
        </NavLink>
        
        </OverlayTrigger>
      </div>
    ),
  },
    {
      name: <b>Category</b>,
      selector: (row) => row.category_name || "",
      sortable: true,
    },
    {
      name: <b>Unit</b>,
      selector: (row) => row.measurement_unit || "",
      sortable: true,
    },
    {
      name: <b>Total Qty</b>,
      selector: (row) => row.total_buy_quantity || 0,
      sortable: true,
    },
    {
      name: <b>Issued Qty</b>,
      selector: (row) => row.total_issue_quantity || 0,
      sortable: true,
    },

    {
      name: <b>Remaining Qty</b>,
      selector: (row) => row.total_buy_quantity - row.total_issue_quantity,
      sortable: true,
    },

    {
      name: <b>Status</b>,
      selector: (row) => (row.status === "active" ? "active" : "inactive"),
      sortable: true,
    },
    {
      name: <b>Action</b>,
      cell: (row) => <ActionColumn row={row} deleteHandle={deleteHandle} />,
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const customStyles = {
    table:      { style: { textAlign: "left",},},
    headCells:  { style:{ 
          background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
          color:" #ecf0f1ff",
      }},
    headRow:    { style: { minHeight: "30px", }, },
    rows:       { style: { minHeight: "34px",}, },
  };

  return (
    <>
      {loader &&
      <div class="loading-state">
        <div class="loading"></div>
      </div>
      }
    <Main>
      <div className="my-2" style={{ position: "relative", left: "5px" }}>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
            Home{" "}
          </Breadcrumb.Item>
          <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
            {"Products List"}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <Card
        style={{ boxShadow:  "0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 0, 0, 0.1)",}}>
        <Container fluid className="p-3"   >
          <p style={{ fontSize: "16px", fontWeight: "bold" }}>Product List </p>
          <hr />
          <Row>
            <Col>
              <div className="d-flex justify-content-between align-items-center mb-3" >
                <TextField
                  id="search"
                  label="Search"
                  variant="outlined"
                  type="text"
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

                {hasDeletePermission && selectedRows.length > 0 && (
                  <Button
                    className="btn-sm"
                    style={{left:'40px'}}
                    variant="danger"
                    onClick={handleBulkDelete}
                  >
                    <i aria-hidden="true"></i>Change Status Inactive
                  </Button>
                )}

                {hasAddPermission ? (
                  <div className="d-flex">
                    <Button className="btn-sm" onClick={handleAddProduct}>
                      <i className="fa fa-plus" aria-hidden="true"></i>&nbsp;Add
                      Product
                    </Button>
                  </div>
                ) : null}
              </div>
            </Col>
          </Row>
          <Row>
            <Col>
             <DataTable
                columns={columns}
                data={filteredProduct}
                pagination
                highlightOnHover
                striped
                customStyles={customStyles}
                selectableRows
                onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
              />
            </Col>
          </Row>

          <Modal  show={showModal} onHide={handleModalClose} backdrop="static" size="lg"  >
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
                <Button variant="primary" type="submit" onClick={onSubmit}>
                  {isUpdate ? "Update" : "Add"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
          <ToastContainer />
        </Container>
      </Card>
    </Main>
    </>
  );
}
