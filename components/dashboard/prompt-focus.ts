'use client';

/**
 * Focuses the dashboard prompt composer, scrolling it into view first.
 * Shared by the top bar (Ctrl/⌘+K), the sidebar "New Project" action,
 * and the quick-start cards.
 */
export function focusDashboardPrompt() {
  if (typeof document === 'undefined') return;

  const container = document.getElementById('dashboard-prompt-area');
  container?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  window.setTimeout(() => {
    const textarea = document.getElementById(
      'dashboard-prompt-textarea'
    ) as HTMLTextAreaElement | null;
    textarea?.focus();
  }, 120);
}
