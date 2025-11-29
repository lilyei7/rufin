import jsPDF from 'jspdf';

export interface ContractPDFData {
  contractNumber: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  companyName: string;
  companyLicense?: string;
  companyPhone?: string;
  companyEmail?: string;
  contractorName?: string;
  address?: string;
  scope: string[];
  paymentTerms?: string;
  totalAmount: number;
  currency?: string;
  signatureImage: string;
  signedDate: string;
  initialsImage?: string;
  content: string;
}

export async function generateContractPDF(data: ContractPDFData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  let yPosition = margin;

  // Header con logo y paleta del sistema
  doc.setFillColor(18, 19, 19); // #121313 - Negro sistema
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Título
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(234, 184, 57); // #EAB839 - Oro sistema
  doc.text('RUFIN - Sistema de Gestión', margin + 5, 15);

  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text('Contrato de Servicios Profesionales', margin + 5, 28);

  yPosition = 50;

  // Información de la empresa
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(18, 19, 19);
  doc.text('Información de la Empresa', margin, yPosition);
  yPosition += 8;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  const companyInfo = [
    `Empresa: ${data.companyName}`,
    `License: ${data.companyLicense || 'N/A'}`,
    `Teléfono: ${data.companyPhone || 'N/A'}`,
    `Email: ${data.companyEmail || 'N/A'}`
  ];

  companyInfo.forEach((info) => {
    doc.text(info, margin + 5, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // Detalles del Contrato
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Detalles del Contrato', margin, yPosition);
  yPosition += 8;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  const contractDetails = [
    `Número de Contrato: ${data.contractNumber}`,
    `Título: ${data.title}`,
    `Cliente: ${data.clientName}`,
    `Email del Cliente: ${data.clientEmail || 'N/A'}`,
    `Monto Total: ${data.currency || 'USD'} $${data.totalAmount.toFixed(2)}`,
    `Fecha de Firma: ${data.signedDate}`
  ];

  contractDetails.forEach((detail) => {
    doc.text(detail, margin + 5, yPosition);
    yPosition += 6;
  });

  yPosition += 8;

  // Alcance de Trabajo
  if (data.scope && data.scope.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Alcance del Trabajo', margin, yPosition);
    yPosition += 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    data.scope.forEach((item) => {
      const splitText = doc.splitTextToSize(`• ${item}`, contentWidth - 10);
      doc.text(splitText, margin + 5, yPosition);
      yPosition += splitText.length * 5 + 2;
    });

    yPosition += 5;
  }

  // Términos de Pago
  if (data.paymentTerms) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Términos de Pago', margin, yPosition);
    yPosition += 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    const splitTerms = doc.splitTextToSize(data.paymentTerms, contentWidth - 10);
    doc.text(splitTerms, margin + 5, yPosition);
    yPosition += splitTerms.length * 5 + 5;
  }

  // Contenido principal del contrato
  if (data.content) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Términos y Condiciones', margin, yPosition);
    yPosition += 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    const splitContent = doc.splitTextToSize(data.content, contentWidth - 10);
    
    splitContent.forEach((line: string) => {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin + 5, yPosition);
      yPosition += 5;
    });
  }

  // Nueva página para firmas
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = margin;
  } else {
    yPosition += 15;
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(234, 184, 57); // Oro para el título de firmas
  doc.text('Firmas y Aprobación', margin, yPosition);
  doc.setTextColor(18, 19, 19); // Volver al negro
  yPosition += 15;

  // Sección de firma del cliente
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Firma del Cliente:', margin, yPosition);
  yPosition += 8;

  try {
    if (data.signatureImage) {
      doc.addImage(data.signatureImage, 'PNG', margin, yPosition, 60, 30);
    }
  } catch (error) {
    console.error('Error adding signature image:', error);
  }

  yPosition += 35;
  doc.text('_________________________________', margin, yPosition);
  yPosition += 8;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Firma de ${data.clientName}`, margin, yPosition);

  // Detalles adicionales
  yPosition += 10;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha de firma: ${data.signedDate}`, margin, yPosition);

  // Footer
  yPosition = pageHeight - 15;
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Este documento fue firmado digitalmente y es válido legalmente.', margin, yPosition);

  // Descargar PDF
  doc.save(`${data.contractNumber}-${data.clientName}.pdf`);
}

export function downloadPDF(data: ContractPDFData): void {
  generateContractPDF(data).catch((error) => {
    console.error('Error generating PDF:', error);
    alert('Error al generar el PDF');
  });
}
