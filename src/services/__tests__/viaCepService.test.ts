 
import axios from 'axios';
import { viaCepService } from '../viaCepService';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ViaCepService', () => {
  // Limpar mocks antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAddressByCep', () => {
    it('deve buscar endereço por CEP válido', async () => {
      // Mock de resposta válida
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          complemento: '',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP',
          ibge: '3550308',
          gia: '1004',
          ddd: '11',
          siafi: '7107',
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // Executar
      const _result = await viaCepService.getAddressByCep('01310-100');

      // Verificar
      expect(_result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/01310100/json/',
        { timeout: 10000 }
      );
    });

    it('deve remover formatação do CEP antes da busca', async () => {
      const mockResponse = {
        data: {
          cep: '12345-678',
          logradouro: 'Rua Teste',
          bairro: 'Centro',
          localidade: 'Cidade Teste',
          uf: 'ST',
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // Testar com diferentes formatações
      await viaCepService.getAddressByCep('12.345-678');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/12345678/json/',
        { timeout: 10000 }
      );

      await viaCepService.getAddressByCep('12345678');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/12345678/json/',
        { timeout: 10000 }
      );
    });

    it('deve lançar erro para CEP com formato inválido', async () => {
      // CEP com menos de 8 dígitos
      await expect(viaCepService.getAddressByCep('12345')).rejects.toThrow('CEP deve ter 8 dígitos');
      
      // CEP com mais de 8 dígitos
      await expect(viaCepService.getAddressByCep('123456789')).rejects.toThrow('CEP deve ter 8 dígitos');
      
      // CEP vazio
      await expect(viaCepService.getAddressByCep('')).rejects.toThrow('CEP deve ter 8 dígitos');
      
      // Verificar que axios não foi chamado
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('deve tratar erro 404 como CEP não encontrado', async () => {
      const mockError = {
        response: { status: 404 },
      };
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(viaCepService.getAddressByCep('99999999')).rejects.toThrow('CEP não encontrado');
    });

    it('deve tratar timeout na requisição', async () => {
      const mockError = {
        code: 'ECONNABORTED',
      };
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(viaCepService.getAddressByCep('12345678')).rejects.toThrow('Timeout na busca do CEP');
    });

    it('deve tratar outros erros genericamente', async () => {
      const mockError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(viaCepService.getAddressByCep('12345678')).rejects.toThrow('Erro ao buscar CEP');
    });
  });

  describe('getCepsByAddress', () => {
    it('deve buscar CEPs por endereço válido', async () => {
      const mockResponse = {
        data: [
          {
            cep: '01310-100',
            logradouro: 'Avenida Paulista',
            complemento: 'de 612 a 1510 - lado par',
            bairro: 'Bela Vista',
            localidade: 'São Paulo',
            uf: 'SP',
          },
          {
            cep: '01310-200',
            logradouro: 'Avenida Paulista',
            complemento: 'de 1512 a 2132 - lado par',
            bairro: 'Bela Vista',
            localidade: 'São Paulo',
            uf: 'SP',
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // Executar
      const _result = await viaCepService.getCepsByAddress('SP', 'São Paulo', 'Avenida Paulista');

      // Verificar
      expect(_result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/SP/São Paulo/Avenida Paulista/json/',
        { timeout: 10000 }
      );
    });

    it('deve validar parâmetros obrigatórios', async () => {
      // UF ausente
      await expect(viaCepService.getCepsByAddress('', 'São Paulo', 'Rua Teste'))
        .rejects.toThrow('UF, cidade e rua são obrigatórios');

      // Cidade ausente
      await expect(viaCepService.getCepsByAddress('SP', '', 'Rua Teste'))
        .rejects.toThrow('UF, cidade e rua são obrigatórios');

      // Rua ausente
      await expect(viaCepService.getCepsByAddress('SP', 'São Paulo', ''))
        .rejects.toThrow('UF, cidade e rua são obrigatórios');
    });

    it('deve validar formato da UF', async () => {
      // UF com 1 caractere
      await expect(viaCepService.getCepsByAddress('S', 'São Paulo', 'Rua Teste'))
        .rejects.toThrow('UF deve ter 2 caracteres');

      // UF com 3 caracteres
      await expect(viaCepService.getCepsByAddress('SPP', 'São Paulo', 'Rua Teste'))
        .rejects.toThrow('UF deve ter 2 caracteres');
    });

    it('deve validar tamanho mínimo do nome da rua', async () => {
      // Nome da rua muito curto
      await expect(viaCepService.getCepsByAddress('SP', 'São Paulo', 'AB'))
        .rejects.toThrow('Nome da rua deve ter pelo menos 3 caracteres');
    });

    it('deve tratar erro 404 como endereço não encontrado', async () => {
      const mockError = {
        response: { status: 404 },
      };
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(viaCepService.getCepsByAddress('SP', 'São Paulo', 'Rua Inexistente'))
        .rejects.toThrow('Endereço não encontrado');
    });

    it('deve tratar timeout na requisição', async () => {
      const mockError = {
        code: 'ECONNABORTED',
      };
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(viaCepService.getCepsByAddress('SP', 'São Paulo', 'Avenida Paulista'))
        .rejects.toThrow('Timeout na busca do endereço');
    });

    it('deve tratar outros erros genericamente', async () => {
      const mockError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(viaCepService.getCepsByAddress('SP', 'São Paulo', 'Avenida Paulista'))
        .rejects.toThrow('Erro ao buscar endereço');
    });
  });

  describe('isValidCep', () => {
    it('deve validar CEPs corretos', () => {
      // CEP sem formatação
      expect(viaCepService.isValidCep('12345678')).toBe(true);
      
      // CEP com formatação
      expect(viaCepService.isValidCep('12345-678')).toBe(true);
      
      // CEP com outros caracteres
      expect(viaCepService.isValidCep('12.345-678')).toBe(true);
    });

    it('deve invalidar CEPs incorretos', () => {
      // CEP muito curto
      expect(viaCepService.isValidCep('12345')).toBe(false);
      
      // CEP muito longo
      expect(viaCepService.isValidCep('123456789')).toBe(false);
      
      // CEP vazio
      expect(viaCepService.isValidCep('')).toBe(false);
      
      // Apenas letras
      expect(viaCepService.isValidCep('abcdefgh')).toBe(false);
    });
  });

  describe('formatCep', () => {
    it('deve formatar CEP válido corretamente', () => {
      // CEP sem formatação
      expect(viaCepService.formatCep('12345678')).toBe('12345-678');
      
      // CEP já formatado
      expect(viaCepService.formatCep('12345-678')).toBe('12345-678');
      
      // CEP com outros caracteres
      expect(viaCepService.formatCep('12.345.678')).toBe('12345-678');
    });

    it('deve retornar CEP sem formatação se inválido', () => {
      // CEP muito curto
      expect(viaCepService.formatCep('12345')).toBe('12345');
      
      // CEP muito longo
      expect(viaCepService.formatCep('123456789')).toBe('123456789');
      
      // CEP vazio
      expect(viaCepService.formatCep('')).toBe('');
    });
  });

  describe('cleanCep', () => {
    it('deve remover toda formatação do CEP', () => {
      // CEP com hífen
      expect(viaCepService.cleanCep('12345-678')).toBe('12345678');
      
      // CEP com pontos
      expect(viaCepService.cleanCep('12.345.678')).toBe('12345678');
      
      // CEP com vários caracteres especiais
      expect(viaCepService.cleanCep('12.345-678')).toBe('12345678');
      
      // CEP sem formatação
      expect(viaCepService.cleanCep('12345678')).toBe('12345678');
      
      // CEP com espaços
      expect(viaCepService.cleanCep('12 345 678')).toBe('12345678');
    });

    it('deve retornar string vazia para entrada vazia', () => {
      expect(viaCepService.cleanCep('')).toBe('');
    });

    it('deve remover letras e manter apenas números', () => {
      expect(viaCepService.cleanCep('ABC12345678XYZ')).toBe('12345678');
    });
  });

  describe('Casos de uso integrados', () => {
    it('deve buscar e formatar endereço completo', async () => {
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          complemento: '',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP',
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      // Buscar endereço com CEP não formatado
      const address = await viaCepService.getAddressByCep('01310100');
      
      // Formatar CEP retornado
      const formattedCep = viaCepService.formatCep(address.cep);
      
      expect(formattedCep).toBe('01310-100');
      expect(address.logradouro).toBe('Avenida Paulista');
    });

    it('deve validar, limpar e buscar CEP', async () => {
      const inputCep = '12.345-678';
      
      // Validar
      expect(viaCepService.isValidCep(inputCep)).toBe(true);
      
      // Limpar
      const cleanedCep = viaCepService.cleanCep(inputCep);
      expect(cleanedCep).toBe('12345678');
      
      // Buscar
      const mockResponse = {
        data: {
          cep: '12345-678',
          logradouro: 'Rua Teste',
          localidade: 'Cidade',
          uf: 'UF',
        },
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);
      
      const address = await viaCepService.getAddressByCep(cleanedCep);
      expect(address.logradouro).toBe('Rua Teste');
    });
  });
});