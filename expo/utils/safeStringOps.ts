/**
 * Safe String Operations
 * Provides regex-free alternatives to common string operations
 * to avoid Hermes regex crashes on iOS
 */

/**
 * Safely capitalize the first letter of each word in a string
 * Avoids regex operations that can crash in Hermes
 */
export function capitalizeWords(str: string): string {
  if (!str) return '';

  return str
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Safely replace underscores with spaces and capitalize
 */
export function formatEnumValue(value: string): string {
  if (!value) return '';

  // Replace underscores with spaces
  const withSpaces = value.split('_').join(' ');

  // Capitalize each word
  return capitalizeWords(withSpaces);
}

/**
 * Generate a UUID v4 without using regex
 * Safe for Hermes engine
 */
export function generateUUID(): string {
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  let uuid = '';

  for (let i = 0; i < template.length; i++) {
    const c = template[i];
    if (c === 'x') {
      const r = Math.random() * 16 | 0;
      uuid += r.toString(16);
    } else if (c === 'y') {
      const r = Math.random() * 16 | 0;
      const v = (r & 0x3 | 0x8);
      uuid += v.toString(16);
    } else {
      uuid += c;
    }
  }

  return uuid;
}

/**
 * Safely remove all non-alphanumeric characters
 * Avoids regex operations
 */
export function removeNonAlphanumeric(str: string): string {
  if (!str) return '';

  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = char.charCodeAt(0);

    // Check if alphanumeric (0-9, A-Z, a-z)
    if (
      (code >= 48 && code <= 57) ||  // 0-9
      (code >= 65 && code <= 90) ||  // A-Z
      (code >= 97 && code <= 122)    // a-z
    ) {
      result += char;
    }
  }

  return result;
}

/**
 * Safely trim whitespace from both ends of a string
 */
export function safeTrim(str: string): string {
  if (!str) return '';

  let start = 0;
  let end = str.length - 1;

  // Find first non-whitespace character
  while (start <= end && isWhitespace(str[start])) {
    start++;
  }

  // Find last non-whitespace character
  while (end >= start && isWhitespace(str[end])) {
    end--;
  }

  return str.substring(start, end + 1);
}

/**
 * Check if a character is whitespace
 */
function isWhitespace(char: string): boolean {
  const code = char.charCodeAt(0);
  return code === 32 || // space
         code === 9 ||  // tab
         code === 10 || // line feed
         code === 13;   // carriage return
}

/**
 * Safely validate email format without regex
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;

  const trimmed = safeTrim(email);

  // Basic checks without regex
  const atIndex = trimmed.indexOf('@');
  if (atIndex === -1 || atIndex === 0 || atIndex === trimmed.length - 1) {
    return false;
  }

  const dotIndex = trimmed.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex <= atIndex + 1 || dotIndex === trimmed.length - 1) {
    return false;
  }

  // Check for multiple @ symbols
  if (trimmed.indexOf('@', atIndex + 1) !== -1) {
    return false;
  }

  return true;
}

/**
 * Safely convert string to URL-friendly slug
 */
export function createSlug(str: string): string {
  if (!str) return '';

  let slug = str.toLowerCase();

  // Replace spaces and underscores with hyphens
  slug = slug.split(' ').join('-');
  slug = slug.split('_').join('-');

  // Remove special characters (keep only alphanumeric and hyphens)
  let result = '';
  for (let i = 0; i < slug.length; i++) {
    const char = slug[i];
    const code = char.charCodeAt(0);

    if (
      (code >= 48 && code <= 57) ||  // 0-9
      (code >= 97 && code <= 122) || // a-z
      code === 45                     // hyphen
    ) {
      result += char;
    }
  }

  // Remove consecutive hyphens
  let cleaned = '';
  let lastWasHyphen = false;
  for (let i = 0; i < result.length; i++) {
    if (result[i] === '-') {
      if (!lastWasHyphen) {
        cleaned += result[i];
      }
      lastWasHyphen = true;
    } else {
      cleaned += result[i];
      lastWasHyphen = false;
    }
  }

  // Remove leading/trailing hyphens
  while (cleaned.length > 0 && cleaned[0] === '-') {
    cleaned = cleaned.substring(1);
  }
  while (cleaned.length > 0 && cleaned[cleaned.length - 1] === '-') {
    cleaned = cleaned.substring(0, cleaned.length - 1);
  }

  return cleaned;
}

/**
 * Safely truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (!str || str.length <= maxLength) return str;

  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Safely check if string contains substring (case-insensitive)
 */
export function containsIgnoreCase(str: string, search: string): boolean {
  if (!str || !search) return false;

  return str.toLowerCase().indexOf(search.toLowerCase()) !== -1;
}
