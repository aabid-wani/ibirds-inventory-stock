import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';
import { Image } from 'react-bootstrap';

const Header = () => {
    const { loginData, setSidebarVisibility, logout, notifications, clearNotifications } = useContext(AuthContext);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef();

    const handleLogoutClick = () => {
        logout();
        navigate('/', { replace: true });
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

    const hasNotifications = notifications.length > 0;

    return (
        <>
            <style>{`
                @keyframes bellRing {
                    0%   { transform: rotate(0); }
                    20%  { transform: rotate(12deg); }
                    40%  { transform: rotate(-10deg); }
                    60%  { transform: rotate(8deg); }
                    80%  { transform: rotate(-6deg); }
                    100% { transform: rotate(0); }
                }
                @keyframes fadeSlideDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .header-root {
                    position: sticky;
                    top: 0;
                    z-index: 1050;
                    background: #ffffff;
                    border-bottom: 0.5px solid rgba(0,0,0,0.08);
                    height: 60px;
                    display: flex;
                    align-items: center;
                    padding: 0 20px;
                }
                .header-inner {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .sidebar-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    border: 0.5px solid rgba(0,0,0,0.12);
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #555;
                    transition: background 0.15s, border-color 0.15s;
                    margin-right: 14px;
                    flex-shrink: 0;
                }
                .sidebar-btn:hover {
                    background: #f0effe;
                    border-color: #534AB7;
                    color: #534AB7;
                }
                .user-pill {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 5px 12px 5px 5px;
                    border: 0.5px solid rgba(0,0,0,0.10);
                    border-radius: 99px;
                    background: #fafafa;
                    text-decoration: none;
                    transition: border-color 0.15s, background 0.15s;
                }
                .user-pill:hover {
                    border-color: #534AB7;
                    background: #f5f4ff;
                }
                .user-avatar {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 1.5px solid #e0deff;
                }
                .user-name {
                    font-size: 13px;
                    font-weight: 500;
                    color: #1a1a1a;
                    line-height: 1.2;
                }
                .user-role {
                    font-size: 11px;
                    color: #534AB7;
                    font-weight: 500;
                    line-height: 1.2;
                }
                .divider-v {
                    width: 0.5px;
                    height: 28px;
                    background: rgba(0,0,0,0.1);
                    margin: 0 4px;
                }
                .brand-tag {
                    display: flex;
                    flex-direction: column;
                }
                .brand-name {
                    font-size: 13px;
                    font-weight: 500;
                    color: #333;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    line-height: 1.2;
                }
                .brand-sub {
                    font-size: 10px;
                    color: #888;
                    font-weight: 400;
                    line-height: 1.3;
                }
                .right-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .bell-wrap {
                    position: relative;
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    border: 0.5px solid rgba(0,0,0,0.12);
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #555;
                    transition: background 0.15s, border-color 0.15s;
                }
                .bell-wrap:hover {
                    background: #fff8f0;
                    border-color: #BA7517;
                    color: #BA7517;
                }
                .bell-icon {
                    font-size: 16px;
                    display: block;
                }
                .bell-icon.ringing {
                    animation: bellRing 0.6s ease;
                }
                .notif-badge {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #D85A30;
                    border: 1.5px solid #fff;
                }
                .notif-count-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    min-width: 16px;
                    height: 16px;
                    border-radius: 99px;
                    background: #D85A30;
                    color: #fff;
                    font-size: 10px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                    border: 1.5px solid #fff;
                }
                .notif-dropdown {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 300px;
                    background: #fff;
                    border: 0.5px solid rgba(0,0,0,0.10);
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.10);
                    z-index: 2000;
                    overflow: hidden;
                    animation: fadeSlideDown 0.18s ease;
                }
                .notif-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px 10px;
                    border-bottom: 0.5px solid rgba(0,0,0,0.07);
                }
                .notif-title {
                    font-size: 13px;
                    font-weight: 500;
                    color: #1a1a1a;
                }
                .notif-close {
                    width: 24px;
                    height: 24px;
                    border: none;
                    background: transparent;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #aaa;
                    cursor: pointer;
                    font-size: 13px;
                    transition: background 0.15s;
                }
                .notif-close:hover { background: #f5f5f5; color: #555; }
                .notif-body {
                    max-height: 240px;
                    overflow-y: auto;
                    padding: 8px 0;
                }
                .notif-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 9px 16px;
                    transition: background 0.12s;
                }
                .notif-item:hover { background: #fafafa; }
                .notif-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #534AB7;
                    flex-shrink: 0;
                    margin-top: 5px;
                }
                .notif-msg {
                    font-size: 12px;
                    color: #333;
                    line-height: 1.4;
                }
                .notif-empty {
                    padding: 24px 16px;
                    text-align: center;
                    font-size: 13px;
                    color: #aaa;
                }
                .notif-footer {
                    border-top: 0.5px solid rgba(0,0,0,0.07);
                    padding: 10px 16px;
                }
                .clear-btn {
                    width: 100%;
                    padding: 7px;
                    border: 0.5px solid #D85A30;
                    border-radius: 8px;
                    background: transparent;
                    color: #D85A30;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .clear-btn:hover { background: #FAECE7; }
                .logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 7px 16px;
                    border-radius: 8px;
                    border: none;
                    background: #1a1a1a;
                    color: #fff;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.15s, opacity 0.15s;
                }
                .logout-btn:hover { background: #333; }
                .logout-btn i { font-size: 13px; }
            `}</style>

            <nav className="header-root">
                <div className="header-inner">

                    {/* ── Left: toggle + user info ── */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button className="sidebar-btn" onClick={handelSidebar} aria-label="Toggle sidebar">
                            <i className="fa-solid fa-bars" style={{ fontSize: 14 }}></i>
                        </button>

                        <NavLink to="/profile" className="user-pill">
                            <Image
                                src="/images/user.png"
                                className="user-avatar"
                                alt="User avatar"
                            />
                            <div>
                                <div className="user-name">{loginData?.name}</div>
                                <div className="user-role">{loginData?.role_name}</div>
                            </div>
                            <div className="divider-v" />
                            <div className="brand-tag">
                                <span className="brand-name">iBirds</span>
                                <span className="brand-sub">Inventory Management</span>
                            </div>
                        </NavLink>
                    </div>

                    {/* ── Right: bell + logout ── */}
                    <div className="right-actions">

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
                                            Notifications
                                            {hasNotifications && (
                                                <span style={{
                                                    marginLeft: 8, fontSize: 11,
                                                    background: '#EEEDFE', color: '#534AB7',
                                                    borderRadius: 99, padding: '1px 7px', fontWeight: 500
                                                }}>
                                                    {notifications.length}
                                                </span>
                                            )}
                                        </span>
                                        <button className="notif-close" onClick={() => setShowDropdown(false)}>✕</button>
                                    </div>

                                    <div className="notif-body">
                                        {hasNotifications ? (
                                            notifications.map((n, i) => (
                                                <div key={i} className="notif-item">
                                                    <div className="notif-dot" />
                                                    <span className="notif-msg">{n.message}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="notif-empty">
                                                <i className="fa-regular fa-bell-slash" style={{ fontSize: 22, display: 'block', marginBottom: 6, color: '#ccc' }}></i>
                                                No notifications
                                            </div>
                                        )}
                                    </div>

                                    {hasNotifications && (
                                        <div className="notif-footer">
                                            <button
                                                className="clear-btn"
                                                onClick={() => {
                                                    setShowDropdown(false);
                                                    if (window.confirm('Clear all notifications?')) {
                                                        clearNotifications();
                                                    }
                                                }}
                                            >
                                                Clear all notifications
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Logout */}
                        <button className="logout-btn" onClick={handleLogoutClick}>
                            <i className="fa fa-sign-out"></i>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Header;