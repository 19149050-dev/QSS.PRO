import jsQR from 'jsqr';
import {
  QRCodeReader,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  GlobalHistogramBinarizer
} from '@zxing/library';

/**
 * Parses Vietnamese CCCD QR Code string:
 * Format: [Số CCCD]|[Số CMND cũ]|[Họ và tên]|[Ngày sinh DDMMYYYY hoặc DD/MM/YYYY]|[Giới tính]|[Địa chỉ thường trú]|[Ngày cấp DDMMYYYY hoặc DD/MM/YYYY]
 */
export function parseCccdQrCode(qrText) {
  if (!qrText || typeof qrText !== 'string') return null;
  const raw = qrText.trim();
  const parts = raw.split('|').map(p => p.trim());

  if (parts.length >= 5) {
    const cccd = parts[0]?.replace(/\s+/g, '') || '';
    const oldCmnd = parts[1] || '';
    const name = parts[2] || '';
    const rawDob = parts[3] || '';
    const gender = parts[4] || '';
    const address = parts[5] || '';
    const rawIssueDate = parts[6] || '';

    let birthYear = '';
    let birthDateInput = '';
    let age = '';

    // Handle DDMMYYYY or DD/MM/YYYY
    if (rawDob) {
      let d = '', m = '', y = '';
      if (rawDob.includes('/') || rawDob.includes('-')) {
        const segs = rawDob.split(/[\/\-]/);
        if (segs.length === 3) {
          d = segs[0].padStart(2, '0');
          m = segs[1].padStart(2, '0');
          y = segs[2];
        }
      } else if (rawDob.length === 8) {
        d = rawDob.substring(0, 2);
        m = rawDob.substring(2, 4);
        y = rawDob.substring(4, 8);
      }

      if (d && m && y) {
        birthYear = `${d}/${m}/${y}`;
        birthDateInput = `${y}-${m}-${d}`;
        const birthDateObj = new Date(`${y}-${m}-${d}`);
        if (!isNaN(birthDateObj.getTime())) {
          const today = new Date();
          let years = today.getFullYear() - birthDateObj.getFullYear();
          let months = today.getMonth() - birthDateObj.getMonth();
          if (months < 0 || (months === 0 && today.getDate() < birthDateObj.getDate())) {
            years--;
            months += 12;
          }
          if (years > 0) {
            age = months > 0 ? `${years} tuổi ${months} tháng` : `${years} tuổi`;
          } else if (months > 0) {
            age = `${months} tháng tuổi`;
          }
        }
      }
    }

    let issueDate = '';
    if (rawIssueDate) {
      let d = '', m = '', y = '';
      if (rawIssueDate.includes('/') || rawIssueDate.includes('-')) {
        const segs = rawIssueDate.split(/[\/\-]/);
        if (segs.length === 3) {
          d = segs[0].padStart(2, '0');
          m = segs[1].padStart(2, '0');
          y = segs[2];
        }
      } else if (rawIssueDate.length === 8) {
        d = rawIssueDate.substring(0, 2);
        m = rawIssueDate.substring(2, 4);
        y = rawIssueDate.substring(4, 8);
      }
      if (d && m && y) {
        issueDate = `${y}-${m}-${d}`;
      }
    }

    return {
      cccd,
      oldCmnd,
      name,
      birthYear,
      birthDateInput,
      age,
      gender,
      address,
      issueDate
    };
  }
  return null;
}

/**
 * Loads an image with crossOrigin support
 */
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = typeof source === 'string' ? source : URL.createObjectURL(source);
  });
}

/**
 * Create a canvas with specified rotation (0, 90, 180, 270) and optional crop & contrast
 */
function createCanvasFromImage(img, options = {}) {
  const { maxDim = 1600, rotation = 0, crop = null, contrast = 1.0, binarize = false } = options;

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  let scale = 1;
  if (Math.max(origW, origH) > maxDim) {
    scale = maxDim / Math.max(origW, origH);
  }
  const targetW = Math.round(origW * scale);
  const targetH = Math.round(origH * scale);

  const rotCanvas = document.createElement('canvas');
  if (rotation === 90 || rotation === 270) {
    rotCanvas.width = targetH;
    rotCanvas.height = targetW;
  } else {
    rotCanvas.width = targetW;
    rotCanvas.height = targetH;
  }

  const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true });
  rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
  rotCtx.rotate((rotation * Math.PI) / 180);
  rotCtx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);

  if (crop) {
    const cropCanvas = document.createElement('canvas');
    const sx = Math.floor(crop.x * rotCanvas.width);
    const sy = Math.floor(crop.y * rotCanvas.height);
    const sw = Math.floor(crop.w * rotCanvas.width);
    const sh = Math.floor(crop.h * rotCanvas.height);

    cropCanvas.width = sw;
    cropCanvas.height = sh;
    const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
    cropCtx.drawImage(rotCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

    if (contrast !== 1.0 || binarize) {
      applyImageFilters(cropCtx, sw, sh, contrast, binarize);
    }
    return cropCanvas;
  }

  if (contrast !== 1.0 || binarize) {
    applyImageFilters(rotCtx, rotCanvas.width, rotCanvas.height, contrast, binarize);
  }

  return rotCanvas;
}

/**
 * Fast contrast enhancement and optional binarization
 */
function applyImageFilters(ctx, w, h, contrast, binarize) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  if (contrast !== 1.0) {
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
    for (let i = 0; i < d.length; i += 4) {
      d[i] = factor * (d[i] - 128) + 128;
      d[i + 1] = factor * (d[i + 1] - 128) + 128;
      d[i + 2] = factor * (d[i + 2] - 128) + 128;
    }
  }

  if (binarize) {
    let sum = 0;
    const len = d.length / 4;
    for (let i = 0; i < d.length; i += 4) {
      sum += (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    }
    const threshold = sum / len;
    for (let i = 0; i < d.length; i += 4) {
      const lum = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
      const v = lum > threshold ? 255 : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Decode QR with ZXing QRCodeReader
 */
function decodeWithZxing(canvas) {
  try {
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new QRCodeReader();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const len = canvas.width * canvas.height;
    const luminances = new Uint8ClampedArray(len);
    for (let i = 0; i < len; i++) {
      const idx = i * 4;
      luminances[i] = (imgData.data[idx] * 2 + imgData.data[idx + 1] * 5 + imgData.data[idx + 2]) >> 3;
    }

    const source = new RGBLuminanceSource(luminances, canvas.width, canvas.height);

    // Try HybridBinarizer
    try {
      const bitmap = new BinaryBitmap(new HybridBinarizer(source));
      const res = reader.decode(bitmap, hints);
      if (res && res.getText()) return res.getText();
    } catch (e1) {}

    // Try GlobalHistogramBinarizer
    try {
      const bitmap = new BinaryBitmap(new GlobalHistogramBinarizer(source));
      const res = reader.decode(bitmap, hints);
      if (res && res.getText()) return res.getText();
    } catch (e2) {}

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Decode QR with jsQR
 */
function decodeWithJsQr(canvas) {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let res = jsQR(imgData.data, canvas.width, canvas.height, {
      inversionAttempts: 'dontInvert',
    });
    if (res && res.data) return res.data;

    res = jsQR(imgData.data, canvas.width, canvas.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (res && res.data) return res.data;
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Decode QR using Native BarcodeDetector (Chrome/Edge hardware accelerated)
 */
async function decodeWithNativeBarcodeDetector(canvas) {
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const barcodes = await detector.detect(canvas);
      if (barcodes && barcodes.length > 0) {
        return barcodes[0].rawValue;
      }
    } catch (e) {}
  }
  return null;
}

/**
 * Multi-Engine, Multi-Orientation QR Scanner
 * Searches both old CCCD (QR at top-right front) and new 2024 Thẻ Căn Cước (QR at bottom-right back)
 */
export async function scanQrMultiEngine(img) {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Portrait photos (height > width) usually mean phone was held vertically
  // Vietnamese cards are landscape, so card is likely rotated 270 deg or 90 deg!
  const isPortrait = origH > origW;
  const rotations = isPortrait ? [270, 90, 0, 180] : [0, 180, 90, 270];

  // Specific corner crops where CCCD QR codes appear:
  const crops = [
    null, // Full image
    { x: 0.50, y: 0.0, w: 0.50, h: 0.55 }, // Top-Right (Old CCCD Front QR)
    { x: 0.45, y: 0.35, w: 0.55, h: 0.65 }, // Bottom-Right (New 2024 Thẻ Căn Cước Back QR)
    { x: 0.0, y: 0.0, w: 0.55, h: 0.55 },  // Top-Left (if inverted)
    { x: 0.0, y: 0.45, w: 0.55, h: 0.55 },  // Bottom-Left (if inverted)
  ];

  // Pass 1: Try Native BarcodeDetector on full image for each rotation (ultra-fast)
  for (const rot of rotations) {
    const canvas = createCanvasFromImage(img, { maxDim: 1600, rotation: rot });
    const nativeRes = await decodeWithNativeBarcodeDetector(canvas);
    if (nativeRes) return nativeRes;
  }

  // Pass 2: Try ZXing and jsQR on high-resolution crops
  for (const rot of rotations) {
    for (const crop of crops) {
      const canvas = createCanvasFromImage(img, { maxDim: 1600, rotation: rot, crop });

      // Try ZXing
      const zxRes = decodeWithZxing(canvas);
      if (zxRes) return zxRes;

      // Try jsQR
      const jsRes = decodeWithJsQr(canvas);
      if (jsRes) return jsRes;
    }
  }

  // Pass 3: Try High-Contrast enhancement on full image & crops
  for (const rot of rotations.slice(0, 2)) {
    for (const crop of crops.slice(0, 3)) {
      const canvas = createCanvasFromImage(img, { maxDim: 1200, rotation: rot, crop, contrast: 1.35 });
      const zxRes = decodeWithZxing(canvas);
      if (zxRes) return zxRes;

      const jsRes = decodeWithJsQr(canvas);
      if (jsRes) return jsRes;
    }
  }

  return null;
}

/**
 * Extracts the portrait photo (avatar) from front of CCCD/Căn Cước card
 */
function extractAvatarCrop(img, bestRotation = 0) {
  try {
    const canvas = createCanvasFromImage(img, { maxDim: 1200, rotation: bestRotation });
    // On horizontal card front, face photo is roughly at x: 4.5%..27.5%, y: 18%..86%
    const cropCanvas = document.createElement('canvas');
    const sx = Math.floor(canvas.width * 0.045);
    const sy = Math.floor(canvas.height * 0.18);
    const sw = Math.floor(canvas.width * 0.23); // strictly 23% to exclude card text on the right
    const sh = Math.floor(canvas.height * 0.68);

    cropCanvas.width = sw;
    cropCanvas.height = sh;
    const ctx = cropCanvas.getContext('2d');
    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return cropCanvas.toDataURL('image/jpeg', 0.9);
  } catch (e) {
    return null;
  }
}

function isHeaderLine(l) {
  return /CỘNG HÒA|XÃ HỘI|CHỦ NGHĨA|VIỆT NAM|ĐỘC LẬP|TỰ DO|HẠNH PHÚC|CĂN CƯỚC|CÔNG DÂN|IDENTITY|CARD|BỘ CÔNG AN|GIÁ TRỊ|QUỐC TỊCH|QUÊ QUÁN|THƯỜNG TRÚ|CƯ TRÚ|NGÀY SINH|GIỚI TÍNH|DÂN TỘC|HẠN DÙNG/i.test(l);
}

/**
 * Parses OCR text lines for both old CCCD and new 2024 Thẻ Căn Cước
 */
function parseOcrText(text) {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Số CCCD / Số định danh cá nhân: 12 digits
  let cccd = '';
  const cccdMatch = text.match(/\b\d{12}\b/) || 
                    text.match(/\b\d{3}[\s\.\-]\d{3}[\s\.\-]\d{6}\b/) ||
                    text.match(/\b\d{3}[\s\.\-]\d{1}[\s\.\-]\d{2}[\s\.\-]\d{6}\b/) ||
                    text.match(/\b\d{3}[\s\.\-]\d{3}[\s\.\-]\d{3}[\s\.\-]\d{3}\b/) ||
                    text.match(/\b\d{9}\b/);
  if (cccdMatch) {
    cccd = cccdMatch[0].replace(/\D/g, '');
  }

  // Fallback for CCCD: search near label "Số" or "No" or "Personal identification"
  if (!cccd) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/(?:số\s*định\s*danh|personal\s*identification|số\s*[\/:]|no[\s\.:])/i.test(line)) {
        const combo = (line + ' ' + (lines[i + 1] || '')).replace(/\D/g, '');
        if (combo.length >= 12) {
          cccd = combo.substring(0, 12);
          break;
        } else if (combo.length === 9) {
          cccd = combo;
          break;
        }
      }
    }
  }

  // 2. Họ và tên
  const vnFamilyNames = ['NGUYỄN', 'TRẦN', 'LÊ', 'PHẠM', 'HOÀNG', 'HUỲNH', 'PHAN', 'VŨ', 'VÕ', 'ĐẶNG', 'BÙI', 'ĐỖ', 'HỒ', 'NGÔ', 'DƯƠNG', 'LÝ', 'ĐÀO', 'ĐINH', 'LƯƠNG', 'TRỊNH', 'TRƯƠNG', 'MAI', 'HÀ', 'CAO', 'LÂM', 'PHÙNG', 'TÔ', 'QUÁCH', 'ĐOÀN', 'BÀNH', 'LỤC'];
  
  function cleanNameCandidate(str) {
    if (!str) return '';
    return str.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '').trim();
  }

  function isLikelyName(str) {
    const cleaned = cleanNameCandidate(str);
    if (cleaned.length < 3 || isHeaderLine(cleaned)) return false;
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 6) return false;
    // Check all uppercase (standard CCCD)
    if (/^[\p{Lu}\s]+$/u.test(cleaned)) return true;
    // Check Title Case / Capitalized words
    if (words.every(w => /^[\p{Lu}][\p{L}]*$/u.test(w))) return true;
    return false;
  }

  let name = '';
  // Pass 1: Look around 'họ và tên' or 'full name'
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:họ|tên|full\s*name)/i.test(line)) {
      const after = cleanNameCandidate(
        line.replace(/.*?(?:họ\s*và\s*tên|họ,?\s*chữ\s*đệm\s*và\s*tên(?:\s*khai\s*sinh)?|full\s*name)[\s:\.\-\/]*/i, '')
      );
      if (isLikelyName(after)) {
        name = after;
        break;
      }
      if (lines[i + 1]) {
        const next = cleanNameCandidate(lines[i + 1]);
        if (isLikelyName(next)) {
          name = next;
          break;
        }
      }
    }
  }

  // Pass 2: Look for lines starting with VN family names
  if (!name) {
    for (const l of lines) {
      const cleaned = cleanNameCandidate(l);
      const words = cleaned.split(/\s+/).filter(Boolean);
      if (words.length >= 2 && words.length <= 6) {
        const first = words[0].toUpperCase();
        if (vnFamilyNames.includes(first) && isLikelyName(cleaned)) {
          name = cleaned;
          break;
        }
      }
    }
  }

  // Pass 3: Any uppercase line of 2-5 words not matching header
  if (!name) {
    for (const l of lines) {
      const cleaned = cleanNameCandidate(l);
      if (isLikelyName(cleaned)) {
        name = cleaned;
        break;
      }
    }
  }
  name = cleanNameCandidate(name);

  // 3. Ngày sinh (DD/MM/YYYY) - handles spaces around slashes: '06 / 07 / 2001'
  let birthYear = '';
  let birthDateInput = '';
  let age = '';
  const dobMatch = text.match(/(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{4})/);
  if (dobMatch) {
    const d = dobMatch[1].padStart(2, '0').trim();
    const m = dobMatch[2].padStart(2, '0').trim();
    const y = dobMatch[3].trim();
    birthYear = `${d}/${m}/${y}`;
    birthDateInput = `${y}-${m}-${d}`;
    const birthDateObj = new Date(`${y}-${m}-${d}`);
    if (!isNaN(birthDateObj.getTime())) {
      const today = new Date();
      let years = today.getFullYear() - birthDateObj.getFullYear();
      let months = today.getMonth() - birthDateObj.getMonth();
      if (months < 0 || (months === 0 && today.getDate() < birthDateObj.getDate())) {
        years--;
        months += 12;
      }
      if (years > 0) {
        age = months > 0 ? `${years} tuổi ${months} tháng` : `${years} tuổi`;
      } else if (months > 0) {
        age = `${months} tháng tuổi`;
      }
    }
  }

  // 4. Giới tính
  let gender = '';
  if (/giới tính|sex/i.test(text)) {
    if (/nữ|female/i.test(text)) gender = 'Nữ';
    else if (/nam|male/i.test(text)) gender = 'Nam';
  }

  // 5. Nơi thường trú / Quê quán / Nơi cư trú
  let address = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:thường\s*trú|nơi\s*cư\s*trú|residence|quê\s*quán|place\s*of\s*origin)/i.test(line)) {
      const rest = line.replace(/.*?(?:thường\s*trú|nơi\s*cư\s*trú|residence|quê\s*quán|place\s*of\s*origin)[\s:\.\-]*/i, '').trim();
      address = rest || lines[i + 1] || '';
      if (lines[i + 2] && !lines[i + 2].includes(':') && lines[i + 2].length < 60 && !/ngày|cấp|bộ/i.test(lines[i + 2])) {
        address += ', ' + lines[i + 2].trim();
      }
      break;
    }
  }
  address = address.replace(/^[\s:\.\-\/,]+/, '').trim();

  // 6. Ngày cấp (nếu có ngày thứ 2 trong ảnh)
  let issueDate = '';
  const allDates = [...text.matchAll(/(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{4})/g)];
  if (allDates.length > 1) {
    const d2 = allDates[1][1].padStart(2, '0').trim();
    const m2 = allDates[1][2].padStart(2, '0').trim();
    const y2 = allDates[1][3].trim();
    issueDate = `${y2}-${m2}-${d2}`;
  }

  // Check if card is new 2024 Thẻ Căn Cước
  const is2024Card = /CĂN CƯỚC|IDENTITY CARD/i.test(text) && !/CĂN CƯỚC CÔNG DÂN/i.test(text);

  if (cccd || name || birthYear) {
    return {
      cccd,
      name,
      birthYear,
      birthDateInput,
      age,
      gender,
      address,
      issueDate,
      is2024Card
    };
  }
  return null;
}

/**
 * Local High-Accuracy Vietnamese OCR using Tesseract.js
 */
export async function ocrCccdText(img, onProgress = null) {
  try {
    const { createWorker } = await import('tesseract.js');
    
    // Configure worker with local assets from /public to avoid blocked CDN
    const worker = await createWorker('vie+eng', 1, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract',
      langPath: '/tessdata',
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round((m.progress || 0) * 100));
        }
      }
    });

    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;
    const isPortrait = origH > origW;
    // Test orientations: phone photo of landscape card is likely 270 or 90 deg
    const rotations = isPortrait ? [270, 90, 0, 180] : [0, 180, 90, 270];

    let bestParsed = null;
    let bestScore = -1;
    let bestRot = rotations[0];

    for (const rot of rotations) {
      const canvas = createCanvasFromImage(img, { maxDim: 1600, rotation: rot, contrast: 1.25 });
      const ret = await worker.recognize(canvas);
      const text = ret?.data?.text || '';

      const parsed = parseOcrText(text);
      if (parsed) {
        let score = 0;
        if (parsed.cccd && parsed.cccd.length === 12) score += 4;
        if (parsed.name && parsed.name.length >= 3) score += 4;
        if (parsed.birthYear) score += 2;
        if (parsed.gender) score += 1;
        if (parsed.address) score += 1;

        if (score > bestScore) {
          bestScore = score;
          bestParsed = parsed;
          bestRot = rot;
        }
        if (score >= 8) break; // High confidence (CCCD + Name found)
      }
    }

    await worker.terminate();

    if (bestParsed) {
      const avatarPhoto = extractAvatarCrop(img, bestRot);
      return {
        ...bestParsed,
        avatarPhoto
      };
    }
    return null;
  } catch (err) {
    console.error('Tesseract OCR error:', err);
    return null;
  }
}

/**
 * Main entrance to scan CCCD image:
 * Step 1: High-Speed Multi-Engine QR (Instant if QR exists)
 * Step 2: High-Accuracy Local OCR (Extracts text directly from card photo)
 */
export async function scanCccdImage(imageSource, onProgress = null) {
  try {
    const img = await loadImage(imageSource);

    // Step 1: Scan QR Code (if present on card)
    const qrData = await scanQrMultiEngine(img);
    if (qrData) {
      const parsed = parseCccdQrCode(qrData);
      if (parsed) {
        const avatarPhoto = extractAvatarCrop(img, 0);
        return {
          success: true,
          method: 'Mã QR CCCD',
          isQr: true,
          data: {
            ...parsed,
            avatarPhoto: avatarPhoto || imageSource,
            cardPhoto: imageSource
          }
        };
      }
    }

    // Step 2: Extract text directly from card image using local Vietnamese OCR
    const ocrData = await ocrCccdText(img, onProgress);
    if (ocrData) {
      return {
        success: true,
        method: ocrData.is2024Card ? 'Ảnh Thẻ Căn Cước' : 'Ảnh CCCD',
        isQr: false,
        isFront2024: ocrData.is2024Card,
        data: {
          ...ocrData,
          cardPhoto: imageSource
        }
      };
    }

    return {
      success: false,
      error: 'Không nhận diện được rõ chữ trên ảnh thẻ. Bạn vui lòng chụp lại ảnh thẻ thẳng góc và đủ sáng hơn nhé.'
    };
  } catch (err) {
    console.error('Scan error:', err);
    return {
      success: false,
      error: 'Lỗi trong quá trình xử lý ảnh: ' + (err.message || String(err))
    };
  }
}
