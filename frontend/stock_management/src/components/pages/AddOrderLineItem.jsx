import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useForm } from 'react-hook-form';
import stockManagementApis from '../apis/StockManagementApis';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import Main from '../layout/Main';

export default function AddOrderLineItem() {
    const { id } = useParams();
    const [product, setProduct] = useState([]);
    const [order, setOrder] = useState([]);
    const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm({
        defaultValues: {
            line_item_id: "",
            order_id: "",
            product_id: "",
            price: "",
            city: "",
            is_active: false,
        }
    });

    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchOrderLineItemData = async () => {
            if (id) {
                try {
                    const response = await stockManagementApis.getOrderLineItem(id);
                    for (const [key, value] of Object.entries(response)) {
                        setValue(key, value);
                    }
                } catch (error) {
                    console.error('Error fetching Order line item data:', error);
                }
            }
        };
        fetchOrderLineItemData();
    }, [id, setValue]);

    const onSubmit = async (data) => {
        try {
            if (id) {
                await stockManagementApis.updateOrder(id, data);
                setMessage('Order updated successfully');
            } else {
                await stockManagementApis.postOrder(data);
                setMessage('Order added successfully');
            }
            reset(); // Reset form after submission
        } catch (error) {
            console.error('Error submitting data:', error);
            setMessage('Error submitting data');
        }
    };

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const orderData = await stockManagementApis.getOrder();
                setOrder(orderData);
            } catch (error) {
                console.error('Error fetching order Data:', error);
            }
        };
        fetchOrderData();
    }, []);

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                const productData = await stockManagementApis.getProduct();
                setProduct(productData);
            } catch (error) {
                console.error('Error fetching product Data:', error);
            }
        };
        fetchProductData();
    }, []);

    return (
        <Main>
            <Container fluid>
                <Row className="justify-content-center mt-4 mb-5">
                    <Col md={12}>
                        <h2 className="text-center mb-4 bg-light text-dark">{id ? 'Edit Order Line Item' : 'Add Order Line Item'}</h2>
                        {message && <Alert variant={message.includes('successfully') ? 'success' : 'danger'}>{message}</Alert>}
                        <Form onSubmit={handleSubmit(onSubmit)}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Order ID</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="order_id"
                                            {...register('order_id', {
                                                required: 'Order ID is required'
                                            })}
                                        >
                                            <option value="">Select order</option>
                                            {order.map((odr) => (
                                                <option key={odr.order_id} value={odr.order_id}>
                                                    {odr.name}
                                                </option>
                                            ))}
                                        </Form.Control>
                                        {errors.order_id && <span className="text-danger">{errors.order_id.message}</span>}
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Product ID</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="product_id"
                                            {...register('product_id', {
                                                required: 'Product ID is required'
                                            })}
                                        >
                                            <option value="">Select product</option>
                                            {product.map((prd) => (
                                                <option key={prd.product_id} value={prd.product_id}>
                                                    {prd.name}
                                                </option>
                                            ))}
                                        </Form.Control>
                                        {errors.product_id && <span className="text-danger">{errors.product_id.message}</span>}
                                    </Form.Group>
                                </Col>
                                <Col lg={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Price </Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="price"
                                            placeholder="Enter Price"
                                            {...register('price', {
                                                required: 'Price is required',
                                                min: { value: 0, message: 'Price must be at least 0' }
                                            })}
                                        />
                                        {errors.price && <span className="text-danger">{errors.price.message}</span>}
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>City</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="city"
                                            placeholder="Enter City"
                                            {...register('city', {
                                                required: 'City is required',
                                                minLength: { value: 2, message: 'City must be at least 2 characters long' }
                                            })}
                                        />
                                        {errors.city && <span className="text-danger">{errors.city.message}</span>}
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Active Status</Form.Label>
                                        <Form.Check
                                            type="checkbox"
                                            name="is_active"
                                            {...register('is_active')}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Button variant="primary" type="submit" className="w-100">Submit</Button>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </Main>
    );
}
