'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import PDFDocument from 'pdfkit';

/**
 * Generates an in-memory PDF buffer using PDFKit
 */
async function buildSettlementPdfBuffer(data: {
  dealId: string;
  disputedAt: string;
  resolvedAt: string;
  companyAName: string;
  companyBName: string;
  disputeReason: string;
  resolutionType: string;
  arbitratorNotes: string;
  evidenceFiles: { fileName: string; createdAt: string }[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Uint8Array[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // --- Header ---
    doc
      .fillColor('#0f172a')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('OFFICIAL SETTLEMENT SUMMARY', { align: 'left' })
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(`TradeIt Escrow & Dispute Resolution Engine — tradeit.tv`, { align: 'left' })
      .moveDown(0.5);

    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // --- Metadata Block ---
    doc
      .fillColor('#0f172a')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('1. Case Overview')
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#334155')
      .text(`Deal ID: ${data.dealId}`)
      .text(`Company A: ${data.companyAName}`)
      .text(`Company B: ${data.companyBName}`)
      .text(`Dispute Date: ${new Date(data.disputedAt).toLocaleString()}`)
      .text(`Resolution Date: ${new Date(data.resolvedAt).toLocaleString()}`)
      .moveDown(1);

    // --- Dispute Claim ---
    doc
      .fillColor('#0f172a')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('2. Dispute Grounds & Claim')
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#334155')
      .text(data.disputeReason || 'No specific claim reason provided.')
      .moveDown(1);

    // --- Arbitrator Determination ---
    doc
      .fillColor('#0f172a')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('3. Arbitrator Determination')
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#0284c7')
      .text(`Outcome: ${data.resolutionType}`)
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#334155')
      .text(`Arbitrator Findings & Notes:\n${data.arbitratorNotes || 'No notes provided.'}`)
      .moveDown(1);

    // --- Evidence Log ---
    doc
      .fillColor('#0f172a')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('4. Evidence & Attachments Manifest')
      .moveDown(0.5);

    if (data.evidenceFiles.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('No evidence documents were submitted.');
    } else {
      data.evidenceFiles.forEach((file, index) => {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#334155')
          .text(`${index + 1}. ${file.fileName} (Uploaded: ${new Date(file.createdAt).toLocaleDateString()})`);
      });
    }

    doc.moveDown(2);

    // --- Legal Footer ---
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc
      .fontSize(8)
      .font('Helvetica-Oblique')
      .fillColor('#94a3b8')
      .text(
        'This electronic document serves as an immutable binding settlement certificate under the TradeIt Escrow Master Services Agreement.',
        { align: 'center' }
      );

    doc.end();
  });
}

/**
 * Server Action: Generates, uploads, and provides a download URL for a settlement PDF report
 */
export async function generateSettlementReportAction(dealId: string): Promise<{
  success: boolean;
  downloadUrl?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized.' };
    }

    // 1. Fetch deal & dispute details using supabaseAdmin
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('barter_deals')
      .select(`
        *,
        company_a:company_a_id(name),
        company_b:company_b_id(name)
      `)
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return { success: false, error: 'Deal record not found.' };
    }

    // 2. Fetch associated evidence list
    const { data: evidence } = await supabaseAdmin
      .from('dispute_evidence')
      .select('file_name, created_at')
      .eq('deal_id', dealId);

    // 3. Render PDF Buffer
    const pdfBuffer = await buildSettlementPdfBuffer({
      dealId: deal.id,
      disputedAt: deal.disputed_at || deal.created_at,
      resolvedAt: deal.updated_at || new Date().toISOString(),
      companyAName: deal.company_a?.name || 'Company A',
      companyBName: deal.company_b?.name || 'Company B',
      disputeReason: deal.dispute_reason,
      resolutionType: deal.status || 'RESOLVED',
      arbitratorNotes: deal.arbitrator_notes || 'Settled as per dispute terms.',
      evidenceFiles: (evidence || []).map((e) => ({
        fileName: e.file_name,
        createdAt: e.created_at,
      })),
    });

    // 4. Upload PDF to private Supabase Storage bucket
    const storagePath = `${dealId}/settlement_summary_${Date.now()}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('settlement-reports')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // 5. Generate signed download URL (valid for 1 hour)
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('settlement-reports')
      .createSignedUrl(storagePath, 3600);

    if (signedError || !signedData) {
      return { success: false, error: 'Failed to generate download link.' };
    }

    return { success: true, downloadUrl: signedData.signedUrl };
  } catch (err: any) {
    console.error('PDF Generation Error:', err);
    return { success: false, error: err.message || 'Failed to generate PDF settlement summary.' };
  }
}