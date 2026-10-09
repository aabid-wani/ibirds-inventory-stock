const express = require('express');
const Permission = require('../models/permission.model.js');
const { fetchApi } = require('../middleware/fetchApi.js');

module.exports = function (app) {
    var router = express.Router();

    const requireSystemAdmin = (req, res, next) => {
        const role = req.user?.role_name;
        if (role !== 'System Admin' && role !== 'Super Admin') {
            return res.status(403).json({ errors: "Access denied. Only System Admin can access permissions." });
        }
        next();
    };

    router.get('/', fetchApi, requireSystemAdmin, async (req, res) => {
        try {
            const permission = await Permission.getPermission();
            if (permission) {
                res.status(200).json(permission);
            } else {
                res.status(400).json({ errors: "No permission found" });
            }
        } catch (error) {
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.get('/:id', fetchApi, requireSystemAdmin, async (req, res) => {
        try {
            const permissionId = req.params.id;
            const permission = await Permission.getPermissionById(permissionId);
            if (permission) {
                res.status(200).json(permission);
            } else {
                res.status(400).json({ errors: "No permission found" });
            }
        } catch (error) {
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.post('/create', fetchApi, requireSystemAdmin, async (req, res) => {
        try {
            const permission = req.body;
            const result = await Permission.upsertPermission(permission);
            if (result) {
                res.status(200).json({ success: true, message: "Permission Saved Successfully", result });
            } else {
                res.status(400).json({ errors: "Error saving permission" });
            }
        } catch (error) {
            res.status(error.status || 500).json({ errors: error.message || "Internal Server Error" });
        }
    });

    router.post('/batch', fetchApi, requireSystemAdmin, async (req, res) => {
        try {
            const { permissions } = req.body;
            if (!Array.isArray(permissions)) {
                return res.status(400).json({ errors: "Permissions array required" });
            }
            const results = [];
            for (const p of permissions) {
                const saved = await Permission.upsertPermission(p);
                results.push(saved);
            }
            res.status(200).json({ success: true, message: "All permissions updated successfully", results });
        } catch (error) {
            res.status(500).json({ errors: error.message || "Internal Server Error" });
        }
    });

    router.put('/update/:id', fetchApi, requireSystemAdmin, async (req, res) => {
        try {
            const permissionId = req.params.id;
            const permissionData = req.body;
           
            const result = await Permission.updatePermission(permissionId, permissionData);
            if (result) {
                res.status(200).json({ success: true, message: "Permission Updated Successfully", result });
            } else {
                res.status(400).json({ errors: "Error updating permission" });
            }
        } catch (error) {
            return res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.delete('/delete/:id', fetchApi, requireSystemAdmin, async (req, res) => {
        try {
            const permissionId = req.params.id;
            const result = await Permission.deletePermission(permissionId);
            
            if (result) {
                res.status(200).json({ success: true, message: "Permission Deleted Successfully" });
            } else {
                res.status(400).json({ errors: "Error deleting permission" });
            }
        } catch (error) {
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    router.get('/role/:name', fetchApi, requireSystemAdmin, async (req, res) => {
        const roleName = req.params.name;
        const permission = await Permission.getPermissionByRole(roleName);
      
        if (permission) {
            res.status(200).json(permission);
        } else {
            res.status(400).json({ errors: "No permission found" });
        }
    });

    router.get('/roleId/:roleId/moduleId/:moduleId', fetchApi, requireSystemAdmin, async (req, res) => {
        try {
            const roleId = req.params.roleId;
            const moduleId = req.params.moduleId;
            const permission = await Permission.getPermissionByRoleIdAndModuleId(roleId, moduleId);
            if (permission) {
                res.status(200).json(permission);
            } else {
                res.status(400).json({ errors: "No permission found" });
            } 
        } catch (error) {
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });
    
    router.get('/roles/:id', fetchApi, requireSystemAdmin, async (req, res) => {
        try {
            const roleId = req.params.id;
            const permission = await Permission.getPermissionByRoleId(roleId);
            if (permission) {
                res.status(200).json(permission);
            } else {
                res.status(400).json({ errors: "No permission found" });
            }
        } catch (error) {
            res.status(500).json({ errors: "Internal Server Error" });
        }
    });

    app.use('/permission', router);
};