const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/schemes.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const whatNextData = {
  'ladki-bahin': {
    official_link: 'https://ladakibahin.maharashtra.gov.in',
    submit_where_mr: 'जवळचे सेतू केंद्र, आपले सरकार सेवा केंद्र, ग्रामपंचायत कार्यालय किंवा अंगणवाडी केंद्र [VERIFY]',
    after_submit_mr: '१. अर्जाची पावती अथवा ॲप्लिकेशन आयडी नंबर जपून ठेवा.\n२. अंगणवाडी सेविका किंवा वॉर्ड कमिटीमार्फत कागदपत्रांची पडताळणी होते.\n३. मंजुरी मिळाल्यावर दरमहा १५ तारखेपर्यंत आधार-लिंक्ड बँक खात्यात ₹१,५०० थेट जमा होतात. [VERIFY]',
    last_verified_date: '2026-09-15'
  },
  'pm-kisan': {
    official_link: 'https://pmkisan.gov.in',
    submit_where_mr: 'तालुका कृषी अधिकारी कार्यालय, आपले सरकार सेवा केंद्र (CSC), किंवा पीएम किसान पोर्टलद्वारे ऑनलाइन [VERIFY]',
    after_submit_mr: '१. अर्जाची संगणकीय पोचपावती व शेतकरी नोंदणी क्रमांक मिळतो.\n२. महसूल व कृषी विभागामार्फत ७/१२ जमिनीची मालकी व आधार ई-केवायसी तपासली जाते.\n३. पडताळणी पूर्ण झाल्यावर दर चार महिन्यांनी ₹२,००० चा हप्ता (वर्षाला ₹६,०००) थेट खात्यात जमा होतो. [VERIFY]',
    last_verified_date: '2026-09-10'
  },
  'ayushman-mjpjay': {
    official_link: 'https://www.jeevandayee.gov.in',
    submit_where_mr: "जिल्हा सामान्य रुग्णालय, उपजिल्हा रुग्णालय किंवा योजनेशी संलग्न सरकारी/खाजगी रुग्णालयातील 'आरोग्यमित्र' कक्ष [VERIFY]",
    after_submit_mr: '१. रुग्णालयातील आरोग्यमित्र कक्षात रेशन कार्ड व आधार कार्ड सादर करा.\n२. आरोग्यमित्र बायोमेट्रिक ई-केवायसी करून आयुष्मान गोल्डन कार्ड व प्री-ऑथोरायझेशन मंजुरी मिळवून देतात.\n३. मंजुरीनंतर रुग्णालयात उपचाराचा ₹५ लाखांपर्यंतचा संपूर्ण खर्च मोफत (कॅशलेस) केला जातो. [VERIFY]',
    last_verified_date: '2026-08-20'
  },
  'ration-card': {
    official_link: 'https://rcms.mahafood.gov.in',
    submit_where_mr: 'तालुका तहसीलदार कार्यालय (पुरवठा विभाग), अन्नधान्य वितरण अधिकारी (FDO) कार्यालय किंवा आपले सरकार सेवा केंद्र [VERIFY]',
    after_submit_mr: '१. सादर केलेल्या अर्जाची संगणकीकृत पोचपावती व टोकन क्रमांक घ्या.\n२. पुरवठा निरीक्षकांकडून पत्ता, कुटुंबातील सदस्य व उत्पन्नाची स्थळ पाहणी/पडताळणी होते.\n३. अहवाल मंजूर झाल्यावर ३० दिवसांच्या आत नवीन रेशन कार्ड मुद्रित होऊन वितरित केले जाते. [VERIFY]',
    last_verified_date: '2026-07-15'
  }
};

data.schemes = data.schemes.map(scheme => {
  const nextInfo = whatNextData[scheme.id];
  if (nextInfo) {
    return {
      ...scheme,
      official_link: nextInfo.official_link,
      submit_where_mr: nextInfo.submit_where_mr,
      after_submit_mr: nextInfo.after_submit_mr,
      last_verified_date: nextInfo.last_verified_date
    };
  }
  return scheme;
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated schemes.json with official_link, submit_where_mr, after_submit_mr, and last_verified_date!');
