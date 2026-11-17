/**
 * Partime.vn - Trung Tâm Điều Phối Đồng Bộ Toàn Hệ Thống (Universal Sync Event Hub)
 * 
 * Quản lý đồng bộ dữ liệu thời gian thực giữa các Tab / Cửa sổ / Màn hình chia đôi (Split Screen)
 * thông qua BroadcastChannel chuẩn trình duyệt + CustomEvent nội bộ + Storage fallback.
 * 
 * 6 Nhóm Thực Thể Nghiệp Vụ Chuẩn (Entities):
 * 1. JOBS_SYNC: Tin tuyển dụng (Đăng, sửa, đóng/mở, xóa, duyệt, khóa vi phạm)
 * 2. APPLICATIONS_SYNC: Đơn ứng tuyển (Nộp, hủy, xóa, duyệt, hẹn phỏng vấn, từ chối)
 * 3. SHIFTS_SYNC: Ca làm việc & Chấm công (Vào ca, xong ca, hủy ca, nghiệm thu, điểm danh)
 * 4. REVIEWS_SYNC: Đánh giá 2 chiều (SV/NTD gửi, sửa, xóa; Admin ẩn/hiện/xóa)
 * 5. PROFILES_SYNC: Hồ sơ, Avatar & GPKD (SV/NTD đổi avatar/logo/bìa/thông tin; Admin duyệt/từ chối GPKD, ban/unban)
 * 6. SYSTEM_SYNC: Khiếu nại, Từ cấm, Thông báo & Danh mục (Báo cáo, từ cấm, thông báo hệ thống, ngành nghề)
 */

export const SYNC_EVENTS = {
  JOBS: 'JOBS_SYNC',
  APPLICATIONS: 'APPLICATIONS_SYNC',
  SHIFTS: 'SHIFTS_SYNC',
  REVIEWS: 'REVIEWS_SYNC',
  PROFILES: 'PROFILES_SYNC',
  SYSTEM: 'SYSTEM_SYNC',
};

const CHANNEL_NAME = 'partime_universal_sync_channel';
const INTERNAL_EVENT_NAME = 'partime_sync_internal_event';
const STORAGE_KEY = 'partime_universal_sync_event';

// Sinh Tab ID ngẫu nhiên cho phiên hiện tại
const currentTabId = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Khởi tạo BroadcastChannel singleton
let channelInstance = null;
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    channelInstance = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.warn('[SyncHub] BroadcastChannel không khả dụng, sử dụng storage fallback:', err);
  }
}

/**
 * Phát lệnh đồng bộ cho toàn bộ hệ thống (các Tab khác + tab hiện tại)
 * @param {string} eventType - Một trong các giá trị SYNC_EVENTS
 * @param {object} payload - Dữ liệu kèm theo nếu có (ví dụ: { role: 'employer', jobId: '...' })
 */
export function emitSync(eventType, payload = {}) {
  if (!eventType) return;

  const eventData = {
    type: eventType,
    payload,
    timestamp: Date.now(),
    senderTabId: currentTabId,
  };

  // 1. Phát qua BroadcastChannel đến các Tab khác đang mở (cực nhanh < 1ms trong RAM)
  if (channelInstance) {
    try {
      channelInstance.postMessage(eventData);
    } catch (e) {
      console.warn('[SyncHub] Lỗi postMessage:', e);
    }
  }

  // 2. Phát qua localStorage để kích hoạt sự kiện 'storage' cho các tab khác (dự phòng đa kênh)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(eventData));
    }
  } catch (e) {}

  // 3. Phát CustomEvent nội bộ để các component trên CHÍNH TAB NÀY cũng cập nhật đồng bộ tức thì
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(INTERNAL_EVENT_NAME, { detail: eventData }));
    } catch (e) {}
  }
}

/**
 * Đăng ký lắng nghe sự kiện đồng bộ
 * @param {string|string[]} eventTypes - Sự kiện cần nghe (ví dụ: SYNC_EVENTS.JOBS hoặc [SYNC_EVENTS.JOBS, SYNC_EVENTS.SYSTEM])
 * @param {Function} callback - Hàm xử lý được gọi khi có sự kiện (tự động debounce để tối ưu hiệu năng)
 * @param {object} options - Cấu hình { debounceMs: 120, immediateOnVisible: true }
 * @returns {Function} Hàm unsubscribe để dọn dẹp trong useEffect
 */
export function subscribeSync(eventTypes, callback, options = {}) {
  if (typeof window === 'undefined' || typeof callback !== 'function') {
    return () => {};
  }

  const { debounceMs = 120, immediateOnVisible = true } = options;
  const targetTypes = Array.isArray(eventTypes)
    ? eventTypes
    : (eventTypes === '*' ? ['*'] : [eventTypes]);

  let debounceTimer = null;
  let hasPendingUpdateWhileHidden = false;
  let lastEventProcessed = null;

  const triggerCallback = (eventData) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      try {
        callback(eventData || lastEventProcessed);
      } catch (err) {
        console.warn('[SyncHub] Lỗi trong callback:', err);
      }
    }, debounceMs);
  };

  const handleIncomingEvent = (eventData) => {
    if (!eventData || !eventData.type) return;

    // Kiểm tra loại sự kiện có khớp với đăng ký không
    const isMatched = targetTypes.includes('*') || targetTypes.includes(eventData.type);
    if (!isMatched) return;

    lastEventProcessed = eventData;

    // Nếu tab đang bị ẩn (người dùng đang ở tab khác), đánh dấu để khi chuyển tab lại nạp tức thì
    if (typeof document !== 'undefined' && document.hidden) {
      hasPendingUpdateWhileHidden = true;
      // Vẫn kích hoạt callback ngầm để dữ liệu sẵn sàng trong RAM khi mở lại
      triggerCallback(eventData);
    } else {
      triggerCallback(eventData);
    }
  };

  // 1. Lắng nghe BroadcastChannel (từ các tab khác)
  const handleBroadcastMessage = (e) => {
    if (e.data && e.data.senderTabId !== currentTabId) {
      handleIncomingEvent(e.data);
    }
  };

  if (channelInstance) {
    channelInstance.addEventListener('message', handleBroadcastMessage);
  }

  // 2. Lắng nghe CustomEvent nội bộ (từ chính tab này)
  const handleInternalCustomEvent = (e) => {
    if (e.detail) {
      handleIncomingEvent(e.detail);
    }
  };
  window.addEventListener(INTERNAL_EVENT_NAME, handleInternalCustomEvent);

  // 3. Lắng nghe localStorage 'storage' event (dự phòng đa tab)
  const handleStorageEvent = (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && parsed.senderTabId !== currentTabId) {
          handleIncomingEvent(parsed);
        }
      } catch (err) {}
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // 4. Lắng nghe khi người dùng bấm chuyển tab trở lại (visibilitychange & focus)
  const handleVisibilityChange = () => {
    if (!document.hidden && immediateOnVisible) {
      if (hasPendingUpdateWhileHidden) {
        hasPendingUpdateWhileHidden = false;
        triggerCallback({ type: 'VISIBILITY_RESUME', timestamp: Date.now() });
      }
    }
  };

  const handleWindowFocus = () => {
    if (immediateOnVisible && hasPendingUpdateWhileHidden) {
      hasPendingUpdateWhileHidden = false;
      triggerCallback({ type: 'FOCUS_RESUME', timestamp: Date.now() });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleWindowFocus);

  // Trả về hàm dọn dẹp
  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    if (channelInstance) {
      channelInstance.removeEventListener('message', handleBroadcastMessage);
    }
    window.removeEventListener(INTERNAL_EVENT_NAME, handleInternalCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
  };
}
