import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import stockManagementApis from '../apis/StockManagementApis';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Breadcrumb, Button, Card, CardBody, CardHeader, Col, Container, Form, FormControl, Modal, Row } from 'react-bootstrap';
import Main from '../layout/Main';
import { AuthContext } from '../context/AuthProvider';
import { toast, ToastContainer } from 'react-toastify';

export default function VendorDetailPage() {
    const { id } = useParams();
    const [isUpdate, setIsUpdate] = useState(false);
    const { permissions } = useContext(AuthContext);
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState({});
    const [branches, setBranches] = useState([]); 
    const [gstValidation, setGstValidation] = useState(null); 
    const [phoneValidation, setPhoneValidation] = useState(null);

    const handleVendorData = async (id) => {
        try {
            const result = await stockManagementApis.getVendorById(id);
            // console.log('Vendor fetched:', result);
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
        //   console.log('Branches fetched:', result);
        } catch (error) {
          console.error('Error fetching branches:', error);
          setBranches([]);
        }
    };
    
    useEffect(() => {
        handleGetBranches();
    }, []);

    const hasUpdatePermission = permissions?.some(role => role.name === 'Admin' || role.name === 'Super Admin');
    // console.log('hasUpdatePermission:', hasUpdatePermission);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!vendor) {
        return <div>No vendor data found.</div>;
    }

    const handleClose = () => {
        setShow(false);
    };

    const handleShow = (vendor = null) => {
        setIsUpdate(vendor !== null);
        setShow(true);
        if (vendor) {
            setSelectedVendor(vendor);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        } else {
            try {
                if (isUpdate) {
                    await stockManagementApis.updateVendor(selectedVendor.id, selectedVendor);
                    toast.success('Vendor updated successfully!');
                } else {
                    await stockManagementApis.addVendor(selectedVendor);
                    toast.success('Vendor added successfully!');
                }
                handleClose();
                handleVendorData(id); 
            } catch (error) {
                console.error('Error saving vendor:', error);
                toast.error('Error saving vendor.');
            }
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        const newMobile = event.target.value;
        const isValidLengthGST = value.length === 15;
        const hasMixedChars = /[a-zA-Z0-9]/.test(value);
        const isValidFormat = isValidLengthGST && hasMixedChars; 
        setGstValidation(isValidFormat ? null : 'Please enter a valid 15-digit GST number.');

        const isValidLength = newMobile.length === 10;
        const isNumeric = /^\d+$/.test(newMobile); 
        setPhoneValidation(isValidLength && isNumeric ? null : 'Invalid mobile number');

        setSelectedVendor((prevVendor) => ({
            ...prevVendor,
            [name]: value,
        }));
    };

    return (
        <Main>
            <div className="my-2 mt-4" style={{  position: "relative", left: "10px" }}>
                <Breadcrumb>
                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
                    Home
                    </Breadcrumb.Item> 
                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/vendor" }}>
                    Vendor
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
                    {"Vendor Details"}
                    </Breadcrumb.Item>
                </Breadcrumb>
            </div>
            <Card style={{ boxShadow: "0 0 5px #a3a3a3" }}>
                <CardHeader style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }}>
                    <span style={{ fontSize: '18px' }}>
                        Vendor Details
                    </span>
                    <Link to={`/vendor`}>
                        <Button className="float-end bg-danger border-0 btn-sm mx-2" style={{ padding: '2px 8px' }}>
                            <i className='fa fa-close'></i>
                        </Button>
                    </Link>
                    {hasUpdatePermission && (
                        <Button className="float-end btn-sm" style={{ padding: '2px 8px' }} onClick={() => handleShow(vendor)}>
                            <i className='fa-regular fa-edit'></i>
                        </Button>
                    )}
                </CardHeader>
                <CardBody>
                    <Container fluid style={{ fontSize: '16px' }}>
                        <Row>
                            <Col sm={6} md={6} lg={12} xl={6}>
                                <div style={{ fontWeight: "bold" }}>Name</div>
                                <div>{vendor.name}</div>
                                <div className='mt-3' style={{ fontWeight: "bold" }}>Branch</div>
                                <div>{vendor.branch_name}</div>
                                <div className='mt-3' style={{ fontWeight: "bold" }}>State</div>
                                <div>{vendor.state}</div>
                                <div className='mt-3' style={{ fontWeight: "bold" }}>City</div>
                                <div>{vendor.city}</div>
                            </Col>
                            <Col sm={6} md={6} lg={12} xl={6}>
                                <div style={{ fontWeight: "bold" }}>Address</div>
                                <div>{vendor.address}</div>
                                <div className='mt-3' style={{ fontWeight: "bold" }}>Number</div>
                                <div>{vendor.mobile}</div>
                                <div className='mt-3' style={{ fontWeight: "bold" }}>GST No.</div>
                                <div>{vendor.gst_no}</div>
                                <div className='mt-3' style={{ fontWeight: "bold" }}>Status</div>
                                <div>{vendor.status ? 'Active' : 'Inactive'}</div>
                            </Col>
                        </Row>
                    </Container>
                </CardBody>
            </Card>

            <Modal show={show} onHide={handleClose} backdrop="static" size="lg">
                <Form noValidate onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{isUpdate ? 'Update Vendor' : 'Add Vendor'}</Modal.Title>
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
                                    <Form.Group className="mb-3">
                                        <Form.Label>GST No</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="GST No"
                                            name="gst_no"
                                            value={selectedVendor.gst_no || ''}
                                            onChange={handleInputChange}
                                            isInvalid={gstValidation !== null}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {gstValidation}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className='mb-3'>
                                        <Form.Label>Branch</Form.Label>
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
                                    <Form.Group className="mb-3">
                                        <Form.Label>Mobile</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="Enter phone number"
                                            name="mobile"
                                            min={0}
                                            value={selectedVendor.mobile || ''}
                                            onChange={handleInputChange}
                                            isInvalid={phoneValidation !== null}
                                            required
                                        />
                                        <FormControl.Feedback type="invalid">{phoneValidation}</FormControl.Feedback>
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
                                    <Form.Group className="mb-3">
                                        <Form.Label>City</Form.Label>
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
                                    <Form.Group className="mb-3">
                                        <Form.Label>Address</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            placeholder="Address"
                                            name="address"
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
                                    <Form.Group className="mb-3">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Select                                            
                                            name="status"
                                            value={selectedVendor.status}
                                            onChange={handleInputChange}
                                        >
                                        <option value="">Select Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">inactive</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Close
                        </Button>
                        <Button type="submit" variant="primary">
                            {isUpdate ? 'Save Changes': 'Add'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            <ToastContainer />
        </Main>
    );
}
