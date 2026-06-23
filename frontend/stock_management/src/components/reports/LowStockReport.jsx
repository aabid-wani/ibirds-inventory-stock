import React, { useState, useEffect } from "react";
import { Container, Card, Button, Form } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Main from "../layout/Main";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../CONSTANT/CONSTANT";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function LowStockReport() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState([]);
  const [monthOptions, setMonthOptions] = useState([]);

  const primaryColor = "#5650ce";

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
      console.error("API error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const start = new Date("2025-01-01");
    const now = new Date();
    const options = [];
    while (start <= now) {
      const year = start.getFullYear();
      const month = String(start.getMonth() + 1).padStart(2, "0");
      options.push(`${year}-${month}`);
      start.setMonth(start.getMonth() + 1);
    }
    setMonthOptions(options.reverse()); // Show most recent months first
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      if (!month) return;
      try {
        const res = await fetchWithToken(`${API_BASE_URL}/reports/low-stock?month=${month}`);
        setReport(res.data || []);
      } catch (error) {
        console.error("Error fetching report:", error);
        setReport([]);
      }
    };
    fetchReport();
  }, [month]);

  const downloadCSV = () => {
    if (!report.length) {
      toast.warn("No data to download.");
      return;
    }
    const rows = [
      ["Product Name", "Total Buy", "Total Issue", "Current Stock", "Min Quantity", "Created At"],
      ...report.map((item) => [
        item.name,
        item.total_buy_quantity,
        item.total_issue_quantity,
        item.current_stock,
        item.min_quantity,
        new Date(item.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, `low_stock_report_${month}.csv`);
  };

  return (
    <Main>
      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Low Stock Report</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "8px", overflow: "hidden" }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Low Stock Report</h5>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <Form.Select
                size="sm"
                className="border-light-subtle shadow-none"
                style={{ minWidth: "160px", backgroundColor: "#f8f9fa", cursor: "pointer" }}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {monthOptions.map((m) => {
                  const date = new Date(`${m}-01`);
                  const label = date.toLocaleString("default", { month: "long", year: "numeric" });
                  return <option key={m} value={m}>{label}</option>;
                })}
              </Form.Select>

              <Button
                variant="success"
                className="btn-sm px-3 d-flex align-items-center gap-2"
                onClick={downloadCSV}
              >
                <i className="fa-solid fa-file-csv"></i> Export CSV
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <div className="p-0 table-responsive" style={{ maxHeight: "60vh", overflow: "auto" }}>
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#212529", color: "#ffffff" }}>
                <tr>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Product Name</th>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Total Buy</th>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Total Issue</th>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Current Stock</th>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Min Quantity</th>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {report.length > 0 ? (
                  report.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 fw-medium text-dark">{item.name}</td>
                      <td className="px-3">{item.total_buy_quantity}</td>
                      <td className="px-3">{item.total_issue_quantity}</td>
                      <td className="px-3 fw-bold text-danger">{item.current_stock}</td>
                      <td className="px-3">{item.min_quantity}</td>
                      <td className="px-3 text-muted">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No data available for the selected month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Container>
      <ToastContainer />
    </Main>
  );
}

export default LowStockReport;