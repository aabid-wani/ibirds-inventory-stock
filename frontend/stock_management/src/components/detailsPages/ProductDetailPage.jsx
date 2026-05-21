import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import stockManagementApis from '../apis/StockManagementApis';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Card, CardBody, CardHeader, Col, Container, Row, Modal, Form, ToastContainer, Breadcrumb } from 'react-bootstrap';
import Main from '../layout/Main';
import { AuthContext } from '../context/AuthProvider';
import { toast } from 'react-toastify';

export default function ProductDetailPage() {
    const { id } = useParams();
    const { permissions ,useNotification ,addNotification  } = useContext(AuthContext);
    // const { addNotification } = useNotification();
     const [category, setCategory] = useState([]);
    const [totalStock, setTotalStock] = useState(0);
    const [product, setProduct] = useState({
        name: "",
        category_name: "",
        category_id: "",
        description: "",
        status: false,
        min_quantity: "",
        max_quantity:"",
        total_buy_quantity: "",
        total_issue_quantity: "",
        id: ""
    });

    const [productCategory, setProductCategory] = useState({
        name: "",
        status: false,
        id: ""
    });
    // console.log(productCategory)

    const [showEditModal, setShowEditModal] = useState(false);
    const [editProductData, setEditProductData] = useState({});

    const handleProductData = async (id) => {
        try {
            const result = await stockManagementApis.getProductById(id);
            setProduct(result[0]);
            setEditProductData(result[0]);
            // setTotalStock(result.reduce((total, product) => total + product.total_buy_quantity - product.total_issue_quantity, 0));
            const total = result.reduce((total, p) => total + (p.total_buy_quantity - p.total_issue_quantity),0);
            // console.log('total ',total);
            setTotalStock(total);
            if (total < 10) {
              addNotification(`Low stock alert for "${result[0].name}" — only ${total} left`);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        }
    };

    const handleCategoryData = async (id) => {
        try {
            const result = await stockManagementApis.getProductCategoryById(id);
            setCategory( await stockManagementApis.getProductCategory());
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
            console.log('updated product',editProductData);
            let response = await stockManagementApis.updateProductById(product.id, editProductData);
            console.log('response==>',response);
            if(response.success){
                console.log('product updated successfully')
                toast.success('Product updated successfully');
            }else{
                toast.error('product is not updated');
            }
            setShowEditModal(false);
            handleProductData(product.id); 
        } catch (error) {
            toast.error('Product not updated successfully');
            console.error('Error updating product:', error);
        }
    };

    const hasUpdatePermission = permissions?.some(role => role.name === 'Admin' || role.name === 'Super Admin');

    return (
        <Main>
            <div className="my-2 mt-4" style={{position: "relative", left: "10px" }}>
                <Breadcrumb>
                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
                    Home
                    </Breadcrumb.Item> 
                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/product" }}>
                    Product
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
                    {"Product Details"}
                    </Breadcrumb.Item>
                </Breadcrumb>
            </div>
            <Card style={{ boxShadow: "0 0 5px #a3a3a3" }}>
                <CardHeader style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }}>
                    <span style={{ fontSize: '18px' }}>Product Details</span>
                    <Link to={`/product`}>
                        <Button variant='danger' className="float-end btn-sm mx-2 border-0" style={{ padding: '3px 8px' }}>
                            <i className='fa fa-close color-white border-0'></i>
                        </Button>
                    </Link>
                    {hasUpdatePermission && (
                        <Button className="float-end btn-sm" style={{ padding: '2px 8px' }} onClick={handleEditButtonClick}>
                            <i className='fa-regular fa-edit'></i>
                        </Button>
                    )}
                </CardHeader>
                <CardBody>
                    <Container fluid style={{ fontSize: '16px' }}>
                        <Row className="row">
                            <Col sm={6} md={6} lg={12} xl={6}>
                                <div style={{ fontWeight: "bold" }}>Name</div>
                                <div>{product.name}</div>
                                <div className='mt-3' style={{ fontWeight: "bold" }}>Stock Available</div>
                                <div>{ totalStock }</div>
                                <div className='mt-3' style={{ fontWeight: "bold" }}>Description</div>
                                <div>{product.description}</div>
                                <div className='mt-3' style={{ fontWeight: "bold" }}>Status</div>
                                <div>{product.status ? 'Active' : 'Inactive'}</div>
                            </Col>
                            <Col sm={6} md={6} lg={12} xl={6}>
                                <div style={{ fontWeight: "bold" }}>Total Buy Quantity</div>
                                <div>{product.total_buy_quantity}</div>
                                <div className='mt-3' style={{ fontWeight: "bold" }}>Total Issue Quantity</div>
                                <div>{product.total_issue_quantity}</div>
                                <div style={{ fontWeight: "bold" }}>Minimum Quantity</div>
                                <div>{product.min_quantity}</div>
                                <div className='mt-3' style={{ fontWeight: "bold" }}>Maximum Quantity</div>
                                <div>{product.max_quantity}</div>
                            </Col>
                        </Row>
                    </Container>
                </CardBody>
            </Card>
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} backdrop="static" size="lg">
                <div className="container">
                    <div className="row">
                        <Modal.Header closeButton>
                            <Modal.Title>Update Product</Modal.Title>
                        </Modal.Header>
                    </div>
                    <Modal.Body>
                        <Form onSubmit={handleSaveChanges}>
                            <div className="row">
                                <div className="col-lg-6">
                                    <Form.Group controlId="formName">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={editProductData.name || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-lg-6">
                                    <Form.Group controlId="formStatus">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="status"
                                            value={editProductData.status ? 'active' : 'inactive'}
                                            onChange={handleEditProductDataChange}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </Form.Control>
                                    </Form.Group>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-lg-6">
                                     <Form.Group className="mb-3">
                                        <Form.Label>Category</Form.Label>
                                        <Form.Select
                                            name="category_id"
                                            value={editProductData.category_id}
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
                                </div>
                                <div className="col-lg-6">
                                    <Form.Group controlId="formTotalBuyQuantity" className="mt-3">
                                        <Form.Label>Total Buy Quantity</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="total_buy_quantity"
                                            value={editProductData.total_buy_quantity || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </div>
                            </div>
                             <div className="row">
                                <div className="col-lg-6">
                                    <Form.Group controlId="formMinQuantity" className="mt-3">
                                        <Form.Label>Min Quantity</Form.Label>
                                        <Form.Control
                                            type='number'
                                            name="min_quantity"
                                            value={editProductData.min_quantity || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-lg-6">
                                    <Form.Group controlId="formMaxQuantity" className="mt-3">
                                        <Form.Label>Max Quantity</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="max_quantity"
                                            value={editProductData.max_quantity || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-lg-6">
                                    <Form.Group controlId="formDescription" className="mt-3">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="description"
                                            value={editProductData.description || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-lg-6">
                                    <Form.Group controlId="formTotalIssueQuantity" className="mt-3">
                                        <Form.Label>Total Issue Quantity</Form.Label>
                                        <Form.Control
                                            disabled
                                            type="number"
                                            name="total_issue_quantity"
                                            value={editProductData.total_issue_quantity || ''}
                                            onChange={handleEditProductDataChange}
                                        />
                                    </Form.Group>
                                </div>
                            </div>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                                    Close
                                </Button>
                                <Button variant="primary" type="submit">
                                    Save Changes
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal.Body>
                </div>
            </Modal>
            <ToastContainer />
        </Main>
    );
}
