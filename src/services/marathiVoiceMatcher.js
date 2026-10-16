/**
 * Bolu Ya - Marathi Voice & Intent Matcher
 * 
 * Provides ultra-resilient phonetic and semantic matching for Marathi Devanagari,
 * code-mixed Marathi/English, and rural spoken colloquial forms (e.g., 'नको', 'नाही नको', 'नको मला').
 */

// Devanagari to standard digit mapping
const DEVANAGARI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

// Marathi spoken number words (1 to 100)
const MARATHI_NUMBER_WORDS = {
  'एक': 1, 'दोन': 2, 'तीन': 3, 'चार': 4, 'पाच': 5,
  'सहा': 6, 'सात': 7, 'आठ': 8, 'नऊ': 9, 'दहा': 10,
  'अकरा': 11, 'बारा': 12, 'तेरा': 13, 'चौदा': 14, 'पंधरा': 15,
  'सोळा': 16, 'सतरा': 17, 'अठरा': 18, 'एकोणीस': 19, 'वीस': 20,
  'एकवीस': 21, 'बावीस': 22, 'तेवीस': 23, 'चोवीस': 24, 'पंचवीस': 25,
  'सव्वीस': 26, 'सत्तावीस': 27, 'अठ्ठावीस': 28, 'एकोणतीस': 29, 'तीस': 30,
  'एकतीस': 31, 'बत्तीस': 32, 'तेहतीस': 33, 'चौतीस': 34, 'पस्तीस': 35,
  'छत्तीस': 36, 'सदतीस': 37, 'अडतीस': 38, 'एकेचाळीस': 39, 'चाळीस': 40,
  'एक्केचाळीस': 41, 'बेचाळीस': 42, 'त्रेचाळीस': 43, 'चव्वेचाळीस': 44, 'पंचेचाळीस': 45,
  'शेहेचाळीस': 46, 'सत्तेचाळीस': 47, 'अठ्ठेचाळीस': 48, 'एकोणपन्नास': 49, 'पन्नास': 50,
  'एक्कावन्न': 51, 'बावन्न': 52, 'त्रेपन्न': 53, 'चौपन्न': 54, 'पंचावन्न': 55,
  'छपन्न': 56, 'सत्तावन्न': 57, 'अठ्ठावन्न': 58, 'एकोणसाठ': 59, 'साठ': 60,
  'एकसष्ट': 61, 'बासष्ट': 62, 'त्रेसष्ट': 63, 'चौसष्ट': 64, 'पासष्ट': 65,
  'सहासष्ट': 66, 'सदुसष्ट': 67, 'अडुसष्ट': 68, 'एकोणसत्तर': 69, 'सत्तर': 70,
  'पंचाहत्तर': 75, 'ऐंशी': 80, 'पंच्याऐंशी': 85, 'नव्वद': 90, 'शंभर': 100,
  // Romanized pronunciations
  'ek': 1, 'don': 2, 'teen': 3, 'char': 4, 'paach': 5, 'pach': 5,
  'vees': 20, 'ekvees': 21, 'panchvees': 25, 'tees': 30, 'passtees': 35,
  'chalis': 40, 'panchas': 50, 'saath': 60, 'pasasht': 65
};

// Common conversational filler words in spoken Marathi to strip before matching
const MARATHI_FILLERS = [
  'अं', 'म्हणजे', 'हे बघा', 'ऐका', 'बरं', 'बर', 'हो का', 'अहो', 'जरा', 'प्लीज', 'बघा'
];

/**
 * Normalizes speech text for robust comparison
 */
export function normalizeMarathiSpeech(text) {
  if (!text) return '';
  let str = text.toLowerCase().trim();

  // Convert Devanagari numerals to standard digits (०-९ -> 0-9)
  for (const [devDigit, stdDigit] of Object.entries(DEVANAGARI_DIGITS)) {
    str = str.replaceAll(devDigit, stdDigit);
  }

  // Remove punctuation
  str = str.replace(/[?,.!:;"'’‘'।॥\(\)\-\_]/g, ' ');

  // Remove filler words
  for (const filler of MARATHI_FILLERS) {
    str = str.replace(new RegExp(`(^|\\s)${filler}(\\s|$)`, 'g'), ' ');
  }

  // Normalize whitespace
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Detects if the utterance conveys NO / NEGATION / REJECTION / "I DON'T WANT"
 * Checked FIRST before YES so "नाही आहे" or "नको आहे" is never misread as YES.
 */
export function isNoIntent(text) {
  const norm = normalizeMarathiSpeech(text);
  if (!norm) return false;

  const noKeywords = [
    // Standard Marathi negation
    'नाही', 'नाहीये', 'नाहीयेत', 'नाहित', 'नाहीत', 'नाही गं', 'नाही रे', 'नाही हो',
    // Spoken colloquial 'I don't want' (Very common in rural Maharashtra)
    'नको', 'नकोय', 'नको मला', 'मला नको', 'मला नको आहे', 'नको आहे', 'नको ग', 'नको रे', 'नकोच',
    // Compound negation
    'नाही नको', 'नाही पाहिजे', 'नको पाहिजे', 'पाहिजे नाही', 'नाय', 'नाय पाहिजे', 'नाय नको',
    // Wrong / error / change
    'चूक', 'चुकीचे', 'चुकीचं', 'चूक आहे', 'चुकीचा', 'बदला', 'बदल करा', 'नाव बदला',
    // Cancel / Stop
    'रद्द', 'रद्द करा', 'कॅन्सल', 'थांबा', 'थांबवा', 'नको करू', 'नका करू',
    // Repeat / Retry
    'पुन्हा सांगा', 'पुन्हा विचार', 'परत विचार', 'परत सांगा', 'पुन्हा',
    // English & Romanized transliterations
    'no', 'nope', 'nah', 'not', 'dont want', "don't want", 'i dont want', "i don't want",
    'do not want', 'wrong', 'incorrect', 'cancel', 'change', 'retry', 'stop',
    'nahi', 'naahi', 'nako', 'nakoy', 'nako mala', 'mala nako', 'chook', 'chuki'
  ];

  // Exact word boundary or phrase match
  for (const kw of noKeywords) {
    if (norm === kw || norm.startsWith(kw + ' ') || norm.endsWith(' ' + kw) || norm.includes(' ' + kw + ' ')) {
      return true;
    }
    // Also simple includes check for distinctive keywords
    if (['नको', 'नाही', 'चूक', 'चुकीचं', 'रद्द', 'बदला', 'dont want', "don't want", 'wrong', 'cancel'].some(k => norm.includes(k))) {
      return true;
    }
  }

  // Exact single word 'no' or 'नो'
  if (norm === 'no' || norm === 'नो' || norm === 'ना') {
    return true;
  }

  return false;
}

/**
 * Detects if the utterance conveys YES / CONFIRMATION / APPROVAL
 */
export function isYesIntent(text) {
  const norm = normalizeMarathiSpeech(text);
  if (!norm) return false;

  // IMPORTANT: If it contains negation (e.g. 'नाही आहे', 'नको आहे'), it is NOT YES!
  if (isNoIntent(text)) {
    return false;
  }

  const yesKeywords = [
    // Standard Marathi affirmation
    'होय', 'होय बरोबर', 'हो नक्की', 'हो ना', 'हो हो', 'हो चालेल',
    'बरोबर', 'बरोबर आहे', 'एकदम बरोबर', 'अगदी बरोबर', 'खरं आहे', 'खरे आहे',
    'चालेल', 'नक्की', 'करा', 'पुढे चला', 'पुढे जा', 'योग्य', 'अचूक',
    // Loanwords in common Marathi speech
    'ओके', 'करेक्ट', 'राईट', 'कन्फर्म',
    // English & Romanized
    'yes', 'yeah', 'yep', 'yup', 'aye', 'correct', 'right', 'ok', 'okay',
    'true', 'sure', 'fine', 'confirm', 'proceed', 'done',
    'hoy', 'barobar', 'chalel', 'nakki'
  ];

  for (const kw of yesKeywords) {
    if (norm === kw || norm.startsWith(kw + ' ') || norm.endsWith(' ' + kw) || norm.includes(' ' + kw + ' ')) {
      return true;
    }
  }

  // Specific single token checks
  if (norm === 'हो' || norm === 'हो.' || norm === 'हा' || norm === 'हं' || norm === 'yes' || norm === 'ok') {
    return true;
  }

  // If text starts with 'हो ' or ends with ' आहे' without negation
  if (norm.startsWith('हो ') || norm === 'आहे' || norm === 'होय') {
    return true;
  }

  return false;
}

/**
 * Extracts a numeric value from Marathi speech (either Devanagari numerals, digits, or words)
 * E.g., 'माझं वय पंचवीस वर्षे आहे' -> 25
 * E.g., 'वय ३५' -> 35
 */
export function extractNumberFromMarathi(text) {
  if (!text) return null;
  const norm = normalizeMarathiSpeech(text);

  // 1. Direct digits match (Arabic or normalized Devanagari)
  const digitMatch = norm.match(/\b\d+\b/);
  if (digitMatch) {
    const num = parseInt(digitMatch[0], 10);
    if (!isNaN(num)) return num;
  }

  // 2. Marathi number words lookup
  const words = norm.split(/\s+/);
  for (const w of words) {
    if (MARATHI_NUMBER_WORDS[w] !== undefined) {
      return MARATHI_NUMBER_WORDS[w];
    }
  }

  // 3. Substring check for compound words (e.g. 'पंचवीस')
  for (const [word, val] of Object.entries(MARATHI_NUMBER_WORDS)) {
    if (norm.includes(word)) {
      return val;
    }
  }

  return null;
}

/**
 * Determines if text indicates a request to go back or cancel
 */
export function isCancelOrBackIntent(text) {
  const norm = normalizeMarathiSpeech(text);
  const backKeywords = [
    'मागे जा', 'मागे चला', 'परत जा', 'कॅन्सल', 'रद्द करा', 'होम', 'मुख्य पान',
    'back', 'go back', 'cancel', 'home', 'exit', 'band kara', 'mage ja'
  ];
  return backKeywords.some(kw => norm.includes(kw));
}

export default {
  normalizeMarathiSpeech,
  isNoIntent,
  isYesIntent,
  extractNumberFromMarathi,
  isCancelOrBackIntent
};
