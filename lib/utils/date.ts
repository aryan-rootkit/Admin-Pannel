/**
 * Date formatting utilities
 * Format: "25 Sept 2025", "4 May 2026"
 */

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
];

/**
 * Format date as "25 Sept 2025" or "4 May 2026"
 * @param date - Date object, date string, or ISO string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const day = dateObj.getDate();
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format date range for display
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: Date | string | null | undefined, endDate: Date | string | null | undefined): string {
  if (!startDate || !endDate) return '-';
  
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  return `${start} - ${end}`;
}
