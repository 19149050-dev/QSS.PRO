import * as XLSX from 'xlsx-js-style';

/**
 * Đọc file Excel tải lên và trả về mảng JSON
 * Tự động hỗ trợ cả file đề mục 3 cấp (Block, Group, Item) lẫn file đề mục phẳng 1 cấp.
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
        
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        const getVal = (r, c) => {
          const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
          return cell && cell.v !== undefined ? String(cell.v).trim() : '';
        };

        const row2Val0 = getVal(2, 0);
        const row1Val1 = getVal(1, 1);
        const row0Val1 = getVal(0, 1);

        let dataStartRow = 1;
        const colHeaderMap = {};

        if (row2Val0 === 'Tầng' || row1Val1 === 'Số căn' || (row0Val1 && row0Val1.toUpperCase().includes('BLOCK'))) {
          // File Excel đề mục 3 cấp (Block - Group - Item)
          dataStartRow = 3;
          
          let currentBlock = '';
          let currentGroup = '';

          for (let C = range.s.c; C <= range.e.c; ++C) {
            const r0 = getVal(0, C);
            const r1 = getVal(1, C);
            const r2 = getVal(2, C);

            if (r0 && r0 !== 'QSS PRO' && !r0.toLowerCase().includes('dự án')) currentBlock = r0;
            if (r1 && r1 !== 'Số căn' && r1 !== 'Tầng') currentGroup = r1;

            if (C === 0 || r2 === 'Tầng') {
              colHeaderMap[C] = 'Tầng';
            } else if (r1 === 'Số căn' || r2 === 'Số căn') {
              colHeaderMap[C] = 'Số căn';
            } else if (r2) {
              const b = currentBlock || 'BLOCK A';
              const g = currentGroup || 'NHÓM';
              const i = r2;
              colHeaderMap[C] = `${b} - ${g} - ${i}`;
            }
          }
        } else {
          // File Excel đề mục phẳng 1 dòng
          dataStartRow = 1;
          for (let C = range.s.c; C <= range.e.c; ++C) {
            colHeaderMap[C] = getVal(0, C);
          }
        }

        const result = [];
        for (let R = dataStartRow; R <= range.e.r; ++R) {
          const rowObj = {};
          let hasData = false;

          for (let C = range.s.c; C <= range.e.c; ++C) {
            const key = colHeaderMap[C];
            if (!key) continue;
            const val = getVal(R, C);
            if (val !== '') hasData = true;
            rowObj[key] = val;
          }

          if (hasData && rowObj['Tầng']) {
            result.push(rowObj);
          }
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

