import React, { useEffect, useState } from 'react';
import stockManagementApis from '../apis/StockManagementApis';
import { Container, Row, Col, Card, Breadcrumb, Button, ToastContainer, Modal, Form } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import Main from '../layout/Main';

import {
    TextField,
    InputAdornment
} from '@mui/material';
import '../Sidebar.css';
import '../../App.css';
import { Link } from 'react-router-dom';

export default function CreatePermission() {
    const [permission, setPermission] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [role,setRole] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);

    const handleGetData = async () => {
        try {
            const result = await stockManagementApis.getPermission();
            setPermission(result);
            // console.log('Permission fetched:', result);
        } catch (error) {
            console.error('Error fetching Permission:', error);
            setPermission([]);
        }
    };

    useEffect(() => {
        handleGetData();
    }, []);

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleModalShow = (check) => {
        setShowModal(check);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPermission({ ...permission, [name]: value });
    };

    useEffect(() => {
        const fetchRoles = async () => {
          try {
            const rolesData = await stockManagementApis.getRoles();
            setRole(rolesData);
          } catch (error) {
            console.error('Error fetching roles:', error);
          }
        };
        fetchRoles();
      }, []);

    useEffect(() => {
        const filteredData = permission.filter(item =>
            item.id.toLowerCase().includes(filterText.toLowerCase()) ||
            item.role_name.toLowerCase().includes(filterText.toLowerCase()) ||
            item.module_name.toLowerCase().includes(filterText.toLowerCase()) ||
            item.status.toLowerCase().includes(filterText.toLowerCase())
        );
        setFilteredCategories(filteredData);
    }, [filterText, permission]);

    const columns = [
        { name: <b>S.No.</b>, selector: (row, index) => index + 1, sortable: true, center: true, className: 'data-table-cell elementStyle' },
        { name: <b>Module</b>, selector: row => row.module_name, sortable: true, center: true, className: 'data-table-cell' },
        { name: <b>Roles</b>, selector: row => row.role_name, sortable: true, center: true, className: 'data-table-cell' },
        { name: <b>Status</b>, selector: row => row.status, sortable: true, center: true, className: 'data-table-cell' },
        { name: <b>Add</b>, selector: row => <input type="checkbox" checked={row.add} readOnly />, sortable: true, center: true, className: 'data-table-cell' },
        { name: <b>Edit</b>, selector: row => <input type="checkbox" checked={row.edit} readOnly />, sortable: true, center: true, className: 'data-table-cell' },
        { name: <b>Delete</b>, selector: row => <input type="checkbox" checked={row.delete} readOnly />, sortable: true, center: true, className: 'data-table-cell' },
        { name: <b>View</b>, selector: row => <input type="checkbox" checked={row.view} readOnly />, sortable: true, center: true, className: 'data-table-cell' }
    ];

    const customStyles = {
        table: {
            style: {
                // textAlign: 'center'
            }
        },
        headCells: {
            style: {
                backgroundColor: '#343a40',
                color: 'white',
            },
        },
        headRow: {
            style: {
                minHeight: '30px',
            },
        },
        rows: {
            style: {
                minHeight: '34px'
            },
        }
    };

    return (
        <Main>
            <div>
                <Breadcrumb>
                    <Link style={{ textDecoration: "none", color: "black" }} to="/Home"> Home <i className="fa fa-angle-right"></i></Link>
                    <Breadcrumb.Item active style={{ fontWeight: "bold" }}>&nbsp;Permission List</Breadcrumb.Item>
                </Breadcrumb>
            </div>
            <Card style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 0, 0, 0.1)'}}>
                <Container fluid className='p-3'>
                    <p style={{ fontSize: "16px", fontWeight: 'bold' }}>Permissions List</p>
                    <hr />
                    <Row>
                        <Col lg={12} md={6} sm={3}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <TextField
                                    id="search"
                                    type="text"
                                    placeholder="Search..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <i className="fa fa-search" style={{ fontSize: '14px' }}></i>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <div className='d-flex'>
                                    <Button className='btn-sm' onClick={() => handleModalShow(true)}>
                                        New
                                    </Button>
                                    <Button className='btn-sm mx-2'>
                                        <Link to='/createPermission' style={{ textDecoration: "none", color: "white" }}>Goto permission</Link>
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <DataTable
                                columns={columns}
                                data={filteredCategories}
                                pagination
                                highlightOnHover
                                striped
                                customStyles={customStyles}
                            />
                        </Col>
                    </Row>
                </Container>
            </Card>

            <Modal show={showModal} style={{ fontFamily: "system-ui", fontSize: "16px" }} aria-labelledby="contained-modal-title-vcenter" centered onHide={handleModalClose}>
                <Modal.Header style={{ fontSize: "16px" }} closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        Add permission
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Container>
                            <Row>
                                <Col lg={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Role</Form.Label>
                                        <Form.Control
                                            as="select"
                                            // {...register ('role_id', { required: 'Role is required' })}
                                        >
                                            <option value="">Select a role</option>
                                            {role.map((role) => (
                                                <option key={role.role_id} value={role.role_id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </Form.Control>
                                        {/* {errors.role_id && <span className="text-danger">{errors.role_id.message}</span>} */}
                                    </Form.Group>
                                </Col>
                                <Col>
                                <Form.Group className="mb-3">
                                        <Form.Label>Module</Form.Label>
                                        <Form.Control
                                            as="select"
                                            // {...register ('role_id', { required: 'Role is required' })}
                                        >
                                            <option value="">Select a Module</option>
                                            {role.map((role) => (
                                                <option key={role.role_id} value={role.role_id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </Form.Control>
                                        {/* {errors.role_id && <span className="text-danger">{errors.role_id.message}</span>} */}
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group>
                                        <Form.Label>Status</Form.Label>
                                        <Form.Select
                                            name="status"
                                            value={permission.status}
                                            onChange={handleInputChange}
                                        >
                                            <option value="Select">Select</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </Form.Select>
                                    </Form.Group>

                                </Col>
                            </Row>
                        </Container>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleModalClose} variant="light">
                        Close
                    </Button>
                </Modal.Footer>
                <ToastContainer />
            </Modal>
        </Main>
    );
}

