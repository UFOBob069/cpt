'use client';
import { useEffect } from 'react';

export default function GrammarlyCleanup({ children }) {
  useEffect(() => {
    // Use MutationObserver to continuously clean up Grammarly attributes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target instanceof Element) {
          if (mutation.target.hasAttribute('data-new-gr-c-s-check-loaded')) {
            mutation.target.removeAttribute('data-new-gr-c-s-check-loaded');
          }
          if (mutation.target.hasAttribute('data-gr-ext-installed')) {
            mutation.target.removeAttribute('data-gr-ext-installed');
          }
        }
      });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed']
    });

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
} 