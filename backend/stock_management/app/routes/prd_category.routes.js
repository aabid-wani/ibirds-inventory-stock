const express = require("express");
const prdCategory = require("../models/prd_category.model.js");
const { fetchApi } = require("../middleware/fetchApi.js");

module.exports = function (app) {
  var router = express.Router();
  router.get("/", fetchApi, async (req, res) => {
    try {
      const product = await prdCategory.getProductCategory();
      if (product) {
        res.status(200).json(product);
      } else {
        res.status(404).json({ errors: "No data found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ errors: "Internal Server Error" });
    }
  });

  router.get("/:id", fetchApi, async  (req, res)=> {
    try {
        const product_category_id = req.params.id;
        const product = await prdCategory.getProductCategoryById(product_category_id);
        if (product) {
            res.status(200).json(product[0]);
        } else {
            res.status(404).json({ errors: "No product category found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ errors: "Internal Server Error" });
    }
  });

  router.post("/create",fetchApi , async (req, res)=> {
     try {
      const product = req.body;
      const result = await prdCategory.addProductCategory(product);
      // console.log("result", result);
      if (result) {
        res.status(201).json({
            success: true,
            message: "Product Category Added Successfully",
            result,
        });
      } else {
        const error = new Error("Error saving product category");
        error.status = 400;
        throw error;
      }
    } catch (error) {
        console.error("Error adding product category:", error);
        res.status(error.status || 500).json({ errors: error.message || "Internal Server Error" });
    }
  });

  router.put("/update/:id",fetchApi ,async  (req, res)=> {
    try {
      const product = req.body;
      const product_category_id = req.params.id;
      const result = await prdCategory.updateProductCategory(
        product_category_id,
        product
      );
      if (result) {
        res.status(200).json(result);
      } else {
        res.status(400).json({ errors: "Error updating product category" });
      }
    } catch (error) {
      console.error("Error Updating product category:", error);
      res
        .status(error.status || 500)
        .json({ errors: error.message || "Internal Server Error" });
    }
  });

  router.delete("/delete/:id", fetchApi, async  (req, res)=>{
    try {
        const product_category_id = req.params.id;
        const result = await prdCategory.deleteProductCategory(product_category_id);
        if (result) {
            res.status(200).json({success: true, message: "Product Category deleted successfully", result});
        } else {
            res.status(400).json({errors : "Error deleting product category"});
        }
    } catch (error) {
        console.error("Error deleting product category:", error);
        res.status(error.status || 500).json({errors : error.message || "Internal Server Error"});
    }
  });

  app.use("/productCategory", router);
};
