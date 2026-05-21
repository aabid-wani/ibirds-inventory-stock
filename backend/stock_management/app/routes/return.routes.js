const express = require('express');
const Return = require('../models/return.model.js');

module.exports = function(app) {
    let router = express.Router();

    router.get('/all/', async function(req, res) {
        try {
            const all = await Return.getReturn();
            if(all){
                res.status(200).json(all);
            } else {
                res.status(404).json({errors : "No data"});
            }
        } catch (error) {
            res.status(500).json({errors : "Internal Server Error"});
        }
    });

    router.get('/', async function(req, res) {
        try {
            const return_item = await Return.getReturnAll();
            if(return_item){
                res.status(200).json(return_item);
            } else {
                res.status(404).json({errors : "No data"});
            }
        } catch (error) {
            res.status(500).json({errors : "Internal Server Error"});
        }
    });

    router.post('/', async function(req, res) {
        try {
            const result = await Return.addReturn(req.body);
            // console.log('result=>',result);
            if(result){
                res.status(201).json({success : true, message : "Return Added Successfully" ,result});
            } else {
                res.status(400).json({errors : "Invalid Request"});
            }
        } catch (error) {
            res.status(500).json({errors : "Internal Server Error"});
        }
    });

    router.get('/:id', async function(req, res) {
        try {
            const return_id = req.params.id;
            const result = await Return.getReturnByIssueId(return_id);
            if(result){
                res.status(200).json(result);
            } else {
                res.status(404).json({errors : "No return item found"});
            }
        } catch (error) {
            res.status(500).json({errors : "Internal Server Error"});
        }
    });

    router.get('/orderId/:id', async function(req, res) {
        try {
            const return_id = req.params.id;
            const result = await Return.getReturnByOrderId(return_id);
            if(result){
                res.status(200).json(result);
            } else {
                res.status(404).json({errors : "No return item found"});
            }
        } catch (error) {
            res.status(500).json({errors : "Internal Server Error"});
        }
    });

    router.put('/:id', async function(req, res) {
        try {
            const return_id = req.params.id;
            const result = await Return.updateReturn(return_id, req.body);
            if(result){
                res.status(200).json(result);
            } else {
                res.status(400).json({errors : "Invalid Request"});
            }
        } catch (error) {
            res.status(500).json({errors : "Internal Server Error"});
        }
    });

    router.delete('/:id', async function(req, res) {
        try {
            const return_id = req.params.id;
            const return_item = await Return.deleteReturn(return_id);
            if(return_item){
                res.status(200).json(return_item);
            } else {
                res.status(404).json({errors : "No return item found"});
            }
        } catch (error) {
            res.status(500).json({errors : "Internal Server Error"});
        }
    });

    app.use('/return', router);
}