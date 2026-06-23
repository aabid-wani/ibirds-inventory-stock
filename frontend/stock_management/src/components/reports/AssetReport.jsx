import React, { useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Container, Row, Col, Card, Button, Modal, Form, Spinner
} from "react-bootstrap";
import DataTable from "react-data-table-component";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Main from "../layout/Main";
import { Link } from "react-router-dom";

/* ── helper: download current items as Excel ────────────────────── */
const downloadItemsExcel = (items, year, quarter) => {
  if (!items.length) return;
  const ws = XLSX.utils.json_to_sheet(
    items.map(row => ({
      ID: row.id,
      Location: row.location_id,
      "Asset Type": row.asset_type_id,
      Brand: row.brand_name,
      Quantity: row.quantity,
      "Unit Cost": row.unit_cost,
      "Purchase Date": row.purchase_date,
      Remarks: row.remarks
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Assets");
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([buffer], { type: "application/octet-stream" }),
    `Assets_Q${quarter}_${year}.xlsx`
  );
};

export default function AssetReport() {
  const [summary, setSummary] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItems, setDetailItems] = useState([]);
  const [detailMeta, setDetailMeta] = useState({ year: "", quarter: "" });

  const primaryColor = "#5650ce";

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await stockManagementApis.getQuarterlyAssetReport(
        filters.from || undefined,
        filters.to   || undefined
      );
      setSummary(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const fetchQuarterItems = async ({ year, quarter }) => {
    setDetailMeta({ year, quarter });
    setDetailLoading(true);
    setShowModal(true);
    try {
      const res = await stockManagementApis.getAssetsByQuarter(year, quarter);
      setDetailItems(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load quarter list");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { name: "Year", selector: r => r.year, sortable: true, width: "100px" },
    { name: "Quarter", selector: r => `Q${r.qtr}`, sortable: true, width: "100px" },
    { name: "Total Units", selector: r => r.total_units, sortable: true },
    { name: "Total Cost", selector: r => r.total_cost, sortable: true },
    {
      name: "View",
      button: true,
      width: "80px",
      cell: row => (
        <Button
          variant="outline-primary"
          className="btn-sm d-flex align-items-center justify-content-center"
          onClick={() => fetchQuarterItems({ year: row.year, quarter: row.qtr })}
          style={{ width: "32px", height: "32px", borderColor: "#a3a6dd", color: primaryColor }}
        >
          <i className="fa fa-eye" />
        </Button>
      )
    }
  ];

  const customStyles = {
    headRow: {
      style: { backgroundColor: "#212529", color: "#ffffff", minHeight: "45px", fontWeight: "600" }
    },
    rows: { style: { minHeight: "50px", fontSize: "14px" } }
  };

  const handleChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <Main>
      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Quarterly Asset Report</span>
      </div>

      <Container fluid className="px-3">
        {/* Filter Card */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "8px" }}>
          <Card.Body className="p-3">
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label className="text-muted" style={{ fontSize: "13px" }}>From Year</Form.Label>
                <Form.Control type="number" name="from" value={filters.from} onChange={handleChange} placeholder="e.g. 2023" size="sm" />
              </Col>
              <Col md={3}>
                <Form.Label className="text-muted" style={{ fontSize: "13px" }}>To Year</Form.Label>
                <Form.Control type="number" name="to" value={filters.to} onChange={handleChange} placeholder="e.g. 2025" size="sm" />
              </Col>
              <Col md="auto">
                <Button size="sm" onClick={fetchSummary} disabled={loadingSummary} style={{ backgroundColor: primaryColor, border: 'none' }}>
                  {loadingSummary ? <Spinner size="sm" animation="border" /> : "Apply Filters"}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Charts & Table Row */}
        <Row>
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm" style={{ borderRadius: "8px" }}>
              <div className="p-3 border-bottom"><h6 className="mb-0">Summary Table</h6></div>
              <Card.Body className="p-0">
                <DataTable columns={columns} data={summary} customStyles={customStyles} pagination dense />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm" style={{ borderRadius: "8px" }}>
              <div className="p-3 border-bottom"><h6 className="mb-0">Units vs. Cost per Quarter</h6></div>
              <Card.Body style={{ height: "300px" }} className="p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey={r => `${r.year}-Q${r.qtr}`} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_units" name="Units" fill={primaryColor} />
                    <Bar dataKey="total_cost" name="Cost" fill="#107c41" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Detail Modal */}
      <Modal size="lg" show={showModal} onHide={() => setShowModal(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">Assets – Q{detailMeta.quarter} {detailMeta.year}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading ? <div className="text-center p-3"><Spinner animation="border" /></div> : (
            <DataTable
              columns={[
                { name: "Brand", selector: r => r.brand_name },
                { name: "Quantity", selector: r => r.quantity, right: true },
                { name: "Unit Cost", selector: r => r.unit_cost, right: true },
                { name: "Purchase Date", selector: r => r.purchase_date },
              ]}
              data={detailItems}
              customStyles={customStyles}
              pagination
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="success" onClick={() => downloadItemsExcel(detailItems, detailMeta.year, detailMeta.quarter)} disabled={!detailItems.length}>
            Download Excel
          </Button>
        </Modal.Footer>
      </Modal>
    </Main>
  );
}