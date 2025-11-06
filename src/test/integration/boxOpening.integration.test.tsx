import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BoxOpeningScreen from '../../screens/BoxOpening/BoxOpeningScreen';
import { boxOpeningSlice } from '../../store/slices/boxOpeningSlice';
import { authSlice } from '../../store/slices/authSlice';
import { analyticsSlice } from '../../store/slices/analyticsSlice';
import * as boxService from '../../services/boxService';
import * as analyticsService from '../../services/analyticsService';
import * as realtimeService from '../../services/realtimeService';

// Mock services
jest.mock('../../services/boxService');
jest.mock('../../services/analyticsService');
jest.mock('../../services/realtimeService');
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

const mockBoxService = boxService as jest.Mocked<typeof boxService>;
const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;
const mockRealtimeService = realtimeService as jest.Mocked<typeof realtimeService>;

describe('Box Opening Integration Tests', () => {
  let store: any;
  let mockNavigation: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        boxOpening: boxOpeningSlice.reducer,
        auth: authSlice.reducer,
        analytics: analyticsSlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });

    mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    };

    jest.clearAllMocks();
  });

  const mockBox = {
    id: 'box-123',
    name: 'Premium Mystery Box',
    price: 79.99,
    rarity: 'epic',
    images: [{ url: 'https://example.com/box.jpg' }],
    description: 'Epic mystery box with rare items',
    category: 'gaming',
    vendor: 'Epic Games Store',
    rating: 4.8,
    reviewCount: 156,
    tags: ['gaming', 'epic', 'rare'],
    isAvailable: true,
    stock: 10,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockRevealedItems = [
    {
      id: 'item-1',
      name: 'Legendary Sword',
      description: 'A powerful legendary weapon',
      value: 45.99,
      rarity: 'legendary',
      category: 'weapons',
      imageUrl: 'https://example.com/sword.jpg',
    },
    {
      id: 'item-2',
      name: 'Rare Shield',
      description: 'Protective rare shield',
      value: 34.00,
      rarity: 'rare',
      category: 'armor',
      imageUrl: 'https://example.com/shield.jpg',
    },
  ];

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
  };

  describe('Complete Box Opening Flow', () => {
    beforeEach(() => {
      // Setup initial state
      store.dispatch(boxOpeningSlice.actions.setCurrentBox(mockBox));
      store.dispatch(authSlice.actions.loginSuccess({
        user: mockUser,
        token: 'test-token',
      }));

      // Mock successful API response
      mockBoxService.openBox.mockResolvedValue({
        success: true,
        items: mockRevealedItems,
        totalValue: 79.99,
        experienceGained: 150,
        coinsEarned: 25,
      });
    });

    it('completes full box opening flow successfully', async () => {
      const { getByText, getByTestId, queryByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      // 1. Initial state - should show box and open button
      expect(getByText('Premium Mystery Box')).toBeTruthy();
      expect(getByText('R$ 79,99')).toBeTruthy();
      expect(getByText('ABRIR CAIXA')).toBeTruthy();

      // Verify initial Redux state
      let state = store.getState();
      expect(state.boxOpening.animationState).toBe('idle');
      expect(state.boxOpening.currentBox).toEqual(mockBox);

      // 2. Start opening process
      fireEvent.press(getByText('ABRIR CAIXA'));

      // Should immediately update state to opening
      await waitFor(() => {
        state = store.getState();
        expect(state.boxOpening.animationState).toBe('opening');
      });

      // 3. Should show opening animation
      await waitFor(() => {
        expect(getByText('Abrindo caixa...')).toBeTruthy();
        expect(getByTestId('particles-container')).toBeTruthy();
        expect(getByTestId('glow-effect')).toBeTruthy();
      });

      // Open button should be hidden during opening
      expect(queryByText('ABRIR CAIXA')).toBeFalsy();

      // 4. Wait for API call
      await waitFor(() => {
        expect(mockBoxService.openBox).toHaveBeenCalledWith('box-123');
      }, { timeout: 5000 });

      // 5. Should show revealing state
      await waitFor(() => {
        expect(getByText('Revelando itens...')).toBeTruthy();
        state = store.getState();
        expect(state.boxOpening.animationState).toBe('revealing');
      }, { timeout: 3000 });

      // 6. Should show revealed items
      await waitFor(() => {
        expect(getByText('Legendary Sword')).toBeTruthy();
        expect(getByText('Rare Shield')).toBeTruthy();
        expect(getByTestId('revealed-items-container')).toBeTruthy();
      }, { timeout: 3000 });

      // 7. Should show total value and rewards
      await waitFor(() => {
        expect(getByText('R$ 79,99')).toBeTruthy();
        expect(getByText('+150 XP')).toBeTruthy();
        expect(getByText('+25 moedas')).toBeTruthy();
      });

      // 8. Verify final state
      await waitFor(() => {
        state = store.getState();
        expect(state.boxOpening.animationState).toBe('completed');
        expect(state.boxOpening.revealedItems).toHaveLength(2);
        expect(state.boxOpening.totalValue).toBe(79.99);
        expect(state.boxOpening.isLoading).toBe(false);
      });

      // 9. Verify analytics tracking
      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('box_opening_started', {
        boxId: 'box-123',
        boxName: 'Premium Mystery Box',
        rarity: 'epic',
        price: 79.99,
        userId: 'user-123',
      });

      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('box_opening_completed', {
        boxId: 'box-123',
        itemsReceived: 2,
        totalValue: 79.99,
        experienceGained: 150,
        coinsEarned: 25,
        duration: expect.any(Number),
      });
    });

    it('tracks detailed animation events', async () => {
      const { getByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      fireEvent.press(getByText('ABRIR CAIXA'));

      // Should track animation milestones
      await waitFor(() => {
        expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('box_opening_animation_started', {
          boxId: 'box-123',
          animationType: 'opening',
        });
      });

      await waitFor(() => {
        expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('box_opening_particles_triggered', {
          boxId: 'box-123',
          particleCount: 8,
        });
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('box_opening_reveal_started', {
          boxId: 'box-123',
        });
      }, { timeout: 5000 });
    });

    it('handles real-time updates during opening', async () => {
      // Mock real-time service
      const mockOnUpdate = jest.fn();
      mockRealtimeService.subscribeToBoxOpenings.mockImplementation((callback) => {
        mockOnUpdate.mockImplementation(callback);
        return jest.fn(); // unsubscribe function
      });

      const { getByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      fireEvent.press(getByText('ABRIR CAIXA'));

      // Simulate real-time update
      act(() => {
        mockOnUpdate({
          boxId: 'box-123',
          status: 'opening',
          progress: 50,
        });
      });

      // Should update progress indicator
      await waitFor(() => {
        expect(getByTestId('opening-progress')).toBeTruthy();
      });

      // Verify subscription was called
      expect(mockRealtimeService.subscribeToBoxOpenings).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      store.dispatch(boxOpeningSlice.actions.setCurrentBox(mockBox));
      store.dispatch(authSlice.actions.loginSuccess({
        user: mockUser,
        token: 'test-token',
      }));
    });

    it('handles network errors gracefully', async () => {
      // Mock network error
      mockBoxService.openBox.mockRejectedValue(new Error('Network error'));

      const { getByText, queryByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      fireEvent.press(getByText('ABRIR CAIXA'));

      // Should show error message
      await waitFor(() => {
        expect(getByText(/erro de rede/i)).toBeTruthy();
        expect(getByTestId('error-container')).toBeTruthy();
      }, { timeout: 10000 });

      // Should reset to idle state
      await waitFor(() => {
        const state = store.getState();
        expect(state.boxOpening.animationState).toBe('idle');
        expect(state.boxOpening.error).toBeTruthy();
        expect(state.boxOpening.isLoading).toBe(false);
      });

      // Should show retry button
      expect(getByText('Tentar Novamente')).toBeTruthy();

      // Original open button should be visible again
      expect(getByText('ABRIR CAIXA')).toBeTruthy();
    });

    it('handles API timeout errors', async () => {
      // Mock timeout error
      mockBoxService.openBox.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const { getByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      fireEvent.press(getByText('ABRIR CAIXA'));

      await waitFor(() => {
        expect(getByText(/tempo limite/i)).toBeTruthy();
      }, { timeout: 15000 });

      // Should track error event
      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('box_opening_error', {
        boxId: 'box-123',
        errorType: 'timeout',
        errorMessage: 'Request timeout',
      });
    });

    it('handles insufficient funds error', async () => {
      mockBoxService.openBox.mockRejectedValue({
        code: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient funds to open box',
      });

      const { getByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      fireEvent.press(getByText('ABRIR CAIXA'));

      await waitFor(() => {
        expect(getByText(/saldo insuficiente/i)).toBeTruthy();
        expect(getByText('Adicionar Fundos')).toBeTruthy();
      });

      // Should navigate to add funds when button pressed
      fireEvent.press(getByText('Adicionar Fundos'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('AddFunds');
    });

    it('handles box unavailable error', async () => {
      mockBoxService.openBox.mockRejectedValue({
        code: 'BOX_UNAVAILABLE',
        message: 'Box is no longer available',
      });

      const { getByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      fireEvent.press(getByText('ABRIR CAIXA'));

      await waitFor(() => {
        expect(getByText(/caixa não está mais disponível/i)).toBeTruthy();
        expect(getByText('Voltar à Loja')).toBeTruthy();
      });

      // Should navigate back to shop
      fireEvent.press(getByText('Voltar à Loja'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Shop');
    });

    it('retries failed request successfully', async () => {
      // First call fails, second succeeds
      mockBoxService.openBox
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          items: mockRevealedItems,
          totalValue: 79.99,
          experienceGained: 150,
          coinsEarned: 25,
        });

      const { getByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      // First attempt
      fireEvent.press(getByText('ABRIR CAIXA'));

      // Wait for error
      await waitFor(() => {
        expect(getByText(/erro/i)).toBeTruthy();
      });

      // Retry
      fireEvent.press(getByText('Tentar Novamente'));

      // Should succeed on retry
      await waitFor(() => {
        expect(getByText('Legendary Sword')).toBeTruthy();
      }, { timeout: 10000 });

      // Should track retry event
      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('box_opening_retry', {
        boxId: 'box-123',
        attemptNumber: 2,
      });
    });
  });

  describe('State Management Integration', () => {
    it('properly manages loading states', async () => {
      store.dispatch(boxOpeningSlice.actions.setCurrentBox(mockBox));
      
      mockBoxService.openBox.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            items: mockRevealedItems,
            totalValue: 79.99,
            experienceGained: 150,
            coinsEarned: 25,
          }), 2000)
        )
      );

      const { getByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      // Initial state
      expect(store.getState().boxOpening.isLoading).toBe(false);

      fireEvent.press(getByText('ABRIR CAIXA'));

      // Should set loading to true immediately
      await waitFor(() => {
        expect(store.getState().boxOpening.isLoading).toBe(true);
      });

      // Should show loading indicator
      expect(getByText('Abrindo caixa...')).toBeTruthy();

      // Should set loading to false when complete
      await waitFor(() => {
        expect(store.getState().boxOpening.isLoading).toBe(false);
      }, { timeout: 5000 });
    });

    it('updates user profile after successful opening', async () => {
      store.dispatch(boxOpeningSlice.actions.setCurrentBox(mockBox));
      store.dispatch(authSlice.actions.loginSuccess({
        user: { ...mockUser, experience: 1000, coins: 100 },
        token: 'test-token',
      }));

      mockBoxService.openBox.mockResolvedValue({
        success: true,
        items: mockRevealedItems,
        totalValue: 79.99,
        experienceGained: 150,
        coinsEarned: 25,
      });

      const { getByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      fireEvent.press(getByText('ABRIR CAIXA'));

      await waitFor(() => {
        expect(getByText('Legendary Sword')).toBeTruthy();
      }, { timeout: 10000 });

      // Should update user profile with rewards
      const userState = store.getState().auth.user;
      expect(userState.experience).toBe(1150); // 1000 + 150
      expect(userState.coins).toBe(125); // 100 + 25
    });

    it('persists box opening history', async () => {
      store.dispatch(boxOpeningSlice.actions.setCurrentBox(mockBox));

      mockBoxService.openBox.mockResolvedValue({
        success: true,
        items: mockRevealedItems,
        totalValue: 79.99,
        experienceGained: 150,
        coinsEarned: 25,
      });

      const { getByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      fireEvent.press(getByText('ABRIR CAIXA'));

      await waitFor(() => {
        expect(getByText('Legendary Sword')).toBeTruthy();
      }, { timeout: 10000 });

      // Should add to opening history
      const history = store.getState().boxOpening.openingHistory;
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        boxId: 'box-123',
        items: mockRevealedItems,
        totalValue: 79.99,
        timestamp: expect.any(String),
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should not cause memory leaks during animation', async () => {
      const { unmount } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      // Should clean up properly on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid state changes', async () => {
      store.dispatch(boxOpeningSlice.actions.setCurrentBox(mockBox));

      mockBoxService.openBox.mockResolvedValue({
        success: true,
        items: mockRevealedItems,
        totalValue: 79.99,
        experienceGained: 150,
        coinsEarned: 25,
      });

      const { getByText } = render(
        <Provider store={store}>
          <BoxOpeningScreen 
            route={{ params: { boxId: 'box-123' } }} 
            navigation={mockNavigation} 
          />
        </Provider>
      );

      // Rapid state changes
      act(() => {
        store.dispatch(boxOpeningSlice.actions.setAnimationState('opening'));
        store.dispatch(boxOpeningSlice.actions.setAnimationState('revealing'));
        store.dispatch(boxOpeningSlice.actions.setAnimationState('completed'));
      });

      // Should handle without crashing
      expect(getByText('Premium Mystery Box')).toBeTruthy();
    });
  });
});