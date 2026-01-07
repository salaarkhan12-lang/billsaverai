// Export utilities for BillSaver AI
// Handles PDF, Excel, CSV, and print exports

import type { AnalysisResult } from "./billing-rules";
import { jsPDF } from "jspdf";

// Generate CSV content from analysis result
export function generateCSV(result: AnalysisResult, fileName: string): string {
  const timestamp = new Date().toLocaleString();
  
  let csv = "BillSaver AI - Documentation Analysis Report\n";
  csv += `File: ${fileName}\n`;
  csv += `Generated: ${timestamp}\n\n`;
  
  // Summary section
  csv += "SUMMARY\n";
  csv += `Overall Score,${result.overallScore}\n`;
  csv += `Documentation Level,${result.documentationLevel}\n`;
  csv += `Current E/M Level,${result.currentEMLevel}\n`;
  csv += `Suggested E/M Level,${result.suggestedEMLevel}\n`;
  csv += `MDM Complexity,${result.mdmComplexity}\n`;
  csv += `Time Documented,${result.timeDocumented ? "Yes" : "No"}\n`;
  csv += `MEAT Criteria Met,${result.meatCriteriaMet ? "Yes" : "No"}\n`;
  csv += `Total Potential Revenue Loss,${result.totalPotentialRevenueLoss}\n\n`;
  
  // Gaps section
  csv += "DOCUMENTATION GAPS\n";
  csv += "Category,Title,Description,Impact,Recommendation,Potential Loss,CPT Codes,ICD Codes\n";
  
  result.gaps.forEach((gap) => {
    const cptCodes = gap.cptCodes?.join("; ") || "";
    const icdCodes = gap.icdCodes?.join("; ") || "";
    
    csv += `"${gap.category}","${gap.title}","${gap.description.replace(/"/g, '""')}","${gap.impact.replace(/"/g, '""')}","${gap.recommendation.replace(/"/g, '""')}","${gap.potentialRevenueLoss}","${cptCodes}","${icdCodes}"\n`;
  });
  
  // Strengths section
  if (result.strengths.length > 0) {
    csv += "\nDOCUMENTATION STRENGTHS\n";
    result.strengths.forEach((strength) => {
      csv += `"${strength}"\n`;
    });
  }
  
  return csv;
}

// Download CSV file
export function downloadCSV(result: AnalysisResult, fileName: string): void {
  try {
    const csv = generateCSV(result, fileName);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `billsaver-analysis-${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error("Failed to download CSV:", error);
    throw new Error("Failed to export CSV file");
  }
}

// Generate HTML report for printing or PDF conversion
export function generateHTMLReport(result: AnalysisResult, fileName: string): string {
  const timestamp = new Date().toLocaleString();
  
  const severityColors: Record<string, string> = {
    critical: "#ef4444",
    major: "#f97316",
    moderate: "#eab308",
    minor: "#3b82f6",
  };
  
  const levelColors: Record<string, string> = {
    Excellent: "#10b981",
    Good: "#22c55e",
    Fair: "#eab308",
    Poor: "#f97316",
    Critical: "#ef4444",
  };
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BillSaver AI - Analysis Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
      padding: 40px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #6366f1;
    }
    
    .header h1 {
      font-size: 36px;
      color: #6366f1;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      font-size: 18px;
      color: #6b7280;
    }
    
    .meta-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    
    .meta-info div {
      display: flex;
      justify-content: space-between;
    }
    
    .meta-info strong {
      color: #374151;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .summary-card {
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
    }
    
    .summary-card h3 {
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .summary-card .label {
      font-size: 14px;
      color: #6b7280;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      font-size: 24px;
      color: #111827;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .gap-card {
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .gap-header {
      display: flex;
      align-items: start;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .gap-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: white;
    }
    
    .gap-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .gap-revenue {
      font-size: 20px;
      font-weight: bold;
      color: #ef4444;
    }
    
    .gap-content {
      margin-top: 16px;
    }
    
    .gap-section {
      margin-bottom: 16px;
    }
    
    .gap-section-title {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .gap-section-content {
      color: #374151;
      line-height: 1.6;
    }
    
    .code-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    
    .code-badge {
      padding: 4px 12px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 12px;
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }
    
    .strengths-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .strength-item {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 12px 16px;
      color: #166534;
      font-size: 14px;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .gap-card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BillSaver AI</h1>
      <div class="subtitle">Medical Documentation Analysis Report</div>
    </div>
    
    <div class="meta-info">
      <div>
        <strong>Document:</strong>
        <span>${fileName}</span>
      </div>
      <div>
        <strong>Generated:</strong>
        <span>${timestamp}</span>
      </div>
    </div>
    
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Overall Score</h3>
        <div class="value" style="color: ${levelColors[result.documentationLevel]}">${result.overallScore}</div>
        <div class="label">${result.documentationLevel} Documentation</div>
      </div>
      
      <div class="summary-card">
        <h3>E/M Level</h3>
        <div class="value" style="color: #6366f1">${result.currentEMLevel}</div>
        <div class="label">Current Support</div>
        ${result.potentialUpcodeOpportunity ? `
          <div style="margin-top: 12px; padding: 8px; background: #dcfce7; border-radius: 6px; color: #166534; font-size: 12px;">
            Potential: ${result.suggestedEMLevel}
          </div>
        ` : ''}
      </div>
      
      <div class="summary-card">
        <h3>Revenue Impact</h3>
        <div class="value" style="color: #ef4444">${result.totalPotentialRevenueLoss}</div>
        <div class="label">Potential Loss</div>
      </div>
    </div>
    
    <div class="section">
      <h2>Key Metrics</h2>
      <div class="meta-info">
        <div>
          <strong>MDM Complexity:</strong>
          <span>${result.mdmComplexity}</span>
        </div>
        <div>
          <strong>Time Documented:</strong>
          <span>${result.timeDocumented ? "✓ Yes" : "✗ No"}</span>
        </div>
        <div>
          <strong>MEAT Criteria:</strong>
          <span>${result.meatCriteriaMet ? "✓ Met" : "✗ Not Met"}</span>
        </div>
        <div>
          <strong>Total Gaps:</strong>
          <span>${result.gaps.length}</span>
        </div>
      </div>
    </div>
    
    ${result.strengths.length > 0 ? `
      <div class="section">
        <h2>Documentation Strengths</h2>
        <div class="strengths-list">
          ${result.strengths.map(strength => `
            <div class="strength-item">✓ ${strength}</div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    <div class="section">
      <h2>Documentation Gaps (${result.gaps.length})</h2>
      ${result.gaps.map(gap => `
        <div class="gap-card">
          <div class="gap-header">
            <div style="flex: 1;">
              <div class="gap-badge" style="background-color: ${severityColors[gap.category]}">
                ${gap.category}
              </div>
              <div class="gap-title">${gap.title}</div>
            </div>
            <div class="gap-revenue">${gap.potentialRevenueLoss}</div>
          </div>
          
          <div class="gap-content">
            <div class="gap-section">
              <div class="gap-section-title">Description</div>
              <div class="gap-section-content">${gap.description}</div>
            </div>
            
            <div class="gap-section">
              <div class="gap-section-title">Impact</div>
              <div class="gap-section-content">${gap.impact}</div>
            </div>
            
            <div class="gap-section">
              <div class="gap-section-title">Recommendation</div>
              <div class="gap-section-content">${gap.recommendation}</div>
            </div>
            
            ${gap.cptCodes && gap.cptCodes.length > 0 ? `
              <div class="gap-section">
                <div class="gap-section-title">Related CPT Codes</div>
                <div class="code-list">
                  ${gap.cptCodes.map(code => `<span class="code-badge">${code}</span>`).join('')}
                </div>
              </div>
            ` : ''}
            
            ${gap.icdCodes && gap.icdCodes.length > 0 ? `
              <div class="gap-section">
                <div class="gap-section-title">Related ICD-10 Codes</div>
                <div class="code-list">
                  ${gap.icdCodes.map(code => `<span class="code-badge">${code}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      <p>Generated by BillSaver AI - Intelligent Medical Billing Analysis</p>
      <p>This report is for internal use only and should be reviewed by qualified billing professionals.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Print report
export function printReport(result: AnalysisResult, fileName: string): void {
  try {
    const html = generateHTMLReport(result, fileName);
    const printWindow = window.open("", "_blank");
    
    if (!printWindow) {
      throw new Error("Failed to open print window. Please check your popup blocker settings.");
    }
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
    };
  } catch (error) {
    console.error("Failed to print report:", error);
    throw new Error("Failed to open print dialog");
  }
}

// Download HTML report
export function downloadHTMLReport(result: AnalysisResult, fileName: string): void {
  try {
    const html = generateHTMLReport(result, fileName);
    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `billsaver-report-${Date.now()}.html`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error("Failed to download HTML report:", error);
    throw new Error("Failed to export HTML report");
  }
}

// Copy report summary to clipboard
export async function copyToClipboard(result: AnalysisResult, fileName: string): Promise<void> {
  const timestamp = new Date().toLocaleString();

  let text = `BillSaver AI - Documentation Analysis Report\n`;
  text += `${"=".repeat(50)}\n\n`;
  text += `File: ${fileName}\n`;
  text += `Generated: ${timestamp}\n\n`;

  text += `SUMMARY\n`;
  text += `${"-".repeat(50)}\n`;
  text += `Overall Score: ${result.overallScore}/100 (${result.documentationLevel})\n`;
  text += `Current E/M Level: ${result.currentEMLevel}\n`;
  text += `Suggested E/M Level: ${result.suggestedEMLevel}\n`;
  text += `MDM Complexity: ${result.mdmComplexity}\n`;
  text += `Potential Revenue Loss: ${result.totalPotentialRevenueLoss}\n\n`;

  text += `DOCUMENTATION GAPS (${result.gaps.length})\n`;
  text += `${"-".repeat(50)}\n`;
  result.gaps.forEach((gap, index) => {
    text += `\n${index + 1}. [${gap.category.toUpperCase()}] ${gap.title}\n`;
    text += `   Impact: ${gap.potentialRevenueLoss}\n`;
    text += `   ${gap.description}\n`;
  });

  if (result.strengths.length > 0) {
    text += `\n\nSTRENGTHS\n`;
    text += `${"-".repeat(50)}\n`;
    result.strengths.forEach((strength, index) => {
      text += `${index + 1}. ${strength}\n`;
    });
  }

  await navigator.clipboard.writeText(text);
}

// Generate PDF report using jsPDF
export function generatePDFReport(result: AnalysisResult, fileName: string): void {
  try {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BillSaver AI - Analysis Report", 20, yPosition);
    yPosition += 15;

    // Metadata
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Document: ${fileName}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Generated: ${timestamp}`, 20, yPosition);
    yPosition += 15;

    // Summary Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Overall Score: ${result.overallScore}/100 (${result.documentationLevel})`, 20, yPosition);
    yPosition += 8;
    doc.text(`Current E/M Level: ${result.currentEMLevel}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Suggested E/M Level: ${result.suggestedEMLevel}`, 20, yPosition);
    yPosition += 8;
    doc.text(`MDM Complexity: ${result.mdmComplexity}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Time Documented: ${result.timeDocumented ? "Yes" : "No"}`, 20, yPosition);
    yPosition += 8;
    doc.text(`MEAT Criteria Met: ${result.meatCriteriaMet ? "Yes" : "No"}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Potential Revenue Loss: ${result.totalPotentialRevenueLoss}`, 20, yPosition);
    yPosition += 15;

    // Strengths Section
    if (result.strengths.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DOCUMENTATION STRENGTHS", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      result.strengths.forEach((strength, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${index + 1}. ${strength}`, 20, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Gaps Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`DOCUMENTATION GAPS (${result.gaps.length})`, 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    result.gaps.forEach((gap, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. [${gap.category.toUpperCase()}] ${gap.title}`, 20, yPosition);
      yPosition += 8;

      doc.setFont("helvetica", "normal");
      doc.text(`Impact: ${gap.potentialRevenueLoss}`, 30, yPosition);
      yPosition += 8;

      // Split description into lines
      const descriptionLines = doc.splitTextToSize(gap.description, 150);
      descriptionLines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 30, yPosition);
        yPosition += 6;
      });
      yPosition += 8;

      // Recommendation
      const recommendationLines = doc.splitTextToSize(gap.recommendation, 150);
      doc.setFont("helvetica", "italic");
      recommendationLines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 30, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Generated by BillSaver AI - Intelligent Medical Billing Analysis",
        20,
        285
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        170,
        285
      );
    }

    // Save the PDF
    doc.save(`billsaver-analysis-${Date.now()}.pdf`);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    throw new Error("Failed to generate PDF report");
  }
}
