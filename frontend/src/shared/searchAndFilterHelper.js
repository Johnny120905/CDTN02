/**
 * ADVANCED SEARCH & FILTER HELPER (PARTIME.VN)
 * Cung cấp giải thuật chuẩn hóa tiếng Việt, ánh xạ thông minh Master Data,
 * xử lý số tiền lương và tìm kiếm đa từ khóa không bao giờ làm mất dữ liệu.
 */

import { PROVINCE_DISTRICTS_MAP } from './vietnamLocations.js';

/**
 * 1. Bỏ dấu tiếng Việt toàn diện (Remove Vietnamese Diacritics)
 * Hỗ trợ cả ký tự đơn và ký tự tổ hợp Unicode (NFD)
 */
export function removeVietnameseTones(str) {
  if (!str) return '';
  let s = String(str);
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
 * Chuẩn hóa các từ viết tắt & tiền tố phổ biến tiếng Việt (ĐH -> Đại học, TP.HCM -> Hồ Chí Minh, bỏ ngoặc đơn...)
 */
function normalizeSearchSynonyms(textUnaccent) {
  if (!textUnaccent) return '';
  return textUnaccent
    .replace(/[()[\],.;:/\\\-_+]+/g, ' ')
    .replace(/\bdh\b/g, 'dai hoc')
    .replace(/\bcd\b/g, 'cao dang')
    .replace(/\btp\s*hcm\b|\btphcm\b|\bsai gon\b/g, 'ho chi minh')
    .replace(/\btp\s+/g, 'thanh pho ')
    .replace(/\bq\s*\.?\s*0?(\d+)\b/g, 'quan $1')
    .replace(/\bp\s*\.?\s*0?(\d+)\b/g, 'phuong $1')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function phraseInText(text, phrase) {
  if (!phrase) return false;
  if (!text) return false;
  // Tránh "quận 1" khớp nhầm "quận 10/11/12", nhưng giữ nguyên tìm kiếm tiền tố SĐT/MST (>= 4 chữ số)
  if (/^\d{1,3}$/.test(phrase)) {
    const cleanNum = String(parseInt(phrase, 10));
    return new RegExp(`(^|\\D)0?${cleanNum}(?!\\d)`).test(text);
  }
  if (/\d$/.test(phrase) && !/^\d{4,}$/.test(phrase)) {
    return new RegExp(`(?:^|[^\\da-z])${escapeRegExp(phrase)}(?!\\d)`).test(text);
  }
  return text.includes(phrase);
}

function tokenInText(textNormalized, tok) {
  if (!tok) return true;
  if (/^\d{1,3}$/.test(tok)) {
    const cleanNum = String(parseInt(tok, 10));
    const re = new RegExp(`(^|\\D)0?${cleanNum}(?!\\d)`);
    return re.test(textNormalized);
  }
  return textNormalized.includes(tok);
}

/**
 * 3. Tìm kiếm từ khóa linh hoạt đa từ (Flexible Keyword Search)
 * Cho phép tìm kiếm cả có dấu, không dấu, từ viết tắt (ĐH, TP.HCM), gợi ý kèm ngoặc đơn (VD: "Pha chế (Barista)"),
 * và tiền tố chi nhánh (VD: "Chi nhánh Quận 1") mà không làm mất dữ liệu.
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

  const fullText = values.join(' ').toLowerCase();
  const fullTextUnaccent = removeVietnameseTones(fullText);
  const fullTextNorm = normalizeSearchSynonyms(fullTextUnaccent);

  const queryUnaccent = removeVietnameseTones(rawQuery);
  const queryNorm = normalizeSearchSynonyms(queryUnaccent);

  // 1. Khớp cụm trực tiếp (có dấu hoặc không dấu, có kiểm tra biên số tránh "Quận 1" khớp "Quận 10")
  if (phraseInText(fullText, rawQuery) || phraseInText(fullTextUnaccent, queryUnaccent) || (queryNorm && phraseInText(fullTextNorm, queryNorm))) {
    return true;
  }

  // 2. Tạo các biến thể ứng cử viên từ query (VD: "Pha chế (Barista)" -> ["pha che", "barista"]; "ĐH Kinh Tế TP.HCM (UEH)" -> ["dai hoc kinh te", "ueh"]; "Chi nhánh Quận 1" -> ["quan 1"])
  const candidates = new Set();
  if (queryNorm) candidates.add(queryNorm);

  // Tách nội dung chính (ngoài ngoặc) và nội dung trong ngoặc đơn (...)
  const withoutParens = normalizeSearchSynonyms(queryUnaccent.replace(/\([^)]*\)/g, ' '));
  if (withoutParens) {
    candidates.add(withoutParens);
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

  // Loại bỏ tiền tố chỉ mục UI như "chi nhanh", "co so", "nganh"
  [withoutParens, queryNorm].filter(Boolean).forEach(cand => {
    const stripped = cand.replace(/^(chi nhanh|co so|khu vuc|vi tri|nganh)\s+/g, '').trim();
    if (stripped && stripped.length >= 2) candidates.add(stripped);
  });

  // 3. Khớp từng từ khóa theo từng biến thể (tất cả token của biến thể đều có trong bản ghi, số phải khớp biên ranh giới)
  for (const cand of candidates) {
    const tokens = cand.split(/\s+/).filter(Boolean);
    if (tokens.length > 0 && tokens.every(tok => tokenInText(fullTextNorm, tok) || tokenInText(fullTextUnaccent, tok))) {
      return true;
    }
  }

  return false;
}

/**
 * 4. Ánh xạ danh mục ngành nghề thông minh (Category Semantic Matching)
 * Khớp chuẩn xác giữa JOB_CATEGORIES nhóm ngành và tin tuyển dụng chi tiết
 */
export function matchCategoryFlexible(job, selectedCat, allCategories = []) {
  if (!selectedCat || selectedCat === 'all' || selectedCat === 'Tất cả ngành nghề' || selectedCat === '') {
    return true;
  }

  const selRaw = String(selectedCat).trim();
  const selLower = selRaw.toLowerCase();
  const selUnaccent = removeVietnameseTones(selRaw);

  const jCatId = String(job.category_id || '');
  const jCatName = String(job.category_name || job.category || '');
  const jTitle = String(job.title || '');
  const jDesc = String(job.description || '');

  // 1. Khớp trực tiếp mã ID
  if (jCatId && jCatId === selRaw) return true;

  // 2. Nếu selectedCat là ID trong danh mục Master Data động
  const matchedCatObj = allCategories.find(c => 
    c._id === selRaw || 
    (c.name && c.name.toLowerCase() === selLower) ||
    (c.name && removeVietnameseTones(c.name) === selUnaccent)
  );

  if (matchedCatObj) {
    if (jCatId && matchedCatObj._id && jCatId === matchedCatObj._id) return true;
    const catObjNameLower = (matchedCatObj.name || '').toLowerCase().trim();
    const catObjNameUnaccent = removeVietnameseTones(matchedCatObj.name || '');
    const jCatTrim = jCatName.trim();
    if (jCatTrim) {
      const jCatLower = jCatTrim.toLowerCase();
      const jCatUn = removeVietnameseTones(jCatTrim);
      if (jCatLower.includes(catObjNameLower) || catObjNameLower.includes(jCatLower)) return true;
      if (jCatUn && catObjNameUnaccent && (jCatUn.includes(catObjNameUnaccent) || catObjNameUnaccent.includes(jCatUn))) return true;
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
    'giao hang': ['giao hang', 'shipper', 'kho', 'logistics', 'van chuyen', 'dong goi', 'giao hang tiet kiem', 'shopee', 'lazada', 'grab'],
    'shipper': ['shipper', 'giao hang', 'shopee', 'grab', 'be', 'giao do'],
    'cham soc khach hang': ['cskh', 'cham soc khach hang', 'telesales', 'tu van', 'truc tong dai', 'customer service'],
    'le tan': ['le tan', 'receptionist', 'hanh chinh', 'van phong', 'nhap lieu', 'thu vien', 'toa nha'],
    'su kien': ['su kien', 'pg', 'pb', 'sampling', 'tiep thi', 'trien lam', 'event'],
    'khach san': ['khach san', 'hotel', 'resort', 'rap chieu phim', 'cgv', 'lotte'],
    'an ninh': ['an ninh', 'bao ve', 'security', 'phu bep', 'so che', 'tap vu']
  };

  const fullJobSearchText = removeVietnameseTones(`${jTitle} ${jCatName} ${jDesc}`);
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

  // Khớp chuỗi trực tiếp giữa tên danh mục và tên ngành nghề của job
  if (jCatName && jCatName.trim()) {
    const jCatUn = removeVietnameseTones(jCatName);
    if (jCatUn && (jCatUn.includes(selUnaccent) || selUnaccent.includes(jCatUn))) return true;
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
 * Nhận diện cả chữ tiếng Việt lẫn mốc giờ (07:00, 13:00, 18:00...)
 */
export function matchShiftFlexible(job, selectedShift) {
  if (!selectedShift || selectedShift === 'all') return true;

  const rawShiftTokens = [
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
    job.application_snapshot?.work_time,
    job.title,
    job.description
  ];

  if (Array.isArray(job.shifts)) {
    job.shifts.forEach(s => {
      if (typeof s === 'string') rawShiftTokens.push(s);
      else if (s && typeof s === 'object') {
        rawShiftTokens.push(s.name, s.time, s.type, s.title);
      }
    });
  }

  const shiftText = rawShiftTokens.filter(Boolean).join(' ').toLowerCase();
  const shiftTextUnaccent = removeVietnameseTones(shiftText);

  if (selectedShift === 'morning') {
    return shiftTextUnaccent.includes('sang') ||
      shiftText.includes('morning') ||
      /0?[6789]:\d\d|1[012]:\d\d/.test(shiftText) ||
      shiftText.includes('7:00') || shiftText.includes('07:00') ||
      shiftText.includes('8:00') || shiftText.includes('08:00');
  }

  if (selectedShift === 'afternoon') {
    return shiftTextUnaccent.includes('chieu') ||
      shiftText.includes('afternoon') ||
      /1[345678]:\d\d/.test(shiftText) ||
      shiftText.includes('13:00') || shiftText.includes('14:00') || shiftText.includes('17:00');
  }

  if (selectedShift === 'evening') {
    return shiftTextUnaccent.includes('toi') ||
      shiftText.includes('evening') || shiftText.includes('night') ||
      /1[89]:\d\d|2[0123]:\d\d/.test(shiftText) ||
      shiftText.includes('18:00') || shiftText.includes('19:00') || shiftText.includes('22:00') || shiftText.includes('22:30');
  }

  if (selectedShift === 'flexible') {
    return shiftTextUnaccent.includes('linh hoat') ||
      shiftTextUnaccent.includes('tu chon') ||
      shiftTextUnaccent.includes('lich hoc') ||
      shiftText.includes('flexible') ||
      shiftTextUnaccent.includes('theo ca');
  }

  return true;
}

/**
 * 6. Khớp khoảng lương theo giờ giao thoa (Salary Bracket Matching)
 * Xử lý an toàn cho cả lương thỏa thuận và khoảng lương giao thoa
 */
export function matchSalaryBracketFlexible(job, salaryFilter, salaryBrackets = []) {
  if (!salaryFilter || salaryFilter === 'all') return true;

  const isNegotiable = job.is_negotiable === true || (!job.salary_min && !job.salary_max);
  if (salaryFilter === 'negotiable') {
    return isNegotiable;
  }
  if (isNegotiable) {
    return true; // Tin lương thỏa thuận luôn phù hợp với các khoảng lương
  }

  const bracket = salaryBrackets.find(b => b.id === salaryFilter);
  if (!bracket || bracket.min === undefined) return true;

  const jMin = parseSalaryNumber(job.salary_min);
  const jMax = parseSalaryNumber(job.salary_max) || jMin;

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

  const fullLoc = locTokens.join(' ').toLowerCase();
  const fullLocUnaccent = removeVietnameseTones(fullLoc);
  const fullLocNorm = normalizeSearchSynonyms(fullLocUnaccent);

  const matchSingleDistrict = (d) => {
    const dLow = String(d || '').toLowerCase().trim();
    const dUn = removeVietnameseTones(dLow);
    const dClean = dUn.replace(/^(quan|huyen|thi xa|thanh pho|tp\.?)\s+/i, '').trim();
    if (/^\d+$/.test(dClean)) {
      const cleanNum = String(parseInt(dClean, 10));
      return new RegExp(`\\b(?:quan|q\\.?|p\\.?|huyen)\\s*0?${cleanNum}(?!\\d)`, 'i').test(fullLocUnaccent);
    }
    return fullLoc.includes(dLow) || fullLocUnaccent.includes(dUn) || (dClean && fullLocNorm.includes(dClean));
  };

  // 1. Kiểm tra Tỉnh / Thành phố
  if (selectedProvince && selectedProvince !== 'all' && selectedProvince !== 'Toàn quốc' && selectedProvince !== 'Tất cả') {
    const provLower = selectedProvince.toLowerCase();
    const provUnaccent = removeVietnameseTones(selectedProvince);

    let matchProv = fullLoc.includes(provLower) || fullLocUnaccent.includes(provUnaccent);

    if (!matchProv) {
      if (selectedProvince === 'TP. Hồ Chí Minh' || provUnaccent.includes('ho chi minh')) {
        const hcmAliases = ['hồ chí minh', 'ho chi minh', 'hcm', 'tphcm', 'tp.hcm', 'tp hcm', 'sài gòn', 'sai gon', 'bến nghé'];
        matchProv = hcmAliases.some(a => fullLoc.includes(a) || fullLocUnaccent.includes(removeVietnameseTones(a)));
        if (!matchProv) {
          const hcmDistricts = PROVINCE_DISTRICTS_MAP['TP. Hồ Chí Minh'] || [];
          matchProv = hcmDistricts.some(matchSingleDistrict);
        }
      } else if (selectedProvince === 'Hà Nội' || provUnaccent.includes('ha noi')) {
        const hnAliases = ['hà nội', 'ha noi', 'hn', 'cầu giấy', 'đống đa', 'ba đình', 'hoàn kiếm', 'hai bà trưng', 'thanh xuân', 'tây hồ', 'hoàng mai', 'long biên', 'hà đông', 'nam từ liêm', 'bắc từ liêm'];
        matchProv = hnAliases.some(a => fullLoc.includes(a) || fullLocUnaccent.includes(removeVietnameseTones(a)));
      } else {
        const distList = PROVINCE_DISTRICTS_MAP[selectedProvince] || [];
        matchProv = distList.some(matchSingleDistrict);
      }
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

  // 3. Ô nhập tay tùy chỉnh địa điểm (hỗ trợ cả tiền tố "Chi nhánh...", không dấu, viết tắt Q1...)
  if (customLocationText && customLocationText.trim()) {
    const rawCustom = customLocationText.trim().toLowerCase();
    if (rawCustom !== 'all' && rawCustom !== 'tất cả' && !rawCustom.startsWith('tất cả ')) {
      const customUn = removeVietnameseTones(rawCustom);
      const customStripped = normalizeSearchSynonyms(customUn).replace(/^(chi nhanh|co so|khu vuc)\s+/g, '').trim();

      const directMatch =
        fullLoc.includes(rawCustom) ||
        fullLocUnaccent.includes(customUn) ||
        (customStripped && fullLocNorm.includes(customStripped));

      if (!directMatch) {
        const distNumMatch = customUn.match(/\b(?:quan|q\.?|p\.?|phuong|huyen)\s*0?(\d+)\b/);
        if (distNumMatch) {
          const num = String(parseInt(distNumMatch[1], 10));
          const re = new RegExp(`\\b(?:quan|q\\.?|p\\.?|phuong|huyen)\\s*0?${num}(?!\\d)`, 'i');
          if (!re.test(fullLocUnaccent)) return false;
        } else {
          const customTokens = (customStripped || normalizeSearchSynonyms(customUn)).split(/\s+/).filter(Boolean);
          if (customTokens.length === 0 || !customTokens.every(tok => tokenInText(fullLocNorm, tok) || tokenInText(fullLocUnaccent, tok))) {
            return false;
          }
        }
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
