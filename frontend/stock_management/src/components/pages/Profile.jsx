import React, { useContext, useEffect, useState } from 'react';
import { Card, Col, Image, Row, Form, Button } from 'react-bootstrap';
import stockManagementApis from '../apis/StockManagementApis';
import { AuthContext } from '../context/AuthProvider';
import { Link } from 'react-router-dom';
import Main from '../layout/Main';

export default function Profile() {
    const userData = useContext(AuthContext);
    const [object, setObject] = useState({
        name: "",
        contact: "",
        email: "",
        role_id: "",
        user_name: "",
        password: "",
        user_status: false,
        branch_id: "",
        user_id: "",
        profile_image: "", 
    });

    const [preview, setPreview] = useState(""); // for image preview
    const [selectedFile, setSelectedFile] = useState(null); // for upload

    // Load user data on mount
    useEffect(() => {
        if (userData.loginData) {
            const user = userData.loginData;
            setObject({
                user_id: user.user_id || "",
                name: user.name || "",
                contact: user.contact || "",
                email: user.email || "",
                user_name: user.user_name || "",
                password: user.password || "",
                user_status: user.user_status || false,
                branch_id: user.branch_id || "",
                role_id: user.role_id || "",
                profile_image: user.profile_image || "",
            });
            if (user.profile_image) {
                setPreview(`${process.env.REACT_APP_IMAGE_BASE_URL || ""}${user.profile_image}`);
            }
        }
    }, [userData]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setObject({
            ...object,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file)); // preview selected image
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const formData = new FormData();
            Object.keys(object).forEach((key) => {
                formData.append(key, object[key]);
            });
            if (selectedFile) formData.append('profile_image', selectedFile);

            await stockManagementApis.putUser(object.user_id, formData);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error('Error submitting data:', error);
        }
    };

    return (
        <Main>
            <Card className="mx-auto my-4 shadow-lg rounded" style={{ maxWidth: '40rem' }}>
                <Card.Header
                    className="p-0"
                    style={{
                        background: "radial-gradient(circle at top left, #3b4b5c, #1c2833)",
                        height: '7rem',
                        position: 'relative',
                        borderRadius: '0.5rem 0.5rem 0 0',
                    }}
                >
                    <Image
                        src={preview || "/images/user.png"} roundedCircle
                        style={{
                            width: '110px',
                            height: '110px',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            border: '4px solid white',
                            objectFit: 'cover',
                        }}
                    />
                    <Link to="/Home">
                        <Button
                            variant="light"
                            style={{ position: 'absolute', top: '15px', right: '15px', borderRadius: '50%' }}
                        >
                            X
                        </Button>
                    </Link>
                </Card.Header>

                <Card.Body className="text-left mt-3">
                    <Card.Title style={{ textAlign: "center", fontWeight: 'bold' }}>
                        {object.name}
                    </Card.Title>
                    <Card.Text style={{ textAlign: "center" }}>{object.email}</Card.Text>
                    <Card.Text style={{ textAlign: "center" }}>User ID : {object.user_name}</Card.Text>

                    <Form onSubmit={handleSubmit} className="mt-4">
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group controlId="formName">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="name"
                                        placeholder="Enter Name"
                                        value={object.name}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="formEmail">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        required
                                        type="email"
                                        name="email"
                                        placeholder="Enter Email"
                                        value={object.email}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group controlId="formUserName">
                                    <Form.Label>User Name</Form.Label>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="user_name"
                                        placeholder="Enter User Name"
                                        value={object.user_name}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="formContact">
                                    <Form.Label>Contact</Form.Label>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="contact"
                                        placeholder="Enter Contact"
                                        value={object.contact}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group controlId="formFile">
                                    <Form.Label>Profile Image</Form.Label>
                                    <Form.Control
                                        type="file"
                                        name="profile_image"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="rounded"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="justify-content-end">
                            <Col xs="auto">
                                <Button type="submit" variant="primary" className="rounded">
                                    Save Changes
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </Main>
    );
}
