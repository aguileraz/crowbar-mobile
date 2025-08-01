 
import { userService } from '../userService';
import { httpClient } from '../httpClient';

// Mock httpClient
jest.mock('../httpClient');
const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'avatar.jpg',
        level: 5,
        experience: 1250,
        balance: 100.50,
      };

      mockedHttpClient.get.mockResolvedValue({ data: mockProfile });

      const _result = await userService.getProfile();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/user/profile');
      expect(_result).toEqual(mockProfile);
    });

    it('should handle unauthorized error', async () => {
      const mockError = { response: { status: 401 } };
      mockedHttpClient.get.mockRejectedValue(mockError);

      await expect(userService.getProfile()).rejects.toEqual(mockError);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      const mockUpdatedProfile = {
        id: '1',
        ...updateData,
        avatar: 'avatar.jpg',
        level: 5,
        experience: 1250,
        balance: 100.50,
      };

      mockedHttpClient.patch.mockResolvedValue({ data: mockUpdatedProfile });

      const _result = await userService.updateProfile(updateData);

      expect(mockedHttpClient.patch).toHaveBeenCalledWith('/user/profile', updateData);
      expect(_result).toEqual(mockUpdatedProfile);
    });

    it('should handle validation errors', async () => {
      const mockError = {
        response: {
          status: 422,
          data: { errors: { email: ['Email is already taken'] } },
        },
      };

      mockedHttpClient.patch.mockRejectedValue(mockError);

      await expect(userService.updateProfile({ email: 'taken@example.com' })).rejects.toEqual(mockError);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      const mockResponse = {
        avatar_url: 'https://example.com/new-avatar.jpg',
      };

      const formData = new FormData();
      formData.append('avatar', { uri: 'file://avatar.jpg' } as any);

      mockedHttpClient.post.mockResolvedValue({ data: mockResponse });

      const _result = await userService.uploadAvatar(formData);

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(_result).toEqual(mockResponse);
    });

    it('should handle file _size error', async () => {
      const mockError = {
        response: {
          status: 413,
          data: { message: 'File too large' },
        },
      };

      mockedHttpClient.post.mockRejectedValue(mockError);

      const formData = new FormData();
      await expect(userService.uploadAvatar(formData)).rejects.toEqual(mockError);
    });
  });

  describe('getAddresses', () => {
    it('should fetch addresses successfully', async () => {
      const mockAddresses = [
        {
          id: '1',
          type: 'home',
          street: '123 Main St',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234-567',
          is_default: true,
        },
        {
          id: '2',
          type: 'work',
          street: '456 Work Ave',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234-890',
          is_default: false,
        },
      ];

      mockedHttpClient.get.mockResolvedValue({ data: mockAddresses });

      const _result = await userService.getAddresses();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/user/addresses');
      expect(_result).toEqual(mockAddresses);
    });
  });

  describe('addAddress', () => {
    it('should add address successfully', async () => {
      const addressData = {
        type: 'home',
        street: '123 New St',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567',
        is_default: true,
      };

      const mockAddress = { id: '3', ...addressData };

      mockedHttpClient.post.mockResolvedValue({ data: mockAddress });

      const _result = await userService.addAddress(addressData);

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/user/addresses', addressData);
      expect(_result).toEqual(mockAddress);
    });
  });

  describe('updateAddress', () => {
    it('should update address successfully', async () => {
      const updateData = { street: '123 Updated St' };
      const mockUpdatedAddress = {
        id: '1',
        type: 'home',
        street: '123 Updated St',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567',
        is_default: true,
      };

      mockedHttpClient.patch.mockResolvedValue({ data: mockUpdatedAddress });

      const _result = await userService.updateAddress('1', updateData);

      expect(mockedHttpClient.patch).toHaveBeenCalledWith('/user/addresses/1', updateData);
      expect(_result).toEqual(mockUpdatedAddress);
    });
  });

  describe('deleteAddress', () => {
    it('should delete address successfully', async () => {
      mockedHttpClient.delete.mockResolvedValue({ data: {} });

      await userService.deleteAddress('1');

      expect(mockedHttpClient.delete).toHaveBeenCalledWith('/user/addresses/1');
    });

    it('should handle not found error', async () => {
      const mockError = { response: { status: 404 } };
      mockedHttpClient.delete.mockRejectedValue(mockError);

      await expect(userService.deleteAddress('999')).rejects.toEqual(mockError);
    });
  });

  describe('getPaymentMethods', () => {
    it('should fetch payment methods successfully', async () => {
      const mockPaymentMethods = [
        {
          id: '1',
          type: 'credit_card',
          last_four: '1234',
          brand: 'visa',
          is_default: true,
        },
        {
          id: '2',
          type: 'debit_card',
          last_four: '5678',
          brand: 'mastercard',
          is_default: false,
        },
      ];

      mockedHttpClient.get.mockResolvedValue({ data: mockPaymentMethods });

      const _result = await userService.getPaymentMethods();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/user/payment-methods');
      expect(_result).toEqual(mockPaymentMethods);
    });
  });

  describe('addPaymentMethod', () => {
    it('should add payment method successfully', async () => {
      const paymentData = {
        type: 'credit_card',
        card_number: '1234567890123456',
        expiry_month: '12',
        expiry_year: '2025',
        cvv: '123',
        holder_name: 'John Doe',
      };

      const mockPaymentMethod = {
        id: '3',
        type: 'credit_card',
        last_four: '3456',
        brand: 'visa',
        is_default: false,
      };

      mockedHttpClient.post.mockResolvedValue({ data: mockPaymentMethod });

      const _result = await userService.addPaymentMethod(paymentData);

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/user/payment-methods', paymentData);
      expect(_result).toEqual(mockPaymentMethod);
    });
  });

  describe('deletePaymentMethod', () => {
    it('should delete payment method successfully', async () => {
      mockedHttpClient.delete.mockResolvedValue({ data: {} });

      await userService.deletePaymentMethod('1');

      expect(mockedHttpClient.delete).toHaveBeenCalledWith('/user/payment-methods/1');
    });
  });

  describe('getStatistics', () => {
    it('should fetch user statistics successfully', async () => {
      const mockStats = {
        total_boxes_opened: 25,
        total_spent: 250.75,
        favorite_category: 'electronics',
        level: 5,
        experience: 1250,
        next_level_experience: 1500,
        achievements: [
          { id: '1', name: 'First Box', unlocked: true },
          { id: '2', name: 'Big Spender', unlocked: false },
        ],
      };

      mockedHttpClient.get.mockResolvedValue({ data: mockStats });

      const _result = await userService.getStatistics();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/user/statistics');
      expect(_result).toEqual(mockStats);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        current_password: 'oldpassword',
        new_password: 'newpassword',
        new_password_confirmation: 'newpassword',
      };

      mockedHttpClient.patch.mockResolvedValue({ data: { message: 'Password updated successfully' } });

      const _result = await userService.changePassword(passwordData);

      expect(mockedHttpClient.patch).toHaveBeenCalledWith('/user/password', passwordData);
      expect(_result).toEqual({ message: 'Password updated successfully' });
    });

    it('should handle incorrect current password', async () => {
      const mockError = {
        response: {
          status: 422,
          data: { errors: { current_password: ['Current password is incorrect'] } },
        },
      };

      mockedHttpClient.patch.mockRejectedValue(mockError);

      await expect(userService.changePassword({
        current_password: 'wrong',
        new_password: 'new',
        new_password_confirmation: 'new',
      })).rejects.toEqual(mockError);
    });
  });
});
