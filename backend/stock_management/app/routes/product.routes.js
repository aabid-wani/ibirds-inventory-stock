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
      res.status(500).send({ message: "Internal Server Error" });
    }
  });

  router.post("/create", fetchApi, async  (req, res)=> {
    try {
      const productBody = req.body;
      const addedProduct = await Product.addProduct(productBody);

      // Auto-log product addition activity
      const Activity = require('../models/activity.model.js');
      Activity.logActivity({
        user_id: req.user?.id,
        user_name: req.user?.name || 'User',
        user_email: req.user?.email,
        role_name: req.user?.role_name,
        action_type: 'ADD_PRODUCT',
        action_category: 'products',
        module: 'products',
        description: `Added new product "${productBody.name || 'Product'}" to inventory`,
        entity_id: addedProduct?.[0]?.id || productBody.id
      });

      res.status(200).json({ success: true, message: "Product added successfully", data: addedProduct });
      
    } catch (error) {
      res.status(400).send({ success: false, message: error.message });
    }
  });

    router.put("/updateProduct/:id", fetchApi ,async (req, res)=>{
    try {
      const productId = req.params.id;
      const productData = req.body;
      const result = await Product.updateProductStock(productId, productData);
      if (result) {
        const Activity = require('../models/activity.model.js');
        Activity.logActivity({
          user_id: req.user?.id,
          user_name: req.user?.name || 'User',
          user_email: req.user?.email,
          role_name: req.user?.role_name,
          action_type: 'UPDATE_STOCK',
          action_category: 'products',
          module: 'products',
          description: `Updated stock values for product #${productId}`,
          entity_id: productId
        });
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ errors: "Error updating issue ID" });
      }
    } catch (error) {
      res.status(500).send({ message: "Internal Server Error" });
    }
  });


  router.put("/update/:id", fetchApi, async  (req, res)=> {
    try {
      const product = req.body;
      const productId = req.params.id;

      const requiredFields = ["total_buy_quantity", "available_stock"];
      const hasRequiredFields = requiredFields.every(field => field in product);

      
      const onlyStockUpdate = Object.keys(product).length === 1 || Object.keys(product).length === 2;



      if (onlyStockUpdate) {
        const result = await Product.updateProductStock(productId, product);
     
        if (result) {
          const Activity = require('../models/activity.model.js');
          Activity.logActivity({
            user_id: req.user?.id,
            user_name: req.user?.name || 'User',
            user_email: req.user?.email,
            role_name: req.user?.role_name,
            action_type: 'UPDATE_STOCK',
            action_category: 'products',
            module: 'products',
            description: `Updated stock levels for product #${productId}`,
            entity_id: productId
          });
          res.status(200).json(result);
        } else {
          res.status(400).json({ errors: "Error updating product stock" });
        }
      } else {
        const result = await Product.updateProduct(productId, product);
    
        if (result) {
          const Activity = require('../models/activity.model.js');
          Activity.logActivity({
            user_id: req.user?.id,
            user_name: req.user?.name || 'User',
            user_email: req.user?.email,
            role_name: req.user?.role_name,
            action_type: 'UPDATE_PRODUCT',
            action_category: 'products',
            module: 'products',
            description: `Updated details for product "${product.name || `#${productId}`}"`,
            entity_id: productId
          });
          res.status(200).json({ success: true, message: "Product Update Successfully", result });
        } else {
          res.status(400).json({ messages: "Error updating product" });
        }
      }
    } catch (error) {
      res.status(400).json({ errors: error.message || "Unexpected error occurred" });
    }
  });

  router.delete("/delete/:id", fetchApi, async (req, res) => {
    const productId = req.params.id;
    try {
      const current = await db.query("SELECT status, name FROM products WHERE id = $1", [productId]);
      let nextStatus = 'inactive';
      if (current.rows.length > 0 && current.rows[0].status === 'inactive') {
        nextStatus = 'active';
      }
      let result = await db.query("UPDATE products SET status = $1 WHERE id = $2 RETURNING *", [nextStatus, productId]);

      if (result) {
        const Activity = require('../models/activity.model.js');
        Activity.logActivity({
          user_id: req.user?.id,
          user_name: req.user?.name || 'User',
          user_email: req.user?.email,
          role_name: req.user?.role_name,
          action_type: nextStatus === 'active' ? 'ACTIVATE_PRODUCT' : 'DEACTIVATE_PRODUCT',
          action_category: 'products',
          module: 'products',
          description: `Changed status to ${nextStatus} for product "${current.rows[0]?.name || `#${productId}`}"`,
          entity_id: productId
        });
        res.status(200).json({ success: true, message: `Product status changed to ${nextStatus}`, data: result.rows[0] });
      } else {
        res.status(400).json({ success: false, message: "Error toggling product status" });
      }
    } catch (error) {
      res.status(500).send({ message: "Internal Server Error" });
    }
  });

  router.put("/toggle-status/:id", fetchApi, async (req, res) => {
    const productId = req.params.id;
    try {
      const current = await db.query("SELECT status FROM products WHERE id = $1", [productId]);
      if (current.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });
      const nextStatus = current.rows[0].status === 'active' ? 'inactive' : 'active';
      const result = await db.query("UPDATE products SET status = $1 WHERE id = $2 RETURNING *", [nextStatus, productId]);
      res.status(200).json({ success: true, message: `Product status changed to ${nextStatus}`, data: result.rows[0] });
    } catch (error) {
      res.status(500).send({ message: "Internal Server Error" });
    }
  });

  router.post("/adjust-stock/:id", fetchApi, async (req, res) => {
    const productId = req.params.id;
    const { adjustment_type, quantity, notes } = req.body;
    try {
      const current = await Product.getProductById(productId);
      if (!current || current.length === 0) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      const p = current[0];
      let newTotalBuy = parseFloat(p.total_buy_quantity || 0);
      const currentIssue = parseFloat(p.total_issue_quantity || 0);
      const qtyNum = parseFloat(quantity);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        return res.status(400).json({ success: false, message: "A valid positive quantity is required" });
      }

      const maxLimit = p.max_quantity !== null && p.max_quantity !== undefined && parseFloat(p.max_quantity) > 0 ? parseFloat(p.max_quantity) : null;

      if (adjustment_type === 'restock' || adjustment_type === 'add') {
        if (maxLimit !== null) {
          const currentRemaining = Math.max(0, newTotalBuy - currentIssue);
          const maxCanAdd = Math.max(0, maxLimit - currentRemaining);
          if (qtyNum > maxCanAdd) {
            return res.status(400).json({
              success: false,
              message: `Cannot restock ${qtyNum} units. Maximum allowed to add is ${maxCanAdd} (Max Limit: ${maxLimit}).`
            });
          }
        }
        newTotalBuy += qtyNum;
      } else if (adjustment_type === 'deduct') {
        const available = newTotalBuy - currentIssue;
        if (qtyNum > available) {
          return res.status(400).json({ success: false, message: `Cannot deduct ${qtyNum}. Only ${available} available.` });
        }
        newTotalBuy = Math.max(currentIssue, newTotalBuy - qtyNum);
      } else if (adjustment_type === 'set') {
        if (qtyNum < currentIssue) {
          return res.status(400).json({ success: false, message: `New total buy quantity (${qtyNum}) cannot be lower than total issued (${currentIssue})` });
        }
        if (maxLimit !== null && (qtyNum - currentIssue) > maxLimit) {
          return res.status(400).json({
            success: false,
            message: `New stock level exceeds maximum storage capacity of ${maxLimit} units.`
          });
        }
        newTotalBuy = qtyNum;
      }

      const updated = await Product.updateProductStock(productId, {
        total_buy_quantity: newTotalBuy,
        available_stock: newTotalBuy - currentIssue,
      });

      const Activity = require('../models/activity.model.js');
      Activity.logActivity({
        user_id: req.user?.id,
        user_name: req.user?.name || 'User',
        user_email: req.user?.email,
        role_name: req.user?.role_name,
        action_type: 'ADJUST_STOCK',
        action_category: 'products',
        module: 'products',
        description: `Stock adjustment on product: Buy Qty = ${newTotalBuy}, Available = ${newTotalBuy - currentIssue}`,
        entity_id: productId
      });

      res.status(200).json({
        success: true,
        message: `Stock successfully updated. Total Buy: ${newTotalBuy}, Available: ${newTotalBuy - currentIssue}`,
        data: updated[0]
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get("/:id/history", fetchApi, async (req, res) => {
    const productId = req.params.id;
    try {
      const [issuesRes, ordersRes] = await Promise.all([
        db.query(`
          SELECT i.*, u.name as user_name, e.name as employee_name, b.name as branch_name 
          FROM issues i
          LEFT JOIN users u ON i.user_id = u.id
          LEFT JOIN employees e ON i.employee_id = e.id
          LEFT JOIN branches b ON i.branch_id = b.id
          WHERE i.product_id = $1
          ORDER BY i.issue_date DESC
          LIMIT 25
        `, [productId]),
        db.query(`
          SELECT oli.*, o.order_number, o.order_date, v.name as vendor_name
          FROM order_line_item oli
          LEFT JOIN orders o ON oli.order_id = o.id
          LEFT JOIN vendors v ON o.vendor_id = v.id
          WHERE oli.product_id = $1
          ORDER BY oli.created_at DESC
          LIMIT 25
        `, [productId]).catch(() => ({ rows: [] }))
      ]);

      res.status(200).json({
        success: true,
        issues: issuesRes.rows || [],
        purchases: ordersRes.rows || []
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
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
