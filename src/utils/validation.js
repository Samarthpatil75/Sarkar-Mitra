/**
 * Sarkar Mitra - Input Validation Utilities
 * 
 * Strict validation rules for citizen form intake:
 * - Mobile number validation (10-digit Indian mobile number)
 * - Specific Marathi error messages for length and character validity
 */

export const MOBILE_ERROR_MESSAGES = {
  TOO_SHORT: 'आपण दिलेला मोबाईल क्रमांक १० अंकी नाही. कृपया आपला १० अंकी मोबाईल क्रमांक पुन्हा सांगा.',
  TOO_LONG: 'आपण दिलेला मोबाईल क्रमांक १० अंकीपेक्षा जास्त आहे. कृपया फक्त १० अंकी मोबाईल क्रमांक द्या.',
  NON_NUMERIC: 'कृपया फक्त अंकांमध्ये आपला १० अंकी मोबाईल क्रमांक सांगा.'
};

/**
 * Validates a mobile number according to Sarkar Mitra rules:
 * 1. Must contain exactly 10 digits.
 * 2. Accepts only numeric digits (0–9).
 * 3. Rejects fewer than 10 digits with: "आपण दिलेला मोबाईल क्रमांक १० अंकी नाही. कृपया आपला १० अंकी मोबाईल क्रमांक पुन्हा सांगा."
 * 4. Rejects more than 10 digits with: "आपण दिलेला मोबाईल क्रमांक १० अंकीपेक्षा जास्त आहे. कृपया फक्त १० अंकी मोबाईल क्रमांक द्या."
 * 5. Rejects non-numeric input with: "कृपया फक्त अंकांमध्ये आपला १० अंकी मोबाईल क्रमांक सांगा."
 * 6. Trims leading/trailing whitespace before validation, but never silently truncates extra digits.
 * 
 * @param {string|number} rawInput
 * @returns {{ isValid: boolean, cleanNumber: string | null, error: string | null }}
 */
export function validateMobileNumber(rawInput) {
  if (rawInput === null || rawInput === undefined) {
    return {
      isValid: false,
      cleanNumber: null,
      error: MOBILE_ERROR_MESSAGES.NON_NUMERIC
    };
  }

  const str = String(rawInput);
  const trimmed = str.trim();

  if (!trimmed) {
    return {
      isValid: false,
      cleanNumber: null,
      error: MOBILE_ERROR_MESSAGES.NON_NUMERIC
    };
  }

  // 1. Convert any Devanagari numerals (०-९) to ASCII digits (0-9)
  let normalized = '';
  for (const ch of trimmed) {
    const code = ch.charCodeAt(0);
    if (code >= 0x0966 && code <= 0x096F) {
      normalized += (code - 0x0966).toString();
    } else {
      normalized += ch;
    }
  }

  // 2. Remove internal whitespace between digits (e.g. "98224 51234")
  const withoutSpaces = normalized.replace(/\s+/g, '');

  // 3. Check for non-numeric characters (letters, symbols like +, -, @, #, etc.)
  if (/[^\d]/.test(withoutSpaces)) {
    return {
      isValid: false,
      cleanNumber: null,
      error: MOBILE_ERROR_MESSAGES.NON_NUMERIC
    };
  }

  // 4. Check if fewer than 10 digits
  if (withoutSpaces.length < 10) {
    return {
      isValid: false,
      cleanNumber: null,
      error: MOBILE_ERROR_MESSAGES.TOO_SHORT
    };
  }

  // 5. Check if more than 10 digits (never silently truncate)
  if (withoutSpaces.length > 10) {
    return {
      isValid: false,
      cleanNumber: null,
      error: MOBILE_ERROR_MESSAGES.TOO_LONG
    };
  }

  // 6. Exactly 10 digits (0-9)
  return {
    isValid: true,
    cleanNumber: withoutSpaces,
    error: null
  };
}

/**
 * Quick boolean check if a string is a valid 10-digit mobile number
 */
export function isValidMobileNumber(input) {
  return validateMobileNumber(input).isValid;
}
