import React, { useState, useEffect, useMemo } from "react";
import { Card, Table, Button, Form, Container, Row, Col } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Main from "../layout/Main";
import { Link } from "react-router-dom";
import Apis from "../apis/StockManagementApis";

const PURPLE = "#534AB7";
const TEAL = "#1D9E75";
const CORAL = "#D85A30";

const YearlyReport = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [years, setYears] = useState([]);
  const [yearlyReportData, setYearlyReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const yearOptions = [];
    for (let i = 0; i <= 5; i++) {
      const year = currentYear - i;
      yearOptions.push({ value: year.toString(), label: year.toString() });
    }
    setYears(yearOptions);
  }, [currentYear]);

  useEffect(() => {
    if (selectedYear) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const response = await Apis.YearlyReport(selectedYear);
          setYearlyReportData(response || []);
        } catch (err) {
          setYearlyReportData([]);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedYear]);

  const totalClosingStock = useMemo(() => {
    return yearlyReportData.reduce((sum, item) => sum + (parseFloat(item.closing_stock) || 0), 0);
  }, [yearlyReportData]);

  const totalOpeningStock = useMemo(() => {
    return yearlyReportData.reduce((sum, item) => sum + (parseFloat(item.opening_stock) || 0), 0);
  }, [yearlyReportData]);

  const downloadYearlyExcel = () => {
    if (!yearlyReportData.length) return;

    const headers = [
      "Product",
      "Opening Stock",
      ...Array.from({ length: 12 }, (_, i) =>
        new Date(0, i).toLocaleString("default", { month: "long" })
      ),
      "Closing Stock",
      "Employee Name",
    ];

    const worksheetData = [headers];

    yearlyReportData.forEach((item) => {
      const monthlyData = Array.isArray(item.monthly) ? item.monthly : Array(12).fill("");
      const row = [
        item.product || "",
        item.opening_stock ?? "",
        ...monthlyData.slice(0, 12),
        item.closing_stock ?? "",
        item.employee_name || "",
      ];
      worksheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Yearly Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Inventory-Yearly-Audit-${selectedYear}.xlsx`);
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
            / <span style={{ color: "#0f172a", fontWeight: 600 }}>Annual Stock Consumption Matrix</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Form.Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
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
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  Calendar Year {year.label}
                </option>
              ))}
            </Form.Select>

            <Button
              onClick={downloadYearlyExcel}
              className="btn-sm d-flex align-items-center gap-2"
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
                Total Products Analyzed
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                {yearlyReportData.length} SKUs
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Active inventory matrix</div>
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
                Beginning Balance ({selectedYear})
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: TEAL, marginTop: "4px" }}>
                {totalOpeningStock.toLocaleString("en-IN")} Units
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Opening inventory on record</div>
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
                Ending Balance ({selectedYear})
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: CORAL, marginTop: "4px" }}>
                {totalClosingStock.toLocaleString("en-IN")} Units
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Year-end closing reserve</div>
            </div>
          </Col>
        </Row>

        {/* ── Table Card ── */}
        <Card style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ background: "#ffffff" }}>
            <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
              <i className="fa-solid fa-chart-simple me-2" style={{ color: PURPLE }}></i>
              Annual Stock Movement by Month ({selectedYear})
            </h6>
          </div>

          <div className="table-responsive" style={{ maxHeight: "65vh" }}>
            <Table hover className="align-middle mb-0" style={{ fontSize: "12.5px", whiteSpace: "nowrap" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 2, background: "#1e293b", color: "#f8fafc" }}>
                <tr>
                  <th style={{ padding: "12px 14px", background: "inherit" }}>Product Item</th>
                  <th className="text-center" style={{ padding: "12px 14px", background: "inherit" }}>Opening</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th className="text-center" style={{ padding: "12px 10px", background: "inherit" }} key={i}>
                      {new Date(0, i).toLocaleString("default", { month: "short" })}
                    </th>
                  ))}
                  <th className="text-center" style={{ padding: "12px 14px", background: "inherit" }}>Closing</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={15} className="p-5 text-center text-muted">
                      <span className="spinner-border text-primary me-2"></span> Compiling annual audit...
                    </td>
                  </tr>
                ) : yearlyReportData.length > 0 ? (
                  yearlyReportData.map((item, index) => {
                    const monthlyData = Array.isArray(item.monthly) ? item.monthly : Array(12).fill("");
                    return (
                      <tr key={index}>
                        <td className="fw-semibold px-3 text-dark bg-white" style={{ position: "sticky", left: 0, zIndex: 1, borderRight: "1px solid #e2e8f0" }}>
                          {item.product}
                        </td>
                        <td className="text-center fw-medium text-muted">{item.opening_stock}</td>
                        {monthlyData.slice(0, 12).map((value, i) => (
                          <td key={i} className="text-center" style={{ color: value ? PURPLE : "#94a3b8", fontWeight: value ? 600 : 400 }}>
                            {value || "—"}
                          </td>
                        ))}
                        <td className="text-center fw-bold text-dark" style={{ borderLeft: "1px solid #e2e8f0" }}>
                          {item.closing_stock}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={15} className="p-5 text-center text-muted">
                      No records found for the selected calendar year.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </Main>
  );
};

export default YearlyReport;