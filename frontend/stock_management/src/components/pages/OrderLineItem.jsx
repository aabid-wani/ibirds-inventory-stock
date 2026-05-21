import React, { useEffect, useState } from 'react';
import stockManagementApis from '../apis/StockManagementApis';
import { Container, Row, Col } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { Typography, Button as MUIButton, TextField } from '@mui/material';
import Main from '../layout/Main';

export default function OrderLineItem() {
  const [orderLineItem, setOrderLineItem] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getOrderLineItem();
      setOrderLineItem(result);
      setFilteredCategories(result);
      // console.log('order line item fetched:', result);
    } catch (error) {
      console.error('Error fetching order line item:', error);
      setOrderLineItem([]);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  useEffect(() => {
    const filteredData = orderLineItem.filter(item =>
      item.line_item_id.toLowerCase().includes(filterText.toLowerCase()) ||
      item.order_id.toLowerCase().includes(filterText.toLowerCase()) ||
      item.product_id.toLowerCase().includes(filterText.toLowerCase()) ||
      item.price.toLowerCase().includes(filterText.toLowerCase()) ||
      item.city.toLowerCase().includes(filterText.toLowerCase()) ||
      item.order_date.toLowerCase().includes(filterText.toLowerCase()) ||
      (item.is_active ? 'active' : 'inactive').includes(filterText.toLowerCase())
    );
    setFilteredCategories(filteredData);
  }, [filterText, orderLineItem]);

  const deleteHandle = (line_item_id) => {
    // console.log('Delete handle', line_item_id);
    setOrderLineItem((prevOrderlineItem) => prevOrderlineItem.filter((ord) => ord.line_item_id !== line_item_id));
  };

  const columns = [
    { name: '#', selector: (row, index) => index + 1, sortable: true, center: true },
    { name: 'order_id', selector: row => row.order_id, sortable: true, center: true },
    { name: 'product_id', selector: row => row.product_id, sortable: true, center: true },
    { name: 'price', selector: row => row.price, sortable: true, center: true },
    { name: 'city', selector: row => row.city, sortable: true, center: true },
    { name: 'is_active', selector: row => row.is_active ? 'Active' : 'Inactive', sortable: true, center: true },
    {
      name: 'Update',
      cell: row => (
        <NavLink to={`/orderlineItem/update/${row.line_item_id}`}>
          <MUIButton variant="contained" color="warning">Update</MUIButton>
        </NavLink>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      center: true,
    },
    {
      name: 'Delete',
      cell: row => (
        <MUIButton
          variant="contained"
          color="error"
          onClick={() => deleteHandle(row.line_item_id)}
        >
          Delete
        </MUIButton>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      center: true,
    }
  ];

  return (
    <Main>
      <Container fluid>
        <Row className="justify-content-center">
          <Col xs={12}>
            <Typography variant="h4" align="center" color="primary" gutterBottom>
              All Order Data
            </Typography>
            <DataTable
              columns={columns}
              data={filteredCategories}
              pagination
              highlightOnHover
              striped
              responsive
              subHeader
              subHeaderComponent={
                <TextField
                  id="search"
                  type="text"
                  placeholder="Search..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  style={{ marginBottom: '20px', float: 'right', height: '20px' }}
                />
              }
            />
          </Col>
        </Row>
      </Container>
    </Main>
  );
}
