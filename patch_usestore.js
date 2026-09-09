const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'store', 'useStore.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = `syncMaterialSheetToSupabase: async (projectName) => {`;
const replacement = `importPaymentMatrix: (projectName, matrixType, importedData) => { set((state) => {
        const matrixKey = matrixType === 'base' ? projectName : \`\${projectName}_\${matrixType}\`;
        const existingMatrix = state.paymentMatrix[matrixKey] || [];
        
        const newMatrix = existingMatrix.map(row => {
          const importRow = importedData.find(r => String(r['Tầng']).trim() === String(row.floor).trim());
          if (!importRow) return row;
          
          const newItems = { ...row.items };
          Object.keys(importRow).forEach(colName => {
             if (colName === 'Tầng' || colName === 'Số căn') return;
             
             // Convert "BLOCK A - MẶT NGOÀI - BẢ LỚP 1" -> "BLOCK A_MẶT NGOÀI_BẢ LỚP 1"
             const parts = colName.split(' - ');
             if (parts.length >= 3) {
               const key = parts.map(p => p.trim()).join('_');
               if (importRow[colName] !== undefined && importRow[colName] !== null) {
                 newItems[key] = String(importRow[colName]);
               }
             }
          });
          
          return {
            ...row,
            numApts: importRow['Số căn'] && importRow['Số căn'] !== '-' ? importRow['Số căn'] : row.numApts,
            items: newItems
          };
        });
        
        return {
          paymentMatrix: {
            ...state.paymentMatrix,
            [matrixKey]: newMatrix
          }
        };
      });
        get().syncMatrixDataToSupabase(projectName);
      },

      syncMaterialSheetToSupabase: async (projectName) => {`;

content = content.replace(target, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added importPaymentMatrix to useStore');
