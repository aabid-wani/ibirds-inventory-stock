const express = require('express');
const Employee = require('../models/employee.model.js');
const { fetchApi } = require('../middleware/fetchApi.js');

module.exports = function(app) {
    const router = express.Router();

  
    router.get('/',  fetchApi, async (req, res) => {
        try {
            const employees = await Employee.getAllEmployees();
            res.status(200).json(employees);
        } catch (error) {
            res.status(500).json({ errors: "Error fetching employees" });
        }
    });

    
    router.get('/:id', fetchApi, async (req, res) => {
        try {
            const employee = await Employee.getEmployeeById(req.params.id);
            if (employee.length > 0) {
                res.status(200).json(employee[0]);
            } else {
                res.status(404).json({ errors: "Employee not found" });
            }
        } catch (error) {
            res.status(500).json({ errors: "Error fetching employee" });
        }
    });


    router.post('/create', fetchApi,  async (req, res) => {
       
        try {
            
            const result = await Employee.addEmployee(req.body);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error adding employee:', error);
            res.status(500).json({ errors: "Error adding employee", details: error.message });
        }
    });


    router.put('/update/:id', fetchApi, async (req, res) => {
        try {
            const result = await Employee.updateEmployee(req.params.id, req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ errors: "Error updating employee" });
        }
    });

     router.delete("/delete/:id", fetchApi, async (req, res) => {
        const employeeId = req.params.id;
        // console.log(`Attempting to delete employee with ID: ${employeeId}`);

        try {
            // Delete the employee record from the database
            const result = await Employee.deleteEmployee(employeeId);

            if (result.length > 0) {  // Checking if any row was returned
            res.status(200).json({ message: "Employee deleted successfully" });
            } else {
            res.status(400).json({ message: "Error deleting employee: Employee not found" });
            }
        } catch (error) {
            console.error("Error deleting employee:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    });


    app.use('/employee', router);
};
