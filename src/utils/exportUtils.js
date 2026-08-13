import * as XLSX from 'xlsx';

/**
 * Xuất dữ liệu ra file Excel (.xlsx)
 * @param {Array} data - Mảng dữ liệu chứa các dòng (Array of objects hoặc Array of arrays)
 * @param {string} fileName - Tên file tải về (không cần đuôi .xlsx)
 * @param {string} sheetName - Tên sheet trong file Excel
 */
export const exportToExcel = (data, fileName, sheetName = 'Sheet1') => {
  try {
    // 1. Tạo một worksheet từ dữ liệu
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // 2. Tạo một workbook và gắn worksheet vào
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // 3. Tự động điều chỉnh độ rộng cột cơ bản (tuỳ chọn)
    const maxWidths = [];
    data.forEach(row => {
      Object.keys(row).forEach((key, i) => {
        const val = row[key] !== null && row[key] !== undefined ? row[key].toString() : '';
        maxWidths[i] = Math.max(maxWidths[i] || 10, val.length + 2, key.length + 2);
      });
    });
    
    worksheet['!cols'] = maxWidths.map(w => ({ wch: w }));
    
    // 4. Lưu và tải xuống file Excel
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Lỗi khi xuất file Excel:", error);
    alert("Đã xảy ra lỗi trong quá trình xuất file Excel.");
  }
};
