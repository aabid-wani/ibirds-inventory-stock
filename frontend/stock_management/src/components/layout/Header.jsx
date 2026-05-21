import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';
import { Card, Image } from 'react-bootstrap';

const Header = () => {
    const { loginData, setSidebarVisibility, logout, notifications, clearNotifications } = useContext(AuthContext);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef();

    const handleLogoutClick = () => {
        logout();
        navigate('/',{replace: true});
    };

    const handelSidebar = () => {
        setShowSidebar(!showSidebar);
        setSidebarVisibility(!showSidebar);
    };

    const toggleNotificationDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <style>
                {`
                    @keyframes shake {
                        0% { transform: rotate(0); }
                        25% { transform: rotate(10deg); }
                        50% { transform: rotate(-10deg); }
                        75% { transform: rotate(10deg); }   
                        100% { transform: rotate(0); }
                    }
                    .bell-shake {
                        animation: shake 0.5s;
                    }
                    .navbar-custom {
                        position: sticky;
                        top: 0;
                        z-index: 1050;
                        background: #fff;
                        box-shadow: 0 3px 8px rgba(0,0,0,0.08);
                        transition: all 0.3s ease-in-out;
                    }
                    .navbar-custom .btn:hover {
                        opacity: 0.9;
                        transform: scale(1.02);
                        transition: 0.2s;
                    }
                    .notification-dropdown {
                        width: 280px;
                        max-height: 300px;
                        overflow-y: auto;
                    }
                `}
            </style>

            <nav className="navbar navbar-expand-lg navbar-custom py-2 px-3">
                <div className="container-fluid d-flex justify-content-between align-items-center">
                    
                    {/* Left Section: Sidebar Toggle + User Info */}
                    <div className="d-flex align-items-center">
                        <button
                            onClick={handelSidebar}
                            className="btn btn-outline-secondary me-3 rounded-circle"
                            style={{ padding: '6px 10px' }}
                        >
                            <i className="fa-solid fa-bars"></i>
                        </button>

                        <NavLink to="/profile" className="d-flex align-items-center text-decoration-none">
                            <Image
                                src="/images/user.png"
                                roundedCircle
                                style={{ width: '36px', height: '36px', marginRight: '10px', border: "2px solid #ddd" }}
                            />
                            <Card style={{display: "flex", flexDirection: "row", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", padding: "5px 10px", borderRadius: "8px"}}>

                            <div className="d-flex flex-column">
                                <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>{loginData?.name}</span>
                                <span className="badge bg-primary mt-1" style={{ fontSize: '12px' }}>{loginData?.role_name}</span>
                            </div>
                            </Card>
                            <Card style={{display: "flex", flexDirection: "row", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", padding: "5px 10px", borderRadius: "8px", marginLeft: "10px"}}>

                            <div className="d-flex flex-column mx-3">
                                <span className="text-muted small">Company</span>
                                <span className="badge" style={{ fontSize: '12px', background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)" }}>Ibirds Services</span>
                            </div>
                            </Card>
                        </NavLink>
                    </div>

                    {/* Right Section: Notification + Logout */}
                    <div className="d-flex align-items-center position-relative">
                        {/* Notification Bell */}
                        <div className="position-relative me-3" ref={dropdownRef} style={{ cursor: 'pointer' }}>
                            <i
                                className={`fa-solid fa-bell ${notifications.length > 0 ? 'bell-shake' : ''}`}
                                style={{ fontSize: '20px', color: '#333' }}
                                onClick={toggleNotificationDropdown}
                            ></i>

                            {notifications.length > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    {notifications.length}
                                </span>
                            )}

                            {showDropdown && (
                                <div className="notification-dropdown position-absolute end-0 mt-2 p-3 bg-white border rounded shadow" style={{ zIndex: 1000 }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="mb-0">Notifications</h6>
                                        <button className="btn btn-sm btn-outline-secondary" 
                                            onClick={() => setShowDropdown(false)}>
                                            ✕
                                        </button>
                                    </div>
                                    <hr className="my-2" />
                                    {notifications.length > 0 ? (
                                        <>
                                            {notifications.map((n, i) => (
                                                <div key={i} className="small text-dark mb-2">
                                                    🔔 {n.message}
                                                </div>
                                            ))}
                                            <button
                                                className="btn btn-sm btn-danger mt-2 w-100"
                                                onClick={() => { setShowDropdown(false);
                                                    if (window.confirm('Clear all notifications?')) {
                                                        clearNotifications();
                                                    }
                                                }}>
                                                Clear All
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-muted small mb-0">No notifications</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Logout */}
                        <button onClick={handleLogoutClick} className="btn btn-dark btn-sm rounded px-3"  style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }}>
                            <i className="fa fa-sign-out me-1"></i> Logout
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Header;
