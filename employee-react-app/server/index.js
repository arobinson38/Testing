//setup basic express server 
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
//const cors = require('cors');
const authRoutes = require('../server/authRoutes');
console.log('JWT_SECRET:', process.env.JWT_SECRET);  
require('dotenv').config();


//middleware 
//app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes); 

//database setup 
const db = new sqlite3.Database('./mydb.sqlite',(err) =>{
    if(err){
        console.error('Error opening database:', err.message);
    }else{
        console.log('connected to SQLite database');
    }
});

//Create an employee
app.post('/api/employees', (req,res) => {
    const{firstName, lastName, position} = req.body; 
    if(!firstName || !lastName || !position) {
        return res.status(400).json({message: 'First name, last name, and position are required'});
    }
    const query =  `INSERT INTO employees (firstName, lastName, position) VALUES (?,?,?)`;
    db.run(query, [firstName, lastName, position], function (err){
        if(err){
            return res.status(500).json({message: 'Error inserting employee', error: err.message});
        }
        res.status(201).json({id: this.lastID, firstName, lastName, position});
    });
});

//get all employees
app.get('/api/employees',(req,res)=>{
    db.all('SELECT * FROM employees',[],(err,rows)=>{
        if(err){
            res.status(400).json({error:err.message});
            return;
        }
        res.json({data:rows});
    });
});

//get employees by ID
app.get('/api/employees/:id', (req,res) => {
    const { id } = req.params;
    const query = `SELECT * FROM employees WHERE id = ?`; 
    db.get(query, [id], (err,row) => {
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!row){
            return res.status(404).json({message: 'Emloyee not found'});
        }
        res.json({data: row});
    });
});

//update an employee 
app.put('/api/employees/:id',(req,res) => {
    const { id } = req.params;
    const{firstName, lastName, position} = req.body;
    console.log('Received PUT request for ID: ', id);
    console.log('Request body: ', req.body);
    if(!firstName || !lastName || !position) {
        return res.status(400).json({message: 'First name, last name, and position are required'});
    }
    const query =  `UPDATE employees SET firstName = ?, lastName = ?, position = ? WHERE id = ?`; 
    console.log('SQL Query: ', query);
    console.log('Parameters: ', [id, firstName, lastName, position]);
    db.run(query, [firstName, lastName, position, id], function (err){
        if(err){
            console.error('Error executing SQL query: ', err.message);
            return res.status(500).json({message: 'Error updating employee', error: err.message});
        }
        if(this.changes === 0){
            return res.status(404).json({message: 'Employee not found'});
        }
        console.log(`Employee with ID: ${id} updated successfully`); 
        res.json({message: 'Employee updated successfully', id, firstName, lastName, position });
    });
});

//delete an employee
app.delete('/api/employees/:id', (req,res) => {
    const {id}=req.params;
    const query = `DELETE FROM employees WHERE id = ?`;
    db.run(query, [id], function(err){
        if(err){
            return res.status(500).json({message: 'Error deleting employee', error: err.message});
        }
        if(this.changes === 0){
            return res.status(404).json({message: 'Employee not found'});
        }
        res.json({message: 'Employee deleted succesfully'});
    });
});

//Start Server 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>{
    console.log(`Server running on http://localhost:${PORT}`);
});