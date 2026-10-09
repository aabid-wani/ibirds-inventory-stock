const express = require('express')
const Issue = require('../models/issue.model.js');
const { fetchApi } = require('../middleware/fetchApi.js');

module.exports = function(app) {
    let router = express.Router();
    router.get('/', fetchApi, async (req, res)=> {
        try {
            const issues = await Issue.getAllIssues();
            if(issues){
                res.status(200).json(issues);
            }else{
                res.status(404).json({errors : "No issues found"});
            }
        } catch (error) {
            res.status(500).json({errors : "Internal Server Error"});
        }
    });

    router.get('/:id', fetchApi, async (req,res)=>{
        try {
            let id = req.params.id;
            const result = await Issue.getIssueById(id);
            if(result){
                res.status(200).json({ result , success : true});
            }else{
                res.status(404).json({errors : "Issue not found"});
            }
        } catch (error) {
            res.status(500).json({errors : "Internal Server Error"});
        }
    })

    router.post('/create',  fetchApi ,async (req, res)=> {
        try {
            const issue = req.body;
            const result = await Issue.addIssue(issue, req.user?.id || req.user?.email);
            if(result){
                const Activity = require('../models/activity.model.js');
                Activity.logActivity({
                    user_id: req.user?.id,
                    user_name: req.user?.name || 'User',
                    user_email: req.user?.email,
                    role_name: req.user?.role_name,
                    action_type: 'ISSUE',
                    action_category: 'issuing',
                    module: 'provisions',
                    description: `Issued ${issue.quantity || 1} unit(s) of inventory stock`,
                    entity_id: result[0]?.id || issue.id
                });
                res.status(201).json({result, success : true});
            }else{
                res.status(400).json({errors : "Error adding issue"});
            }
         } catch (error) {
            res.status(500).json({errors : "Internal Server Error"});
         }
    });


    router.post("/bulk", fetchApi, async (req, res) => {
        const provisions = req.body;

        if (!Array.isArray(provisions) || provisions.length === 0) {
            return res.status(400).json({ error: "Invalid input data." });
        }

        try {
            await Issue.insertBulkProvisions(provisions);
            const Activity = require('../models/activity.model.js');
            Activity.logActivity({
                user_id: req.user?.id,
                user_name: req.user?.name || 'User',
                user_email: req.user?.email,
                role_name: req.user?.role_name,
                action_type: 'ISSUE',
                action_category: 'issuing',
                module: 'provisions',
                description: `Created bulk inventory provisions (${provisions.length} items issued)`
            });
            res.status(200).json({ message: "Bulk insert successful", success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to insert provisions" });
        }
    });

    router.put('/updateQuantity/:id', fetchApi ,async (req, res)=> {
        try {
            const issueId = req.params.id;
            const { quantity } = req.body;
            const result = await Issue.updateIssueQuantity(issueId, quantity);
            if (result) {
                res.status(200).json({ result, success: true });
            } else {
                res.status(400).json({ errors: "Error updating issue quantity" });
            }
        } catch (error) {
            res.status(500).json({ errors: "Internal Server Error" });
        }
    })

    router.put('/update/:id', fetchApi ,async (req, res)=> {
        try {
            const issueId = req.params.id;
            const issueData = req.body;
            const result = await Issue.updateIssue(issueId, issueData);
            // console.log('update issue result',result);
            
            if (result) {
                const Activity = require('../models/activity.model.js');
                Activity.logActivity({
                    user_id: req.user?.id,
                    user_name: req.user?.name || 'User',
                    user_email: req.user?.email,
                    role_name: req.user?.role_name,
                    action_type: 'UPDATE_ISSUE',
                    action_category: 'issuing',
                    module: 'provisions',
                    description: `Updated issue #${issueId} details`,
                    entity_id: issueId
                });
                res.status(200).json({ result, success: true });
            } else {
                res.status(400).json({ errors: "Error updating issue ID" });
            }
        } catch (error) {
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

     router.delete('/delete/:id', fetchApi, async (req,res) => {
       try {
            const issueId = req.params.id;
            const result = await Issue.removeIssue(issueId);
            if (result) {
                const Activity = require('../models/activity.model.js');
                Activity.logActivity({
                    user_id: req.user?.id,
                    user_name: req.user?.name || 'User',
                    user_email: req.user?.email,
                    role_name: req.user?.role_name,
                    action_type: 'DELETE_ISSUE',
                    action_category: 'issuing',
                    module: 'provisions',
                    description: `Deleted issue record #${issueId}`,
                    entity_id: issueId
                });
                res.status(200).json({ result, success: true });
            } else {
                res.status(400).json({ errors: "Error deleting issue ID" });
            }
        } catch (error) {
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });


    app.use('/issue', router);
};