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
            const user = await Auth.getUserLoginByEmail(email);
            console.log("user from db:", user);
            if (!user) {
                return res.status(400).json({ errors: "No user found", success: false });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            
            if (!passwordMatch) {
                return res.status(400).json({ errors: "Invalid password", success: false });
            }
           // console.log("user role_id:", user.role_id);
            const permission = await Permission.getPermissionByRoleId(user.role_id);
            const token = jwt.sign({ user, permission }, process.env.JWT_SECRET, { expiresIn: 60 * 60 * 24 });
            console.log("User data in token:", { user, permission });
            console.log("Generated token:", token);
            res.status(200).json({ token, success: true });
        } catch (err) {
            res.status(500).json({ errors: "Server error", details: err.message, success: false });
        }
    });

    router.post('/add', fetchApi, async (req, res)=> {
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

    // Update user (token required)
    router.put('/update/:id', fetchApi, async function (req, res) {
        try {
            const user = req.body;
            const userId = req.params.id;
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
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
    router.delete('/delete/:id', fetchApi, async function (req, res) {
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