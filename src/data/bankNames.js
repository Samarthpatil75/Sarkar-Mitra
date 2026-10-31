/**
 * Sarkar Mitra - Bank Names & Voice Matching Utility
 * 
 * Supports Maharashtra civic intake forms and eligibility questions.
 * Handles common banks, clickable chips, alias mapping, and Devanagari/English speech recognition.
 */
import { normalizeMarathiSpeech, isYesIntent, isNoIntent } from '../services/marathiVoiceMatcher';

// Clickable bank suggestion chips required by Sarkar Mitra
export const COMMON_BANKS = [
  'स्टेट बँक ऑफ इंडिया (SBI)',
  'बँक ऑफ महाराष्ट्र',
  'बँक ऑफ बडोदा',
  'पंजाब नॅशनल बँक',
  'कॅनरा बँक',
  'युनियन बँक ऑफ इंडिया',
  'इतर बँक'
];

// Bank linking question choices
export const BANK_LINKED_OPTIONS = [
  'होय',
  'नाही',
  'मला माहिती नाही'
];

// Spoken Prompts
export const BANK_STATUS_PROMPT = 'आपले बँक खाते आधार कार्डशी लिंक आहे का?';
export const BANK_NAME_PROMPT = 'आपले बँक खाते कोणत्या बँकेत लिंक आहे? कृपया बँकेचे नाव सांगा.';
export const OTHER_BANK_PROMPT = 'कृपया आपल्या बँकेचे नाव सांगा किंवा खाली टाईप करा.';

// Extended bank alias dictionary for Marathi and English speech matching
const BANK_ALIASES = [
  {
    canonical: 'स्टेट बँक ऑफ इंडिया (SBI)',
    patterns: [
      'स्टेट बँक ऑफ इंडिया', 'स्टेट बँक', 'एसबीआय', 'sbi', 'state bank of india',
      'state bank', 'स्टेट बैंक', 'एस बी आय', 'भारतीय स्टेट बँक', 'भारतीय स्टेट बँक ऑफ इंडिया'
    ]
  },
  {
    canonical: 'बँक ऑफ महाराष्ट्र',
    patterns: [
      'बँक ऑफ महाराष्ट्र', 'महाराष्ट्र बँक', 'bank of maharashtra', 'mah bank',
      'bom', 'बँक महाराष्ट्र', 'महा बँक', 'महाराष्ट्र बँक ऑफ'
    ]
  },
  {
    canonical: 'बँक ऑफ बडोदा',
    patterns: [
      'बँक ऑफ बडोदा', 'बडोदा बँक', 'bank of baroda', 'bob', 'बडोदा',
      'बँक ऑफ बरोडा', 'बरोडा बँक', 'बडोदा'
    ]
  },
  {
    canonical: 'पंजाब नॅशनल बँक',
    patterns: [
      'पंजाब नॅशनल बँक', 'पंजाब बँक', 'पीएनबी', 'pnb', 'punjab national bank',
      'पंजाब नॅशनल', 'पी एन बी'
    ]
  },
  {
    canonical: 'कॅनरा बँक',
    patterns: [
      'कॅनरा बँक', 'कॅनरा', 'canara bank', 'canara', 'केनेरा बँक', 'केनरा'
    ]
  },
  {
    canonical: 'युनियन बँक ऑफ इंडिया',
    patterns: [
      'युनियन बँक ऑफ इंडिया', 'युनियन बँक', 'union bank of india', 'union bank',
      'ubi', 'यु बी आय', 'युनियन'
    ]
  },
  {
    canonical: 'बँक ऑफ इंडिया',
    patterns: [
      'बँक ऑफ इंडिया', 'bank of india', 'boi', 'बीओआय', 'बी ओ आय', 'इंडिया बँक'
    ]
  },
  {
    canonical: 'सेंट्रल बँक ऑफ इंडिया',
    patterns: [
      'सेंट्रल बँक ऑफ इंडिया', 'सेंट्रल बँक', 'central bank of india', 'central bank', 'cbi'
    ]
  },
  {
    canonical: 'एचडीएफसी बँक (HDFC)',
    patterns: [
      'एचडीएफसी बँक', 'एचडीएफसी', 'hdfc bank', 'hdfc', 'एच डी एफ सी'
    ]
  },
  {
    canonical: 'आयसीआयसीआय बँक (ICICI)',
    patterns: [
      'आयसीआयसीआय बँक', 'आयसीआयसीआय', 'icici bank', 'icici', 'आय सी आय सी आय'
    ]
  },
  {
    canonical: 'अ‍ॅक्सिस बँक',
    patterns: [
      'अ‍ॅक्सिस बँक', 'अॅक्सिस बँक', 'axis bank', 'axis', 'एक्सिस बँक', 'एक्सिस'
    ]
  },
  {
    canonical: 'जिल्हा मध्यवर्ती सहकारी बँक (DCCB)',
    patterns: [
      'जिल्हा मध्यवर्ती सहकारी बँक', 'जिल्हा मध्यवर्ती बँक', 'जिल्हा बँक',
      'dcc bank', 'dccb', 'district central bank', 'जिल्हा सहकारी बँक'
    ]
  },
  {
    canonical: 'आयडीबीआय बँक (IDBI)',
    patterns: [
      'आयडीबीआय बँक', 'आयडीबीआय', 'idbi bank', 'idbi', 'आय डी बी आय'
    ]
  },
  {
    canonical: 'इंडियन बँक',
    patterns: [
      'इंडियन बँक', 'indian bank'
    ]
  },
  {
    canonical: 'युको बँक',
    patterns: [
      'युको बँक', 'uco bank', 'uco'
    ]
  },
  {
    canonical: 'कोटक महिंद्रा बँक',
    patterns: [
      'कोटक महिंद्रा बँक', 'कोटक बँक', 'kotak bank', 'kotak mahindra bank', 'kotak'
    ]
  },
  {
    canonical: 'इंडसइंड बँक',
    patterns: [
      'इंडसइंड बँक', 'indusind bank', 'indusind'
    ]
  },
  {
    canonical: 'इतर बँक',
    patterns: [
      'इतर बँक', 'इतर', 'दुसरी बँक', 'other bank', 'other', 'वेगळी बँक', 'दुसऱ्या बँकेत'
    ]
  }
];

/**
 * Recognize user's response to: "आपले बँक खाते आधार कार्डशी लिंक आहे का?"
 * Returns 'होय' | 'नाही' | 'मला माहिती नाही' | null
 */
export function parseBankLinkStatus(speech) {
  if (!speech || typeof speech !== 'string') return null;
  const raw = speech.trim();
  const norm = normalizeMarathiSpeech(raw).toLowerCase();

  // 1. Unknown / Don't know
  if (
    norm.includes('माहिती नाही') || 
    norm.includes('माहित नाही') || 
    norm.includes('कळत नाही') || 
    norm.includes('मला माहित') ||
    norm.includes('सांगता येत नाही') ||
    norm.includes("don't know") || 
    norm.includes('dont know') || 
    norm.includes('not sure') || 
    norm.includes('unknown')
  ) {
    return 'मला माहिती नाही';
  }

  // 2. Negative / Not linked
  if (
    norm.includes('नाही लिंक') || 
    norm.includes('लिंक नाही') || 
    norm.includes('केलेले नाही') || 
    norm.includes('नाही केले') ||
    isNoIntent(raw)
  ) {
    return 'नाही';
  }

  // 3. Affirmative / Linked
  if (
    norm.includes('लिंक आहे') || 
    norm.includes('होय लिंक') || 
    norm.includes('सीडेड आहे') || 
    norm.includes('सीडिंग झाले') ||
    norm.includes('आधार लिंक') ||
    isYesIntent(raw)
  ) {
    return 'होय';
  }

  // If the user already named a bank directly (e.g., "माझे स्टेट बँकेत लिंक आहे"), that implies yes!
  for (const entry of BANK_ALIASES) {
    for (const pat of entry.patterns) {
      if (norm.includes(pat.toLowerCase())) {
        return 'होय';
      }
    }
  }

  return null;
}

/**
 * Match spoken text to a recognized bank name.
 * Returns canonical bank name or cleaned bank string, or null if no bank match.
 */
export function matchBankName(speech) {
  if (!speech || typeof speech !== 'string') return null;
  const raw = speech.trim();
  const norm = normalizeMarathiSpeech(raw).toLowerCase();

  // Test against aliases
  for (const entry of BANK_ALIASES) {
    for (const pat of entry.patterns) {
      const p = pat.toLowerCase();
      // Match exact or substring
      if (norm === p || norm.includes(p)) {
        return entry.canonical;
      }
    }
  }

  // If speech explicitly mentions any bank ("... बँक ...")
  // Extract and clean up Marathi conversational prefix/suffix
  if (norm.includes('बँक') || norm.includes('bank')) {
    let cleaned = raw
      .replace(/माझे\s*(बँक)?\s*खाते/gi, '')
      .replace(/माझं\s*(बँक)?\s*खाते/gi, '')
      .replace(/आमचे\s*(बँक)?\s*खाते/gi, '')
      .replace(/मध्ये\s*आहे/gi, '')
      .replace(/मध्ये\s*लिंक\s*आहे/gi, '')
      .replace(/मध्ये\s*अकाउंट\s*आहे/gi, '')
      .replace(/त\s*आहे/gi, '')
      .replace(/लिंक\s*आहे/gi, '')
      .replace(/आहे/gi, '')
      .trim();

    if (cleaned.length >= 3) {
      return cleaned;
    }
  }

  return null;
}
