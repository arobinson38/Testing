const request = require('supertest');
const express = require('express');
const authRoutes = require('../server/authRoutes');  
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../server/createDatabase');
require('dotenv').config();

// Mock the database methods used in authRoutes
jest.mock('../server/createDatabase', () => ({
  get: jest.fn(),
  prepare: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  // Test user registration
  describe('POST /auth/register', () => {
    it('should return 400 if validation fails', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'jdoe',
        email: 'jdoe@email.com',
        password: 'password',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 if user already exists', async () => {
      db.get.mockImplementationOnce((sql, params, callback) => {
        callback(null, { id: 1, username: 'jdoe', email: 'jdoe@email.com' });
      });

      const response = await request(app).post('/auth/register').send({
        username: 'jdoe',
        email: 'jdoe@email.com',
        password: 'password',
      });

      expect(response.status).toBe(400);
      expect(response.body.msg).toBe('User already exists with this email or username');
    });

    it('should register a new user successfully', async () => {
      db.get.mockImplementationOnce((sql, params, callback) => {
        callback(null, null);  
      });
      bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');
      db.prepare.mockReturnValue({
        run: jest.fn((username, email, hashedPassword, callback) => {
          callback(null);
        }),
      });

      const response = await request(app).post('/auth/register').send({
        username: 'jdoe',
        email: 'jdoe@email.com',
        password: 'password',
      });

      expect(response.status).toBe(201);
      expect(response.body.msg).toBe('User registered successfully');
    });
  });

  // Test user login
  describe('POST /auth/login', () => {
    it('should return 400 if credentials are invalid', async () => {
      db.get.mockImplementationOnce((sql, params, callback) => {
        callback(null, null);  
      });

      const response = await request(app).post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.msg).toBe('Invalid credentials');
    });

    it('should return 200 and a token if login is successful', async () => {
      const user = { id: 1, email: 'user@example.com', password: 'hashedpassword' };
      db.get.mockImplementationOnce((sql, params, callback) => {
        callback(null, user);  
      });

      bcrypt.compare = jest.fn().mockResolvedValue(true);  
      jwt.sign = jest.fn().mockReturnValue('fake-jwt-token');

      const response = await request(app).post('/auth/login').send({
        email: 'jdoe@email.com',
        password: 'password',
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('fake-jwt-token');
    });
  });

  // Test protected route
  describe('GET /auth/profile', () => {
    it('should return 401 if no token is provided', async () => {
      const response = await request(app).get('/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.msg).toBe('No token, authorization denied');
    });

    it('should return 200 and user data if token is valid', async () => {
      const token = 'fake-jwt-token';
      const user = { id: 1, username: 'user1', email: 'user@example.com' };

      jwt.verify = jest.fn().mockReturnValue({ userId: 1 });  

      db.get.mockImplementationOnce((sql, params, callback) => {
        callback(null, user);  
      });

      const response = await request(app)
        .get('/auth/profile')
        .set('x-auth-token', token);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(user.username);
      expect(response.body.email).toBe(user.email);
    });
  });
});
