import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export data to an Excel file
 * @param {Array} data - Array of objects containing the data
 * @param {String} filename - Name of the file (without extension)
 */
export const exportToExcel = (data, filename) => {
  if (!data || !data.length) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(blob, `${filename}.xlsx`);
};

/**
 * Export data to a PDF file
 * @param {Array} headers - Array of strings for table headers
 * @param {Array} data - Array of arrays for table rows
 * @param {String} title - Title of the document
 * @param {String} filename - Name of the file (without extension)
 */
export const exportToPDF = (headers, data, title, filename) => {
  if (!data || !data.length) return;
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.autoTable({
    startY: 30,
    head: [headers],
    body: data,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [24, 144, 255] }
  });
  
  doc.save(`${filename}.pdf`);
};
