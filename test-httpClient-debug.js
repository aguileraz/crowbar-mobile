const axios = require('axios');

jest.mock('axios');

describe('Debug axios mock', () => {
  it('should show axios.create', () => {
    console.log('axios:', axios);
    console.log('axios.create:', axios.create);
    console.log('is mock:', jest.isMockFunction(axios.create));
  });
});
