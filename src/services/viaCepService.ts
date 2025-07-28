import axios from 'axios';

/**
 * Serviço para integração com a API ViaCEP
 * Busca automática de endereços por CEP
 */

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

class ViaCepService {
  private baseURL = 'https://viacep.com.br/ws';

  /**
   * Buscar endereço por CEP
   */
  async getAddressByCep(cep: string): Promise<ViaCepResponse> {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');
    
    // Valida formato do CEP
    if (cleanCep.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    try {
      const _response = await axios.get<ViaCepResponse>(
        `${this.baseURL}/${cleanCep}/json/`,
        {
          timeout: 10000, // 10 segundos
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('CEP não encontrado');
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout na busca do CEP');
      }
      
      throw new Error('Erro ao buscar CEP');
    }
  }

  /**
   * Buscar CEPs por endereço (busca reversa)
   */
  async getCepsByAddress(uf: string, city: string, street: string): Promise<ViaCepResponse[]> {
    // Valida parâmetros
    if (!uf || !city || !street) {
      throw new Error('UF, cidade e rua são obrigatórios');
    }

    if (uf.length !== 2) {
      throw new Error('UF deve ter 2 caracteres');
    }

    if (street.length < 3) {
      throw new Error('Nome da rua deve ter pelo menos 3 caracteres');
    }

    try {
      const _response = await axios.get<ViaCepResponse[]>(
        `${this.baseURL}/${uf}/${city}/${street}/json/`,
        {
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Endereço não encontrado');
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout na busca do endereço');
      }
      
      throw new Error('Erro ao buscar endereço');
    }
  }

  /**
   * Validar formato de CEP
   */
  isValidCep(cep: string): boolean {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8;
  }

  /**
   * Formatar CEP com máscara
   */
  formatCep(cep: string): string {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    
    return cleanCep;
  }

  /**
   * Remover máscara do CEP
   */
  cleanCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }
}

export const viaCepService = new ViaCepService();
export default viaCepService;
