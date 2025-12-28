import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: { VITE_USE_MOCKS: 'false' },
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      athlete: null,
    });
  });

  it('should initialize with null values in non-mock mode', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.expiresAt).toBeNull();
    expect(state.athlete).toBeNull();
  });

  it('should set tokens', () => {
    const { setTokens } = useAuthStore.getState();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600;

    setTokens('test_access_token', 'test_refresh_token', expiresAt);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('test_access_token');
    expect(state.refreshToken).toBe('test_refresh_token');
    expect(state.expiresAt).toBe(expiresAt);
  });

  it('should set tokens with athlete', () => {
    const { setTokens } = useAuthStore.getState();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600;
    const athlete = {
      id: 123,
      username: 'johndoe',
      firstname: 'John',
      lastname: 'Doe',
      profile: 'https://example.com/profile.jpg',
      city: 'New York',
      state: 'NY',
      country: 'USA',
    };

    setTokens('test_access_token', 'test_refresh_token', expiresAt, athlete);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('test_access_token');
    expect(state.athlete).toEqual(athlete);
  });

  it('should set athlete', () => {
    const { setAthlete } = useAuthStore.getState();
    const athlete = {
      id: 456,
      username: 'janesmith',
      firstname: 'Jane',
      lastname: 'Smith',
      profile: 'https://example.com/jane.jpg',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
    };

    setAthlete(athlete);

    const state = useAuthStore.getState();
    expect(state.athlete).toEqual(athlete);
  });

  it('should logout and clear all tokens', () => {
    const { setTokens, logout } = useAuthStore.getState();
    const now = Math.floor(Date.now() / 1000);

    // Set some tokens first
    setTokens('test_token', 'test_refresh', now + 3600);

    // Then logout
    logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.expiresAt).toBeNull();
    expect(state.athlete).toBeNull();
  });

  it('should return false for isAuthenticated when no token', () => {
    const { isAuthenticated } = useAuthStore.getState();
    expect(isAuthenticated()).toBe(false);
  });

  it('should return true for isAuthenticated when token exists', () => {
    const { setTokens, isAuthenticated } = useAuthStore.getState();
    const now = Math.floor(Date.now() / 1000);

    setTokens('test_token', 'test_refresh', now + 3600);

    expect(isAuthenticated()).toBe(true);
  });

  it('should return true for isTokenExpired when no expiresAt', () => {
    const { isTokenExpired } = useAuthStore.getState();
    expect(isTokenExpired()).toBe(true);
  });

  it('should return false for isTokenExpired when token is valid', () => {
    const { setTokens, isTokenExpired } = useAuthStore.getState();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600; // Expires in 1 hour

    setTokens('test_token', 'test_refresh', expiresAt);

    expect(isTokenExpired()).toBe(false);
  });

  it('should return true for isTokenExpired when token has expired', () => {
    const { setTokens, isTokenExpired } = useAuthStore.getState();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now - 3600; // Expired 1 hour ago

    setTokens('test_token', 'test_refresh', expiresAt);

    expect(isTokenExpired()).toBe(true);
  });
});
