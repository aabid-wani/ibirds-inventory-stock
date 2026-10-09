const express = require('express');
const Auth = require("../models/auth.model.js");
const { fetchApi } = require('../middleware/fetchApi.js');
const Permission = require("../models/permission.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = function (app) {
    var router = require("express").Router();

    // Get current user (token required)
    router.get('/', fetchApi, async function (req, res) {
        try {
            const user = await Auth.getUser();
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).json({ errors: "No data" });
            }
        } catch (err) {
            res.status(500).json({ errors: "Server error", details: err.message });
        }
    });

    // Login (no token required)
    router.post('/login', async function (req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ errors: "Email and password are required", success: false });
            }

            const user = await Auth.getUserLoginByEmail(email);
           
            if (!user) {
                return res.status(400).json({ errors: "No active user found with this email or username", success: false });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            
            if (!passwordMatch) {
                return res.status(400).json({ errors: "Invalid password", success: false });
            }
            const permission = await Permission.getPermissionByRoleId(user.role_id);
            const token = jwt.sign({ user, permission }, process.env.JWT_SECRET, { expiresIn: 60 * 60 * 24 });
            res.status(200).json({ token, success: true });
        } catch (err) {
            res.status(500).json({ errors: "Server error", details: err.message, success: false });
        }
    });

    const requireSuperAdmin = (req, res, next) => {
        if (!req.user || req.user.role_name !== 'Super Admin') {
            return res.status(403).json({ errors: "Access denied. Only Super Admin can manage system users." });
        }
        next();
    };

    const requireSuperAdminOrSelf = (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ errors: "Please authenticate" });
        }
        if (req.user.role_name === 'Super Admin' || req.params.id === req.user.id) {
            return next();
        }
        return res.status(403).json({ errors: "Access denied. Only Super Admin can manage system users." });
    };

    router.post('/add', fetchApi, requireSuperAdmin, async (req, res)=> {
        try {
            const user = req.body;
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
            const result = await Auth.addUser(user);
            if (result) {
                res.status(201).json({ result, success: true });
            }
            else {
                res.status(400).json({ errors: "Error adding user", success: false });
            }
        } catch (err) {
            res.status(500).json({ errors: "Server error", details: err.message, success: false });
        }
    });

    // Get all users (token required)
    router.get('/getAllUsers', fetchApi, async (req, res)=>{
        try {   
            const users = await Auth.getAllUsers();
            if (users) {
                res.status(200).json(users);
            } else {
                res.status(404).json({ errors: "No user found" });
            }
        } catch (err) {
            res.status(500).json({ errors: "Server error", details: err.message });
        }
    });

    // Get user by id (token required)
    router.get('/:id', fetchApi, async function (req, res) {
        try {
            const userId = req.params.id;
            const user = await Auth.getUserById(userId);
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).json({ errors: "No user found" });
            }
        } catch (err) {
            res.status(500).json({ errors: "Server error", details: err.message });
        }
    });

const fs = require('fs');
const path = require('path');

    // Update user (token required)
    router.put('/update/:id', fetchApi, requireSuperAdminOrSelf, async function (req, res) {
        try {
            const user = req.body || {};
            const userId = req.params.id;

            // Handle file upload if present in req.files
            if (req.files && req.files.length > 0) {
                const file = req.files.find(f => f.fieldname === 'profile_image') || req.files[0];
                if (file) {
                    const ext = path.extname(file.originalname) || '.jpg';
                    const filename = `avatar_${userId}_${Date.now()}${ext}`;
                    const uploadsDir = path.join(__dirname, '../../uploads');
                    if (!fs.existsSync(uploadsDir)) {
                        fs.mkdirSync(uploadsDir, { recursive: true });
                    }
                    const filepath = path.join(uploadsDir, filename);
                    fs.writeFileSync(filepath, file.buffer);
                    user.profile_image = `/uploads/${filename}`;
                }
            }

            if (user.password && typeof user.password === 'string' && user.password.trim() !== '') {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            } else {
                delete user.password;
            }

            const result = await Auth.updateUser(userId, user);
            if (result) {
                res.status(200).json({ result, success: true });
            } else {
                res.status(400).json({ errors: "Error updating user", success: false });
            }
        } catch (err) {
            res.status(500).json({ errors: "Server error", details: err.message, success: false });
        }
    });

    // Delete user (token required)
    router.delete('/delete/:id', fetchApi, requireSuperAdmin, async function (req, res) {
        try {
            const userId = req.params.id;
            const result = await Auth.deleteUser(userId);
            if (result) {
                res.status(200).json({ message: "User deleted successfully" });
            } else {
                res.status(400).json({ errors: "Error deleting user" });
            }
        } catch (err) {
            res.status(500).json({ errors: "Server error", details: err.message });
        }
    });

    app.use("/auth", router);
};