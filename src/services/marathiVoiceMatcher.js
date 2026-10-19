/**
 * Sarkar Mitra - Marathi Voice & Intent Matcher
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
  'एकाहत्तर': 71, 'बाहत्तर': 72, 'त्र्याहत्तर': 73, 'चौऱ्याहत्तर': 74, 'पंचाहत्तर': 75,
  'शहात्तर': 76, 'सत्त्याहत्तर': 77, 'अठ्ठ्याहत्तर': 78, 'एकोणऐंशी': 79, 'ऐंशी': 80,
  'एक्क्याऐंशी': 81, 'ब्याऐंशी': 82, 'त्र्याऐंशी': 83, 'चौऱ्याऐंशी': 84, 'पंच्याऐंशी': 85,
  'शहाऐंशी': 86, 'सत्त्याऐंशी': 87, 'अठ्ठ्याऐंशी': 88, 'एकोणनव्वद': 89, 'नव्वद': 90,
  'एक्क्याण्णव': 91, 'ब्याण्णव': 92, 'त्र्याण्णव': 93, 'चौऱ्याण्णव': 94, 'पंच्याण्णव': 95,
  'शहाण्णव': 96, 'सत्त्याण्णव': 97, 'अठ्ठ्याण्णव': 98, 'नव्याण्णव': 99, 'शंभर': 100,
  // Romanized pronunciations
  'ek': 1, 'don': 2, 'teen': 3, 'char': 4, 'paach': 5, 'pach': 5,
  'vees': 20, 'ekvees': 21, 'panchvees': 25, 'tees': 30, 'passtees': 35,
  'chalis': 40, 'panchas': 50, 'saath': 60, 'pasasht': 65
};

// Spoken single digit mapping:
// Supports English words transcribed into Devanagari by SpeechRecognition (e.g., नाईन, सिक्स, फोर, टू, वन),
// English words in Latin (zero, one, two, nine), and Marathi digit words (शून्य, एक, दोन, तीन... नऊ)
export const SPOKEN_DIGIT_MAP = {
  // English words transcribed in Devanagari (Common Web Speech API output)
  'झिरो': '0', 'झीरो': '0', 'जीरो': '0', 'ओ': '0',
  'वन': '1', 'व्हाँ': '1', 'वान': '1',
  'टू': '2', 'टु': '2',
  'थ्री': '3', 'त्री': '3',
  'फोर': '4', 'फॉर': '4',
  'फाइव्ह': '5', 'फाईव्ह': '5', 'फाइव': '5', 'फाईव': '5', 'फाएव': '5',
  'सिक्स': '6', 'शीक्स': '6', 'सीक्स': '6',
  'सेव्हन': '7', 'सेवन': '7',
  'एट': '8', 'ऐट': '8', 'इट': '8',
  'नाईन': '9', 'नाइन': '9', 'नायन': '9', 'नायेन': '9', 'नायिन': '9',

  // English words in Latin script
  'zero': '0', 'oh': '0',
  'one': '1',
  'two': '2',
  'three': '3',
  'four': '4',
  'five': '5',
  'six': '6',
  'seven': '7',
  'eight': '8',
  'nine': '9',

  // Marathi digit words
  'शून्य': '0', 'सुन्न': '0',
  'एक': '1',
  'दोन': '2', 'दो': '2',
  'तीन': '3',
  'चार': '4',
  'पाच': '5',
  'सहा': '6', 'सहाव': '6',
  'सात': '7',
  'आठ': '8',
  'नऊ': '9', 'नव': '9'
};

// Multipliers for repeated digits (e.g. 'डबल सिक्स' -> '66', 'ट्रिपल फोर' -> '444')
export const MULTIPLIER_WORDS = {
  'डबल': 2, 'डब्ल': 2, 'दोनदा': 2, 'double': 2,
  'ट्रिपल': 3, 'त्रिपल': 3, 'तीनदा': 3, 'triple': 3,
  'चारदा': 4, 'quadruple': 4
};

// 2-digit number words in Marathi for telephone pairs (e.g. अठ्ठ्याण्णव -> '98')
export const MARATHI_TWO_DIGIT_WORDS = {
  'दहा': '10', 'अकरा': '11', 'बारा': '12', 'तेरा': '13', 'चौदा': '14', 'पंधरा': '15',
  'सोळा': '16', 'सतरा': '17', 'अठरा': '18', 'एकोणीस': '19', 'वीस': '20',
  'एकवीस': '21', 'बावीस': '22', 'तेवीस': '23', 'चोवीस': '24', 'पंचवीस': '25',
  'सव्वीस': '26', 'सत्तावीस': '27', 'अठ्ठावीस': '28', 'एकोणतीस': '29', 'तीस': '30',
  'एकतीस': '31', 'बत्तीस': '32', 'तेहतीस': '33', 'चौतीस': '34', 'पस्तीस': '35',
  'छत्तीस': '36', 'सदतीस': '37', 'अडतीस': '38', 'एकेचाळीस': '39', 'चाळीस': '40',
  'एक्केचाळीस': '41', 'बेचाळीस': '42', 'त्रेचाळीस': '43', 'चव्वेचाळीस': '44', 'पंचेचाळीस': '45',
  'शेहेचाळीस': '46', 'सत्तेचाळीस': '47', 'अठ्ठेचाळीस': '48', 'एकोणपन्नास': '49', 'पन्नास': '50',
  'एक्कावन्न': '51', 'बावन्न': '52', 'त्रेपन्न': '53', 'चौपन्न': '54', 'पंचावन्न': '55',
  'छपन्न': '56', 'सत्तावन्न': '57', 'अठ्ठावन्न': '58', 'एकोणसाठ': '59', 'साठ': '60',
  'एकसष्ट': '61', 'बासष्ट': '62', 'त्रेसष्ट': '63', 'चौसष्ट': '64', 'पासष्ट': '65',
  'सहासष्ट': '66', 'सदुसष्ट': '67', 'अडुसष्ट': '68', 'एकोणसत्तर': '69', 'सत्तर': '70',
  'एकाहत्तर': '71', 'बाहत्तर': '72', 'त्र्याहत्तर': '73', 'चौऱ्याहत्तर': '74', 'पंचाहत्तर': '75',
  'शहात्तर': '76', 'सत्त्याहत्तर': '77', 'अठ्ठ्याहत्तर': '78', 'एकोणऐंशी': '79', 'ऐंशी': '80',
  'एक्क्याऐंशी': '81', 'ब्याऐंशी': '82', 'त्र्याऐंशी': '83', 'चौऱ्याऐंशी': '84', 'पंच्याऐंशी': '85',
  'शहाऐंशी': '86', 'सत्त्याऐंशी': '87', 'अठ्ठ्याऐंशी': '88', 'एकोणनव्वद': '89', 'नव्वद': '90',
  'एक्क्याण्णव': '91', 'ब्याण्णव': '92', 'त्र्याण्णव': '93', 'चौऱ्याण्णव': '94', 'पंच्याण्णव': '95',
  'शहाण्णव': '96', 'सत्त्याण्णव': '97', 'अठ्ठ्याण्णव': '98', 'नव्याण्णव': '99'
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
 * Detects if the utterance is a STOP / SILENCE command
 * Recognized Marathi: "थांब", "थांबा", "थांबवा", "बंद कर", "पुरे", "शांत राहा", "बस करा"
 * Recognized English: "stop", "shut up", "quiet", "silence", "stop audio"
 */
export const STOP_WORDS = [
  'थांब', 'थांबा', 'थांबवा', 'थांब रे', 'थांब ग', 'थांबा जरा',
  'बंद कर', 'बंद करा', 'आवाज बंद', 'बोलणे थांबवा', 'बोलू नको', 'बोलू नका',
  'पुरे', 'पुरे झाले', 'पुरे झालं', 'बस', 'बस करा',
  'शांत राहा', 'शांत रहा', 'शांत बस', 'गप्प राहा', 'गप्प बस',
  'stop', 'stop it', 'stop talking', 'stop audio', 'shut up', 'quiet', 'silence'
];

export function isStopIntent(text) {
  if (!text) return false;
  const norm = normalizeMarathiSpeech(text);
  if (!norm) return false;

  for (const sw of STOP_WORDS) {
    if (norm === sw || norm.startsWith(sw + ' ') || norm.endsWith(' ' + sw) || norm.includes(' ' + sw + ' ')) {
      return true;
    }
  }

  if (['थांब', 'थांबा', 'बंद कर', 'पुरे', 'stop', 'shut up', 'शांत राहा', 'शांत रहा'].some(k => norm.includes(k))) {
    return true;
  }

  return false;
}

/**
 * Detects if the utterance conveys NO / NEGATION / REJECTION / "I DON'T WANT"
 * Checked FIRST before YES so "नाही आहे" or "नको आहे" is never misread as YES.
 * NOTE: Stop commands ("थांबा", "बंद कर", "stop") are excluded so they don't register as "No" answers.
 */
export function isNoIntent(text) {
  // If user is issuing a stop command, it is handled separately and NOT as a form answer
  if (isStopIntent(text)) {
    return false;
  }

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
    // Cancel
    'रद्द', 'रद्द करा', 'कॅन्सल', 'नको करू', 'नका करू',
    // Repeat / Retry
    'पुन्हा सांगा', 'पुन्हा विचार', 'परत विचार', 'परत सांगा', 'पुन्हा',
    // English & Romanized transliterations
    'no', 'nope', 'nah', 'not', 'dont want', "don't want", 'i dont want', "i don't want",
    'do not want', 'wrong', 'incorrect', 'cancel', 'change', 'retry',
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
 * Interprets a spoken phone/mobile number given in English, Marathi, or mixed code
 * Spoken examples handled:
 * - 'नाईन डबल सिक्स डबल फोर टू नाईन फोर वन' -> '966442941'
 * - 'नऊ आठ दोन दोन शून्य एक दोन तीन चार पाच' -> '9822012345'
 * - 'nine eight two two zero one two three four five' -> '9822012345'
 * - '९८२२०१२३४५' -> '9822012345'
 * - 'माझा नंबर नाईन एट टू टू...' -> '9822...'
 * - 'अठ्ठ्याण्णव बावीस शून्य एक तेवीस पंचेचाळीस' -> '9822012345'
 * Always returns a pure numerical string, NEVER word format.
 */
export function parseSpokenPhoneNumber(text) {
  if (!text) return null;
  let str = text.toLowerCase().trim();

  // 1. Convert Devanagari numerals (०-९) to ASCII digits (0-9)
  for (const [devDigit, stdDigit] of Object.entries(DEVANAGARI_DIGITS)) {
    str = str.replaceAll(devDigit, stdDigit);
  }

  // 2. Remove common conversational prefixes/suffixes before/after phone number
  str = str.replace(/माझा\s+(मोबाईल|फोन|नंबर|मोबाईल\s+नंबर)/gi, ' ');
  str = str.replace(/(माझा|माझी|माझे)\s+नंबर/gi, ' ');
  str = str.replace(/(मोबाईल|फोन)\s+नंबर/gi, ' ');
  str = str.replace(/(मोबाईल|फोन|नंबर)\s+आहे/gi, ' ');
  str = str.replace(/(आहे|असा\s+आहे|अहो|बघा|नोंदवा|टाका|लिहा)/gi, ' ');
  str = str.replace(/[?,.!:;"'’‘'।॥\(\)\-\_]/g, ' ');

  // 3. Tokenize by whitespace
  const tokens = str.split(/\s+/).filter(Boolean);
  let resultDigits = '';
  let multiplier = 1;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check if token is a multiplier (डबल, ट्रिपल, double, triple, दोनदा, तीनदा)
    if (MULTIPLIER_WORDS[token]) {
      multiplier = MULTIPLIER_WORDS[token];
      continue;
    }

    // Check if token is already pure digits (e.g. '966', '44', '9822012345')
    if (/^\d+$/.test(token)) {
      if (multiplier > 1) {
        if (token.length === 1) {
          resultDigits += token.repeat(multiplier);
        } else {
          resultDigits += token;
        }
        multiplier = 1;
      } else {
        resultDigits += token;
      }
      continue;
    }

    // Check single digit words (English in Devanagari, Marathi, English)
    if (SPOKEN_DIGIT_MAP[token] !== undefined) {
      const digit = SPOKEN_DIGIT_MAP[token];
      resultDigits += digit.repeat(multiplier);
      multiplier = 1;
      continue;
    }

    // Check 2-digit Marathi words (e.g. अठ्ठ्याण्णव -> '98', बावीस -> '22')
    if (MARATHI_TWO_DIGIT_WORDS[token] !== undefined) {
      resultDigits += MARATHI_TWO_DIGIT_WORDS[token];
      multiplier = 1;
      continue;
    }

    // If token has partial digits mixed with letters/symbols
    const extractedDigits = token.replace(/\D/g, '');
    if (extractedDigits) {
      resultDigits += extractedDigits;
    }

    // Reset multiplier if unrecognized
    multiplier = 1;
  }

  // Clean any stray non-digits
  const cleaned = resultDigits.replace(/\D/g, '');

  if (cleaned.length >= 7) {
    // If user provided +91 or leading 0 for 10-digit number
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return cleaned.slice(2);
    }
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return cleaned.slice(1);
    }
    return cleaned;
  }

  if (cleaned.length > 0) {
    return cleaned;
  }

  return null;
}

/**
 * Extracts a numeric value from Marathi speech (either Devanagari numerals, digits, or words)
 * E.g., 'माझं वय पंचवीस वर्षे आहे' -> 25
 * E.g., 'वय ३५' -> 35
 */
export function extractNumberFromMarathi(text) {
  if (!text) return null;

  // 1. Check if it can be parsed as a phone/digit sequence
  const parsedDigits = parseSpokenPhoneNumber(text);
  if (parsedDigits && parsedDigits.length >= 7) {
    return parsedDigits;
  }

  const norm = normalizeMarathiSpeech(text);

  // 2. Direct digits match (Arabic or normalized Devanagari)
  const digitMatch = norm.match(/\b\d+\b/);
  if (digitMatch) {
    const num = parseInt(digitMatch[0], 10);
    if (!isNaN(num)) return num;
  }

  // 3. Check single digit or two-digit words
  const words = norm.split(/\s+/);
  for (const w of words) {
    if (SPOKEN_DIGIT_MAP[w] !== undefined) {
      return parseInt(SPOKEN_DIGIT_MAP[w], 10);
    }
    if (MARATHI_TWO_DIGIT_WORDS[w] !== undefined) {
      return parseInt(MARATHI_TWO_DIGIT_WORDS[w], 10);
    }
    if (MARATHI_NUMBER_WORDS[w] !== undefined) {
      return MARATHI_NUMBER_WORDS[w];
    }
  }

  // 4. Substring check for compound words (e.g. 'पंचवीस')
  for (const [word, val] of Object.entries(MARATHI_NUMBER_WORDS)) {
    if (norm.includes(word)) {
      return val;
    }
  }

  if (parsedDigits && parsedDigits.length > 0) {
    const num = parseInt(parsedDigits, 10);
    if (!isNaN(num)) return num;
  }

  return null;
}

/**
 * Determines if text indicates a request to go back to the previous question/field
 */
export function isPreviousOrBackIntent(text) {
  if (!text) return false;
  const norm = normalizeMarathiSpeech(text);
  const backKeywords = [
    'मागे जा', 'मागे चला', 'मागचा प्रश्न', 'मागील प्रश्न', 'मागील', 'मागे',
    'परत जा', 'मागे या', 'मागचा', 'मागील पायरी', 'मागे फिरा',
    'back', 'go back', 'previous', 'prev', 'previous question', 'mage ja', 'magcha'
  ];
  return backKeywords.some(kw => norm === kw || norm.startsWith(kw + ' ') || norm.endsWith(' ' + kw) || norm.includes(' ' + kw + ' '));
}

/**
 * Detects whether the user's speech input for phone/numbers was in English or Marathi
 * Checks for Latin letters, English words, or English digit words transcribed in Devanagari.
 */
export function detectSpokenLanguage(text) {
  if (!text) return 'mr';
  const norm = text.toLowerCase().trim();

  // 1. Check for Latin characters (e.g., 'nine', 'double', 'phone', '966')
  if (/[a-zA-Z]/.test(text)) return 'en';

  // 2. Check for English number words transcribed in Devanagari (common Web Speech output)
  const englishDevanagariWords = [
    'नाईन', 'नाइन', 'नायन', 'नायेन', 'सिक्स', 'शीक्स', 'सीक्स',
    'फोर', 'फॉर', 'टू', 'टु', 'वन', 'वान', 'व्हाँ',
    'झिरो', 'झीरो', 'जीरो', 'ओ', 'थ्री', 'त्री',
    'फाइव्ह', 'फाईव्ह', 'फाइव', 'फाईव', 'फाएव',
    'सेव्हन', 'सेवन', 'एट', 'ऐट', 'इट',
    'डबल', 'ट्रिपल'
  ];

  for (const w of englishDevanagariWords) {
    if (norm.includes(w)) return 'en';
  }

  return 'mr';
}

/**
 * Formats a phone number digit-by-digit for natural, non-lagging speech synthesis
 * Prevents Marathi TTS from trying to read 10-digit numbers as huge cardinal numbers (e.g. ९६ कोटी...)
 */
export function formatPhoneNumberForSpeech(phoneNumber, lang = 'mr') {
  if (!phoneNumber) return '';
  const digits = String(phoneNumber).replace(/\D/g, '').split('');

  if (lang === 'en') {
    const englishDigitWords = {
      '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
      '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'
    };
    return digits.map(d => englishDigitWords[d] || d).join(' ');
  } else {
    const marathiDigitWords = {
      '0': 'शून्य', '1': 'एक', '2': 'दोन', '3': 'तीन', '4': 'चार',
      '5': 'पाच', '6': 'सहा', '7': 'सात', '8': 'आठ', '9': 'नऊ'
    };
    return digits.map(d => marathiDigitWords[d] || d).join(', ');
  }
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
  parseSpokenPhoneNumber,
  detectSpokenLanguage,
  formatPhoneNumberForSpeech,
  isPreviousOrBackIntent,
  isCancelOrBackIntent
};
