// Shared utility functions for profile components

export function getStatusColor(_status: string): string {
  return 'bg-primary-100 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400'
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
