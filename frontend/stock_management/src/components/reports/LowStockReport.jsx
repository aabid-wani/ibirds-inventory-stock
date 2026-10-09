import React, { useState, useEffect, useMemo } from "react";
import { Container, Card, Button, Form, Row, Col } from "react-bootstrap";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import Main from "../layout/Main";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../CONSTANT/CONSTANT";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PURPLE = "#534AB7";
const CORAL = "#D85A30";
const TEAL = "#1D9E75";

function LowStockReport() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState([]);
  const [monthOptions, setMonthOptions] = useState([]);
  const [loading, setLoading] = useState(false);

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
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const start = new Date("2025-01-01");
    const now = new Date();
    const options = [];
    while (start <= now) {
      const year = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, "0");
      options.push(`${year}-${m}`);
      start.setMonth(start.getMonth() + 1);
    }
    setMonthOptions(options.reverse());
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      if (!month) return;
      try {
        setLoading(true);
        const res = await fetchWithToken(`${API_BASE_URL}/reports/low-stock?month=${month}`);
        setReport(res.data || []);
      } catch (error) {
        setReport([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [month]);

  const zeroStockCount = useMemo(() => {
    return report.filter((r) => parseFloat(r.current_stock) <= 0).length;
  }, [report]);

  const downloadExcel = () => {
    if (!report.length) {
      toast.warn("No data to download.");
      return;
    }
    const dataToExport = report.map((item, idx) => ({
      "S.No": idx + 1,
      "Product Name": item.name,
      "Total Acquired": item.total_buy_quantity,
      "Total Dispatched": item.total_issue_quantity,
      "Current Stock on Hand": item.current_stock,
      "Safety Min Quantity": item.min_quantity,
      "Audit Date": new Date(item.created_at).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LowStock");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `low_stock_audit_${month}.xlsx`);
  };

  return (
    <Main>
      <ToastContainer position="top-right" autoClose={3000} />

      <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
        {/* ── Top Bar ── */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <Link to="/Home" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Home
            </Link>{" "}
            / <span style={{ color: "#0f172a", fontWeight: 600 }}>Low Stock & Replenishment Audit</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Form.Select
              size="sm"
              style={{
                minWidth: "180px",
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                fontSize: "12.5px",
                fontWeight: 600,
                borderRadius: "8px",
                padding: "7px 12px",
              }}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {monthOptions.map((m) => {
                const date = new Date(`${m}-01`);
                const label = date.toLocaleString("default", { month: "long", year: "numeric" });
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </Form.Select>

            <Button
              className="btn-sm d-flex align-items-center gap-2"
              onClick={downloadExcel}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#334155",
                fontWeight: 600,
                borderRadius: "8px",
                padding: "7px 14px",
              }}
            >
              <i className="fa-solid fa-file-excel text-success"></i> Export Excel
            </Button>

            <Link
              to="/product"
              className="btn btn-sm d-flex align-items-center gap-2"
              style={{
                background: PURPLE,
                color: "#ffffff",
                fontWeight: 600,
                borderRadius: "8px",
                padding: "7px 16px",
                boxShadow: "0 2px 6px rgba(83, 74, 183, 0.25)",
              }}
            >
              <i className="fa-solid fa-boxes-stacked"></i> Replenish at Catalog
            </Link>
          </div>
        </div>

        {/* ── KPI Deck ── */}
        <Row className="g-3 mb-4">
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
                Total Items Below Threshold
              </div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: CORAL, marginTop: "4px" }}>
                {report.length} SKUs
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Require immediate purchase orders</div>
            </div>
          </Col>

          <Col md={4}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px 20px",
                borderTop: "3px solid #dc2626",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Completely Depleted (Zero Stock)
              </div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#dc2626", marginTop: "4px" }}>
                {zeroStockCount} SKUs
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Cannot fulfill current dispatch orders</div>
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
                Selected Audit Period
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "6px" }}>
                {new Date(`${month}-01`).toLocaleString("default", { month: "long", year: "numeric" })}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Monthly consumption reconciliation</div>
            </div>
          </Col>
        </Row>

        {/* ── Table Card ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ background: "#ffffff" }}>
            <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
              <i className="fa-solid fa-triangle-exclamation text-danger me-2"></i>
              Stock Shortage Alerts & Replenishment Requirements ({report.length})
            </h6>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead style={{ background: "#1e293b", color: "#f8fafc" }}>
                <tr>
                  <th style={{ padding: "12px 16px", width: "70px" }}>S.No</th>
                  <th style={{ padding: "12px 16px" }}>Product Name</th>
                  <th style={{ padding: "12px 16px" }}>Total Acquired</th>
                  <th style={{ padding: "12px 16px" }}>Total Dispatched</th>
                  <th style={{ padding: "12px 16px" }}>Current Stock on Hand</th>
                  <th style={{ padding: "12px 16px" }}>Safety Stock Min</th>
                  <th style={{ padding: "12px 16px" }}>Status Indicator</th>
                  <th style={{ padding: "12px 16px" }} className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-5 text-center text-muted">
                      <span className="spinner-border text-primary me-2"></span> Generating stock audit...
                    </td>
                  </tr>
                ) : report.length > 0 ? (
                  report.map((item, idx) => {
                    const current = parseFloat(item.current_stock || 0);
                    const isZero = current <= 0;
                    return (
                      <tr key={idx}>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>
                          {item.name}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#334155" }}>{item.total_buy_quantity}</td>
                        <td style={{ padding: "12px 16px", color: "#334155" }}>{item.total_issue_quantity}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 800,
                              color: isZero ? "#dc2626" : CORAL,
                            }}
                          >
                            {current} Units
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{item.min_quantity} Units</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "99px",
                              background: isZero ? "#fee2e2" : "#fef3c7",
                              color: isZero ? "#b91c1c" : "#b45309",
                            }}
                          >
                            {isZero ? "OUT OF STOCK" : "LOW STOCK"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }} className="text-center">
                          <Link
                            to="/order"
                            className="btn btn-sm"
                            style={{
                              background: "#eeedfe",
                              color: PURPLE,
                              border: "1px solid #c7d2fe",
                              borderRadius: "6px",
                              fontWeight: 600,
                              fontSize: "12px",
                              padding: "3px 10px",
                            }}
                          >
                            + Order
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-5 text-center text-muted">
                      <i className="fa-solid fa-circle-check fs-2 text-success mb-2 d-block"></i>
                      All products are currently operating above their safety stock minimums for this period!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Main>
  );
}

export default LowStockReport;