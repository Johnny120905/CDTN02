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
    .replace(/\bdh\b/g, 'dai hoc')
    .replace(/\bcd\b/g, 'cao dang')
    .replace(/\btp\s*hcm\b|\btphcm\b|\bsai gon\b/g, 'ho chi minh')
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
 */
export function matchKeywordFlexible(item, searchQuery, fields = ['title', 'company_name', 'description', 'location', 'address']) {
  if (!searchQuery || !String(searchQuery).trim()) return true;

  const rawQuery = String(searchQuery).trim().toLowerCase();
  if (rawQuery === 'all' || rawQuery === 'tất cả' || rawQuery.startsWith('mọi ') || rawQuery.startsWith('tất cả ')) {
    return true;
  }

  // Tập hợp toàn bộ nội dung từ các trường được chỉ định
  const values = [];
  fields.forEach(f => {
    const val = item && item[f];
    if (val !== undefined && val !== null) {
      if (Array.isArray(val)) values.push(val.join(' '));
      else values.push(String(val));
    }
  });

  const targets = buildSearchTargets(values);
  return matchQueryAgainstTargets(targets, rawQuery);
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
  const jCatCandidates = [jCatName, jCatId].filter(Boolean);
  const jTitle = String(job.title || '');
  const jDesc = String(job.description || '');

  // 1. Khớp trực tiếp mã ID hoặc tên lưu thẳng trong category_id
  if (jCatId && (jCatId === selRaw || jCatId.toLowerCase() === selLower || removeVietnameseTones(jCatId) === selUnaccent)) {
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
    for (const jCand of jCatCandidates) {
      const jCatLower = jCand.toLowerCase().trim();
      const jCatUn = removeVietnameseTones(jCand);
      if (jCatLower === catObjNameLower || jCatLower.includes(catObjNameLower) || catObjNameLower.includes(jCatLower)) return true;
      if (jCatUn && catObjNameUnaccent && (jCatUn === catObjNameUnaccent || jCatUn.includes(catObjNameUnaccent) || catObjNameUnaccent.includes(jCatUn))) return true;
    }
  }

  // 3. Khớp theo nhóm ngành nghề tiêu chuẩn (Semantic Category Map - chuẩn hóa không dấu)
  const categorySemanticKeywords = {
    'f&b': ['pha che', 'barista', 'phuc vu', 'cafe', 'ca phe', 'f&b', 'do uong', 'tra sua', 'nha hang', 'quan an'],
    'pha che': ['pha che', 'barista', 'tra sua', 'ca phe', 'cafe', 'f&b'],
    'phuc vu': ['phuc vu', 'chay ban', 'tiep thuc', 'nha hang', 'cafe', 'ca phe'],
    'ban hang': ['ban hang', 'thu ngan', 'sieu thi', 'tien loi', 'cua hang', 'ban le', 'co.op', 'winmart', 'circle k', '7-eleven'],
    'thu ngan': ['thu ngan', 'cashier', 'tinh tien', 'quay thu ngan'],
    'gia su': ['gia su', 'tro giang', 'giao duc', 'day kem', 'tieng anh', 'toan', 'ly', 'hoa', 'tieu hoc'],
    'tro giang': ['tro giang', 'teaching assistant', 'trung tam'],
    'thiet ke': ['thiet ke', 'do hoa', 'design', 'designer', 'photoshop', 'illustrator', 'canva', 'figma', 'video', 'editor'],
    'rua chen': ['rua chen', 'phu bep', 'tap vu', 'so che', 'kitchen'],
    'marketing': ['marketing', 'truyen thong', 'content', 'social', 'tiktok', 'pr', 'seeding', 'ads'],
    'cntt': ['cntt', 'cong nghe thong tin', 'it', 'lap trinh', 'phan mem', 'developer', 'ky thuat', 'ho tro ky thuat', 'truc tong dai'],
    'giao hang': ['giao hang', 'shipper', 'kho', 'logistics', 'van chuyen', 'dong goi', 'giao hang tiet kiem', 'shopee', 'lazada', 'grab'],
    'shipper': ['shipper', 'giao hang', 'shopee', 'grab', 'be', 'giao do'],
    'cham soc khach hang': ['cskh', 'cham soc khach hang', 'telesales', 'tu van', 'truc tong dai', 'customer service'],
    'le tan': ['le tan', 'receptionist', 'hanh chinh', 'van phong', 'nhap lieu', 'thu vien', 'toa nha'],
    'su kien': ['su kien', 'pg', 'pb', 'sampling', 'tiep thi', 'trien lam', 'event'],
    'khach san': ['khach san', 'hotel', 'resort', 'rap chieu phim', 'cgv', 'lotte'],
    'an ninh': ['an ninh', 'bao ve', 'security', 'phu bep', 'so che', 'tap vu']
  };

  const fullJobSearchText = removeVietnameseTones(`${jTitle} ${jCatCandidates.join(' ')} ${jDesc}`);
  const matchSemanticKw = (text, kw) => {
    if (kw.length <= 3) {
      return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(kw)}(?![a-z0-9])`).test(text);
    }
    return text.includes(kw);
  };

  // Quét các từ khóa của nhóm được chọn
  for (const [groupKey, keywords] of Object.entries(categorySemanticKeywords)) {
    if (selUnaccent.includes(groupKey)) {
      if (keywords.some(kw => matchSemanticKw(fullJobSearchText, kw))) {
        return true;
      }
    }
  }

  // Khớp chuỗi trực tiếp giữa tên danh mục và tên/ID ngành nghề của job
  for (const jCand of jCatCandidates) {
    const jCatUn = removeVietnameseTones(jCand);
    if (jCatUn && selUnaccent && (jCatUn.includes(selUnaccent) || selUnaccent.includes(jCatUn))) return true;
  }

  // Khớp từ khóa nòng cốt trong tiêu đề công việc
  const coreWords = selUnaccent.split(/[\/\&,\-]+/).map(s => s.trim()).filter(s => s.length >= 3);
  if (coreWords.some(w => fullJobSearchText.includes(w))) {
    return true;
  }

  return false;
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

/**
 * 7. Khớp địa lý đa tầng thông minh (Location Matching)
 * Tự động nhận diện Tỉnh/Thành qua tên, alias và danh sách 24 quận/huyện
 */
export function matchLocationFlexible(job, selectedProvince, selectedDistricts = [], customLocationText = '') {
  const locTokens = [
    job.location,
    job.address,
    job.branch_name,
    job.district,
    job.province,
    job.city,
    job.company_name
  ].filter(Boolean);

  const locTargets = buildSearchTargets(locTokens);
  const fullLoc = locTargets.fullText;
  const fullLocUnaccent = locTargets.fullTextUnaccent;
  const fullLocNorm = locTargets.fullTextNorm;

  const matchSingleDistrict = (d) => {
    const dLow = String(d || '').toLowerCase().trim();
    const dUn = removeVietnameseTones(dLow);
    const dNorm = normalizeSearchSynonyms(splitLetterDigit(dUn));
    const dClean = dNorm.replace(/^(quan|huyen|thi xa|thanh pho|tp\.?)\s+/i, '').trim();
    if (/^\d+$/.test(dClean)) {
      const cleanNum = String(parseInt(dClean, 10));
      const isDistrictPrefix = /^(?:quan|q\b|q\.|huyen|thi xa)/i.test(dUn);
      if (isDistrictPrefix) {
        return new RegExp(`(?:^|[^\\da-z])(?:quan|q\\.?|huyen)\\s*0?${cleanNum}(?!\\d)`, 'i').test(fullLocUnaccent) ||
          new RegExp(`\\b(?:quan|huyen)\\s*0?${cleanNum}(?!\\d)`, 'i').test(fullLocNorm);
      }
      return new RegExp(`(?:^|[^\\da-z])(?:quan|q\\.?|p\\.?|phuong|huyen)\\s*0?${cleanNum}(?!\\d)`, 'i').test(fullLocUnaccent) ||
        new RegExp(`\\b(?:quan|huyen|phuong)\\s*0?${cleanNum}(?!\\d)`, 'i').test(fullLocNorm);
    }
    return phraseInText(fullLoc, dLow) ||
      phraseInText(fullLocUnaccent, dUn) ||
      (dClean && phraseInText(fullLocNorm, dClean)) ||
      matchQueryAgainstTargets(locTargets, dLow);
  };

  // 1. Kiểm tra Tỉnh / Thành phố (hoặc Địa điểm Master Data động)
  if (
    selectedProvince &&
    selectedProvince !== 'all' &&
    selectedProvince !== 'Toàn quốc' &&
    selectedProvince !== 'Toàn quốc (Tất cả Tỉnh/Thành phố)' &&
    selectedProvince !== 'Tất cả' &&
    selectedProvince !== 'Tất cả địa điểm'
  ) {
    const provLower = String(selectedProvince).trim().toLowerCase();
    const provUnaccent = removeVietnameseTones(selectedProvince);
    const isKnownProvince = Object.prototype.hasOwnProperty.call(PROVINCE_DISTRICTS_MAP, selectedProvince);

    let matchProv = false;

    if (selectedProvince === 'TP. Hồ Chí Minh' || provUnaccent.includes('ho chi minh') || provUnaccent === 'tphcm' || provUnaccent === 'tp.hcm') {
      matchProv = /\b(?:ho chi minh|hcm|tphcm|tp\s*\.?\s*hcm|sai gon|ben nghe)\b/i.test(fullLocUnaccent);
      if (!matchProv) {
        const hcmDistricts = PROVINCE_DISTRICTS_MAP['TP. Hồ Chí Minh'] || [];
        matchProv = hcmDistricts.some(matchSingleDistrict);
      }
    } else if (selectedProvince === 'Hà Nội' || provUnaccent === 'ha noi') {
      matchProv = /\b(?:ha noi|hn|cau giay|dong da|ba dinh|hoan kiem|hai ba trung|thanh xuan|tay ho|hoang mai|long bien|ha dong|nam tu liem|bac tu liem)\b/i.test(fullLocUnaccent);
    } else if (isKnownProvince) {
      matchProv = phraseInText(fullLoc, provLower) || phraseInText(fullLocUnaccent, provUnaccent);
      if (!matchProv) {
        const distList = PROVINCE_DISTRICTS_MAP[selectedProvince] || [];
        matchProv = distList.some(matchSingleDistrict);
      }
    } else {
      // Địa điểm tùy chỉnh do Admin tạo (VD: "Quận 1", "Bình Thạnh", "TP. Thủ Đức") -> khớp có ranh giới để không lẫn Quận 1 vs Quận 10
      matchProv = matchSingleDistrict(selectedProvince);
    }

    if (!matchProv) return false;
  }

  // 2. Nếu người dùng chọn lọc thêm danh sách Quận / Huyện (kể cả khi đang để Toàn quốc)
  if (selectedDistricts && selectedDistricts.length > 0) {
    const validDistricts = selectedDistricts.filter(d => d && String(d).trim() && String(d).toLowerCase() !== 'all');
    if (validDistricts.length > 0 && !validDistricts.some(matchSingleDistrict)) {
      return false;
    }
  }

  // 3. Ô nhập tay tùy chỉnh địa điểm (hỗ trợ đầy đủ viết hoa/thường, không dấu, dính liền, chữ kèm số, tiền tố Chi nhánh)
  if (customLocationText && customLocationText.trim()) {
    const rawCustom = customLocationText.trim().toLowerCase();
    if (rawCustom !== 'all' && rawCustom !== 'tất cả' && !rawCustom.startsWith('tất cả ')) {
      if (!matchQueryAgainstTargets(locTargets, rawCustom)) {
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
    const roleTok = localStorage.getItem(`partime_${role}_token`);
    if (roleTok) return roleTok;
  }
  const tabRole = sessionStorage.getItem('partime_tab_role');
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
  const raw = typeof appOrStatus === 'object' && appOrStatus !== null
    ? (appOrStatus.shift_status || localOverrideStatus || 'upcoming')
    : (appOrStatus || localOverrideStatus || 'upcoming');
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
  const isoLike = s.includes(' ') && /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s) ? s.replace(' ', 'T') : s;
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
