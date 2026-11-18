package com.partime.utils;

/**
 * Kết quả thực thi một Test Case:
 * - PASS: Đã chạy kiểm chứng thành công trên website Deploy.
 * - FAIL: Đã chạy nhưng không thỏa Expected_Auto (tự động chụp ảnh lỗi).
 * - NOT_RUN_WAIT_COOKIE: Kịch bản yêu cầu phiên đã đăng nhập (chờ thao tác đăng nhập thủ công lần đầu để lưu Cookie).
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
                "Chờ đăng nhập thủ công lần đầu để lưu Cookie phiên '" + role + "' (đặt ALLOW_MANUAL_WAIT=TRUE trong Config_Environment)."
        );
    }

    public Status getStatus() {
        return status;
    }

    public String getLogMessage() {
        return logMessage;
    }
}
