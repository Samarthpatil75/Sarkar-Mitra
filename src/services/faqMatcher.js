/**
 * Sarkar Mitra - Offline Government Scheme FAQ Matcher & Q&A Engine
 * 
 * 100% Client-side, Rule-based, Offline Marathi Natural Language Processing.
 * No LLM, No External Server Calls, Privacy First.
 * 
 * Answers ONLY questions about the schemes in schemes.json.
 */

import schemesData from '../data/schemes.json' with { type: 'json' };
import { normalizeMarathiSpeech } from './marathiVoiceMatcher.js';

// Session memory store for unanswered / low-confidence questions
const sessionUnansweredQuestions = [];

/**
 * Log an unanswered or low-confidence query into session memory
 */
export function logUnansweredQuery(query, detectedSchemeId = null, score = 0, reason = 'low_confidence') {
  const entry = {
    id: `uq_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toLocaleString('mr-IN', { timeZone: 'Asia/Kolkata' }),
    isoTime: new Date().toISOString(),
    query: query.trim(),
    detectedSchemeId: detectedSchemeId || 'none',
    score: Number(score.toFixed(2)),
    reason
  };
  sessionUnansweredQuestions.unshift(entry);
  return entry;
}

/**
 * Get all unanswered queries logged in current session
 */
export function getSessionUnansweredQueries() {
  return [...sessionUnansweredQuestions];
}

/**
 * Clear session unanswered queries
 */
export function clearSessionUnansweredQueries() {
  sessionUnansweredQuestions.length = 0;
}

/**
 * Export session unanswered questions as CSV file
 */
export function exportUnansweredQueriesCSV() {
  const headers = ['ID', 'दिनांक व वेळ', 'विचारलेला प्रश्न', 'ओळखलेली योजना', 'मॅच स्कोअर', 'कारण'];
  const rows = sessionUnansweredQuestions.map(q => [
    q.id,
    `"${q.timestamp}"`,
    `"${(q.query || '').replace(/"/g, '""')}"`,
    `"${q.detectedSchemeId}"`,
    q.score,
    `"${q.reason}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `sarkar_mitra_unanswered_questions_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// 1. PII GUARD (Privacy Protection)
// ============================================================================

/**
 * Detects sensitive personal identification data (Aadhaar, OTP, Bank, Phone)
 * to ensure Sarkar Mitra NEVER asks for or stores sensitive data.
 */
export function detectPII(text) {
  if (!text) return null;
  const raw = text.trim();

  // 12-digit Aadhaar Number pattern (any 12 digits, grouped 4-4-4 or contiguous)
  const aadhaarRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/;
  const cleanDigits = raw.replace(/\D/g, '');
  if (aadhaarRegex.test(raw) || cleanDigits.length === 12 || (raw.includes('आधार') && cleanDigits.length >= 8)) {
    return {
      type: 'AADHAAR',
      warning: '⚠️ सुरक्षा सूचना: कृपया आधार क्रमांक चॅटमध्ये टाकू नका. सरकार मित्र तुमचा आधार क्रमांक कधीही विचारत नाही व साठवत नाही.'
    };
  }

  // 4 to 6 digit OTP / PIN pattern
  const otpRegex = /\b(otp|ओटीपी|pin|पिन)\s*[:=-]?\s*\d{4,6}\b/i;
  const otpNumericRegex = /\b\d{6}\b/;
  if (otpRegex.test(raw) || (raw.toLowerCase().includes('otp') && otpNumericRegex.test(raw))) {
    return {
      type: 'OTP',
      warning: '⚠️ सुरक्षा सूचना: कृपया कोणताही OTP किंवा गुप्त पिन चॅटमध्ये टाकू नका. सरकार मित्र कधीही पासवर्ड किंवा OTP मागत नाही.'
    };
  }

  // Bank account number pattern (9 to 18 digits)
  const bankAccountRegex = /\b(bank|account|खाते|खाता|बँक)\b.*\b\d{9,18}\b/i;
  if (bankAccountRegex.test(raw)) {
    return {
      type: 'BANK_ACCOUNT',
      warning: '⚠️ सुरक्षा सूचना: कृपया तुमचा पूर्ण बँक खाते क्रमांक चॅटमध्ये टाकू नका. सरकार मित्र वैयक्तिक बँक माहिती साठवत नाही.'
    };
  }

  // Standalone 10-digit mobile number in chat
  const phoneRegex = /\b[6-9]\d{9}\b/;
  if (phoneRegex.test(raw) && !raw.toLowerCase().includes('help') && !raw.toLowerCase().includes('number')) {
    return {
      type: 'PHONE_NUMBER',
      warning: '⚠️ सुरक्षा सूचना: कृपया तुमचा वैयक्तिक फोन नंबर चॅटमध्ये टाकू नका. तुम्ही थेट योजनेविषयी प्रश्न विचारू शकता.'
    };
  }

  return null;
}

// ============================================================================
// 2. ROMANIZED MARATHI / ENGLISH TRANSLITERATION & SYNONYMS
// ============================================================================

const ROMAN_TO_MARATHI_KEYWORDS = {
  // Scheme names
  'pm': 'पीएम',
  'ladki': 'लाडकी',
  'bahin': 'बहीण',
  'bahini': 'बहीण',
  'majhi': 'माझी',
  'kisan': 'किसान',
  'shetkari': 'शेतकरी',
  'namo': 'नमो',
  'ayushman': 'आयुष्यमान',
  'aayushman': 'आयुष्यमान',
  'bharat': 'भारत',
  'mjpjay': 'mjpjay',
  'ration': 'रेशन',
  'card': 'कार्ड',
  'rashan': 'रेशन',
  // Actions & Topics
  'paise': 'पैसे',
  'paisa': 'पैसे',
  'pesa': 'पैसे',
  'kiti': 'किती',
  'milatat': 'मिळतात',
  'milto': 'मिळतो',
  'milte': 'मिळते',
  'milnar': 'मिळणार',
  'miltat': 'मिळतात',
  'kadhi': 'कधी',
  'yetat': 'येतात',
  'yenar': 'येणार',
  'aale': 'आले',
  'sathi': 'साठी',
  'kagadpatre': 'कागदपत्रे',
  'kagad': 'कागदपत्रे',
  'kagadpatra': 'कागदपत्रे',
  'documents': 'कागदपत्रे',
  'document': 'कागदपत्रे',
  'papers': 'कागदपत्रे',
  'konti': 'कोणती',
  'konte': 'कोणते',
  'konta': 'कोणता',
  'kasa': 'कसा',
  'kashi': 'कशी',
  'kashe': 'कसे',
  'baghaycha': 'पाहायची',
  'pahaycha': 'पाहायची',
  'tapasaycha': 'तपासायचे',
  'check': 'तपासा',
  'status': 'स्थिती',
  'araj': 'अर्ज',
  'arja': 'अर्ज',
  'form': 'अर्ज',
  'apply': 'अर्ज',
  'application': 'अर्ज',
  'kuthe': 'कुठे',
  'karaycha': 'करायचा',
  'karava': 'करायचा',
  'karu': 'करू',
  'nakarla': 'नाकारला',
  'reject': 'नाकारला',
  'rejected': 'नाकारला',
  'namanjur': 'नाकारला',
  'aata': 'आता',
  'ata': 'आता',
  'kay': 'काय',
  'aajar': 'आजार',
  'ajar': 'आजार',
  'diseases': 'आजार',
  'disease': 'आजार',
  'madhye': 'मध्ये',
  'madhe': 'मध्ये',
  'aani': 'आणि',
  'ani': 'आणि',
  'and': 'आणि',
  'patra': 'पात्र',
  'eligible': 'पात्र',
  'eligibility': 'पात्रता',
  'apatra': 'अपात्र',
  'ineligible': 'अपात्र',
  'dhanya': 'धान्य',
  'upchar': 'उपचार',
  'treatment': 'उपचार',
  'hospital': 'रुग्णालय',
  'dawa': 'औषध',
  'operation': 'शस्त्रक्रिया',
  'helpline': 'हेल्पलाइन',
  'contact': 'संपर्क',
  'number': 'नंबर',
  'takrar': 'तक्रार',
  'antim': 'अंतिम',
  'shevat': 'अंतिम',
  'tarikh': 'तारीख',
  'date': 'तारीख',
  'mudat': 'मुदत',
  'deadline': 'अंतिम तारीख',
  'hawaman': 'हवामान',
  'weather': 'हवामान',
  'vima': 'विमा',
  'pik': 'पीक'
};

// Synonym mapping to broaden matching
const SYNONYM_EXPANSIONS = {
  'लाभ': ['पैसे', 'हप्ता', 'रक्कम', 'अनुदान', 'मदत', 'दरमहा', 'किती'],
  'पैसे': ['लाभ', 'हप्ता', 'रक्कम', 'पैसे किती', 'जमा', 'dbt'],
  'हप्ता': ['पैसे', 'लाभ', 'रक्कम', 'किस्त'],
  'अर्ज': ['फॉर्म', 'नोंदणी', 'पद्धत', 'अर्ज कसा', 'कुठे करावा', 'application'],
  'फॉर्म': ['अर्ज', 'नोंदणी', 'कसा भरायचा'],
  'कागदपत्रे': ['कागद', 'दाखले', 'पुरावे', 'डॉक्युमेंट', 'यादी'],
  'स्थिती': ['स्टेटस', 'मंजूर', 'झाला का', 'तपासा', 'पेंडिंग'],
  'नाकारला': ['रिजेक्ट', 'नामंजूर', 'अपात्र', 'दुरुस्ती', 'त्रुटी'],
  'मिळाले नाहीत': ['आले नाहीत', 'पैसे आले नाहीत', 'हप्ता आला नाही', 'जमा झाले नाहीत'],
  'पात्र': ['पात्रता', 'निकष', 'अटी', 'नियम', 'कोणाला मिळते', 'कोण पात्र'],
  'अपात्र': ['मिळत नाही', 'कोणाला नाही', 'बाहेर', 'चारचाकी', 'नोकरदार'],
  'आजार': ['उपचार', 'शस्त्रक्रिया', 'ऑपरेशन', 'दवाखाना', 'कॅन्सर', 'हार्ट', 'हॉस्पिटल'],
  'हेल्पलाइन': ['संपर्क', 'फोन नंबर', 'टोल फ्री', 'तक्रार', 'कॉल'],
  'अंतिम तारीख': ['शेवटची तारीख', 'मुदत', 'कधीपर्यंत']
};

/**
 * Normalizes input text and converts Roman-script Marathi into Devanagari keywords
 */
export function normalizeQuery(rawText) {
  if (!rawText) return '';
  let str = normalizeMarathiSpeech(rawText);

  // Split into words and map Roman words to Devanagari
  const words = str.split(/\s+/);
  const mappedWords = words.map(w => ROMAN_TO_MARATHI_KEYWORDS[w] || w);
  return mappedWords.join(' ');
}

// ============================================================================
// 3. SPECIAL INTENT HANDLERS (Small Talk, Off-Topic, Uncovered Schemes)
// ============================================================================

// Friendly Greetings
const GREETING_KEYWORDS = [
  'नमस्कार', 'राम राम', 'जय महाराष्ट्र', 'हॅलो', 'हाय', 'प्रणाम', 'hello', 'hi', 'hey', 'namaskar'
];

// Gratitude & Goodbye
const THANKS_KEYWORDS = [
  'धन्यवाद', 'आभार', 'थँक्यू', 'मस्त', 'छान माहिती', 'खूप छान', 'thank you', 'thanks', 'thx'
];
const GOODBYE_KEYWORDS = [
  'बाय', 'पुन्हा भेटू', 'जातो', 'जाते', 'टाटा', 'bye', 'goodbye', 'see you'
];

// Non-scheme / Off-topic domain indicators (weather, jokes, sports, politics, etc.)
const OFF_TOPIC_KEYWORDS = [
  'हवामान', 'पाऊस', 'तापमान', 'हवा कशी', 'क्रिकेट', 'मॅच', 'स्कोअर', 'राजकारण', 'निवडणूक',
  'जोक', 'विनोद', 'गाणे', 'गाणी', 'सिनेमा', 'चित्रपट', 'नायक', 'नायिका', 'जेवण', 'रेसिपी',
  'तुझा रंग', 'तू कोण', 'प्रेम', 'लग्न', 'कविता', 'शायरी',
  'weather', 'rain', 'cricket', 'score', 'joke', 'song', 'movie', 'politics', 'election', 'recipe'
];

// Other government schemes not covered in Sarkar Mitra
const UNCOVERED_SCHEMES = [
  { name: 'पीक विमा योजना (Crop Insurance)', keywords: ['पीक विमा', 'पिक विमा', 'pik vima', 'crop insurance', 'विमा'] },
  { name: 'सुकन्या समृद्धी योजना', keywords: ['सुकन्या', 'sukanya', 'sukanya samriddhi'] },
  { name: 'संजय गांधी निराधार योजना', keywords: ['संजय गांधी', 'निराधार', 'sanjay gandhi', 'niradhar'] },
  { name: 'पंतप्रधान मुद्रा लोन योजना', keywords: ['मुद्रा', 'मुद्रा लोन', 'mudra', 'mudra loan'] },
  { name: 'लाडका भाऊ योजना (विद्यार्थी मानधन)', keywords: ['लाडका भाऊ', 'ladka bhau'] },
  { name: 'श्रावण बाळ योजना', keywords: ['श्रावण बाळ', 'shravan bal'] },
  { name: 'पंतप्रधान आवास योजना (घरकुल)', keywords: ['आवास योजना', 'घरकुल', 'awas yojana', 'gharkul', 'pm awas'] }
];

// ============================================================================
// 4. SCHEME DETECTION ENGINE
// ============================================================================

const SCHEME_TRIGGERS = {
  'ladki-bahin': [
    'लाडकी बहीण', 'लाडकी बहिण', 'लाडकी बहिणी', 'बहीण योजना', 'बहिण योजना', 'माझी लाडकी',
    'लाडकी', 'बहीण', 'बहिण', 'ladki bahin', 'ladki', 'bahin', 'mahila yojana', '१५००', '1500'
  ],
  'pm-kisan': [
    'पीएम किसान', 'किसान सन्मान', 'शेतकरी योजना', 'शेतकरी हप्ता', 'नमो शेतकरी', 'पंतप्रधान किसान',
    'पीएम', 'किसान', 'pm किसान', 'pm kisan', 'pmkisan', 'kisan', 'shetkari'
  ],
  'ayushman-mjpjay': [
    'आयुष्यमान', 'आयुष्मान', 'जन आरोग्य', 'महात्मा जोतीराव फुले', 'महात्मा फुले',
    'mjpjay', 'दवाखाना', 'हॉस्पिटल', 'पाच लाख', 'उपचार', 'आरोग्य योजना',
    'ayushman', 'aarogya', 'hospital', 'आजार', 'शस्त्रक्रिया'
  ],
  'ration-card': [
    'रेशन कार्ड', 'रेशनकार्ड', 'अन्नधान्य', 'रास्त भाव', 'रेशन', 'अंत्योदय', 'प्राधान्य कुटुंब',
    'रेशन दुकान', 'धान्य', 'ration card', 'rationcard', 'ration', 'rashan'
  ]
};

/**
 * Detects which scheme the user is asking about
 */
export function detectSchemeFromText(normText, activeScheme = null) {
  // 1. Direct keywords match
  for (const [schemeId, triggers] of Object.entries(SCHEME_TRIGGERS)) {
    if (triggers.some(t => normText.includes(t))) {
      return schemesData.schemes.find(s => s.id === schemeId) || null;
    }
  }

  // 2. Contextual indicators (e.g., "आणि अर्ज कुठे करायचा?", "आणि कागदपत्रे?", "या योजनेचा")
  const contextIndicators = ['आणि', 'याचे', 'यात', 'या योजनेचे', 'या योजनेचा', 'या योजनेत', 'आता', 'and', 'this'];
  const hasContextWords = contextIndicators.some(w => normText.startsWith(w + ' ') || normText.includes(' ' + w + ' '));

  if ((hasContextWords || normText.length < 25) && activeScheme) {
    return activeScheme;
  }

  // Fallback to active scheme if user asks a general follow-up question
  return activeScheme || null;
}

// ============================================================================
// 5. CORE FAQ MATCHER & SCORING ALGORITHM
// ============================================================================

/**
 * Calculates a match score (0.0 to 1.0) between query text and a specific FAQ entry
 */
function scoreFAQ(queryText, faq) {
  let score = 0;
  const qNorm = queryText.toLowerCase();

  // 1. Exact match on question variants (weight: 1.0)
  for (const q of faq.questions_mr || []) {
    const qClean = normalizeMarathiSpeech(q);
    if (qNorm === qClean) return 1.0;
    if (qNorm.includes(qClean) || qClean.includes(qNorm)) score = Math.max(score, 0.85);
  }
  for (const q of faq.questions_roman || []) {
    const qClean = normalizeQuery(q);
    if (qNorm === qClean) return 1.0;
    if (qNorm.includes(qClean) || qClean.includes(qNorm)) score = Math.max(score, 0.80);
  }

  // 2. Keyword exact and token matches
  let matchedKeywordCount = 0;
  const keywords = faq.keywords || [];
  for (const kw of keywords) {
    const kwNorm = normalizeQuery(kw);
    if (qNorm.includes(kwNorm)) {
      matchedKeywordCount++;
      // Distinctive high-value keywords boost score
      if (['पैसे किती', 'कागदपत्रे', 'अर्ज कसा', 'स्थिती', 'नाकारला', 'पैसे मिळाले नाहीत', 'हेल्पलाइन', 'अंतिम तारीख', 'कोणते आजार'].includes(kwNorm)) {
        score += 0.35;
      } else {
        score += 0.15;
      }
    }
  }

  // 3. Synonym expansion check
  for (const [canonical, syns] of Object.entries(SYNONYM_EXPANSIONS)) {
    if (keywords.some(k => k.includes(canonical)) || faq.topic.includes(canonical)) {
      if (syns.some(s => qNorm.includes(s))) {
        score += 0.20;
      }
    }
  }

  // 4. Topic exact phrase in query
  if (qNorm.includes(faq.topic.toLowerCase())) {
    score += 0.40;
  }

  // Keyword density bonus
  if (keywords.length > 0) {
    const ratio = matchedKeywordCount / keywords.length;
    score += ratio * 0.25;
  }

  return Math.min(score, 0.99);
}

/**
 * Main Answer Engine: Answers user query strictly from schemes.json FAQs
 */
export function answerQuestion(userText, activeScheme = null) {
  if (!userText || !userText.trim()) {
    return {
      type: 'EMPTY',
      reply_mr: 'कृपया तुमची शंका बोला किंवा टाईप करा.',
      scheme: activeScheme
    };
  }

  const raw = userText.trim();

  // 1. Check for PII (Aadhaar, OTP, Bank, Phone)
  const pii = detectPII(raw);
  if (pii) {
    return {
      type: 'PII_WARNING',
      reply_mr: pii.warning,
      isPrivacyWarning: true,
      scheme: activeScheme
    };
  }

  const norm = normalizeQuery(raw);

  // 2. Check for Greetings
  if (GREETING_KEYWORDS.some(kw => norm === kw || norm.startsWith(kw + ' ') || norm.endsWith(' ' + kw))) {
    return {
      type: 'GREETING',
      reply_mr: 'नमस्कार! मी सरकार मित्र. मी तुम्हाला लाडकी बहीण, पीएम किसान, आयुष्यमान भारत किंवा रेशन कार्ड या शासकीय योजनांबद्दल अचूक माहिती देऊ शकतो. तुम्हाला कोणत्या योजनेबद्दल माहिती हवी आहे?',
      options: [
        { label_mr: '🌸 लाडकी बहीण योजना', query: 'लाडकी बहीण योजना काय आहे?' },
        { label_mr: '🌾 पीएम किसान योजना', query: 'पीएम किसान योजना काय आहे?' },
        { label_mr: '🏥 आयुष्यमान भारत (MJPJAY)', query: 'आयुष्यमान भारत योजना काय आहे?' },
        { label_mr: '🍚 रेशन कार्ड अन्न सुरक्षा', query: 'रेशन कार्ड योजना काय आहे?' }
      ],
      scheme: activeScheme
    };
  }

  // 3. Check for Thanks & Goodbye
  if (THANKS_KEYWORDS.some(kw => norm.includes(kw))) {
    return {
      type: 'THANKS',
      reply_mr: 'आपले मनःपूर्वक स्वागत आहे! आणखी कोणत्याही योजनेबद्दल माहिती हवी असल्यास नक्की विचारा.',
      scheme: activeScheme
    };
  }
  if (GOODBYE_KEYWORDS.some(kw => norm.includes(kw))) {
    return {
      type: 'GOODBYE',
      reply_mr: 'धन्यवाद! पुन्हा भेटा. जय महाराष्ट्र!',
      scheme: activeScheme
    };
  }

  // 4. Check for Uncovered Government Schemes
  for (const uncovered of UNCOVERED_SCHEMES) {
    if (uncovered.keywords.some(k => norm.includes(k))) {
      logUnansweredQuery(raw, null, 0.1, `uncovered_scheme_${uncovered.name}`);
      return {
        type: 'UNCOVERED_SCHEME',
        reply_mr: `माझ्याकडे सध्या फक्त ४ प्रमुख शासकीय योजनांची अधिकृत माहिती उपलब्ध आहे:\n१. मुख्यमंत्री माझी लाडकी बहीण योजना\n२. पीएम किसान सन्मान निधी\n३. आयुष्यमान भारत - MJPJAY (मोफत आरोग्य उपचार)\n४. महाराष्ट्र रेशन कार्ड अन्न सुरक्षा\n\n${uncovered.name} किंवा इतर योजनांची माहिती मिळवण्यासाठी कृपया अधिकृत शासकीय पोर्टल (उदा. mahadbt.maharashtra.gov.in) ला भेट द्या.`,
        options: [
          { label_mr: '🌸 लाडकी बहीण योजना', query: 'लाडकी बहीण योजना काय आहे?' },
          { label_mr: '🌾 पीएम किसान योजना', query: 'पीएम किसान योजना काय आहे?' },
          { label_mr: '🏥 आयुष्यमान भारत (MJPJAY)', query: 'आयुष्यमान भारत योजना काय आहे?' },
          { label_mr: '🍚 रेशन कार्ड अन्न सुरक्षा', query: 'रेशन कार्ड योजना काय आहे?' }
        ],
        scheme: activeScheme
      };
    }
  }

  // 5. Check for Off-topic / Non-scheme inquiries (Weather, jokes, personal, etc.)
  const isOffTopic = OFF_TOPIC_KEYWORDS.some(kw => norm.includes(kw));
  if (isOffTopic) {
    logUnansweredQuery(raw, null, 0.05, 'off_topic');
    return {
      type: 'OFF_TOPIC',
      reply_mr: 'मी फक्त शासकीय योजनांबद्दल माहिती देऊ शकतो. तुम्ही कोणत्या योजनेबद्दल विचारू इच्छिता?',
      options: [
        { label_mr: '🌸 लाडकी बहीण योजना', query: 'लाडकी बहीण योजना काय आहे?' },
        { label_mr: '🌾 पीएम किसान योजना', query: 'पीएम किसान योजना काय आहे?' },
        { label_mr: '🏥 आयुष्यमान भारत (MJPJAY)', query: 'आयुष्यमान भारत योजना काय आहे?' },
        { label_mr: '🍚 रेशन कार्ड अन्न सुरक्षा', query: 'रेशन कार्ड योजना काय आहे?' }
      ],
      scheme: activeScheme
    };
  }

  // 6. Detect Scheme
  const detectedScheme = detectSchemeFromText(norm, activeScheme);

  // If scheme is completely unclear, ask user which scheme
  if (!detectedScheme) {
    logUnansweredQuery(raw, null, 0.15, 'scheme_unclear');
    return {
      type: 'SCHEME_UNCLEAR',
      reply_mr: 'कोणत्या योजनेबद्दल विचारायचे आहे? खालीलपैकी योग्य योजना निवडा:',
      options: [
        { label_mr: '🌸 लाडकी बहीण योजना', query: `${raw} लाडकी बहीण` },
        { label_mr: '🌾 पीएम किसान योजना', query: `${raw} पीएम किसान` },
        { label_mr: '🏥 आयुष्यमान भारत (MJPJAY)', query: `${raw} आयुष्यमान भारत` },
        { label_mr: '🍚 रेशन कार्ड अन्न सुरक्षा', query: `${raw} रेशन कार्ड` }
      ],
      scheme: null
    };
  }

  // 7. Match FAQs within detected scheme
  const faqs = detectedScheme.faqs || [];
  const scoredFaqs = faqs.map(faq => ({
    faq,
    score: scoreFAQ(norm, faq)
  })).sort((a, b) => b.score - a.score);

  const topMatch = scoredFaqs[0];
  const secondMatch = scoredFaqs[1];

  // 8. If close scoring match between two answers -> Disambiguate
  if (
    topMatch &&
    secondMatch &&
    topMatch.score >= 0.35 &&
    secondMatch.score >= 0.30 &&
    (topMatch.score - secondMatch.score) < 0.12 &&
    topMatch.faq.topic_key !== secondMatch.faq.topic_key
  ) {
    return {
      type: 'DISAMBIGUATION',
      reply_mr: 'तुम्हाला हे विचारायचे आहे का? खालीलपैकी योग्य पर्याय निवडा:',
      scheme: detectedScheme,
      options: [
        { label_mr: `${topMatch.faq.topic} (${detectedScheme.name_mr})`, query: topMatch.faq.questions_mr[0] },
        { label_mr: `${secondMatch.faq.topic} (${detectedScheme.name_mr})`, query: secondMatch.faq.questions_mr[0] }
      ]
    };
  }

  // 9. Good Match found (score >= 0.28)
  if (topMatch && topMatch.score >= 0.28) {
    const faq = topMatch.faq;

    // Build 2-3 contextual follow-up chips
    const followUps = [];
    if (faq.topic_key !== 'documents') {
      followUps.push({ label_mr: 'कागदपत्रे कोणती लागतील?', query: `${detectedScheme.name_mr} कागदपत्रे` });
    }
    if (faq.topic_key !== 'apply') {
      followUps.push({ label_mr: 'अर्ज कुठे करायचा?', query: `${detectedScheme.name_mr} अर्ज कुठे करायचा?` });
    }
    if (faq.topic_key !== 'eligible') {
      followUps.push({ label_mr: 'पात्रता काय आहे?', query: `${detectedScheme.name_mr} पात्रता काय आहे?` });
    }
    if (faq.topic_key !== 'status') {
      followUps.push({ label_mr: 'अर्जाची स्थिती कशी पाहावी?', query: `${detectedScheme.name_mr} अर्जाची स्थिती` });
    }

    const response = {
      type: 'FAQ_ANSWER',
      reply_mr: faq.answer_mr,
      faq_id: faq.id,
      topic: faq.topic,
      topic_key: faq.topic_key,
      scheme: detectedScheme,
      source_gr: faq.source_gr,
      last_verified: faq.last_verified,
      verified: faq.verified,
      link: detectedScheme.official_link,
      link_text: 'अधिकृत संकेतस्थळ उघडा',
      follow_ups: followUps.slice(0, 3),
      score: topMatch.score
    };

    // If question was about eligibility, add interactive action button for rule-based wizard
    if (faq.topic_key === 'eligible') {
      response.hasEligibilityAction = true;
      response.action_label_mr = 'माझी पात्रता तपासा';
      response.action_screen = 'eligibility';
    }

    return response;
  }

  // 10. Fallback: No good match in FAQ data
  logUnansweredQuery(raw, detectedScheme.id, topMatch ? topMatch.score : 0, 'no_faq_match');

  return {
    type: 'NO_MATCH',
    reply_mr: 'याबद्दल माझ्याकडे माहिती नाही. कृपया अधिकृत संकेतस्थळ पाहा.',
    scheme: detectedScheme,
    link: detectedScheme.official_link,
    link_text: `${detectedScheme.name_mr} अधिकृत पोर्टल`,
    options: [
      { label_mr: 'कागदपत्रे यादी', query: `${detectedScheme.name_mr} कागदपत्रे` },
      { label_mr: 'अर्ज कसा करावा', query: `${detectedScheme.name_mr} अर्ज कसा करायचा?` },
      { label_mr: 'माझी पात्रता तपासा', query: `${detectedScheme.name_mr} पात्रता` }
    ]
  };
}

export default {
  answerQuestion,
  detectSchemeFromText,
  detectPII,
  logUnansweredQuery,
  getSessionUnansweredQueries,
  clearSessionUnansweredQueries,
  exportUnansweredQueriesCSV
};
