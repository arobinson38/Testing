const request = require('supertest');
const sqlite3 = require('sqlite3');
const app = require('../server/index'); 

// Mock sqlite3 database methods
jest.mock('sqlite3', () => {
  const mockDb = {
    run: jest.fn(),
    all: jest.fn(),
    get: jest.fn(),
  };
  return {
    verbose: jest.fn().mockReturnValue(mockDb),
    Database: jest.fn().mockReturnValue(mockDb),
  };
});

describe('Employee API routes', () => {
  let db;

  beforeAll(() => {
     app.listen(5000); 
  });

  beforeEach(() => {
    // Reset mocks before each test to avoid test leakage
    db = new sqlite3.Database(); 
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test: POST /api/employees 
  it('should create a new employee', async () => {
    const newEmployee = {
      firstName: 'John',
      lastName: 'Doe',
      position: 'Software Engineer',
    };

    // Mock the database response for INSERT
    db.run.mockImplementationOnce((query, params, callback) => {
      callback(null);
    });

    const response = await request(app).post('/api/employees').send(newEmployee);

    expect(response.status).toBe(201);
    expect(response.body.firstName).toBe('John');
    expect(response.body.lastName).toBe('Doe');
    expect(response.body.position).toBe('Software Engineer');
  });

  // Test: GET /api/employees 
  it('should return a list of employees', async () => {
    const employees = [
      { id: 1, firstName: 'John', lastName: 'Doe', position: 'Software Engineer' },
      { id: 2, firstName: 'Jane', lastName: 'Doe', position: 'Product Manager' },
    ];

    // Mock the database response for SELECT 
    db.all.mockImplementationOnce((query, params, callback) => {
      callback(null, employees); // Simulate success
    });

    const response = await request(app).get('/api/employees');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(2);
    expect(response.body.data[0].firstName).toBe('John');
    expect(response.body.data[1].firstName).toBe('Jane');
  });

  // Test: GET /api/employees/:id 
  it('should return a specific employee', async () => {
    const employee = { id: 1, firstName: 'John', lastName: 'Doe', position: 'Software Engineer' };

    // Mock the database response for SELECT by ID
    db.get.mockImplementationOnce((query, params, callback) => {
      callback(null, employee); 
    });

    const response = await request(app).get('/api/employees/1');

    expect(response.status).toBe(200);
    expect(response.body.data.firstName).toBe('John');
  });

  // Test: PUT /api/employees/:id 
  it('should update an existing employee', async () => {
    const updatedEmployee = { firstName: 'John', lastName: 'Doe', position: 'Senior Software Engineer' };

    // Mock the database response for UPDATE
    db.run.mockImplementationOnce((query, params, callback) => {
      callback(null); // Simulate success
    });

    const response = await request(app).put('/api/employees/1').send(updatedEmployee);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Employee updated successfully');
    expect(response.body.position).toBe('Senior Software Engineer');
  });

  // Test: DELETE /api/employees/:id 
  it('should delete an employee', async () => {
    // Mock the database response for DELETE
    db.run.mockImplementationOnce((query, params, callback) => {
      callback(null); 
    });

    const response = await request(app).delete('/api/employees/1');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Employee deleted succesfully');
  });
});
