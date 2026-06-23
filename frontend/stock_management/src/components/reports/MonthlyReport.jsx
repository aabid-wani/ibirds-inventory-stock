import React, { useState, useEffect } from "react";
import { Card, Table, Modal, Button, Container } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Main from "../layout/Main";
import { Link } from "react-router-dom";
import Apis from "../apis/StockManagementApis";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 

const groupBy = (arr, key) =>
  arr.reduce((acc, obj) => {
    const groupKey = obj[key];
    acc[groupKey] = acc[groupKey] || [];
    acc[groupKey].push(obj);
    return acc;
  }, {});

const MonthlyReport = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(moment().format("YYYY-MM"));
  
  const [monthlyReportData, setMonthlyReportData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);

  const primaryColor = "#5650ce";

  const handleMonthChange = (date) => {
    setSelectedDate(date);
    setSelectedMonth(moment(date).format("YYYY-MM"));
  };

  useEffect(() => {
    if (selectedMonth) {
      const fetchData = async () => {
        try {
          const response = await Apis.getMonthlyReports(selectedMonth);
          setMonthlyReportData(response || []);
        } catch (err) {
          console.error("Error fetching monthly report:", err);
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
      console.error("Error fetching day-wise employee data:", error);
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

  const groupedData = groupBy(monthlyReportData, "month");

  return (
    <Main>
      <style>{`
        .react-datepicker-popper {
          z-index: 1050 !important; 
        }
        .react-datepicker__month-container {
          width: 330px !important; 
        }
        .react-datepicker__month-wrapper {
          display: flex !important;
          justify-content: space-evenly !important;
          width: 100%;
        }
        .react-datepicker__month .react-datepicker__month-text {
          display: inline-block;
          width: 5.5rem !important; 
          margin: 4px !important;
          padding: 6px 0 !important;
          font-size: 13px !important;
        }
        .react-datepicker__header {
          padding: 0 !important; 
          background-color: #f8f9fa !important;
        }
      `}</style>

      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Monthly Report</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "8px", overflow: "hidden" }}>
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Monthly Inventory Report</h5>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center position-relative">
                <small className="text-muted me-2 fw-medium text-uppercase" style={{ fontSize: "12px" }}>Month:</small>
                
                <div className="position-relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleMonthChange}
                    dateFormat="MMMM yyyy"
                    showMonthYearPicker
                    showFullMonthYearPicker
                    className="form-control form-control-sm border-light-subtle shadow-none pe-4"
                    style={{ minWidth: "160px", backgroundColor: "#f8f9fa", cursor: "pointer" }}
                    renderCustomHeader={({ date, decreaseYear, increaseYear }) => (
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        padding: "8px 12px",
                        backgroundColor: "#f8f9fa",
                        borderBottom: "1px solid #dee2e6"
                      }}>
                        <button
                          type="button"
                          onClick={decreaseYear}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#6c757d" }}
                        >
                          <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        
                        <span style={{ fontWeight: "bold", fontSize: "15px", color: "#2c3e50" }}>
                          {date.getFullYear()}
                        </span>
                        
                        <button
                          type="button"
                          onClick={increaseYear}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#6c757d" }}
                        >
                          <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>
                    )}
                  />
                  <i 
                    className="fa-regular fa-calendar position-absolute text-muted" 
                    style={{ right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  ></i>
                </div>
              </div>

              <Button
                onClick={downloadMonthlyExcel}
                className="btn-sm d-flex align-items-center gap-2 border-0 px-3"
                style={{ backgroundColor: "#107c41" }}
              >
                <i className="fa-solid fa-file-excel"></i> Export Excel
              </Button>
            </div>
          </div>

          <div className="p-0 bg-white">
            {Object.keys(groupedData).length > 0 ? (
              Object.entries(groupedData).map(([month, data]) => {
                const [y, m] = month.split("-");
                const daysInMonth = new Date(parseInt(y), parseInt(m), 0).getDate();

                return (
                  <div key={month} className="table-responsive" style={{ maxHeight: "65vh" }}>
                    <Table bordered hover className="align-middle mb-0" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                      <thead style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#212529", color: "#ffffff" }}>
                        <tr>
                          <th style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", border: "1px solid #343a40" }}>Product</th>
                          <th className="text-center" style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", border: "1px solid #343a40" }}>Opening</th>
                          
                          {/* COLUMN HEADERS - WITH DAY CHECK */}
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const currentDate = new Date(parseInt(y), parseInt(m) - 1, i + 1);
                            const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 6 is Saturday

                            let headerBg = "inherit"; 
                            if (dayOfWeek === 0) headerBg = "#dc3545"; // Sunday (Solid Red)
                            if (dayOfWeek === 6) headerBg = "#198754"; // Saturday (Solid Green)

                            return (
                              <th 
                                className="text-center" 
                                style={{ 
                                  backgroundColor: headerBg, 
                                  color: "inherit", 
                                  fontWeight: "600", 
                                  padding: "12px", 
                                  border: "1px solid #343a40", 
                                  minWidth: "45px" 
                                }} 
                                key={i}
                              >
                                {i + 1}
                              </th>
                            );
                          })}

                          <th className="text-center" style={{ backgroundColor: "inherit", color: "inherit", fontWeight: "600", padding: "12px", border: "1px solid #343a40" }}>Closing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, index) => (
                          <tr key={index}>
                            <td className="fw-medium px-3 text-dark bg-light" style={{ position: "sticky", left: 0, zIndex: 1 }}>{item.product}</td>
                            <td className="text-center fw-medium text-muted bg-light">{item.opening_stock}</td>
                            
                            {/* TABLE CELLS - WITH DAY CHECK */}
                            {item.daily.slice(0, daysInMonth).map((value, i) => {
                              const isClickable = value && parseInt(value) > 0;
                              
                              const currentDate = new Date(parseInt(y), parseInt(m) - 1, i + 1);
                              const dayOfWeek = currentDate.getDay();
                            
                              // Base background
                              let cellBg = isClickable ? "rgba(165, 109, 59, 0.08)" : "inherit";
                              
                              // Apply weekend background colors with opacity for readability
                              if (dayOfWeek === 0) {
                                // Sunday (Light Red)
                                cellBg = isClickable ? "rgba(242, 0, 24, 0.25)" : "rgba(237, 29, 50, 0.1)"; 
                              } else if (dayOfWeek === 6) {
                                // Saturday (Light Green)
                                cellBg = isClickable ? "rgba(25, 135, 84, 0.25)" : "rgba(25, 135, 84, 0.1)";
                              }

                              return (
                                <td
                                  key={i}
                                  onClick={() => isClickable ? handleCellClick(item.product, i, month) : null}
                                  className={`text-center ${isClickable ? 'fw-bold' : 'text-muted'}`}
                                  style={{
                                    cursor: isClickable ? "pointer" : "default",
                                    backgroundColor: cellBg,
                                    color: isClickable ? primaryColor : "inherit",
                                    transition: "background-color 0.2s ease",
                                  }}
                                  title={isClickable ? "Click to view details" : ""}
                                >
                                  {value || "-"}
                                </td>
                              );
                            })}

                            <td className="text-center fw-bold text-dark bg-light">{item.closing_stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                );
              })
            ) : (
              <div className="p-5 text-center text-muted">
                <i className="fa-regular fa-folder-open mb-3" style={{ fontSize: "48px", opacity: 0.5 }}></i>
                <p>No data available for the selected month.</p>
              </div>
            )}
          </div>
        </Card>
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="md" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fs-5 fw-bold" style={{ color: "#2c3e50" }}>
            {selectedProduct}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p className="text-muted mb-3" style={{ fontSize: "14px" }}>
            Activity for Day {selectedDay}
          </p>
          {modalData.length > 0 ? (
            <div className="list-group list-group-flush border rounded">
              {modalData.map((emp, idx) => (
                <div key={idx} className="list-group-item d-flex justify-content-between align-items-center p-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-light rounded-circle d-flex justify-content-center align-items-center" style={{ width: "40px", height: "40px" }}>
                      <i className="fa-regular fa-user text-muted"></i>
                    </div>
                    <div>
                      <h6 className="mb-0 text-dark">{emp.name}</h6>
                      <small className="text-muted">Employee</small>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2" style={{ fontSize: "14px" }}>
                      Qty: {emp.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-muted border rounded bg-light">
              <p className="mb-0">No employee transactions found for this day.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button variant="secondary" className="btn-sm px-3" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Main>
  );
};

export default MonthlyReport;