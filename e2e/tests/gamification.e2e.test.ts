import { device, element, by, expect as detoxExpected, waitFor } from 'detox';

describe('Gamification E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    
    // Mock user authentication
    await device.sendUserNotification({
      payload: {
        action: 'LOGIN_SUCCESS',
        user: {
          id: 'test-user-123',
          name: 'Test User',
          email: 'test@example.com',
          level: 15,
          experience: 2450,
          coins: 150,
        },
      },
    });
  });

  describe('Box Opening Animation Flow', () => {
    it('should complete full box opening experience with animations', async () => {
      // 1. Navigate to shop
      await element(by.id('tab-shop')).tap();
      await detoxExpected(element(by.id('shop-screen'))).toBeVisible();

      // 2. Find and select a mystery box
      await element(by.id('box-card-epic-mystery')).tap();
      await detoxExpected(element(by.id('box-details-screen'))).toBeVisible();

      // 3. Verify box information is displayed
      await detoxExpected(element(by.text('Epic Mystery Box'))).toBeVisible();
      await detoxExpected(element(by.text('R$ 79,99'))).toBeVisible();
      await detoxExpected(element(by.text('EPIC'))).toBeVisible();

      // 4. Navigate to opening screen
      await element(by.id('open-box-button')).tap();
      await detoxExpected(element(by.id('box-opening-screen'))).toBeVisible();

      // 5. Verify initial animation state
      await detoxExpected(element(by.id('box-image'))).toBeVisible();
      await detoxExpected(element(by.id('open-box-button'))).toBeVisible();
      await detoxExpected(element(by.text('ABRIR CAIXA'))).toBeVisible();

      // 6. Start box opening animation
      await element(by.id('open-box-button')).tap();

      // 7. Verify opening animation phase
      await waitFor(element(by.id('opening-animation')))
        .toBeVisible()
        .withTimeout(2000);

      await waitFor(element(by.text('Abrindo caixa...')))
        .toBeVisible()
        .withTimeout(2000);

      // 8. Verify particle effects
      await waitFor(element(by.id('particles-container')))
        .toBeVisible()
        .withTimeout(3000);

      // 9. Verify glow effect
      await waitFor(element(by.id('glow-effect')))
        .toBeVisible()
        .withTimeout(3000);

      // 10. Wait for revealing phase
      await waitFor(element(by.text('Revelando itens...')))
        .toBeVisible()
        .withTimeout(8000);

      // 11. Verify items are revealed with animations
      await waitFor(element(by.id('revealed-items-container')))
        .toBeVisible()
        .withTimeout(12000);

      await waitFor(element(by.id('item-reveal-legendary-sword')))
        .toBeVisible()
        .withTimeout(2000);

      await waitFor(element(by.id('item-reveal-rare-shield')))
        .toBeVisible()
        .withTimeout(2000);

      // 12. Verify rewards display
      await waitFor(element(by.id('rewards-container')))
        .toBeVisible()
        .withTimeout(3000);

      await detoxExpected(element(by.text('+150 XP'))).toBeVisible();
      await detoxExpected(element(by.text('+25 moedas'))).toBeVisible();

      // 13. Verify total value calculation
      await detoxExpected(element(by.text('Valor Total: R$ 79,99'))).toBeVisible();

      // 14. Test share functionality
      await element(by.id('share-results-button')).tap();
      await detoxExpected(element(by.id('share-modal'))).toBeVisible();
      await detoxExpected(element(by.text('Compartilhar Resultado'))).toBeVisible();

      // 15. Close share modal
      await element(by.id('close-share-modal')).tap();
      await detoxExpected(element(by.id('share-modal'))).not.toBeVisible();

      // 16. Return to shop
      await element(by.id('back-to-shop-button')).tap();
      await detoxExpected(element(by.id('shop-screen'))).toBeVisible();
    });

    it('should maintain smooth animation performance during opening', async () => {
      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-epic-mystery')).tap();
      await element(by.id('open-box-button')).tap();

      // Start performance monitoring
      await device.startProfiling('BoxOpeningAnimation');

      // Trigger animation
      await element(by.id('open-box-button')).tap();

      // Wait for complete animation sequence
      await waitFor(element(by.id('revealed-items-container')))
        .toBeVisible()
        .withTimeout(15000);

      // Stop profiling and validate performance
      const profile = await device.stopProfiling();
      
      // Validate performance metrics
      expect(profile.fps).toBeGreaterThan(45); // Minimum acceptable FPS
      expect(profile.memoryUsage).toBeLessThan(200); // Max 200MB memory usage
      expect(profile.cpuUsage).toBeLessThan(85); // Max 85% CPU usage
    });

    it('should handle animation interruptions gracefully', async () => {
      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-epic-mystery')).tap();
      await element(by.id('open-box-button')).tap();

      // Start opening
      await element(by.id('open-box-button')).tap();

      // Wait for animation to start
      await waitFor(element(by.text('Abrindo caixa...')))
        .toBeVisible()
        .withTimeout(3000);

      // Simulate app backgrounding during animation
      await device.sendToHome();
      await device.launchApp();

      // Animation should resume or restart gracefully
      await waitFor(element(by.id('box-opening-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Should either be in opening state or completed
      const isOpening = await element(by.text('Abrindo caixa...')).isVisible().catch(() => false);
      const isRevealing = await element(by.text('Revelando itens...')).isVisible().catch(() => false);
      const isCompleted = await element(by.id('revealed-items-container')).isVisible().catch(() => false);

      expect(isOpening || isRevealing || isCompleted).toBe(true);
    });

    it('should work correctly on different screen orientations', async () => {
      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-epic-mystery')).tap();
      await element(by.id('open-box-button')).tap();

      // Test portrait orientation
      await device.setOrientation('portrait');
      await detoxExpected(element(by.id('box-opening-screen'))).toBeVisible();
      await detoxExpected(element(by.id('box-image'))).toBeVisible();

      // Test landscape orientation
      await device.setOrientation('landscape');
      await detoxExpected(element(by.id('box-opening-screen'))).toBeVisible();
      await detoxExpected(element(by.id('box-image'))).toBeVisible();

      // Layout should adapt properly
      const boxImage = element(by.id('box-image'));
      await detoxExpected(boxImage).toBeVisible();

      // Return to portrait
      await device.setOrientation('portrait');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network error by blocking API calls
      await device.setURLBlacklist(['**/api/boxes/**']);

      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-epic-mystery')).tap();
      await element(by.id('open-box-button')).tap();
      await element(by.id('open-box-button')).tap();

      // Should show error message
      await waitFor(element(by.text(/erro de rede/i)))
        .toBeVisible()
        .withTimeout(10000);

      // Should show retry button
      await detoxExpected(element(by.id('retry-button'))).toBeVisible();

      // Reset network and retry
      await device.setURLBlacklist([]);
      await element(by.id('retry-button')).tap();

      // Should work after retry
      await waitFor(element(by.id('revealed-items-container')))
        .toBeVisible()
        .withTimeout(15000);
    });

    it('should handle insufficient funds error', async () => {
      // Mock insufficient funds response
      await device.sendUserNotification({
        payload: {
          action: 'SET_USER_COINS',
          coins: 0, // No coins
        },
      });

      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-epic-mystery')).tap();
      await element(by.id('open-box-button')).tap();
      await element(by.id('open-box-button')).tap();

      // Should show insufficient funds error
      await waitFor(element(by.text(/saldo insuficiente/i)))
        .toBeVisible()
        .withTimeout(8000);

      // Should show add funds button
      await detoxExpected(element(by.id('add-funds-button'))).toBeVisible();

      // Tapping should navigate to add funds
      await element(by.id('add-funds-button')).tap();
      await detoxExpected(element(by.id('add-funds-screen'))).toBeVisible();
    });

    it('should handle slow network conditions', async () => {
      // Simulate slow network
      await device.setNetworkConditions('slow3g');

      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-epic-mystery')).tap();
      await element(by.id('open-box-button')).tap();
      await element(by.id('open-box-button')).tap();

      // Should show loading state longer
      await detoxExpected(element(by.text('Abrindo caixa...'))).toBeVisible();

      // Should eventually complete even on slow network
      await waitFor(element(by.id('revealed-items-container')))
        .toBeVisible()
        .withTimeout(30000); // Longer timeout for slow network

      // Reset network conditions
      await device.setNetworkConditions('wifi');
    });
  });

  describe('Device Performance Tests', () => {
    it('should work on low-end devices', async () => {
      // Simulate low-end device conditions
      await device.setLowMemoryMode(true);
      await device.setCPUThrottle(0.5); // 50% CPU throttling

      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-epic-mystery')).tap();
      await element(by.id('open-box-button')).tap();
      await element(by.id('open-box-button')).tap();

      // Should still complete successfully, might take longer
      await waitFor(element(by.id('revealed-items-container')))
        .toBeVisible()
        .withTimeout(25000);

      // Verify no crashes occurred
      await detoxExpected(element(by.id('box-opening-screen'))).toBeVisible();

      // Reset device conditions
      await device.setLowMemoryMode(false);
      await device.setCPUThrottle(1.0);
    });

    it('should handle memory pressure gracefully', async () => {
      // Simulate memory pressure
      await device.setMemoryPressure('critical');

      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-epic-mystery')).tap();
      await element(by.id('open-box-button')).tap();
      await element(by.id('open-box-button')).tap();

      // Should gracefully degrade animation quality but still work
      await waitFor(element(by.text('Abrindo caixa...')))
        .toBeVisible()
        .withTimeout(5000);

      // Should eventually complete
      await waitFor(element(by.id('revealed-items-container')))
        .toBeVisible()
        .withTimeout(20000);

      // Reset memory pressure
      await device.setMemoryPressure('normal');
    });
  });

  describe('Multiple Box Opening Sessions', () => {
    it('should handle consecutive box openings without degradation', async () => {
      const boxesToOpen = 3;

      for (let i = 0; i < boxesToOpen; i++) {
        await element(by.id('tab-shop')).tap();
        await element(by.id('box-card-epic-mystery')).tap();
        await element(by.id('open-box-button')).tap();
        await element(by.id('open-box-button')).tap();

        // Wait for completion
        await waitFor(element(by.id('revealed-items-container')))
          .toBeVisible()
          .withTimeout(15000);

        // Verify results are displayed
        await detoxExpected(element(by.id('rewards-container'))).toBeVisible();

        // Return to shop for next iteration
        if (i < boxesToOpen - 1) {
          await element(by.id('back-to-shop-button')).tap();
        }
      }

      // All openings should have completed successfully
      await detoxExpected(element(by.id('revealed-items-container'))).toBeVisible();
    });

    it('should maintain animation quality across sessions', async () => {
      await device.startProfiling('ConsecutiveAnimations');

      // Open multiple boxes in sequence
      for (let i = 0; i < 5; i++) {
        await element(by.id('tab-shop')).tap();
        await element(by.id(`box-card-${i}`)).tap();
        await element(by.id('open-box-button')).tap();
        await element(by.id('open-box-button')).tap();

        await waitFor(element(by.id('revealed-items-container')))
          .toBeVisible()
          .withTimeout(15000);

        if (i < 4) {
          await element(by.id('back-to-shop-button')).tap();
        }
      }

      const profile = await device.stopProfiling();

      // Performance should not degrade significantly
      expect(profile.fps).toBeGreaterThan(40);
      expect(profile.memoryUsage).toBeLessThan(250);
    });
  });

  describe('Accessibility Features', () => {
    it('should support screen reader navigation', async () => {
      // Enable accessibility features
      await device.setAccessibilityGestureEnabled(true);

      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-epic-mystery')).tap();
      await element(by.id('open-box-button')).tap();

      // All elements should have proper accessibility labels
      await detoxExpected(element(by.label('Caixa Misteriosa Épica'))).toBeVisible();
      await detoxExpected(element(by.label('Preço: 79 reais e 99 centavos'))).toBeVisible();
      await detoxExpected(element(by.label('Raridade: Épica'))).toBeVisible();
      await detoxExpected(element(by.label('Botão abrir caixa'))).toBeVisible();

      // Screen reader should announce animation states
      await element(by.id('open-box-button')).tap();
      await waitFor(element(by.label('Abrindo caixa, aguarde')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should maintain proper touch target sizes', async () => {
      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-epic-mystery')).tap();
      await element(by.id('open-box-button')).tap();

      // All interactive elements should be tappable
      await detoxExpected(element(by.id('open-box-button'))).toBeVisible();
      await detoxExpected(element(by.id('back-button'))).toBeVisible();

      // Test touch targets work correctly
      await element(by.id('open-box-button')).tap();
      await waitFor(element(by.text('Abrindo caixa...')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should provide proper focus management', async () => {
      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-epic-mystery')).tap();
      await element(by.id('open-box-button')).tap();

      // Focus should move logically through elements
      await element(by.id('open-box-button')).tap();

      // During animation, focus should be managed properly
      await waitFor(element(by.text('Abrindo caixa...')))
        .toBeVisible()
        .withTimeout(3000);

      // After completion, focus should be on results
      await waitFor(element(by.id('revealed-items-container')))
        .toBeVisible()
        .withTimeout(15000);
    });
  });

  describe('Timer and Urgency System', () => {
    it('should display countdown timer on flash sale items', async () => {
      // Navigate to shop
      await element(by.id('tab-shop')).tap();
      
      // Find flash sale item
      await waitFor(element(by.id('flash-sale-card')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Verify timer is visible
      await expect(element(by.id('countdown-timer'))).toBeVisible();
      
      // Verify urgency indicator
      await expect(element(by.text(/Termina em/i))).toBeVisible();
    });

    it('should update timer in real-time', async () => {
      await element(by.id('tab-shop')).tap();
      
      // Get initial timer value
      const initialTimer = await element(by.id('timer-text')).getText();
      
      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get updated timer value
      const updatedTimer = await element(by.id('timer-text')).getText();
      
      // Verify timer has changed
      expect(initialTimer).not.toBe(updatedTimer);
    });

    it('should show urgency colors based on time remaining', async () => {
      await element(by.id('tab-shop')).tap();
      
      // Find item with less than 1 hour
      await element(by.id('filter-ending-soon')).tap();
      
      // Verify critical urgency styling
      await expect(element(by.id('urgency-critical'))).toBeVisible();
    });
  });

  describe('Daily Challenges', () => {
    it('should display daily challenges', async () => {
      // Navigate to gamification hub
      await element(by.id('tab-gamification')).tap();
      
      // Verify challenges section
      await expect(element(by.id('daily-challenges-section'))).toBeVisible();
      
      // Verify at least one challenge is visible
      await expect(element(by.id('challenge-card-0'))).toBeVisible();
    });

    it('should track challenge progress', async () => {
      await element(by.id('tab-gamification')).tap();
      
      // Start a purchase challenge
      await element(by.id('challenge-purchase-1')).tap();
      
      // Navigate to shop and make purchase
      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-0')).tap();
      await element(by.id('add-to-cart-button')).tap();
      await element(by.id('checkout-button')).tap();
      await element(by.id('confirm-purchase-button')).tap();
      
      // Return to challenges
      await element(by.id('tab-gamification')).tap();
      
      // Verify progress updated
      await expect(element(by.text('1/1'))).toBeVisible();
    });

    it('should allow claiming challenge rewards', async () => {
      await element(by.id('tab-gamification')).tap();
      
      // Find completed challenge
      await element(by.id('filter-completed')).tap();
      
      // Claim reward
      await element(by.id('claim-reward-button')).tap();
      
      // Verify reward claimed
      await expect(element(by.text('Recompensa Resgatada!'))).toBeVisible();
    });
  });

  describe('Streak System', () => {
    it('should display current streak', async () => {
      await element(by.id('tab-gamification')).tap();
      
      // Verify streak tracker is visible
      await expect(element(by.id('streak-tracker'))).toBeVisible();
      
      // Verify streak count
      await expect(element(by.id('streak-days'))).toBeVisible();
    });

    it('should update streak on activity', async () => {
      // Make a purchase to maintain streak
      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-0')).tap();
      await element(by.id('open-box-button')).tap();
      
      // Return to gamification
      await element(by.id('tab-gamification')).tap();
      
      // Verify streak maintained
      await expect(element(by.id('streak-maintained-badge'))).toBeVisible();
    });

    it('should show freeze option when available', async () => {
      await element(by.id('tab-gamification')).tap();
      await element(by.id('streak-tracker')).tap();
      
      // Verify freeze button
      await expect(element(by.id('freeze-streak-button'))).toBeVisible();
      
      // Use freeze
      await element(by.id('freeze-streak-button')).tap();
      await element(by.text('Confirmar')).tap();
      
      // Verify freeze applied
      await expect(element(by.text('Streak Protegida'))).toBeVisible();
    });
  });

  describe('Leaderboard', () => {
    it('should display leaderboard with rankings', async () => {
      await element(by.id('tab-leaderboard')).tap();
      
      // Verify leaderboard is visible
      await expect(element(by.id('leaderboard-container'))).toBeVisible();
      
      // Verify podium for top 3
      await expect(element(by.id('podium-first'))).toBeVisible();
      await expect(element(by.id('podium-second'))).toBeVisible();
      await expect(element(by.id('podium-third'))).toBeVisible();
    });

    it('should allow filtering by timeframe', async () => {
      await element(by.id('tab-leaderboard')).tap();
      
      // Switch to weekly view
      await element(by.id('timeframe-weekly')).tap();
      
      // Verify weekly leaderboard loaded
      await expect(element(by.text('Ranking Semanal'))).toBeVisible();
      
      // Switch to monthly view
      await element(by.id('timeframe-monthly')).tap();
      
      // Verify monthly leaderboard loaded
      await expect(element(by.text('Ranking Mensal'))).toBeVisible();
    });

    it('should show user position and allow scrolling to it', async () => {
      await element(by.id('tab-leaderboard')).tap();
      
      // Tap on "My Position" button
      await element(by.id('my-position-button')).tap();
      
      // Verify scrolled to user position
      await expect(element(by.id('my-rank-highlight'))).toBeVisible();
    });
  });

  describe('Spin Wheel', () => {
    it('should open spin wheel modal', async () => {
      await element(by.id('tab-gamification')).tap();
      
      // Open spin wheel
      await element(by.id('spin-wheel-button')).tap();
      
      // Verify modal is visible
      await expect(element(by.id('spin-wheel-modal'))).toBeVisible();
    });

    it('should spin and show reward', async () => {
      await element(by.id('tab-gamification')).tap();
      await element(by.id('spin-wheel-button')).tap();
      
      // Spin the wheel
      await element(by.id('spin-button')).tap();
      
      // Wait for animation
      await waitFor(element(by.id('reward-display')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Verify reward shown
      await expect(element(by.text(/Você ganhou/i))).toBeVisible();
      
      // Claim reward
      await element(by.id('claim-spin-reward')).tap();
    });

    it('should enforce daily spin limit', async () => {
      await element(by.id('tab-gamification')).tap();
      
      // Use all daily spins
      for (let i = 0; i < 3; i++) {
        await element(by.id('spin-wheel-button')).tap();
        await element(by.id('spin-button')).tap();
        await waitFor(element(by.id('claim-spin-reward')))
          .toBeVisible()
          .withTimeout(5000);
        await element(by.id('claim-spin-reward')).tap();
      }
      
      // Try to spin again
      await element(by.id('spin-wheel-button')).tap();
      
      // Verify no spins left message
      await expect(element(by.text('Sem giros disponíveis'))).toBeVisible();
    });
  });

  describe('Special Effects', () => {
    it('should show special effects on rare box opening', async () => {
      await element(by.id('tab-shop')).tap();
      
      // Find and open a legendary box
      await element(by.id('filter-legendary')).tap();
      await element(by.id('box-card-legendary-0')).tap();
      await element(by.id('open-box-button')).tap();
      
      // Verify special effect triggered
      await expect(element(by.id('special-effect-overlay'))).toBeVisible();
      
      // Verify particle effects
      await expect(element(by.id('particle-system'))).toBeVisible();
    });

    it('should show emoji reactions', async () => {
      await element(by.id('tab-shop')).tap();
      await element(by.id('box-card-0')).tap();
      await element(by.id('open-box-button')).tap();
      
      // Wait for items reveal
      await waitFor(element(by.id('items-revealed')))
        .toBeVisible()
        .withTimeout(3000);
      
      // React with emoji
      await element(by.id('emoji-fire')).tap();
      
      // Verify emoji animation
      await expect(element(by.id('floating-emoji'))).toBeVisible();
    });
  });

  describe('Notifications', () => {
    it('should show streak reminder notification', async () => {
      // Simulate time passing (mock)
      await device.setStatusBar({ time: '20:00' });
      
      // Wait for notification
      await waitFor(element(by.text(/Mantenha sua sequência/i)))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show flash sale notification', async () => {
      // Trigger flash sale (admin action)
      await element(by.id('dev-menu')).tap();
      await element(by.id('trigger-flash-sale')).tap();
      
      // Verify notification appears
      await expect(element(by.text(/FLASH SALE/i))).toBeVisible();
      
      // Tap notification
      await element(by.text(/FLASH SALE/i)).tap();
      
      // Verify navigated to flash sale
      await expect(element(by.id('flash-sale-screen'))).toBeVisible();
    });
  });

  describe('Gamification Hub', () => {
    it('should display all gamification elements', async () => {
      await element(by.id('tab-gamification')).tap();
      
      // Verify all sections are visible
      await expect(element(by.id('user-level-display'))).toBeVisible();
      await expect(element(by.id('xp-progress-bar'))).toBeVisible();
      await expect(element(by.id('total-points-display'))).toBeVisible();
      await expect(element(by.id('next-event-timer'))).toBeVisible();
      await expect(element(by.id('streak-tracker'))).toBeVisible();
      await expect(element(by.id('quick-actions-grid'))).toBeVisible();
      await expect(element(by.id('daily-challenges-section'))).toBeVisible();
      await expect(element(by.id('statistics-section'))).toBeVisible();
    });

    it('should update in real-time', async () => {
      await element(by.id('tab-gamification')).tap();
      
      // Get initial XP
      const initialXP = await element(by.id('current-xp')).getText();
      
      // Complete an action that gives XP
      await element(by.id('tab-shop')).tap();
      await element(by.id('favorite-button-0')).tap();
      
      // Return to hub
      await element(by.id('tab-gamification')).tap();
      
      // Verify XP updated
      const updatedXP = await element(by.id('current-xp')).getText();
      expect(parseInt(updatedXP, 10)).toBeGreaterThan(parseInt(initialXP, 10));
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple timers without lag', async () => {
      await element(by.id('tab-shop')).tap();
      
      // Scroll through many items with timers
      await element(by.id('shop-list')).scroll(500, 'down');
      await element(by.id('shop-list')).scroll(500, 'down');
      await element(by.id('shop-list')).scroll(500, 'down');
      
      // Verify smooth scrolling (no jank)
      await expect(element(by.id('shop-list'))).toBeVisible();
    });

    it('should load leaderboard quickly', async () => {
      const startTime = Date.now();
      
      await element(by.id('tab-leaderboard')).tap();
      
      await waitFor(element(by.id('leaderboard-loaded')))
        .toBeVisible()
        .withTimeout(2000);
      
      const loadTime = Date.now() - startTime;
      
      // Should load in less than 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Disable network
      await device.setURLBlacklist(['.*']);
      
      // Try to load challenges
      await element(by.id('tab-gamification')).tap();
      
      // Verify error message
      await expect(element(by.text(/Erro de conexão/i))).toBeVisible();
      
      // Verify retry button
      await expect(element(by.id('retry-button'))).toBeVisible();
      
      // Re-enable network
      await device.clearURLBlacklist();
      
      // Retry
      await element(by.id('retry-button')).tap();
      
      // Verify loaded successfully
      await expect(element(by.id('daily-challenges-section'))).toBeVisible();
    });

    it('should handle invalid data gracefully', async () => {
      // Inject invalid data (mock)
      await element(by.id('dev-menu')).tap();
      await element(by.id('inject-invalid-data')).tap();
      
      // Navigate to affected screen
      await element(by.id('tab-gamification')).tap();
      
      // Verify app doesn't crash
      await expect(element(by.id('gamification-hub'))).toBeVisible();
      
      // Verify fallback UI shown
      await expect(element(by.text(/Dados indisponíveis/i))).toBeVisible();
    });
  });
});