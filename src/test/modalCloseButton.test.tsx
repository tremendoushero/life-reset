import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/common/Modal';

describe('Modal Component - Close Button Behavior & Responsive Visibility', () => {
  it('renders the close button with the specified aria-label', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Sign In & Sync" closeAriaLabel="Close sign in window">
        <div>Modal Content</div>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: 'Close sign in window' });
    expect(closeButton).toBeInTheDocument();
  });

  it('ensures the close button does not contain responsive hiding classes (like hidden or md:hidden)', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Sign In & Sync">
        <div>Modal Content</div>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    const classList = closeButton.className;

    // Verify it is not hidden on any screen size
    expect(classList).not.toMatch(/\bhidden\b/);
    expect(classList).not.toMatch(/\bmd:hidden\b/);
    expect(classList).not.toMatch(/\bsm:hidden\b/);
    expect(classList).not.toMatch(/\blg:hidden\b/);

    // Verify minimum 44x44px clickable area classes
    expect(classList).toContain('min-w-[44px]');
    expect(classList).toContain('min-h-[44px]');
    expect(classList).toContain('w-11');
    expect(classList).toContain('h-11');
  });

  it('calls onClose when the close (×) button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Sign In & Sync">
        <div>Modal Content</div>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Sign In & Sync">
        <div>Modal Content</div>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the backdrop overlay', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={handleClose} title="Sign In & Sync">
        <div>Modal Content</div>
      </Modal>
    );

    // The outermost backdrop element
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when clicking inside the modal dialog container or content', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Sign In & Sync">
        <div data-testid="inner-content">Modal Content</div>
      </Modal>
    );

    const innerContent = screen.getByTestId('inner-content');
    fireEvent.click(innerContent);

    expect(handleClose).not.toHaveBeenCalled();
  });
});

