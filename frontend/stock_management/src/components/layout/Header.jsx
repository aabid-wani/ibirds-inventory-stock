import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';
import { Image, Modal, Button } from 'react-bootstrap';
import { API_BASE_URL } from '../CONSTANT/CONSTANT';

const Header = () => {
    const { loginData, setSidebarVisibility, logout, notifications, clearNotifications, removeNotification } = useContext(AuthContext);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [headerSearch, setHeaderSearch] = useState('');
    const navigate = useNavigate();
    const dropdownRef = useRef();

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleRestockProduct = (n, e) => {
        if (e) e.stopPropagation();
        setShowDropdown(false);
        const prod = n.product;
        if (prod?.id) {
            navigate(`/productDetailPage/${prod.id}?action=restock`);
        } else {
            const match = n.message?.match(/Stock of (.*?) is below/i);
            const name = match ? match[1].trim() : (prod?.name || '');
            if (name) {
                navigate(`/product?search=${encodeURIComponent(name)}`);
            } else {
                navigate('/product');
            }
        }
    };

    const handleViewProduct = (n, e) => {
        if (e) e.stopPropagation();
        setShowDropdown(false);
        const prod = n.product;
        if (prod?.id) {
            navigate(`/productDetailPage/${prod.id}`);
        } else {
            const match = n.message?.match(/Stock of (.*?) is below/i);
            const name = match ? match[1].trim() : (prod?.name || '');
            if (name) {
                navigate(`/product?search=${encodeURIComponent(name)}`);
            } else {
                navigate('/product');
            }
        }
    };

    const handleLogoutClick = (e) => {
        if (e) e.preventDefault();
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = () => {
        try {
            logout();
        } catch (err) {
            console.error("Logout error:", err);
        }
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/';
    };

    const handelSidebar = () => {
        setShowSidebar(!showSidebar);
        setSidebarVisibility(!showSidebar);
    };

    const toggleNotificationDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter' && headerSearch.trim()) {
            navigate(`/product?search=${encodeURIComponent(headerSearch.trim())}`);
        }
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

    const hasNotifications = notifications && notifications.length > 0;

    return (
        <>
            <style>{`
                @keyframes bellRing {
                    0%   { transform: rotate(0); }
                    20%  { transform: rotate(14deg); }
                    40%  { transform: rotate(-12deg); }
                    60%  { transform: rotate(10deg); }
                    80%  { transform: rotate(-6deg); }
                    100% { transform: rotate(0); }
                }
                @keyframes fadeSlideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .header-root {
                    position: sticky;
                    top: 0;
                    z-index: 1050;
                    background: #ffffff;
                    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
                    height: 64px;
                    display: flex;
                    align-items: center;
                    padding: 0 24px;
                    backdrop-filter: blur(8px);
                }
                .header-inner {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                }
                .sidebar-btn {
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #475569;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-right: 14px;
                    flex-shrink: 0;
                }
                .sidebar-btn:hover {
                    background: #eef2ff;
                    border-color: #6366f1;
                    color: #4f46e5;
                    transform: scale(1.03);
                }

                .header-search-box {
                    display: flex;
                    align-items: center;
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 6px 14px;
                    width: 280px;
                    transition: all 0.2s ease;
                }
                .header-search-box:focus-within {
                    background: #ffffff;
                    border-color: #534AB7;
                    box-shadow: 0 0 0 3px rgba(83, 74, 183, 0.12);
                    width: 320px;
                }
                .header-search-input {
                    border: none;
                    background: transparent;
                    outline: none;
                    font-size: 13px;
                    color: #1e293b;
                    width: 100%;
                    margin-left: 8px;
                }
                .header-search-input::placeholder {
                    color: #94a3b8;
                    font-size: 12.5px;
                }

                .user-pill {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 4px 14px 4px 6px;
                    border: 1px solid #e2e8f0;
                    border-radius: 99px;
                    background: #ffffff;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
                }
                .user-pill:hover {
                    border-color: #534AB7;
                    background: #f8fafc;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(83, 74, 183, 0.08);
                }
                .user-avatar-wrap {
                    position: relative;
                }
                .user-avatar {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid #e0e7ff;
                }
                .user-online-badge {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 9px;
                    height: 9px;
                    border-radius: 50%;
                    background: #10b981;
                    border: 2px solid #ffffff;
                }
                .user-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #0f172a;
                    line-height: 1.2;
                }
                .user-role-badge {
                    display: inline-block;
                    font-size: 10.5px;
                    color: #534AB7;
                    font-weight: 600;
                    background: #eeedfe;
                    padding: 1px 8px;
                    border-radius: 99px;
                    line-height: 1.3;
                    margin-top: 1px;
                }

                .right-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .bell-wrap {
                    position: relative;
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #475569;
                    transition: all 0.2s ease;
                }
                .bell-wrap:hover {
                    background: #fff7ed;
                    border-color: #f97316;
                    color: #ea580c;
                    transform: scale(1.03);
                }
                .bell-icon {
                    font-size: 16px;
                    display: block;
                }
                .bell-icon.ringing {
                    animation: bellRing 0.6s ease;
                }
                .notif-count-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    min-width: 18px;
                    height: 18px;
                    border-radius: 99px;
                    background: #ea580c;
                    color: #ffffff;
                    font-size: 10.5px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 4px rgba(234, 88, 12, 0.3);
                }
                .notif-dropdown {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 375px;
                    max-width: 92vw;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.14);
                    z-index: 2000;
                    overflow: hidden;
                    animation: fadeSlideDown 0.2s ease;
                }
                .notif-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: #f8fafc;
                    border-bottom: 1px solid #f1f5f9;
                }
                .notif-title {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #0f172a;
                    display: flex;
                    align-items: center;
                }
                .notif-close {
                    width: 26px;
                    height: 26px;
                    border: none;
                    background: transparent;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 13px;
                    transition: all 0.15s ease;
                }
                .notif-close:hover { background: #e2e8f0; color: #334155; }
                .notif-body {
                    max-height: 330px;
                    overflow-y: auto;
                    padding: 6px 0;
                }
                .notif-item-card {
                    padding: 11px 16px;
                    border-bottom: 1px solid #f1f5f9;
                    transition: all 0.15s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    cursor: pointer;
                }
                .notif-item-card:hover {
                    background: #f8fafc;
                }
                .notif-item-top {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    width: 100%;
                }
                .notif-alert-icon {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    background: #fffbeb;
                    border: 1px solid #fde68a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    color: #d97706;
                    font-size: 12px;
                }
                .notif-item-info {
                    flex: 1;
                    min-width: 0;
                }
                .notif-product-name {
                    font-size: 13px;
                    font-weight: 700;
                    color: #0f172a;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.3;
                    transition: color 0.15s ease;
                }
                .notif-product-name:hover {
                    color: #534AB7;
                }
                .notif-meta-tags {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 3px;
                }
                .notif-tag {
                    font-size: 11px;
                    font-weight: 600;
                    padding: 1px 6px;
                    border-radius: 4px;
                }
                .notif-tag-stock {
                    background: #fee2e2;
                    color: #b91c1c;
                }
                .notif-tag-min {
                    background: #f1f5f9;
                    color: #475569;
                }
                .notif-dismiss-btn {
                    width: 22px;
                    height: 22px;
                    border: none;
                    background: transparent;
                    border-radius: 4px;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    flex-shrink: 0;
                }
                .notif-dismiss-btn:hover {
                    background: #e2e8f0;
                    color: #334155;
                }
                .notif-action-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-left: 38px;
                    gap: 8px;
                }
                .notif-restock-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    background: #534AB7;
                    color: #ffffff;
                    font-size: 11.5px;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .notif-restock-btn:hover {
                    background: #4338ca;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 6px rgba(83, 74, 183, 0.25);
                }
                .notif-view-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    background: #f1f5f9;
                    color: #475569;
                    font-size: 11.5px;
                    font-weight: 500;
                    border: 1px solid #e2e8f0;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .notif-view-btn:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                }
                .notif-empty {
                    padding: 32px 18px;
                    text-align: center;
                    font-size: 13px;
                    color: #94a3b8;
                }
                .notif-footer {
                    border-top: 1px solid #f1f5f9;
                    padding: 10px 16px;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                }
                .clear-btn {
                    padding: 6px 12px;
                    border: 1px solid #fed7aa;
                    border-radius: 6px;
                    background: #fff7ed;
                    color: #c2410c;
                    font-size: 11.5px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .clear-btn:hover { background: #ffedd5; }
                .notif-report-link {
                    font-size: 11.5px;
                    color: #534AB7;
                    text-decoration: none;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .notif-report-link:hover {
                    text-decoration: underline;
                    color: #4338ca;
                }
                
                .logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    padding: 8px 16px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    color: #dc2626;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .logout-btn:hover {
                    background: #fef2f2;
                    border-color: #fecaca;
                    color: #b91c1c;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 6px rgba(220, 38, 38, 0.08);
                }
                .quick-nav-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 12px;
                    font-size: 12px;
                    font-weight: 500;
                    color: #475569;
                    background: #f1f5f9;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.15s ease;
                }
                .quick-nav-chip:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                }
                @media (max-width: 900px) {
                    .header-search-box { display: none; }
                    .quick-nav-chip { display: none; }
                }
            `}</style>

            <nav className="header-root">
                <div className="header-inner">

                    {/* ── Left: toggle + brand + search ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="sidebar-btn" onClick={handelSidebar} aria-label="Toggle sidebar">
                            <i className="fa-solid fa-bars" style={{ fontSize: 15 }}></i>
                        </button>

                        {/* Search Bar */}
                        <div className="header-search-box">
                            <i className="fa-solid fa-magnifying-glass" style={{ color: '#94a3b8', fontSize: 13 }}></i>
                            <input
                                type="text"
                                className="header-search-input"
                                placeholder="Search products, SKUs... (Enter)"
                                value={headerSearch}
                                onChange={(e) => setHeaderSearch(e.target.value)}
                                onKeyDown={handleSearchSubmit}
                            />
                        </div>

                        {/* Quick Shortcuts */}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <NavLink to="/product" className="quick-nav-chip">
                                <i className="fa-solid fa-boxes-stacked" style={{ color: '#534AB7', fontSize: 11 }}></i>
                                Stock
                            </NavLink>
                            <NavLink to="/order" className="quick-nav-chip">
                                <i className="fa-solid fa-cart-shopping" style={{ color: '#1D9E75', fontSize: 11 }}></i>
                                Purchases
                            </NavLink>
                            <NavLink to="/issue" className="quick-nav-chip">
                                <i className="fa-solid fa-paper-plane" style={{ color: '#D85A30', fontSize: 11 }}></i>
                                Issues
                            </NavLink>
                            <NavLink to="/vendor" className="quick-nav-chip">
                                <i className="fa-solid fa-building" style={{ color: '#8B5CF6', fontSize: 11 }}></i>
                                Vendors
                            </NavLink>
                            <NavLink to="/employee" className="quick-nav-chip">
                                <i className="fa-solid fa-user-tie" style={{ color: '#F59E0B', fontSize: 11 }}></i>
                                Employees
                            </NavLink>
                            <NavLink to="/monthly_report" className="quick-nav-chip">
                                <i className="fa-solid fa-chart-bar" style={{ color: '#3B82F6', fontSize: 11 }}></i>
                                Reports
                            </NavLink>
                        </div>
                    </div>

                    {/* ── Right: User Profile + Notifications + Logout ── */}
                    <div className="right-actions">

                        {/* User pill */}
                        <NavLink to="/profile" className="user-pill">
                            <div className="user-avatar-wrap">
                                <Image
                                    src={loginData?.profile_image ? (loginData.profile_image.startsWith('http') || loginData.profile_image.startsWith('data:') ? loginData.profile_image : `${API_BASE_URL}${loginData.profile_image}`) : "/images/user.png"}
                                    className="user-avatar"
                                    alt="User avatar"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "/images/user.png"; }}
                                />
                                <span className="user-online-badge"></span>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div className="user-name">{loginData?.name || 'Operator'}</div>
                                <span className="user-role-badge">{loginData?.role_name || 'Staff'}</span>
                            </div>
                        </NavLink>

                        {/* Notification bell */}
                        <div
                            className="bell-wrap"
                            ref={dropdownRef}
                            onClick={toggleNotificationDropdown}
                            aria-label="Notifications"
                        >
                            <i className={`fa-solid fa-bell bell-icon${hasNotifications ? ' ringing' : ''}`}></i>
                            {hasNotifications && (
                                <span className="notif-count-badge">
                                    {notifications.length > 9 ? '9+' : notifications.length}
                                </span>
                            )}

                            {showDropdown && (
                                <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
                                    <div className="notif-header">
                                        <span className="notif-title">
                                            <i className="fa-solid fa-bell me-2" style={{ color: '#534AB7' }}></i>
                                            Notifications
                                            {hasNotifications && (
                                                <span style={{
                                                    marginLeft: 8, fontSize: 11,
                                                    background: '#EEEDFE', color: '#534AB7',
                                                    borderRadius: 99, padding: '2px 8px', fontWeight: 600
                                                }}>
                                                    {notifications.length}
                                                </span>
                                            )}
                                        </span>
                                        <button className="notif-close" onClick={() => setShowDropdown(false)}>✕</button>
                                    </div>

                                    <div className="notif-body">
                                        {hasNotifications ? (
                                            notifications.map((n, i) => {
                                                const prod = n.product || {};
                                                const prodName = prod.name || n.message?.replace(/^Stock of /i, '').replace(/ is below minimum threshold!$/i, '') || 'Item';
                                                const avail = prod.available_quantity !== undefined ? Number(prod.available_quantity) : null;
                                                const minQ = prod.min_quantity !== undefined ? Number(prod.min_quantity) : null;

                                                return (
                                                    <div
                                                        key={n.id || i}
                                                        className="notif-item-card"
                                                        onClick={(e) => handleViewProduct(n, e)}
                                                        title={`Click to view details for ${prodName}`}
                                                    >
                                                        <div className="notif-item-top">
                                                            <div className="notif-alert-icon">
                                                                <i className="fa-solid fa-triangle-exclamation"></i>
                                                            </div>
                                                            <div className="notif-item-info">
                                                                <div className="notif-product-name">
                                                                    {prodName}
                                                                </div>
                                                                <div className="notif-meta-tags">
                                                                    {avail !== null ? (
                                                                        <span className="notif-tag notif-tag-stock">
                                                                            Stock: {avail} {prod.measurement_units || prod.measurement_unit || ''}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="notif-tag notif-tag-stock">Low Stock</span>
                                                                    )}
                                                                    {minQ !== null && (
                                                                        <span className="notif-tag notif-tag-min">
                                                                            Min: {minQ}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {removeNotification && (
                                                                <button
                                                                    className="notif-dismiss-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeNotification(n.id);
                                                                    }}
                                                                    title="Dismiss notification"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="notif-action-row" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                className="notif-restock-btn"
                                                                onClick={(e) => handleRestockProduct(n, e)}
                                                                title={`Restock stock for ${prodName}`}
                                                            >
                                                                <i className="fa-solid fa-bolt me-1 text-warning"></i>
                                                                Restock Product
                                                            </button>
                                                            <button
                                                                className="notif-view-btn"
                                                                onClick={(e) => handleViewProduct(n, e)}
                                                                title={`View ${prodName} details`}
                                                            >
                                                                View Details <i className="fa-solid fa-arrow-right ms-1"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="notif-empty">
                                                <i className="fa-regular fa-bell-slash" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: '#cbd5e1' }}></i>
                                                No new notifications
                                            </div>
                                        )}
                                    </div>

                                    {hasNotifications && (
                                        <div className="notif-footer">
                                            <NavLink
                                                to="/low_stock"
                                                className="notif-report-link"
                                                onClick={() => setShowDropdown(false)}
                                            >
                                                <i className="fa-solid fa-file-lines me-1"></i> Low Stock Report
                                            </NavLink>
                                            <button
                                                className="clear-btn"
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    if (window.confirm('Clear all notifications?')) {
                                                        clearNotifications();
                                                    }
                                                }}
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Logout */}
                        <button className="logout-btn" onClick={handleLogoutClick} title="Sign Out">
                            <i className="fa-solid fa-arrow-right-from-bracket"></i>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* In-app Sleek Sign Out Confirmation Modal */}
            <Modal
                show={showLogoutModal}
                onHide={() => setShowLogoutModal(false)}
                centered
                size="sm"
                contentClassName="border-0 shadow-lg"
                style={{ borderRadius: '16px' }}
            >
                <Modal.Body className="p-4 text-center">
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: '#fee2e2',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: '22px'
                    }}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    </div>
                    <h5 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                        Sign Out of iBirds ERP?
                    </h5>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '22px', lineHeight: 1.5 }}>
                        Are you sure you want to log out? Your active session will be ended.
                    </p>
                    <div className="d-flex gap-2 justify-content-center">
                        <Button
                            variant="light"
                            style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                padding: '8px 20px',
                                borderRadius: '9px',
                                border: '1px solid #cbd5e1',
                                color: '#475569'
                            }}
                            onClick={() => setShowLogoutModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                padding: '8px 22px',
                                borderRadius: '9px',
                                background: '#dc2626',
                                borderColor: '#dc2626',
                                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)'
                            }}
                            onClick={handleConfirmLogout}
                        >
                            Yes, Sign Out
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default Header;