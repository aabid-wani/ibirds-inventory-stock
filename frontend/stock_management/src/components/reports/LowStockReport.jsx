import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Table,
  Form,
  Card,
  Alert,
  Breadcrumb,
} from "react-bootstrap";
import { API_BASE_URL } from "../CONSTANT/CONSTANT";
import Main from "../layout/Main";
import { Link } from "react-router-dom";

function LowStockReport() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState([]);
  const [monthOptions, setMonthOptions] = useState([]);

  // Generic fetch with Bearer token and error handling
  const fetchWithToken = async (url, options = {}) => {
    // console.log("Fetching URL:", url, 'options ' ,options);

    const token = sessionStorage.getItem("token");
    // console.log("Using Token:", token);

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    try {
      // console.log("Headers:", headers, 'options ' ,options);
      const response = await fetch(url, { ...options, headers });
      // let data = await response.json();
      // console.log("Response Data:", data);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      // For DELETE, some APIs may not return JSON
      if (options.method === "DELETE") {
        try {
          return await response.json();
        } catch {
          return response.status;
        }
      }
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

    setMonthOptions(options);
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      if (!month) return;
      try {
        const res = await fetchWithToken(
          `${API_BASE_URL}/reports/low-stock?month=${month}`
        );
        console.log("Low Stock Report Data:", res.data);
        setReport(res.data || []);
      } catch (error) {
        console.error("Error fetching report:", error);
        setReport([]);
      }
    };

    fetchReport();
  }, [month]);

  const downloadCSV = () => {
    const rows = [
      [
        "Product Name",
        "Total Buy",
        "Total Issue",
        "Current Stock",
        "Min Quantity",
        "Created At",
      ],
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
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `low_stock_report_${month}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Main>
      <div className="my-2 mt-4" style={{ position: "relative", left: "20px" }}>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
            {" "}
            Home{" "}
          </Breadcrumb.Item>
          <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
            {" "}
            Low Stock List{" "}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <Container className="mt-4">
        <Card>
          <Card.Body>
            <Card.Title>Monthly Low Stock Report</Card.Title>

            <Row className="align-items-end">
              <Col md={4}>
                <Form.Group controlId="monthDropdown">
                  <Form.Label>Select Month</Form.Label>
                  <Form.Select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  >
                    {monthOptions.map((m) => {
                      const date = new Date(`${m}-01`);
                      const label = date.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      });
                      return (
                        <option key={m} value={m}>
                          {label}
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md="auto">
                <Button variant="success" onClick={downloadCSV}>
                  Download
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {report.length > 0 ? (
          <div style={{ maxHeight: "60vh", overflow: "auto" }}>
            <Table
              striped
              bordered
              hover
              style={{ borderCollapse: "collapse", width: "100%" }}
            >
              <thead style={{ position: "sticky", top: "0px", zIndex: "2" }}>
                <tr>
                  <th
                    style={{
                      background:
                        "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                      color: " #ecf0f1ff",
                    }}
                  >
                    Product Name
                  </th>
                  <th
                    style={{
                      background:
                        "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                      color: " #ecf0f1ff",
                    }}
                  >
                    Total Buy
                  </th>
                  <th
                    style={{
                      background:
                        "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                      color: " #ecf0f1ff",
                    }}
                  >
                    Total Issue
                  </th>
                  <th
                    style={{
                      background:
                        "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                      color: " #ecf0f1ff",
                    }}
                  >
                    Current Stock
                  </th>
                  <th
                    style={{
                      background:
                        "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                      color: " #ecf0f1ff",
                    }}
                  >
                    Min Quantity
                  </th>
                  <th
                    style={{
                      background:
                        "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                      color: " #ecf0f1ff",
                    }}
                  >
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td>
                    <td>{item.total_buy_quantity}</td>
                    <td>{item.total_issue_quantity}</td>
                    <td>{item.current_stock}</td>
                    <td>{item.min_quantity}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <Alert variant="info" className="mt-4">
            No report data available for <strong>{month}</strong>.
          </Alert>
        )}
      </Container>
    </Main>
  );
}

export default LowStockReport;
