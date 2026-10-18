/**
 * Sarkar Mitra - Demo Personas & Pre-written Automated Journey Data
 * 
 * Offers 3 authentic Maharashtra civic personas:
 * 1. Sunita Patil - Rural Woman, aged 34, Satara (Ladki Bahin Yojana)
 * 2. Tukaram Shinde - Small Farmer, aged 52, 3 acres, Beed (PM Kisan & Namo Shetkari)
 * 3. Dattatraya Kamble - Elderly Citizen, aged 68, Yellow Ration Card, Kolhapur (Ayushman / MJPJAY)
 */

export const DEMO_PERSONAS = [
  {
    id: 'sunita_patil',
    name_mr: 'सुनिता ताई (वय ३४ वर्षे)',
    name_en: 'Sunita Patil (Age 34)',
    role_mr: 'ग्रामीण महिला • शेतमजूर',
    district_mr: 'सातारा (कोरेगाव)',
    age: 34,
    family_income_mr: '₹१,२०,०००',
    scheme_id: 'ladki-bahin',
    scheme_name_mr: 'मुख्यमंत्री माझी लाडकी बहीण योजना',
    benefit_mr: 'दरमहा ₹१,५०० थेट बँक खात्यात',
    avatar: '👩',
    badgeColor: 'bg-saffron-500',
    description_mr: 'गावात राहणाऱ्या ३४ वर्षीय महिला, ज्यांचे कौटुंबिक वार्षिक उत्पन्न ₹२.५ लाखांच्या आत आहे व आधार लिंक बँक खाते आहे.',
    steps: [
      {
        id: 'intro',
        stageName_mr: '१. योजना शोध व निवड',
        screen: 'home',
        assistantSpeech: 'नमस्कार! मी सरकार मित्र. तुम्हाला मुख्यमंत्री माझी लाडकी बहीण योजनेची माहिती हवी आहे का?',
        userSpeech: 'होय, मला लाडकी बहीण योजनेची माहिती सांगा आणि पात्रता तपासा.',
        highlight: 'योजना: माझी लाडकी बहीण • दरमहा ₹१,५००'
      },
      {
        id: 'eligibility_q1',
        stageName_mr: '२. पात्रता तपासणी (वय व लिंग)',
        screen: 'eligibility',
        assistantSpeech: 'पहिला प्रश्न: तुम्ही २१ ते ६५ वयोगटातील महिला आहात का आणि तुमचे वय किती?',
        userSpeech: 'होय, मी महिला आहे आणि माझे वय ३४ वर्षे आहे.',
        highlight: 'वय: ३४ वर्षे (पात्र निकष: २१ ते ६५ वर्षे)'
      },
      {
        id: 'eligibility_q2',
        stageName_mr: '२. पात्रता तपासणी (वार्षिक उत्पन्न)',
        screen: 'eligibility',
        assistantSpeech: 'तुमचे वार्षिक कौटुंबिक उत्पन्न अडीच लाखांपेक्षा कमी आहे का?',
        userSpeech: 'होय, आमचे वार्षिक उत्पन्न १ लाख २० हजार रुपये आहे.',
        highlight: 'उत्पन्न: ₹१.२ लाख (कमाल मर्यादा: ₹२.५ लाख)'
      },
      {
        id: 'eligibility_q3',
        stageName_mr: '२. पात्रता तपासणी (रहिवासी व शासकीय नोकरी)',
        screen: 'eligibility',
        assistantSpeech: 'तुम्ही महाराष्ट्राचे रहिवासी आहात का आणि घरात कोणी सरकारी नोकरीत किंवा आयकरदाता आहे का?',
        userSpeech: 'होय, आम्ही सातारा जिल्ह्याचे रहिवासी आहोत. घरात कोणीही सरकारी नोकरीत नाही.',
        highlight: 'रहिवासी: सातारा (महाराष्ट्र) • सरकारी नोकरी: नाही'
      },
      {
        id: 'eligibility_result',
        stageName_mr: '२. पात्रता निकाल (१००% नियम-आधारित)',
        screen: 'eligibility_result',
        assistantSpeech: 'अभिनंदन सुनिता ताई! तुम्ही लाडकी बहीण योजनेसाठी पूर्णपणे पात्र आहात. तुम्हाला दरमहा ₹१,५०० थेट खात्यात मिळतील.',
        userSpeech: 'खूप छान! मला कोणती कागदपत्रे लागतील आणि अर्ज कसा भरायचा?',
        highlight: 'निकाल: पात्र (Eligible) ★ दरमहा ₹१,५००'
      },
      {
        id: 'documents',
        stageName_mr: '३. आवश्यक कागदपत्रे पडताळणी यादी',
        screen: 'documents',
        assistantSpeech: 'या योजनेसाठी आधार कार्ड, अधिवास प्रमाणपत्र किंवा रेशन कार्ड, बँक पासबुक आणि हमीपत्र ही कागदपत्रे आवश्यक आहेत.',
        userSpeech: 'माझ्याकडे सर्व कागदपत्रे तयार आहेत. कृपया आवाजाने अर्ज भरण्यास सुरुवात करा.',
        highlight: '४ कागदपत्रे तयार: आधार, रेशन कार्ड, बँक पासबुक, हमीपत्र'
      },
      {
        id: 'form_name',
        stageName_mr: '४. आवाजाने अर्ज भरणे (नाव नोंदणी)',
        screen: 'form',
        assistantSpeech: 'तुमचे आधार कार्डावरील संपूर्ण नाव सांगा.',
        userSpeech: 'सुनिता प्रकाश पाटील',
        assistantConfirm: 'नाव नोंदवले: "सुनिता प्रकाश पाटील". हे बरोबर आहे का?',
        userConfirm: 'होय, बरोबर आहे.',
        highlight: 'अर्जदार: सुनिता प्रकाश पाटील'
      },
      {
        id: 'form_phone',
        stageName_mr: '४. आवाजाने अर्ज भरणे (मोबाईल नंबर)',
        screen: 'form',
        assistantSpeech: 'तुमचा १० अंकी मोबाईल नंबर सांगा.',
        userSpeech: '९८ २२ ४५ १२ ३४ (नाईन एट टू टू फोर फाइव्ह...)',
        assistantConfirm: 'मोबाईल नंबर नोंदवला: 9822451234. हे बरोबर आहे का?',
        userConfirm: 'होय, बरोबर आहे.',
        highlight: 'स्वयंचलित इंग्रजी अंकात रूपांतर: 9822451234'
      },
      {
        id: 'form_address',
        stageName_mr: '४. आवाजाने अर्ज भरणे (पत्ता व बँक)',
        screen: 'form',
        assistantSpeech: 'तुमचा जिल्हा, गावाचा पत्ता आणि बँक खाते सांगा.',
        userSpeech: 'जिल्हा सातारा, मु. पो. कोरेगाव, बँक ऑफ महाराष्ट्र खाते ११०२३४५६७८९.',
        assistantConfirm: 'पत्ता: कोरेगाव, सातारा • बँक ऑफ महाराष्ट्र. हे बरोबर आहे का?',
        userConfirm: 'होय, सर्व बरोबर आहे.',
        highlight: 'पत्ता: सातारा • बँक खाते: Bank of Maharashtra'
      },
      {
        id: 'pdf_summary',
        stageName_mr: '४. पूर्व-अर्ज सारांश व PDF डाऊनलोड',
        screen: 'pdf_preview',
        assistantSpeech: 'अभिनंदन सुनिता ताई! तुमचा पूर्व-अर्ज सारांश तयार झाला आहे. मसुदा क्रमांक SM-DRAFT-849201. ही PDF डाऊनलोड करून सेतू केंद्रात सादर करा.',
        userSpeech: 'धन्यवाद सरकार मित्र! मी PDF डाऊनलोड करत आहे.',
        highlight: 'पूर्व-अर्ज सारांश (Pre-Application Summary) • SM-DRAFT-849201'
      }
    ]
  },
  {
    id: 'tukaram_shinde',
    name_mr: 'तुकाराम बाबा (वय ५२ वर्षे)',
    name_en: 'Tukaram Shinde (Age 52)',
    role_mr: 'अल्पभूधारक शेतकरी • ३ एकर जमीन',
    district_mr: 'बीड (गेवराई)',
    age: 52,
    family_income_mr: '₹९०,००० (शेती)',
    scheme_id: 'pm-kisan',
    scheme_name_mr: 'पीएम किसान + नमो शेतकरी योजना',
    benefit_mr: 'वार्षिक ₹१२,००० (₹६००० केंद्र + ₹६००० राज्य)',
    avatar: '👨‍🌾',
    badgeColor: 'bg-emerald-600',
    description_mr: 'मराठवाड्यातील बीड जिल्ह्यातील अल्पभूधारक शेतकरी, ज्यांच्या नावावर ३ एकर शेतजमीन असून बायोमेट्रिक ई-केवायसी पूर्ण आहे.',
    steps: [
      {
        id: 'intro',
        stageName_mr: '१. योजना शोध व निवड',
        screen: 'home',
        assistantSpeech: 'रामराम तुकाराम बाबा! पीएम किसान सन्मान निधी व नमो शेतकरी महासन्मान निधीची माहिती हवी आहे का?',
        userSpeech: 'होय भाऊ, मला पीएम किसान योजनेचे पैसे मिळतील का ते तपासायचे आहे.',
        highlight: 'योजना: पीएम किसान + नमो शेतकरी • वार्षिक ₹१२,०००'
      },
      {
        id: 'eligibility_q1',
        stageName_mr: '२. पात्रता तपासणी (शेतजमीन)',
        screen: 'eligibility',
        assistantSpeech: 'तुमच्या स्वतःच्या नावावर शेतजमीन आहे का आणि क्षेत्र किती एकर आहे?',
        userSpeech: 'होय, माझ्या नावावर ३ एकर कोरडवाहू जमीन आहे, ७/१२ वर माझे नाव आहे.',
        highlight: 'शेतजमीन: ३ एकर (पात्र: २ हेक्टरच्या आत)'
      },
      {
        id: 'eligibility_q2',
        stageName_mr: '२. पात्रता तपासणी (शासकीय नोकरी / कर)',
        screen: 'eligibility',
        assistantSpeech: 'तुमच्या कुटुंबात कोणी घटनात्मक पदावर, सरकारी नोकरीत किंवा निवृत्तीवेतनधारक आहे का?',
        userSpeech: 'नाही, आम्ही साधे शेतकरी आहोत. कोणीही सरकारी नोकरीत नाही आणि आयकर भरत नाही.',
        highlight: 'शासकीय नोकरी / कर: नाही'
      },
      {
        id: 'eligibility_q3',
        stageName_mr: '२. पात्रता तपासणी (ई-केवायसी)',
        screen: 'eligibility',
        assistantSpeech: 'तुमचे आधार कार्ड बँक खात्याशी लिंक असून बायोमेट्रिक ई-केवायसी पूर्ण आहे का?',
        userSpeech: 'होय, सेतू केंद्रात जाऊन गेल्या महिन्यातच ई-केवायसी पूर्ण केले आहे.',
        highlight: 'ई-केवायसी: पूर्ण (Active eKYC Status)'
      },
      {
        id: 'eligibility_result',
        stageName_mr: '२. पात्रता निकाल',
        screen: 'eligibility_result',
        assistantSpeech: 'अभिनंदन तुकाराम बाबा! तुम्ही पीएम किसान व नमो शेतकरी योजनेसाठी पात्र आहात. तुम्हाला वार्षिक ₹१२,००० लाभ मिळेल.',
        userSpeech: 'खूप चांगलं झालं! आता अर्ज कसा भरायचा ते सांगा.',
        highlight: 'निकाल: पात्र (Eligible) ★ वार्षिक ₹१२,०००'
      },
      {
        id: 'documents',
        stageName_mr: '३. आवश्यक कागदपत्रे पडताळणी यादी',
        screen: 'documents',
        assistantSpeech: 'आवश्यक कागदपत्रे: चालू ७/१२ व ८-अ उतारा, आधार कार्ड, बँक पासबुक आणि ई-केवायसी पावती.',
        userSpeech: 'होय, हे सर्व कागद माझ्या खिशातच आहेत. अर्ज भरा.',
        highlight: 'कागदपत्रे: ७/१२ उतारा, ८-अ, आधार, बँक पासबुक'
      },
      {
        id: 'form_name',
        stageName_mr: '४. आवाजाने अर्ज भरणे (शेतकरी नाव)',
        screen: 'form',
        assistantSpeech: 'तुमचे ७/१२ वरील पूर्ण नाव सांगा.',
        userSpeech: 'तुकाराम ज्ञानोबा शिंदे',
        assistantConfirm: 'नोंदवलेले नाव: "तुकाराम ज्ञानोबा शिंदे". बरोबर आहे का?',
        userConfirm: 'होय, बरोबर आहे.',
        highlight: 'शेतकरी: तुकाराम ज्ञानोबा शिंदे'
      },
      {
        id: 'form_phone',
        stageName_mr: '४. आवाजाने अर्ज भरणे (मोबाईल नंबर)',
        screen: 'form',
        assistantSpeech: 'तुमचा मोबाईल नंबर व जिल्हा सांगा.',
        userSpeech: '९६ ६४ ४२ ९४ १०, जिल्हा बीड.',
        assistantConfirm: 'मोबाईल: 9664429410, जिल्हा: बीड. बरोबर आहे का?',
        userConfirm: 'होय, अगदी बरोबर.',
        highlight: 'नंबर रूपांतर: 9664429410 • जिल्हा: बीड'
      },
      {
        id: 'form_land',
        stageName_mr: '४. आवाजाने अर्ज भरणे (जमीन व बँक)',
        screen: 'form',
        assistantSpeech: 'जमिनीचा गट नंबर व बँकेचा तपशील सांगा.',
        userSpeech: 'गट नंबर १२४/२, स्टेट बँक ऑफ इंडिया खाते ३४५६७८९०१२३.',
        assistantConfirm: 'गट क्र. १२४/२, ३ एकर, SBI बँक नोंदवले. बरोबर आहे का?',
        userConfirm: 'होय, बरोबर आहे.',
        highlight: 'गट क्र. १२४/२ (३ एकर) • State Bank of India'
      },
      {
        id: 'pdf_summary',
        stageName_mr: '४. पूर्व-अर्ज सारांश व PDF डाऊनलोड',
        screen: 'pdf_preview',
        assistantSpeech: 'तुकाराम बाबा, तुमचा पूर्व-अर्ज सारांश तयार झाला आहे. संदर्भ क्रमांक SM-DRAFT-392817. ही प्रत घेऊन कृषी सहाय्यक किंवा ग्रामपंचायतीत जमा करा.',
        userSpeech: 'धन्यवाद! मी लगेच प्रिंट काढून घेतो.',
        highlight: 'पूर्व-अर्ज सारांश (Pre-Application Summary) • SM-DRAFT-392817'
      }
    ]
  },
  {
    id: 'dattatraya_kamble',
    name_mr: 'दत्तात्रय आजोबा (वय ६८ वर्षे)',
    name_en: 'Dattatraya Kamble (Age 68)',
    role_mr: 'ज्येष्ठ नागरिक • पिवळे रेशन कार्डधारक',
    district_mr: 'कोल्हापूर (शिरोळ)',
    age: 68,
    family_income_mr: '₹५५,०००',
    scheme_id: 'ayushman-mjpjay',
    scheme_name_mr: 'आयुष्यमान भारत - म.ज्यो.फु. जन आरोग्य योजना',
    benefit_mr: '₹५ लाख मोफत कॅशलेस उपचार प्रति कुटुंब प्रति वर्ष',
    avatar: '👴',
    badgeColor: 'bg-amber-600',
    description_mr: 'कोल्हापूर जिल्ह्यातील ६८ वर्षांचे ज्येष्ठ नागरिक, ज्यांच्याकडे पिवळे बीपीएल रेशन कार्ड असून डोळ्यांच्या व गुडघ्याच्या मोफत उपचारासाठी अर्ज करत आहेत.',
    steps: [
      {
        id: 'intro',
        stageName_mr: '१. योजना शोध व निवड',
        screen: 'home',
        assistantSpeech: 'प्रणाम दत्तात्रय आजोबा! आयुष्यमान भारत व महात्मा ज्योतिराव फुले जन आरोग्य योजनेबद्दल माहिती हवी आहे का?',
        userSpeech: 'होय बाळा, मला हॉस्पिटलमध्ये मोफत उपचारासाठी काय करावे लागेल?',
        highlight: 'योजना: आयुष्यमान भारत / MJPJAY • ₹५ लाख मोफत उपचार'
      },
      {
        id: 'eligibility_q1',
        stageName_mr: '२. पात्रता तपासणी (रेशन कार्ड वर्गवारी)',
        screen: 'eligibility',
        assistantSpeech: 'तुमच्याकडे पिवळे (BPL) किंवा अंत्योदय अन्न रेशन कार्ड आहे का?',
        userSpeech: 'होय, आमच्या कुटुंबाकडे पिवळे रेशन कार्ड आहे.',
        highlight: 'रेशन कार्ड: पिवळे कार्डधारक (BPL Priority)'
      },
      {
        id: 'eligibility_q2',
        stageName_mr: '२. पात्रता तपासणी (रहिवासी व उत्पन्न)',
        screen: 'eligibility',
        assistantSpeech: 'तुम्ही महाराष्ट्राचे रहिवासी आहात का आणि वार्षिक उत्पन्न १ लाखाच्या आत आहे का?',
        userSpeech: 'होय, आम्ही कोल्हापूरचे रहिवासी आहोत आणि उत्पन्न ५५ हजार आहे.',
        highlight: 'रहिवासी: कोल्हापूर • उत्पन्न: ₹५५,०००'
      },
      {
        id: 'eligibility_q3',
        stageName_mr: '२. पात्रता तपासणी (उपचार गरज)',
        screen: 'eligibility',
        assistantSpeech: 'कुटुंबात कोणाला उपचाराची किंवा शस्त्रक्रियेची गरज आहे का?',
        userSpeech: 'होय, मला मोतीबिंदू आणि गुडघ्याचे उपचार करायचे आहेत.',
        highlight: 'उपचार: मोतीबिंदू व गुडघे शस्त्रक्रिया'
      },
      {
        id: 'eligibility_result',
        stageName_mr: '२. पात्रता निकाल',
        screen: 'eligibility_result',
        assistantSpeech: 'अभिनंदन आजोबा! तुम्ही ₹५ लाख रुपयांपर्यंतच्या मोफत वैद्यकीय उपचारांसाठी पूर्णपणे पात्र आहात.',
        userSpeech: 'ईश्वराचे आणि तुमचे खूप उपकार! आता मला काय करावे लागेल?',
        highlight: 'निकाल: पात्र (Eligible) ★ ₹५ लाख मोफत उपचार'
      },
      {
        id: 'documents',
        stageName_mr: '३. आवश्यक कागदपत्रे पडताळणी यादी',
        screen: 'documents',
        assistantSpeech: 'कागदपत्रे: मूळ पिवळे रेशन कार्ड, आधार कार्ड, आणि डॉक्टरांचे प्रिस्क्रिप्शन / आजाराचा दाखला.',
        userSpeech: 'माझ्याकडे रेशन कार्ड आणि आधार कार्ड दोन्ही आहे.',
        highlight: 'कागदपत्रे: पिवळे रेशन कार्ड, आधार कार्ड'
      },
      {
        id: 'form_name',
        stageName_mr: '४. आवाजाने अर्ज भरणे (रुग्ण नाव व वय)',
        screen: 'form',
        assistantSpeech: 'रुग्णाचे पूर्ण नाव आणि वय सांगा.',
        userSpeech: 'दत्तात्रय गोविंद कांबळे, वय ६८ वर्षे.',
        assistantConfirm: 'नाव: "दत्तात्रय गोविंद कांबळे", वय: ६८. बरोबर आहे का?',
        userConfirm: 'होय, बरोबर आहे.',
        highlight: 'रुग्ण: दत्तात्रय गोविंद कांबळे (वय ६८)'
      },
      {
        id: 'form_phone',
        stageName_mr: '४. आवाजाने अर्ज भरणे (मोबाईल व रेशन कार्ड)',
        screen: 'form',
        assistantSpeech: 'मोबाईल नंबर आणि रेशन कार्ड नंबर सांगा.',
        userSpeech: 'मोबाईल ९४ २० १२ ३४ ५६, रेशन कार्ड २७ २८ ०१ २३ ४५ ६७.',
        assistantConfirm: 'मोबाईल: 9420123456, रेशन कार्ड: 272801234567. बरोबर आहे का?',
        userConfirm: 'होय, बरोबर आहे.',
        highlight: 'मोबाईल: 9420123456 • कार्ड: 272801234567'
      },
      {
        id: 'form_treatment',
        stageName_mr: '४. आवाजाने अर्ज भरणे (उपचार व जिल्हा)',
        screen: 'form',
        assistantSpeech: 'उपचाराचे नाव आणि जिल्हा सांगा.',
        userSpeech: 'मोतीबिंदू व गुडघे शस्त्रक्रिया, जिल्हा कोल्हापूर.',
        assistantConfirm: 'उपचार: मोतीबिंदू व गुडघे शस्त्रक्रिया, कोल्हापूर. बरोबर आहे का?',
        userConfirm: 'होय, बरोबर आहे.',
        highlight: 'उपचार: मोतीबिंदू व गुडघे शस्त्रक्रिया • कोल्हापूर'
      },
      {
        id: 'pdf_summary',
        stageName_mr: '४. पूर्व-अर्ज सारांश व PDF डाऊनलोड',
        screen: 'pdf_preview',
        assistantSpeech: 'आजोबा, तुमचा पूर्व-अर्ज सारांश तयार झाला आहे. मसुदा नोंद SM-DRAFT-628194. ही पत्रिका घेऊन मान्यताप्राप्त हॉस्पिटलमधील आरोग्यमित्राशी संपर्क साधा.',
        userSpeech: 'खूप खूप धन्यवाद! मी ही पत्रिका दवाखान्यात दाखवतो.',
        highlight: 'पूर्व-अर्ज सारांश (Pre-Application Summary) • SM-DRAFT-628194'
      }
    ]
  }
];

export default DEMO_PERSONAS;
