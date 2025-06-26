import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconGrid } from '../icon-grid';

// Mock the dependencies
jest.mock('@/hooks/use-infinite-scroll', () => ({
  useInfiniteScroll: jest.fn(() => ({
    targetRef: { current: null },
    isFetching: false,
    setIsFetching: jest.fn(),
  })),
}));

jest.mock('@/components/ui/toast', () => ({
  useToast: jest.fn(() => ({
    showToast: jest.fn(),
    ToastContainer: () => <div data-testid="toast-container" />,
  })),
}));

jest.mock('@/utils/iconDownloader', () => ({
  downloadSvg: jest.fn(),
  downloadPng: jest.fn(),
}));

// Mock data for testing
const mockIcons = [
  {
    id: 'test-icon-1',
    provider: 'azure',
    icon_name: 'Test Icon 1',
    description: 'Test description 1',
    tags: ['test', 'icon'],
    svg_path: '/icons/azure/test-icon-1.svg',
    license: 'Test license',
    svg_content: '<svg>Test SVG 1</svg>',
  },
  {
    id: 'test-icon-2',
    provider: 'azure',
    icon_name: 'Test Icon 2',
    description: 'Test description 2',
    tags: ['test', 'icon'],
    svg_path: '/icons/azure/test-icon-2.svg',
    license: 'Test license',
    svg_content: '<svg>Test SVG 2</svg>',
  },
];

// Mock the fetch response
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      total: 2,
      page: 1,
      pageSize: 25,
      data: mockIcons,
    }),
  })
) as jest.Mock;

describe('IconGrid Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    render(<IconGrid provider="azure" />);

    // The component should show a loading skeleton initially
    expect(screen.getByTestId('icon-grid-skeleton')).toBeInTheDocument();
  });

  it('renders icons after loading', async () => {
    render(<IconGrid provider="azure" />);

    // Wait for the icons to load
    await waitFor(() => {
      expect(screen.getByText('Test Icon 1')).toBeInTheDocument();
      expect(screen.getByText('Test Icon 2')).toBeInTheDocument();
    });
  });

  it('calls onTotalCountChange with the correct count', async () => {
    const onTotalCountChange = jest.fn();
    render(<IconGrid provider="azure" onTotalCountChange={onTotalCountChange} />);

    // Wait for the icons to load
    await waitFor(() => {
      expect(onTotalCountChange).toHaveBeenCalledWith(2);
    });
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<IconGrid provider="azure" />);

    // Wait for the icons to load
    await waitFor(() => {
      expect(screen.getByText('Test Icon 1')).toBeInTheDocument();
    });

    // Find the first icon card
    const iconCard = screen.getByRole('gridcell', { name: /Test Icon 1 icon/i });

    // Focus on the card
    iconCard.focus();

    // Press Enter key
    await user.keyboard('{Enter}');

    // Check if the toast was shown (we'd need to mock the showToast function to verify this)
  });

  it('copies SVG to clipboard when copy button is clicked', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    const user = userEvent.setup();
    render(<IconGrid provider="azure" />);

    // Wait for the icons to load
    await waitFor(() => {
      expect(screen.getByText('Test Icon 1')).toBeInTheDocument();
    });

    // Find the copy button for the first icon
    const copyButton = screen.getByLabelText(/Copy Test Icon 1 SVG code/i);

    // Click the copy button
    await user.click(copyButton);

    // Check if clipboard.writeText was called with the correct SVG content
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<svg>Test SVG 1</svg>');
  });

  it('shows error message when API request fails', async () => {
    // Mock a failed fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    ) as jest.Mock;

    render(<IconGrid provider="azure" />);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/API error: 500 Internal Server Error/i)).toBeInTheDocument();
    });
  });

  it('applies search query and tags to API request', async () => {
    render(<IconGrid provider="azure" searchQuery="test" tags={['tag1', 'tag2']} />);

    // Wait for the fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test&tags=tag1,tag2')
      );
    });
  });
});