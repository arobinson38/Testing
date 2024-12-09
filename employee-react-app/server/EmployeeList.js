import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EmployeesList = () =>{
    const[employees, setEmployees] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/employees')
        .then(response=>{
            setEmployees(response.data.data);
        })
        .catch(error=>{
            console.error('Error fetching Employees:',error);
        });
    }, []);

    return(
        <div>
            <h1>Employees List</h1>
            <ul>
                {employees.map(employee =>(
                    <li key ={employee.id}>
                        {employee.position}-{employee.firstName}{employee.lastName} 
                    </li>
                ))}
            </ul>
        </div>
    );
};
export default EmployeesList