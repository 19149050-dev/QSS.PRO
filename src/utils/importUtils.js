import * as XLSX from 'xlsx-js-style';

/**
 * Đọc file Excel tải lên và trả về mảng JSON
 * @param {File} file - File Excel do người dùng tải lên
 * @returns {Promise<Array>} Mảng dữ liệu JSON
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        // Đọc file dưới dạng binary
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Lấy sheet đầu tiên
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Chuyển sheet thành mảng JSON (defval: "" để giữ lại ô trống)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
