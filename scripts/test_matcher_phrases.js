import { answerQuestion } from '../src/services/faqMatcher.js';
import schemesData from '../src/data/schemes.json' with { type: 'json' };

const testCases = [
  {
    query: 'लाडकी बहीण योजना काय आहे?',
    contextScheme: null,
    expectedType: 'FAQ_ANSWER',
    expectedSchemeId: 'ladki-bahin',
    expectedTopicKey: 'about'
  },
  {
    query: 'pm kisan che paise kiti milatat',
    contextScheme: null,
    expectedType: 'FAQ_ANSWER',
    expectedSchemeId: 'pm-kisan',
    expectedTopicKey: 'benefits'
  },
  {
    query: 'ration card sathi kagadpatre konti',
    contextScheme: null,
    expectedType: 'FAQ_ANSWER',
    expectedSchemeId: 'ration-card',
    expectedTopicKey: 'documents'
  },
  {
    query: 'आणि अर्ज कुठे करायचा?',
    contextScheme: schemesData.schemes.find(s => s.id === 'ladki-bahin'),
    expectedType: 'FAQ_ANSWER',
    expectedSchemeId: 'ladki-bahin',
    expectedTopicKey: 'apply'
  },
  {
    query: 'माझा अर्ज नाकारला गेला आता काय करू',
    contextScheme: schemesData.schemes.find(s => s.id === 'ladki-bahin'),
    expectedType: 'FAQ_ANSWER',
    expectedSchemeId: 'ladki-bahin',
    expectedTopicKey: 'rejected'
  },
  {
    query: 'मला पैसे मिळाले नाहीत',
    contextScheme: schemesData.schemes.find(s => s.id === 'pm-kisan'),
    expectedType: 'FAQ_ANSWER',
    expectedSchemeId: 'pm-kisan',
    expectedTopicKey: 'payment_issue'
  },
  {
    query: 'MJPJAY मध्ये कोणते आजार येतात?',
    contextScheme: null,
    expectedType: 'FAQ_ANSWER',
    expectedSchemeId: 'ayushman-mjpjay',
    expectedTopicKey: 'diseases'
  },
  {
    query: 'आज हवामान कसे आहे?',
    contextScheme: null,
    expectedType: 'OFF_TOPIC',
    expectedTextIncludes: 'मी फक्त शासकीय योजनांबद्दल माहिती देऊ शकतो'
  },
  {
    query: 'नमस्कार',
    contextScheme: null,
    expectedType: 'GREETING',
    expectedTextIncludes: 'नमस्कार!'
  },
  {
    query: 'मला पीक विमा योजनेबद्दल सांगा',
    contextScheme: null,
    expectedType: 'UNCOVERED_SCHEME',
    expectedTextIncludes: 'पीक विमा'
  },
  {
    query: 'माझा आधार 1234 5678 9012 असा आहे',
    contextScheme: null,
    expectedType: 'PII_WARNING',
    expectedTextIncludes: 'आधार क्रमांक'
  },
  {
    query: 'माझा otp 123456 आला आहे',
    contextScheme: null,
    expectedType: 'PII_WARNING',
    expectedTextIncludes: 'OTP'
  }
];

let allPassed = true;
console.log('--- Running Acceptance Test Phrases ---\n');

for (const tc of testCases) {
  const result = answerQuestion(tc.query, tc.contextScheme);
  let passed = true;

  if (result.type !== tc.expectedType) {
    passed = false;
    console.error(`FAIL: "${tc.query}" expected type ${tc.expectedType}, got ${result.type}`);
  }
  if (tc.expectedSchemeId && (!result.scheme || result.scheme.id !== tc.expectedSchemeId)) {
    passed = false;
    console.error(`FAIL: "${tc.query}" expected scheme ${tc.expectedSchemeId}, got ${result.scheme ? result.scheme.id : 'null'}`);
  }
  if (tc.expectedTopicKey && result.topic_key !== tc.expectedTopicKey) {
    passed = false;
    console.error(`FAIL: "${tc.query}" expected topic_key ${tc.expectedTopicKey}, got ${result.topic_key}`);
  }
  if (tc.expectedTextIncludes && (!result.reply_mr || !result.reply_mr.includes(tc.expectedTextIncludes))) {
    passed = false;
    console.error(`FAIL: "${tc.query}" reply does not include "${tc.expectedTextIncludes}"`);
  }

  if (passed) {
    console.log(`PASS: "${tc.query}" -> [${result.type}] ${result.topic || ''} (${result.scheme ? result.scheme.id : 'no scheme'})`);
  } else {
    allPassed = false;
  }
}

console.log('\n--- Test Result ---');
if (allPassed) {
  console.log('ALL 10 TEST CASES PASSED PERFECTLY!');
} else {
  console.error('SOME TEST CASES FAILED!');
  process.exit(1);
}
