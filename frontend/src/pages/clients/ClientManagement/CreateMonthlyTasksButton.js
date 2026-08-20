import React, { useState } from 'react';
import { message, Button } from 'antd'; // Import the Button component from antd
import { useAuth } from '../../../contexts/AuthContext';

// This is the complete React component for the task creation button.
// It can be used anywhere in your frontend application.
// It now accepts props like size and icon to be consistent with other Ant Design buttons.
const CreateMonthlyTasksButton = ({ size = 'default', ...props }) => {
    // State to manage the button's loading status.
    const [isLoading, setIsLoading] = useState(false);
    
    // Use the useAuth hook to get the authentication token
    const { authToken } = useAuth();
    // Prioritize 'accessToken' from localStorage as per your application's pattern
    // const token = authToken || localStorage.getItem('accessToken') || localStorage.getItem('token');
    const token = authToken || sessionStorage.getItem('token');
    
    // The base URL for your Django backend API.
    // const API_BASE_URL = 'http://localhost:8000/api/clients';
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000/api/clients'
        : 'https://api.ckpsca.in/api/clients';


    // Function to handle the click event and send the API request.
    const handleCreateTasks = async () => {
        setIsLoading(true);
        
        // Check if a token exists and is not an empty string before making the API call
        if (!token || token.trim() === '') {
            console.error('No valid token found. Aborting request.');
            message.error("Error: Authentication token not found. Please log in."); // Use antd message for error
            setIsLoading(false);
            return;
        }

        try {
            // Send a POST request to the custom action we created in the Django backend.
            // The endpoint is now correctly structured under the /clients/tasks/ namespace.
            const response = await fetch(`${API_BASE_URL}/tasks/create_monthly_tasks/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include the Authorization header with the token
                    'Authorization': `Token ${token}`,
                },
                // The body is empty because the backend logic doesn't require any data.
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                // If the response is not OK, something went wrong on the server.
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create tasks.');
            }

            // If the request was successful, parse the message from the backend and display it.
            const data = await response.json();
            message.success(data.message); // Use antd message for success
            
        } catch (error) {
            // Catch any network or server-side errors and display a message.
            message.error(`Error: ${error.message}`); // Use antd message for error
        } finally {
            // Always set loading to false after the request is complete.
            setIsLoading(false);
        }
    };

    return (
        // The button now has a custom style to enforce a green background and white text.
        <Button
            onClick={handleCreateTasks}
            loading={isLoading}
            size={size}
            // style={{ backgroundColor: '#2f0bd1ff', color: 'white' }}
            {...props} // Spread any other props like className or style
        >
            {isLoading ? 'Creating tasks...' : 'Auto Generate Task'}
        </Button>
    );
};

export default CreateMonthlyTasksButton;
