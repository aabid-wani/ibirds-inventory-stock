import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import stockManagementApis from '../apis/StockManagementApis';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Breadcrumb, Card, Container, Form, Table } from 'react-bootstrap';
import Main from '../layout/Main';
import { AuthContext } from '../context/AuthProvider';

function InventoryReport() {
  const { permissions } = useContext(AuthContext);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState([]);

  const primaryColor = "#5650ce";

  const fetchReport = async (selectedYear) => {
    try {
      let result = await stockManagementApis.getInventoryReport(selectedYear);
      setReport(result);
    } catch (err) {
      console.error('Error fetching report:', err);
      setReport([]);
    }
  };

  useEffect(() => {
    fetchReport(year);
  }, [year]);

  return (
    <Main>
      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Inventory Report</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm" style={{ borderRadius: "8px" }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Inventory Report</h5>
              <small className="text-muted">{report.length} items found</small>
            </div>

            <div className="d-flex align-items-center">
                <small className="text-muted me-2 fw-medium text-uppercase" style={{ fontSize: "12px" }}>Year:</small>
                <Form.Select 
                    className="border-light-subtle shadow-none"
                    style={{ minWidth: "120px", backgroundColor: "#f8f9fa", cursor: "pointer" }}
                    size="sm"
                    onChange={(e) => setYear(Number(e.target.value))} 
                    value={year}
                >
                    {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                    <option key={y} value={y}>
                        {y}
                    </option>
                    ))}
                </Form.Select>
            </div>
          </div>

          {/* Table Section */}
          <div className="p-0 table-responsive" style={{ maxHeight: '65vh', overflow: 'auto' }}>
            <Table hover className="align-middle mb-0" style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
              <thead style={{ position: "sticky", top: "0px", zIndex: "2", backgroundColor: "#212529", color: "#ffffff" }}>
                <tr>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Product</th>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Total Buy Qty</th>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Total Issued Qty</th>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Issued ({year})</th>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Issued ({year - 1})</th>
                  <th style={{ fontWeight: "600", padding: "12px" }}>Closing Stock</th>
                </tr>
              </thead>
              <tbody>
                {report.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No data available for the selected year
                    </td>
                  </tr>
                ) : (
                  report.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 fw-medium text-dark">{item.name}</td>
                      <td className="px-3">{item.total_buy_quantity}</td>
                      <td className="px-3">{item.total_issue_quantity}</td>
                      <td className="px-3 fw-semibold text-primary">{item.issued_this_year}</td>
                      <td className="px-3">{item.issued_last_year}</td>
                      <td className="px-3 fw-bold text-dark">{item.closing_stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      </Container>
    </Main>
  );
}

export default InventoryReport;