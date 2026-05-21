const express = require('express');
const Permission = require('../models/permission.model.js');
const { fetchApi } = require('../middleware/fetchApi.js');

module.exports = function (app) {
    var router = express.Router();


    router.get('/', fetchApi , async  (req, res)=> {
        try {
        const permission = await Permission.getPermission();
        if (permission) {
            res.status(200).json(permission);
        } else {
            res.status(400).json({
                errors: "No permission found"
            });
        }
        } catch (error) {
            console.error(error);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.get('/:id', fetchApi , async  (req, res)=> {
        try{
            const permissionId = req.params.id;
            const permission = await Permission.getPermissionById(permissionId);
            // console.log(permission)
            if (permission) {
                res.status(200).json(permission );
            } else {
                res.status(400).json({
                    errors: "No permission found"
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.post('/create',  fetchApi, async  (req, res)=> {
        try {
            const permission = req.body;
            const existingPermission = await Permission.checkPermissionExists(permission.role_id, permission.module_id);
            if (existingPermission) {
                return res.status(400).json({ errors: "Permission already exists for this role and module" });
            }
            const result = await Permission.addPermission(permission);
            if (result) {
                res.status(201).json({ success: true, message: "Permission Added Successfully", result });
            } else {
                res.status(400).json({ errors: "Error saving permission" });
            }
        } catch (error) {
            console.error('Error adding permission:', error);
            res.status(error.status || 500).json({ errors: error.message || "Internal Server Error" });
        }
    });


    router.put('/update/:id', fetchApi ,async (req, res)=> {
        try {
            const permissionId = req.params.id;
            const permissionData = req.body;
            // const existingPermission = await Permission.checkPermissionExists(permissionData.role_id, permissionData.module_id);
            // if (existingPermission && existingPermission.id !== parseInt(permissionId)) {
            //     return res.status(400).json({ errors: "Permission already exists for this role and module" });
            // }
            const result = await Permission.updatePermission(permissionId, permissionData);
            if (result) {
                res.status(200).json({ success: true, message: "Permission Updated Successfully", result });
            } else {
                res.status(400).json({ errors: "Error updating permission" });
            }
        } catch (error) {
            console.error('Error checking existing permission:', error);
            return res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.delete('/delete/:id', fetchApi ,async  (req, res)=> {
        try {
            const permissionId = req.params.id;
            const result = await Permission.deletePermission(permissionId);
            // console.log('result value =>',result)
            if (result) {
                res.status(200).json({ success: true, message: "Permission Deleted Successfully" });
            } else {
                res.status(400).json({
                    errors: "Error deleting permission"
                });
            }
        } catch (error) {
            console.error('Error deleting permission:', error);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.get('/role/:name', fetchApi ,async  (req, res)=> {
        const roleName = req.params.name;
        const permission = await Permission.getPermissionByRole(roleName);
        // console.log('permission=>   : ',permission)
       if (permission) {
            res.status(200).json(permission);
        } else {
            res.status(400).json({
                errors: "No permission found"
            });
        }
    })

    router.get('/roleId/:roleId/moduleId/:moduleId', fetchApi, async  (req, res)=> {
        try {
            const roleId = req.params.roleId;
            const moduleId = req.params.moduleId;
            const permission = await Permission.getPermissionByRoleIdAndModuleId(roleId, moduleId);
            if (permission) {
                res.status(200).json(permission);
            } else {
                res.status(400).json({  errors: "No permission found" });
            } 
        } catch (error) {
            console.error(error);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });
    
    router.get('/roles/:id',fetchApi, async (req, res) => {
        try {
            const roleId = req.params.id;
            const permission = await Permission.getPermissionByRoleId(roleId);
            if (permission) {
                res.status(200).json(permission);
            } else {
                res.status(400).json({ errors: "No permission found" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ errors: "Internal Server Error" });
        }
    })

    app.use('/permission', router);
}   