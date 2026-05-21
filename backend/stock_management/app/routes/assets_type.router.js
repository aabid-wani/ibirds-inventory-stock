// src/routes/asset_type.routes.js

const express = require("express");
const AssetType = require("../models/assets_type.model.js");
const { fetchApi } = require("../middleware/fetchApi.js");

module.exports = function(app) {
  const router = express.Router();

  // GET all
  router.get("/",  fetchApi, async (req, res) => {
    try {
      const ats = await AssetType.getAssetTypes();
      if (!ats || ats.length === 0)
        return res.status(404).json({ errors: "No data" });
      res.status(200).json(ats);
    } catch (err) {
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });


  router.get("/:id", fetchApi ,async (req, res) => {
    try {
      const rows = await AssetType.getAssetTypeById(req.params.id);
      if (!rows || rows.length === 0)
        return res.status(404).json({ errors: "Not found" });
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });


  router.post("/create", fetchApi, async (req, res) => {
    try {
      const rows = await AssetType.addAssetType(req.body);
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === "23505") // unique_violation
        return res.status(409).json({ errors: "Name or code exists" });
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });


  router.put("/update/:id", fetchApi, async (req, res) => {
    try {
      const rows = await AssetType.updateAssetType(req.params.id, req.body);
      if (!rows || rows.length === 0)
        return res.status(404).json({ errors: "Not updated" });
      res.status(200).json(rows[0]);
    } catch (err) {
      if (err.code === "23505")
        return res.status(409).json({ errors: "Name or code exists" });
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });

 
  router.delete("/delete/:id", fetchApi, async (req, res) => {
    try {
      const rows = await AssetType.deleteAssetType(req.params.id);
      if (!rows || rows.length === 0)
        return res.status(404).json({ errors: "Not deleted" });
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });

  app.use("/asset_type", router);
};
