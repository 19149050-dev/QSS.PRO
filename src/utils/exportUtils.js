import * as XLSX from 'xlsx-js-style';
import ExcelJS from 'exceljs';
import { cropImageTo3x4 } from './imageUtils.js';

/**
 * Xuất danh sách thành viên / công nhân kèm ảnh thẻ 3x4 phục vụ kế toán mua HSCN
 * @param {Array} workers - Mảng dữ liệu thành viên
 * @param {string} fileName - Tên file tải về
 * @param {string} sheetName - Tên sheet
 * @param {boolean} isAllWorkers - Phân biệt xuất toàn bộ công nhân hay theo tổ đội
 */
export const exportWorkersToExcel = async ({
  workers = [],
  fileName = 'DanhSachThanhVien',
  sheetName = 'Thành viên',
  isAllWorkers = false
}) => {
  try {
    if (!workers || workers.length === 0) {
      alert("Không có dữ liệu thành viên để xuất Excel.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'QSS PRO';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }]
    });

    // 1. Định nghĩa các cột
    if (isAllWorkers) {
      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 7 },
        { header: 'Ảnh 3x4', key: 'photo', width: 15 },
        { header: 'Họ và Tên', key: 'name', width: 26 },
        { header: 'Tổ Đội', key: 'teamName', width: 22 },
        { header: 'Đội Trưởng', key: 'leaderName', width: 24 },
        { header: 'Phân Loại', key: 'teamType', width: 15 },
        { header: 'Dự Án', key: 'teamProjects', width: 22 },
        { header: 'Chức vụ', key: 'position', width: 16 },
        { header: 'Tuổi', key: 'age', width: 14 },
        { header: 'CCCD', key: 'cccd', width: 18 },
        { header: 'Năm sinh', key: 'birthYear', width: 14 },
        { header: 'Ngày cấp', key: 'issueDate', width: 14 },
        { header: 'Địa chỉ', key: 'address', width: 36 },
        { header: 'Bằng cấp nghề', key: 'vocationalCertificate', width: 16 },
        { header: 'Bảo hiểm tai nạn', key: 'insuranceExpiry', width: 18 },
        { header: 'Chứng chỉ AT', key: 'safetyCardExpiry', width: 16 },
        { header: 'Giấy khám SK', key: 'healthCertificate', width: 16 },
        { header: 'HĐLĐ', key: 'contract', width: 16 },
        { header: 'Ghi chú', key: 'notes', width: 22 }
      ];
    } else {
      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 7 },
        { header: 'Ảnh 3x4', key: 'photo', width: 15 },
        { header: 'Họ và Tên', key: 'name', width: 26 },
        { header: 'Chức vụ', key: 'position', width: 16 },
        { header: 'Tuổi', key: 'age', width: 14 },
        { header: 'CCCD', key: 'cccd', width: 18 },
        { header: 'Năm sinh', key: 'birthYear', width: 14 },
        { header: 'Ngày cấp', key: 'issueDate', width: 14 },
        { header: 'Địa chỉ', key: 'address', width: 36 },
        { header: 'Bằng cấp nghề', key: 'vocationalCertificate', width: 16 },
        { header: 'Bảo hiểm tai nạn', key: 'insuranceExpiry', width: 18 },
        { header: 'Chứng chỉ AT', key: 'safetyCardExpiry', width: 16 },
        { header: 'Giấy khám SK', key: 'healthCertificate', width: 16 },
        { header: 'HĐLĐ', key: 'contract', width: 16 },
        { header: 'Ghi chú', key: 'notes', width: 22 }
      ];
    }

    // 2. Định dạng hàng Header
    const headerRow = worksheet.getRow(1);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Arial' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' } // Indigo-600
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });

    // 3. Thêm dữ liệu từng dòng & chèn ảnh thẻ 3x4
    for (let i = 0; i < workers.length; i++) {
      const w = workers[i];
      const rowIdx = i + 2; // Dòng 1 là header

      const formatWorkerPosition = (pos) => {
        if (!pos || pos === '-') return 'CN';
        const s = String(pos).trim();
        return s.toLowerCase() === 'công nhân' || s.toLowerCase() === 'cn' ? 'CN' : s;
      };

      const rowData = isAllWorkers ? {
        stt: i + 1,
        photo: '',
        name: w.name || '',
        teamName: w.teamName || '',
        leaderName: w.leaderName ? `${w.leaderName} (${w.leaderPhone || ''})` : '',
        teamType: w.teamType || 'Thầu phụ',
        teamProjects: Array.isArray(w.teamProjects) ? w.teamProjects.join(', ') : (w.teamProjects || ''),
        position: formatWorkerPosition(w.position),
        age: w.age || '',
        cccd: w.cccd ? String(w.cccd) : '',
        birthYear: w.birthYear || '',
        issueDate: w.issueDate || '',
        address: w.address || '',
        vocationalCertificate: w.vocationalCertificate || '',
        insuranceExpiry: w.insuranceExpiry || 'Chưa có',
        safetyCardExpiry: w.safetyCardExpiry || 'Chưa có',
        healthCertificate: w.healthCertificate || '',
        contract: w.contract || '',
        notes: w.notes || ''
      } : {
        stt: i + 1,
        photo: '',
        name: w.name || '',
        position: formatWorkerPosition(w.position),
        age: w.age || '',
        cccd: w.cccd ? String(w.cccd) : '',
        birthYear: w.birthYear || '',
        issueDate: w.issueDate || '',
        address: w.address || '',
        vocationalCertificate: w.vocationalCertificate || '',
        insuranceExpiry: w.insuranceExpiry || 'Chưa có',
        safetyCardExpiry: w.safetyCardExpiry || 'Chưa có',
        healthCertificate: w.healthCertificate || '',
        contract: w.contract || '',
        notes: w.notes || ''
      };

      const row = worksheet.addRow(rowData);
      row.height = 90; // Chiều cao phù hợp tỷ lệ ảnh thẻ 3x4 (120px)

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { size: 10, name: 'Arial', color: { argb: 'FF1F2937' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        };

        // Cột CCCD định dạng Text để không mất số 0 đầu
        const cccdColIdx = isAllWorkers ? 10 : 6;
        if (colNumber === cccdColIdx) {
          cell.numFmt = '@';
        }

        // Cột Họ tên (Cột 3) căn trái và in đậm
        if (colNumber === 3) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          cell.font = { bold: true, size: 10, name: 'Arial', color: { argb: 'FF111827' } };
        } else if (cell.value && String(cell.value).length > 25) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
      });

      // Xử lý chèn ảnh 3x4 vào Cột 2 (B)
      if (w.photo) {
        try {
          const croppedPhoto = await cropImageTo3x4(w.photo, 300, 400);
          if (croppedPhoto) {
            const imageId = workbook.addImage({
              base64: croppedPhoto,
              extension: 'jpeg'
            });

            // Tỷ lệ chuẩn 3x4: 72px x 96px (72/96 = 3/4)
            // Căn giữa tuyệt đối trong ô B (chiều rộng 15 ~ 112px, chiều cao 90pt ~ 120px)
            // Lề trái ~20px (190,500 EMUs), Lề trên ~12px (114,300 EMUs)
            worksheet.addImage(imageId, {
              tl: {
                nativeCol: 1,
                nativeColOff: 190500,
                nativeRow: rowIdx - 1,
                nativeRowOff: 114300
              },
              ext: { width: 72, height: 96 },
              editAs: 'oneCell'
            });
          }
        } catch (imgErr) {
          console.warn(`Lỗi chèn ảnh cho ${w.name}:`, imgErr);
          const photoCell = row.getCell(2);
          photoCell.value = '(Lỗi ảnh)';
          photoCell.font = { italic: true, size: 9, color: { argb: 'FFEF4444' } };
        }
      } else {
        const photoCell = row.getCell(2);
        photoCell.value = '(Chưa có)';
        photoCell.font = { italic: true, size: 9, color: { argb: 'FF9CA3AF' } };
      }
    }

    // 4. Xuất và tải file về máy
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Lỗi khi xuất file Excel kèm ảnh:", error);
    alert("Đã xảy ra lỗi trong quá trình xuất file Excel kèm ảnh.");
  }
};

/**
 * Xuất dữ liệu cơ bản ra file Excel (.xlsx) với định dạng (style)
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

/**
 * Xuất Ma Trận Tiến Độ / IPC ra Excel với Cấu Trúc Đề Mục 3 Cấp (Block, Group, Item) chuẩn Y Như Bảng Web
 */
export const exportMatrixToExcel = ({
  projectName,
  matrixBlocks = [],
  paymentMatrix = [],
  fileName = 'DuLieu',
  sheetName = 'DuLieu',
  type = 'default',
  selectedTeamFilter = 'ALL',
  isColumnVisible = () => true,
  displayCellValue = (val) => val,
  storeData = null
}) => {
  try {
    const ws = {};
    const merges = [];

    // 1. Xây dựng danh sách các cột thực tế sẽ xuất (columnsDef)
    const columnsDef = [
      {
        type: 'floor',
        header1: projectName || 'DỰ ÁN',
        header2: 'Tầng',
        header3: 'Tầng'
      }
    ];

    matrixBlocks.forEach(block => {
      const visibleGroups = [];
      let totalVisInBlock = 0;

      block.groups.forEach(group => {
        const visCats = group.items.filter(cat => isColumnVisible(`${block.blockName}_${group.groupName}_${cat}`));
        if (visCats.length > 0 || group.items.length === 0) {
          visibleGroups.push({
            groupName: group.groupName,
            items: visCats
          });
          totalVisInBlock += Math.max(visCats.length, 1);
        }
      });

      if (totalVisInBlock === 0 && block.groups.length > 0) return;

      // Cột "Số căn" thuộc Block này
      columnsDef.push({
        type: 'numApts',
        blockName: block.blockName,
        groupName: 'Số căn',
        catName: 'Số căn',
        itemKey: `${block.blockName}_numApts`
      });

      visibleGroups.forEach(g => {
        if (g.items.length === 0) {
          columnsDef.push({
            type: 'empty',
            blockName: block.blockName,
            groupName: g.groupName,
            catName: '(Chưa có)',
            itemKey: null
          });
        } else {
          g.items.forEach(cat => {
            columnsDef.push({
              type: 'item',
              blockName: block.blockName,
              groupName: g.groupName,
              catName: cat,
              itemKey: `${block.blockName}_${g.groupName}_${cat}`
            });
          });
        }
      });
    });

    const totalCols = columnsDef.length;

    // 2. Định dạng các dòng Header (Dòng 0: Block, Dòng 1: Nhóm/Số căn, Dòng 2: Hạng mục/Tầng)
    
    // Merge Cột Tầng (A1:A3)
    merges.push({ s: { r: 0, c: 0 }, e: { r: 2, c: 0 } });

    // Merges cho Block (Dòng 0)
    let bStart = -1;
    let currBlock = null;

    for (let c = 1; c < totalCols; c++) {
      const col = columnsDef[c];
      if (col.blockName !== currBlock) {
        if (currBlock !== null && bStart !== -1 && c - 1 >= bStart) {
          merges.push({ s: { r: 0, c: bStart }, e: { r: 0, c: c - 1 } });
        }
        currBlock = col.blockName;
        bStart = c;
      }
    }
    if (currBlock !== null && bStart !== -1 && totalCols - 1 >= bStart) {
      merges.push({ s: { r: 0, c: bStart }, e: { r: 0, c: totalCols - 1 } });
    }

    // Merges cho Group & Số căn (Dòng 1 & 2)
    let gStart = -1;
    let currGroupKey = null;

    for (let c = 1; c < totalCols; c++) {
      const col = columnsDef[c];
      if (col.type === 'numApts') {
        if (currGroupKey !== null && gStart !== -1 && c - 1 >= gStart) {
          if (c - 1 > gStart) merges.push({ s: { r: 1, c: gStart }, e: { r: 1, c: c - 1 } });
          currGroupKey = null;
          gStart = -1;
        }
        // Merge "Số căn" dọc Dòng 1 -> Dòng 2 (Rows 1:2)
        merges.push({ s: { r: 1, c: c }, e: { r: 2, c: c } });
      } else {
        const gKey = `${col.blockName}_${col.groupName}`;
        if (gKey !== currGroupKey) {
          if (currGroupKey !== null && gStart !== -1 && c - 1 >= gStart) {
            if (c - 1 > gStart) merges.push({ s: { r: 1, c: gStart }, e: { r: 1, c: c - 1 } });
          }
          currGroupKey = gKey;
          gStart = c;
        }
      }
    }
    if (currGroupKey !== null && gStart !== -1 && totalCols - 1 >= gStart) {
      if (totalCols - 1 > gStart) merges.push({ s: { r: 1, c: gStart }, e: { r: 1, c: totalCols - 1 } });
    }

    // Gán dữ liệu cho 3 dòng Header
    // Row 0: Block
    for (let c = 0; c < totalCols; c++) {
      const col = columnsDef[c];
      const val = c === 0 ? col.header1 : (col.blockName || '');
      ws[XLSX.utils.encode_cell({ r: 0, c })] = {
        v: val,
        t: 's',
        s: {
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          font: { bold: true, color: { rgb: c === 0 ? '166534' : 'FFFFFF' }, sz: 11 },
          fill: { patternType: 'solid', fgColor: { rgb: c === 0 ? 'DCFCE7' : '312E81' } },
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
          }
        }
      };
    }

    // Row 1: Group
    for (let c = 0; c < totalCols; c++) {
      const col = columnsDef[c];
      const val = c === 0 ? col.header2 : (col.groupName || '');
      const isNumApts = col.type === 'numApts';
      ws[XLSX.utils.encode_cell({ r: 1, c })] = {
        v: val,
        t: 's',
        s: {
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          font: { bold: true, color: { rgb: c === 0 ? '166534' : (isNumApts ? '1E293B' : '9A3412') }, sz: 10 },
          fill: { patternType: 'solid', fgColor: { rgb: c === 0 ? 'DCFCE7' : (isNumApts ? 'E2E8F0' : 'FFEDD5') } },
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
          }
        }
      };
    }

    // Row 2: Item
    for (let c = 0; c < totalCols; c++) {
      const col = columnsDef[c];
      const val = c === 0 ? 'Tầng' : (col.type === 'numApts' ? 'Số căn' : (col.catName || ''));
      const isNumApts = col.type === 'numApts';
      ws[XLSX.utils.encode_cell({ r: 2, c })] = {
        v: val,
        t: 's',
        s: {
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          font: { bold: true, color: { rgb: c === 0 ? '166534' : (isNumApts ? '1E293B' : '1E293B') }, sz: 10 },
          fill: { patternType: 'solid', fgColor: { rgb: c === 0 ? 'DCFCE7' : (isNumApts ? 'E2E8F0' : 'F1F5F9') } },
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
          }
        }
      };
    }

    // 3. Đổ Dữ liệu các Tầng (Dòng 3 trở đi)
    paymentMatrix.forEach((row, rIdx) => {
      const r = 3 + rIdx;

      for (let c = 0; c < totalCols; c++) {
        const col = columnsDef[c];
        let cellVal = '';
        let rawVal = '';
        const blockNumApts = row.items?.[`${col.blockName}_numApts`] || row.numApts || '';

        if (col.type === 'floor') {
          cellVal = row.floor || '';
        } else if (col.type === 'numApts') {
          cellVal = (blockNumApts && blockNumApts !== '-') ? blockNumApts : '-';
        } else if (col.type === 'item' && col.itemKey) {
          if (type === 'ipc') {
            const ipcMatrix = storeData?.paymentMatrix?.[`${projectName}_ipc`] || [];
            const ipcRow = ipcMatrix.find(rItem => String(rItem.floor).trim() === String(row.floor).trim());
            rawVal = ipcRow?.items?.[col.itemKey] || '';
          } else {
            rawVal = row.items?.[col.itemKey] || '';
          }
          cellVal = displayCellValue(rawVal, selectedTeamFilter, 'ALL', blockNumApts) || '';
        }

        const isFilled = col.type !== 'floor' && col.type !== 'numApts' && Boolean(cellVal);
        let cellHex = col.type === 'floor' 
          ? 'F8FAFC' 
          : (col.type === 'numApts' 
            ? 'FFFFFF' 
            : (selectedTeamFilter !== 'ALL'
              ? (cellVal ? getExcelCellColorHex(cellVal) : (rawVal ? 'CBD5E1' : 'FFFFFF'))
              : (rawVal ? getExcelCellColorHex(rawVal) : 'FFFFFF')));

        if (rawVal && col.type === 'item') {
          const totalAptsNum = parseFloat(blockNumApts) || 0;
          const completedUnits = parseTotalUnitsForCell(rawVal, totalAptsNum);
          if (totalAptsNum > 0) {
            const ratio = Math.min(1.0, Math.max(0, completedUnits / totalAptsNum));
            if (ratio <= 0) cellHex = 'FFFFFF';
          }
        }

        ws[XLSX.utils.encode_cell({ r, c })] = {
          v: cellVal,
          t: 's',
          s: {
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            font: { bold: isFilled || col.type === 'floor', color: { rgb: isFilled ? '0F172A' : '1E293B' }, sz: 10 },
            fill: { patternType: 'solid', fgColor: { rgb: cellHex } },
            border: {
              top: { style: 'thin', color: { rgb: 'CBD5E1' } },
              bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
              left: { style: 'thin', color: { rgb: 'CBD5E1' } },
              right: { style: 'thin', color: { rgb: 'CBD5E1' } }
            }
          }
        };
      }
    });

    // 4. Thiết lập range, cols width (tối ưu kích thước vừa chữ), rows height & merges
    const totalRows = 3 + paymentMatrix.length;
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRows - 1, c: totalCols - 1 } });
    ws['!merges'] = merges;
    
    ws['!cols'] = columnsDef.map((col) => {
      let maxLen = 0;
      if (col.type === 'floor') {
        maxLen = Math.max(8, String(col.header1 || '').length, String(col.header2 || '').length, String(col.header3 || '').length);
      } else if (col.type === 'numApts') {
        maxLen = 'Số căn'.length;
      } else {
        maxLen = String(col.catName || '').length;
      }

      paymentMatrix.forEach((row) => {
        let val = '';
        const blockNumApts = row.items?.[`${col.blockName}_numApts`] || row.numApts || '';
        if (col.type === 'floor') {
          val = String(row.floor || '');
        } else if (col.type === 'numApts') {
          val = String((blockNumApts && blockNumApts !== '-') ? blockNumApts : '-');
        } else if (col.itemKey) {
          const rawVal = row.items?.[col.itemKey] || '';
          val = String(displayCellValue(rawVal, selectedTeamFilter, 'ALL', blockNumApts) || '');
        }
        if (val.length > maxLen) maxLen = val.length;
      });

      const optimalWch = Math.min(32, Math.max(col.type === 'floor' ? 10 : (col.type === 'numApts' ? 8 : 7), maxLen + 3));
      return { wch: optimalWch };
    });

    ws['!rows'] = [
      { hpt: 26 },
      { hpt: 24 },
      { hpt: 24 },
      ...paymentMatrix.map(() => ({ hpt: 22 }))
    ];

    // 5. Xuất file
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);

  } catch (error) {
    console.error("Lỗi khi xuất file Excel ma trận:", error);
    alert("Đã xảy ra lỗi trong quá trình xuất file Excel: " + error.message);
  }
};

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function getExcelCellColorHex(val) {
  if (!val) return 'FFFFFF';
  if (val.includes('Xong 100%')) return '6EE7B7';
  if (val.includes('Tạm dừng')) return 'FCA5A5';

  const parts = val.split(/\s\+\s|\n|,\s+/).map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return 'FFFFFF';

  const part = parts[0];
  const upperPart = part.toUpperCase();
  let textToHash = '';
  
  if (upperPart.includes('ĐỢT') || upperPart.includes('DOT')) {
    const match = upperPart.match(/(ĐỢT|DOT)\s*\d+/);
    textToHash = match ? match[0].replace(/\s+/g, ' ') : 'ĐỢT';
  } else if (upperPart.includes('(PO')) {
    const match = upperPart.match(/\(PO[^)]*\)/);
    textToHash = match ? match[0] : 'PO';
  } else if (/^\d/.test(upperPart)) {
    return 'DBEAFE';
  } else {
    textToHash = upperPart;
  }
  
  let hash = 0;
  for (let i = 0; i < textToHash.length; i++) {
    hash = textToHash.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash * 137.5) % 360;
  return hslToHex(h, 75, 85);
}
export function parseTotalUnitsForCell(str, totalApts) {
  if (!str) return 0;
  if (str.includes('Xong 100%')) return parseFloat(totalApts) || 0;
  let total = 0;
  str.split(' + ').forEach(p => {
    if (p.includes('Xong 100%')) {
      total += parseFloat(totalApts) || 0;
    } else {
      const m = p.match(/\((.*?)\)/);
      if (m) {
        const match = m[1].match(/(\d+(\.\d+)?)/);
        if (match) {
          if (m[1].includes('%')) {
            total += (parseFloat(match[1]) / 100) * (parseFloat(totalApts) || 0);
          } else {
            total += parseFloat(match[1]);
          }
        }
      } else {
        const match = p.match(/(\d+(\.\d+)?)/);
        if (match) {
          if (p.includes('%')) {
            total += (parseFloat(match[1]) / 100) * (parseFloat(totalApts) || 0);
          } else {
            total += parseFloat(match[1]);
          }
        }
      }
    }
  });
  return total;
}
