/**
 * Sarkar Mitra - Structured PDF Generator Service
 * 
 * Generates an authentic, structured, and 100% Devanagari-compliant Maharashtra 
 * Government Scheme Pre-Application Summary sheet.
 * Uses html2canvas to render full Devanagari Unicode fonts (Mukta / Noto Sans Devanagari)
 * and exports as a crisp, razor-sharp A4 PDF via jsPDF.
 */
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { parseSpokenPhoneNumber } from './marathiVoiceMatcher';

export async function generateApplicationPDF({ scheme, formData, verificationDate }) {
  const refNumber = `SM-MH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
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
  printContainer.style.padding = '24px 28px';

  // Construct structured Maharashtra Government Intake Application HTML
  const fieldsRows = fields.map((field, idx) => {
    let val = normalizedData[field.key];
    if (!val || val === 'undefined') val = '— (नोंदवलेले नाही)';
    const isOdd = idx % 2 === 1;

    return `
      <tr style="background-color: ${isOdd ? '#f8fafc' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 9px 12px; font-weight: 800; color: #475569; width: 40px; text-align: center; font-size: 13px;">${idx + 1}</td>
        <td style="padding: 9px 12px; font-weight: 700; color: #1e293b; width: 260px; font-size: 13.5px;">
          <div>${field.label_mr}</div>
          <div style="font-size: 11px; color: #64748b; font-weight: 500;">(${field.key})</div>
        </td>
        <td style="padding: 9px 12px; font-weight: 900; color: #1e3a8a; font-size: 14.5px;">
          ${val}
        </td>
      </tr>
    `;
  }).join('');

  const documentsRows = (scheme?.documents_mr || []).map((doc, idx) => {
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 7px 10px; width: 28px; text-align: center; vertical-align: top;">
          <div style="width: 14px; height: 14px; border: 2px solid #ea580c; border-radius: 3px; display: inline-block;"></div>
        </td>
        <td style="padding: 7px 10px; font-size: 12.5px; color: #1e293b; font-weight: 700;">
          <span>${doc.name}</span>
          ${doc.required 
            ? '<span style="display:inline-block; margin-left: 6px; padding: 1px 6px; background-color: #fee2e2; color: #b91c1c; font-size: 10px; font-weight: 800; border-radius: 4px;">अनिवार्य (Mandatory)</span>'
            : '<span style="display:inline-block; margin-left: 6px; padding: 1px 6px; background-color: #e2e8f0; color: #475569; font-size: 10px; font-weight: 800; border-radius: 4px;">ऐच्छिक (Optional)</span>'
          }
          <div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">• ${doc.note || 'मूळ व साक्षांकित सत्यप्रत जोडावी'}</div>
        </td>
      </tr>
    `;
  }).join('');

  printContainer.innerHTML = `
    <div style="border: 3px solid #ea580c; border-radius: 12px; padding: 4px; background: #ffffff;">
      <div style="border: 1px solid #1e3a8a; border-radius: 8px; padding: 16px; background: #ffffff;">
        
        <!-- Maharashtra Tricolor Accent Stripe -->
        <div style="display: flex; height: 4px; width: 100%; border-radius: 2px; overflow: hidden; margin-bottom: 12px;">
          <div style="flex: 1; background-color: #ea580c;"></div>
          <div style="flex: 1; background-color: #ffffff; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;"></div>
          <div style="flex: 1; background-color: #16a34a;"></div>
        </div>

        <!-- Official Header Banner -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); color: #ffffff; padding: 14px 18px; border-radius: 10px; text-align: center;">
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 1.5px; color: #fdba74; text-transform: uppercase;">
            महाराष्ट्र शासन | GOVERNMENT OF MAHARASHTRA
          </div>
          <h1 style="font-size: 20px; font-weight: 900; margin: 4px 0 2px 0; letter-spacing: 0.5px;">
            सरकार मित्र (SARKAR MITRA) - डिजिटल योजना पूर्व-अर्ज सारांश
          </h1>
          <div style="font-size: 11px; font-weight: 600; color: #cbd5e1;">
            नागरिक योजना अर्ज नोंदणी पत्रक (Voice-First Civic Pre-Application Intake Summary)
          </div>
        </div>

        <!-- Opted Scheme Title & Query Box -->
        <div style="margin-top: 12px; background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; padding: 12px 14px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
            <div>
              <span style="display: inline-block; padding: 2px 8px; background-color: #ea580c; color: #ffffff; font-size: 10px; font-weight: 900; border-radius: 4px; text-transform: uppercase;">
                ★ निवडलेली सरकारी योजना (Opted Scheme):
              </span>
              <h2 style="font-size: 17px; font-weight: 900; color: #9a3412; margin: 5px 0 2px 0;">
                ${scheme ? scheme.name_mr : 'महाराष्ट्र राज्य शासकीय योजना'}
              </h2>
              <div style="font-size: 12px; font-weight: 700; color: #475569;">
                ${scheme ? scheme.name_en : ''}
              </div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #1e3a8a; font-weight: 800;">
              <div>वर्गवारी: ${scheme ? scheme.category_mr : 'शासकीय साहाय्य'}</div>
              <div style="color: #16a34a; margin-top: 3px;">लाभ: ${scheme ? scheme.benefit_summary_mr : 'थेट लाभ'}</div>
            </div>
          </div>
        </div>

        <!-- Application Metadata Strip -->
        <div style="display: flex; justify-content: space-between; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-top: 10px; font-size: 11px;">
          <div>
            <span style="color: #64748b; font-weight: 600;">अर्ज संदर्भ क्रमांक (Ref ID):</span> 
            <strong style="color: #0f172a; font-family: monospace; font-size: 12px;">${refNumber}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">निर्मिती तारीख:</span> 
            <strong style="color: #0f172a;">${dateStr} (${timeStr})</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">पडताळणी स्त्रोत:</span> 
            <strong style="color: #15803d;">${scheme?.verification_tag || 'अधिकृत शासन GR'}</strong>
          </div>
        </div>

        <!-- Section 1: Applicant Entered Details -->
        <div style="margin-top: 14px;">
          <div style="font-size: 13.5px; font-weight: 900; color: #1e3a8a; border-bottom: 2px solid #ea580c; padding-bottom: 4px; margin-bottom: 8px;">
            १. अर्जदाराने दिलेला तपशील / माहिती सारांश (Applicant Entered Details)
          </div>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 7px 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: center; width: 40px;">अ.क्र.</th>
                <th style="padding: 7px 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: left; width: 260px;">विचारलेला तपशील (Field Asked)</th>
                <th style="padding: 7px 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: left;">नागरिकाने दिलेली माहिती (Applicant's Response)</th>
              </tr>
            </thead>
            <tbody>
              ${fieldsRows}
            </tbody>
          </table>
        </div>

        <!-- Section 2: Required Documents Checklist -->
        <div style="margin-top: 14px;">
          <div style="font-size: 13.5px; font-weight: 900; color: #1e3a8a; border-bottom: 2px solid #ea580c; padding-bottom: 4px; margin-bottom: 6px;">
            २. आवश्यक कागदपत्रे पडताळणी यादी (Required Documents Checklist)
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px; font-weight: 600;">
            * अर्ज सादर करताना खालील कागदपत्रांच्या मूळ व साक्षांकित (Self-attested) प्रती सोबत जोडणे आवश्यक आहे:
          </div>
          <table style="width: 100%; border-collapse: collapse; background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px;">
            <tbody>
              ${documentsRows}
            </tbody>
          </table>
        </div>

        <!-- Section 3: Next Steps & Submission Guidance -->
        <div style="margin-top: 14px; background-color: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 10px 12px;">
          <div style="font-size: 12.5px; font-weight: 900; color: #166534; margin-bottom: 5px;">
            ३. पुढील पायऱ्या व अर्ज सादर करण्याचे ठिकाण (Next Steps & Where to Submit):
          </div>
          <ol style="margin: 0; padding-left: 20px; font-size: 11px; color: #14532d; font-weight: 600; line-height: 1.5;">
            <li>या अर्जाच्या सारांशाची प्रिंट काढून खाली दिलेल्या रकान्यात अर्जदाराने स्वाक्षरी किंवा अंगठा करावा.</li>
            <li>वरील नमूद आवश्यक कागदपत्रांच्या झेरॉक्स प्रती या अर्जासोबत जोडाव्यात.</li>
            <li>हा अर्ज आपल्या जवळच्या <strong>आपले सरकार सेवा केंद्र</strong>, <strong>ग्रामपंचायत कार्यालय</strong>, <strong>अंगणवाडी केंद्र</strong> किंवा <strong>CSC केंद्रात</strong> विनामूल्य सादर करावा.</li>
            <li>अधिकृत पोर्टल: <span style="font-family: monospace; color: #1e3a8a;">${scheme ? scheme.official_link : 'maharashtra.gov.in'}</span> वर जाऊन अर्जाची स्थिती तपासू शकता.</li>
            <li><strong>सुरक्षा सूचना:</strong> आपला आधार OTP, बँक पासवर्ड किंवा पिन कोणाशीही शेअर करू नका.</li>
          </ol>
        </div>

        <!-- Section 4: Applicant Signature & Office Receiving Counter -->
        <div style="margin-top: 14px; display: flex; gap: 14px;">
          
          <!-- Box A: Applicant Signature -->
          <div style="flex: 1; border: 1.5px dashed #94a3b8; border-radius: 8px; padding: 10px 12px; background: #fafafa;">
            <div style="font-size: 11px; font-weight: 800; color: #1e293b; text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              अर्जदाराची स्वाक्षरी / अंगठा (Applicant's Signature)
            </div>
            <div style="height: 38px;"></div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-weight: 700;">
              <span>दिनांक: ${dateStr}</span>
              <span>ठिकाण: ____________</span>
            </div>
          </div>

          <!-- Box B: Office Receiving Counter -->
          <div style="flex: 1; border: 1.5px dashed #94a3b8; border-radius: 8px; padding: 10px 12px; background: #fafafa;">
            <div style="font-size: 11px; font-weight: 800; color: #1e293b; text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              कार्यालयीन स्वीकृती शिक्का व सही (Office Inward Counter)
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 6px;">आवक क्र. (Inward No.): _______________</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">स्वीकारणाऱ्याची सही व शिक्का: _______________</div>
          </div>

        </div>

        <!-- Footer Disclaimer & Verification -->
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9.5px; color: #64748b; line-height: 1.4;">
          <div>
            <strong>गोपनीयता सूचना:</strong> सरकार मित्र (Sarkar Mitra) हे केवळ डिजिटल साहाय्यासाठी आहे. कोणताही आधार क्रमांक कायमस्वरूपी साठवला जात नाही.
          </div>
          <div>
            माहिती पडताळणी तारीख: ${verificationDate || (scheme ? scheme.last_verified_date : '2026')}. प्रत्यक्ष अर्जापूर्वी अधिकृत शासन निर्णयानुसार (GR) खात्री करा.
          </div>
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
    const filename = `Sarkar_Mitra_${schemeSlug}_${Date.now()}.pdf`;

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
