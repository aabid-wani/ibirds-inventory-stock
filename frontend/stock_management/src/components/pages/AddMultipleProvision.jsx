import React, { useEffect, useState, useContext } from "react";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import moment from "moment";
import { API_BASE_URL } from "../CONSTANT/CONSTANT";

const PURPLE = "#534AB7";
const CORAL = "#D85A30";
const TEAL = "#1D9E75";

const cardBase = {
  background: "#fff",
  border: "0.5px solid rgba(0,0,0,0.09)",
  borderRadius: 12,
  overflow: "hidden",
};

const cellInput = {
  width: "100%",
  padding: "6px 10px",
  fontSize: 13,
  border: "0.5px solid rgba(0,0,0,0.13)",
  borderRadius: 7,
  background: "#fafafa",
  outline: "none",
  color: "#1a1a1a",
  fontFamily: "system-ui, sans-serif",
  minWidth: 120,
};

const AddMultipleProvision = () => {
  const { loginData } = useContext(AuthContext);

  const createNewRow = () => ({
    user_id: loginData?.id || "",
    user_name: loginData?.name || "",
    employee: "",
    branch: "Head Office Ajmer",
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
        try { return await response.json(); } catch { return response.status; }
      }
      return await response.json();
    } catch (error) {
      console.error("API error:", error);
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
        setBranches(branchRes);
        setProducts(productRes.filter((p) => p.available_quantity > 0));
        setEmployees(employeeRes);

        // Dynamically find "Head Office Ajmer" and set it on the first default row
        const defaultBranch = branchRes.find(b => b.name && b.name.trim() === "Head Office Ajmer");
        if (defaultBranch) {
          setRows((prevRows) =>
          // Removed (idx === 0) condition so it applies to ALL initial rows
          prevRows.map((row) => ({ ...row, branch: defaultBranch.id }))
        );
      }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loginData?.id]);

  // const handleChange = (index, field, value) => {
  //   const updated = [...rows];
  //   updated[index][field] = value;
  //   if (field === "product") updated[index]["qty"] = "";
  //   setRows(updated);
  // };


  const handleChange = (index, field, value) => {
  const updated = [...rows];
  
  if (field === "qty") {
    const currentProductId = updated[index]["product"];
    const maxAvailable = availableQty(currentProductId);
    
    // Convert input to a number for comparison
    const numValue = Number(value);

    // If they type a number higher than available, cap it at maxAvailable
    if (numValue > maxAvailable) {
      updated[index][field] = maxAvailable.toString();
    } else {
      updated[index][field] = value;
    }
  } else {
    updated[index][field] = value;
    if (field === "product") updated[index]["qty"] = ""; // Reset qty on product change
  }

  setRows(updated);
};

  const addRow = () => setRows((prev) => [...prev, createNewRow()]);

  const removeRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated.length > 0 ? updated : [createNewRow()]);
  };

  const availableQty = (productId) => {
    const found = products.find((p) => p.id === productId);
    return found ? found.available_quantity : 0;
  };

  const handleSubmit = async () => {
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
          toast.success("Provisions added and stock updated!");
          setRows([createNewRow()]);
        } else {
          toast.error("Failed to update stock.");
        }
      } else {
        toast.error("Failed to add provisions.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting provisions.");
    } finally {
      setSubmitting(false);
    }
  };

  const thStyle = {
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
    background: "#1e2128",
    textAlign: "left",
    whiteSpace: "nowrap",
  };

  return (
    <>
      <style>{`
        .mp-input:focus { border-color: ${PURPLE} !important; box-shadow: 0 0 0 2px rgba(83,74,183,0.12); background: #fff !important; }
        .mp-row:hover { background: #fafafe; }
        .mp-table { border-collapse: collapse; width: 100%; }
        .mp-table th:first-child { border-radius: 8px 0 0 0; }
        .mp-table th:last-child { border-radius: 0 8px 0 0; }
        .mp-td { padding: 10px 10px; border-bottom: 0.5px solid rgba(0,0,0,0.06); vertical-align: middle; }
        .toggle-pill { position: relative; display: inline-flex; align-items: center; cursor: pointer; gap: 8px; }
        .toggle-pill input { display: none; }
        .toggle-track { width: 34px; height: 18px; background: #ddd; border-radius: 99px; transition: background 0.2s; flex-shrink: 0; position: relative; }
        .toggle-thumb { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
        .toggle-pill input:checked ~ .toggle-track { background: ${TEAL}; }
        .toggle-pill input:checked ~ .toggle-track .toggle-thumb { transform: translateX(16px); }
        .spin { animation: spin 0.8s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <Main>
        <div style={{ padding: "16px 20px 24px" }}>
          {/* Breadcrumb */}
          <nav style={{ fontSize: 13, color: "#aaa", marginBottom: 16 }}>
            <Link to="/Home" style={{ color: PURPLE, textDecoration: "none" }}>Home</Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <Link to="/issue" style={{ color: PURPLE, textDecoration: "none" }}>Provision</Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ color: "#333", fontWeight: 500 }}>Add Multiple</span>
          </nav>

          <div style={cardBase}>
            {/* Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "0.5px solid rgba(0,0,0,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a", margin: 0 }}>Add Multiple Provisions</p>
                <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>{rows.length} row{rows.length !== 1 ? "s" : ""}</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={addRow}
                  disabled={loading || submitting}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 8,
                    border: `0.5px solid ${PURPLE}`, background: "transparent",
                    color: PURPLE, fontSize: 13, fontWeight: 500, cursor: "pointer",
                    opacity: loading || submitting ? 0.5 : 1,
                  }}
                >
                  <i className="fa fa-plus" style={{ fontSize: 11 }}></i> Add Row
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={rows.length === 0 || loading || submitting}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 20px", borderRadius: 8,
                    border: "none", background: PURPLE,
                    color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting
                    ? <><i className="fa fa-circle-notch spin"></i> Submitting…</>
                    : <><i className="fa fa-check" style={{ fontSize: 12 }}></i> Submit All</>
                  }
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", padding: "16px 20px 20px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa" }}>
                  <i className="fa fa-circle-notch spin" style={{ fontSize: 28, color: PURPLE }}></i>
                  <p style={{ marginTop: 12, fontSize: 13 }}>Loading data…</p>
                </div>
              ) : (
                <table className="mp-table">
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: 40 }}>#</th>
                      <th style={thStyle}>User</th>
                      <th style={thStyle}>Employee</th>
                      <th style={thStyle}>Branch</th>
                      <th style={thStyle}>Product</th>
                      <th style={thStyle}>Qty</th>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Description</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const avail = availableQty(row.product);
                      return (
                        <tr key={idx} className="mp-row">
                          <td className="mp-td">
                            <span style={{ fontSize: 12, color: "#aaa", fontWeight: 500 }}>{idx + 1}</span>
                          </td>
                          <td className="mp-td">
                            <span style={{ fontSize: 13, color: "#555", whiteSpace: "nowrap" }}>{row.user_name}</span>
                          </td>
                          <td className="mp-td">
                            <select className="mp-input" style={cellInput} value={row.employee}
                              onChange={(e) => handleChange(idx, "employee", e.target.value)}>
                              <option value="" disabled>Select…</option>
                              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                          </td>
                          <td className="mp-td">
                            <select className="mp-input" style={cellInput} value={row.branch}
                              onChange={(e) => handleChange(idx, "branch", e.target.value)}>
                              <option value="" disabled>Select…</option>
                              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                          </td>
                          <td className="mp-td">
                            <select className="mp-input" style={cellInput} value={row.product}
                              onChange={(e) => handleChange(idx, "product", e.target.value)}>
                              <option value="" disabled>Select…</option>
                              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {row.product && (
                              <span style={{ fontSize: 11, color: avail > 0 ? TEAL : CORAL, display: "block", marginTop: 3 }}>
                                {avail > 0 ? `Available: ${avail}` : "Out of stock"}
                              </span>
                            )}
                          </td>
                          <td className="mp-td" style={{ minWidth: 90 }}>
                              <input
                                className="mp-input"
                                type="number"
                                style={cellInput}
                                value={row.qty}
                                min={1}
                                max={avail}
                                // Disables the field if no product is selected OR if the available quantity is 0 or less
                                disabled={!row.product || avail <= 0} 
                                onChange={(e) => handleChange(idx, "qty", e.target.value)}
                                placeholder={avail <= 0 ? "N/A" : "0"}
                              />
                            </td>

                          <td className="mp-td" style={{ minWidth: 140 }}>
                            <input
                              className="mp-input"
                              type="date"
                              style={cellInput}
                              value={row.date}
                              min={moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD")}
                              max={moment().format("YYYY-MM-DD")}
                              onChange={(e) => handleChange(idx, "date", e.target.value)}
                            />
                          </td>
                          <td className="mp-td">
                            <label className="toggle-pill">
                              <input
                                type="checkbox"
                                checked={row.status === "active"}
                                onChange={(e) => handleChange(idx, "status", e.target.checked ? "active" : "inactive")}
                              />
                              <span className="toggle-track"><span className="toggle-thumb"></span></span>
                              <span style={{ fontSize: 12, color: row.status === "active" ? TEAL : "#aaa", fontWeight: 500 }}>
                                {row.status === "active" ? "Active" : "Inactive"}
                              </span>
                            </label>
                          </td>
                          <td className="mp-td" style={{ minWidth: 160 }}>
                            <input
                              className="mp-input"
                              style={cellStyle}
                              value={row.description}
                              placeholder="Optional…"
                              onChange={(e) => handleChange(idx, "description", e.target.value)}
                            />
                          </td>
                          <td className="mp-td">
                            <button
                              onClick={() => removeRow(idx)}
                              disabled={submitting}
                              style={{
                                width: 30, height: 30, borderRadius: 7,
                                border: `0.5px solid ${CORAL}`, background: "transparent",
                                color: CORAL, cursor: "pointer", fontSize: 13,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                            >
                              <i className="fa fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </Main>
    </>
  );
};

// fix typo in variable name
const cellStyle = {
  width: "100%",
  padding: "6px 10px",
  fontSize: 13,
  border: "0.5px solid rgba(0,0,0,0.13)",
  borderRadius: 7,
  background: "#fafafa",
  outline: "none",
  color: "#1a1a1a",
  fontFamily: "system-ui, sans-serif",
  minWidth: 120,
};

export default AddMultipleProvision;