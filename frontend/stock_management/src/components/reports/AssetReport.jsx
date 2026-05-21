
import React, { useEffect, useState } from "react";
import {
  Container, Row, Col, Card, Form, Button, Spinner, Modal
} from "react-bootstrap";
import DataTable from "react-data-table-component";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import stockManagementApis from "../apis/StockManagementApis";
import Main from "../layout/Main";

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
  /* ── summary state ──────────────────────────────────────────── */
  const [summary, setSummary] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [loadingSummary, setLoadingSummary] = useState(false);

  /* ── detail modal state ─────────────────────────────────────── */
  const [showModal, setShowModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItems, setDetailItems] = useState([]);
  const [detailMeta, setDetailMeta] = useState({ year: "", quarter: "" });

  /* ── fetch quarterly summary ────────────────────────────────── */
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

  useEffect(() => { fetchSummary(); }, []); // initial load

  /* ── fetch items for one quarter & open modal ───────────────── */
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

  /* ── table columns (eye button uses fetchQuarterItems) ──────── */
  const columns = [
    { name: "Year",          selector: r => r.year,         sortable: true },
    { name: "Quarter",       selector: r => `Q${r.qtr}`,    sortable: true },
    { name: "Total Units",   selector: r => r.total_units,  sortable: true },
    { name: "Total Cost",    selector: r => r.total_cost,   sortable: true, right: true },
    {
      name: "View",
      button: true,
      cell: row => (
        <Button
          className="mx-1 btn-sm bg-success border-0"
          onClick={() => fetchQuarterItems({ year: row.year, quarter: row.qtr })}
        >
          <i className="fa fa-eye" />
        </Button>
      )
    }
  ];

  /* ── filter handler ─────────────────────────────────────────── */
  const handleChange = e =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  /* ── prev / next helpers ────────────────────────────────────── */
  const goPrevQuarter = () => {
    const { year, quarter } = detailMeta;
    const newQuarter = quarter === 1 ? 4 : quarter - 1;
    const newYear    = quarter === 1 ? year - 1 : year;
    fetchQuarterItems({ year: newYear, quarter: newQuarter });
  };
  const goNextQuarter = () => {
    const { year, quarter } = detailMeta;
    const newQuarter = quarter === 4 ? 1 : quarter + 1;
    const newYear    = quarter === 4 ? +year + 1 : year;
    fetchQuarterItems({ year: newYear, quarter: newQuarter });
  };

  return (
    <Main>
      <Container fluid className="mt-4">
        <h3 className="mb-4">Quarterly Assets Report</h3>

        {/* ── Filter bar ─────────────────────── */}
        <Card className="p-3 mb-4">
          <Form>
            <Row className="g-2 align-items-end">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>From Year</Form.Label>
                  <Form.Control
                    type="number"
                    name="from"
                    value={filters.from}
                    onChange={handleChange}
                    placeholder="e.g. 2023"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>To Year</Form.Label>
                  <Form.Control
                    type="number"
                    name="to"
                    value={filters.to}
                    onChange={handleChange}
                    placeholder="e.g. 2025"
                  />
                </Form.Group>
              </Col>
              <Col md="auto">
                <Button onClick={fetchSummary} disabled={loadingSummary}>
                  {loadingSummary ? <Spinner size="sm" /> : "Apply"}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* ── Summary table & chart ───────────── */}
        <Row>
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Header>Summary Table</Card.Header>
              <Card.Body style={{ overflowX: "auto" }}>
                <DataTable
                  columns={columns}
                  data={summary}
                  dense
                  striped
                  pagination
                  progressPending={loadingSummary}
                />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6} className="mb-4">
            <Card>
              <Card.Header>Units vs. Cost per Quarter</Card.Header>
              <Card.Body style={{ height: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary}>
                    <XAxis dataKey={r => `${r.year}-Q${r.qtr}`} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_units" name="Units" />
                    <Bar dataKey="total_cost"  name="Cost"  />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* ── Detail modal ─────────────────────── */}
      <Modal size="lg" show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Assets – Q{detailMeta.quarter} {detailMeta.year}
          </Modal.Title>

          {/* ── Prev / Next buttons ─────────────────────── */}
          <div className="ms-auto d-flex gap-2">
            <Button size="sm" variant="outline-secondary" onClick={goPrevQuarter}>
              ◀ Prev Q
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={goNextQuarter}>
              Next Q ▶
            </Button>
          </div>
        </Modal.Header>

        <Modal.Body style={{ overflowX: "auto" }}>
          {detailLoading ? (
            <Spinner animation="border" />
          ) : (
            <DataTable
              columns={[
                
                { name: "Brand", selector: r => r.brand_name },
                { name: "Quantity", selector: r => r.quantity, right: true },
                { name: "Unit Cost", selector: r => r.unit_cost, right: true },
                { name: "Purchase Date", selector: r => r.purchase_date },
                { name: "Remarks", selector: r => r.remarks }
              ]}
              data={detailItems}
              dense
              striped
              pagination
            />
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="success"
            onClick={() =>
              downloadItemsExcel(detailItems, detailMeta.year, detailMeta.quarter)
            }
            disabled={!detailItems.length}
          >
            Download
          </Button>
        </Modal.Footer>
      </Modal>
    </Main>
  );
}