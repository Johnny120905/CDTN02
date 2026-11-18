package com.partime.utils;

/**
 * Kết quả thực thi một Test Case:
 * - PASS: Đã thực thi đầy đủ thao tác thật trên giao diện, đóng sạch mọi form/modal, thỏa Expected_Auto.
 * - FAIL: Thực thi lỗi hoặc form/modal mở ra không đóng được hoặc không thỏa Expected_Auto (kèm Screenshot).
 * - NOT_RUN_WAIT_COOKIE: Cần đăng nhập Cookie hoặc dữ liệu/môi trường test riêng (E2E đa trình duyệt, đổi MK thật...).
 */
public class ScenarioResult {
    public enum Status {
        PASS,
        FAIL,
        NOT_RUN_WAIT_COOKIE
    }

    private final Status status;
    private final String logMessage;

    private ScenarioResult(Status status, String logMessage) {
        this.status = status;
        this.logMessage = logMessage;
    }

    public static ScenarioResult pass(String detail) {
        return new ScenarioResult(Status.PASS, detail);
    }

    public static ScenarioResult fail(String detail) {
        return new ScenarioResult(Status.FAIL, detail);
    }

    public static ScenarioResult waitCookie(String role) {
        return new ScenarioResult(
                Status.NOT_RUN_WAIT_COOKIE,
                "Chờ đăng nhập thủ công lần đầu để lưu Cookie phiên '" + role + "' (đặt ALLOW_MANUAL_WAIT=TRUE)."
        );
    }

    public static ScenarioResult needManualOrCloneData(String reason) {
        return new ScenarioResult(Status.NOT_RUN_WAIT_COOKIE, reason);
    }

    public Status getStatus() {
        return status;
    }

    public String getLogMessage() {
        return logMessage;
    }
}
