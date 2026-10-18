/**
 * Sarkar Mitra - Marathi Conversational Intent Parser & NLP Engine
 * 
 * Q&A Assistant Engine: Answers ONLY questions about the government schemes
 * in schemes.json using offline rule-based semantic and phonetic matching.
 * 
 * Does not use any LLM or external server.
 * Preserves the existing voice wizard.
 */

import schemesData from '../data/schemes.json';
import { 
  isYesIntent, 
  isNoIntent, 
  isCancelOrBackIntent, 
  normalizeMarathiSpeech 
} from './marathiVoiceMatcher';
import { 
  answerQuestion, 
  detectSchemeFromText, 
  detectPII 
} from './faqMatcher';

/**
 * Detect scheme mentioned in speech
 */
export function detectScheme(text, currentSchemeId = null) {
  const norm = normalizeMarathiSpeech(text);
  const activeScheme = currentSchemeId ? schemesData.schemes.find(s => s.id === currentSchemeId) : null;
  return detectSchemeFromText(norm, activeScheme);
}

/**
 * Parse user query and generate scheme-specific Q&A response
 */
export function parseIntent(userText, currentScheme = null, confidence = null) {
  if (!userText || !userText.trim()) {
    return {
      intent: 'EMPTY',
      action: 'none',
      reply_mr: 'कृपया तुमची शंका बोला किंवा खालील पर्याय निवडा.',
      scheme: currentScheme
    };
  }

  const raw = userText.trim();
  const norm = normalizeMarathiSpeech(raw);

  // 1. Navigation: Check for Go Back / Cancel / Home
  if (isCancelOrBackIntent(raw)) {
    return {
      intent: 'GO_BACK',
      action: 'navigate_home',
      scheme: null,
      reply_mr: 'मी तुम्हाला मुख्य पानावर नेत आहे. बोला, कोणती मदत हवी आहे?'
    };
  }

  // 2. Repeat last
  if (['पुन्हा सांगा', 'पुन्हा बोला', 'परत सांगा', 'repeat', 'again'].some(kw => norm.includes(kw))) {
    return {
      intent: 'REPEAT',
      action: 'repeat_last',
      scheme: currentScheme,
      reply_mr: 'मी आधीची माहिती पुन्हा सांगत आहे.'
    };
  }

  // 3. Short standalone Rejection / "नाही नको"
  if (isNoIntent(raw) && norm.split(' ').length <= 3) {
    return {
      intent: 'USER_REJECTION',
      action: 'none',
      scheme: currentScheme,
      reply_mr: 'ठीक आहे. तुम्हाला जेव्हा कोणतीही माहिती हवी असेल तेव्हा फक्त माईक दाबा आणि बोला.'
    };
  }

  // 4. Short standalone Affirmation / "होय"
  if (isYesIntent(raw) && norm.split(' ').length <= 2) {
    return {
      intent: 'USER_AFFIRMATION',
      action: 'none',
      scheme: currentScheme,
      reply_mr: 'होय! तुम्हाला लाडकी बहीण, पीएम किसान, आयुष्यमान भारत किंवा रेशन कार्ड यापैकी कोणत्या योजनेबद्दल विचारायचे आहे?',
      options: [
        { label_mr: '🌸 लाडकी बहीण योजना', query: 'लाडकी बहीण योजना काय आहे?' },
        { label_mr: '🌾 पीएम किसान योजना', query: 'पीएम किसान योजना काय आहे?' },
        { label_mr: '🏥 आयुष्यमान भारत (MJPJAY)', query: 'आयुष्यमान भारत योजना काय आहे?' },
        { label_mr: '🍚 रेशन कार्ड अन्न सुरक्षा', query: 'रेशन कार्ड योजना काय आहे?' }
      ]
    };
  }

  // 5. Delegate to FAQ Matcher Q&A Engine (handles PII, Greetings, Off-topic, Uncovered schemes, FAQs)
  const result = answerQuestion(raw, currentScheme);

  return {
    intent: result.type,
    action: result.hasEligibilityAction ? 'offer_eligibility_check' : 'qa_answer',
    scheme: result.scheme || currentScheme,
    reply_mr: result.reply_mr,
    link: result.link || (result.scheme ? result.scheme.official_link : null),
    link_text: result.link_text || (result.scheme ? `${result.scheme.name_mr} अधिकृत संकेतस्थळ` : null),
    options: result.options || null,
    follow_ups: result.follow_ups || null,
    source_gr: result.source_gr || null,
    last_verified: result.last_verified || null,
    verified: result.verified !== undefined ? result.verified : true,
    topic: result.topic || null,
    topic_key: result.topic_key || null,
    hasEligibilityAction: result.hasEligibilityAction || false,
    action_label_mr: result.action_label_mr || null,
    action_screen: result.action_screen || null,
    isPrivacyWarning: result.isPrivacyWarning || false
  };
}

export default {
  parseIntent,
  detectScheme
};
