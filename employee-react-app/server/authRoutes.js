//Handle logins 
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {body, validationResult} = require('express-validator');
const sqlite3 = require('sqlite3').verbose(); 
const db = require('../server/createDatabase'); 
require('dotenv').config();

const router = express.Router();

//User Registration 
router.post('/register', [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({min:6}).withMessage('Password must be at least 6 characters long')
],(req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {username, email, password} = req.body; 
    //check if user exists already 
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
        if(err){
            return res.status(500).json({msg: 'Database error'});
        }
        if(row){
            return res.status(400).json({msg: 'User already exists with this email or username'});
        }

        //hash password 
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if(err){
                return res.status(500).json({msg:'Password hashing failed'});
            }

            const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
            stmt.run(username, email, hashedPassword, function(err) {
                if(err){
                    return res.status(500).json({msg: 'Failed to register user'});
                }
                res.status(201).json({msg: 'User registered successfully'});
            });
        });
    });
});

//user login 
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array() });
    }
    const {email, password } = req.body;

    //find user by email 
    db.get('SELECT * FROM users WHERE email = ?', [email], (err,row) => {
        if(err){
            console.error('Database error: ', err); 
            return res.status(500).json({msg:'Database error'});
        }
        if(!row){
            console.log('User not found for email: ', email); 
            return res.status(400).json({msg:'Invalid credentials'});
        }
        console.log('Found user:', row); 

        //compare password with stored hash
        bcrypt.compare(password, row.password, (err, isMatch) => {
            if(err){
                return res.status(500).json({msg:'Error comparing password'});
            }
            console.log('Password match:', isMatch);
            if(!isMatch) {
                return res.status(400).json({msg: 'Invalid Credentials'});
            }

            console.log('JWT_SECRET:', process.env.JWT_SECRET);

            try{
                const token = jwt.sign({userId: row.id }, process.env.JWT_SECRET, {expiresIn: '1h'});
                console.log('generated token:', token); 
                res.json({token});
            }catch (err){
                console.error('Error during token generation:', err);
                return res.status(500).json({msg: 'Error generating JWT token'});
            }

            //generate JWT token 
            //console.log('Generating JWT token');
            
        });
    });
});

//Middleware to protect routes
const protect = (req, res, next) => {
    const token = req.header('x-auth-token');
    if(!token){
        return res.status(401).json({msg: 'No token, authorization denied'});
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.userId;
        next();
    }catch(err){
        res.status(401).json({msg:'Token is not valid'}); 
    }
}; 

//Protected Profile route
router.get('/profile', protect, (req, res) => {
    db.get('SELECT id, username, email FROM users WHERE id = ? ', [req.user], (err, row) => {
        if(err){
            return res.status(500).json({msg: 'Database error'});
        }
        if(!row){
            return res.status(404).json({msg: 'User not found'});
        }
        res.json(row);
    });
});

module.exports = router; 