import React, { useState, useEffect } from "react";
import { Card, Table, Modal, Button, Breadcrumb } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Main from "../layout/Main";
import { Link } from "react-router-dom";
import Apis from "../apis/StockManagementApis";

// Helper function to group by a property

const groupBy = (arr, key) =>
  arr.reduce((acc, obj) => {
    const groupKey = obj[key];
    acc[groupKey] = acc[groupKey] || [];
    acc[groupKey].push(obj);
    return acc;
  }, {});

const MonthlyReport = () => {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [months, setMonths] = useState([]);
  const [monthlyReportData, setMonthlyReportData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);

  // Load available months
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const options = [];
    for (let i = 0; i <= currentMonth; i++) {
      const value = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
      const label = new Date(currentYear, i).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      options.push({ value, label });
    }

    setMonths(options);
    setSelectedMonth(options[options.length - 1]?.value || "");
  }, []);

  // Fetch report data
  useEffect(() => {
    if (selectedMonth) {
      const fetchData = async () => {
        try {
          const response = await Apis.getMonthlyReports(selectedMonth);
          setMonthlyReportData(response || []);
          // console.log('response ',response);
        } catch (err) {
          // console.error("Error fetching monthly report:", err);
        }
      };
      fetchData();
    }
  }, [selectedMonth]);

  const handleCellClick = async (product, dayIndex, month) => {
    try {
      setSelectedProduct(product);
      setSelectedDay(dayIndex + 1);
      const response = await Apis.getYearlyReports(month, product, dayIndex);
      
      setModalData(response || []);
      setShowModal(true);
    } catch (error) {
      // console.error("Error fetching day-wise employee data:", error);
    }
  };

  const downloadMonthlyExcel = () => {
    if (!monthlyReportData.length) {
      alert("No monthly report data to download.");
      return;
    }

    const grouped = groupBy(monthlyReportData, "month");
    const workbook = XLSX.utils.book_new();

    for (const [month, reports] of Object.entries(grouped)) {
      const daysInMonth = new Date(
        parseInt(month.split("-")[0]),
        parseInt(month.split("-")[1]),
        0
      ).getDate();

      const headers = [
        "Product",
        "Opening Stock",
        ...Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`),
        "Closing Stock",
        "Employee Name",
        "Issued By",
      ];

      const worksheetData = [headers];

      reports.forEach((item) => {
        const row = [
          item.product || "",
          item.opening_stock ?? "",
          ...item.daily.slice(0, daysInMonth),
          item.closing_stock ?? "",
          item.employee_name || "",
          item.issued_by || "",
        ];
        worksheetData.push(row);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, month);
    }

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Inventory-Monthly-Report-${selectedMonth}.xlsx`);
  };

  // console.log(monthlyReportData);
  const groupedData = groupBy(monthlyReportData, "month");

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

      <Card className="mb-3 p-3 shadow mx-2">
        <h4>Monthly Inventory Report</h4>
        <div className="d-flex align-items-center mb-3">
          <label className="me-2">
            <b>Select Month:</b>
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="form-select"
            style={{ maxWidth: "200px" }}
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <button
            onClick={downloadMonthlyExcel}
            className="btn btn-success btn-sm ms-3"
          >
            Download
          </button>
        </div>

        {Object.keys(groupedData).length > 0 ? (
          Object.entries(groupedData).map(([month, data]) => {
            const [y, m] = month.split("-");
            const daysInMonth = new Date(parseInt(y), parseInt(m), 0).getDate();

            return (
              <div key={month}>
                {/* <h5 className="mt-4">
                  {new Date(month).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h5> */}
                <div style={{ overflow: "auto", maxHeight: "65vh"}}>
                  <Table striped bordered hover style={{borderCollapse: "collapse", width: "100%"}}>
                    <thead style={{ position: "sticky",top: "0px",zIndex: "2"}}>
                      <tr>
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }}>Product</th>
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Opening Stock</th>
                        {Array.from({ length: daysInMonth }, (_, i) => (
                          <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} key={i}> {i + 1}</th>
                        ))}
                        <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Closing Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, index) => (
                        <tr key={index}>
                          <td>{item.product}</td>
                          <td>{item.opening_stock}</td>
                          {item.daily.slice(0, daysInMonth).map((value, i) => (
                            <td
                              key={i}
                              onClick={() =>
                                value && parseInt(value) > 0
                                  ? handleCellClick(item.product, i, month)
                                  : null
                              }
                              style={{
                                cursor:
                                  value && parseInt(value) > 0
                                    ? "pointer"
                                    : "default",
                                backgroundColor:
                                  value && parseInt(value) > 0
                                    ? "lightgreen"
                                    : "inherit",
                              }}
                            >
                              {value}
                            </td>
                          ))}
                          <td>{item.closing_stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            );
          })
        ) : (
          <p>No data available for the selected month.</p>
        )}
      </Card>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="md" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedProduct} – Day {selectedDay}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalData.length > 0 ? (
            <ul className="list-group">
              {modalData.map((emp, idx) => (
                <li key={idx} className="list-group-item">
                  <strong>{emp.name}</strong> – Quantity: {emp.quantity}
                </li>
              ))}
            </ul>
          ) : (
            <p>No employees found for this day.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Main>
  );
};

export default MonthlyReport;
