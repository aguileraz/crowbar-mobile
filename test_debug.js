// Simple test to understand the mocking issue
const jest = require('jest');

console.log("Testing axios mock...");

// Simulate what the test does
jest.resetModules();
const axios = require('axios');

// Check if axios is mocked
console.log("Is axios mocked?", axios.create?.mock ? "Yes" : "No");
console.log("axios.create type:", typeof axios.create);

// Try to mock it
const mockAxiosInstance = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

axios.create = jest.fn().mockReturnValue(mockAxiosInstance);
console.log("After mocking - Is axios.create mocked?", axios.create.mock ? "Yes" : "No");

// Now require a module that uses axios
jest.resetModules();
const axios2 = require('axios');
console.log("After resetModules - Is axios2.create mocked?", axios2.create?.mock ? "Yes" : "No");
