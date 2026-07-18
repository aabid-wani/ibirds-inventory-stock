const express = require("express");
const Report = require('../models/reports.model');
const { fetchApi } = require("../middleware/fetchApi");
module.exports = (app) => {
    let router = express.Router();

    router.get("/monthly_report",fetchApi , async (req, res) => {
    const { month } = req.query; 
    if (!month) return res.status(400).json({ error: "Month is required" });
    const [year, mon] = month.split("-");
    const startDate = `${month}-01`;
    const daysInMonth = new Date(year, mon, 0).getDate();
    const endDate = `${month}-${daysInMonth}`;
    try {
      const data = await Report.getIssuedProdQuantityMonthly(startDate, endDate);
      return res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.get("/yearly_report", fetchApi ,async (req, res) => {
    const { year } = req.query; 
    if (!year) return res.status(400).json({ error: "Year is required" });

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    try {
      const data = await Report.getIssuedProdQuantityYearly(
        startDate,
        endDate,
        "yearly"
      );
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.get("/inventory-report", fetchApi ,async (req, res) => {
    const year = parseInt(req.query.year);

    try {
      const result = await Report.InventoryReport(year);


      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/daywise_employees", fetchApi, async (req, res) => {
    try {
      const { month, product, day } = req.query;

      if (!month || !product || !day) {
        return res
          .status(400)
          .json({ error: "Missing required query parameters." });
      }
      const [year, monthStr] = month.split("-");
      const dayInt = parseInt(day, 10);
      const monthInt = parseInt(monthStr, 10) - 1;

      const startDate = new Date(year, monthInt, dayInt);
      const endDate = new Date(year, monthInt, dayInt + 1);

      const records = await Report.getDayWiseIssuedEmployees(
        product,
        monthStr,
        day
      );
      if (!records) {
        return res.status(404).json({ error: "No records found." });
      }

      const response = records.map((record) => ({
        name: record.employee_name,
        quantity: record.total_issued,
      }));

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Internal server error." });
    }
  });

  router.get('/low-stock', fetchApi, async (req, res) => {
      const { month } = req.query;
      try {
        const result = await Report.lowStockReport(month);
        return res.json({ data: result.rows });
      } catch (err) {
        return res.status(500).json({ error: 'Failed to generate report' });
      }
  });

  app.use("/reports", router);
};
