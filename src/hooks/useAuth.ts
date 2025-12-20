import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stravaClient } from '../api/strava/index.ts';
import { useAuthStore } from '../stores/authStore.ts';

export const useAuth = () => {
  const {
    accessToken,
    refreshToken,
    athlete,
    setTokens,
    setAthlete,
    logout,
    isAuthenticated,
    isTokenExpired,
  } = useAuthStore();

  const navigate = useNavigate();

  // Set token in client when it changes
  useEffect(() => {
    if (accessToken) {
      stravaClient.setAccessToken(accessToken);
    }
  }, [accessToken]);

  const login = () => {
    const authUrl = stravaClient.getAuthUrl();
    console.log('Initiating login with auth URL:', authUrl);
    console.log('Expected callback URL:', `${window.location.origin}/callback`);
    window.location.href = authUrl;
  };

  const handleCallback = async (code: string) => {
    try {
      const tokenResponse = await stravaClient.exchangeToken(code);
      setTokens(tokenResponse.access_token, tokenResponse.refresh_token, tokenResponse.expires_at);
      setAthlete(tokenResponse.athlete);
      navigate('/');
    } catch (error) {
      console.error('Failed to exchange token:', error);
      throw error;
    }
  };

  const refresh = async () => {
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const tokenResponse = await stravaClient.refreshToken(refreshToken);
      setTokens(tokenResponse.access_token, tokenResponse.refresh_token, tokenResponse.expires_at);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      throw error;
    }
  };

  // Auto-refresh if token is expired
  useEffect(() => {
    if (isAuthenticated() && isTokenExpired()) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isAuthenticated: isAuthenticated(),
    athlete,
    login,
    logout,
    handleCallback,
    refresh,
  };
};
