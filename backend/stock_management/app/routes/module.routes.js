const express = require('express');
const Module = require('../models/module.model.js');
const { fetchApi } = require('../middleware/fetchApi.js');

module.exports = function (app) {
    var router = express.Router();

    router.get('/', fetchApi, async  (req, res)=> {
        try {
            const module = await Module.getModule();
            if(module){
                res.status(200).send(module);
            }else{
                res.status(404).send({   message: 'No module found'  });
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    });

    router.get('/:id', fetchApi, async  (req, res)=>{
        try {
            const moduleId = req.params.id;
            const module = await Module.getModuleById(moduleId);
            if(module){
                res.status(200).send(module);
            }else{
                res.status(404).send({
                    message: 'No module found'
                });
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    });

    router.post('/create',  fetchApi,async  (req, res)=>{
        try {
            const module = req.body;
            const result = await Module.addModule(module);
            if(result){
                res.status(200).send({success:true});
            }else{
                res.status(404).send({  message: 'No module found'  });
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' });
        }

    });

    router.put('/update/:id',  fetchApi, async  (req, res)=>{
        try {
        const module = req.body;
        const moduleId = req.params.id;
        // console.log('module =>',module)
        const result = await Module.updateModule(moduleId, module);
        if(result){
            res.status(200).send(result);
        }else{
            res.status(404).send({
                message: 'No module found'
            });
        }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    });

    router.delete('/delete/:id', async function (req, res){
        try {
            const moduleId = req.params.id;
            const result = await Module.deleteModule(moduleId);
            if(result){
                res.status(200).send(result);
            }else{
                res.status(404).send({  message: 'No module found' });
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    });

    app.use('/module', router);
}