/**
 * Format large numbers with K/M/B suffixes
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted string
 */
export const formatNumber = (num, decimals = 1) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(decimals) + 'B';
  } else if (absNum >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  } else if (absNum >= 1000) {
    return (num / 1000).toFixed(decimals) + 'K';
  }
  
  return num.toFixed(decimals);
};

/**
 * Format number with commas
 * @param {number} num - The number to format
 * @returns {string} Formatted string with commas
 */
export const formatWithCommas = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

/**
 * Format currency
 * @param {number} num - The number to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '$0';
  return '$' + formatNumber(num);
};
