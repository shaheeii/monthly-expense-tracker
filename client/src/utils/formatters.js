// Format currency for UI display (Indian Rupee with symbol)
// Uses minimumFractionDigits: 0 and maximumFractionDigits: 2 so whole numbers display as ₹5,000
// while preserving decimal precision like ₹5,000.75 without truncation
export const formatRupee = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const rounded = Math.round(Number(amount) * 100) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(rounded);
};

// Safe ASCII currency formatter for PDF and CSV export (avoids font corruption errors)
export const formatSafeCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rs. 0';
  const rounded = Math.round(Number(amount) * 100) / 100;
  return `Rs. ${rounded.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Raw amount without symbol
export const formatAmountOnly = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  const rounded = Math.round(Number(amount) * 100) / 100;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(rounded);
};

// Format month key "YYYY-MM" to "Month YYYY"
export const formatMonthDisplay = (monthStr) => {
  if (!monthStr || !monthStr.includes('-')) return '';
  const [year, month] = monthStr.split('-');
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (isNaN(y) || isNaN(m)) return monthStr;
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Convert Date to YYYY-MM-DD
export const toDateInputString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Convert YYYY-MM-DD to DD-MM-YYYY (e.g., 31-10-2026)
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
  }
  return dateStr;
};

// Helper to compute summary directly from transaction records if summary object is missing or 0
function reconcileSummary(transactions = [], summary = {}) {
  let totalIncome = Number(summary?.totalIncome ?? 0);
  let totalSpent = Number(summary?.totalSpent ?? 0);

  if (totalIncome === 0 && totalSpent === 0 && transactions.length > 0) {
    transactions.forEach((t) => {
      const a = Number(t.amount) || 0;
      if (t.type === 'income') totalIncome += a;
      else totalSpent += a;
    });
  }

  totalIncome = Math.round(totalIncome * 100) / 100;
  totalSpent = Math.round(totalSpent * 100) / 100;
  const netProfit = Math.round((totalIncome - totalSpent) * 100) / 100;
  const savingsRate = totalIncome > 0 ? Math.round((Math.max(0, netProfit) / totalIncome) * 100) : 0;

  return { totalIncome, totalSpent, netProfit, savingsRate };
}

// Clean, Professional CSV Export (Clean Monochrome Data, Excel-compatible UTF-8 BOM)
export const exportToCSV = ({ transactions = [], monthStr = '', summary = {}, budgetLimit = 0, user = null }) => {
  if (!transactions || transactions.length === 0) {
    alert('No transactions recorded for this month to export.');
    return;
  }

  const monthTitle = formatMonthDisplay(monthStr) || monthStr;
  const userName = user?.name ? user.name : 'Personal Account';
  const userEmail = user?.email ? user.email : '';
  const now = new Date();
  const nowStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const { totalIncome, totalSpent, netProfit, savingsRate } = reconcileSummary(transactions, summary);
  const isProfit = netProfit >= 0;

  const lines = [
    `"MONTHLY FINANCIAL STATEMENT - ${monthTitle}"`,
    `"Account Holder:","${userName} ${userEmail ? `<${userEmail}>` : ''}"`,
    `"Statement Period:","${monthTitle}"`,
    `"Generated On:","${nowStr}"`,
    ``,
    `"=== FINANCIAL SUMMARY ==="`,
    `"Metric","Amount (INR)","Status / Details"`,
    `"Total Monthly Income",${totalIncome},"Total Inflow"`,
    `"Total Monthly Expenses",${totalSpent},"Total Outflow"`,
    `"Net Monthly Balance",${netProfit},"${isProfit ? 'NET PROFIT (Surplus)' : 'NET LOSS (Deficit)'}"`,
    `"Monthly Budget Target",${budgetLimit > 0 ? budgetLimit : 'None'},"${budgetLimit > 0 ? (totalSpent > budgetLimit ? 'OVER BUDGET' : 'Within Budget') : 'Not Set'}"`,
    `"Savings Rate","${savingsRate}%","Percentage of total income retained"`,
    `"Total Transactions Recorded",${transactions.length},""`,
    ``,
    `"=== ITEMIZED TRANSACTION RECORDS ==="`,
    `"No.","Date (DD-MM-YYYY)","Type","Category","Amount (INR)","Notes"`
  ];

  transactions.forEach((t, index) => {
    const formattedDate = formatDisplayDate(t.date);
    const typeStr = t.type ? t.type.toUpperCase() : 'EXPENSE';
    const cleanCat = (t.category || 'Other').replace(/"/g, '""');
    const cleanNote = (t.note || '').replace(/"/g, '""');
    lines.push(`${index + 1},"${formattedDate}","${typeStr}","${cleanCat}",${t.amount},"${cleanNote}"`);
  });

  // Category Breakdown Section
  if (summary?.categoryBreakdown && Object.keys(summary.categoryBreakdown).length > 0) {
    lines.push(``);
    lines.push(`"=== EXPENSE CATEGORY BREAKDOWN ==="`);
    lines.push(`"Category","Spent (INR)","Share of Total Expenses (%)"`);
    Object.entries(summary.categoryBreakdown).forEach(([cat, amt]) => {
      const share = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
      lines.push(`"${cat.replace(/"/g, '""')}",${amt},"${share}%"`);
    });
  }

  // Final Reconciliation
  lines.push(``);
  lines.push(`"=== FINAL RECONCILIATION ==="`);
  lines.push(`"Total Inflow",${totalIncome}`);
  lines.push(`"Total Outflow",${totalSpent}`);
  lines.push(`"Net Result","${isProfit ? 'NET PROFIT: +' : 'NET LOSS: -'}${Math.abs(netProfit)} INR"`);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Financial_Statement_${monthStr || 'Month'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Ultra-Clean, Professional Black & White PDF Financial Statement
// Standard ASCII encoding ensures 100% compatibility across all PDF readers (no corruption or open errors)
export const exportToPDF = ({ transactions = [], monthStr = '', summary = {}, budgetLimit = 0, user = null }) => {
  if (!transactions || transactions.length === 0) {
    alert('No transactions recorded for this month to generate a PDF report.');
    return;
  }

  if (typeof window.jspdf?.jsPDF !== 'function') {
    alert('PDF generator library is loading, please try again in a moment.');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 16;

    const { totalIncome, totalSpent, netProfit, savingsRate } = reconcileSummary(transactions, summary);
    const isProfit = netProfit >= 0;
    const absNet = Math.abs(netProfit);

    const monthTitle = formatMonthDisplay(monthStr) || monthStr;
    const userName = user?.name ? user.name : 'Personal Account';
    const userEmail = user?.email ? user.email : '';
    const now = new Date();
    const generatedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Top Document Header (Minimalist Monochrome)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + contentWidth, y);
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.text('MONTHLY FINANCIAL STATEMENT', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`Statement Period: ${monthTitle}`, margin, y + 5.5);

    // Right-aligned Account & Generation info
    doc.text(`Account: ${userName}${userEmail ? ` (${userEmail})` : ''}`, pageWidth - margin, y, { align: 'right' });
    doc.text(`Generated: ${generatedDate}`, pageWidth - margin, y + 5.5, { align: 'right' });

    y += 12;
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    // 2. Executive Summary Box (Crisp Black & White)
    const boxHeight = 26;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(margin, y, contentWidth, boxHeight, 'FD');

    // 3 Columns inside box
    const colWidth = contentWidth / 3;

    // Col 1: Total Income
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('TOTAL INFLOW (INCOME)', margin + 4, y + 6);
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(formatSafeCurrency(totalIncome), margin + 4, y + 14);

    // Col 2: Total Spent
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('TOTAL OUTFLOW (EXPENSES)', margin + colWidth + 4, y + 6);
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(formatSafeCurrency(totalSpent), margin + colWidth + 4, y + 14);

    // Col 3: Net Monthly Profit / Loss
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('NET MONTHLY BALANCE', margin + colWidth * 2 + 4, y + 6);
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    const netPrefix = isProfit ? '+ ' : '- ';
    doc.text(`${netPrefix}${formatSafeCurrency(absNet)}`, margin + colWidth * 2 + 4, y + 14);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(isProfit ? '[ NET PROFIT - SURPLUS ]' : '[ NET LOSS - DEFICIT ]', margin + colWidth * 2 + 4, y + 21);

    // Secondary line inside box
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    const budgetStatus = budgetLimit > 0
      ? `Budget Target: ${formatSafeCurrency(budgetLimit)} (${totalSpent > budgetLimit ? 'OVER BUDGET' : 'Within Budget'})`
      : 'Budget Target: Not Set';
    doc.text(`${budgetStatus}  |  Savings Rate: ${savingsRate}%`, margin + 4, y + 21);

    y += boxHeight + 8;

    // 3. Transactions Section Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('ITEMIZED TRANSACTION RECORDS', margin, y);
    y += 3;

    // Check if autoTable is available
    if (typeof doc.autoTable === 'function') {
      const tableRows = transactions.map((t, idx) => {
        const isInc = t.type === 'income';
        const safeAmt = `${isInc ? '+' : '-'}${formatSafeCurrency(t.amount)}`;
        return [
          String(idx + 1),
          formatDisplayDate(t.date),
          isInc ? 'INCOME' : 'EXPENSE',
          String(t.category || 'Other'),
          String(t.note || '-'),
          safeAmt
        ];
      });

      doc.autoTable({
        startY: y,
        head: [['#', 'Date', 'Type', 'Category', 'Description / Notes', 'Amount']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left'
        },
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 2.2,
          textColor: [20, 20, 20],
          lineColor: [220, 220, 220],
          lineWidth: 0.15
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 26 },
          2: { cellWidth: 22, fontStyle: 'bold' },
          3: { cellWidth: 32 },
          4: { cellWidth: 'auto' },
          5: { cellWidth: 34, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });

      y = doc.lastAutoTable.finalY + 8;
    } else {
      // Clean Manual Monochrome Table (Zero external dependency fallback)
      const rowHeight = 6.2;
      const headerHeight = 7;

      // Table Header
      doc.setFillColor(0, 0, 0);
      doc.rect(margin, y, contentWidth, headerHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('#', margin + 2, y + 4.8);
      doc.text('Date', margin + 10, y + 4.8);
      doc.text('Type', margin + 35, y + 4.8);
      doc.text('Category', margin + 60, y + 4.8);
      doc.text('Description', margin + 96, y + 4.8);
      doc.text('Amount (INR)', pageWidth - margin - 3, y + 4.8, { align: 'right' });
      y += headerHeight;

      // Table Body
      transactions.forEach((t, i) => {
        if (y + rowHeight > pageHeight - 22) {
          doc.addPage();
          y = 16;
        }

        const isEven = i % 2 === 0;
        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 248, isEven ? 255 : 248);
        doc.setDrawColor(225, 225, 225);
        doc.setLineWidth(0.15);
        doc.rect(margin, y, contentWidth, rowHeight, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 30, 30);

        doc.text(String(i + 1), margin + 2, y + 4.4);
        doc.text(formatDisplayDate(t.date), margin + 10, y + 4.4);

        const isInc = t.type === 'income';
        doc.setFont('helvetica', 'bold');
        doc.text(isInc ? 'INCOME' : 'EXPENSE', margin + 35, y + 4.4);

        doc.setFont('helvetica', 'normal');
        doc.text(String(t.category || 'Other').slice(0, 16), margin + 60, y + 4.4);
        doc.text(String(t.note || '-').slice(0, 32), margin + 96, y + 4.4);

        doc.setFont('helvetica', 'bold');
        const safeAmt = `${isInc ? '+' : '-'}${formatSafeCurrency(t.amount)}`;
        doc.text(safeAmt, pageWidth - margin - 3, y + 4.4, { align: 'right' });

        y += rowHeight;
      });

      y += 6;
    }

    // 4. Monthly Financial Reconciliation Summary Box (Monochrome)
    if (y + 24 > pageHeight - 16) {
      doc.addPage();
      y = 16;
    }

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, contentWidth, 20, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text('MONTHLY FINANCIAL RECONCILIATION SUMMARY', margin + 5, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`Total Recorded Inflow: ${formatSafeCurrency(totalIncome)}   |   Total Recorded Outflow: ${formatSafeCurrency(totalSpent)}`, margin + 5, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    const finalLabel = isProfit
      ? `NET MONTHLY PROFIT: +${formatSafeCurrency(absNet)}`
      : `NET MONTHLY DEFICIT: -${formatSafeCurrency(absNet)}`;
    doc.text(finalLabel, pageWidth - margin - 5, y + 13, { align: 'right' });

    // 5. Global Clean Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text('Monthly Expense Tracker  |  Official Financial Statement', margin, pageHeight - 6.5);
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
    }

    doc.save(`Monthly_Statement_${monthStr || 'Report'}.pdf`);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('An error occurred while generating the PDF statement: ' + error.message);
  }
};
