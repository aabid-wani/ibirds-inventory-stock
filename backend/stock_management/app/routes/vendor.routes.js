const express = require('express')
const Vendor = require('../models/vendor.model.js');
const { fetchApi } = require('../middleware/fetchApi.js');

module.exports = function(app) {
    var router = express.Router();
    router.get('/',  fetchApi, async (req, res)=> {
        try {
            const vendor = await Vendor.getVendor();
            if (vendor) {
                res.status(200).send(vendor)
            } else {
                res.status(404).send({  message: "No vendor found" })
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    });

    router.get('/:id', fetchApi ,async (req, res)=> {
        try {
            const vendorId = req.params.id;
            const vendor = await Vendor.getVendorById(vendorId);
            console.log(vendor)
            if (vendor) {
                res.status(200).send(vendor)
            } else {
                res.status(404).send({  message: "No vendor found" })
            }
         } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' }); 
        }
    }); 

    router.post('/create', fetchApi , async (req, res)=> {
        try {
            const vendor = req.body;
            const result = await Vendor.addVendor(vendor);
            if (result) {
                res.status(200).send(result)
            } else {
            res.status(404).send({
                message: "No vendor found"
            })
        }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' }); 
        }
    });

    router.put('/update/:id',fetchApi ,async (req, res)=> {
        try {
            const vendor = req.body;
            const vendorId = req.params.id;
            const result = await Vendor.updateVendor(vendorId, vendor);
            if (result) {
                res.status(200).send(result)
            } else {
                res.status(404).send({
                    message: "No vendor found"
                })
            }
        } catch (error) {   
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' }); 
        }
    });

    router.delete('/delete/:id',  fetchApi ,async (req, res)=> {
        try {

            const vendorId = req.params.id;
            const result = await Vendor.deleteVendor(vendorId);
            if (result) {
                res.status(200).send(result)
            } else {
                res.status(404).send({
                    message: "No vendor found"
                })
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' }); 
        }
    });

    app.use('/vendor',router);
}
