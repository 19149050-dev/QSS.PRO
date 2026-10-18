/**
 * Tiện ích xử lý ảnh đại diện & ảnh thẻ 3x4
 */

/**
 * Cắt và chuẩn hóa ảnh về đúng tỷ lệ 3x4 (chuẩn ảnh thẻ / hồ sơ công nhân HSCN)
 * @param {File|Blob|string} source - File, Blob, Data URL hoặc Image URL
 * @param {number} targetWidth - Chiều rộng canvas đầu ra (mặc định 360px)
 * @param {number} targetHeight - Chiều cao canvas đầu ra (mặc định 480px = 360 * 4 / 3)
 * @returns {Promise<string>} Base64 Data URL định dạng JPEG tỷ lệ 3x4
 */
export const cropImageTo3x4 = (source, targetWidth = 360, targetHeight = 480) => {
  return new Promise((resolve, reject) => {
    if (!source) {
      resolve('');
      return;
    }

    const processWithImage = (src) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const targetRatio = 3 / 4; // 0.75
          const currentRatio = img.naturalWidth / img.naturalHeight;

          let cropWidth = img.naturalWidth;
          let cropHeight = img.naturalHeight;
          let cropX = 0;
          let cropY = 0;

          if (currentRatio > targetRatio) {
            // Ảnh bè ngang hơn 3:4 -> cắt bớt 2 bên hông để lấy phần trung tâm
            cropWidth = img.naturalHeight * targetRatio;
            cropX = (img.naturalWidth - cropWidth) / 2;
          } else if (currentRatio < targetRatio) {
            // Ảnh cao hơn 3:4 -> cắt bớt trên dưới
            cropHeight = img.naturalWidth / targetRatio;
            cropY = (img.naturalHeight - cropHeight) / 2;
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          // Phông nền trắng dự phòng nếu ảnh có nền trong suốt
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Vẽ ảnh đã cắt vào canvas tỷ lệ 3x4
          ctx.drawImage(
            img,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, targetWidth, targetHeight
          );

          const resultDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(resultDataUrl);
        } catch (err) {
          console.warn('Lỗi khi vẽ canvas 3x4, giữ nguyên ảnh gốc:', err);
          resolve(src);
        }
      };

      img.onerror = () => {
        console.warn('Không thể load ảnh vào Image object:', typeof src === 'string' ? src.slice(0, 50) : src);
        resolve(typeof src === 'string' ? src : '');
      };

      img.src = src;
    };

    if (source instanceof Blob || source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => processWithImage(e.target.result);
      reader.onerror = (err) => {
        console.error('Lỗi FileReader khi đọc ảnh:', err);
        reject(err);
      };
      reader.readAsDataURL(source);
    } else if (typeof source === 'string') {
      processWithImage(source);
    } else {
      resolve('');
    }
  });
};

/**
 * Trích xuất file ảnh từ sự kiện dán Clipboard (Ctrl + V)
 * @param {ClipboardEvent} event 
 * @returns {File|null}
 */
export const extractImageFromClipboard = (event) => {
  const clipboardData = event.clipboardData || window.clipboardData;
  if (!clipboardData) return null;

  const items = clipboardData.items;
  if (!items || items.length === 0) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type && item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }

  // Fallback kiểm tra clipboardData.files
  if (clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const file = clipboardData.files[i];
      if (file.type && file.type.indexOf('image') !== -1) {
        return file;
      }
    }
  }

  return null;
};

/**
 * Đọc ảnh trực tiếp từ bộ nhớ tạm bằng Clipboard API (nếu người dùng bấm nút)
 * @returns {Promise<Blob|null>}
 */
export const readImageFromClipboardAsync = async () => {
  if (!navigator.clipboard || !navigator.clipboard.read) {
    return null;
  }
  try {
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      const imageType = item.types.find(t => t.startsWith('image/'));
      if (imageType) {
        const blob = await item.getType(imageType);
        return blob;
      }
    }
  } catch (err) {
    console.warn('Clipboard read error (thường cần tương tác người dùng hoặc quyền):', err);
  }
  return null;
};
