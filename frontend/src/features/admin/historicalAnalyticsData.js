// Dữ liệu thống kê lịch sử cho năm 2024 và 2025 phục vụ riêng cho Analytics Dashboard.
// Lưu ý: Năm 2026 hoàn toàn KHÔNG có trong tệp này để đảm bảo năm 2026 chỉ sử dụng 100% dữ liệu thực tế từ CSDL.

function buildHistoricalBuckets() {
  const buckets = [];

  // Trọng số mùa vụ tuyển dụng sinh viên qua 12 tháng (cao điểm tựu trường T9-T10 và hè T5-T7)
  const monthMultipliers2024 = [0.75, 0.70, 0.85, 0.92, 1.05, 1.12, 1.08, 1.15, 1.32, 1.28, 1.10, 0.98];
  const monthMultipliers2025 = [1.20, 1.12, 1.35, 1.45, 1.62, 1.75, 1.70, 1.82, 2.05, 1.98, 1.78, 1.65];

  const yearsConfig = [
    { year: 2024, mults: monthMultipliers2024, seedOffset: 17 },
    { year: 2025, mults: monthMultipliers2025, seedOffset: 53 }
  ];

  for (const cfg of yearsConfig) {
    const { year, mults, seedOffset } = cfg;
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const mult = mults[month - 1];
      const padM = String(month).padStart(2, '0');

      for (let day = 1; day <= daysInMonth; day++) {
        const padD = String(day).padStart(2, '0');
        const dateStr = `${year}-${padM}-${padD}`;
        const h = (year * 37 + month * 31 + day * 13 + seedOffset) % 97;

        // Số lượng sinh viên đăng ký trong ngày (2024: ~2-4/ngày, 2025: ~3-7/ngày)
        const students = Math.max(1, Math.round((1.9 + (h % 5) * 0.42) * mult));

        // Số lượng doanh nghiệp đăng ký trong ngày (khoảng 7-15 DN/tháng)
        const empTrigger = (day + month * 2 + (year === 2025 ? 1 : 0)) % (year === 2025 ? 2 : 3) === 0;
        const employers = empTrigger ? (h % 9 === 0 && year === 2025 ? 2 : 1) : 0;
        const approvedEmployers = employers > 0 ? ((day + month) % 11 === 0 ? employers - 1 : employers) : 0;

        // Số lượng tin tuyển dụng đăng mới trong ngày (2024: ~0-2/ngày, 2025: ~1-3/ngày)
        const rawJobs = Math.round((0.55 + (h % 4) * 0.32) * mult);
        const jobs = Math.max(day % 2 === 0 ? 1 : 0, rawJobs);
        const activeJobs = jobs > 0 ? ((day + month) % 14 === 0 ? Math.max(0, jobs - 1) : jobs) : 0;

        // Phân bổ tin tuyển dụng vào 6 nhóm ngành chuẩn Master Data để tổng luôn khớp 100%
        const jobsBySlot = [0, 0, 0, 0, 0, 0];
        // Tỷ trọng ưu tiên: F&B/Pha chế (0), Bán lẻ (2), Gia sư (1), Phục vụ (5), Marketing (4), CNTT (3)
        const slotOrder = [0, 2, 1, 5, 0, 4, 2, 3];
        for (let j = 0; j < jobs; j++) {
          const slotIdx = slotOrder[(h + day + j) % slotOrder.length];
          jobsBySlot[slotIdx] += 1;
        }

        // Số lượng đơn ứng tuyển trong ngày
        const apps = Math.max(2, Math.round((2.6 + (h % 6) * 0.55) * mult));
        const acceptedApps = Math.max(1, Math.round(apps * (0.76 + (h % 10) * 0.012)));

        buckets.push({
          dateStr,
          year,
          month,
          day,
          timestamp: new Date(year, month - 1, day).getTime(),
          students,
          employers,
          approvedEmployers,
          jobs,
          activeJobs,
          jobsBySlot,
          apps,
          acceptedApps
        });
      }
    }
  }

  return buckets;
}

export const HISTORICAL_2024_2025_BUCKETS = buildHistoricalBuckets();

