import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import stockManagementApis from '../apis/StockManagementApis';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Card, Col, Container, Row, Modal, Form, ToastContainer } from 'react-bootstrap';
import Main from '../layout/Main';
import { AuthContext } from '../context/AuthProvider';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

export default function ProductDetailPage() {
    const { id } = useParams();
    const { permissions, useNotification, addNotification } = useContext(AuthContext);
    const [category, setCategory] = useState([]);
    const [totalStock, setTotalStock] = useState(0);
    const [product, setProduct] = useState({
        name: "",
        category_name: "",
        category_id: "",
        description: "",
        status: false,
        min_quantity: "",
        max_quantity: "",
        total_buy_quantity: "",
        total_issue_quantity: "",
        id: ""
    });

    const [productCategory, setProductCategory] = useState({
        name: "",
        status: false,
        id: ""
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editProductData, setEditProductData] = useState({});

    const primaryColor = "#5650ce";

    const handleProductData = async (id) => {
        try {
            const result = await stockManagementApis.getProductById(id);
            setProduct(result[0]);
            setEditProductData(result[0]);
            
            const total = result.reduce((total, p) => total + (p.total_buy_quantity - p.total_issue_quantity), 0);
            setTotalStock(total);
            
            if (total < 10 && addNotification) {
                addNotification(`Low stock alert for "${result[0].name}" — only ${total} left`);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        }
    };

    const handleCategoryData = async (id) => {
        try {
            const result = await stockManagementApis.getProductCategoryById(id);
            setCategory(await stockManagementApis.getProductCategory());
            setProductCategory(result[0]);
        } catch (error) {
            console.error('Error fetching product category:', error);
        }
    };

    useEffect(() => {
        handleProductData(id);
    }, [id]);

    useEffect(() => {
        if (product.category_id) {
            handleCategoryData(product.category_id);
        }
    }, [product.category_id]);

    const handleEditButtonClick = () => {
        setShowEditModal(true);
    };

    const handleEditProductDataChange = (e) => {
        const { name, value } = e.target;
        setEditProductData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        try {
            let response = await stockManagementApis.updateProductById(product.id, editProductData);
            if (response.success) {
                toast.success('Product updated successfully');
            } else {
                toast.error('Product is not updated');
            }
            setShowEditModal(false);
            handleProductData(product.id);
        } catch (error) {
            toast.error('Product not updated successfully');
            console.error('Error updating product:', error);
        }
    };

    const hasUpdatePermission = permissions?.some(role => role.name === 'Admin' || role.name === 'Super Admin');

    // Helper component for rendering detail rows cleanly
    const DetailItem = ({ label, value, highlight = false }) => (
        <div className="mb-4">
            <small className="text-muted d-block text-uppercase fw-semibold mb-1" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                {label}
            </small>
            <div className={`fs-6 ${highlight ? 'fw-bold' : 'text-dark'}`} style={{ color: highlight ? primaryColor : 'inherit' }}>
                {value || "-"}
            </div>
        </div>
    );

    return (
        <Main>
            <div className="my-3 px-3" style={{ fontSize: "14px" }}>
                <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
                <span className="text-muted mx-2">/</span>
                <Link to="/product" className="text-decoration-none" style={{ color: primaryColor }}>Products</Link>
                <span className="text-muted mx-2">/</span>
                <span className="text-muted">Details</span>
            </div>

            <Container fluid className="px-3">
                <Card className="border-0 shadow-sm p-4" style={{ borderRadius: "12px" }}>
                    
                    {/* Header Section */}
                    <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                        <div>
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <h4 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                                    {product.name || "Loading..."}
                                </h4>
                                <span className={`badge rounded-pill px-3 py-2 ${product.status ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`} style={{ fontSize: "12px" }}>
                                    {product.status ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <span className="text-muted" style={{ fontSize: "14px" }}>
                                <i className="fa-regular fa-folder-open me-2"></i>
                                {product.category_name || "No Category"}
                            </span>
                        </div>
                        
                        <div className="d-flex gap-3">
                            {hasUpdatePermission && (
                                <Button
                                    variant="outline-primary"
                                    className="d-flex align-items-center"
                                    onClick={handleEditButtonClick}
                                    style={{ borderColor: primaryColor, color: primaryColor, borderRadius: "6px" }}
                                >
                                    <i className="fa-regular fa-edit me-2" aria-hidden="true"></i> Edit
                                </Button>
                            )}
                            <Link to={`/product`}>
                                <Button
                                    variant="outline-secondary"
                                    className="d-flex align-items-center"
                                    style={{ borderRadius: "6px" }}
                                >
                                    <i className="fa-solid fa-arrow-left me-2" aria-hidden="true"></i> Back
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Content Section */}
                    <Row className="g-4">
                        {/* Basic Info Column */}
                        <Col md={6}>
                            <Card className="border-0 h-100" style={{ backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
                                <Card.Body className="p-4">
                                    <h6 className="text-uppercase text-muted mb-4 fw-bold" style={{ fontSize: "13px", letterSpacing: "1px" }}>
                                        <i className="fa-solid fa-circle-info me-2"></i>Basic Information
                                    </h6>
                                    <DetailItem label="Product Name" value={product.name} />
                                    <DetailItem label="Category" value={product.category_name} />
                                    <DetailItem label="Description" value={product.description} />
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Inventory Info Column */}
                        <Col md={6}>
                            <Card className="border-0 h-100" style={{ backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
                                <Card.Body className="p-4">
                                    <h6 className="text-uppercase text-muted mb-4 fw-bold" style={{ fontSize: "13px", letterSpacing: "1px" }}>
                                        <i className="fa-solid fa-boxes-stacked me-2"></i>Inventory Overview
                                    </h6>
                                    
                                    <div className="p-3 mb-4 rounded" style={{ backgroundColor: "rgba(86, 80, 206, 0.05)", border: `1px solid rgba(86, 80, 206, 0.2)` }}>
                                        <DetailItem label="Current Stock Available" value={totalStock} highlight={true} />
                                    </div>

                                    <Row>
                                        <Col xs={6}>
                                            <DetailItem label="Total Buy Quantity" value={product.total_buy_quantity} />
                                        </Col>
                                        <Col xs={6}>
                                            <DetailItem label="Total Issue Quantity" value={product.total_issue_quantity} />
                                        </Col>
                                    </Row>
                                    <hr className="text-muted opacity-25 mt-0 mb-4" />
                                    <Row>
                                        <Col xs={6}>
                                            <DetailItem label="Minimum Quantity" value={product.min_quantity} />
                                        </Col>
                                        <Col xs={6}>
                                            <DetailItem label="Maximum Quantity" value={product.max_quantity} />
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card>
            </Container>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} backdrop="static" size="lg">
                <Form onSubmit={handleSaveChanges}>
                    <Modal.Header closeButton>
                        <Modal.Title>Update Product Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Container>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-4" controlId="formName">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Product Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={editProductData.name || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-4" controlId="formStatus">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Status</Form.Label>
                                        <Form.Select
                                            name="status"
                                            value={editProductData.status ? 'active' : 'inactive'}
                                            onChange={handleEditProductDataChange}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Category</Form.Label>
                                        <Form.Select
                                            name="category_id"
                                            value={editProductData.category_id || ""}
                                            onChange={handleEditProductDataChange}
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
                                <Col md={6}>
                                    <Form.Group className="mb-4" controlId="formTotalBuyQuantity">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Total Buy Quantity</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="total_buy_quantity"
                                            value={editProductData.total_buy_quantity || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-4" controlId="formMinQuantity">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Min Quantity</Form.Label>
                                        <Form.Control
                                            type='number'
                                            name="min_quantity"
                                            value={editProductData.min_quantity || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-4" controlId="formMaxQuantity">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Max Quantity</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="max_quantity"
                                            value={editProductData.max_quantity || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-4" controlId="formDescription">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="description"
                                            value={editProductData.description || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-4" controlId="formTotalIssueQuantity">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Total Issue Quantity</Form.Label>
                                        <Form.Control
                                            disabled
                                            type="number"
                                            name="total_issue_quantity"
                                            value={editProductData.total_issue_quantity || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Container>
                    </Modal.Body>
                    <Modal.Footer className="bg-light">
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" style={{ backgroundColor: primaryColor, border: "none" }}>
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            
            <ToastContainer />
        </Main>
    );
}