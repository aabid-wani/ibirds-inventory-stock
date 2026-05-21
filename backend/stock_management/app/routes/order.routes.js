const express = require('express');
const Order = require('../models/order.model.js');
const OrderLineItem = require('../models/order_line_item.model.js');
const { fetchApi } = require('../middleware/fetchApi.js');

module.exports = function (app) {
    var router = express.Router();
    router.get('/', fetchApi , async  (req, res)=> {
        try {
            const order = await Order.getOrder();
            if (order) {
                res.status(200).send(order);
            } else {
                res.status(404).send({  message: 'No order found' });
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    });

    router.get('/:id', fetchApi, async  (req, res)=> {
        try {
            const orderId = req.params.id;
            const order = await Order.getOrderById(orderId);
            if (order) {
                res.status(200).send(order);
            } else {
                res.status(404).send({  message: 'No order found'  });
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    });

    router.get('/user/:id', fetchApi, async  (req, res)=> {
        try {
            const userId = req.params.id;
            const order = await Order.getOrderByUserId(userId);
            if (order) {
                res.status(200).send(order);
            } else {
                res.status(404).send({  message: 'No order found'  });
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    });

    router.post('/create', fetchApi, async  (req, res) =>{
        const order = req.body;
        // console.log('order=>',order);
        try {
            const result = await Order.addOrder(order);
            // console.log('orderId',result[0].id);
            if (!result) {
                throw new Error('Error saving order');
            }
            const result1 = await OrderLineItem.addOrderLineItems(order.orderLineItems,result[0].id);
            if (!result1) {
                console.error('Error saving line items');
                res.status(500).send({ message: 'Error saving line items' });
                return;
            }
            res.status(200).send({success:true,data:result[0]});
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: 'Error saving order' });
        }
    });
    


    router.put('/update/:id', fetchApi, async  (req, res)=> {
        try {
            const order = req.body;
            const orderId = req.params.id;
            const result = await Order.updateOrder(orderId, order);
            if (result) {
                res.status(200).send({success:true,result});
            } else {
                res.status(404).send({
                    message: 'Error updating order'
                });
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    });

    router.delete('/delete/:id', fetchApi, async (req, res) => {     
        try {
            const orderId = req.params.id;
            // 1. Remove related line items
            await OrderLineItem.deleteOrderLineItem("", orderId);
            // 2. Then delete the order
            const result = await Order.deleteOrder(orderId);

            if (result) {
            res.status(200).json({success:true, message:'order deleting successfully'});
            } else {
            res.status(404).send({ message: 'Error deleting order' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ success:false, message: 'Internal server error' });
        }
        });

    app.use('/order', router);
}