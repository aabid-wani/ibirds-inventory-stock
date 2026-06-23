import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import stockManagementApis from '../apis/StockManagementApis';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Card, Col, Container, Row, Modal, Form, Table } from 'react-bootstrap';
import Main from '../layout/Main';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import moment from 'moment';
import { AuthContext } from '../context/AuthProvider';

export default function IssuedDetailPage() {
    const { permissions } = useContext(AuthContext);
    const hasNotReturnProduct = permissions?.some((role) =>
        role.name === "Admin" ||
        role.name === "Super Admin" ||
        role.name !== "Data Entry"
    );
    const { id } = useParams();
    const [returns, setReturns] = useState([]);
    const [totalReturns, setTotalReturns] = useState(0);
    const [returnDetails, setReturnDetails] = useState({
        product_id: '',
        product_name: '',
        quantity: '',
        return_date: '',
        issue_date: '',
        issue_id: id
    });
    const [issue, setIssue] = useState({});
    
    const [show, setShow] = useState(false);
    const [validated, setValidated] = useState(false);

    const primaryColor = "#5650ce";

    const handleIssueData = async (id) => {
        try {
            const data = await stockManagementApis.getIssueById(id);
            setIssue(data.result[0] || {});
            if (data.result[0]) {
                setReturnDetails(prevDetails => ({
                    ...prevDetails,
                    product_name: data.result[0].product_name,
                    product_id: data.result[0].product_id,
                    quantity: data.result[0].quantity,
                    issue_date: data.result[0].issue_date,
                    issue_id: data.result[0].id,
                }));
            }
        } catch (error) {
            console.error('Error fetching issue:', error);
        }
    };

    const getReturnDetails = async () => {
        try {
            const result = await stockManagementApis.getReturnById(id);
            const returnData = Array.isArray(result) ? result : [];
            setReturns(returnData);

            // Calculate totalReturns by summing up the quantities of all returns
            const totalReturnQuantity = returnData.reduce((sum, ret) => sum + parseInt(ret.quantity || 0, 10), 0);
            setTotalReturns(totalReturnQuantity);
        } catch (error) {
            console.error('Error fetching return details:', error);
            setReturns([]);
            setTotalReturns(0);
        }
    };

    useEffect(() => {
        handleIssueData(id);
        getReturnDetails();
    }, [id]);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const updateProductStock = async (productId, addedQuantity) => {
        try {
            const product = await stockManagementApis.getProductById(productId);
            const totalBuyQuantity = product[0].total_buy_quantity;
            const totalIssueQuantity = product[0].total_issue_quantity;

            if (totalBuyQuantity < addedQuantity && totalIssueQuantity < addedQuantity) {
                throw new Error('Not enough stock to process return');
            } else {
                const total_issue = parseFloat(product[0].total_issue_quantity) - parseFloat(addedQuantity);
                await stockManagementApis.updateProductById(productId, { total_issue_quantity: total_issue });
            }
        } catch (error) {
            console.error('Error updating product stock:', error);
        }
    }; 

    const updateIssueQuantity = async (issueId, returnedQuantity) => {
        try {
            const issueData = await stockManagementApis.getIssueById(issueId);
            const currentIssue = issueData[0];

            const updatedIssueQuantity = currentIssue.quantity - parseInt(returnedQuantity, 10);

            if (updatedIssueQuantity < 0) {
                throw new Error("Issue quantity cannot be negative.");
            }

            await stockManagementApis.updateIssueQuantity(issueId, {
                quantity: updatedIssueQuantity
            });
        } catch (error) {
            console.error('Error updating issue quantity:', error);
        }
    };

    const AddReturnData = async () => {
        try {
            await stockManagementApis.addReturn(returnDetails);
            toast.success('Added Return successfully');
            await updateProductStock(returnDetails.product_id, returnDetails.quantity);
            await updateIssueQuantity(returnDetails.issue_id, returnDetails.quantity);
            getReturnDetails();
            handleIssueData(id);
        } catch (error) {
            console.error('Error updating return details:', error);
            toast.error('Failed to add return details.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setReturnDetails({ ...returnDetails, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
        } else {
            await AddReturnData();
            handleClose();
        }
        setValidated(true);
    };

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
            <ToastContainer />

            {/* ─── Breadcrumbs ─── */}
            <div className="my-3 px-3" style={{ fontSize: "14px" }}>
                <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
                <span className="text-muted mx-2">/</span>
                <Link to="/issue" className="text-decoration-none" style={{ color: primaryColor }}>Provisions</Link>
                <span className="text-muted mx-2">/</span>
                <span className="text-muted">Provision Details</span>
            </div>

            <Container fluid className="px-3">
                {/* ─── Provision Header & Details Card ─── */}
                <Card className="border-0 shadow-sm p-4 mb-4" style={{ borderRadius: "12px" }}>
                    
                    {/* Header Section */}
                    <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                        <div>
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <h4 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                                    Provision Details
                                </h4>
                                <span className={`badge rounded-pill px-3 py-2 ${issue?.status ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`} style={{ fontSize: "12px" }}>
                                    {issue?.status ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <span className="text-muted" style={{ fontSize: "14px" }}>
                                <i className="fa-regular fa-calendar me-2"></i>
                                {issue?.issue_date ? moment(issue.issue_date).format('DD-MM-YYYY') : '-'}
                            </span>
                        </div>
                        
                        <div className="d-flex gap-3">
                            <Link to="/issue">
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
                        <Col md={6}>
                            <Card className="border-0 h-100" style={{ backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
                                <Card.Body className="p-4">
                                    <h6 className="text-uppercase text-muted mb-4 fw-bold" style={{ fontSize: "13px", letterSpacing: "1px" }}>
                                        <i className="fa-solid fa-box-open me-2"></i>Provision Info
                                    </h6>
                                    <DetailItem label="Product" value={issue?.product_name} highlight={true} />
                                    <DetailItem label="Branch" value={issue?.branch_name} />
                                    <DetailItem label="User" value={issue?.user_name} />
                                    <DetailItem label="Employee" value={issue?.employee_name} />
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6}>
                            <Card className="border-0 h-100" style={{ backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
                                <Card.Body className="p-4">
                                    <h6 className="text-uppercase text-muted mb-4 fw-bold" style={{ fontSize: "13px", letterSpacing: "1px" }}>
                                        <i className="fa-solid fa-clipboard-list me-2"></i>Status & Quantities
                                    </h6>
                                    
                                    <Row>
                                        <Col xs={6}>
                                            <div className="p-3 mb-4 rounded" style={{ backgroundColor: "rgba(86, 80, 206, 0.05)", border: `1px solid rgba(86, 80, 206, 0.2)` }}>
                                                <DetailItem label="Quantity Issued" value={issue?.quantity} highlight={true} />
                                            </div>
                                        </Col>
                                        <Col xs={6}>
                                            <div className="p-3 mb-4 rounded bg-white border">
                                                <DetailItem label="Total Returned" value={totalReturns} />
                                            </div>
                                        </Col>
                                    </Row>

                                    <DetailItem label="Description" value={issue?.description} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card>

                {/* ─── Related Transactions (Returns) ─── */}
                <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "12px", overflow: "hidden" }}>
                    <div className="bg-light p-3 border-bottom d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold text-uppercase text-muted" style={{ fontSize: "14px", letterSpacing: "1px" }}>Related Returns</h6>
                        {hasNotReturnProduct && (
                            <Button 
                                variant="outline-success" 
                                className="btn-sm d-flex align-items-center" 
                                onClick={handleShow}
                                style={{ fontWeight: "500", borderRadius: "6px" }}
                            >
                                <i className="fa-solid fa-rotate-left me-2"></i> Add Return
                            </Button>
                        )}
                    </div>
                    
                    <Card.Body className="p-0">
                        <div className="p-3">
                            <Table responsive hover className="align-middle mb-0" style={{ fontSize: 14 }}>
                                <thead style={{ backgroundColor: "#212529", color: "#ffffff" }}>
                                    <tr>
                                        <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", borderTopLeftRadius: "6px" }}>Product</th>
                                        <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px" }}>Quantity</th>
                                        <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px" }}>Return Date</th>
                                        <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", borderTopRightRadius: "6px" }}>Issue Date</th>
                                    </tr>
                                </thead>
                                <tbody className="border-top-0">
                                    {returns.length > 0 ? (
                                        returns.map((ret, index) => (
                                            <tr key={index}>
                                                <td className="p-3 fw-medium text-dark">{ret.product_name}</td>
                                                <td className="p-3">
                                                    <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1 border border-danger border-opacity-25 rounded-pill">
                                                        {ret.quantity}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-muted">{ret.return_date ? moment(ret.return_date).format('DD-MM-YYYY') : '-'}</td>
                                                <td className="p-3 text-muted">{ret.issue_date ? moment(ret.issue_date).format('DD-MM-YYYY') : '-'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center p-4 text-muted">
                                                No related returns found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </Container>

            {/* ─── Add Return Modal ─── */}
            <Modal show={show} onHide={handleClose} backdrop="static" size="lg">
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Return Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Container>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Product Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Product Name"
                                            name="product_name"
                                            value={returnDetails.product_name}
                                            onChange={handleInputChange}
                                            readOnly
                                            disabled
                                            className="bg-light"
                                        />
                                    </Form.Group>
                                    <Form.Control
                                        type="hidden"
                                        name="product_id"
                                        value={returnDetails.product_id}
                                    />
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Quantity</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="Quantity"
                                            name="quantity"
                                            min="0"
                                            value={returnDetails.quantity}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value, 10);
                                                if (value >= 0 || e.target.value === '') {
                                                    handleInputChange(e);
                                                } else {
                                                    e.target.disabled = true;
                                                    setTimeout(() => {
                                                        e.target.disabled = false;
                                                        e.target.value = returnDetails.quantity;
                                                    }, 500);
                                                }
                                            }}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            Please enter a valid quantity.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Return Date</Form.Label>
                                        <Form.Control
                                            type="date"
                                            placeholder="Return Date"
                                            min={returnDetails.issue_date ? moment(returnDetails.issue_date).format('YYYY-MM-DD') : ''}
                                            max={moment().format('YYYY-MM-DD')}
                                            name="return_date"
                                            value={returnDetails.return_date || ''}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            Please select a valid return date.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Issue Date</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Issue Date"
                                            name="issue_date"
                                            value={returnDetails.issue_date ? moment(returnDetails.issue_date).format('DD-MM-YYYY') : ''}
                                            readOnly
                                            disabled
                                            className="bg-light"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Container>
                    </Modal.Body>
                    <Modal.Footer className="bg-light">
                        <Button variant="secondary" onClick={handleClose}>
                            Close
                        </Button>
                        <Button variant="primary" type="submit" style={{ backgroundColor: primaryColor, border: "none" }}>
                            Save Return
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Main>
    );
}