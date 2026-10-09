import React, { useEffect, useState, useContext, useMemo } from "react";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import { API_BASE_URL } from "../CONSTANT/CONSTANT";
import { Row, Col, Card } from "react-bootstrap";

const PURPLE = "#534AB7";
const CORAL = "#D85A30";
const TEAL = "#1D9E75";

const cellInput = {
  width: "100%",
  padding: "7px 10px",
  fontSize: "12.5px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  outline: "none",
  color: "#0f172a",
  fontFamily: "system-ui, sans-serif",
  minWidth: "120px",
  transition: "border-color 0.15s ease",
};

const AddMultipleProvision = () => {
  const { loginData } = useContext(AuthContext);
  const navigate = useNavigate();

  const createNewRow = () => ({
    user_id: loginData?.id || "",
    user_name: loginData?.name || "",
    employee: "",
    branch: "",
    product: "",
    qty: "",
    date: new Date().toISOString().split("T")[0],
    status: "active",
    description: "",
  });

  const fetchWithToken = async (url, options = {}) => {
    const token = sessionStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      if (options.method === "DELETE") {
        try {
          return await response.json();
        } catch {
          return response.status;
        }
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [rows, setRows] = useState([createNewRow()]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [branchRes, productRes, employeeRes] = await Promise.all([
          fetchWithToken(`${API_BASE_URL}/branch`),
          fetchWithToken(`${API_BASE_URL}/product`),
          fetchWithToken(`${API_BASE_URL}/employee`),
        ]);
        setBranches(branchRes || []);
        setProducts((productRes || []).filter((p) => p.available_quantity > 0));
        setEmployees(employeeRes || []);

        const defaultBranch = (branchRes || []).find(
          (b) => b.name && b.name.trim().toLowerCase().includes("ajmer")
        ) || (branchRes && branchRes[0]);

        if (defaultBranch) {
          setRows((prevRows) =>
            prevRows.map((row) => ({
              ...row,
              branch: defaultBranch.id,
              user_id: loginData?.id || row.user_id,
              user_name: loginData?.name || row.user_name,
            }))
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loginData?.id]);

  const handleChange = (index, field, value) => {
    const updated = [...rows];

    if (field === "qty") {
      const currentProductId = updated[index]["product"];
      const maxAvailable = availableQty(currentProductId);
      const numValue = Number(value);

      if (numValue > maxAvailable) {
        updated[index][field] = maxAvailable.toString();
        toast.info(`Limited to maximum available stock (${maxAvailable})`);
      } else {
        updated[index][field] = value;
      }
    } else {
      updated[index][field] = value;
      if (field === "product") updated[index]["qty"] = "";
    }

    setRows(updated);
  };

  const addRow = () => {
    const defaultBranch = branches.find((b) => b.name && b.name.trim().toLowerCase().includes("ajmer")) || branches[0];
    setRows((prev) => [
      ...prev,
      {
        ...createNewRow(),
        branch: defaultBranch ? defaultBranch.id : "",
      },
    ]);
  };

  const removeRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated.length > 0 ? updated : [createNewRow()]);
  };

  const availableQty = (productId) => {
    const found = products.find((p) => p.id === productId);
    return found ? found.available_quantity : 0;
  };

  const totalUnitsToDispatch = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseInt(r.qty, 10) || 0), 0);
  }, [rows]);

  const handleSubmit = async () => {
    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.employee) {
        toast.error(`Row ${i + 1}: Please select a recipient employee.`);
        return;
      }
      if (!r.product) {
        toast.error(`Row ${i + 1}: Please select a product.`);
        return;
      }
      if (!r.qty || parseInt(r.qty, 10) <= 0) {
        toast.error(`Row ${i + 1}: Please specify a valid quantity.`);
        return;
      }
    }

    setSubmitting(true);
    const dataToSend = rows.map(({ user_name, ...rest }) => rest);
    try {
      const res = await fetchWithToken(`${API_BASE_URL}/issue/bulk`, {
        method: "POST",
        body: JSON.stringify(dataToSend),
      });
      if (res.success) {
        const issuedMap = {};
        rows.forEach((row) => {
          if (!issuedMap[row.product]) issuedMap[row.product] = 0;
          issuedMap[row.product] += Number(row.qty);
        });
        const productUpdates = Object.entries(issuedMap).map(([id, issued_qty]) => ({ id, issued_qty }));
        const updateRes = await fetchWithToken(`${API_BASE_URL}/product/update-quantities`, {
          method: "POST",
          body: JSON.stringify(productUpdates),
        });
        if (updateRes.success) {
          toast.success("All provisions recorded and stock deducted successfully!");
          setTimeout(() => navigate("/issue"), 1500);
        } else {
          toast.error("Failed to update stock balance.");
        }
      } else {
        toast.error("Failed to submit provisions.");
      }
    } catch (err) {
      toast.error("Error submitting provisions.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .mp-input:focus { border-color: ${PURPLE} !important; box-shadow: 0 0 0 2px rgba(83,74,183,0.15); }
        .mp-row:hover { background: #f8fafc; }
        .mp-table { border-collapse: collapse; width: 100%; }
        .mp-td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .toggle-pill { position: relative; display: inline-flex; align-items: center; cursor: pointer; gap: 8px; }
        .toggle-pill input { display: none; }
        .toggle-track { width: 34px; height: 18px; background: #cbd5e1; border-radius: 99px; transition: background 0.2s; flex-shrink: 0; position: relative; }
        .toggle-thumb { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
        .toggle-pill input:checked ~ .toggle-track { background: ${TEAL}; }
        .toggle-pill input:checked ~ .toggle-track .toggle-thumb { transform: translateX(16px); }
        .spin { animation: spin 0.8s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <Main>
        <ToastContainer position="top-right" autoClose={3000} />

        <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
          {/* ── Top Bar ── */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                <Link to="/Home" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
                  Home
                </Link>{" "}
                /{" "}
                <Link to="/issue" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
                  Provisions
                </Link>{" "}
                / <span style={{ color: "#0f172a", fontWeight: 600 }}>Batch Stock Dispatch</span>
              </div>
              <h4 style={{ margin: "4px 0 0", fontWeight: 700, color: "#0f172a" }}>
                Batch Stock Provisioning Slip
              </h4>
            </div>

            <div className="d-flex gap-2">
              <Link to="/issue" className="btn btn-sm btn-light border" style={{ borderRadius: "8px", fontWeight: 600, padding: "7px 16px" }}>
                Cancel
              </Link>
              <button
                onClick={addRow}
                disabled={loading || submitting}
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                style={{
                  borderColor: PURPLE,
                  color: PURPLE,
                  borderRadius: "8px",
                  fontWeight: 600,
                  padding: "7px 16px",
                }}
              >
                <i className="fa-solid fa-plus"></i> Add Line
              </button>
              <button
                onClick={handleSubmit}
                disabled={rows.length === 0 || loading || submitting}
                className="btn btn-sm d-flex align-items-center gap-2"
                style={{
                  background: PURPLE,
                  color: "#ffffff",
                  borderRadius: "8px",
                  fontWeight: 600,
                  padding: "7px 22px",
                  boxShadow: "0 2px 6px rgba(83, 74, 183, 0.25)",
                }}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing Batch...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i> Dispatch & Deduct Stock
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Batch Metrics KPI Deck ── */}
          <Row className="g-3 mb-4">
            <Col md={4}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  borderTop: `3px solid ${PURPLE}`,
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Items in Batch
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                  {rows.length} Dispatches
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Rows ready for issue</div>
              </div>
            </Col>

            <Col md={4}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  borderTop: `3px solid ${TEAL}`,
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Total Units to Deduct
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: TEAL, marginTop: "4px" }}>
                  {totalUnitsToDispatch} Units
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Cumulative outward quantity</div>
              </div>
            </Col>

            <Col md={4}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  borderTop: `3px solid ${CORAL}`,
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Issuing Operator
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", marginTop: "6px" }}>
                  {loginData?.name || "Staff Member"}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Logged-in user authority</div>
              </div>
            </Col>
          </Row>

          {/* ── Main Dispatch Table Card ── */}
          <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ background: "#ffffff" }}>
              <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                <i className="fa-solid fa-list-check me-2" style={{ color: PURPLE }}></i>
                Dispatched Line Items Specification
              </h6>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Select recipient, product, and issue quantity
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              {loading ? (
                <div className="text-center p-5 text-muted">
                  <span className="spinner-border text-primary me-2"></span> Loading catalogs...
                </div>
              ) : (
                <table className="mp-table">
                  <thead style={{ background: "#1e293b", color: "#f8fafc" }}>
                    <tr>
                      <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, width: "50px" }}>#</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600 }}>Recipient Employee *</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600 }}>Branch Facility</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600 }}>Product Stock *</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, width: "110px" }}>Qty *</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, width: "150px" }}>Issue Date</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, width: "110px" }}>Status</th>
                      <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600 }}>Purpose / Remarks</th>
                      <th style={{ padding: "12px 14px", width: "50px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const avail = availableQty(row.product);
                      return (
                        <tr key={idx} className="mp-row">
                          <td className="mp-td" style={{ color: "#64748b", fontWeight: 600, textAlign: "center" }}>
                            {idx + 1}
                          </td>

                          <td className="mp-td">
                            <select
                              className="mp-input"
                              style={cellInput}
                              value={row.employee}
                              onChange={(e) => handleChange(idx, "employee", e.target.value)}
                            >
                              <option value="">Select Employee...</option>
                              {employees.map((e) => (
                                <option key={e.id} value={e.id}>
                                  {e.name} ({e.department || "Staff"})
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="mp-td">
                            <select
                              className="mp-input"
                              style={cellInput}
                              value={row.branch}
                              onChange={(e) => handleChange(idx, "branch", e.target.value)}
                            >
                              <option value="">Select Branch...</option>
                              {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="mp-td">
                            <select
                              className="mp-input"
                              style={cellInput}
                              value={row.product}
                              onChange={(e) => handleChange(idx, "product", e.target.value)}
                            >
                              <option value="">Select Product...</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.measurement_unit || "Units"}) — Avail: {p.available_quantity}
                                </option>
                              ))}
                            </select>
                            {row.product && (
                              <div style={{ fontSize: "11px", fontWeight: 600, marginTop: "4px" }}>
                                {avail > 0 ? (
                                  <span style={{ color: TEAL }}>
                                    <i className="fa-solid fa-circle-check me-1"></i> Stock on hand: {avail}
                                  </span>
                                ) : (
                                  <span style={{ color: CORAL }}>
                                    <i className="fa-solid fa-triangle-exclamation me-1"></i> Depleted (0)
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="mp-td">
                            <input
                              className="mp-input"
                              type="number"
                              style={cellInput}
                              value={row.qty}
                              min={1}
                              max={avail}
                              disabled={!row.product || avail <= 0}
                              onChange={(e) => handleChange(idx, "qty", e.target.value)}
                              placeholder="0"
                            />
                          </td>

                          <td className="mp-td">
                            <input
                              className="mp-input"
                              type="date"
                              style={cellInput}
                              value={row.date}
                              max={moment().format("YYYY-MM-DD")}
                              onChange={(e) => handleChange(idx, "date", e.target.value)}
                            />
                          </td>

                          <td className="mp-td">
                            <label className="toggle-pill">
                              <input
                                type="checkbox"
                                checked={row.status === "active"}
                                onChange={(e) =>
                                  handleChange(idx, "status", e.target.checked ? "active" : "inactive")
                                }
                              />
                              <span className="toggle-track">
                                <span className="toggle-thumb"></span>
                              </span>
                              <span
                                style={{
                                  fontSize: "11.5px",
                                  fontWeight: 600,
                                  color: row.status === "active" ? TEAL : "#94a3b8",
                                }}
                              >
                                {row.status === "active" ? "Active" : "Draft"}
                              </span>
                            </label>
                          </td>

                          <td className="mp-td">
                            <input
                              className="mp-input"
                              style={cellInput}
                              value={row.description}
                              placeholder="Reason / Project..."
                              onChange={(e) => handleChange(idx, "description", e.target.value)}
                            />
                          </td>

                          <td className="mp-td text-center">
                            {rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRow(idx)}
                                className="btn btn-sm btn-link text-danger p-0"
                                title="Remove line"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </Main>
    </>
  );
};

export default AddMultipleProvision;