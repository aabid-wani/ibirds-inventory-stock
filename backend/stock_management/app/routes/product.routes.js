const express = require("express");
const Product = require("../models/product.model.js");
const {fetchApi} = require('../middleware/fetchApi.js');
const db = require("../config/db.connect.js");
module.exports = function (app) {
  var router = express.Router();

  router.get("/", fetchApi, async  (req, res)=> {
    try {
      const product = await Product.getProduct();
      if (product) {
        res.status(200).send(product);
      } else {
        res.status(404).send({ message: "No products found." });
      }
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({ message: "Internal Server Error" });
    }
  });


  router.get("/lowStock",  async  (req, res)=> {
    try {
      const product = await Product.LowStockAvailable();
      if (product) {
        res.status(200).send(product);
      } else {
        res.status(404).send({
          message: "No products found in low stock.",
        });
      }
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({ message: "Internal Server Error" });
    }
  });

  router.get("/:id", fetchApi , async  (req, res) =>{
    try {
      const productId = req.params.id;
      const product = await Product.getProductById(productId);
      if (product) {
        res.status(200).send(product);
      } else {
        res.status(404).send({
          message: "No product found.",
        });
      }
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({ message: "Internal Server Error" });
    }
  });

  router.post("/create", fetchApi, async  (req, res)=> {
    try {
      const productBody = req.body;
      const addedProduct = await Product.addProduct(productBody);
      res.status(200).json({ success: true, message: "Product added successfully", data: addedProduct });
      // console.log("Product added:", addedProduct);
    } catch (error) {
      console.error("Validation or DB error:", error.message);
      res.status(400).send({ success: false, message: error.message });
    }
  });

    router.put("/updateProduct/:id", fetchApi ,async (req, res)=>{
    try {
      const productId = req.params.id;
      const productData = req.body;
      console.log('productId'," ",productData);
      const result = await Product.updateProductStock(productId, productData);
      if (result) {
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ errors: "Error updating issue ID" });
      }
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send({ message: "Internal Server Error" });
    }
  });


  router.put("/update/:id", fetchApi, async  (req, res)=> {
    try {
      const product = req.body;
      const productId = req.params.id;
      // console.log('updateproductStock=>',productId,'  ',product);

      const requiredFields = ["total_buy_quantity", "available_stock"];
      const hasRequiredFields = requiredFields.every(field => field in product);

      // console.log('hasRequiredFields',hasRequiredFields)
      
      const onlyStockUpdate = Object.keys(product).length === 1 || Object.keys(product).length === 2;

      // const onlyStockUpdate = hasRequiredFields && hasOneOrTwoFields;

      console.log('onlyStockUpdate=>',onlyStockUpdate);

      if (onlyStockUpdate) {
        const result = await Product.updateProductStock(productId, product);
        // console.log('stock update result',result);
        if (result) {
          res.status(200).json(result);
        } else {
          res.status(400).json({ errors: "Error updating product stock" });
        }
      } else {
        const result = await Product.updateProduct(productId, product);
        console.log('full update result',result);
        if (result) {
          res.status(200).json({ success: true, message: "Product Update Successfully", result });
        } else {
          res.status(400).json({ messages: "Error updating product" });
        }
      }
    } catch (error) {
      // console.error("Update error:", error.message);
      res.status(400).json({ errors: error.message || "Unexpected error occurred" });
    }
  });

  router.delete("/delete/:id",  fetchApi, async  (req, res)=> {
  const productId = req.params.id;
  try {
    // Option 1: Manually delete related issues before deleting product
    let result = await db.query("UPDATE Products SET status = 'inactive' WHERE id = $1", [productId]);
    // await Issue.issueDeletedById(productId);
    
    
    // Now delete the product
    // const result = await Product.deleteProduct(productId);

    if (result) {
      res.status(200).json({ message: "Product deleted successfully" });
    } else {
      res.status(400).json({ message: "Error deleting product" });
    }
  } catch (error) {
    // console.error("Error:", error.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


  router.post('/update-quantities', fetchApi, async (req, res) => {
    const updates = req.body;
    try {
      await Product.updateIssuedQuantities(updates);
      res.status(200).json({ message: 'Product quantities updated successfully' ,success : true});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.use('/product',router);
};
