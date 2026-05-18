import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a professional invoice PDF for a sales order
 * @param {Object} order - The sales order object with items and customer info
 */
export const generateInvoice = (order) => {
  if (!order) return;
  
  const doc = new jsPDF();
  const companyName = "ANTIGRAVITY SALES LTD";
  const companyAddress = "123 Business Road, Tech City";
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text("INVOICE", 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(companyName, 14, 30);
  doc.text(companyAddress, 14, 35);
  
  // Order Info
  doc.setFontSize(12);
  doc.text(`Invoice #: ${order.order_number}`, 14, 50);
  doc.text(`Date: ${order.order_date}`, 14, 56);
  doc.text(`Status: ${order.status.toUpperCase()}`, 14, 62);
  
  // Customer Info
  doc.text("Bill To:", 140, 50);
  doc.setFontSize(10);
  doc.text(order.Customer?.company_name || 'N/A', 140, 56);
  doc.text(order.Customer?.email || '', 140, 61);
  doc.text(order.Customer?.phone || '', 140, 66);
  
  // Table
  const tableHeaders = [['Product', 'Qty', 'Unit Price', 'Total']];
  const tableData = (order.SalesOrderItems || []).map(item => [
    item.Product?.name || 'Unknown Product',
    item.quantity,
    `$${item.unit_price.toFixed(2)}`,
    `$${item.line_total.toFixed(2)}`
  ]);
  
  doc.autoTable({
    startY: 80,
    head: tableHeaders,
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 }
  });
  
  // Summary
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text(`Subtotal: $${(order.total_amount + (order.discount || 0) - (order.tax || 0)).toFixed(2)}`, 140, finalY);
  doc.text(`Tax (10%): $${(order.tax || 0).toFixed(2)}`, 140, finalY + 7);
  doc.text(`Discount: -$${(order.discount || 0).toFixed(2)}`, 140, finalY + 14);
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.text(`Total Amount: $${order.total_amount.toFixed(2)}`, 140, finalY + 22);
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Thank you for your business!", 105, 280, { align: 'center' });
  
  doc.save(`Invoice_${order.order_number}.pdf`);
};
