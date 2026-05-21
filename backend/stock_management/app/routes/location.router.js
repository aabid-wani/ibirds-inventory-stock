const express  = require("express");
const Location = require("../models/location.model.js");   
const { fetchApi } = require("../middleware/fetchApi.js");

module.exports = function (app) {
  const router = express.Router();  
  router.get("/", fetchApi, async (req, res) => {
    try {
      const locations = await Location.getLocation();
      if (!locations || locations.length === 0) {
        return res.status(404).json({ errors: "No data" });
      }
      res.status(200).json(locations);
    } catch (err) {
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });


  router.get("/:id", fetchApi, async (req, res) => {
    try {
      const { id }   = req.params;
      const result   = await Location.getLocationById(id);
      const location = result[0];

      if (!location) {
        return res.status(404).json({ errors: "No location found" });
      }
      res.status(200).json(location);
    } catch (err) {
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });



  router.post("/create", fetchApi, async (req, res) => {
    try {
      console.log(req.body)
      const payload = req.body;               
      const result  = await Location.addLocation(payload);
      res.status(201).json(result);          
    } catch (err) {
      if (err.code === "23505") {             // unique_violation
        return res.status(409).json({ errors: "Location name already exists" });
      }
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });


  router.put("/update/:id", fetchApi, async (req, res) => {
    try {
      const { id }  = req.params;
      const payload = req.body;               // expects { name: "New Name" }
      const result  = await Location.updateLocation(id, payload);

      if (!result || result.length === 0) {
        return res.status(404).json({ errors: "Error updating location" });
      }
      res.status(200).json(result);
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({ errors: "Location name already exists" });
      }
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });


  router.delete("/delete/:id", fetchApi, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await Location.deleteLocation(id);

      if (!result || result.length === 0) {
        return res.status(404).json({ errors: "Error deleting location" });
      }
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ errors: "Server error" });
    }
  });

  app.use("/location", router);
};
