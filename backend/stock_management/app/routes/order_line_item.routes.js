const express = require('express');
const OrderLineItem = require('../models/order_line_item.model.js');

module.exports = function (app) {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const result = await OrderLineItem.getOrderLineItem();
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ errors: "No data found" });
            }
        } catch (error) {
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.get('/:id', async (req, res) => {
        const orderLineItemId = req.params.id;
        const result = await OrderLineItem.getOrderLineItemById(orderLineItemId,"");
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ errors: "No order line item found" });
        }

    });


    router.post('/', async (req, res) => {
        try {
            const orderLineItem = req.body;
            console.warn(orderLineItem);
            const result = await OrderLineItem.addOrderLineItems(orderLineItem);
            if (result) {
                res.status(201).json(result);
            } else {
                res.status(400).json({ errors: "Error saving order line item" });
            }
        } catch (error) {
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.put('/update/:id', async (req, res) => {
        const LineItemData = req.body;
        const Id = req.params.id;
        const result = await OrderLineItem.updateOrderLineItem(Id, LineItemData);
        // console.log('result: ', result);
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(400).json({ errors: "Error saving order line item" });
        }
    });


    router.put('/updateQuantity/:id', async (req, res) => {
        const LineItemData = req.body;
        const id = req.params.id;
        // console.log(id,'  ',LineItemData);
        const result = await OrderLineItem.updateOrderLineItemQuantity(id,LineItemData);
        if(result){
            res.status(200).json(result);
        }else{
            res.status(400).json({error:"Error saving order line item"});
        }
    });

    
    // Delete order line item by ID
    router.delete('/delete/:id', async (req, res) => {
        const orderLineItemId = req.params.id;
        const result = await OrderLineItem.deleteOrderLineItem(orderLineItemId);
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(400).json({ errors: "Error deleting order line item" });
        }
    });

    app.use('/orderlineitem', router);
};
