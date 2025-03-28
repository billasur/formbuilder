import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FormModel, FormSubmission } from '../types/form';

// Helper to format date
const formatDate = (date: Date): string => {
  return date.toLocaleString();
};

// Export to CSV
export const exportToCSV = (form: FormModel, responses: FormSubmission[]): void => {
  // Create headers
  const headers: string[] = [];
  headers.push('Submission ID');
  headers.push('Submission Date/Time');
  headers.push('');
  headers.push('Submitter Email');
  
  // Add field headers
  form.fields.forEach(field => {
    if (field.kind !== 'divider' && field.kind !== 'heading') {
      headers.push(field.label || field.name);
    }
  });
  
  // Create data rows
  const data: string[][] = [];
  responses.forEach(response => {
    const row: string[] = [];
    row.push(response.id);
    row.push(formatDate(response.submittedAt));
    row.push('');
    row.push(response.submittedBy || '');
    
    // Add field values
    form.fields.forEach(field => {
      if (field.kind !== 'divider' && field.kind !== 'heading') {
        const value = response.data[field.name] || '';
        row.push(typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });
    
    data.push(row);
  });
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  data.forEach(row => {
    csvContent += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
  });
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${form.name}_responses.csv`);
};

// Export to Excel
export const exportToExcel = async (form: FormModel, responses: FormSubmission[]): Promise<void> => {
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Responses');
  
  // Create headers
  const headers: string[] = [];
  headers.push('Submission ID');
  headers.push('Submission Date/Time');
  headers.push('Submitter Email');
  
  // Add field headers
  form.fields.forEach(field => {
    if (field.kind !== 'divider' && field.kind !== 'heading') {
      headers.push(field.label || field.name);
    }
  });
  
  // Add header row
  worksheet.addRow(headers);
  
  // Add data rows
  responses.forEach(response => {
    const row: any[] = [];
    row.push(response.id);
    row.push(formatDate(response.submittedAt));
    row.push(response.submittedBy || '');
    
    // Add field values
    form.fields.forEach(field => {
      if (field.kind !== 'divider' && field.kind !== 'heading') {
        const value = response.data[field.name] || '';
        row.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });
    
    worksheet.addRow(row);
  });
  
  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });
  
  // Auto-size columns
  worksheet.columns.forEach(column => {
    column.width = 20;
  });
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Create blob and download
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${form.name}_responses.xlsx`);
};

// Export to PDF
export const exportToPDF = (form: FormModel, responses: FormSubmission[]): void => {
  // Create headers
  const headers: string[] = ['Submission ID', 'Date/Time', 'Email'];
  
  // Add field headers
  form.fields.forEach(field => {
    if (field.kind !== 'divider' && field.kind !== 'heading') {
      headers.push(field.label || field.name);
    }
  });
  
  // Create data rows
  const data: string[][] = [];
  responses.forEach(response => {
    const row: string[] = [];
    row.push(response.id);
    row.push(formatDate(response.submittedAt));
    row.push(response.submittedBy || '');
    
    // Add field values
    form.fields.forEach(field => {
      if (field.kind !== 'divider' && field.kind !== 'heading') {
        const value = response.data[field.name] || '';
        row.push(typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });
    
    data.push(row);
  });
  
  // Create PDF
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(`${form.name} - Form Responses`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 22);
  
  // Add table
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 30,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [24, 144, 255] },
    columnStyles: { 0: { cellWidth: 'auto' } },
  });
  
  // Save PDF
  doc.save(`${form.name}_responses.pdf`);
}; 