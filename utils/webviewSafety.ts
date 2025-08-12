/**
 * Safe WebView Message Utility
 * Prevents TurboModule crashes by sanitizing data before postMessage
 */

interface SafeMessageData {
  type: string;
  [key: string]: any;
}

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void };
  }
}

/**
 * Safely sanitizes data to prevent TurboModule array conversion issues
 */
function sanitizeMessageData(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (Array.isArray(data)) {
    // Ensure arrays are valid and not empty/null
    return data.length > 0 ? data.filter(item => item !== null && item !== undefined) : [];
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== undefined && value !== null) {
        sanitized[key] = sanitizeMessageData(value);
      }
    });
    return sanitized;
  }
  
  return data;
}

/**
 * Safe wrapper for WebView postMessage calls
 */
export function safePostMessage(data: SafeMessageData): void {
  try {
    // Check if ReactNativeWebView is available
    if (typeof window === 'undefined' || !window.ReactNativeWebView) {
      console.warn('ReactNativeWebView not available');
      return;
    }
    
    // Sanitize the data to prevent TurboModule issues
    const sanitizedData = sanitizeMessageData(data);
    
    // Ensure we have a valid type
    if (!sanitizedData?.type) {
      console.error('WebView message must have a type field');
      return;
    }
    
    // Convert to JSON safely
    const messageStr = JSON.stringify(sanitizedData);
    
    // Send the message
    window.ReactNativeWebView.postMessage(messageStr);
    
  } catch (error) {
    console.error('Failed to send WebView message:', error);
  }
}

/**
 * Safe wrapper for parsing WebView messages
 */
export function safeParseMessage(eventData: string): SafeMessageData | null {
  try {
    if (!eventData || typeof eventData !== 'string') {
      return null;
    }
    
    const parsed = JSON.parse(eventData);
    
    // Validate message structure
    if (!parsed || typeof parsed !== 'object' || !parsed.type) {
      console.warn('Invalid WebView message format:', parsed);
      return null;
    }
    
    // Sanitize the parsed data
    return sanitizeMessageData(parsed);
    
  } catch (error) {
    console.error('Failed to parse WebView message:', error);
    return null;
  }
}

/**
 * Creates safe injected JavaScript for WebView
 */
export function createSafeInjectedJS(customJS?: string): string {
  return `
    // Safe message sender wrapper
    window.safeSendMessage = function(data) {
      try {
        if (!data || !data.type) {
          console.error('Message must have a type field');
          return;
        }
        
        // Sanitize arrays and objects
        const sanitized = JSON.parse(JSON.stringify(data, function(key, value) {
          if (value === null || value === undefined) {
            return undefined;
          }
          if (Array.isArray(value)) {
            return value.filter(item => item !== null && item !== undefined);
          }
          return value;
        }));
        
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(sanitized));
        }
      } catch (error) {
        console.error('Failed to send safe message:', error);
      }
    };
    
    ${customJS || ''}
    
    true;
  `;
}