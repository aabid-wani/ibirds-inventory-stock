const express = require('express');
const Branch = require("../models/branch.model.js");
const { fetchApi } = require('../middleware/fetchApi.js');
module.exports = function(app){

    var router = require("express").Router(); 
    router.get('/', fetchApi, async (req, res)=> {
        try {
            const result = await Branch.getBranch();
            if(result){
                res.status(200).json(result);
            }else{
                res.status(404).json({errors : "No data found"});
            }
        } catch (error) {
            res.status(500).json({errors : "Internal Server Error"});
        }
    });

    router.get('/:id', fetchApi, async (req, res)=> {
        try {
            const branchId = req.params.id;
            const branch =  await Branch.getBranchById(branchId);
            if(branch){
                res.status(200).json(branch[0]);
            }else{
                res.status(404).json({errors : "No branch found"});
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({errors : "Internal Server Error"});
        }
    });

    router.post('/create', fetchApi, async (req, res)=> {
        try {
            const branch = req.body;
            const result = await Branch.addBranch(branch);
            if(result){
                res.status(201).json({success : true ,message :" Branch Added Successfully ",result});
            }else{
                res.status(400).json({errors : "Error saving branch"});
            }
        } catch (error) {
            console.error('Error adding branch:', error);
            res.status(error.status || 500).json({ errors: error.message || "Internal Server Error" });
        }
    }); 

    router.put('/update/:id', fetchApi, async (req, res)=> {
        try {
            const branch = req.body;
            const branchId = req.params.id;
            const result = await Branch.updateBranch(branchId, branch);
            // console.log(result);
            if(result){
                res.status(200).json({success: true ,message : "Updating branch successfully",result});
            }else{
                res.status(400).json({errors : "Error updating branch"});
            }
        } catch (error) {
            console.error('Error updating branch:', error);
            res.status(error.status || 500).json({ errors: error.message || "Internal Server Error" });
        }
    });

    router.delete("/delete/:id", fetchApi, async (req, res) => {
        try {
            const branchId = req.params.id;
            const result = await Branch.deleteBranch(branchId);
            if (result) {
                res.status(200).json({ success: true, message: "Branch deleted successfully", result });
            } else {
                res.status(400).json({ success: false, errors: "Error deleting branch" });
            }
        } catch (error) {
            console.error('Error deleting branch:', error);
            res.status(error.status || 500).json({ success: false, errors: error.message || "Internal Server Error" });
        }
    });
    
    app.use("/branch", router);
};

