import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const solveCube = async (cubeString) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/solve`, {
      cubeString
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to solve the cube. Make sure the configuration is correct.');
    }
    throw new Error('Could not connect to the solver backend. Make sure the backend server is running on port 5000.');
  }
};
