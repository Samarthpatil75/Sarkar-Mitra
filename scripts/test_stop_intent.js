import { isStopIntent, isNoIntent, isYesIntent } from '../src/services/marathiVoiceMatcher.js';

console.log('--- Testing Stop Intent & Exclusion from NoIntent ---');

const stopPhrases = [
  'थांब',
  'थांबा',
  'थांबवा',
  'बंद कर',
  'बंद करा',
  'आवाज बंद',
  'पुरे',
  'पुरे झाले',
  'शांत राहा',
  'शांत रहा',
  'stop',
  'shut up',
  'quiet',
  'silence',
  'थांबा जरा',
  'बस करा'
];

let allPassed = true;

for (const phrase of stopPhrases) {
  const isStop = isStopIntent(phrase);
  const isNo = isNoIntent(phrase);
  if (!isStop) {
    console.error(`FAIL: "${phrase}" was NOT recognized by isStopIntent!`);
    allPassed = false;
  } else if (isNo) {
    console.error(`FAIL: "${phrase}" was erroneously recognized as isNoIntent (which would cause accidental "नाही" wizard answer)!`);
    allPassed = false;
  } else {
    console.log(`PASS: "${phrase}" -> isStopIntent: true, isNoIntent: false`);
  }
}

console.log('\n--- Testing Standard No & Yes Intent Preserved ---');
const noPhrases = ['नाही', 'नाहीये', 'नको', 'नको मला', 'नाही पाहिजे', 'कॅन्सल', 'रद्द'];
for (const phrase of noPhrases) {
  const isNo = isNoIntent(phrase);
  if (!isNo) {
    console.error(`FAIL: "${phrase}" should be isNoIntent!`);
    allPassed = false;
  } else {
    console.log(`PASS: "${phrase}" -> isNoIntent: true`);
  }
}

const yesPhrases = ['होय', 'हो', 'बरोबर', 'होय नक्की', 'yes', 'ok'];
for (const phrase of yesPhrases) {
  const isYes = isYesIntent(phrase);
  if (!isYes) {
    console.error(`FAIL: "${phrase}" should be isYesIntent!`);
    allPassed = false;
  } else {
    console.log(`PASS: "${phrase}" -> isYesIntent: true`);
  }
}

if (allPassed) {
  console.log('\nALL STOP INTENT & WIZARD ISOLATION TESTS PASSED PERFECTLY!');
  process.exit(0);
} else {
  console.error('\nSOME TESTS FAILED!');
  process.exit(1);
}
