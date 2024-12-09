//setup sqlite3 
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mydb.sqlite');

//create database
db.serialize(()=> {
    //create Employees table 
    db.run(`CREATE TABLE IF NOT EXISTS employees(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT,
        lastName TEXT, 
        position TEXT)`,(err) => {
            if(err){
                console.error('Error creating employees table:',err.message);
            }else{
                console.log('Employees table created successfully');
            }
        });

    //Insert employee 
    db.run(`INSERT INTO employees(firstName,lastName,position)
        VALUES('Random', 'Person', 'back-end')`);

    //Create users table 
    db.run(`CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL, 
        password TEXT NOT NULL
        )`);
});

module.exports = db; 