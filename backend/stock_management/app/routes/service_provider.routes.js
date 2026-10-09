const express = require('express');
const { fetchApi } = require('../middleware/fetchApi.js');
const ServiceProvider = require('../models/service_provider.model.js');

module.exports = app => {
    const router = express.Router();

    router.get('/', fetchApi, async (req, res) => {
        try {
            const list = await ServiceProvider.getAllServiceProviders();
            res.status(200).send(list || []);
        } catch (error) {
            res.status(500).send({ message: 'Internal Server Error', error: error.message });
        }
    });

    router.get('/:id', fetchApi, async (req, res) => {
        try {
            const result = await ServiceProvider.getServiceProviderById(req.params.id);
            if (result && result.length > 0) {
                res.status(200).send(result[0]);
            } else {
                res.status(404).send({ message: 'Service Provider not found' });
            }
        } catch (error) {
            res.status(500).send({ message: 'Internal Server Error', error: error.message });
        }
    });

    router.post('/create', fetchApi, async (req, res) => {
        try {
            const data = req.body;
            if (!data.name) {
                return res.status(400).send({ message: 'Name is required' });
            }
            const result = await ServiceProvider.createServiceProvider(data);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: 'Internal Server Error', error: error.message });
        }
    });

    router.put('/update/:id', fetchApi, async (req, res) => {
        try {
            const result = await ServiceProvider.updateServiceProvider(req.params.id, req.body);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: 'Internal Server Error', error: error.message });
        }
    });

    router.delete('/delete/:id', fetchApi, async (req, res) => {
        try {
            const result = await ServiceProvider.deleteServiceProvider(req.params.id);
            if (result && result.length > 0) {
                res.status(200).send({ message: 'Service Provider deleted successfully' });
            } else {
                res.status(404).send({ message: 'Service Provider not found' });
            }
        } catch (error) {
            res.status(500).send({ message: 'Internal Server Error', error: error.message });
        }
    });

    app.use('/service_provider', router);
    app.use('/serviceProvider', router);
};
