import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StravaSettings } from '../StravaSettings';
import { useStravaConfigStore } from '../../../stores/stravaConfigStore';

// Mock the stores
vi.mock('../../../stores/stravaConfigStore', () => ({
  useStravaConfigStore: vi.fn(),
}));

vi.mock('../../../stores/dataSyncStore', () => ({
  useDataSyncStore: vi.fn(() => ({
    clearData: vi.fn(),
  })),
}));

// Mock window.confirm
window.confirm = vi.fn();

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('StravaSettings', () => {
  const mockOnClose = vi.fn();
  const mockSetConfig = vi.fn();
  const mockClearConfig = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useStravaConfigStore as any).mockReturnValue({
      config: {
        clientId: 'existing-id',
        clientSecret: 'existing-secret',
      },
      setConfig: mockSetConfig,
      clearConfig: mockClearConfig,
    });

    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:5173',
        host: 'localhost:5173',
      },
      writable: true,
    });
  });

  describe('initial render', () => {
    it('should render modal with header', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByText('Strava Settings')).toBeInTheDocument();
      expect(screen.getByText('Manage your Strava app credentials')).toBeInTheDocument();
    });

    it('should display callback domain', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      // Check for Authorization Callback Domain section
      expect(screen.getByText(/Authorization Callback Domain:/)).toBeInTheDocument();
    });

    it('should pre-fill existing credentials', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const clientIdInput = screen.getByLabelText(/Client ID/i) as HTMLInputElement;
      const clientSecretInput = screen.getByLabelText(/Client Secret/i) as HTMLInputElement;

      expect(clientIdInput.value).toBe('existing-id');
      expect(clientSecretInput.value).toBe('existing-secret');
    });
  });

  describe('modal interaction', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const closeButton = screen.getByText('×');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const { container } = render(<StravaSettings onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const backdrop = container.firstChild as HTMLElement;
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close when clicking modal content', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const modal = screen.getByText('Strava Settings').closest('div');
      if (modal) {
        await user.click(modal);
      }

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('form handling', () => {
    it('should update clientId input', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const input = screen.getByLabelText(/Client ID/i);
      await user.clear(input);
      await user.type(input, 'new-id');

      expect(input).toHaveValue('new-id');
    });

    it('should update clientSecret input', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const input = screen.getByLabelText(/Client Secret/i);
      await user.clear(input);
      await user.type(input, 'new-secret');

      expect(input).toHaveValue('new-secret');
    });

    it('should toggle secret visibility', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const secretInput = screen.getByLabelText(/Client Secret/i);
      const toggleButton = screen.getByRole('button', { name: /Show/i });

      expect(secretInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(secretInput).toHaveAttribute('type', 'text');

      await user.click(screen.getByRole('button', { name: /Hide/i }));
      expect(secretInput).toHaveAttribute('type', 'password');
    });

    it('should call setConfig and onClose when Save is clicked with valid data', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const clientIdInput = screen.getByLabelText(/Client ID/i);
      const clientSecretInput = screen.getByLabelText(/Client Secret/i);

      await user.clear(clientIdInput);
      await user.clear(clientSecretInput);
      await user.type(clientIdInput, 'updated-id');
      await user.type(clientSecretInput, 'updated-secret');

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      expect(mockSetConfig).toHaveBeenCalledWith({
        clientId: 'updated-id',
        clientSecret: 'updated-secret',
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should trim whitespace before saving', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const clientIdInput = screen.getByLabelText(/Client ID/i);
      const clientSecretInput = screen.getByLabelText(/Client Secret/i);

      await user.clear(clientIdInput);
      await user.clear(clientSecretInput);
      await user.type(clientIdInput, '  spaced-id  ');
      await user.type(clientSecretInput, '  spaced-secret  ');

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      expect(mockSetConfig).toHaveBeenCalledWith({
        clientId: 'spaced-id',
        clientSecret: 'spaced-secret',
      });
    });

    it('should disable Save button when fields are empty', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const clientIdInput = screen.getByLabelText(/Client ID/i);
      const clientSecretInput = screen.getByLabelText(/Client Secret/i);

      await user.clear(clientIdInput);
      await user.clear(clientSecretInput);

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();
    });

    it('should not save when only whitespace is entered', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const clientIdInput = screen.getByLabelText(/Client ID/i);
      const clientSecretInput = screen.getByLabelText(/Client Secret/i);

      await user.clear(clientIdInput);
      await user.clear(clientSecretInput);
      await user.type(clientIdInput, '   ');
      await user.type(clientSecretInput, '   ');

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('clear credentials', () => {
    it('should show confirmation dialog when Clear Credentials is clicked', async () => {
      const user = userEvent.setup();
      (window.confirm as any).mockReturnValue(false);

      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const clearButton = screen.getByRole('button', { name: /Clear Credentials/i });
      await user.click(clearButton);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to clear your Strava credentials?')
      );
    });

    it('should call clearConfig when confirmation is accepted', async () => {
      const user = userEvent.setup();
      (window.confirm as any).mockReturnValue(true);

      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const clearButton = screen.getByRole('button', { name: /Clear Credentials/i });
      await user.click(clearButton);

      expect(mockClearConfig).toHaveBeenCalled();
    });

    it('should not call clearConfig when confirmation is cancelled', async () => {
      const user = userEvent.setup();
      (window.confirm as any).mockReturnValue(false);

      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const clearButton = screen.getByRole('button', { name: /Clear Credentials/i });
      await user.click(clearButton);

      expect(mockClearConfig).not.toHaveBeenCalled();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should close modal on ESC key press', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(escapeEvent);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on other key presses', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      window.dispatchEvent(enterEvent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('data management', () => {
    it('should show Sync Activities button', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /Sync Activities/i })).toBeInTheDocument();
    });

    it('should show Clear Cached Data button', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /Clear Cached Data/i })).toBeInTheDocument();
    });

    it('should not sync when confirmation is cancelled', async () => {
      const user = userEvent.setup();
      (window.confirm as any).mockReturnValue(false);

      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const syncButton = screen.getByRole('button', { name: /Sync Activities/i });
      await user.click(syncButton);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Sync activities from Strava?')
      );
    });

    it('should not clear data when confirmation is cancelled', async () => {
      const user = userEvent.setup();
      (window.confirm as any).mockReturnValue(false);

      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const clearButton = screen.getByRole('button', { name: /Clear Cached Data/i });
      await user.click(clearButton);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to clear all cached activity data?')
      );
    });
  });

  describe('UI elements', () => {
    it('should display security note', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Security Note:/)).toBeInTheDocument();
      expect(screen.getByText(/stored locally in your browser/)).toBeInTheDocument();
    });

    it('should have link to Strava API settings', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const link = screen.getByRole('link', { name: /Open Strava API Settings/ });
      expect(link).toHaveAttribute('href', 'https://www.strava.com/settings/api');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should show callback domain instruction', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Authorization Callback Domain:/)).toBeInTheDocument();
      expect(screen.getByText(/Enter ONLY the domain without port number:/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper labels for inputs', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/Client ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Client Secret/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      // Tab through elements
      await user.tab();

      const closeButton = screen.getByText('×');
      expect(closeButton).toHaveFocus();
    });

    it('should have proper button types', () => {
      render(<StravaSettings onClose={mockOnClose} />, { wrapper: createWrapper() });

      const showButton = screen.getByRole('button', { name: /Show/i });
      expect(showButton).toHaveAttribute('type', 'button');
    });
  });
});
