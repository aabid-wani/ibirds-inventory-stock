const express = require("express");
const Assets  = require("../models/assets.model.js");
const { message } = require("statuses");
const { fetchApi } = require("../middleware/fetchApi.js");

module.exports = function (app) {
  const router = express.Router();

  router.get("/", fetchApi, async (_req, res) => {
    try {
      const data = await Assets.getAssets();
      console.log(data);
      
      if (!data.length) return res.status(404).json({ errors: "No data" });
      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });

  router.get("/:id", fetchApi, async (req, res) => {
    try {
      const rows = await Assets.getAssetById(req.params.id);
      if (!rows.length) return res.status(404).json({ errors: "Not found" });
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });

 
  router.post("/create",  fetchApi, async (req, res) => {
    try {
      console.log('assets=>',req.body);
      const rows = await Assets.addAsset(req.body);
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === "23503") {
        return res.status(400).json({ errors: "Invalid foreign key" });
      }
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });

  router.put("/update/:id", fetchApi, async (req, res) => {    
    try {
      const rows = await Assets.updateAsset(req.params.id, req.body);
      if (!rows.length) return res.status(404).json({ errors: "Not updated" });
      res.status(200).json(rows[0]);
    } catch (err) {
      if (err.code === "23503") {
        return res.status(400).json({ errors: "Invalid foreign key" ,err});
      }
      console.error(err);
      res.status(500).json({ errors: "Server error",err });
    }
   
  });

  router.delete("/delete/:id", fetchApi, async (req, res) => {
    try {
        console.log(req.params.id);
      const rows = await Assets.deleteAsset(req.params.id);
      if (!rows.length) return res.status(404).json({ errors: "Not deleted" });
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });


  router.get("/report/quarterly", fetchApi, async (req, res) => {
    try {
        const { from, to } = req.query;                
        const rows = await Assets.assetReportQuarterly({ from, to });
        res.status(200).json({ data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ errors: "Server error" });
    }
  });

  router.get("/list/quarterly", fetchApi, async (req, res) => {
    const { year, q } = req.query;

    if (!year || !q) {
      return res.status(400).json({ errors: "Query params 'year' and 'q' (quarter) are required" });
    }
    const quarter = Number(q);
    if (![1, 2, 3, 4].includes(quarter)) {
      return res.status(400).json({ errors: "'q' must be 1, 2, 3, or 4" });
    }

    try {
      const result = await Assets.assetListByQuarter({
        year: Number(year),
        quarter
      });
      res.status(200).json({ data: result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });

  app.use("/assets", router);
};
