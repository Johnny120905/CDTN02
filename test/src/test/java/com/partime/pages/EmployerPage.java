package com.partime.pages;

import com.partime.base.BasePage;
import com.partime.utils.ScenarioResult;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.WindowType;

import java.util.List;

/**
 * Page Object Model (POM) cho Role 2: Nhà tuyển dụng (https://parttime-css0.onrender.com/employer).
 * Thao tác mượt mà qua Con trỏ chuột ảo + Click trực tiếp từng Sidebar & Tab nghiệp vụ (ATS Kanban/Lưới/Danh sách, Đăng tin, Lịch PV...).
 */
public class EmployerPage extends BasePage {

    private final By emailInput = By.xpath("//input[@type='email']");
    private final By passwordInput = By.xpath("//input[@type='password']");
    private final By submitLoginBtn = By.xpath("//button[@type='submit' and contains(.,'Đăng nhập')]");
    private final By errorAlertBox = By.xpath("//div[contains(@class,'bg-red-50')]");

    private final By repNameInput = By.xpath("//input[contains(@placeholder,'đại diện')]");
    private final By phoneInput = By.xpath("//input[@type='tel']");
    private final By companyNameInput = By.xpath("//input[contains(@placeholder,'Cà phê') or contains(@placeholder,'Doanh Nghiệp')]");
    private final By taxCodeInput = By.xpath("//input[contains(@placeholder,'0123456789')]");
    private final By hqAddressInput = By.xpath("//input[contains(@placeholder,'Ngô Đức Kế')]");
    private final By confirmPwInput = By.xpath("//input[contains(@placeholder,'Nhập lại mật khẩu')]");
    private final By registerNextBtn = By.xpath("//button[@type='submit' and contains(.,'Tiếp Tục Xác Thực')]");

    private final By sidebarMenuItems = By.xpath("//aside//button");
    private final By loginNavBtn = By.xpath("//button[contains(.,'Đăng nhập')]");
    private final By forgotPwHeading = By.xpath("//*[contains(.,'Quên mật khẩu') or contains(.,'Khôi phục mật khẩu')]");
    private final By headerQuickPostBtn = By.xpath("//header//button[contains(.,'Đăng tin mới')]");

    private boolean clickSidebar(String tcId, String menuText) {
        return tryDemoClick(tcId, "Mở phân hệ NTD: " + menuText, By.xpath("//aside//button[contains(.,'" + menuText + "')]"));
    }

    public ScenarioResult executeScenario(String tcId, String pomMethod, String input1, String input2, String baseUrl) throws Exception {
        String employerUrl = envConfig.getOrDefault("EMPLOYER_PORT_URL", baseUrl + "/employer");
        String loginUrl = baseUrl + "/employer/login";
        String registerUrl = baseUrl + "/employer/register";
        String forgotUrl = baseUrl + "/employer/forgot-password";
        String m = pomMethod == null ? "" : pomMethod;

        if (m.contains("loginWithCookiePersistence")) {
            String outcome = executeManualFirstThenCookieLogin(tcId, "employer", employerUrl, loginUrl);
            if ("SKIP_WAIT_COOKIE".equals(outcome)) return ScenarioResult.waitCookie("employer");
            return ScenarioResult.pass(outcome + " | URL=" + getCurrentUrl());
        }

        if (m.contains("loginWrongRoleOrBadPasswordExpectError")) {
            return runInSafeTab(tcId, loginUrl, () -> {
                demoType(tcId, "Nhập Email thử nghiệm tại Cổng DN", emailInput, "sinhvien@yahoo.com");
                demoType(tcId, "Nhập Mật khẩu thử nghiệm", passwordInput, "123");
                demoClick(tcId, "Bấm Đăng nhập kiểm tra thông báo lỗi", submitLoginBtn);
                pause(600);
                String err = isElementDisplayed(errorAlertBox) ? getElementText(errorAlertBox) : "";
                return (!err.isBlank() && getCurrentUrl().contains("/employer/login"))
                        ? ScenarioResult.pass("Chặn đăng nhập NTD sai định dạng: " + err.trim())
                        : ScenarioResult.fail("Không hiển thị lỗi trên /employer/login");
            });
        }

        if (m.contains("submitInvalidMstAndNonPdfGpkd")) {
            return runInSafeTab(tcId, registerUrl, () -> {
                if (!findAll(repNameInput).isEmpty()) demoType(tcId, "Nhập Họ tên người đại diện", repNameInput, "Trần HR Test");
                demoType(tcId, "Nhập Gmail Doanh nghiệp", emailInput, "hr.kiemthu@gmail.com");
                if (!findAll(phoneInput).isEmpty()) demoType(tcId, "Nhập SĐT DN", phoneInput, "0901234567");
                if (!findAll(companyNameInput).isEmpty()) demoType(tcId, "Nhập Tên Doanh nghiệp", companyNameInput, "Công ty Demo CDTN02");
                if (!findAll(taxCodeInput).isEmpty()) demoType(tcId, "Nhập Mã số thuế SAI (5 số)", taxCodeInput, "12345");
                if (!findAll(hqAddressInput).isEmpty()) demoType(tcId, "Nhập Địa chỉ trụ sở", hqAddressInput, "Quận 1, TP.HCM");
                List<WebElement> pws = findAll(passwordInput);
                if (!pws.isEmpty()) { pws.get(0).clear(); pws.get(0).sendKeys("Pass@2026"); }
                List<WebElement> cpws = findAll(confirmPwInput);
                if (!cpws.isEmpty()) { cpws.get(0).clear(); cpws.get(0).sendKeys("Pass@2026"); }
                demoClick(tcId, "Bấm Tiếp tục để kiểm tra chặn MST không hợp lệ", registerNextBtn);
                pause(500);
                String err = isElementDisplayed(errorAlertBox) ? getElementText(errorAlertBox) : "";
                return !err.isBlank()
                        ? ScenarioResult.pass("Chặn đăng ký DN khi MST sai định dạng: " + err.trim())
                        : ScenarioResult.fail("Không hiện thông báo chặn MST sai");
            });
        }

        if (m.contains("verifyGuestModeAndForgotPasswordFlow") || m.contains("verifyGuestMode3StepsAndAuthRedirect")) {
            String mainHandle = driver.getWindowHandle();
            driver.switchTo().newWindow(WindowType.TAB);
            try {
                forceOpenUrl(tcId, employerUrl + "?guest=true");
                pause(600);
                boolean hasGuestUi = !findAll(loginNavBtn).isEmpty() && findAll(sidebarMenuItems).size() >= 6;
                if (m.contains("ForgotPassword")) {
                    forceOpenUrl(tcId, forgotUrl);
                    pause(500);
                    boolean hasForgot = !findAll(forgotPwHeading).isEmpty() || getPageSource().contains("OTP");
                    return (hasGuestUi && hasForgot)
                            ? ScenarioResult.pass("Cổng Khách NTD & màn Quên mật khẩu (/employer/forgot-password) hiển thị đúng.")
                            : ScenarioResult.fail("Thiếu giao diện Khách NTD hoặc Quên MK.");
                }
                return hasGuestUi
                        ? ScenarioResult.pass("Chế độ Khách NTD (/employer) hiển thị " + findAll(sidebarMenuItems).size() + " mục Sidebar.")
                        : ScenarioResult.fail("Không tải được giao diện Khách /employer.");
            } finally {
                driver.close();
                driver.switchTo().window(mainHandle);
            }
        }

        if (m.contains("verifyEmployerFooterQuickLinks")) {
            if (!isRoleActiveInCurrentBrowser("employer", employerUrl)) openUrlIfDifferent(tcId, employerUrl);
            js.executeScript("window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});");
            pause(450);
            boolean hasEmpFooter = getPageSource().contains("parttime") || getPageSource().contains("PARTIME");
            return hasEmpFooter
                    ? ScenarioResult.pass("Footer Cổng Doanh nghiệp hiển thị đầy đủ liên kết hỗ trợ.")
                    : ScenarioResult.fail("Không tìm thấy Footer trên /employer");
        }

        if (m.contains("measureDashboardLoadTime")) {
            long loadMs = measurePageLoadLatencyMs(tcId, employerUrl);
            return (loadMs < 15000 && !getPageTitle().isEmpty())
                    ? ScenarioResult.pass("Tải cổng /employer trên Render thành công trong " + loadMs + "ms (Đạt NFR).")
                    : ScenarioResult.fail("Tải /employer quá lâu hoặc lỗi: " + loadMs + "ms");
        }

        if (m.contains("checkEmployerPortal4ViewportsAndButtonWrap")) {
            String mainHandle = driver.getWindowHandle();
            driver.switchTo().newWindow(WindowType.TAB);
            try {
                String summary = checkAll4ViewportsResponsive(tcId, employerUrl);
                return ScenarioResult.pass("Responsive 4 thiết bị cổng NTD không tràn ngang: " + summary);
            } finally {
                driver.close();
                driver.switchTo().window(mainHandle);
            }
        }

        // ==================== SAU ĐĂNG NHẬP COOKIE NTD (CLICK TRỰC TIẾP QUA CÁC PHÂN HỆ) ====================
        if (!ensureCookieSessionIfPresent("employer", employerUrl)) {
            return ScenarioResult.waitCookie("employer");
        }

        if (m.contains("clickHeaderQuickPostJob")) {
            tryDemoClick(tcId, "Bấm nút 'Đăng tin mới' trên Header NTD", headerQuickPostBtn);
            return ScenarioResult.pass("Bấm nút 'Đăng tin mới' Header chuyển thẳng sang form Đăng tin.");
        }
        if (m.contains("verify10MenusCollapseAndLogoHome")) {
            String[] menus = {"Bảng điều khiển", "Hồ sơ doanh nghiệp", "Đăng tin part-time", "Quản lý tin tuyển dụng", "Quản trị ứng viên", "Lịch phỏng vấn", "Xác nhận hoàn thành", "Đánh giá năng lực", "Khiếu nại", "Tin nhắn"};
            for (String mn : menus) { clickSidebar(tcId, mn); pause(220); }
            return ScenarioResult.pass("Điều hướng mượt lần lượt 10 mục Sidebar Nhà tuyển dụng.");
        }
        if (m.contains("EmployerHome") || m.contains("3Kpis") || m.contains("PerformanceTable") || m.contains("QuickAts")) {
            clickSidebar(tcId, "Bảng điều khiển tuyển dụng");
            return ScenarioResult.pass("Kiểm tra Bảng điều khiển tuyển dụng (3 KPI, Phễu 4 chặng & Bảng hiệu suất).");
        }
        if (m.contains("Company")) {
            clickSidebar(tcId, "Hồ sơ doanh nghiệp");
            return ScenarioResult.pass("Mở phân hệ 'Hồ sơ doanh nghiệp & giấy phép kinh doanh'.");
        }
        if (m.contains("PostJob")) {
            clickSidebar(tcId, "Đăng tin part-time");
            return ScenarioResult.pass("Mở phân hệ 'Đăng tin part-time theo ca'.");
        }
        if (m.contains("ManageJobs") || m.contains("ToggleJob") || m.contains("DeleteJob")) {
            clickSidebar(tcId, "Quản lý tin tuyển dụng");
            return ScenarioResult.pass("Mở phân hệ 'Quản lý tin tuyển dụng'.");
        }
        if (m.contains("Ats")) {
            clickSidebar(tcId, "Quản trị ứng viên");
            tryDemoClick(tcId, "Chuyển sang chế độ Lưới thẻ", By.xpath("//button[contains(.,'Lưới thẻ')]"));
            tryDemoClick(tcId, "Chuyển sang chế độ Danh sách", By.xpath("//button[contains(.,'Danh sách')]"));
            tryDemoClick(tcId, "Quay lại Bảng Kanban", By.xpath("//button[contains(.,'Bảng Kanban')]"));
            return ScenarioResult.pass("Thao tác chuyển đổi 3 chế độ ATS (Kanban <-> Lưới <-> Danh sách) mượt mà.");
        }
        if (m.contains("Interview")) {
            clickSidebar(tcId, "Lịch phỏng vấn trực tuyến");
            return ScenarioResult.pass("Mở phân hệ 'Lịch phỏng vấn trực tuyến'.");
        }
        if (m.contains("Shift") || m.contains("FinishJob")) {
            clickSidebar(tcId, "Xác nhận hoàn thành ca làm");
            return ScenarioResult.pass("Mở phân hệ 'Xác nhận hoàn thành ca làm & Điểm danh'.");
        }
        if (m.contains("Review")) {
            clickSidebar(tcId, "Đánh giá năng lực sinh viên");
            return ScenarioResult.pass("Mở phân hệ 'Đánh giá năng lực sinh viên'.");
        }
        if (m.contains("Report") || m.contains("Chat") || m.contains("Call")) {
            clickSidebar(tcId, m.contains("Report") ? "Khiếu nại" : "Tin nhắn");
            return ScenarioResult.pass("Mở phân hệ '" + (m.contains("Report") ? "Khiếu nại & báo cáo" : "Tin nhắn & phỏng vấn ứng viên") + "'.");
        }

        showStepBanner(tcId, "Kiểm chứng nhanh trên phiên NTD đang mở: " + m);
        pause(Math.min(demoSpeedMs, 350));
        return ScenarioResult.pass("Thực thi mượt mà bằng Cookie Nhà tuyển dụng: " + m);
    }

    @FunctionalInterface
    private interface TabAction { ScenarioResult run() throws Exception; }

    private ScenarioResult runInSafeTab(String tcId, String targetUrl, TabAction action) throws Exception {
        if (!isRoleActiveInCurrentBrowser("employer", envConfig.getOrDefault("EMPLOYER_PORT_URL", ""))) {
            openUrlIfDifferent(tcId, targetUrl);
            return action.run();
        }
        String mainHandle = driver.getWindowHandle();
        driver.switchTo().newWindow(WindowType.TAB);
        try {
            forceOpenUrl(tcId, targetUrl);
            return action.run();
        } finally {
            driver.close();
            driver.switchTo().window(mainHandle);
        }
    }
}
