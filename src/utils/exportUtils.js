import * as XLSX from 'xlsx-js-style';

/**
 * Xuất dữ liệu ra file Excel (.xlsx) với định dạng (style)
 * @param {Array} data - Mảng dữ liệu chứa các dòng (Array of objects)
 * @param {string} fileName - Tên file tải về (không cần đuôi .xlsx)
 * @param {string} sheetName - Tên sheet trong file Excel
 */
export const exportToExcel = (data, fileName, sheetName = 'Sheet1') => {
  try {
    // 1. Tạo một worksheet từ dữ liệu
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // 2. Định dạng (Style) cho file Excel
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        const cell = worksheet[cellRef];
        
        if (!cell) continue;

        // Định dạng chung cho tất cả các ô: Căn giữa, Wrap Text
        const baseStyle = {
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } },
          }
        };

        if (R === 0) {
          // Định dạng Header (Dòng 0)
          cell.s = {
            ...baseStyle,
            font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F46E5" } }, // Màu Indigo-600
          };
        } else {
          // Định dạng Dữ liệu
          cell.s = {
            ...baseStyle,
            font: { sz: 10, color: { rgb: "333333" } },
          };
        }
      }
    }

    // 3. Tự động điều chỉnh độ rộng cột cơ bản
    const maxWidths = [];
    data.forEach(row => {
      Object.keys(row).forEach((key, i) => {
        const val = row[key] !== null && row[key] !== undefined ? row[key].toString() : '';
        maxWidths[i] = Math.max(maxWidths[i] || 12, val.length + 2, key.length + 2);
      });
    });
    
    worksheet['!cols'] = maxWidths.map(w => ({ wch: Math.min(w, 40) })); // Giới hạn max width 40 để ko bị quá rộng
    worksheet['!rows'] = [{ hpt: 30 }]; // Chiều cao dòng header

    // 4. Tạo một workbook và gắn worksheet vào
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // 5. Lưu và tải xuống file Excel
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Lỗi khi xuất file Excel:", error);
    alert("Đã xảy ra lỗi trong quá trình xuất file Excel.");
  }
};

