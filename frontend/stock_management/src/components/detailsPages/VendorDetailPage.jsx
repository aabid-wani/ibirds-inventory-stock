import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import stockManagementApis from '../apis/StockManagementApis';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Card, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import Main from '../layout/Main';
import { AuthContext } from '../context/AuthProvider';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

export default function VendorDetailPage() {
    const { id } = useParams();
    const { permissions, loginData } = useContext(AuthContext);
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState({});
    const [branches, setBranches] = useState([]); 
    const [gstValidation, setGstValidation] = useState(null); 
    const [phoneValidation, setPhoneValidation] = useState(null);
    const [validated, setValidated] = useState(false);

    const primaryColor = "#5650ce";

    const handleVendorData = async (id) => {
        try {
            const result = await stockManagementApis.getVendorById(id);
            if (result && result.length > 0) {
                setVendor(result[0]);
                setSelectedVendor(result[0]);
            } else {
                console.error('Vendor data not found');
            }
        } catch (error) {
            console.error('Failed to fetch vendor:', error);
        } finally {
            setLoading(false); 
        }
    };

    useEffect(() => {
        if (id) {
            handleVendorData(id);
        } else {
            console.error('Vendor ID not provided');
            setLoading(false); 
        }
    }, [id]);

    const handleGetBranches = async () => {
        try {
            const result = await stockManagementApis.getBranch();
            setBranches(result);
        } catch (error) {
            console.error('Error fetching branches:', error);
            setBranches([]);
        }
    };
    
    useEffect(() => {
        handleGetBranches();
    }, []);

    const hasUpdatePermission = permissions?.some(role => role.name === 'Admin' || role.name === 'Super Admin');

    if (loading) {
        return (
            <Main>
                <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Main>
        );
    }

    if (!vendor) {
        return (
            <Main>
                <Container className="mt-5 text-center">
                    <h5>No vendor data found.</h5>
                    <Link to="/vendor">
                        <Button variant="outline-primary" className="mt-3">Back to Vendors</Button>
                    </Link>
                </Container>
            </Main>
        );
    }

    const handleClose = () => {
        setShow(false);
        setValidated(false);
        setSelectedVendor(vendor); // Reset to original data
        setGstValidation(null);
        setPhoneValidation(null);
    };

    const handleShow = () => {
        setShow(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        
        if (form.checkValidity() === false || gstValidation !== null || phoneValidation !== null) {
            event.stopPropagation();
        } else {
            try {
                const payload = { ...selectedVendor, updated_by: loginData?.id };
                await stockManagementApis.updateVendor(selectedVendor.id, payload);
                toast.success('Vendor updated successfully!');
                handleClose();
                handleVendorData(id); 
            } catch (error) {
                console.error('Error saving vendor:', error);
                toast.error('Error saving vendor.');
            }
        }
        setValidated(true);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        
        if (name === 'gst_no') {
            const isValidLengthGST = value.length === 15;
            const hasMixedChars = /[a-zA-Z0-9]/.test(value);
            const isValidFormat = isValidLengthGST && hasMixedChars; 
            setGstValidation(isValidFormat || value === '' ? null : 'Please enter a valid 15-digit GST number.');
        }

        if (name === 'mobile') {
            const isValidLength = value.length === 10;
            const isNumeric = /^\d+$/.test(value); 
            setPhoneValidation(isValidLength && isNumeric || value === '' ? null : 'Invalid mobile number');
        }

        setSelectedVendor((prevVendor) => ({
            ...prevVendor,
            [name]: value,
        }));
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
                <Link to="/vendor" className="text-decoration-none" style={{ color: primaryColor }}>Vendors</Link>
                <span className="text-muted mx-2">/</span>
                <span className="text-muted">Vendor Details</span>
            </div>

            <Container fluid className="px-3">
                {/* ─── Vendor Profile Card ─── */}
                <Card className="border-0 shadow-sm p-4 mb-4" style={{ borderRadius: "12px" }}>
                    
                    {/* Header Section */}
                    <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                        <div>
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <h4 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                                    {vendor.name || "..."}
                                </h4>
                                <span className={`badge rounded-pill px-3 py-2 ${vendor.status === 'active' || vendor.status === true ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`} style={{ fontSize: "12px" }}>
                                    {vendor.status === 'active' || vendor.status === true ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <span className="text-muted" style={{ fontSize: "14px" }}>
                                <i className="fa-regular fa-building me-2"></i>
                                GST: <span className="fw-medium text-dark">{vendor.gst_no || "N/A"}</span>
                            </span>
                        </div>
                        
                        <div className="d-flex gap-3">
                            {hasUpdatePermission && (
                                <Button
                                    variant="outline-primary"
                                    className="d-flex align-items-center"
                                    onClick={handleShow}
                                    style={{ borderColor: primaryColor, color: primaryColor, borderRadius: "6px" }}
                                >
                                    <i className="fa-regular fa-edit me-2" aria-hidden="true"></i> Edit
                                </Button>
                            )}
                            <Link to={`/vendor`}>
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
                        {/* Business Info Column */}
                        <Col md={6}>
                            <Card className="border-0 h-100" style={{ backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
                                <Card.Body className="p-4">
                                    <h6 className="text-uppercase text-muted mb-4 fw-bold" style={{ fontSize: "13px", letterSpacing: "1px" }}>
                                        <i className="fa-solid fa-briefcase me-2"></i>Business Information
                                    </h6>
                                    <DetailItem label="Vendor Name" value={vendor.name} highlight={true} />
                                    <DetailItem label="Assigned Branch" value={vendor.branch_name} />
                                    <DetailItem label="GST Number" value={vendor.gst_no} />
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Location & Contact Column */}
                        <Col md={6}>
                            <Card className="border-0 h-100" style={{ backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
                                <Card.Body className="p-4">
                                    <h6 className="text-uppercase text-muted mb-4 fw-bold" style={{ fontSize: "13px", letterSpacing: "1px" }}>
                                        <i className="fa-solid fa-map-location-dot me-2"></i>Location & Contact
                                    </h6>
                                    <DetailItem label="Contact Number" value={vendor.mobile} />
                                    
                                    <Row>
                                        <Col xs={6}>
                                            <DetailItem label="City" value={vendor.city} />
                                        </Col>
                                        <Col xs={6}>
                                            <DetailItem label="State" value={vendor.state} />
                                        </Col>
                                    </Row>

                                    <div className="mb-0">
                                        <small className="text-muted d-block text-uppercase fw-semibold mb-1" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                                            Full Address
                                        </small>
                                        <div className="fs-6 text-dark bg-white p-3 rounded border border-light">
                                            {vendor.address || "-"}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card>

                {/* ─── Edit Modal ─── */}
                <Modal show={show} onHide={handleClose} backdrop="static" size="lg">
                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                        <Modal.Header closeButton>
                            <Modal.Title>Update Vendor Details</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="p-4">
                            <Container>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Vendor Name"
                                                name="name"
                                                value={selectedVendor.name || ''}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Please enter a name.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="text-muted" style={{ fontSize: "13px" }}>GST No</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="GST Number"
                                                name="gst_no"
                                                value={selectedVendor.gst_no || ''}
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
                                        <Form.Group className="mb-4">
                                            <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Branch</Form.Label>
                                            <Form.Select
                                                name="branch_id"
                                                value={selectedVendor.branch_id || ''}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Branch</option>
                                                {branches.map((branch) => (
                                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                                ))}
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">
                                                Please select a branch.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Mobile</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Contact Number"
                                                name="mobile"
                                                min={0}
                                                value={selectedVendor.mobile || ''}
                                                onChange={handleInputChange}
                                                isInvalid={phoneValidation !== null}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {phoneValidation || "Please enter a valid mobile number."}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="text-muted" style={{ fontSize: "13px" }}>State</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="State"
                                                name="state"
                                                value={selectedVendor.state || ''}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Please enter a state.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="text-muted" style={{ fontSize: "13px" }}>City</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="City"
                                                name="city"
                                                value={selectedVendor.city || ''}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Please enter a city.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Address</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                placeholder="Full Address"
                                                name="address"
                                                rows={2}
                                                value={selectedVendor.address || ''}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Please enter an address.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Status</Form.Label>
                                            <Form.Select
                                                name="status"
                                                value={selectedVendor.status || 'active'}
                                                onChange={handleInputChange}
                                                required
                                            >
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
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" style={{ backgroundColor: primaryColor, border: 'none' }}>
                                Save Changes
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

            </Container>
        </Main>
    );
}