import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SetupWizard } from '../SetupWizard';
import { useStravaConfigStore } from '../../../stores/stravaConfigStore';

// Mock the store
vi.mock('../../../stores/stravaConfigStore', () => ({
  useStravaConfigStore: vi.fn(),
}));

// Helper to render with router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('SetupWizard', () => {
  const mockSetConfig = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useStravaConfigStore as any).mockReturnValue({
      setConfig: mockSetConfig,
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:5173',
        host: 'localhost:5173',
      },
      writable: true,
    });
  });

  describe('initial render', () => {
    it('should render welcome header', () => {
      renderWithRouter(<SetupWizard />);

      expect(screen.getByText('Welcome to Sport Year!')).toBeInTheDocument();
      expect(screen.getByText("Let's get you set up")).toBeInTheDocument();
    });

    it('should show instructions step by default', () => {
      renderWithRouter(<SetupWizard />);

      expect(screen.getByText('Step 1: Create a Strava App')).toBeInTheDocument();
      expect(screen.getByText(/Why do I need this?/)).toBeInTheDocument();
    });

    it('should display callback domain', () => {
      renderWithRouter(<SetupWizard />);

      // Check for Authorization Callback Domain section
      expect(screen.getByText(/Authorization Callback Domain:/)).toBeInTheDocument();
    });

    it('should have link to Strava API settings', () => {
      renderWithRouter(<SetupWizard />);

      const link = screen.getByRole('link', { name: /Open Strava API Settings/i });
      expect(link).toHaveAttribute('href', 'https://www.strava.com/settings/api');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('navigation', () => {
    it('should navigate to credentials step when Next is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SetupWizard />);

      const nextButton = screen.getByRole('button', { name: /Next: Enter Credentials/i });
      await user.click(nextButton);

      expect(screen.getByText('Step 2: Enter Your Credentials')).toBeInTheDocument();
    });

    it('should navigate back to instructions when Back is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SetupWizard />);

      // Go to credentials step
      await user.click(screen.getByRole('button', { name: /Next: Enter Credentials/i }));

      // Go back
      const backButton = screen.getByRole('button', { name: /Back/i });
      await user.click(backButton);

      expect(screen.getByText('Step 1: Create a Strava App')).toBeInTheDocument();
    });
  });

  describe('credentials form', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithRouter(<SetupWizard />);

      // Navigate to credentials step
      await user.click(screen.getByRole('button', { name: /Next: Enter Credentials/i }));
    });

    it('should render input fields', () => {
      expect(screen.getByLabelText(/Client ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Client Secret/i)).toBeInTheDocument();
    });

    it('should have Save button disabled initially', () => {
      const saveButton = screen.getByRole('button', { name: /Save & Continue/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when both fields are filled', async () => {
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/Client ID/i), 'test-id');
      await user.type(screen.getByLabelText(/Client Secret/i), 'test-secret');

      const saveButton = screen.getByRole('button', { name: /Save & Continue/i });
      expect(saveButton).toBeEnabled();
    });

    it('should keep Save button disabled when only Client ID is filled', async () => {
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/Client ID/i), 'test-id');

      const saveButton = screen.getByRole('button', { name: /Save & Continue/i });
      expect(saveButton).toBeDisabled();
    });

    it('should keep Save button disabled when only Client Secret is filled', async () => {
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/Client Secret/i), 'test-secret');

      const saveButton = screen.getByRole('button', { name: /Save & Continue/i });
      expect(saveButton).toBeDisabled();
    });

    it('should call setConfig with trimmed values on save', async () => {
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/Client ID/i), '  test-id  ');
      await user.type(screen.getByLabelText(/Client Secret/i), '  test-secret  ');

      const saveButton = screen.getByRole('button', { name: /Save & Continue/i });
      await user.click(saveButton);

      expect(mockSetConfig).toHaveBeenCalledWith({
        clientId: 'test-id',
        clientSecret: 'test-secret',
      });
    });

    it('should not call setConfig when fields are empty after trim', async () => {
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/Client ID/i), '   ');
      await user.type(screen.getByLabelText(/Client Secret/i), '   ');

      const saveButton = screen.getByRole('button', { name: /Save & Continue/i });
      expect(saveButton).toBeDisabled();
    });

    it('should show security note', () => {
      expect(screen.getByText(/Security Note:/)).toBeInTheDocument();
      expect(screen.getByText(/stored locally in your browser/)).toBeInTheDocument();
    });
  });

  describe('instructions content', () => {
    it('should show step-by-step instructions', () => {
      renderWithRouter(<SetupWizard />);

      expect(screen.getByText(/Go to Strava's API settings/)).toBeInTheDocument();
      expect(screen.getByText(/Create a new app/)).toBeInTheDocument();
      expect(screen.getByText(/Get your credentials/)).toBeInTheDocument();
    });

    it('should highlight callback URL importance', () => {
      renderWithRouter(<SetupWizard />);

      expect(screen.getByText(/Authorization Callback Domain:/)).toBeInTheDocument();
      expect(screen.getByText(/Enter only the domain/)).toBeInTheDocument();
    });

    it('should show application form fields', () => {
      renderWithRouter(<SetupWizard />);

      expect(screen.getByText(/Application Name:/)).toBeInTheDocument();
      expect(screen.getByText(/Category:/)).toBeInTheDocument();
      expect(screen.getByText(/Website:/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter(<SetupWizard />);

      expect(screen.getByRole('heading', { name: /Welcome to Sport Year!/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SetupWizard />);

      const nextButton = screen.getByRole('button', { name: /Next: Enter Credentials/i });

      // Tab through elements - first will be the link, then buttons
      await user.tab();
      expect(screen.getByRole('link', { name: /Open Strava API Settings/i })).toHaveFocus();

      // Continue tabbing to reach the button
      await user.tab();
      expect(nextButton).toHaveFocus();
    });

    it('should have proper input types', async () => {
      const user = userEvent.setup();
      renderWithRouter(<SetupWizard />);

      await user.click(screen.getByRole('button', { name: /Next: Enter Credentials/i }));

      const clientIdInput = screen.getByLabelText(/Client ID/i);
      const clientSecretInput = screen.getByLabelText(/Client Secret/i);

      expect(clientIdInput).toHaveAttribute('type', 'text');
      expect(clientSecretInput).toHaveAttribute('type', 'password');
    });
  });

  describe('responsive design', () => {
    it('should use dynamic callback domain', () => {
      renderWithRouter(<SetupWizard />);

      // Check for Authorization Callback Domain section without port
      expect(screen.getByText(/Authorization Callback Domain:/)).toBeInTheDocument();
    });
  });
});
