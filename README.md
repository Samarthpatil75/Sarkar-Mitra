# सरकार मित्र (Sarkar Mitra) - महाराष्ट्र सरकारी योजना आवाज सहाय्यक

> **"बोला, सरकारी योजना समजून घ्या."**  
> *A responsive, mobile-first, Marathi-first civic voice assistant for Maharashtra citizens.*

---

## 🏛️ प्रकल्प परिचय (Overview)

**सरकार मित्र (Sarkar Mitra)** हे एक खास ग्रामीण नागरिक, महिला, शेतकरी, ज्येष्ठ नागरिक आणि प्रथमच स्मार्टफोन वापरणाऱ्या नागरिकांसाठी डिझाइन केलेले व्हॉईस-फर्स्ट वेब ॲप्लिकेशन आहे. नागरिक केवळ मराठीत बोलून महाराष्ट्र शासनाच्या योजनांची माहिती घेऊ शकतात, स्वतःची पात्रता तपासू शकतात, कागदपत्रांची यादी पाहू शकतात आणि अर्जाचा फॉर्म आवाजाने भरून PDF डाऊनलोड करू शकतात.

---

## 📁 फाईल रचना (File Structure)

```
c:\Samarth.pro\Sarkar Mitra\
├── public/
│   └── favicon.svg                    # Civic Microphone & Maharashtra Tricolor Motif
├── src/
│   ├── assets/
│   ├── data/
│   │   ├── schemes.json               # 4 Maharashtra schemes with rules, docs & verification tags
│   │   └── uiTranslations.json        # Marathi (default) & English UI labels
│   ├── services/
│   │   ├── speechRecognition.js       # Web Speech API ('mr-IN') + Bhashini/Whisper hooks
│   │   ├── speechSynthesis.js         # Marathi Devanagari TTS + Bhashini TTS hooks
│   │   ├── intentParser.js            # Rule-based Marathi NLP + Gemini/LLM hooks
│   │   └── pdfGenerator.js            # Client-side A4 PDF application summary generator
│   ├── context/
│   │   ├── AppContext.jsx             # Theme, language, low-bandwidth mode, active screen
│   │   └── SpeechContext.jsx          # Voice recognition, TTS & conversational routing
│   ├── components/
│   │   ├── Navbar.jsx                 # Accessible navigation, mode toggles, 48px+ targets
│   │   ├── VoiceWaveVisualizer.jsx    # Real-time animated waveform & recognized text badge
│   │   ├── PersistentMicBar.jsx       # Persistent bottom mic bar with typing fallback drawer
│   │   └── SchemeCard.jsx             # High-contrast civic scheme card with audio listen
│   ├── screens/
│   │   ├── HomeScreen.jsx             # Giant mic button ("बोलण्यासाठी दाबा") & 4 scheme cards
│   │   ├── ConversationScreen.jsx     # Chat bubbles with audio replay (🔊) & quick actions
│   │   ├── EligibilityScreen.jsx      # Spoken wizard, rule logic, Result Card (पात्र / अपात्र)
│   │   ├── DocumentsScreen.jsx        # Tickable checklist with spoken read-aloud
│   │   ├── VoiceFormScreen.jsx        # Step-by-step spoken form filler with Yes/No & PDF export
│   │   ├── AboutHelpScreen.jsx        # Privacy note (no Aadhaar stored), verified dates, helplines
│   │   └── AccuracyTestScreen.jsx     # Dialect benchmark (Konkan, Vidarbha, Marathwada, Khandesh) + CSV
│   ├── App.jsx                        # Screen router & accessible skip link
│   ├── index.css                      # Tailwind directives, Devanagari typography, 18px base text
│   └── main.jsx                       # React entry point
├── index.html                         # Mukta & Noto Sans Devanagari Google fonts
├── package.json                       # React 18, Vite, Tailwind CSS, Lucide, jsPDF, Confetti
├── tailwind.config.js                 # Saffron (#EA580C), Civic Blue (#1E3A8A), warm background
├── vite.config.js
└── README.md
```

---

## 🚀 सुरू कसे करावे (Quick Start)

### पूर्वअटी (Prerequisites)
- **Node.js**: v18 किंवा नवीन (v24 समर्थित)
- **ब्राउझर**: Google Chrome, Microsoft Edge, किंवा Brave (Web Speech API साठी Chrome/Edge शिफारस केलेले)

### इन्स्टॉलेशन व रन (Installation & Run)
```bash
# 1. सर्व पॅकेजेस इन्स्टॉल करा
npm install

# 2. डेव्हलपमेंट सर्व्हर सुरू करा
npm run dev

# 3. प्रॉडक्शन बिल्ड तयार करा
npm run build
```
ब्राउझरमध्ये `http://localhost:3000` उघडा.

---

## 🎯 प्रमुख वैशिष्ट्ये व पडदे (Screens & Features)

### १. मुख्य पान (Home Screen)
- **एक महाकाय माईक बटण**: "बोलण्यासाठी दाबा" – एका स्पर्शाने आवाज इनपुट सुरू होते.
- **४ मुख्य योजनांची कार्डे**:
  1. *मुख्यमंत्री माझी लाडकी बहीण योजना* (₹१,५०० दरमहा)
  2. *पीएम किसान सन्मान निधी योजना* (₹६,००० वार्षिक + नमो शेतकरी)
  3. *आयुष्यमान भारत - म.ज्यो.फु. जन आरोग्य योजना* (₹५ लाख मोफत उपचार)
  4. *रेशन कार्ड अन्न सुरक्षा योजना* (सवलतीत अन्नधान्य)
- **सुचवलेले प्रश्न**: एका क्लिकवर प्रश्न विचारण्यासाठी चिप्स.

### २. संभाषण पान (Conversation Screen)
- व्हॉट्सॲप शैलीतील सुटसुटीत चॅट इंटरफेस.
- सहाय्यकाच्या प्रत्येक उत्तरावर **पुन्हा ऐका (🔊)** बटण.
- **ऐकत असतानाचे ॲनिमेशन** व रिअल-टाइम समजलेला मजकूर.
- उत्तराशी संबंधित थेट ॲक्शन बटणे (पात्रता तपासा / कागदपत्रे / अर्ज भरा).

### ३. पात्रता तपासणी (Eligibility Check)
- सहाय्यक एक-एक करून **४ ते ५ छोटे सोपे प्रश्न** विचारतो (उदा. वय, लिंग, वार्षिक उत्पन्न, शेतजमीन).
- प्रश्न थेट आवाजात ऐकू येतो व स्क्रीनवर मोठे **होय / नाही** किंवा पर्याय दिसतात.
- **शुद्ध नियम-आधारित लॉजिक (Rule-Based Logic)**: कोणतेही मनमानी अंदाज नाही, `schemes.json` मधील अटींनुसार अचूक निकाल.
- **निकाल कार्ड**: 
  - ✅ **पात्र (Eligible)** – अभिनंदनाचा संदेश व थेट अर्ज भरण्याचा पर्याय (कन्फेटी ॲनिमेशनसह).
  - ❌ **पात्र नाही (Not Eligible)** – साध्या मराठीत कारण (उदा. वय २१ ते ६५ दरम्यान असावे).
  - ❓ **खात्री आवश्यक (Inconclusive)** – अधिक कागदपत्रे तपासण्याचा सल्ला.

### ४. कागदपत्रे यादी (Documents Checklist)
- आवश्यक कागदपत्रांची **टिक करता येणारी यादी (Tickable List)**.
- **सर्व कागदपत्रे ऐका** बटणाने सर्व दाखले आवाजात वाचून दाखवले जातात.
- **अनिवार्य** आणि **पर्यायी** कागदपत्रांचे स्पष्ट वर्गीकरण.
- अर्ज कुठे व कसा करावा याचे प्रत्यक्ष मार्गदर्शन व अधिकृत लिंक.

### ५. आवाजाने अर्ज भरणे (Voice Form Filling)
- सहाय्यक एका वेळी एकच माहिती विचारतो (उदा. *"तुमचे पूर्ण नाव सांगा"*).
- नागरिक बोलल्यावर ते उत्तर पुन्हा वाचून दाखवतो: *"तुम्ही सांगितले: ... हे बरोबर आहे का?"*.
- **होय / नाही** बटणे किंवा आवाजाने दुजोरा.
- कीबोर्डद्वारे टाईप करून दुरुस्ती करण्याची सुविधा.
- शेवटी **"अर्जाचा सारांश PDF डाउनलोड करा"** बटणावर क्लिक करताच ब्राउझरमध्ये त्वरित A4 आकाराची सुबक PDF तयार होते.

### ६. माहिती व मदत (About & Help)
- **गोपनीयता सूचना**: कोणताही आधार किंवा संवेदनशील डेटा साठवला जात नाही; सर्व डेटा केवळ तुमच्या सत्रापुरता मेमरीमध्ये राहतो.
- **शासकीय पडताळणी तारीख (Last Verified Date)**: प्रत्येक योजनेची सरकारी परिपत्रक तारीख.
- **नागरिकांसाठी टोल-फ्री हेल्पलाईन**: 181 (महिला), 1800 120 8040 (मुख्यमंत्री हेल्पलाईन), 155388 (आरोग्य), 1800 180 1551 (शेतकरी).

### ७. बोलीभाषा अचूकता चाचणी (Dialect Accuracy Benchmark)
- **विदर्भ (वऱ्हाडी), कोकण (मालवणी), मराठवाडा, खान्देश (अहिराणी)** आणि पश्चिम महाराष्ट्र बोलीभाषांचे पृथक्करण.
- अपेक्षित वाक्य आणि रेकॉर्ड झालेल्या आवाजाची तुलना.
- अचूक (Correct) / अंशतः (Partial) / अयोग्य (Incorrect) रेटिंग.
- **CSV एक्सपोर्ट**: `bolu_ya_dialect_benchmark.csv` फाईल डाऊनलोड करून अचूकतेचे विश्लेषण करता येते.

---

## ♿ सुलभता व डिझाइन (Accessibility & Design)

- **रंगसंगती**: विश्वासार्ह केसरी (Saffron) आणि डीप सिव्हिक ब्ल्यू (Deep Blue), ऑफ-व्हाइट पार्श्वभूमीवर.
- **फॉन्ट**: उच्च वाचनीयतेचा देवनागरी फॉन्ट (**Mukta** आणि **Noto Sans Devanagari**).
- **टॅप टार्गेट्स**: सर्व बटणे किमान **48px x 48px** किंवा त्याहून मोठी.
- **मजकूर आकार**: किमान **18px** बेस फॉन्ट.
- **डार्क मोड**: डोळ्यांवर ताण येऊ नये म्हणून पूर्ण डार्क मोड समर्थित.
- **कमी डेटा मोड (Low-Bandwidth Mode)**: मर्यादित इंटरनेट असलेल्या ग्रामीण भागासाठी ॲनिमेशन बंद आणि ऑडिओ फक्त दाबावर वाजणारा मोड.

---

## 🔌 बाह्य सेवा जोडणी मार्गदर्शक (Bhashini / Whisper / LLM Plug-in Guide)

सध्याचा डेमो कोणत्याही बाह्य पेड सर्व्हरशिवाय थेट ब्राऊझर Web Speech API व स्थानिक नियमांवर चालतो. भविष्यात प्रगत AI जोडण्यासाठी कोडमध्ये स्पष्ट हुक्स दिलेले आहेत:

### १. Bhashini ASR / Whisper जोडण्यासाठी:
`src/services/speechRecognition.js` फाईल पहा:
```javascript
// Bhashini ASR API Call Example:
export async function transcribeWithBhashini(audioBlob) {
  const response = await fetch("https://dhruva-api.bhashini.gov.in/services/inference/pipeline", {
    method: "POST",
    headers: {
      "Authorization": YOUR_BHASHINI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pipelineTasks: [{
        taskType: "asr",
        config: { language: { sourceLanguage: "mr" } }
      }],
      inputData: { audio: [{ audioContent: base64Audio }] }
    })
  });
  const data = await response.json();
  return data.pipelineResponse[0].output[0].source;
}
```

### २. Bhashini Marathi TTS जोडण्यासाठी:
`src/services/speechSynthesis.js` फाईल पहा:
```javascript
// Bhashini Marathi Female Voice TTS:
export async function speakWithBhashini(text) {
  const response = await fetch("https://dhruva-api.bhashini.gov.in/services/inference/pipeline", {
    method: "POST",
    headers: { "Authorization": YOUR_API_KEY },
    body: JSON.stringify({
      pipelineTasks: [{
        taskType: "tts",
        config: { language: { sourceLanguage: "mr" }, gender: "female" }
      }],
      inputData: { input: [{ source: text }] }
    })
  });
  // Play base64 audio response
}
```

### ३. LLM किंवा RAG (Gemini / OpenAI) जोडण्यासाठी:
`src/services/intentParser.js` फाईल पहा:
```javascript
// LLM fallback for conversational queries:
export async function queryLLM(userPrompt, conversationHistory) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: userPrompt,
      systemInstruction: "तुम्ही 'सरकार मित्र'चे मराठी सहाय्यक आहात. उत्तरे लहान, साध्या आणि स्पष्ट बोलचालीच्या मराठीत द्या.",
      schemesContext: schemesData
    })
  });
  return await response.json();
}
```

---

## 🔒 गोपनीयता व परवाना (Privacy & Disclaimer)

1. **डेटा संकलन**: हे ॲप्लिकेशन कोणत्याही वापरकर्त्याचा आधार क्रमांक, बँक माहिती किंवा खाजगी माहिती कोणत्याही सर्व्हरवर साठवत नाही.
2. **माहिती पडताळणी**: सर्व योजनांची माहिती प्रातिनिधिक असून अधिकृत सरकारी परिपत्रकानुसार (GR) वेळोवेळी बदलू शकते. कृपया प्रत्यक्ष लाभापूर्वी अधिकृत संकेतस्थळावर खात्री करा.
