import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StravaSettings } from '../StravaSettings';
import { useStravaConfigStore } from '../../../stores/stravaConfigStore';

// Mock the store
vi.mock('../../../stores/stravaConfigStore', () => ({
  useStravaConfigStore: vi.fn(),
}));

// Mock window.confirm
window.confirm = vi.fn();

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
      render(<StravaSettings onClose={mockOnClose} />);

      expect(screen.getByText('Strava Settings')).toBeInTheDocument();
      expect(screen.getByText('Manage your Strava app credentials')).toBeInTheDocument();
    });

    it('should display callback domain', () => {
      render(<StravaSettings onClose={mockOnClose} />);

      expect(screen.getByText('localhost:5173')).toBeInTheDocument();
    });

    it('should pre-fill existing credentials', () => {
      render(<StravaSettings onClose={mockOnClose} />);

      const clientIdInput = screen.getByLabelText(/Client ID/i) as HTMLInputElement;
      const clientSecretInput = screen.getByLabelText(/Client Secret/i) as HTMLInputElement;

      expect(clientIdInput.value).toBe('existing-id');
      expect(clientSecretInput.value).toBe('existing-secret');
    });
  });

  describe('modal interaction', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />);

      const closeButton = screen.getByText('×');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const { container } = render(<StravaSettings onClose={mockOnClose} />);

      const backdrop = container.firstChild as HTMLElement;
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close when clicking modal content', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />);

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
      render(<StravaSettings onClose={mockOnClose} />);

      const input = screen.getByLabelText(/Client ID/i);
      await user.clear(input);
      await user.type(input, 'new-id');

      expect(input).toHaveValue('new-id');
    });

    it('should update clientSecret input', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />);

      const input = screen.getByLabelText(/Client Secret/i);
      await user.clear(input);
      await user.type(input, 'new-secret');

      expect(input).toHaveValue('new-secret');
    });

    it('should toggle secret visibility', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />);

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
      render(<StravaSettings onClose={mockOnClose} />);

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
      render(<StravaSettings onClose={mockOnClose} />);

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
      render(<StravaSettings onClose={mockOnClose} />);

      const clientIdInput = screen.getByLabelText(/Client ID/i);
      const clientSecretInput = screen.getByLabelText(/Client Secret/i);

      await user.clear(clientIdInput);
      await user.clear(clientSecretInput);

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();
    });

    it('should not save when only whitespace is entered', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />);

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

      render(<StravaSettings onClose={mockOnClose} />);

      const clearButton = screen.getByRole('button', { name: /Clear Credentials/i });
      await user.click(clearButton);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to clear your Strava credentials?')
      );
    });

    it('should call clearConfig when confirmation is accepted', async () => {
      const user = userEvent.setup();
      (window.confirm as any).mockReturnValue(true);

      render(<StravaSettings onClose={mockOnClose} />);

      const clearButton = screen.getByRole('button', { name: /Clear Credentials/i });
      await user.click(clearButton);

      expect(mockClearConfig).toHaveBeenCalled();
    });

    it('should not call clearConfig when confirmation is cancelled', async () => {
      const user = userEvent.setup();
      (window.confirm as any).mockReturnValue(false);

      render(<StravaSettings onClose={mockOnClose} />);

      const clearButton = screen.getByRole('button', { name: /Clear Credentials/i });
      await user.click(clearButton);

      expect(mockClearConfig).not.toHaveBeenCalled();
    });
  });

  describe('UI elements', () => {
    it('should display security note', () => {
      render(<StravaSettings onClose={mockOnClose} />);

      expect(screen.getByText(/Security Note:/)).toBeInTheDocument();
      expect(screen.getByText(/stored locally in your browser/)).toBeInTheDocument();
    });

    it('should have link to Strava API settings', () => {
      render(<StravaSettings onClose={mockOnClose} />);

      const link = screen.getByText('Strava API Settings');
      expect(link).toHaveAttribute('href', 'https://www.strava.com/settings/api');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should show callback domain instruction', () => {
      render(<StravaSettings onClose={mockOnClose} />);

      expect(screen.getByText(/Authorization Callback Domain:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Make sure your Strava app is configured with this domain/)
      ).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper labels for inputs', () => {
      render(<StravaSettings onClose={mockOnClose} />);

      expect(screen.getByLabelText(/Client ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Client Secret/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<StravaSettings onClose={mockOnClose} />);

      // Tab through elements
      await user.tab();

      const closeButton = screen.getByText('×');
      expect(closeButton).toHaveFocus();
    });

    it('should have proper button types', () => {
      render(<StravaSettings onClose={mockOnClose} />);

      const showButton = screen.getByRole('button', { name: /Show/i });
      expect(showButton).toHaveAttribute('type', 'button');
    });
  });
});
