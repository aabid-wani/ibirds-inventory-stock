import React, { useContext, useEffect, useState, useRef } from "react";
import { Card, Col, Row, Form, Button, Spinner, Badge } from "react-bootstrap";
import stockManagementApis from "../apis/StockManagementApis";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../context/AuthProvider";
import { Link } from "react-router-dom";
import Main from "../layout/Main";
import { API_BASE_URL } from "../CONSTANT/CONSTANT";

const PURPLE = "#534AB7";
const PURPLE_LIGHT = "#EEEDFE";
const TEAL = "#1D9E75";
const TEAL_LIGHT = "#E1F5EE";
const CORAL = "#D85A30";

export default function Profile() {
  const { loginData, setLoginData } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const [object, setObject] = useState({
    user_id: "",
    name: "",
    contact: "",
    email: "",
    user_name: "",
    role_id: "",
    role_name: "",
    branch_id: "",
    branch_name: "",
    profile_image: "",
    status: "active",
  });

  const [preview, setPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const getFullImageUrl = (path) => {
    if (!path) return "/images/user.png";
    if (path.startsWith("blob:") || path.startsWith("data:") || path.startsWith("http")) {
      return path;
    }
    return `${API_BASE_URL}${path}`;
  };

  useEffect(() => {
    if (loginData) {
      const uid = loginData.id || loginData.user_id || "";
      setObject({
        user_id: uid,
        name: loginData.name || "",
        contact: loginData.contact || "",
        email: loginData.email || "",
        user_name: loginData.user_name || "",
        role_id: loginData.role_id || "",
        role_name: loginData.role_name || "System Operator",
        branch_id: loginData.branch_id || "",
        branch_name: loginData.branch_name || "Head Office Ajmer",
        profile_image: loginData.profile_image || "",
        status: loginData.status || "active",
      });

      if (loginData.profile_image) {
        setPreview(getFullImageUrl(loginData.profile_image));
      } else {
        setPreview("/images/user.png");
      }
    }
  }, [loginData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setObject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file (JPG, PNG, WebP)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (object.profile_image) {
      setPreview(getFullImageUrl(object.profile_image));
    } else {
      setPreview("/images/user.png");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const targetUserId = object.user_id || loginData?.id || loginData?.user_id;

    if (!targetUserId) {
      toast.error("Operator session identification missing. Please refresh and try again.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", object.name.trim());
      formData.append("email", object.email.trim());
      formData.append("user_name", object.user_name.trim());
      if (object.contact) formData.append("contact", object.contact.trim());
      if (object.branch_id) formData.append("branch_id", object.branch_id);
      if (object.role_id) formData.append("role_id", object.role_id);
      if (selectedFile) {
        formData.append("profile_image", selectedFile);
      }

      const res = await stockManagementApis.updateUserProfile(targetUserId, formData);

      // Merge updated user data into session storage and context
      const updatedUser = {
        ...loginData,
        ...(res?.result || res || {}),
        id: targetUserId,
        user_id: targetUserId,
      };

      sessionStorage.setItem("loginData", JSON.stringify(updatedUser));
      if (setLoginData) {
        setLoginData(updatedUser);
      }

      if (res?.result) {
        setObject((prev) => ({
          ...prev,
          ...res.result,
          user_id: targetUserId,
        }));
        if (res.result.profile_image) {
          setPreview(getFullImageUrl(res.result.profile_image));
        }
      }
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Operator profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update operator profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Main>
      <ToastContainer position="top-right" autoClose={3000} />

      <style>{`
        .profile-container {
          background: #f8fafc;
          min-height: calc(100vh - 65px);
          padding: 28px;
        }
        .profile-banner {
          background: linear-gradient(135deg, #1e293b 0%, #334155 45%, ${PURPLE} 100%);
          border-radius: 16px 16px 0 0;
          height: 125px;
          position: relative;
        }
        .profile-avatar-wrap {
          position: absolute;
          bottom: -45px;
          left: 32px;
          width: 94px;
          height: 94px;
          border-radius: 50%;
          border: 4px solid #ffffff;
          overflow: hidden;
          background: ${PURPLE_LIGHT};
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }
        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-camera-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${PURPLE};
          color: #ffffff;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .avatar-camera-btn:hover {
          background: #3e388f;
          transform: scale(1.08);
        }
        .form-label-custom {
          font-size: 12.5px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }
        .form-control-custom {
          font-size: 13px;
          border-radius: 9px;
          border: 1px solid #cbd5e1;
          padding: 9px 13px;
          color: #0f172a;
          transition: all 0.15s ease;
        }
        .form-control-custom:focus {
          border-color: ${PURPLE};
          box-shadow: 0 0 0 3px rgba(83, 74, 183, 0.12);
          outline: none;
        }
        .meta-stat-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 12px;
          color: #475569;
        }
        .meta-stat-pill strong {
          color: #0f172a;
        }
      `}</style>

      <div className="profile-container">
        {/* ── Top Breadcrumbs & Nav ── */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              <Link to="/Home" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
                Home
              </Link>{" "}
              / <span style={{ color: "#0f172a", fontWeight: 600 }}>Operator Profile</span>
            </div>
            <h4 style={{ margin: "4px 0 0 0", fontWeight: 700, color: "#0f172a" }}>
              Operator Account & Settings
            </h4>
          </div>

          <Link
            to="/Home"
            className="btn btn-sm"
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontWeight: 600,
              borderRadius: "8px",
              padding: "7px 16px",
              fontSize: "13px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <i className="fa-solid fa-arrow-left me-1"></i> Back to Dashboard
          </Link>
        </div>

        {/* ── Main Content Grid ── */}
        <Row className="g-4">
          {/* ── Left Column: Operator Identity Snapshot ── */}
          <Col lg={4}>
            <Card style={{ border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <div className="profile-banner">
                <div className="profile-avatar-wrap">
                  <img
                    src={preview}
                    alt="Operator Avatar"
                    className="profile-avatar-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/user.png";
                    }}
                  />
                  <div
                    className="avatar-camera-btn"
                    title="Upload photo"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="fa-solid fa-camera"></i>
                  </div>
                </div>
              </div>

              <Card.Body className="p-4 pt-5 mt-2" style={{ background: "#ffffff" }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                      {object.name || "System Operator"}
                    </h5>
                    <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "2px" }}>
                      <span style={{ color: PURPLE, fontWeight: 600 }}>@{object.user_name || "operator"}</span>
                    </div>
                  </div>
                  <Badge
                    bg=""
                    style={{
                      backgroundColor: TEAL_LIGHT,
                      color: TEAL,
                      border: `1px solid ${TEAL}30`,
                      fontWeight: 700,
                      fontSize: "11px",
                      padding: "5px 10px",
                      borderRadius: "99px",
                    }}
                  >
                    <i className="fa-solid fa-circle-check me-1"></i> ACTIVE
                  </Badge>
                </div>

                <div className="mt-3 pt-3 border-top d-flex flex-column gap-2">
                  <div className="meta-stat-pill">
                    <i className="fa-solid fa-shield-halved" style={{ color: PURPLE }}></i>
                    <div>
                      System Role: <strong>{object.role_name || "Administrator"}</strong>
                    </div>
                  </div>

                  <div className="meta-stat-pill">
                    <i className="fa-solid fa-building" style={{ color: TEAL }}></i>
                    <div>
                      Branch: <strong>{object.branch_name || "Head Office Ajmer"}</strong>
                    </div>
                  </div>

                  <div className="meta-stat-pill">
                    <i className="fa-solid fa-envelope" style={{ color: "#64748b" }}></i>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {object.email}
                    </div>
                  </div>

                  {object.contact && (
                    <div className="meta-stat-pill">
                      <i className="fa-solid fa-phone" style={{ color: "#64748b" }}></i>
                      <div>{object.contact}</div>
                    </div>
                  )}
                </div>

                <div
                  className="mt-3 p-3"
                  style={{
                    background: "#f1f5f9",
                    borderRadius: "10px",
                    fontSize: "11.5px",
                    color: "#64748b",
                  }}
                >
                  <i className="fa-solid fa-info-circle me-1" style={{ color: PURPLE }}></i>
                  Operator ID: <code style={{ color: "#0f172a" }}>{object.user_id ? `${object.user_id.slice(0, 14)}...` : "System"}</code>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* ── Right Column: Edit Profile Form ── */}
          <Col lg={8}>
            <Card style={{ border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <div
                style={{
                  padding: "16px 24px",
                  background: "#ffffff",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                    <i className="fa-solid fa-user-pen me-2" style={{ color: PURPLE }}></i>
                    Edit Profile Details
                  </h6>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Update your operator credentials, contact phone, and avatar photo
                  </span>
                </div>
              </div>

              <Card.Body className="p-4" style={{ background: "#ffffff" }}>
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="form-label-custom">
                          Full Name <span style={{ color: CORAL }}>*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={object.name}
                          onChange={handleChange}
                          required
                          placeholder="e.g. Aafreen Khan"
                          className="form-control-custom"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="form-label-custom">
                          Email Address <span style={{ color: CORAL }}>*</span>
                        </Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={object.email}
                          onChange={handleChange}
                          required
                          placeholder="operator@ibirdsservices.com"
                          className="form-control-custom"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="form-label-custom">
                          User Handle / Username <span style={{ color: CORAL }}>*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="user_name"
                          value={object.user_name}
                          onChange={handleChange}
                          required
                          placeholder="e.g. AafreenKhan"
                          className="form-control-custom"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="form-label-custom">Contact Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="contact"
                          value={object.contact}
                          onChange={handleChange}
                          placeholder="e.g. +91 9876543210"
                          className="form-control-custom"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="form-label-custom">
                          Upload New Avatar Photo
                        </Form.Label>
                        <div
                          style={{
                            border: "2px dashed #cbd5e1",
                            borderRadius: "12px",
                            padding: "20px",
                            textAlign: "center",
                            background: "#f8fafc",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                          />
                          <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "28px", color: PURPLE, marginBottom: "8px" }}></i>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                            {selectedFile ? (
                              <span style={{ color: TEAL }}>
                                <i className="fa-solid fa-check me-1"></i>
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                              </span>
                            ) : (
                              "Click to browse or replace avatar photo"
                            )}
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>
                            Supports PNG, JPG, JPEG, WebP (Max 5MB)
                          </div>
                        </div>

                        {selectedFile && (
                          <div className="d-flex align-items-center justify-content-between mt-2 px-2">
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              Previewing new image
                            </span>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={handleRemoveSelectedFile}
                              style={{ color: CORAL, fontSize: "12px", textDecoration: "none", padding: 0 }}
                            >
                              <i className="fa-solid fa-xmark me-1"></i> Revert avatar
                            </Button>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-between align-items-center pt-4 mt-4 border-top">
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      <i className="fa-solid fa-lock me-1"></i> Changes will update your active session
                    </span>

                    <div className="d-flex gap-2">
                      <Button
                        type="button"
                        variant="light"
                        disabled={submitting}
                        onClick={() => {
                          if (loginData) {
                            setObject((prev) => ({
                              ...prev,
                              name: loginData.name || "",
                              contact: loginData.contact || "",
                              email: loginData.email || "",
                              user_name: loginData.user_name || "",
                            }));
                            handleRemoveSelectedFile();
                          }
                        }}
                        style={{
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          fontWeight: 600,
                          borderRadius: "8px",
                          padding: "8px 18px",
                          color: "#475569",
                        }}
                      >
                        Reset
                      </Button>

                      <Button
                        type="submit"
                        disabled={submitting}
                        style={{
                          background: PURPLE,
                          borderColor: PURPLE,
                          borderRadius: "8px",
                          fontWeight: 600,
                          fontSize: "13px",
                          padding: "8px 24px",
                          boxShadow: "0 2px 6px rgba(83, 74, 183, 0.25)",
                        }}
                      >
                        {submitting ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-floppy-disk me-2"></i>
                            Save Profile Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Main>
  );
}
