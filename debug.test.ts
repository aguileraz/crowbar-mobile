import axios from 'axios';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Debug test', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    // Criar mock da instância do Axios
    const mockAxiosInstance = {
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    };
    
    // Configurar axios.create para retornar a instância mock
    console.log('Setting up mock...');
    console.log('mockedAxios.create before:', mockedAxios.create);
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    console.log('mockedAxios.create after:', mockedAxios.create);
    console.log('Is it a mock?', mockedAxios.create.mock ? 'Yes' : 'No');
    
    // Try to require httpClient
    console.log('Requiring httpClient...');
    try {
      const httpClientModule = require('../src/services/httpClient');
      console.log('Success!');
    } catch (error) {
      console.log('Error:', error.message);
    }
  });
  
  it('should work', () => {
    expect(true).toBe(true);
  });
});
