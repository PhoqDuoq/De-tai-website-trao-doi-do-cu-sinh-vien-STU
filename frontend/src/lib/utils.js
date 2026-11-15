import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names using clsx and tailwind-merge
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Vietnamese Dong (VND)
 * e.g., 150000 -> "150.000 ₫"
 */
export function formatVND(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO date string into readable Vietnamese format
 * e.g., "15/11/2026 14:30"
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Helper to normalize and check user roles
 * Roles from backend can be "STUDENT", "MODERATOR", "ADMIN" or with "ROLE_" prefix
 */
export function hasRole(userRoles, targetRole) {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  const cleanTarget = targetRole.replace('ROLE_', '');
  return userRoles.some(
    (role) => role.replace('ROLE_', '') === cleanTarget
  );
}
