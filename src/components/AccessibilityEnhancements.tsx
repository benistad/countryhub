import { useEffect } from 'react';

interface AccessibilityEnhancementsProps {
  currentPage: string;
}

export function AccessibilityEnhancements({ currentPage }: AccessibilityEnhancementsProps) {
  useEffect(() => {
    // Skip to main content link
    const skipLink = document.getElementById('skip-to-main');
    if (!skipLink) {
      const link = document.createElement('a');
      link.id = 'skip-to-main';
      link.href = '#main-content';
      link.textContent = 'Skip to main content';
      link.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded';
      document.body.insertBefore(link, document.body.firstChild);
    }

    // Update page announcement for screen readers
    const announcement = document.getElementById('page-announcement');
    if (announcement) {
      announcement.textContent = `Navigated to ${currentPage} page`;
    } else {
      const announcer = document.createElement('div');
      announcer.id = 'page-announcement';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = `Navigated to ${currentPage} page`;
      document.body.appendChild(announcer);
    }

    // Focus management for navigation
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
    }

  }, [currentPage]);

  return null;
}

// Utility component for screen reader only text
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// Loading announcement component
export function LoadingAnnouncement({ isLoading, content }: { isLoading: boolean; content: string }) {
  useEffect(() => {
    const announcement = document.getElementById('loading-announcement');
    if (announcement) {
      announcement.textContent = isLoading ? `Loading ${content}...` : `${content} loaded`;
    } else if (isLoading) {
      const announcer = document.createElement('div');
      announcer.id = 'loading-announcement';
      announcer.setAttribute('aria-live', 'polite');
      announcer.className = 'sr-only';
      announcer.textContent = `Loading ${content}...`;
      document.body.appendChild(announcer);
    }
  }, [isLoading, content]);

  return null;
}
