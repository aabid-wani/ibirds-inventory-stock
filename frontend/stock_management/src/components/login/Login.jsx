import React, { useState, useContext } from 'react';
import { Alert, Button, Card, Form, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import stockManagementApis from '../apis/StockManagementApis';
import { AuthContext } from '../context/AuthProvider';
// import loginImg from '../images/login.jpg';
// import logo from '../../../public/images/stock.png'
// import loginImg from '../../../public/logo192.png';
import '../../App.css';

const Login = () => {
  const { setToken, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loginMessage, setLoginMessage] = useState('');
  const [show, setShow] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const formErrors = {};
    if (!credentials.email) {
      formErrors.email = 'Email is required';
    } else if (!validateEmail(credentials.email)) {
      formErrors.email = 'Email is not valid';
    }

    if (!credentials.password) {
      formErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      formErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const getLogin = async (email, password) => {

    try {
      console.log('Attempting login with:', { email, password });
      const response = await stockManagementApis.getUserLogin(email, password);
      console.log('Login response:', response);
      
      return response;
    } catch (error) {
      console.error('Login API error:', error);
      setShow(true);
      setErrors({ message: 'Failed to login. Please try again later.' });
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const response = await getLogin(credentials.email, credentials.password);
    
    if (response?.success) {
      const accessToken = response.token;
      setToken(accessToken);
      login(response.token);
      console.log('Login successful, token set.');
      navigate('/home');
    } else {
      setLoginMessage(response?.message || 'Invalid credentials.');
      setShow(true);
      setToken(null);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Card
        className="shadow-lg"
        style={{
          maxWidth: "60vw",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div className="row g-0 p-3">
          <div className="col-lg-6 d-none d-lg-block">
            <Image
              src="/images/login.jpg"
              alt="login visual"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              fluid
            />
          </div>

          {/* Right Side Form */}
          <div className="col-lg-6 col-12">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <Image
                  src="/images/ibirds_logo.png"
                  alt="logo"
                  style={{ width: "80px", borderRadius: "10%" }}
                />
              </div>
              {/* <h4 className="text-center mb-4 fw-bold"></h4> */}

              <Form onSubmit={handleSubmit}>
                {show && (
                  <Alert variant="danger" className="mb-3">
                    {errors.message || loginMessage}
                  </Alert>
                )}

                {/* Email */}
                <Form.Group className="mb-3">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={credentials.email}
                    placeholder="Enter email"
                    onChange={handleChange}
                    style={{ boxShadow: "none" }}
                  />
                  {errors.email && (
                    <small className="text-danger">{errors.email}</small>
                  )}
                </Form.Group>

                {/* Password */}
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={credentials.password}
                      placeholder="Enter password"
                      onChange={handleChange}
                      style={{ boxShadow: "none" }}
                    />
                    <span
                      className="position-absolute end-0 top-50 translate-middle-y me-3"
                      onClick={togglePasswordVisibility}
                      style={{ cursor: "pointer" }}
                    >
                      <i
                        className={`fa ${
                          showPassword ? "fa-eye" : "fa-eye-slash"
                        } text-secondary`}
                      />
                    </span>
                  </div>
                  {errors.password && (
                    <small className="text-danger">{errors.password}</small>
                  )}
                </Form.Group>

                {/* Submit */}
                <Button type="submit" className="w-100 mt-3" variant="primary">
                  Login
                </Button>
              </Form>
            </Card.Body>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
