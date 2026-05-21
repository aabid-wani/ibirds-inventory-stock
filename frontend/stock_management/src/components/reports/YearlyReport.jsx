import React, { useState, useEffect } from "react";
import { Breadcrumb, Card, Table } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Main from "../layout/Main";
import { Link } from "react-router-dom";
import Apis from '../apis/StockManagementApis';
const YearlyReport = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [years, setYears] = useState([]);
  const [yearlyReportData, setYearlyReportData] = useState([]);

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
      <div className="my-2 mt-4" style={{ position: "relative", left: "15px" }}>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item active style={{ fontWeight: "bold" }}>Monthly Report</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <div style={{ maxWidth: "80vw", maxHeight: "90vh" }}>
        <Card className="mb-3 p-3 shadow mx-2">
          <h4 className="mb-3">Yearly Inventory Report</h4>
          <div className="d-flex align-items-center mb-3">
            <label className="me-2">
              <b>Select Year:</b>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="form-select"
              style={{ padding: "5px", borderRadius: "5px" }}
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
            <button
              onClick={downloadYearlyExcel}
              className="btn btn-success btn-sm ms-3"
            >
              Download
            </button>
          </div>

          {yearlyReportData.length > 0 ? (
            <div style={{ overflowX: "auto",  maxHeight:'65vh'}}>
              <Table striped bordered hover style={{borderCollapse: "collapse", width: "100%"}}>
                <thead style={{ position: "sticky",top: "0px",zIndex: "2"}}>
                  <tr>
                    <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Product</th>
                    <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Opening Stock</th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} key={i}>
                        {new Date(0, i).toLocaleString("default", {
                          month: "long",
                        })}
                      </th>
                    ))}
                    <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Closing Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyReportData.map((item, index) => {
                    const monthlyData = Array.isArray(item.monthly)
                      ? item.monthly
                      : Array(12).fill("");
                    return (
                      <tr key={index}>
                        <td>{item.product}</td>
                        <td>{item.opening_stock}</td>
                        {monthlyData.slice(0, 12).map((value, i) => (
                          <td key={i}>{value}</td>
                        ))}
                        <td>{item.closing_stock}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <p>No data available for the selected year.</p>
          )}
        </Card>
      </div>
    </Main>
  );
};

export default YearlyReport;
