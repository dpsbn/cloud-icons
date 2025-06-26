import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../theme-toggle';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock document.documentElement for theme class manipulation
const documentElementMock = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
  },
};

Object.defineProperty(window.document, 'documentElement', {
  value: documentElementMock,
  writable: true,
});

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Reset the mocked classList
    documentElementMock.classList.add.mockClear();
    documentElementMock.classList.remove.mockClear();
  });

  it('renders the theme toggle button', () => {
    render(<ThemeToggle />);
    
    // Check if the button is rendered
    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(button).toBeInTheDocument();
  });

  it('shows moon icon by default (light theme)', () => {
    render(<ThemeToggle />);
    
    // In light mode, the Moon icon should be visible
    const moonIcon = screen.getByTestId('moon-icon');
    expect(moonIcon).toBeInTheDocument();
    
    // Sun icon should not be visible
    const sunIcon = screen.queryByTestId('sun-icon');
    expect(sunIcon).not.toBeInTheDocument();
  });

  it('toggles theme when clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    // Initially in light mode
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    
    // Click the toggle button
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Should now be in dark mode
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();
    
    // Check if localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    
    // Check if document classes were updated
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('light', 'dark');
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
  });

  it('loads theme from localStorage on mount', () => {
    // Set theme in localStorage
    localStorageMock.getItem.mockReturnValueOnce('dark');
    
    render(<ThemeToggle />);
    
    // Should be in dark mode
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    
    // Check if document classes were updated
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('light', 'dark');
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
  });

  it('uses system preference when no localStorage value', () => {
    // Mock system preference for dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
      })),
    });
    
    render(<ThemeToggle />);
    
    // Should be in dark mode based on system preference
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    
    // Check if document classes were updated
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('light', 'dark');
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    // Initially in light mode
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    
    // Focus the button
    const button = screen.getByRole('button');
    button.focus();
    
    // Press Space key
    await user.keyboard(' ');
    
    // Should now be in dark mode
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    
    // Press Enter key to toggle back
    await user.keyboard('{Enter}');
    
    // Should be back in light mode
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });
});