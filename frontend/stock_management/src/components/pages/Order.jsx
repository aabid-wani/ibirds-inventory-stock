import React, { useContext, useEffect, useState } from 'react';
import stockManagementApis from '../apis/StockManagementApis';
import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { TextField, InputAdornment } from '@mui/material';
import Main from '../layout/Main';
import { AuthContext } from '../context/AuthProvider';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import moment from 'moment';

export default function Order() {
  const [order, setOrder] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [filterMonth, setFilterMonth] = useState(moment().format("YYYY-MM")); 
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [branches, setBranches] = useState([]);
  const [user, setUser] = useState([]);
  const [vendor, setVendor] = useState([]);
  const { permissions, loginData } = useContext(AuthContext);
  
  const navigate = useNavigate();
  const primaryColor = "#5650ce";

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const vendorData = await stockManagementApis.getVendor();     
        const userData = await stockManagementApis.getAllUsers();
        const branchData = await stockManagementApis.getBranch();
        setBranches(branchData);
        setUser(userData);
        setVendor(vendorData);
      } catch (error) {
        console.error('Error fetching Vendor:', error);
        setVendor([]);
        setUser([]);
        setBranches([]);
      }
    };
    fetchVendorData();
  }, []);

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getOrder();
      setOrder(result);
      setFilteredOrders(result);
    } catch (error) {
      console.error('Error fetching order:', error);
      setOrder([]);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "";
      return moment(dateString).format("DD/MM/YYYY");
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const filteredData = order.filter((item) => {
      const search = filterText.toLowerCase();
      const orderDate = formatDate(item.order_date || '');
      const matchesSearch =
        String(item.order_number || "").toLowerCase().includes(search) ||
        String(item.user_name || "").toLowerCase().includes(search) ||
        String(item.branch_name || "").toLowerCase().includes(search) ||
        String(item.vendor_name || "").toLowerCase().includes(search) ||
        String(item.total_amount || "").toLowerCase().includes(search) ||
        orderDate.toLowerCase().includes(search) ||
        String(item.status || "").toLowerCase().includes(search);
      const matchesMonth = filterMonth
        ? moment(item.order_date).format("YYYY-MM") === filterMonth
        : true;
      return matchesSearch && matchesMonth;
    });
    setFilteredOrders(filteredData);
  }, [filterText, filterMonth, order]);
  
  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...selectedOrder, updated_by: loginData?.id };
      let resp = await stockManagementApis.updateOrder(selectedOrder.id, payload);
      
      if(resp?.success){
        toast.success('Order updated successfully!');
      } else {
        toast.error('Order not updated successfully!');
      }
      handleGetData();
      setShowModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('An error occurred during update');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedOrder({ ...selectedOrder, [name]: value });
  };

  const columns = [
    {
      name: "S.No.",
      selector: (row, index) => index + 1,
      sortable: true,
      width: '80px',
    },
    {
      name: "Order Number", 
      selector: row => row.id, 
      sortable: true,
      cell: (row) => (
        <NavLink
          style={{ textDecoration: 'none', color: primaryColor, fontWeight: '500' }}
          to={`/orderDetailPage/${row.id}`}
        >
          {`Or- ${row.order_number}`}
        </NavLink>
      )
    },
    { name: "User", selector: row => row.user_name, sortable: true },
    { name: "Branch", selector: row => row.branch_name, sortable: true },
    { name: "Vendor", selector: row => row.vendor_name, sortable: true },
    { name: "Total Amount", selector: row => row.total_amount, sortable: true },
    { name: "Order Date", selector: row => moment(row.order_date).format("DD-MM-YYYY"), sortable: true },
    { 
      name: "Status", 
      selector: row => row.status === 'active' ? 'active' : 'inactive', 
      sortable: true 
    },
    {
      name: "Actions",
      cell: row => {
        const hasEditPermission = permissions?.some(role => role.name === 'Admin' || role.name === 'Super Admin' || (role.name !== 'Data Entry' && role.edit));

        return (
          <div className="d-flex gap-2">
            {hasEditPermission && (
              <Button 
                variant="outline-primary"
                className="btn-sm d-flex align-items-center justify-content-center" 
                onClick={() => handleEditClick(row)}
                style={{ width: "32px", height: "32px", borderColor: "#a3a6dd", color: primaryColor }}
              >
                <i className='fa-regular fa-edit' aria-hidden="true"></i>
              </Button>
            )}
          </div>
        );
      },
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "100px"
    },
  ];

  const customStyles = {
    table: {
      style: { textAlign: 'left' }
    },
    headRow: {
      style: {
        backgroundColor: "#212529",
        color: "#ffffff",
        minHeight: "45px",
        fontWeight: "600",
        fontSize: "14px",
      }
    },
    rows: {
      style: {
        minHeight: "50px",
        fontSize: "14px",
        color: "#495057",
      }
    },
  };

  const hasAddPermission = permissions?.some(role => role.name === 'Admin' || role.name === 'Super Admin');

  return (
    <Main>
      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Purchases</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm" style={{ borderRadius: '8px' }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Order List</h5>
              <small className="text-muted">{filteredOrders.length} records</small>
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

              <Form.Control
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{ width: "auto", backgroundColor: "#fcfcfc" }}
              />

              {hasAddPermission && (
                <Button 
                  className="px-3 border-0 d-flex align-items-center gap-2" 
                  onClick={() => navigate('/AddOrder')}
                  style={{ backgroundColor: primaryColor }}
                >
                  <i className='fa fa-plus' aria-hidden='true'></i> Add Order
                </Button>
              )}
            </div>
          </div>

          {/* Data Table Section */}
          <div className="p-0">
            <DataTable
              columns={columns}
              data={filteredOrders}
              pagination
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={<div className="p-4 text-muted">No Records Found</div>}
            />
          </div>
        </Card>
      </Container>

      {/* Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Update Order</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          {selectedOrder && (
            <Form onSubmit={handleUpdateOrder}>
              <Container>
                <Row>
                  <Col lg={6}>
                    <Form.Group className="mb-3" controlId="userName">
                      <Form.Label>User</Form.Label>
                      <Form.Select name="user_id" value={selectedOrder.user_id} onChange={handleInputChange} required>
                        <option value="">Select User</option>
                        {user.map((usr) => (
                          <option key={usr.id} value={usr.id}>{usr.name}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        Please select a user.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group className="mb-3" controlId="orderNumber">
                      <Form.Label>Invoice Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="invoice_number"
                        value={selectedOrder.invoice_number || ''}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col lg={6}>
                    <Form.Group className='mb-3'>
                      <Form.Label>Branch</Form.Label>
                      <Form.Select name="branch_id" value={selectedOrder.branch_id} onChange={handleInputChange} required>
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

                  <Col lg={6}>
                    <Form.Group className="mb-3" controlId="orderNumberField">
                      <Form.Label>Order Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="order_number"
                        value={selectedOrder.order_number}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col lg={6}>
                    <Form.Group className="mb-3" controlId="vendorName">
                      <Form.Label>Vendor</Form.Label>
                      <Form.Select name="vendor_id" value={selectedOrder.vendor_id} onChange={handleInputChange} required>
                        <option value="">Select Vendor</option>
                        {vendor.map((vnd) => (
                          <option key={vnd.id} value={vnd.id}>{vnd.name}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        Please select a vendor.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col lg={6}>
                    <Form.Group className="mb-3" controlId="Date">
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="text"
                        name="Date"
                        value={moment(selectedOrder.order_date).format('DD-MM-YYYY')}
                        disabled
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col lg={6}>
                    <Form.Group className="mb-3" controlId="status">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={selectedOrder.status}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group className="mb-3" controlId="totalAmount">
                      <Form.Label>Total Amount</Form.Label>
                      <Form.Control
                        type="text"
                        name="total_amount"
                        value={selectedOrder.total_amount}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Container>
              <Modal.Footer className="px-0 pb-0 border-0 mt-3">
                <Button variant="secondary" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: primaryColor, border: 'none' }}>
                  Update
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      <ToastContainer />
    </Main>
  );
}