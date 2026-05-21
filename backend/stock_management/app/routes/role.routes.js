const express = require('express');
const Role = require('../models/role.model.js');
const { fetchApi } = require('../middleware/fetchApi.js');

module.exports = function(app) {
    var router = express.Router();
    // console.log('role routes', router)
    

    router.get('/', fetchApi, async (req, res) => {
        try {
            const role = await Role.getRole();
            
            if (role) {
                res.status(200).json(role);
            } else {
                res.status(400).json({ errors: "No data" });
            }
        } catch (err) {
            res.status(500).json({ errors: "Server error", details: err.message });
        }
    })

    router.get('/:id', fetchApi ,async (req, res)=> {
        try {
            const roleId = req.params.id;
            const role = await Role.getRoleById(roleId);
            if (role) {
                res.status(200).json(role[0]);
            } else {
                res.status(400).json({ errors: "No role found" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.post('/create',fetchApi ,async (req, res)=> {
        try {
            const role = req.body;
            console.log('role' , role);
            
            const result = await Role.addRole(role);
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(400).json({ errors: "Error saving role" });
            }
        } catch (error) {
            console.error('Error adding role:', error);
            res.status(error.status || 500).json({ errors: error.message || "Internal Server Error" });
        }
    });

    router.put('/update/:id', async function(req, res) {
        try {
            const role = req.body;
            const roleId = req.params.id;
            // console.log('update role data =>',role,'role_id',roleId);
            
            const result = await Role.updateRole(roleId, role);
            // console.log('role  =>',result);
            
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(400).json({ errors: "Error updating role" });
            }
        } catch (error) {
            console.error('Error updating role:', error);
            res.status(error.status || 500).json({ errors: error.message || "Internal Server Error" });
        }
    });

    router.delete('/delete/:id', async function(req, res) {
        try {
            const roleId = req.params.id;
            const result = await Role.deleteRole(roleId);
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(400).json({ errors: "Error deleting role" });
            }
        } catch (error) {
            console.error('Error deleting role:', error);
            res.status(error.status || 500).json({ errors: error.message || "Internal Server Error" });
        }
    });

    app.use('/role', router);
}