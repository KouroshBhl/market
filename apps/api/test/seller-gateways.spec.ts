import { describe, it, expect, beforeEach } from '@jest/globals';
import { SellerGatewaysService } from '../src/seller-gateways/seller-gateways.service';

describe('SellerGatewaysService — effective enabled computation', () => {
  let service: SellerGatewaysService;

  beforeEach(() => {
    service = new SellerGatewaysService();
  });

  // ============================================
  // computeEffectiveEnabled
  // ============================================

  describe('computeEffectiveEnabled', () => {
    it('returns false when gateway is globally disabled', () => {
      const result = service.computeEffectiveEnabled(
        {
          isEnabledGlobally: false,
          sellerCanToggle: true,
          defaultEnabledForNewSellers: true,
        },
        { isEnabled: true },
      );
      expect(result).toBe(false);
    });

    it('returns false when gateway is globally disabled, even without preference', () => {
      const result = service.computeEffectiveEnabled(
        {
          isEnabledGlobally: false,
          sellerCanToggle: true,
          defaultEnabledForNewSellers: true,
        },
        null,
      );
      expect(result).toBe(false);
    });

    it('returns defaultEnabledForNewSellers when seller cannot toggle (admin-locked, default true)', () => {
      const result = service.computeEffectiveEnabled(
        {
          isEnabledGlobally: true,
          sellerCanToggle: false,
          defaultEnabledForNewSellers: true,
        },
        { isEnabled: false }, // seller pref should be ignored
      );
      expect(result).toBe(true);
    });

    it('returns defaultEnabledForNewSellers when seller cannot toggle (admin-locked, default false)', () => {
      const result = service.computeEffectiveEnabled(
        {
          isEnabledGlobally: true,
          sellerCanToggle: false,
          defaultEnabledForNewSellers: false,
        },
        { isEnabled: true }, // seller pref should be ignored
      );
      expect(result).toBe(false);
    });

    it('returns seller preference when toggle is allowed and preference exists', () => {
      const result = service.computeEffectiveEnabled(
        {
          isEnabledGlobally: true,
          sellerCanToggle: true,
          defaultEnabledForNewSellers: true,
        },
        { isEnabled: false },
      );
      expect(result).toBe(false);
    });

    it('returns seller preference (enabled) when toggle is allowed', () => {
      const result = service.computeEffectiveEnabled(
        {
          isEnabledGlobally: true,
          sellerCanToggle: true,
          defaultEnabledForNewSellers: false,
        },
        { isEnabled: true },
      );
      expect(result).toBe(true);
    });

    it('returns defaultEnabledForNewSellers when no preference exists', () => {
      const result = service.computeEffectiveEnabled(
        {
          isEnabledGlobally: true,
          sellerCanToggle: true,
          defaultEnabledForNewSellers: true,
        },
        null,
      );
      expect(result).toBe(true);
    });

    it('returns false default when no preference exists and default is false', () => {
      const result = service.computeEffectiveEnabled(
        {
          isEnabledGlobally: true,
          sellerCanToggle: true,
          defaultEnabledForNewSellers: false,
        },
        null,
      );
      expect(result).toBe(false);
    });
  });

  // ============================================
  // computeStatus
  // ============================================

  describe('computeStatus', () => {
    it('returns GLOBALLY_DISABLED when not enabled globally', () => {
      const result = service.computeStatus({
        isEnabledGlobally: false,
        sellerCanToggle: true,
      });
      expect(result).toBe('GLOBALLY_DISABLED');
    });

    it('returns ADMIN_LOCKED when seller cannot toggle', () => {
      const result = service.computeStatus({
        isEnabledGlobally: true,
        sellerCanToggle: false,
      });
      expect(result).toBe('ADMIN_LOCKED');
    });

    it('returns AVAILABLE when globally enabled and seller can toggle', () => {
      const result = service.computeStatus({
        isEnabledGlobally: true,
        sellerCanToggle: true,
      });
      expect(result).toBe('AVAILABLE');
    });

    it('returns GLOBALLY_DISABLED over ADMIN_LOCKED when both conditions apply', () => {
      const result = service.computeStatus({
        isEnabledGlobally: false,
        sellerCanToggle: false,
      });
      expect(result).toBe('GLOBALLY_DISABLED');
    });
  });
});
