/**
 * Mock Fixtures para Users (Usuários)
 *
 * Dados mock reutilizáveis para testes de integração de usuários.
 */

export const mockUser = {
  id: 'user-123',
  uid: 'firebase-uid-123',
  email: 'usuario@exemplo.com',
  name: 'João Silva',
  phone: '+5511987654321',
  avatar: 'https://example.com/avatar.jpg',
  cpf: '123.456.789-00',
  birthDate: '1990-01-15',
  verified: true,
  role: 'customer' as const,
  preferences: {
    notifications: true,
    newsletter: true,
    language: 'pt-BR',
    theme: 'light' as const,
  },
  stats: {
    ordersCount: 10,
    totalSpent: 499.90,
    reviewsCount: 5,
    favoriteBoxesCount: 8,
  },
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:00:00Z',
};

export const mockUserVendor = {
  ...mockUser,
  id: 'user-456',
  uid: 'firebase-uid-456',
  email: 'vendedor@exemplo.com',
  name: 'Maria Santos',
  role: 'vendor' as const,
  vendorProfile: {
    storeName: 'TechStore Brasil',
    cnpj: '12.345.678/0001-90',
    rating: 4.7,
    reviewCount: 1250,
    verified: true,
    since: '2023-01-01',
  },
};

export const mockUserProfile = mockUser;

export const mockUserProfileResponse = {
  success: true,
  data: mockUserProfile,
};

export const mockUpdateUserRequest = {
  name: 'João Silva Santos',
  phone: '+5511999887766',
  avatar: 'https://example.com/new-avatar.jpg',
};

export const mockUpdateUserResponse = {
  success: true,
  message: 'Perfil atualizado com sucesso',
  data: {
    ...mockUser,
    name: 'João Silva Santos',
    phone: '+5511999887766',
    avatar: 'https://example.com/new-avatar.jpg',
    updatedAt: '2025-01-06T15:00:00Z',
  },
};

export const mockAddress = {
  id: 'address-123',
  userId: 'user-123',
  label: 'Casa',
  street: 'Rua Exemplo',
  number: '123',
  complement: 'Apto 45',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01000-000',
  country: 'Brasil',
  isDefault: true,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
};

export const mockAddressWork = {
  id: 'address-456',
  userId: 'user-123',
  label: 'Trabalho',
  street: 'Avenida Paulista',
  number: '1000',
  complement: 'Sala 501',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310-100',
  country: 'Brasil',
  isDefault: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

export const mockAddresses = [mockAddress, mockAddressWork];

export const mockAddressesResponse = {
  success: true,
  data: mockAddresses,
};

export const mockCreateAddressRequest = {
  label: 'Casa',
  street: 'Rua Exemplo',
  number: '123',
  complement: 'Apto 45',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01000-000',
  isDefault: true,
};

export const mockCreateAddressResponse = {
  success: true,
  message: 'Endereço criado com sucesso',
  data: mockAddress,
};

export const mockUpdateAddressRequest = {
  addressId: 'address-123',
  label: 'Casa Nova',
  complement: 'Apto 46',
};

export const mockUpdateAddressResponse = {
  success: true,
  message: 'Endereço atualizado com sucesso',
  data: {
    ...mockAddress,
    label: 'Casa Nova',
    complement: 'Apto 46',
    updatedAt: '2025-01-06T15:00:00Z',
  },
};

export const mockDeleteAddressResponse = {
  success: true,
  message: 'Endereço removido com sucesso',
};
