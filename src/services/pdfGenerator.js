/**
 * Sarkar Mitra - Pre-Application Summary PDF Generator Service
 * 
 * Generates a clean, structured, and 100% Devanagari-compliant
 * "पूर्व-अर्ज सारांश (Pre-Application Summary)" sheet.
 * Uses html2canvas to render full Devanagari Unicode fonts (Mukta / Noto Sans Devanagari)
 * and exports as a crisp, razor-sharp A4 PDF via jsPDF at 300 DPI.
 */
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { parseSpokenPhoneNumber } from './marathiVoiceMatcher';

export async function generateApplicationPDF({ scheme, formData, verificationDate }) {
  const refNumber = `SM-DRAFT-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString('mr-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = new Date().toLocaleTimeString('mr-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Ensure mobile number is strictly in numerical format
  const normalizedData = { ...formData };
  const fields = scheme?.form_fields || [];
  
  fields.forEach(field => {
    let rawVal = normalizedData[field.key] || '';
    if (field.type === 'tel' || field.key.includes('mobile') || field.key.includes('phone')) {
      const parsedPhone = parseSpokenPhoneNumber(String(rawVal));
      if (parsedPhone) {
        normalizedData[field.key] = parsedPhone;
      }
    }
  });

  // Create an off-screen printable DOM container styled cleanly for A4 rendering
  const printContainer = document.createElement('div');
  printContainer.id = 'sarkar-mitra-pdf-render';
  printContainer.style.position = 'fixed';
  printContainer.style.left = '-9999px';
  printContainer.style.top = '0';
  printContainer.style.width = '794px'; // Standard A4 width at 96 DPI
  printContainer.style.backgroundColor = '#ffffff';
  printContainer.style.color = '#0f172a';
  printContainer.style.fontFamily = "'Mukta', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  printContainer.style.zIndex = '-9999';
  printContainer.style.boxSizing = 'border-box';
  printContainer.style.padding = '20px 24px';

  // Construct structured Intake Summary HTML
  const fieldsRows = fields.map((field, idx) => {
    let val = normalizedData[field.key];
    if (!val || val === 'undefined') val = '— (नोंदवलेले नाही)';
    const isOdd = idx % 2 === 1;

    return `
      <tr style="background-color: ${isOdd ? '#f8fafc' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 10px; font-weight: 800; color: #475569; width: 40px; text-align: center; font-size: 12.5px;">${idx + 1}</td>
        <td style="padding: 8px 10px; font-weight: 700; color: #1e293b; width: 250px; font-size: 13px;">
          <div>${field.label_mr}</div>
          <div style="font-size: 10.5px; color: #64748b; font-weight: 500;">(${field.key})</div>
        </td>
        <td style="padding: 8px 10px; font-weight: 900; color: #1e3a8a; font-size: 14px;">
          ${val}
        </td>
      </tr>
    `;
  }).join('');

  const documentsRows = (scheme?.documents_mr || []).map((doc, idx) => {
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 10px; width: 26px; text-align: center; vertical-align: top;">
          <div style="width: 13px; height: 13px; border: 2px solid #ea580c; border-radius: 3px; display: inline-block;"></div>
        </td>
        <td style="padding: 6px 10px; font-size: 12px; color: #1e293b; font-weight: 700;">
          <span>${doc.name}</span>
          ${doc.required 
            ? '<span style="display:inline-block; margin-left: 6px; padding: 1px 6px; background-color: #fee2e2; color: #b91c1c; font-size: 9.5px; font-weight: 800; border-radius: 4px;">अनिवार्य (Mandatory)</span>'
            : '<span style="display:inline-block; margin-left: 6px; padding: 1px 6px; background-color: #e2e8f0; color: #475569; font-size: 9.5px; font-weight: 800; border-radius: 4px;">ऐच्छिक (Optional)</span>'
          }
          <div style="font-size: 10.5px; color: #64748b; font-weight: 500; margin-top: 1px;">• ${doc.note || 'मूळ व साक्षांकित सत्यप्रत जोडावी'}</div>
        </td>
      </tr>
    `;
  }).join('');

  printContainer.innerHTML = `
    <div style="border: 2px solid #ea580c; border-radius: 10px; padding: 14px; background: #ffffff;">
      
      <!-- Neutral Saffron & Blue Sarkar-Mitra Header (No State Emblem / Government Header) -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #ffffff; padding: 12px 16px; border-radius: 8px; border-top: 4px solid #ea580c; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: #ea580c; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 20px; font-weight: 900; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            स
          </div>
          <div>
            <div style="font-size: 18px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; line-height: 1.2;">
              सरकार मित्र <span style="color: #fdba74; font-size: 14px; font-weight: 700;">| Sarkar Mitra</span>
            </div>
            <div style="font-size: 11px; font-weight: 600; color: #cbd5e1; margin-top: 1px;">
              नागरिक योजना साहाय्य मंच (Citizen Civic Voice Assistant)
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; padding: 3px 8px; background-color: rgba(234, 88, 12, 0.25); border: 1px solid #ea580c; color: #fdba74; font-size: 10px; font-weight: 800; border-radius: 4px;">
            अशासकीय मसुदा / Non-Government Draft
          </span>
        </div>
      </div>

      <!-- Document Title: पूर्व-अर्ज सारांश (Pre-Application Summary) -->
      <div style="margin-top: 8px; text-align: center; padding: 7px 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #cbd5e1;">
        <h1 style="font-size: 17px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: 0.5px;">
          पूर्व-अर्ज सारांश (Pre-Application Summary)
        </h1>
        <div style="font-size: 10.5px; font-weight: 600; color: #475569; margin-top: 1px;">
          नागरिकाने स्वतः नोंदवलेल्या प्राथमिक माहितीचा मसुदा (Applicant Information Intake Draft)
        </div>
      </div>

      <!-- Opted Scheme Title & Query Box -->
      <div style="margin-top: 8px; background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; padding: 10px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
          <div>
            <span style="display: inline-block; padding: 2px 7px; background-color: #ea580c; color: #ffffff; font-size: 9.5px; font-weight: 900; border-radius: 4px; text-transform: uppercase;">
              ★ निवडलेली योजना (Opted Scheme):
            </span>
            <h2 style="font-size: 16px; font-weight: 900; color: #9a3412; margin: 4px 0 2px 0;">
              ${scheme ? scheme.name_mr : 'योजना'}
            </h2>
            <div style="font-size: 11.5px; font-weight: 700; color: #475569;">
              ${scheme ? scheme.name_en : ''}
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #1e3a8a; font-weight: 800;">
            <div>वर्गवारी: ${scheme ? scheme.category_mr : 'साहाय्य योजना'}</div>
            <div style="color: #16a34a; margin-top: 2px;">लाभ: ${scheme ? scheme.benefit_summary_mr : 'थेट लाभ'}</div>
          </div>
        </div>
      </div>

      <!-- Application Metadata Strip (SM-DRAFT Prefix & Non-government note) -->
      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px 12px; margin-top: 8px; font-size: 11px;">
        <div>
          <span style="color: #64748b; font-weight: 600;">मसुदा संदर्भ क्रमांक (Ref ID):</span> 
          <strong style="color: #0f172a; font-family: monospace; font-size: 12px;">${refNumber}</strong>
          <div style="font-size: 9px; color: #dc2626; font-weight: 700; margin-top: 1px;">
            Draft, not a government registration number.
          </div>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">निर्मिती तारीख:</span> 
          <strong style="color: #0f172a;">${dateStr} (${timeStr})</strong>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">माहिती संदर्भ:</span> 
          <strong style="color: #1e3a8a;">${scheme?.verification_tag || 'सार्वजनिक माहिती'}</strong>
        </div>
      </div>

      <!-- Section 1: Applicant Entered Details -->
      <div style="margin-top: 10px;">
        <div style="font-size: 13px; font-weight: 900; color: #1e3a8a; border-bottom: 2px solid #ea580c; padding-bottom: 3px; margin-bottom: 6px;">
          १. अर्जदाराने नोंदवलेला तपशील / माहिती सारांश (Applicant Entered Details)
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 6px 8px; font-size: 10.5px; font-weight: 800; color: #475569; text-align: center; width: 40px;">अ.क्र.</th>
              <th style="padding: 6px 8px; font-size: 10.5px; font-weight: 800; color: #475569; text-align: left; width: 250px;">विचारलेला तपशील (Field Asked)</th>
              <th style="padding: 6px 8px; font-size: 10.5px; font-weight: 800; color: #475569; text-align: left;">नागरिकाने दिलेली माहिती (Applicant's Response)</th>
            </tr>
          </thead>
          <tbody>
            ${fieldsRows}
          </tbody>
        </table>
      </div>

      <!-- Section 2: Required Documents Checklist -->
      <div style="margin-top: 10px;">
        <div style="font-size: 13px; font-weight: 900; color: #1e3a8a; border-bottom: 2px solid #ea580c; padding-bottom: 3px; margin-bottom: 4px;">
          २. आवश्यक कागदपत्रे पडताळणी यादी (Required Documents Checklist)
        </div>
        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; font-weight: 600;">
          * प्रत्यक्ष अर्ज सादर करताना खालील कागदपत्रांच्या मूळ व साक्षांकित (Self-attested) प्रती सोबत जोडणे आवश्यक आहे:
        </div>
        <table style="width: 100%; border-collapse: collapse; background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px;">
          <tbody>
            ${documentsRows}
          </tbody>
        </table>
      </div>

      <!-- Section 3: Next Steps & Submission Guidance -->
      <div style="margin-top: 10px; background-color: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 8px 12px;">
        <div style="font-size: 11.5px; font-weight: 900; color: #166534; margin-bottom: 3px;">
          ३. पुढील पायऱ्या व अर्ज सादर करण्याचे ठिकाण (Next Steps & Where to Submit):
        </div>
        <ol style="margin: 0; padding-left: 18px; font-size: 10px; color: #14532d; font-weight: 600; line-height: 1.4;">
          <li>या पूर्व-अर्ज सारांशाची प्रिंट काढून खाली दिलेल्या रकान्यात अर्जदाराने स्वाक्षरी किंवा अंगठा करावा.</li>
          <li>वरील नमूद आवश्यक कागदपत्रांच्या झेरॉक्स प्रती सोबत जोडाव्यात.</li>
          <li>हा मसुदा घेऊन जवळच्या <strong>आपले सरकार सेवा केंद्र</strong>, <strong>ग्रामपंचायत कार्यालय</strong> किंवा अधिकृत पोर्टलवर जाऊन अर्ज सादर करावा.</li>
          <li>पोर्टल लिंक: <span style="font-family: monospace; color: #1e3a8a;">${scheme ? scheme.official_link : 'maharashtra.gov.in'}</span> वर जाऊन अधिकृत माहिती व अर्ज स्थिती तपासता येईल.</li>
          <li><strong>सुरक्षा सूचना:</strong> आपला आधार OTP, बँक पासवर्ड किंवा पिन कोणाशीही शेअर करू नका.</li>
        </ol>
      </div>

      <!-- Section 4: Applicant Signature & Receiving Desk Blocks -->
      <div style="margin-top: 10px; display: flex; gap: 12px;">
        <!-- Box A: Applicant Signature -->
        <div style="flex: 1; border: 1.5px dashed #94a3b8; border-radius: 8px; padding: 8px 10px; background: #fafafa;">
          <div style="font-size: 10.5px; font-weight: 800; color: #1e293b; text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
            अर्जदाराची स्वाक्षरी / अंगठा (Applicant's Signature)
          </div>
          <div style="height: 28px;"></div>
          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #64748b; font-weight: 700;">
            <span>दिनांक: ${dateStr}</span>
            <span>ठिकाण: ____________</span>
          </div>
        </div>

        <!-- Box B: Receiving Desk Counter -->
        <div style="flex: 1; border: 1.5px dashed #94a3b8; border-radius: 8px; padding: 8px 10px; background: #fafafa;">
          <div style="font-size: 10.5px; font-weight: 800; color: #1e293b; text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
            मदत केंद्र / अर्ज स्वीकृती नोंद (Receiving Desk Counter)
          </div>
          <div style="font-size: 9px; color: #64748b; margin-top: 4px;">नोंद क्र. (Inward No.): _______________</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">स्वीकारणाऱ्याची सही / शिक्का: _______________</div>
        </div>
      </div>

      <!-- Visible Footer Disclaimer (Mandatory) -->
      <div style="margin-top: 10px; padding: 7px 10px; background-color: #fef2f2; border: 1.5px solid #ef4444; border-radius: 6px; text-align: center;">
        <div style="font-size: 10.5px; font-weight: 900; color: #b91c1c; line-height: 1.4;">
          महत्त्वाची सूचना: ही सरकार मित्रने तयार केलेली पूर्व-अर्ज सारांश पत्रिका आहे. हा अधिकृत शासकीय दस्तऐवज नाही. कृपया अधिकृत पोर्टल किंवा कार्यालयात अर्ज सादर करा.
        </div>
        <div style="margin-top: 2px; font-size: 9px; color: #7f1d1d; font-weight: 600;">
          (Draft Pre-Application Summary created by Sarkar Mitra. This is NOT an official government document. Please submit your application on the official portal or office.)
        </div>
        <div style="margin-top: 2px; font-size: 8.5px; color: #64748b;">
          गोपनीयता सूचना: कोणताही आधार क्रमांक कायमस्वरूपी साठवला जात नाही. माहिती तारीख: ${verificationDate || (scheme ? scheme.last_verified_date : '2026')}.
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(printContainer);

  try {
    // Wait for fonts to settle
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Capture off-screen DOM into high-resolution canvas
    const canvas = await html2canvas(printContainer, {
      scale: 2, // 2x gives 300 DPI razor-sharp print quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Render image to fill page nicely
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));

    const schemeSlug = scheme?.id || 'arja';
    const filename = `Sarkar_Mitra_Pre_Application_Summary_${schemeSlug}_${Date.now()}.pdf`;

    pdf.save(filename);

    return {
      success: true,
      filename,
      refNumber
    };
  } catch (error) {
    console.error('PDF generation via html2canvas failed, falling back to window.print():', error);
    window.print();
    return {
      success: false,
      error
    };
  } finally {
    // Clean up temporary DOM element
    if (printContainer && printContainer.parentNode) {
      printContainer.parentNode.removeChild(printContainer);
    }
  }
}

export default {
  generateApplicationPDF
};
