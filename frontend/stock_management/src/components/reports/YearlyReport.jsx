import React, { useState, useEffect } from "react";
import { Card, Table, Button, Breadcrumb, Form, Container } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Main from "../layout/Main";
import { Link } from "react-router-dom";
import Apis from '../apis/StockManagementApis';

const YearlyReport = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [years, setYears] = useState([]);
  const [yearlyReportData, setYearlyReportData] = useState([]);

  const primaryColor = "#5650ce";

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let i = 0; i <= 5; i++) {
      const year = currentYear - i;
      yearOptions.push({ value: year.toString(), label: year.toString() });
    }
    setYears(yearOptions);
    setSelectedYear(currentYear.toString());
  }, []);

  useEffect(() => {
    if (selectedYear) {
      const fetchData = async () => {
        try {
          const response = await Apis.YearlyReport(selectedYear);
          setYearlyReportData(response || []);
        } catch (err) {
          console.error("Error fetching yearly report:", err);
        }
      };
      fetchData();
    }
  }, [selectedYear]);

  const downloadYearlyExcel = () => {
    if (!yearlyReportData.length) {
      alert("No yearly report data to download.");
      return;
    }

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
      const monthlyData = Array.isArray(item.monthly)
        ? item.monthly
        : Array(12).fill("");
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
    saveAs(blob, `Inventory-Yearly-Report-${selectedYear}.xlsx`);
  };

  return (
    <Main>
      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Yearly Report</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "8px", overflow: "hidden" }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Yearly Inventory Report</h5>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center">
                <small className="text-muted me-2 fw-medium text-uppercase" style={{ fontSize: "12px" }}>Year:</small>
                <Form.Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  size="sm"
                  className="border-light-subtle shadow-none"
                  style={{ minWidth: "120px", backgroundColor: "#f8f9fa", cursor: "pointer" }}
                >
                  {years.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <Button
                onClick={downloadYearlyExcel}
                className="btn-sm d-flex align-items-center gap-2 border-0 px-3"
                style={{ backgroundColor: "#107c41" }} // Standard Excel Green
              >
                <i className="fa-solid fa-file-excel"></i> Export Excel
              </Button>
            </div>
          </div>

          {/* Data Table Section */}
          <div className="p-0 bg-white">
            {yearlyReportData.length > 0 ? (
              <div className="table-responsive" style={{ maxHeight: "65vh" }}>
                <Table bordered hover className="align-middle mb-0" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#212529", color: "#ffffff" }}>
                    <tr>
                      <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", border: "1px solid #343a40" }}>Product</th>
                      <th className="text-center" style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", border: "1px solid #343a40" }}>Opening Stock</th>
                      {Array.from({ length: 12 }, (_, i) => (
                        <th className="text-center" style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", border: "1px solid #343a40" }} key={i}>
                          {new Date(0, i).toLocaleString("default", { month: "short" })}
                        </th>
                      ))}
                      <th className="text-center" style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", border: "1px solid #343a40" }}>Closing Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyReportData.map((item, index) => {
                      const monthlyData = Array.isArray(item.monthly)
                        ? item.monthly
                        : Array(12).fill("");
                      return (
                        <tr key={index}>
                          <td className="fw-medium px-3 text-dark bg-light" style={{ position: "sticky", left: 0, zIndex: 1 }}>{item.product}</td>
                          <td className="text-center fw-medium text-muted bg-light">{item.opening_stock}</td>
                          {monthlyData.slice(0, 12).map((value, i) => (
                            <td key={i} className="text-center text-muted">
                              {value || "-"}
                            </td>
                          ))}
                          <td className="text-center fw-bold text-dark bg-light">{item.closing_stock}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="p-5 text-center text-muted">
                <i className="fa-regular fa-folder-open mb-3" style={{ fontSize: "48px", opacity: 0.5 }}></i>
                <p>No data available for the selected year.</p>
              </div>
            )}
          </div>
        </Card>
      </Container>
    </Main>
  );
};

export default YearlyReport;