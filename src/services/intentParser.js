/**
 * Bolu Ya - Marathi Conversational Intent Parser & NLP Engine
 * 
 * Rule-based natural language understanding tuned for spoken Marathi and code-mixed Marathi/English.
 * 
 * ============================================================================
 * PLUG-IN ARCHITECTURE FOR LLM / RAG:
 * To swap or augment this rule-based engine with an LLM (e.g., Gemini / GPT-4 / Bhashini):
 * 1. Implement async queryLLM(userPrompt, conversationHistory, schemeContext)
 * 2. If rule-based confidence is low or query is complex, delegate to:
 *    const response = await fetch("https://your-backend-api.com/chat", {
 *      method: "POST",
 *      headers: { "Content-Type": "application/json" },
 *      body: JSON.stringify({ prompt: userPrompt, lang: "mr", schemes: schemesData })
 *    });
 * ============================================================================
 */

import schemesData from '../data/schemes.json';

// Scheme aliases and keywords (both Marathi Devanagari and Latin/Romanized)
const SCHEME_KEYWORDS = {
  'ladki-bahin': [
    'लाडकी बहीण', 'लाडकी बहिण', 'लाडकी बहिणी', 'बहीण योजना', 'बहिण योजना', 'माझी लाडकी',
    'ladki bahin', 'ladki bahin yojana', 'ladki', 'bahin', 'mahila yojana', '१५००', '1500'
  ],
  'pm-kisan': [
    'पीएम किसान', 'किसान सन्मान', 'शेतकरी योजना', 'शेतकरी हप्ता', 'नमो शेतकरी', 'पंतप्रधान किसान',
    'pm kisan', 'pmkisan', 'kisan samman', 'shetkari', 'kisan'
  ],
  'ayushman-mjpjay': [
    'आयुष्यमान', 'आयुष्मान', 'जन आरोग्य', 'महात्मा जोतीराव फुले', 'महात्मा फुले जन आरोग्य',
    'mjpjay', 'mjpjay yojana', 'दवाखाना', 'हॉस्पिटल', 'पाच लाख', 'उपचार', 'आरोग्य योजना',
    'ayushman', 'ayushman bharat', 'hospital', 'aarogya'
  ],
  'ration-card': [
    'रेशन कार्ड', 'रेशनकार्ड', 'अन्नधान्य', 'रास्त भाव', 'रेशन', 'अंत्योदय', 'प्राधान्य कुटुंब',
    'पिवळे रेशन', 'केशरी रेशन', 'पांढरे रेशन',
    'ration card', 'ration', 'rationcard', 'grain'
  ]
};

// Intent triggers
const INTENT_PATTERNS = {
  ELIGIBILITY: [
    'पात्र', 'पात्रता', 'निकष', 'पात्र आहे का', 'मिळेल का', 'लाभ मिळेल का', 'पात्रता तपासा',
    'eligibility', 'eligible', 'check eligibility', 'qualify', 'patra'
  ],
  DOCUMENTS: [
    'कागदपत्रे', 'कागदपत्र', 'कागद', 'दाखले', 'काय लागेल', 'कागदपत्रे कोणती', 'डॉक्युमेंट',
    'documents', 'document', 'doc', 'papers', 'kagadpatre'
  ],
  APPLY: [
    'अर्ज', 'फॉर्म', 'कसा भरायचा', 'नोंदणी', 'कसा करायचा', 'अर्जाची पद्धत', 'फॉर्म भरा',
    'apply', 'application', 'form', 'register', 'how to apply', 'online form'
  ],
  STATUS: [
    'स्टेटस', 'स्थिती', 'अर्जाची स्थिती', 'हप्ता आला का', 'पैसे आले का', 'कधी येणार',
    'status', 'check status', 'application status', 'installment'
  ],
  REPEAT: [
    'पुन्हा सांगा', 'पुन्हा बोला', 'डबल सांगा', 'समजले नाही', 'काय म्हणालात', 'परत सांगा',
    'repeat', 'again', 'once more', 'purna sanga'
  ],
  BACK: [
    'मागे जा', 'मागे', 'परत जा', 'मुख्य पान', 'होम',
    'back', 'go back', 'home', 'main menu'
  ],
  GREETING: [
    'नमस्कार', 'राम राम', 'जय महाराष्ट्र', 'हॅलो', 'हाय', 'प्रणाम',
    'hello', 'hi', 'namaskar', 'hey'
  ],
  HELP: [
    'मदत', 'साहाय्य', 'काय करू शकतोस', 'कसे वापरायचे',
    'help', 'madat'
  ]
};

/**
 * Clean & normalize input string
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[?,.!:;"'।॥]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect scheme mentioned in speech
 */
export function detectScheme(text, currentSchemeId = null) {
  const norm = normalizeText(text);

  for (const [schemeId, keywords] of Object.entries(SCHEME_KEYWORDS)) {
    if (keywords.some(kw => norm.includes(kw))) {
      return schemesData.schemes.find(s => s.id === schemeId);
    }
  }

  // If no scheme directly mentioned, fall back to current active scheme if provided
  if (currentSchemeId) {
    return schemesData.schemes.find(s => s.id === currentSchemeId) || null;
  }

  return null;
}

/**
 * Parse intent and generate spoken Marathi response & action
 */
export function parseIntent(userText, currentScheme = null) {
  const norm = normalizeText(userText);
  const scheme = detectScheme(userText, currentScheme ? currentScheme.id : null);

  // 1. Check for Repeat
  if (INTENT_PATTERNS.REPEAT.some(kw => norm.includes(kw))) {
    return {
      intent: 'REPEAT',
      action: 'repeat_last',
      scheme: currentScheme,
      reply_mr: 'मी आधीची माहिती पुन्हा सांगत आहे.'
    };
  }

  // 2. Check for Go Back / Home
  if (INTENT_PATTERNS.BACK.some(kw => norm.includes(kw))) {
    return {
      intent: 'GO_BACK',
      action: 'navigate_home',
      scheme: null,
      reply_mr: 'मी तुम्हाला मुख्य पानावर नेत आहे. बोला, काय मदत हवी आहे?'
    };
  }

  // 3. Check for Greeting
  if (INTENT_PATTERNS.GREETING.some(kw => norm.includes(kw)) && norm.split(' ').length <= 3) {
    return {
      intent: 'GREETING',
      action: 'none',
      scheme: null,
      reply_mr: 'नमस्कार! मी बोलू या, तुमचा सरकारी योजना सहाय्यक. तुम्हाला लाडकी बहीण, पीएम किसान, आयुष्यमान भारत किंवा रेशन कार्ड यापैकी कोणत्या योजनेची माहिती हवी आहे?'
    };
  }

  // 4. Check for Help
  if (INTENT_PATTERNS.HELP.some(kw => norm.includes(kw))) {
    return {
      intent: 'HELP',
      action: 'navigate_about',
      scheme: null,
      reply_mr: 'तुम्ही आवाजाने कोणत्याही योजनेबद्दल विचारू शकता, पात्रता तपासू शकता किंवा अर्जाचा फॉर्म भरू शकता. फक्त माईक दाबा आणि बोला.'
    };
  }

  // 5. Code-mixed status check (e.g. "माझा application status check कर")
  if (INTENT_PATTERNS.STATUS.some(kw => norm.includes(kw))) {
    const schemeName = scheme ? scheme.name_mr : 'सरकारी योजनेच्या';
    const link = scheme ? scheme.official_link : 'https://maharashtra.gov.in';
    return {
      intent: 'CHECK_STATUS',
      action: 'show_status_help',
      scheme: scheme,
      reply_mr: `${schemeName} अर्जाची किंवा हप्त्याची स्थिती तपासण्यासाठी अधिकृत पोर्टलवर जाऊन तुमचा आधार क्रमांक किंवा मोबाईल नंबर टाकावा लागतो. खालील अधिकृत संकेतस्थळ पहा.`,
      link: link
    };
  }

  // 6. If a specific scheme is identified:
  if (scheme) {
    // 6a. Check eligibility intent
    if (INTENT_PATTERNS.ELIGIBILITY.some(kw => norm.includes(kw))) {
      return {
        intent: 'CHECK_ELIGIBILITY',
        action: 'navigate_eligibility',
        scheme: scheme,
        reply_mr: `${scheme.name_mr} साठी तुमची पात्रता तपासूया. मी तुम्हाला ४-५ सोपे प्रश्न विचारतो, नीट उत्तर द्या.`
      };
    }

    // 6b. Check documents intent
    if (INTENT_PATTERNS.DOCUMENTS.some(kw => norm.includes(kw))) {
      const topDocs = scheme.documents_mr.slice(0, 3).map(d => d.name).join(', ');
      return {
        intent: 'CHECK_DOCUMENTS',
        action: 'navigate_documents',
        scheme: scheme,
        reply_mr: `${scheme.name_mr} साठी लागणारी मुख्य कागदपत्रे: ${topDocs}. सविस्तर यादी स्क्रीनवर पहा.`
      };
    }

    // 6c. Apply / fill form intent
    if (INTENT_PATTERNS.APPLY.some(kw => norm.includes(kw))) {
      return {
        intent: 'START_APPLICATION',
        action: 'navigate_form',
        scheme: scheme,
        reply_mr: `${scheme.name_mr} चा प्राथमिक अर्ज भरण्यासाठी मी तुम्हाला काही प्रश्न विचारतो. तयार आहात का?`
      };
    }

    // 6d. General inquiry about the scheme
    return {
      intent: 'SCHEME_INFO',
      action: 'show_scheme_detail',
      scheme: scheme,
      reply_mr: `${scheme.name_mr} बद्दल माहिती: ${scheme.short_description_mr} लाभ: ${scheme.benefit_summary_mr} तुम्हाला पात्रता तपासायची आहे की कागदपत्रे पाहायची आहेत?`
    };
  }

  // 7. General eligibility or documents requested without specifying scheme
  if (INTENT_PATTERNS.ELIGIBILITY.some(kw => norm.includes(kw))) {
    return {
      intent: 'SELECT_SCHEME_FOR_ELIGIBILITY',
      action: 'ask_scheme_selection',
      scheme: null,
      reply_mr: 'तुम्हाला कोणत्या योजनेची पात्रता तपासायची आहे? लाडकी बहीण, पीएम किसान, आयुष्यमान भारत की रेशन कार्ड?'
    };
  }

  if (INTENT_PATTERNS.DOCUMENTS.some(kw => norm.includes(kw))) {
    return {
      intent: 'SELECT_SCHEME_FOR_DOCS',
      action: 'ask_scheme_selection',
      scheme: null,
      reply_mr: 'तुम्हाला कोणत्या योजनेची कागदपत्रे हवी आहेत? लाडकी बहीण, पीएम किसान, आयुष्यमान भारत किंवा रेशन कार्डचे नाव सांगा.'
    };
  }

  // 8. Outside stored data / Unknown query
  return {
    intent: 'OUT_OF_SCOPE',
    action: 'show_fallback',
    scheme: null,
    reply_mr: 'याबद्दल माझ्याकडे माहिती नाही. कृपया अधिकृत संकेतस्थळ पाहा.',
    link: 'https://maharashtra.gov.in',
    link_text: 'महाराष्ट्र शासन अधिकृत संकेतस्थळ (maharashtra.gov.in)'
  };
}

export default {
  parseIntent,
  detectScheme
};
