import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import stockManagementApis from "../apis/StockManagementApis";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Container, Form, Table, Row, Col, Button } from "react-bootstrap";
import Main from "../layout/Main";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PURPLE = "#534AB7";
const TEAL = "#1D9E75";
const CORAL = "#D85A30";

function InventoryReport() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (selectedYear) => {
    try {
      setLoading(true);
      const result = await stockManagementApis.getInventoryReport(selectedYear);
      setReport(result || []);
    } catch (err) {
      setReport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(year);
  }, [year]);

  const totalBuy = useMemo(() => report.reduce((sum, r) => sum + (parseFloat(r.total_buy_quantity) || 0), 0), [report]);
  const totalIssue = useMemo(() => report.reduce((sum, r) => sum + (parseFloat(r.total_issue_quantity) || 0), 0), [report]);
  const totalClosing = useMemo(() => report.reduce((sum, r) => sum + (parseFloat(r.closing_stock) || 0), 0), [report]);

  const exportExcel = () => {
    if (!report.length) return;
    const dataToExport = report.map((item, idx) => ({
      "S.No": idx + 1,
      "Product Name": item.name,
      "Total Acquired": item.total_buy_quantity,
      "Total Issued": item.total_issue_quantity,
      [`Issued (${year})`]: item.issued_this_year,
      [`Issued (${year - 1})`]: item.issued_last_year,
      "Closing Stock": item.closing_stock,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Valuation");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Inventory_Valuation_Audit_${year}.xlsx`);
  };

  return (
    <Main>
      <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
        {/* ── Top Bar ── */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <Link to="/Home" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
              Home
            </Link>{" "}
            / <span style={{ color: "#0f172a", fontWeight: 600 }}>Inventory Valuation & Closing Report</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Form.Select
              style={{
                minWidth: "140px",
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                fontSize: "12.5px",
                fontWeight: 600,
                borderRadius: "8px",
                padding: "7px 12px",
              }}
              size="sm"
              onChange={(e) => setYear(Number(e.target.value))}
              value={year}
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <option key={y} value={y}>
                  Fiscal Year {y}
                </option>
              ))}
            </Form.Select>

            <Button
              className="btn-sm d-flex align-items-center gap-2"
              onClick={exportExcel}
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
          </div>
        </div>

        {/* ── KPI Deck ── */}
        <Row className="g-3 mb-4">
          <Col md={3}>
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
                Total Products Audited
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                {report.length} SKUs
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Active catalog items</div>
            </div>
          </Col>

          <Col md={3}>
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
                Total Acquired Stock
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: TEAL, marginTop: "4px" }}>
                {totalBuy.toLocaleString("en-IN")} Units
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Inward procurement</div>
            </div>
          </Col>

          <Col md={3}>
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
                Total Issued Stock
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: CORAL, marginTop: "4px" }}>
                {totalIssue.toLocaleString("en-IN")} Units
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Internal consumption</div>
            </div>
          </Col>

          <Col md={3}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px 20px",
                borderTop: "3px solid #3b82f6",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Current Closing Stock
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
                {totalClosing.toLocaleString("en-IN")} Units
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>On-hand warehouse balance</div>
            </div>
          </Col>
        </Row>

        {/* ── Table Card ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ background: "#ffffff" }}>
            <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
              <i className="fa-solid fa-file-invoice-dollar me-2" style={{ color: PURPLE }}></i>
              Inventory Valuation Ledger ({report.length} items)
            </h6>
          </div>

          <div className="table-responsive">
            <Table hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead style={{ background: "#1e293b", color: "#f8fafc" }}>
                <tr>
                  <th style={{ padding: "12px 16px", width: "70px" }}>S.No</th>
                  <th style={{ padding: "12px 16px" }}>Product Name</th>
                  <th style={{ padding: "12px 16px" }}>Total Buy Qty</th>
                  <th style={{ padding: "12px 16px" }}>Total Issued Qty</th>
                  <th style={{ padding: "12px 16px" }}>Issued This Year ({year})</th>
                  <th style={{ padding: "12px 16px" }}>Issued Last Year ({year - 1})</th>
                  <th style={{ padding: "12px 16px" }} className="text-end">Closing Stock</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-5 text-center text-muted">
                      <span className="spinner-border text-primary me-2"></span> Calculating valuation...
                    </td>
                  </tr>
                ) : report.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-5 text-center text-muted">
                      No records found for the selected year.
                    </td>
                  </tr>
                ) : (
                  report.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{idx + 1}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{item.name}</td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>{item.total_buy_quantity}</td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>{item.total_issue_quantity}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: PURPLE }}>
                        {item.issued_this_year || 0}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{item.issued_last_year || 0}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }} className="text-end">
                        {item.closing_stock}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </Main>
  );
}

export default InventoryReport;