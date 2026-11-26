/**
 * ADVANCED SEARCH & FILTER HELPER (PARTIME.VN)
 * Cung cấp giải thuật chuẩn hóa tiếng Việt, ánh xạ thông minh Master Data,
 * xử lý số tiền lương và tìm kiếm đa từ khóa không bao giờ làm mất dữ liệu.
 */

import { VIETNAM_PROVINCES, PROVINCE_DISTRICTS_MAP, getDistrictsByProvince } from './vietnamLocations.js';

/**
 * 1. Bỏ dấu tiếng Việt toàn diện (Remove Vietnamese Diacritics)
 * Hỗ trợ cả ký tự đơn, ký tự tổ hợp Unicode (NFD), zero-width & khoảng trắng đặc biệt
 */
export function removeVietnameseTones(str) {
  if (!str) return '';
  let s = String(str).replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\u00A0/g, ' ');
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  s = s.replace(/đ/g, "d");
  s = s.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  s = s.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  s = s.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  s = s.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  s = s.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  s = s.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  s = s.replace(/Đ/g, "D");
  // Chuẩn hóa tổ hợp NFD
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s.toLowerCase().trim();
}

/**
 * 2. Parse số tiền lương an toàn (Safe Salary Parser)
 * Khắc phục triệt để lỗi Number("28.000") = 28 của JavaScript
 */
export function parseSalaryNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * Rút gọn chuỗi chỉ giữ chữ thường không dấu + chữ số (phục vụ tìm kiếm chữ bị dính liền)
 */
export function toCompactAlnum(textUnaccent) {
  if (!textUnaccent) return '';
  return String(textUnaccent).replace(/[^a-z0-9]/g, '');
}

/**
 * Tách ranh giới giữa chữ cái và chữ số (VD: "quan1" -> "quan 1", "ca2" -> "ca 2", "tk2026" -> "tk 2026")
 */
function splitLetterDigit(text) {
  if (!text) return '';
  return String(text)
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2');
}

/**
 * Chuẩn hóa các từ viết tắt & tiền tố phổ biến tiếng Việt (ĐH -> Đại học, TP.HCM -> Hồ Chí Minh, Q1/Quận1 -> Quận 1...)
 */
function normalizeSearchSynonyms(textUnaccent) {
  if (!textUnaccent) return '';
  return textUnaccent
    .replace(/[()[\],.;:/\\\-_+&]+/g, ' ')
    .replace(/\b(?:chi\s+nhanh|co\s+so|khu\s+vuc)\b/g, ' ')
    .replace(/\bdh\b/g, 'dai hoc')
    .replace(/\bcd\b/g, 'cao dang')
    .replace(/\b(?:tp\s*hcm|tphcm|sai\s*gon|tp\s*ho\s*chi\s*minh|thanh\s*pho\s*ho\s*chi\s*minh)\b/g, 'ho chi minh')
    .replace(/\b(?:tp\s*ha\s*noi|thanh\s*pho\s*ha\s*noi)\b/g, 'ha noi')
    .replace(/\btp\s+/g, 'thanh pho ')
    .replace(/\bquan\s*0?(\d+)\b/g, 'quan $1')
    .replace(/\bq\s*\.?\s*0?(\d+)\b/g, 'quan $1')
    .replace(/\bphuong\s*0?(\d+)\b/g, 'phuong $1')
    .replace(/\bp\s*\.?\s*0?(\d+)\b/g, 'phuong $1')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Kiểm tra xem chuỗi nguồn có chứa từ khóa an toàn không
 * Đối với các từ khóa ngắn (<= 3 ký tự như "on", "ca", "la", "an", "le"),
 * bắt buộc phải bảo vệ bằng ranh giới từ (word boundary) để không bao giờ bị khớp nhầm
 * vào giữa các từ dài khác (ví dụ: "on" không bao giờ được khớp vào "long" hay "cong").
 */
export function safeIncludesText(sourceText, targetQuery) {
  if (!sourceText || !targetQuery) return false;
  if (/^\d{1,2}$/.test(targetQuery)) {
    const cleanNum = String(parseInt(targetQuery, 10));
    return new RegExp(`(?:^|[^a-z0-9])0?${cleanNum}(?:[^a-z0-9]|$)`).test(sourceText);
  }
  if (targetQuery.length <= 3) {
    const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(targetQuery)}(?:[^a-z0-9]|$)`);
    return re.test(sourceText);
  }
  return sourceText.includes(targetQuery);
}

/**
 * Kiểm tra xem chuỗi có kết thúc bằng số ngắn 1-2 chữ số (dễ nhầm "Quận 1" với "Quận 10", "Ca 1" với "Ca 12")
 * Giữ nguyên tìm kiếm tiền tố SĐT (^0\d{2,}) và mã số / năm (>= 3 chữ số)
 */
function hasShortTrailingDigits(s) {
  if (!s) return false;
  if (/^0\d{2,}$/.test(s)) return false;
  if (/\d{3,}$/.test(s)) return false;
  return /\d$/.test(s);
}

function phraseInText(text, phrase) {
  if (!phrase || !text) return false;
  // Tránh "1" khớp nhầm "10/11/12", nhưng giữ nguyên tìm kiếm tiền tố SĐT/MST (^0\d{2,} hoặc >= 3 chữ số)
  if (/^\d{1,2}$/.test(phrase)) {
    const cleanNum = String(parseInt(phrase, 10));
    return new RegExp(`(^|\\D)0?${cleanNum}(?!\\d)`).test(text);
  }
  if (hasShortTrailingDigits(phrase)) {
    return new RegExp(`(?:^|[^\\da-z])${escapeRegExp(phrase)}(?!\\d)`).test(text);
  }
  return text.includes(phrase);
}

/**
 * Kiểm tra khớp linh hoạt một trường cụ thể (Single Field Matching)
 * Hỗ trợ toàn diện: Chữ hoa, chữ thường, chữ không dấu, chữ bị dính liền, chữ kèm số, chữ hoa + thường lẫn lộn,
 * chuẩn hóa từ viết tắt (ĐH, CĐ, Q1, TP.HCM), bảo vệ ranh giới từ an toàn.
 */
export function matchFieldFlexible(fieldVal, searchQuery) {
  if (fieldVal === undefined || fieldVal === null) return false;
  if (!searchQuery || !String(searchQuery).trim()) return true;

  const rawQuery = String(searchQuery).trim();
  const qLower = rawQuery.toLowerCase();
  if (qLower === 'all' || qLower === 'tất cả' || qLower.startsWith('mọi ') || qLower.startsWith('tất cả ')) {
    return true;
  }

  const valStr = Array.isArray(fieldVal) ? fieldVal.join(' ') : String(fieldVal);
  if (!valStr.trim()) return false;

  const valLower = valStr.toLowerCase();
  const valUnaccent = removeVietnameseTones(valStr);
  const valNorm = normalizeSearchSynonyms(valUnaccent);

  const qUnaccent = removeVietnameseTones(rawQuery);
  const qNorm = normalizeSearchSynonyms(qUnaccent);
  const qSpacedNorm = normalizeSearchSynonyms(splitLetterDigit(qUnaccent));

  // 1. Khớp có dấu nguyên vẹn (Exact lowercase phrase, bảo vệ ranh giới số)
  if (phraseInText(valLower, qLower)) return true;

  // 2. Khớp chuỗi không dấu & chuẩn hóa an toàn (Word-boundary protected if short)
  if (qUnaccent && phraseInText(valUnaccent, qUnaccent)) return true;
  if (qNorm && phraseInText(valNorm, qNorm)) return true;
  if (qSpacedNorm && phraseInText(valNorm, qSpacedNorm)) return true;

  // 3. Khớp chuỗi dính liền & chữ kèm số (compact matching)
  const valCompact = toCompactAlnum(valUnaccent);
  const valCompactNorm = toCompactAlnum(valNorm);
  const qCompact = toCompactAlnum(qUnaccent);
  const qCompactNorm = toCompactAlnum(qNorm);

  const isAlnumMix = /[a-z]/.test(qCompact) && /\d/.test(qCompact);
  if (qCompact && (qCompact.length >= 4 || isAlnumMix || valCompact === qCompact)) {
    if (hasShortTrailingDigits(qCompact)) {
      const reComp = new RegExp(`${escapeRegExp(qCompact)}(?!\\d)`);
      if (reComp.test(valCompact)) return true;
      if (qCompactNorm && reComp.test(valCompactNorm)) return true;
    } else {
      if (valCompact.includes(qCompact)) return true;
      if (valCompactNorm.includes(qCompactNorm)) return true;
    }
  }

  // 4. Khớp từng token của query trong CÙNG MỘT TRƯỜNG này
  const tokens = (qNorm || qUnaccent).split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every(tok => {
      if (!tok) return true;
      if (/^\d{1,2}$/.test(tok)) {
        const cleanNum = String(parseInt(tok, 10));
        const re = new RegExp(`(?:^|[^a-z0-9])0?${cleanNum}(?:[^a-z0-9]|$)`);
        return re.test(valNorm) || re.test(valUnaccent);
      }
      return safeIncludesText(valNorm, tok) || safeIncludesText(valUnaccent, tok);
    });

    if (allTokensMatch) return true;
  }

  return false;
}

function compactMatchInPool(pool, compactCand) {
  if (!compactCand) return false;
  if (hasShortTrailingDigits(compactCand)) {
    const re = new RegExp(`${escapeRegExp(compactCand)}(?!\\d)`);
    return pool.some(c => c && re.test(c));
  }
  return pool.some(c => c && c.includes(compactCand));
}

function buildSearchTargets(values = []) {
  const cleanVals = values.filter(v => v !== undefined && v !== null && String(v).trim() !== '').map(v => String(v));
  const fullText = cleanVals.join(' ').toLowerCase();
  const fullTextUnaccent = removeVietnameseTones(fullText);
  const fullTextNorm = normalizeSearchSynonyms(fullTextUnaccent);

  const segmentCompacts = new Set();
  cleanVals.forEach(val => {
    const valUn = removeVietnameseTones(val);
    const valNorm = normalizeSearchSynonyms(valUn);
    const valCompUn = toCompactAlnum(valUn);
    const valCompNorm = toCompactAlnum(valNorm);
    if (valCompUn) segmentCompacts.add(valCompUn);
    if (valCompNorm) segmentCompacts.add(valCompNorm);

    valUn.split(/[,;|/\n\r()[\]]+/).forEach(seg => {
      const sUn = seg.trim();
      if (!sUn) return;
      const cUn = toCompactAlnum(sUn);
      const cNorm = toCompactAlnum(normalizeSearchSynonyms(sUn));
      if (cUn) segmentCompacts.add(cUn);
      if (cNorm) segmentCompacts.add(cNorm);
    });
  });

  const fullCompactUn = toCompactAlnum(fullTextUnaccent);
  const fullCompactNorm = toCompactAlnum(fullTextNorm);
  if (fullCompactUn) segmentCompacts.add(fullCompactUn);
  if (fullCompactNorm) segmentCompacts.add(fullCompactNorm);

  return {
    fullText,
    fullTextUnaccent,
    fullTextNorm,
    compactPool: Array.from(segmentCompacts)
  };
}

function tokenInTargets(targets, tok) {
  if (!tok) return true;
  if (/^\d{1,2}$/.test(tok)) {
    const cleanNum = String(parseInt(tok, 10));
    const re = new RegExp(`(^|\\D)0?${cleanNum}(?!\\d)`);
    return re.test(targets.fullTextNorm) || re.test(targets.fullTextUnaccent);
  }
  if (hasShortTrailingDigits(tok)) {
    const spacedRe = new RegExp(`(?:^|[^\\da-z])${escapeRegExp(tok)}(?!\\d)`);
    if (spacedRe.test(targets.fullTextNorm) || spacedRe.test(targets.fullTextUnaccent)) return true;
    const tokComp = toCompactAlnum(tok);
    return tokComp.length >= 2 && compactMatchInPool(targets.compactPool, tokComp);
  }
  if (targets.fullTextNorm.includes(tok) || targets.fullTextUnaccent.includes(tok)) {
    return true;
  }
  const tokComp = toCompactAlnum(tok);
  return tokComp.length >= 2 && compactMatchInPool(targets.compactPool, tokComp);
}

function matchQueryAgainstTargets(targets, searchQuery) {
  if (!searchQuery || !String(searchQuery).trim()) return true;

  const rawQuery = String(searchQuery).trim().toLowerCase();
  if (rawQuery === 'all' || rawQuery === 'tất cả' || rawQuery.startsWith('mọi ') || rawQuery.startsWith('tất cả ')) {
    return true;
  }

  const queryUnaccent = removeVietnameseTones(rawQuery);
  const queryNorm = normalizeSearchSynonyms(queryUnaccent);
  const querySpacedNorm = normalizeSearchSynonyms(splitLetterDigit(queryUnaccent));

  // 1. Khớp cụm trực tiếp (có dấu, không dấu, đồng nghĩa, và tách chữ-số như "quan1" -> "quan 1")
  if (
    phraseInText(targets.fullText, rawQuery) ||
    phraseInText(targets.fullTextUnaccent, queryUnaccent) ||
    (queryNorm && phraseInText(targets.fullTextNorm, queryNorm)) ||
    (querySpacedNorm && phraseInText(targets.fullTextNorm, querySpacedNorm))
  ) {
    return true;
  }

  // 2. Tạo các biến thể ứng cử viên từ query (ngoặc đơn, chữ viết tắt dính liền ĐH/CĐ, bỏ hậu tố tỉnh, bỏ tiền tố UI)
  const candidates = new Set();
  if (queryNorm) candidates.add(queryNorm);
  if (querySpacedNorm) candidates.add(querySpacedNorm);

  // Mở rộng từ viết tắt dính liền ở đầu truy vấn (VD: "dhvanlang" -> "dai hoc vanlang", "cdkinhte" -> "cao dang kinhte")
  if (/^dh(?=[a-z]{3,})/.test(queryUnaccent)) {
    candidates.add(`dai hoc ${queryUnaccent.slice(2)}`);
  }
  if (/^cd(?=[a-z]{3,})/.test(queryUnaccent)) {
    candidates.add(`cao dang ${queryUnaccent.slice(2)}`);
  }

  const withoutParens = normalizeSearchSynonyms(queryUnaccent.replace(/\([^)]*\)/g, ' '));
  if (withoutParens) {
    candidates.add(withoutParens);
    const withoutParensSpaced = normalizeSearchSynonyms(splitLetterDigit(withoutParens));
    if (withoutParensSpaced) candidates.add(withoutParensSpaced);

    const noLocationTail = withoutParens
      .replace(/\bho chi minh\b/g, '')
      .replace(/\bha noi\b/g, '')
      .replace(/\bthanh pho\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (noLocationTail && noLocationTail.length >= 2) candidates.add(noLocationTail);
  }

  const parenMatches = queryUnaccent.match(/\(([^)]+)\)/g) || [];
  parenMatches.forEach(m => {
    const inner = normalizeSearchSynonyms(m.slice(1, -1));
    if (inner && inner.length >= 2) candidates.add(inner);
  });

  [withoutParens, queryNorm, querySpacedNorm].filter(Boolean).forEach(cand => {
    const stripped = cand.replace(/^(chi nhanh|co so|khu vuc|vi tri|nganh)\s+/g, '').trim();
    if (stripped && stripped.length >= 2) candidates.add(stripped);
  });

  // 3. Khớp dạng chữ bị dính liền (VD: "phache", "nguyenvana", "caugiay", "quan1", "tk2026", "barista24h")
  const compactCandidates = new Set([toCompactAlnum(queryUnaccent), toCompactAlnum(queryNorm)]);
  candidates.forEach(cand => {
    const c = toCompactAlnum(cand);
    if (c && c.length >= 2) compactCandidates.add(c);
  });
  for (const comp of compactCandidates) {
    if (comp && comp.length >= 2 && compactMatchInPool(targets.compactPool, comp)) {
      return true;
    }
  }

  // 4. Khớp từng từ khóa theo từng biến thể (hỗ trợ cả token thường lẫn token bị dính liền từng phần)
  for (const cand of candidates) {
    const tokens = cand.split(/\s+/).filter(Boolean);
    if (tokens.length > 0 && tokens.every(tok => tokenInTargets(targets, tok))) {
      return true;
    }
  }

  return false;
}

/**
 * 3. Tìm kiếm từ khóa linh hoạt đa từ (Flexible Keyword Search)
 * Hỗ trợ đầy đủ: Chữ hoa, chữ thường, chữ không dấu, chữ bị dính liền, chữ kèm số, chữ hoa + thường lẫn lộn,
 * từ viết tắt (ĐH, CĐ, Q1, TP.HCM), gợi ý kèm ngoặc đơn và tiền tố chi nhánh.
 * Tùy chọn strictPerField: true giúp kiểm tra độc lập từng trường, ngăn chặn việc ghép chữ sai giữa các thực thể khác nhau.
 */
export function matchKeywordFlexible(
  item, 
  searchQuery, 
  fields = ['title', 'company_name', 'description', 'location', 'address'],
  options = {}
) {
  if (!searchQuery || !String(searchQuery).trim()) return true;

  const rawQuery = String(searchQuery).trim();
  const qLower = rawQuery.toLowerCase();
  if (qLower === 'all' || qLower === 'tất cả' || qLower.startsWith('mọi ') || qLower.startsWith('tất cả ')) {
    return true;
  }

  if (!item || !fields || !Array.isArray(fields) || fields.length === 0) return false;

  // 1. Khớp độc lập từng trường trước (Per-field matching)
  // Ngăn chặn triệt để lỗi ghép rác từ ngữ giữa các thực thể khác nhau (như Sinh viên với Doanh nghiệp)
  for (const f of fields) {
    const val = item[f];
    if (val !== undefined && val !== null && matchFieldFlexible(val, rawQuery)) {
      return true;
    }
  }

  // Nếu người dùng yêu cầu chỉ khớp theo từng trường độc lập
  if (options && options.strictPerField) {
    return false;
  }

  // 2. Cho phép khớp toàn văn cho các trường hợp tìm kiếm tổng hợp (VD: "phục vụ phúc long")
  // nhưng bảo vệ từng token với ranh giới từ an toàn
  const qUnaccent = removeVietnameseTones(rawQuery);
  const qNorm = normalizeSearchSynonyms(qUnaccent);
  const tokens = (qNorm || qUnaccent).split(/\s+/).filter(tok => tok.length >= 2 || /^\d+$/.test(tok));

  if (tokens.length >= 2) {
    const fieldTexts = fields
      .map(f => {
        const val = item && item[f];
        if (val === undefined || val === null) return '';
        return normalizeSearchSynonyms(removeVietnameseTones(Array.isArray(val) ? val.join(' ') : String(val)));
      })
      .filter(Boolean);

    const allTokensFound = tokens.every(tok => {
      return fieldTexts.some(text => safeIncludesText(text, tok));
    });

    if (allTokensFound) {
      return true;
    }
  }

  return false;
}

/**
 * Nhóm ngành nghề chuẩn hóa toàn diện (Unified Semantic Category Groups)
 * Phân định ranh giới rõ ràng giữa các ngành để loại bỏ triệt để hiện tượng xuyên nhóm
 * (Ví dụ: Tuyệt đối không để Thu ngân/Bán lẻ lọt vào bộ lọc Gia sư/Giáo dục)
 */
export const CATEGORY_GROUPS = [
  {
    id: 'fnb',
    name: 'F&B / Pha chế / Phục vụ café',
    labels: ['pha che tra sua', 'f&b', 'pha che', 'barista', 'phuc vu cafe', 'phuc vu ca phe', 'tra sua', 'do uong', 'chay ban', 'phuc vu'],
    keywords: [
      'pha che', 'barista', 'tra sua', 'ca phe', 'cafe', 'f&b', 'phuc vu',
      'chay ban', 'order', 'tiep thuc', 'do uong', 'bartender', 'quan ca phe', 'quan nuoc'
    ]
  },
  {
    id: 'retail',
    name: 'Bán hàng / Thu ngân / Tiện lợi',
    labels: ['ban hang', 'thu ngan', 'tien loi', 'ban le', 'sieu thi', 'cua hang', 'tap hoa'],
    keywords: [
      'ban hang', 'thu ngan', 'sieu thi', 'tien loi', 'cua hang', 'ban le',
      'tap hoa', 'co.op', 'winmart', 'circle k', '7-eleven', 'gs25', 'ministop',
      'family mart', 'cashier', 'quay thu ngan', 'tinh tien'
    ]
  },
  {
    id: 'education',
    name: 'Gia sư / Trợ giảng / Giáo dục',
    labels: ['gia su', 'tro giang', 'giao duc', 'day kem', 'day hoc', 'giang day', 'su pham'],
    keywords: [
      'gia su', 'tro giang', 'giao duc', 'day kem', 'giao vien', 'giang day',
      'day tieng anh', 'gia su tieng anh', 'tro giang tieng anh', 'day toan',
      'gia su toan', 'day ly', 'gia su ly', 'day hoa', 'gia su hoa', 'day van',
      'gia su van', 'day tieu hoc', 'gia su tieu hoc', 'luyen thi', 'on thi',
      'trung tam anh ngu', 'trung tam ngoai ngu', 'teaching assistant', 'tutor'
    ]
  },
  {
    id: 'cskh',
    name: 'Chăm sóc khách hàng / Telesales',
    labels: ['cham soc khach hang', 'telesales', 'cskh', 'tong dai vien', 'tu van tuyen sinh', 'tu van khach hang', 'tu van'],
    keywords: ['cskh', 'cham soc khach hang', 'telesales', 'tu van', 'tong dai vien', 'customer service', 'call center']
  },
  {
    id: 'office',
    name: 'Lễ tân / Hành chính / Văn phòng',
    labels: ['le tan khach san', 'le tan toa nha', 'le tan', 'hanh chinh', 'van phong', 'nhap lieu', 'thu ky', 'thu vien', 'soan thao'],
    keywords: ['le tan', 'receptionist', 'hanh chinh', 'van phong', 'nhap lieu', 'thu vien', 'toa nha', 'thu ky', 'tro ly van phong', 'soan thao', 'le tan khach san']
  },
  {
    id: 'logistics',
    name: 'Giao hàng / Kho vận / Logistics',
    labels: ['giao hang', 'kho van', 'logistics', 'shipper', 'van chuyen', 'dong goi kho', 'dong goi'],
    keywords: ['giao hang', 'shipper', 'kho', 'logistics', 'van chuyen', 'dong goi', 'giao hang tiet kiem', 'shopee', 'lazada', 'grab']
  },
  {
    id: 'event',
    name: 'Sự kiện / PG / PB / Sampling',
    labels: ['su kien', 'pg', 'pb', 'sampling', 'tiep thi'],
    keywords: ['su kien', 'pg', 'pb', 'sampling', 'tiep thi', 'trien lam', 'event', 'mc']
  },
  {
    id: 'hospitality',
    name: 'Khách sạn / Nhà hàng / Rạp chiếu phim',
    labels: ['khach san', 'hotel', 'resort', 'rap chieu phim', 'cgv', 'lotte', 'huong dan vien'],
    keywords: ['khach san', 'hotel', 'resort', 'rap chieu phim', 'cgv', 'lotte', 'huong dan vien du lich', 'rap phim']
  },
  {
    id: 'security_labor',
    name: 'An ninh / Bảo vệ / Phụ bếp',
    labels: ['an ninh', 'bao ve', 'phu bep', 'so che thuc pham', 'so che', 'lao dong pho thong', 've sinh', 'tap vu'],
    keywords: [
      'an ninh', 'bao ve', 'security', 'phu bep', 'so che', 'so che thuc pham',
      'rua chen', 'tap vu', 've sinh', 'lao dong pho thong', 'boc xep', 'phu kho'
    ]
  },
  {
    id: 'it_design',
    name: 'IT / Lập trình / Thiết kế / Marketing',
    labels: [
      'ho tro ky thuat', 'tong dai ky thuat', 'ky thuat vien', 'it helpdesk', 'it support',
      'thuc tap sinh', 'thiet ke', 'cntt', 'marketing', 'content', 'lap trinh', 'do hoa', 'ky thuat'
    ],
    keywords: [
      'cntt', 'cong nghe thong tin', 'it', 'lap trinh', 'developer', 'thiet ke', 'do hoa',
      'design', 'designer', 'photoshop', 'illustrator', 'canva', 'figma', 'video', 'editor',
      'marketing', 'content', 'social', 'tiktok', 'seo',
      'ky thuat', 'ho tro ky thuat', 'helpdesk', 'it helpdesk', 'it support', 'tong dai ky thuat',
      'ky thuat vien', 'sua chua'
    ]
  }
];

export function findCategoryGroup(text) {
  if (!text) return null;
  const un = removeVietnameseTones(String(text).toLowerCase().trim());
  let bestGroup = null;
  let maxLen = 0;
  for (const g of CATEGORY_GROUPS) {
    for (const l of g.labels) {
      if (un.includes(l) && l.length > maxLen) {
        maxLen = l.length;
        bestGroup = g;
      }
    }
  }
  return bestGroup;
}

/**
 * 4. Ánh xạ danh mục ngành nghề thông minh (Category Semantic Matching)
 * Khớp chuẩn xác giữa JOB_CATEGORIES nhóm ngành và tin tuyển dụng chi tiết
 */
export function matchCategoryFlexible(job, selectedCat, allCategories = []) {
  if (!selectedCat) return true;
  const selRaw = String(selectedCat).trim();
  const selLower = selRaw.toLowerCase();
  const selUnaccent = removeVietnameseTones(selRaw);
  if (
    selLower === 'all' ||
    selLower === 'tất cả' ||
    selLower === 'tất cả ngành nghề' ||
    selLower === 'tất cả nhóm ngành nghề'
  ) {
    return true;
  }

  const jCatId = String(job.category_id || '').trim();
  const jCatName = String(job.category_name || job.category || job.industry || job.job_category || '').trim();
  const jTitle = String(job.title || '');

  // 1. Khớp trực tiếp mã ID hoặc tên lưu thẳng trong category_id / category_name
  if (jCatId && (jCatId === selRaw || jCatId.toLowerCase() === selLower || removeVietnameseTones(jCatId) === selUnaccent)) {
    return true;
  }
  if (jCatName && (jCatName.toLowerCase() === selLower || removeVietnameseTones(jCatName) === selUnaccent)) {
    return true;
  }

  // 2. Nếu selectedCat là ID hoặc tên trong danh mục Master Data động
  const matchedCatObj = allCategories.find(c =>
    c._id === selRaw ||
    (c.name && c.name.trim().toLowerCase() === selLower) ||
    (c.name && removeVietnameseTones(c.name) === selUnaccent)
  );

  if (matchedCatObj) {
    if (jCatId && matchedCatObj._id && jCatId === matchedCatObj._id) return true;
    const catObjNameLower = (matchedCatObj.name || '').toLowerCase().trim();
    const catObjNameUnaccent = removeVietnameseTones(matchedCatObj.name || '');
    if (jCatName && (jCatName.toLowerCase() === catObjNameLower || jCatName.toLowerCase().includes(catObjNameLower) || catObjNameLower.includes(jCatName.toLowerCase()))) return true;
    if (jCatName && (removeVietnameseTones(jCatName) === catObjNameUnaccent || removeVietnameseTones(jCatName).includes(catObjNameUnaccent) || catObjNameUnaccent.includes(removeVietnameseTones(jCatName)))) return true;
  }

  // 3. Phân nhóm ngành nghề tiêu chuẩn (Semantic Category Matching)
  const selGroup = findCategoryGroup(selRaw) || (matchedCatObj ? findCategoryGroup(matchedCatObj.name) : null);

  if (selGroup) {
    const jobCatGroup = findCategoryGroup(jCatName) || findCategoryGroup(jCatId);
    const jobTitleGroup = findCategoryGroup(jTitle);

    // Nếu công việc đã thuộc một nhóm ngành nghề khác rõ ràng -> LOẠI BỎ (tránh xuyên nhóm)
    if (jobCatGroup && jobCatGroup.id !== selGroup.id) {
      if (!jobTitleGroup || jobTitleGroup.id !== selGroup.id) {
        return false;
      }
    }
    if (jobTitleGroup && jobTitleGroup.id !== selGroup.id) {
      if (!jobCatGroup || jobCatGroup.id !== selGroup.id) {
        return false;
      }
    }

    // Khớp từ khóa nòng cốt của nhóm trên tiêu đề hoặc phân loại công việc
    const jobKeyText = removeVietnameseTones(`${jTitle} ${jCatName} ${jCatId}`).toLowerCase();

    // Loại trừ kỹ thuật / IT / Helpdesk khỏi Chăm sóc khách hàng / Telesales
    if (selGroup.id === 'cskh') {
      const isTechSupport = /\b(ky thuat|ho tro ky thuat|helpdesk|it support|sua chua|lap trinh|cntt)\b/i.test(jobKeyText);
      if (isTechSupport) {
        return false;
      }
    }

    const hasMatch = selGroup.keywords.some(kw => jobKeyText.includes(kw));
    return hasMatch;
  }

  // 4. Nếu không thuộc nhóm nào (ngành nghề đặc thù), so khớp từ khóa chính xác trên tiêu đề & tên ngành
  const jobHeader = removeVietnameseTones(`${jTitle} ${jCatName} ${jCatId}`).toLowerCase();
  return jobHeader.includes(selUnaccent);
}

/**
 * 5. Ánh xạ ca làm việc thông minh (Shift Semantic Matching)
 * Phân tích chính xác khoảng giờ (07:00-12:00, 13:00-18:00, 18:00-23:00) và từ khóa ca,
 * tránh trùng chéo giờ ranh giới (12:00 / 18:00) hoặc nhiễu từ trong mô tả ("tối đa", "sáng tạo").
 */
export function matchShiftFlexible(job, selectedShift) {
  if (!selectedShift) return true;
  const shiftFilter = String(selectedShift).trim().toLowerCase();
  if (!shiftFilter || shiftFilter === 'all' || shiftFilter === 'tất cả' || shiftFilter.startsWith('mọi ') || shiftFilter === 'tất cả khung ca') {
    return true;
  }
  if (!job || typeof job !== 'object') return false;

  // 1. Khớp trực tiếp trường phân loại ca nếu có
  const directEnums = [job.shift, job.shift_type, job.shift_category, job.selected_shift]
    .filter(Boolean)
    .map(s => String(s).trim().toLowerCase());
  if (directEnums.includes(shiftFilter)) return true;

  const primaryShiftTokens = [
    job.shift,
    job.shift_type,
    job.shift_category,
    job.shift_schedule,
    job.shift_registered,
    job.shift_time,
    job.selected_shift,
    job.shift_name,
    job.work_time,
    job.work_schedule,
    job.schedule,
    job.application_snapshot?.shift_registered,
    job.application_snapshot?.work_time
  ];

  if (Array.isArray(job.shifts)) {
    job.shifts.forEach(s => {
      if (typeof s === 'string') primaryShiftTokens.push(s);
      else if (s && typeof s === 'object') {
        primaryShiftTokens.push(s.name, s.time, s.type, s.title);
      }
    });
  }

  const primaryText = primaryShiftTokens.filter(Boolean).join(' ').toLowerCase();
  const primaryUnaccent = removeVietnameseTones(primaryText);
  const fallbackText = `${job.title || ''} ${job.description || ''}`.toLowerCase();
  const fallbackUnaccent = removeVietnameseTones(fallbackText);

  const extractTimeRanges = (text) => {
    const ranges = [];
    if (!text) return ranges;
    const re = /(\d{1,2})(?::(\d{2})|h(\d{2})?)?\s*(?:-|–|—|to|den|đến)\s*(\d{1,2})(?::(\d{2})|h(\d{2})?)?/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      // Cần ít nhất một mốc có ':' hoặc 'h' để tránh khớp nhầm số ngày/lương như "20-25"
      const rawSeg = m[0];
      if (!/[:h]/i.test(rawSeg)) continue;
      const sh = parseInt(m[1], 10);
      const sm = parseInt(m[2] || m[3] || '0', 10);
      const eh = parseInt(m[4], 10);
      const em = parseInt(m[5] || m[6] || '0', 10);
      if (sh >= 0 && sh <= 23 && eh >= 0 && eh <= 24) {
        ranges.push({ start: sh + sm / 60, end: eh + em / 60 });
      }
    }
    return ranges;
  };

  const primaryRanges = extractTimeRanges(primaryUnaccent);
  const allRanges = primaryRanges.length > 0 ? primaryRanges : extractTimeRanges(fallbackUnaccent);

  if (shiftFilter === 'morning') {
    if (/\b(?:ca\s*sang|buoi\s*sang|gio\s*sang|morning)\b/.test(primaryUnaccent) || /\bsang\b/.test(primaryUnaccent)) {
      return true;
    }
    if (/\b(?:ca\s*sang|buoi\s*sang|gio\s*sang|morning)\b/.test(fallbackUnaccent)) {
      return true;
    }
    if (allRanges.some(r => r.start >= 5 && r.start < 12)) return true;
    if (allRanges.length === 0) {
      return /(?:^|[^\d])(?:0?[6789]|1[01]):\d\d|(?:^|[^\d])(?:0?[6789]|1[01])h\d*/.test(primaryUnaccent);
    }
    return false;
  }

  if (shiftFilter === 'afternoon') {
    if (/\b(?:ca\s*chieu|buoi\s*chieu|gio\s*chieu|afternoon)\b/.test(primaryUnaccent) || /\bchieu\b/.test(primaryUnaccent)) {
      return true;
    }
    if (/\b(?:ca\s*chieu|buoi\s*chieu|gio\s*chieu|afternoon)\b/.test(fallbackUnaccent)) {
      return true;
    }
    if (allRanges.some(r => (r.start >= 12 && r.start < 18) || (r.start < 12 && r.end >= 14))) return true;
    if (allRanges.length === 0) {
      return /(?:^|[^\d])1[234567]:\d\d|(?:^|[^\d])1[234567]h\d*/.test(primaryUnaccent);
    }
    return false;
  }

  if (shiftFilter === 'evening') {
    if (/\b(?:ca\s*toi|ca\s*dem|buoi\s*toi|gio\s*toi|evening|night)\b/.test(primaryUnaccent) || /\b(?:toi|dem)\b/.test(primaryUnaccent)) {
      return true;
    }
    if (/\b(?:ca\s*toi|ca\s*dem|buoi\s*toi|gio\s*toi|evening|night)\b/.test(fallbackUnaccent)) {
      return true;
    }
    if (allRanges.some(r => (r.start >= 18 && r.start <= 23.99) || (r.start >= 17 && r.end >= 20))) return true;
    if (allRanges.length === 0) {
      return /(?:^|[^\d])(?:1[89]|2[0123]):\d\d|(?:^|[^\d])(?:1[89]|2[0123])h\d*/.test(primaryUnaccent);
    }
    return false;
  }

  if (shiftFilter === 'flexible') {
    const combinedUn = `${primaryUnaccent} ${fallbackUnaccent}`;
    return combinedUn.includes('linh hoat') ||
      combinedUn.includes('tu chon') ||
      combinedUn.includes('lich hoc') ||
      combinedUn.includes('flexible') ||
      combinedUn.includes('theo ca');
  }

  return true;
}

/**
 * 6. Khớp khoảng lương theo giờ giao thoa (Salary Bracket Matching)
 * Xử lý an toàn cho cả lương thỏa thuận và khoảng lương giao thoa
 */
export function matchSalaryBracketFlexible(job, salaryFilter, salaryBrackets = []) {
  if (!salaryFilter || salaryFilter === 'all' || salaryFilter === 'Tất cả mức lương') return true;

  const isNegotiable = job.is_negotiable === true || (!job.salary_min && !job.salary_max);
  if (salaryFilter === 'negotiable') {
    return isNegotiable;
  }
  if (isNegotiable) {
    return true; // Tin lương thỏa thuận luôn phù hợp với các khoảng lương
  }

  const bracket = salaryBrackets.find(b => b.id === salaryFilter);
  if (!bracket || bracket.min === undefined) return true;

  let jMin = parseSalaryNumber(job.salary_min);
  let jMax = parseSalaryNumber(job.salary_max);
  if (jMin > 0 && jMax === 0) jMax = jMin;
  if (jMax > 0 && jMin === 0) jMin = jMax;

  if (jMax === 0 && jMin === 0) return true;

  // Điều kiện giao thoa khoảng lương: [jMin, jMax] có phần chung với [bracket.min, bracket.max]
  return (jMax >= bracket.min && jMin <= bracket.max);
}

// Bảng bí danh tên Tỉnh / Thành phố chuẩn hóa (Province Aliases)
const PROVINCE_ALIASES = {
  'TP. Hồ Chí Minh': ['ho chi minh', 'tp ho chi minh', 'thanh pho ho chi minh', 'hcm', 'tphcm', 'tp hcm', 'tp.hcm', 'sai gon'],
  'Hà Nội': ['ha noi', 'tp ha noi', 'thanh pho ha noi', 'hn', 'thu do ha noi'],
  'Đà Nẵng': ['da nang', 'tp da nang', 'thanh pho da nang'],
  'Hải Phòng': ['hai phong', 'tp hai phong', 'thanh pho hai phong'],
  'Cần Thơ': ['can tho', 'tp can tho', 'thanh pho can tho'],
  'Bình Dương': ['binh duong', 'tinh binh duong'],
  'Đồng Nai': ['dong nai', 'tinh dong nai'],
  'Khánh Hòa': ['khanh hoa', 'tinh khanh hoa', 'nha trang'],
  'Lâm Đồng': ['lam dong', 'tinh lam dong', 'da lat'],
  'Thừa Thiên Huế': ['thua thien hue', 'tp. hue', 'tp hue', 'thanh pho hue', 'tinh thua thien hue'],
  'Bà Rịa - Vũng Tàu': ['ba ria vung tau', 'vung tau', 'ba ria']
};

export function sanitizeLocText(text) {
  if (!text) return '';
  return removeVietnameseTones(text).replace(/\bnguyen\s+hue\b/gi, 'nguyenhue');
}

export function getProvinceAliases(provName) {
  if (!provName) return [];
  if (PROVINCE_ALIASES[provName]) return PROVINCE_ALIASES[provName];
  const un = removeVietnameseTones(provName);
  const clean = un.replace(/^(?:tp\.?|thanh pho|tinh)\s+/i, '').trim();
  return Array.from(new Set([un, clean])).filter(Boolean);
}

/**
 * Tự động phát hiện Tỉnh / Thành phố được nhắc đến trong chuỗi địa chỉ
 */
export function detectProvincesInText(text) {
  if (!text) return [];
  const un = sanitizeLocText(text);
  const detected = new Set();

  // 1. Quét tên tỉnh thành và các bí danh phổ biến trong 63 tỉnh thành
  for (const prov of VIETNAM_PROVINCES) {
    const aliases = getProvinceAliases(prov);
    for (const alias of aliases) {
      let re;
      if (alias === 'hue') {
        re = /(?:^|[^a-z0-9])(?:tp\.?\s*hue|thanh\s*pho\s*hue|(?<!nguyen\s+)hue)(?![a-z0-9])/i;
      } else {
        re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(alias)}(?![a-z0-9])`, 'i');
      }
      if (re.test(un)) {
        detected.add(prov);
        break;
      }
    }
  }

  // 2. Quét tên quận huyện đặc trưng của các tỉnh/thành lớn
  for (const [prov, dists] of Object.entries(PROVINCE_DISTRICTS_MAP)) {
    for (const dist of dists) {
      const dUn = removeVietnameseTones(dist);
      const dClean = dUn.replace(/^(?:quan|huyen|thi xa|thanh pho|tp\.?)\s+/i, '').trim();
      let re;
      if (/^\d+$/.test(dClean)) {
        re = new RegExp(`(?:^|[^a-z0-9])(?:quan|q\\.?)\\s*0?${parseInt(dClean, 10)}(?![0-9])`, 'i');
      } else if (dClean === 'hue') {
        re = /(?:^|[^a-z0-9])(?:tp\.?\s*hue|thanh\s*pho\s*hue|(?<!nguyen\s+)hue)(?![a-z0-9])/i;
      } else if (dClean.length >= 3) {
        re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(dClean)}(?![a-z0-9])`, 'i');
      }
      if (re && re.test(un)) {
        detected.add(prov);
        break;
      }
    }
  }

  return Array.from(detected);
}

function matchDistrictInText(text, districtName) {
  if (!text || !districtName) return false;
  const tUn = sanitizeLocText(text);
  const dUn = removeVietnameseTones(districtName);
  const dClean = dUn.replace(/^(?:quan|huyen|thi xa|thanh pho|tp\.?)\s+/i, '').trim();

  if (/^\d+$/.test(dClean)) {
    const num = parseInt(dClean, 10);
    const re = new RegExp(`(?:^|[^a-z0-9])(?:quan|q\\.?)\\s*0?${num}(?![0-9])`, 'i');
    return re.test(tUn);
  }

  if (dClean === 'hue') {
    const re = /(?:^|[^a-z0-9])(?:tp\.?\s*hue|thanh\s*pho\s*hue|(?<!nguyen\s+)hue)(?![a-z0-9])/i;
    return re.test(tUn);
  }

  const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(dClean)}(?![a-z0-9])`, 'i');
  return re.test(tUn);
}

/**
 * 7. Khớp địa lý đa tầng thông minh (Location Matching)
 * Đảm bảo tính chính xác 100%: Tuyệt đối không để tin làm việc tại Hà Nội lọt vào bộ lọc TP. Hồ Chí Minh
 * (Ưu tiên số 1 cho địa điểm làm việc thực tế, loại trừ nhiễu từ tên doanh nghiệp hay chi nhánh mặc định)
 */
export function matchLocationFlexible(job, selectedProvince, selectedDistricts = [], customLocationText = '') {
  if (!job || typeof job !== 'object') return false;

  const workLocStr = [job.location, job.address].filter(Boolean).join(' ');
  const adminLocStr = [job.district, job.province, job.city].filter(Boolean).join(' ');
  const branchLocStr = String(job.branch_name || '').trim();

  // Full location text cho tìm kiếm tự do (Tuyệt đối KHÔNG gộp company_name vào để tránh nhận nhầm tên thương hiệu)
  const fullLocTokens = [workLocStr, adminLocStr, branchLocStr].filter(Boolean);
  const fullLocText = fullLocTokens.join(' ');
  const fullLocUnaccent = sanitizeLocText(fullLocText);

  // 1. Kiểm tra Tỉnh / Thành phố
  if (
    selectedProvince &&
    selectedProvince !== 'all' &&
    selectedProvince !== 'Toàn quốc' &&
    selectedProvince !== 'Toàn quốc (Tất cả Tỉnh/Thành phố)' &&
    selectedProvince !== 'Tất cả' &&
    selectedProvince !== 'Tất cả địa điểm'
  ) {
    const selProvName = String(selectedProvince).trim();

    // Bước 1.1: Nhận diện tỉnh/thành tại địa điểm làm việc thực tế (job.location, job.address)
    const workProvinces = detectProvincesInText(workLocStr);
    if (workProvinces.length > 0) {
      if (!workProvinces.includes(selProvName)) {
        // Địa điểm làm việc ghi rõ một tỉnh/thành khác (VD: "Quận Cầu Giấy, Hà Nội" != "TP. Hồ Chí Minh")
        // => Loại bỏ dứt khoát, branch_name hoặc trụ sở công ty không được phép ghi đè!
        return false;
      }
    } else {
      // Nếu địa điểm làm việc chưa đủ thông tin, kiểm tra trường hành chính (job.district, job.province, job.city)
      const adminProvinces = detectProvincesInText(adminLocStr);
      if (adminProvinces.length > 0) {
        if (!adminProvinces.includes(selProvName)) {
          return false;
        }
      } else {
        // Fallback kiểm tra chi nhánh
        const branchProvinces = detectProvincesInText(branchLocStr);
        if (branchProvinces.length > 0) {
          if (!branchProvinces.includes(selProvName)) {
            return false;
          }
        } else {
          // Trường hợp địa điểm đặc thù / Master Data động do Admin tạo
          const pAliases = getProvinceAliases(selProvName);
          const hasProvAlias = pAliases.some(alias => {
            let re;
            if (alias === 'hue') {
              re = /(?:^|[^a-z0-9])(?:tp\.?\s*hue|thanh\s*pho\s*hue|(?<!nguyen\s+)hue)(?![a-z0-9])/i;
            } else {
              re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(alias)}(?![a-z0-9])`, 'i');
            }
            return re.test(fullLocUnaccent);
          });
          if (!hasProvAlias) {
            return false;
          }
        }
      }
    }
  }

  // 2. Kiểm tra Quận / Huyện (nếu có chọn)
  if (selectedDistricts && selectedDistricts.length > 0) {
    const validDistricts = selectedDistricts.filter(d => d && String(d).trim() && String(d).toLowerCase() !== 'all');
    if (validDistricts.length > 0) {
      const targetText = workLocStr || adminLocStr || branchLocStr;
      const hasDistrictMatch = validDistricts.some(d => matchDistrictInText(targetText, d));
      if (!hasDistrictMatch) {
        return false;
      }
    }
  }

  // 3. Kiểm tra ô nhập tay tùy chỉnh
  if (customLocationText && customLocationText.trim()) {
    const rawCustom = customLocationText.trim().toLowerCase();
    if (rawCustom !== 'all' && rawCustom !== 'tất cả' && !rawCustom.startsWith('tất cả ')) {
      const customUn = removeVietnameseTones(rawCustom);
      if (!fullLocUnaccent.includes(customUn)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 8. Khớp hình thức chi trả thù lao (Payment Type Matching)
 */
export function matchPaymentTypeFlexible(job, paymentTypeFilter) {
  if (!paymentTypeFilter || paymentTypeFilter === 'all') return true;

  const payType = removeVietnameseTones(job.payment_type || job.salary_unit || '');
  const desc = ((job.description || '') + ' ' + (job.work_time || '') + ' ' + (job.payment_type || '') + ' ' + (job.salary_unit || '')).toLowerCase();
  const descUn = removeVietnameseTones(desc);

  if (paymentTypeFilter === 'after_shift') {
    return payType === 'after_shift' || payType.includes('sau ca') || descUn.includes('sau ca') || descUn.includes('ngay sau ca') || descUn.includes('theo ca');
  } else if (paymentTypeFilter === 'weekly') {
    return payType === 'weekly' || payType.includes('tuan') || descUn.includes('tuan') || descUn.includes('theo tuan');
  } else if (paymentTypeFilter === 'monthly') {
    return payType === 'monthly' || payType.includes('thang') || descUn.includes('thang') || descUn.includes('theo thang') || descUn.includes('hang thang');
  }

  return true;
}

/**
 * 9. Chuẩn hóa trạng thái vòng đời tin tuyển dụng (Unified Job Status Normalizer)
 * Khắc phục tình trạng không đồng nhất giữa status, job_status và is_open giữa 3 role.
 */
export function normalizeJobStatus(job) {
  if (!job) return 'open';
  const rawStatuses = [job.status, job.job_status]
    .filter(Boolean)
    .map(s => String(s).toLowerCase().trim());

  if (rawStatuses.some(s => ['completed', 'done', 'hoan_thanh'].includes(s))) return 'completed';
  if (rawStatuses.some(s => ['filled', 'full', 'da_du_nguoi'].includes(s))) return 'filled';
  if (rawStatuses.some(s => ['closed', 'paused', 'inactive', 'tam_dong'].includes(s))) return 'closed';
  if (job.is_open === false) return 'closed';
  return 'open';
}

/**
 * 10. Đọc JWT Token cô lập theo Role (tránh tab Doanh nghiệp/Quản trị ghi đè tab Sinh viên khi mở chung trình duyệt)
 */
export function getRoleToken(role) {
  if (typeof window === 'undefined') return null;
  if (role) {
    const tabRoleTok = sessionStorage.getItem(`partime_tab_token_${role}`);
    if (tabRoleTok) return tabRoleTok;
  }
  const tabRole = sessionStorage.getItem('partime_tab_role');
  if (tabRole && (!role || tabRole === role)) {
    const tabTok = sessionStorage.getItem(`partime_tab_token_${tabRole}`);
    if (tabTok) return tabTok;
  }
  if (role) {
    const roleTok = localStorage.getItem(`partime_${role}_token`);
    if (roleTok) return roleTok;
  }
  if (tabRole) {
    const tabTok = localStorage.getItem(`partime_${tabRole}_token`);
    if (tabTok) return tabTok;
  }
  return localStorage.getItem('partime_token');
}

function normalizeWithSpansClient(text) {
  const chars = [];
  const spans = [];
  const str = String(text || '');
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === 'đ' || ch === 'Đ') {
      chars.push('d');
      spans.push([i, i + 1]);
      continue;
    }
    const stripped = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (stripped.length > 0) {
      for (let j = 0; j < stripped.length; j++) {
        const sub = stripped[j];
        chars.push(sub === 'đ' || sub === 'Đ' ? 'd' : sub.toLowerCase());
        spans.push([i, i + 1]);
      }
    } else if (spans.length > 0) {
      spans[spans.length - 1][1] = i + 1;
    }
  }
  return { norm: chars.join(''), spans };
}

/**
 * 11. Che từ ngữ bị cấm trong tin nhắn chat bằng dấu *** ngay vị trí từ cấm (giữ nguyên phần chữ an toàn xung quanh)
 */
export function maskBannedWordsClient(text, keywords = []) {
  let cleanText = String(text || '');
  if (!cleanText || !Array.isArray(keywords) || keywords.length === 0) {
    return { cleanText, isFlagged: false, matchedWords: [] };
  }
  const sortedKws = [...new Set(keywords.map(k => String(k || '').trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  const matchedWords = [];
  let isFlagged = false;

  for (const kw of sortedKws) {
    let hit = false;
    const exactRe = new RegExp(escapeRegExp(kw), 'gi');
    if (exactRe.test(cleanText)) {
      cleanText = cleanText.replace(exactRe, '***');
      hit = true;
    }
    const normKw = normalizeWithSpansClient(kw).norm.trim();
    if (normKw) {
      const { norm, spans } = normalizeWithSpansClient(cleanText);
      const ranges = [];
      let start = 0;
      while (true) {
        const idx = norm.indexOf(normKw, start);
        if (idx === -1) break;
        const origStart = spans[idx][0];
        const origEnd = spans[idx + normKw.length - 1][1];
        ranges.push([origStart, origEnd]);
        start = idx + normKw.length;
      }
      if (ranges.length > 0) {
        hit = true;
        for (let r = ranges.length - 1; r >= 0; r--) {
          const [sIdx, eIdx] = ranges[r];
          cleanText = cleanText.slice(0, sIdx) + '***' + cleanText.slice(eIdx);
        }
      }
    }
    if (hit) {
      isFlagged = true;
      matchedWords.push(kw);
    }
  }
  return { cleanText, isFlagged, matchedWords };
}

/**
 * 11b. Quet danh sach tu khoa cam tren tin tuyen dung (dong bo logic voi Backend scan_job_banned_keywords)
 */
export function matchJobBannedKeywordsClient(job, keywords = []) {
  if (!job || typeof job !== 'object') return [];
  const serverMatched = Array.isArray(job.matched_banned_keywords)
    ? job.matched_banned_keywords.filter(Boolean)
    : [];

  const kwList = [];
  const seenOrig = new Set();
  if (Array.isArray(keywords)) {
    for (const item of keywords) {
      if (item && typeof item === 'object' && item.is_active === false) continue;
      const raw = typeof item === 'string'
        ? item.trim()
        : String(item?.keyword || item?.word || '').trim();
      if (raw && !seenOrig.has(raw)) {
        seenOrig.add(raw);
        kwList.push(raw);
      }
    }
  }
  if (kwList.length === 0) return serverMatched;

  const rawHaystack = [
    job.title,
    job.description,
    job.requirements,
    job.benefits,
    job.company_name,
    job.branch_name,
    job.work_time
  ].filter(Boolean).join(' ');

  const normHaystack = normalizeWithSpansClient(rawHaystack).norm;
  if (!normHaystack.trim()) return [];
  const compactHaystack = normHaystack.replace(/\s+/g, '');

  const matched = [];
  const sortedKws = [...kwList].sort((a, b) => b.length - a.length);
  for (const origKw of sortedKws) {
    const normKw = normalizeWithSpansClient(origKw).norm.trim();
    if (!normKw) continue;
    const compactKw = normKw.replace(/\s+/g, '');
    if (
      normHaystack.includes(normKw) ||
      (compactKw.length >= 4 && compactHaystack.includes(compactKw))
    ) {
      matched.push(origKw);
    }
  }
  return matched;
}

/**
 * 12. Chuẩn hóa Quy mô Công ty khớp 100% 4 Option chuẩn UI Doanh nghiệp
 */
export function normalizeCompanyScale(rawScale) {
  const validScales = ['10-50 nhân viên', '50-200 nhân viên', '200-500 nhân viên', '500+ nhân viên'];
  const s = String(rawScale || '').trim();
  if (validScales.includes(s)) return s;
  const low = s.toLowerCase();
  if (!low) return '10-50 nhân viên';
  if (low.includes('500+') || low.includes('trên 500') || /\b5\d\d\b/.test(low) && !low.includes('200-500')) return '500+ nhân viên';
  if (low.includes('200-500') || low.includes('200 - 500')) return '200-500 nhân viên';
  if (low.includes('50-200') || low.includes('50 - 200')) return '50-200 nhân viên';
  return '10-50 nhân viên';
}

/**
 * 13. Trích xuất Tỉnh/Thành & Quận/Huyện đồng bộ cho Dropdown Đăng/Sửa Tin Tuyển Dụng
 */
export function extractProvinceAndDistrict(locationStr, categories = []) {
  const activeAdminLocs = Array.isArray(categories)
    ? categories.filter(c => c.type === 'location' && c.is_active !== false && c.name).map(c => c.name.trim())
    : [];
  const allProvinces = Array.from(new Set([...VIETNAM_PROVINCES, ...activeAdminLocs]));
  const raw = String(locationStr || '').trim();
  if (!raw) {
    return { province: 'TP. Hồ Chí Minh', district: 'Quận 1' };
  }
  const unaccent = removeVietnameseTones(raw);
  const spacedNorm = normalizeSearchSynonyms(splitLetterDigit(unaccent));

  let matchedProvince = '';
  // Ưu tiên tên tỉnh/thành đầy đủ & viết tắt phổ biến
  if (/\b(?:ho chi minh|tphcm|tp\.?hcm|hcm|sai gon)\b/i.test(unaccent)) {
    matchedProvince = 'TP. Hồ Chí Minh';
  } else if (/\b(?:ha noi|hn)\b/i.test(unaccent)) {
    matchedProvince = 'Hà Nội';
  } else {
    for (const prov of allProvinces) {
      const pUn = removeVietnameseTones(prov);
      const pShort = pUn.replace(/^(?:tp\.?|thanh pho|tinh)\s+/i, '').trim();
      if (phraseInText(unaccent, pUn) || (pShort.length >= 3 && phraseInText(unaccent, pShort))) {
        matchedProvince = prov;
        break;
      }
    }
  }

  // Fallback suy luận Tỉnh/Thành từ Quận/Huyện nếu chuỗi chỉ ghi quận
  if (!matchedProvince) {
    for (const [provName, distList] of Object.entries(PROVINCE_DISTRICTS_MAP)) {
      const hitDist = distList.find((d) => {
        const dUn = removeVietnameseTones(d);
        const dClean = dUn.replace(/^(?:quan|huyen|thi xa|thanh pho|tp\.?)\s+/i, '').trim();
        if (/^\d+$/.test(dClean)) {
          return new RegExp(`(?:^|[^\\da-z])(?:quan|q\\.?)\\s*0?${parseInt(dClean, 10)}(?!\\d)`, 'i').test(unaccent);
        }
        return phraseInText(unaccent, dUn) || (dClean.length >= 3 && phraseInText(spacedNorm, dClean));
      });
      if (hitDist) {
        matchedProvince = provName;
        break;
      }
    }
  }

  if (!matchedProvince) {
    matchedProvince = 'TP. Hồ Chí Minh';
  }

  const distOptions = getDistrictsByProvince(matchedProvince);
  const matchedDistrict = distOptions.find((d) => {
    const dUn = removeVietnameseTones(d);
    const dClean = dUn.replace(/^(?:quan|huyen|thi xa|thanh pho|tp\.?)\s+/i, '').trim();
    if (/^\d+$/.test(dClean)) {
      return new RegExp(`(?:^|[^\\da-z])(?:quan|q\\.?)\\s*0?${parseInt(dClean, 10)}(?!\\d)`, 'i').test(unaccent);
    }
    return phraseInText(unaccent, dUn) || (dClean.length >= 2 && phraseInText(spacedNorm, dClean));
  }) || distOptions[0] || '';

  return { province: matchedProvince, district: matchedDistrict };
}

/**
 * 14. Chuẩn hóa Room ID & khớp phòng chat tách biệt theo từng Đơn ứng tuyển (application_id)
 */
export function buildApplicationChatRoomId({ employerId, studentUserId, applicationId } = {}) {
  if (!employerId || !studentUserId) return '';
  return applicationId
    ? `room_emp_${employerId}_stu_${studentUserId}_app_${applicationId}`
    : `room_emp_${employerId}_stu_${studentUserId}`;
}

export function extractApplicationIdFromRoomId(roomId) {
  const s = String(roomId || '');
  const idx = s.indexOf('_app_');
  if (idx === -1) return '';
  return s.slice(idx + 5).trim();
}

export function doesRoomMatchApplication(roomId, { employerId, studentUserId, applicationId } = {}) {
  const r = String(roomId || '').trim();
  if (!r) return false;
  const rAppId = extractApplicationIdFromRoomId(r);
  if (applicationId) {
    if (rAppId) return rAppId === String(applicationId);
    return false;
  }
  if (rAppId) return false;
  if (employerId && !r.includes(`room_emp_${employerId}_stu_`)) return false;
  if (studentUserId && !r.includes(`_stu_${studentUserId}`)) return false;
  return true;
}

/**
 * 15. Bộ helper đồng bộ Thời khóa biểu / Lịch ca làm theo tuần từ số liệu thực tế
 * Dùng chung cho Cổng Sinh Viên (my_shifts) và Cổng Nhà Tuyển Dụng (Lịch ca theo tuần T2 - CN)
 */
export function normalizeShiftStatus(appOrStatus, localOverrideStatus = null) {
  if (typeof appOrStatus === 'object' && appOrStatus !== null) {
    if (appOrStatus.is_cancelled || appOrStatus.application_status === 'cancelled' || appOrStatus.application_status === 'withdrawn') {
      return 'cancelled';
    }
    const raw = localOverrideStatus || appOrStatus.shift_status || appOrStatus.student_shift_status || 'upcoming';
    const s = String(raw).toLowerCase().trim();
    if (s === 'working' || s === 'in_progress') return 'in_progress';
    if (s === 'completed') return 'completed';
    if (s === 'absent') return 'absent';
    if (s === 'cancelled' || s === 'canceled') return 'cancelled';
    return 'upcoming';
  }
  const raw = appOrStatus || localOverrideStatus || 'upcoming';
  const s = String(raw).toLowerCase().trim();
  if (s === 'working' || s === 'in_progress') return 'in_progress';
  if (s === 'completed') return 'completed';
  if (s === 'absent') return 'absent';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  return 'upcoming';
}

export function parseShiftHoursFromRecord(app, job = null) {
  const explicitHours = Number(app?.hours_worked ?? 0);
  if (explicitHours > 0 && Number.isFinite(explicitHours)) {
    return Math.round(explicitHours * 10) / 10;
  }
  const txt = `${app?.work_time || ''} ${app?.shift_registered || ''} ${app?.shift_schedule || ''} ${app?.application_snapshot?.work_time || ''} ${job?.work_time || ''} ${job?.work_shift || ''}`;
  const m = txt.match(/(\d{1,2})[:h](\d{0,2})\s*[-–]\s*(\d{1,2})[:h](\d{0,2})/i);
  if (m) {
    const start = Number(m[1]) + (Number(m[2] || 0) / 60);
    const end = Number(m[3]) + (Number(m[4] || 0) / 60);
    if (end > start && end - start <= 16) {
      return Math.round((end - start) * 10) / 10;
    }
  }
  const dur = txt.match(/(\d+(?:[.,]\d+)?)\s*(?:tiếng|giờ)/i);
  if (dur) {
    const val = Number(dur[1].replace(',', '.'));
    if (val > 0 && val <= 16) return Math.round(val * 10) / 10;
  }
  return 0;
}

export function resolveShiftHourlyWage(app, job = null) {
  const isNeg = Boolean(app?.is_negotiable ?? app?.application_snapshot?.is_negotiable ?? job?.is_negotiable);
  if (isNeg) return 0;
  const minSal = Number(app?.salary_min ?? app?.application_snapshot?.salary_min ?? job?.salary_min ?? 0);
  const maxSal = Number(app?.salary_max ?? app?.application_snapshot?.salary_max ?? job?.salary_max ?? minSal);
  if (minSal > 0) return Math.round((minSal + Math.max(minSal, maxSal)) / 2);
  return 0;
}

export function getWeekBounds(weekKeyOrOffset = 0, refDate = new Date()) {
  let offset = 0;
  if (weekKeyOrOffset === 'prev') offset = -1;
  else if (weekKeyOrOffset === 'next') offset = 1;
  else if (weekKeyOrOffset === 'current' || weekKeyOrOffset === '' || weekKeyOrOffset == null) offset = 0;
  else offset = Number.isFinite(Number(weekKeyOrOffset)) ? Number(weekKeyOrOffset) : 0;

  const base = refDate instanceof Date && !isNaN(refDate.getTime()) ? refDate : new Date();
  const dayOfWeek = (base.getDay() + 6) % 7; // Mon=0 .. Sun=6
  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - dayOfWeek + offset * 7, 0, 0, 0, 0);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
  const weekDays = dayNames.map((dayName, idx) => {
    const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
    const dStr = String(dt.getDate()).padStart(2, '0');
    const mStr = String(dt.getMonth() + 1).padStart(2, '0');
    const yStr = dt.getFullYear();
    return {
      idx,
      dayName,
      label: dayName,
      shortDateStr: `${dStr}/${mStr}`,
      dateStr: `${dStr}/${mStr}/${yStr}`,
    };
  });

  return {
    offset,
    weekKey: offset < 0 ? 'prev' : offset > 0 ? 'next' : 'current',
    monday,
    sunday,
    weekDays,
    startDateStr: weekDays[0].dateStr,
    endDateStr: weekDays[6].dateStr,
  };
}

function _parseDateValue(rawDate) {
  if (!rawDate) return null;
  if (rawDate instanceof Date) return isNaN(rawDate.getTime()) ? null : rawDate;
  const s = String(rawDate).trim();
  if (!s) return null;
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const parsed = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  let isoLike = s.includes(' ') && /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s) ? s.replace(' ', 'T') : s;
  // Chuỗi ngày giờ do Backend ghi không kèm múi giờ -> mặc định là giờ Việt Nam (GMT+7), tránh lệch ngày theo máy người xem
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(isoLike)) {
    isoLike += '+07:00';
  }
  const parsed = new Date(isoLike);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function parseShiftExplicitDate(app, job = null) {
  if (!app && !job) return null;
  const rawDate = app?.shift_date || app?.work_date || app?.date || app?.start_date || job?.shift_date || job?.work_date;
  const direct = _parseDateValue(rawDate);
  if (direct) return direct;

  const text = `${app?.work_time || ''} ${app?.shift_registered || ''} ${app?.shift_schedule || ''} ${app?.cover_note || ''} ${job?.work_time || ''}`;
  const dmy = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const parsed = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const ymd = text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    const parsed = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

export function parseShiftAnchorDate(app, job = null) {
  const explicit = parseShiftExplicitDate(app, job);
  if (explicit) return explicit;

  const inferred = _inferShiftAnchorDate(app);
  if (!inferred) return null;

  // Ngày ca làm không được rơi trước ngày Nhà tuyển dụng đăng tin
  const postedRaw = job?.created_at || app?.job_created_at;
  const posted = _parseDateValue(postedRaw);
  if (posted) {
    const postedDay = new Date(posted.getFullYear(), posted.getMonth(), posted.getDate());
    const inferredDay = new Date(inferred.getFullYear(), inferred.getMonth(), inferred.getDate());
    if (inferredDay.getTime() < postedDay.getTime()) return postedDay;
  }
  return inferred;
}

function _inferShiftAnchorDate(app) {
  if (app?.accepted_at) {
    const acc = _parseDateValue(app.accepted_at);
    if (acc) return acc;
  }
  if (Array.isArray(app?.status_history)) {
    const acceptedItem = [...app.status_history].reverse().find(h => h && h.status === 'accepted' && h.updated_at);
    const histDt = _parseDateValue(acceptedItem?.updated_at);
    if (histDt) return histDt;
  }
  if (app?.shift_updated_at) {
    const sd = _parseDateValue(app.shift_updated_at);
    if (sd) return sd;
  }
  if (app?.attendance_marked_at) {
    const am = _parseDateValue(app.attendance_marked_at);
    if (am) return am;
  }
  if (app?.applied_at) {
    const ap = _parseDateValue(app.applied_at);
    if (ap) return ap;
  }
  return null;
}

export function resolveExplicitShiftWeekdays(app, job = null) {
  const text = `${app?.work_time || ''} ${app?.shift_registered || ''} ${app?.shift_schedule || ''} ${app?.application_snapshot?.work_time || ''} ${job?.work_time || ''} ${job?.work_shift || ''}`.toLowerCase();
  const days = new Set();

  if (/thứ\s*2\s*(?:đến|-|–)\s*thứ\s*6|\bt2\s*[-–]\s*t6\b/.test(text)) {
    [0, 1, 2, 3, 4].forEach(d => days.add(d));
  }
  if (/thứ\s*2\s*(?:đến|-|–)\s*thứ\s*7|\bt2\s*[-–]\s*t7\b/.test(text)) {
    [0, 1, 2, 3, 4, 5].forEach(d => days.add(d));
  }
  if (/(?:cả tuần|hàng ngày|tất cả các ngày|tất cả các thứ|thứ\s*2\s*(?:đến|-|–)\s*chủ\s*nhật|\bt2\s*[-–]\s*cn\b)/.test(text)) {
    [0, 1, 2, 3, 4, 5, 6].forEach(d => days.add(d));
  }
  if (/(?:cuối tuần|\bt7\s*[-–&]\s*cn\b|thứ\s*7\s*(?:&|và|,)\s*chủ\s*nhật)/.test(text)) {
    days.add(5);
    days.add(6);
  }

  if (/\b(?:thứ\s*2|t2)\b/.test(text)) days.add(0);
  if (/\b(?:thứ\s*3|t3)\b/.test(text)) days.add(1);
  if (/\b(?:thứ\s*4|t4)\b/.test(text) || /thứ\s*[23][,&\s]+4\b/.test(text)) days.add(2);
  if (/\b(?:thứ\s*5|t5)\b/.test(text) || /thứ\s*[234][,&\s]+5\b/.test(text)) days.add(3);
  if (/\b(?:thứ\s*6|t6)\b/.test(text) || /thứ\s*[2345][,&\s]+6\b/.test(text)) days.add(4);
  if (/\b(?:thứ\s*7|t7)\b/.test(text) || /thứ\s*[23456][,&\s]+7\b/.test(text)) days.add(5);
  if (/\b(?:chủ\s*nhật|chủ\s*nhât|cn)\b/.test(text)) days.add(6);

  if (days.size > 0) return Array.from(days).sort((a, b) => a - b);

  if (app?.day_index !== undefined && app?.day_index !== null && app?.day_index !== '') {
    const idx = Number(app.day_index);
    if (Number.isInteger(idx) && idx >= 0 && idx <= 6) return [idx];
  }
  if (app?.day_of_week !== undefined && app?.day_of_week !== null && app?.day_of_week !== '') {
    const idx = Number(app.day_of_week);
    if (Number.isInteger(idx) && idx >= 0 && idx <= 6) return [idx];
  }
  return [];
}

export function resolveShiftWeekdayIndices(app, job = null) {
  const explicitDate = parseShiftExplicitDate(app, job);
  if (explicitDate) {
    return [(explicitDate.getDay() + 6) % 7];
  }
  const explicitDays = resolveExplicitShiftWeekdays(app, job);
  if (explicitDays.length > 0) return explicitDays;

  const anchor = parseShiftAnchorDate(app, job);
  if (anchor) {
    return [(anchor.getDay() + 6) % 7];
  }
  return [];
}

export function doesShiftMatchWeek(app, job = null, weekKeyOrOffset = 0, refDate = new Date()) {
  const { offset, weekKey, monday, sunday } = getWeekBounds(weekKeyOrOffset, refDate);

  // 1. Trường tuần tường minh (shift_week / week / week_target)
  const explicitWeek = String(app?.shift_week || app?.week || app?.week_target || job?.shift_week || '').toLowerCase().trim();
  if (explicitWeek) {
    if (explicitWeek.includes('prev') || explicitWeek.includes('last') || explicitWeek.includes('truoc') || explicitWeek.includes('trước')) {
      return offset === -1;
    }
    if (explicitWeek.includes('current') || explicitWeek.includes('this') || explicitWeek.includes('nay') || explicitWeek.includes('này') || explicitWeek.includes('hien tai') || explicitWeek.includes('hiện tại')) {
      return offset === 0;
    }
    if (explicitWeek.includes('next') || explicitWeek.includes('toi') || explicitWeek.includes('tới') || explicitWeek.includes('sau')) {
      return offset === 1;
    }
    return false;
  }

  // 2. Từ khóa tuần trong mô tả ca
  const text = `${app?.work_time || ''} ${app?.shift_registered || ''} ${app?.shift_schedule || ''} ${job?.work_time || ''}`.toLowerCase();
  if (text.includes('tuần trước') || text.includes('tuan truoc') || text.includes('last week') || text.includes('previous week')) {
    return weekKey === 'prev';
  }
  if (text.includes('tuần tới') || text.includes('tuần sau') || text.includes('tuan toi') || text.includes('tuan sau') || text.includes('next week')) {
    return weekKey === 'next';
  }
  if (text.includes('tuần này') || text.includes('tuần hiện tại') || text.includes('tuan nay') || text.includes('tuan hien tai') || text.includes('this week') || text.includes('current week')) {
    return weekKey === 'current';
  }

  // 3. Ngày ca làm cụ thể (shift_date / work_date / DD-MM-YYYY)
  const explicitDate = parseShiftExplicitDate(app, job);
  if (explicitDate) {
    const t = explicitDate.getTime();
    return t >= monday.getTime() && t <= sunday.getTime();
  }

  // 4. Lịch làm cố định theo thứ trong tuần (vd: Thứ 2 - Thứ 6, Cuối tuần...)
  const explicitDays = resolveExplicitShiftWeekdays(app, job);
  const anchor = parseShiftAnchorDate(app, job);
  if (explicitDays.length > 0) {
    if (anchor) {
      const anchorBounds = getWeekBounds(0, anchor);
      // Ca lặp theo thứ chỉ hiển thị từ tuần được nhận ca (anchorWeek) trở đi, tránh hiện ngược về tuần trước khi chưa nhận việc
      return monday.getTime() >= anchorBounds.monday.getTime();
    }
    return offset >= 0;
  }

  // 5. Ca đơn không ghi rõ thứ cố định: hiển thị đúng tuần phát sinh (tuần nhận việc/nộp đơn)
  if (anchor) {
    const t = anchor.getTime();
    return t >= monday.getTime() && t <= sunday.getTime();
  }

  return offset === 0;
}

export function doesShiftMatchDay(app, job = null, dayItem, dayIdx) {
  if (!app || !dayItem) return false;
  const explicitDate = parseShiftExplicitDate(app, job);
  if (explicitDate) {
    const dStr = `${String(explicitDate.getDate()).padStart(2, '0')}/${String(explicitDate.getMonth() + 1).padStart(2, '0')}/${explicitDate.getFullYear()}`;
    return dStr === dayItem.dateStr;
  }
  return resolveShiftWeekdayIndices(app, job).includes(dayIdx);
}

export function resolveShiftTimeMeta(app, job = null) {
  if (!app) return null;
  const wtRaw = String(app.work_time || app.shift_schedule || app.shift_registered || job?.work_time || job?.work_shift || '').trim();
  const wt = wtRaw.toLowerCase();
  const parsedHrs = parseShiftHoursFromRecord(app, job);
  const exactRangeMatch = wtRaw.match(/(\d{1,2}[:h]\d{0,2})\s*[-–]\s*(\d{1,2}[:h]\d{0,2})/i);
  const normalizedRange = exactRangeMatch
    ? `${exactRangeMatch[1].replace('h', ':')} - ${exactRangeMatch[2].replace('h', ':')}`
    : '';

  let shiftName = 'Ca linh hoạt';
  let timeRange = normalizedRange || 'Theo lịch ca';
  let badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';

  if (wt.includes('sáng') || wt.includes('07:') || wt.includes('06:') || wt.includes('08:')) {
    shiftName = 'Ca sáng';
    if (!normalizedRange) timeRange = '07:00 - 12:00';
    badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
  } else if (wt.includes('chiều') || wt.includes('13:') || wt.includes('12:') || wt.includes('14:')) {
    shiftName = 'Ca chiều';
    if (!normalizedRange) timeRange = '13:00 - 18:00';
    badgeClass = 'bg-sky-100 text-sky-900 border-sky-300';
  } else if (wt.includes('tối') || wt.includes('18:') || wt.includes('19:')) {
    shiftName = 'Ca tối';
    if (!normalizedRange) timeRange = '18:00 - 23:00';
    badgeClass = 'bg-indigo-100 text-indigo-900 border-indigo-300';
  }

  return {
    shiftName,
    timeRange,
    hours: parsedHrs,
    shiftHours: parsedHrs > 0 ? `${parsedHrs} giờ/ca` : 'Linh hoạt',
    badgeClass,
  };
}

export function computeAcceptedShiftsSummary(applicationsList = [], jobsList = [], localShiftStatuses = {}) {
  let totalHours = 0;
  let estimatedIncome = 0;
  let completedCount = 0;
  let inProgressCount = 0;
  let upcomingCount = 0;
  let absentCount = 0;
  let cancelledCount = 0;
  let hasWageData = false;

  applicationsList.forEach((app) => {
    const linkedJob = jobsList.find(j => j._id === (app?.job_id || app?.job?._id)) || null;
    const st = normalizeShiftStatus(app, localShiftStatuses[`shift_${app?._id}`] || localShiftStatuses[app?._id]);
    if (st === 'completed') completedCount += 1;
    else if (st === 'in_progress') inProgressCount += 1;
    else if (st === 'absent') absentCount += 1;
    else if (st === 'cancelled') cancelledCount += 1;
    else upcomingCount += 1;

    if (st === 'cancelled' || st === 'absent') return;
    const hrs = parseShiftHoursFromRecord(app, linkedJob);
    const avgSal = resolveShiftHourlyWage(app, linkedJob);
    if (avgSal > 0) hasWageData = true;
    totalHours += hrs;
    estimatedIncome += hrs * avgSal;
  });

  return {
    totalShifts: applicationsList.length,
    completedCount,
    inProgressCount,
    upcomingCount,
    absentCount,
    cancelledCount,
    activeShiftCount: upcomingCount + inProgressCount,
    totalHours: Math.round(totalHours * 10) / 10,
    estimatedIncome: Math.round(estimatedIncome),
    hasWageData,
  };
}

/**
 * BẢN ĐỒ CÁC QUẬN/HUYỆN LIỀN KỀ (ADJACENCY MATRIX) - TP. HỒ CHÍ MINH
 * Phục vụ phân tầng ưu tiên khoảng cách lân cận địa chỉ cư trú của sinh viên
 */
export const HCMC_DISTRICT_ADJACENCY = {
  "quận 1": ["quận 3", "quận 4", "quận bình thạnh", "quận phú nhuận", "quận 5", "tp. thủ đức", "quận 2"],
  "quận 3": ["quận 1", "quận 10", "quận phú nhuận", "quận tân bình"],
  "quận 4": ["quận 1", "quận 7", "quận 8", "tp. thủ đức", "quận 2"],
  "quận 5": ["quận 1", "quận 6", "quận 8", "quận 10", "quận 11"],
  "quận 6": ["quận 5", "quận 8", "quận 11", "quận bình tân"],
  "quận 7": ["quận 4", "quận 8", "huyện nhà bè", "huyện bình chánh", "tp. thủ đức", "quận 2"],
  "quận 8": ["quận 4", "quận 5", "quận 6", "quận 7", "huyện bình chánh"],
  "quận 10": ["quận 3", "quận 5", "quận 11", "quận tân bình", "quận 1"],
  "quận 11": ["quận 5", "quận 6", "quận 10", "quận tân bình", "quận tân phú"],
  "quận 12": ["quận gò vấp", "quận tân bình", "quận tân phú", "quận bình tân", "huyện hóc môn", "tp. thủ đức"],
  "quận bình tân": ["quận 6", "quận 8", "quận 12", "quận tân phú", "huyện bình chánh"],
  "quận bình thạnh": ["quận 1", "quận phú nhuận", "quận gò vấp", "tp. thủ đức", "quận 2"],
  "quận gò vấp": ["quận 12", "quận bình thạnh", "quận phú nhuận", "quận tân bình"],
  "quận phú nhuận": ["quận 1", "quận 3", "quận bình thạnh", "quận gò vấp", "quận tân bình"],
  "quận tân bình": ["quận 3", "quận 10", "quận 11", "quận 12", "quận gò vấp", "quận phú nhuận", "quận tân phú"],
  "quận tân phú": ["quận 11", "quận 12", "quận bình tân", "quận tân bình"],
  "tp. thủ đức": ["quận 1", "quận 4", "quận 7", "quận bình thạnh", "quận 12"],
  "quận 2": ["quận 1", "quận 4", "quận 7", "quận bình thạnh"],
  "quận 9": ["tp. thủ đức"],
  "huyện bình chánh": ["quận 7", "quận 8", "quận bình tân", "huyện nhà bè", "huyện hóc môn"],
  "huyện hóc môn": ["quận 12", "huyện củ chi", "huyện bình chánh"],
  "huyện củ chi": ["huyện hóc môn"],
  "huyện nhà bè": ["quận 7", "huyện bình chánh", "huyện cần giờ"],
  "huyện cần giờ": ["huyện nhà bè"]
};

/**
 * BẢN ĐỒ CÁC QUẬN/HUYỆN LIỀN KỀ - HÀ NỘI
 */
export const HANOI_DISTRICT_ADJACENCY = {
  "quận ba đình": ["quận tây hồ", "quận đống đa", "quận hoàn kiếm", "quận cầu giấy"],
  "quận cầu giấy": ["quận ba đình", "quận đống đa", "quận nam từ liêm", "quận bắc từ liêm", "quận thanh xuân", "quận tây hồ"],
  "quận đống đa": ["quận ba đình", "quận hoàn kiếm", "quận hai bà trưng", "quận thanh xuân", "quận cầu giấy"],
  "quận hai bà trưng": ["quận hoàn kiếm", "quận đống đa", "quận hoàng mai", "quận long biên"],
  "quận hoàn kiếm": ["quận ba đình", "quận đống đa", "quận hai bà trưng", "quận long biên", "quận tây hồ"],
  "quận hoàng mai": ["quận hai bà trưng", "quận thanh xuân", "quận long biên", "huyện thanh trì"],
  "quận long biên": ["quận hoàn kiếm", "quận hai bà trưng", "quận ba đình", "quận tây hồ", "huyện gia lâm"],
  "quận tây hồ": ["quận ba đình", "quận cầu giấy", "quận bắc từ liêm", "quận long biên"],
  "quận thanh xuân": ["quận đống đa", "quận cầu giấy", "quận hai bà trưng", "quận hoàng mai", "quận nam từ liêm", "quận hà đông"],
  "quận bắc từ liêm": ["quận cầu giấy", "quận nam từ liêm", "quận tây hồ", "huyện đan phượng", "huyện hoài đức"],
  "quận nam từ liêm": ["quận cầu giấy", "quận bắc từ liêm", "quận thanh xuân", "quận hà đông", "huyện hoài đức"],
  "quận hà đông": ["quận thanh xuân", "quận nam từ liêm", "huyện thanh trì", "huyện hoài đức"]
};

/**
 * THUẬT TOÁN TÍNH ĐIỂM ƯU TIÊN THEO ĐỊA CHỈ CƯ TRÚ CỦA SINH VIÊN
 * Phân tầng chuẩn xác:
 * - Level 1: Cùng đúng Quận/Huyện cư trú: 10.000 điểm
 * - Level 2: Quận/Huyện giáp ranh lân cận trực tiếp: 7.000 điểm
 * - Level 3: Quận lân cận kế cận (cách 1 quận trong cùng TP): 5.000 điểm
 * - Level 4: Quận/Huyện khác trong cùng Tỉnh/TP: 3.000 điểm
 * - Level 5: Khác Tỉnh/Thành phố: 0 điểm
 */
export function calculateLocationProximityScore(jobLocStr, userAddrStr, categories = []) {
  if (!userAddrStr || !userAddrStr.trim() || !jobLocStr || !jobLocStr.trim()) return 0;
  const uLoc = extractProvinceAndDistrict(userAddrStr, categories);
  const jLoc = extractProvinceAndDistrict(jobLocStr, categories);

  const cleanDist = (d) => {
    if (!d) return '';
    return removeVietnameseTones(String(d).toLowerCase().replace(/^(quận|huyện|tp\.?|thành phố|thị xã)\s+/i, '')).trim();
  };

  if (!uLoc.province || !jLoc.province) {
    const uLow = removeVietnameseTones(userAddrStr.toLowerCase());
    const jLow = removeVietnameseTones(jobLocStr.toLowerCase());
    const segs = uLow.split(/[,;\-\/]+/).map(s => s.trim()).filter(s => s.length >= 2);
    for (const seg of segs) {
      if (jLow.includes(seg)) return 3000;
    }
    return 0;
  }

  // Khác Tỉnh/Thành phố -> 0 điểm
  if (uLoc.province !== jLoc.province) {
    return 0;
  }

  const uDistNorm = cleanDist(uLoc.district);
  const jDistNorm = cleanDist(jLoc.district);

  // Level 1: Cùng đúng Quận/Huyện
  if (uDistNorm && jDistNorm && uDistNorm === jDistNorm) {
    return 10000;
  }

  const uFullDist = (uLoc.district || '').toLowerCase().trim();
  const adjMap = uLoc.province.includes('Hà Nội') ? HANOI_DISTRICT_ADJACENCY : HCMC_DISTRICT_ADJACENCY;
  const uNeighbors = adjMap[uFullDist] || [];

  // Level 2: Quận giáp ranh trực tiếp
  if (uNeighbors.some(n => cleanDist(n) === jDistNorm)) {
    return 7000;
  }

  // Level 3: Quận lân cận kế cận (cách 1 quận)
  for (const n of uNeighbors) {
    const secondNeighbors = adjMap[n] || [];
    if (secondNeighbors.some(sn => cleanDist(sn) === jDistNorm)) {
      return 5000;
    }
  }

  // Level 4: Khác quận nhưng cùng Tỉnh/Thành phố
  return 3000;
}

