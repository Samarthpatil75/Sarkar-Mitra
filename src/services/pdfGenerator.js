/**
 * Sarkar Mitra - PDF Generator Service
 * Generates an accessible, clean civic application summary in the browser using jsPDF.
 */
import { jsPDF } from 'jspdf';

export function generateApplicationPDF({ scheme, formData, verificationDate }) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const refNumber = `SM-MH-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toLocaleDateString('mr-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Outer Border & Civic Header
    doc.setDrawColor(234, 88, 12); // Saffron
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 190, 277);

    // Header background banner
    doc.setFillColor(30, 58, 138); // Civic Navy Blue
    doc.rect(11, 11, 188, 25, 'F');

    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SARKAR MITRA (सरकार मित्र) - MAHARASHTRA CIVIC VOICE ASSISTANT', 105, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Citizen Scheme Pre-Application Summary (Digital Intake)', 105, 30, { align: 'center' });

    // Scheme Title Bar
    doc.setFillColor(254, 243, 199); // Warm saffron/amber tint
    doc.rect(12, 38, 186, 18, 'F');
    doc.setTextColor(154, 52, 18);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Scheme: ${scheme ? scheme.name_en : 'Maharashtra State Scheme'}`, 16, 47);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Local Name: ${scheme ? scheme.name_mr : ''}`, 16, 53);

    // Reference & Date Info
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Application Ref ID: ${refNumber}`, 16, 64);
    doc.text(`Date of Generation: ${dateStr}`, 130, 64);
    doc.text(`Verification Source: ${scheme ? scheme.verification_tag : 'Official Gov Portal'}`, 16, 70);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(16, 74, 194, 74);

    // Section 1: Applicant Information
    doc.setTextColor(15, 44, 89);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. APPLICANT ENTERED DETAILS / UTTAR SUMMARY', 16, 82);

    let startY = 92;
    doc.setFontSize(10);

    const fields = scheme && scheme.form_fields ? scheme.form_fields : [];
    fields.forEach((field, index) => {
      const val = formData[field.key] || 'Not specified';

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`${index + 1}. ${field.label_mr} (${field.key}):`, 20, startY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(2, 44, 34);
      doc.text(`${val}`, 110, startY);

      startY += 8;
    });

    startY += 6;
    doc.line(16, startY, 194, startY);
    startY += 10;

    // Section 2: Required Documents Checklist
    doc.setTextColor(15, 44, 89);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. REQUIRED DOCUMENTS CHECKLIST (KAGADPATRE)', 16, startY);
    startY += 8;

    if (scheme && scheme.documents_mr) {
      scheme.documents_mr.forEach((docItem, i) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(`[  ] ${i + 1}. ${docItem.name} ${docItem.required ? '(Mandatory / आवश्यक)' : '(Optional)'}`, 20, startY);
        startY += 7;
      });
    }

    startY += 8;
    doc.line(16, startY, 194, startY);
    startY += 10;

    // Section 3: How to Apply Next Steps
    doc.setTextColor(15, 44, 89);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. NEXT STEPS (PUDHIL PAYARI)', 16, startY);
    startY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9.5);
    const howToApplyLines = [
      '1. Take a printout of this summary sheet along with the required original documents.',
      '2. Visit your nearest Aaple Sarkar Seva Kendra / Gram Panchayat / Anganwadi or CSC center.',
      `3. Or apply online at the official portal: ${scheme ? scheme.official_link : 'maharashtra.gov.in'}.`,
      '4. Never share Aadhaar OTP with unauthorized persons.'
    ];

    howToApplyLines.forEach((line) => {
      doc.text(line, 20, startY);
      startY += 6;
    });

    // Privacy & Verification Disclaimer at the bottom
    doc.setFillColor(241, 245, 249);
    doc.rect(12, 255, 186, 28, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('DISCLAIMER & PRIVACY NOTICE:', 16, 261);
    doc.text(
      'Sarkar Mitra operates client-side for voice assistance. No sensitive identification (Aadhaar number) is permanently stored.',
      16, 266
    );
    doc.text(
      `Information verified as of: ${verificationDate || (scheme ? scheme.last_verified_date : '2026')}. Always verify figures against official GR.`,
      16, 271
    );
    doc.text(
      'Developed for Maharashtra Citizens. Voice-First Civic Inclusion Initiative.',
      16, 276
    );

    // Save PDF
    const filename = `Sarkar_Mitra_Arja_${scheme ? scheme.id : 'form'}_${Date.now()}.pdf`;
    doc.save(filename);
    return { success: true, filename, refNumber };
  } catch (error) {
    console.error('PDF Generation failed, fallback to print:', error);
    // Graceful fallback to browser print
    window.print();
    return { success: false, error };
  }
}
