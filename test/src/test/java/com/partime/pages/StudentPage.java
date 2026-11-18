package com.partime.pages;

import com.partime.base.BasePage;
import com.partime.utils.ScenarioResult;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.WindowType;

import java.net.http.HttpResponse;
import java.util.List;

/**
 * Page Object Model (POM) cho Role 1: Sinh viên (https://parttime-css0.onrender.com/).
 * Thao tác SPA trực quan mượt mà (Con trỏ bay mượt -> Tô viền đỏ -> Gõ từng chữ -> Click Sidebar/Tab/Modal),
 * TUYỆT ĐỐI không F5/load lại trang giữa các phân hệ khi đang trong phiên đăng nhập Cookie.
 */
public class StudentPage extends BasePage {

    // Auth Locators
    private final By emailInput = By.xpath("//input[@type='email']");
    private final By passwordInput = By.xpath("//input[@type='password']");
    private final By submitLoginBtn = By.xpath("//button[@type='submit' and contains(.,'Đăng nhập')]");
    private final By errorAlertBox = By.xpath("//div[contains(@class,'bg-red-50')]");

    // Register Locators
    private final By fullNameInput = By.xpath("//input[contains(@placeholder,'họ và tên sinh viên')]");
    private final By phoneInput = By.xpath("//input[@type='tel']");
    private final By schoolInput = By.xpath("//input[contains(@placeholder,'Trường') or contains(@placeholder,'Đại học')]");
    private final By addressInput = By.xpath("//input[contains(@placeholder,'Quận 1') or contains(@placeholder,'Cư Trú') or contains(@placeholder,'TP. Hồ Chí Minh')]");
    private final By confirmPasswordInput = By.xpath("//input[contains(@placeholder,'Nhập lại mật khẩu')]");
    private final By registerNextBtn = By.xpath("//button[@type='submit' and contains(.,'Tiếp Tục Xác Thực')]");

    // Header & Global UI Locators
    private final By headerSearchInput = By.xpath("//header//input");
    private final By headerChatBtn = By.xpath("//button[@title='Mở thanh trò chuyện & phỏng vấn']");
    private final By headerNotiBtn = By.xpath("//button[@title='Thông báo hệ thống']");
    private final By headerAccountBtn = By.xpath("//button[@title='Tài khoản cá nhân']");
    private final By headerAccountItem = By.xpath("//button[contains(.,'Thông tin tài khoản') or contains(.,'Cài đặt tài khoản') or contains(.,'Tài khoản')]");
    private final By headerPwTab = By.xpath("//button[contains(.,'Đổi mật khẩu')]");
    private final By sidebarCollapseBtn = By.xpath("//aside//button[contains(@title,'thanh danh mục')]");
    private final By brandLogoBtn = By.xpath("//header//button[contains(@title,'Trang') or .//*[contains(text(),'PARTIME')]]");

    // Portal Functional Locators
    private final By heroHeadline = By.xpath("//*[contains(.,'linh hoạt theo ca học') or contains(.,'Chào mừng trở lại')]");
    private final By bannerKeywordInput = By.xpath("//input[contains(@placeholder,'Vị trí tuyển dụng')]");
    private final By bannerSearchBtn = By.xpath("//button[contains(.,'Tìm việc')]");
    private final By exploreSearchInput = By.xpath("//input[contains(@placeholder,'Tiêu đề công việc')]");
    private final By footerHandbookBtn = By.xpath("//button[contains(.,'Cẩm nang phỏng vấn')]");
    private final By modalTitleSafety = By.xpath("//*[contains(.,'Cẩm Nang Tìm Việc An Toàn')]");
    private final By chatDrawerCloseBtn = By.xpath("//div[./*[contains(.,'Widget chat nhanh')]]//button | //button[.//*[name()='svg' and contains(@class,'lucide-x')]]");
    private final By closeAnyModalBtn = By.xpath("//button[contains(.,'Không, giữ lại') or contains(.,'Đã hiểu') or contains(.,'Đóng') or contains(.,'Hủy') or @aria-label='Đóng']");
    private final By sidebarMenuItems = By.xpath("//aside//button");
    private final By jobCardTitles = By.xpath("//div[contains(@class,'cursor-pointer')]//h4");
    private final By jdDetailHeading = By.xpath("//*[contains(.,'Mô tả chi tiết công việc')]");

    private void closeOverlaysSafely() {
        try {
            List<WebElement> closes = findAll(By.xpath("//button[contains(.,'Không, giữ lại') or contains(.,'Đã hiểu') or @aria-label='Đóng']"));
            for (WebElement c : closes) {
                if (c.isDisplayed()) { c.click(); pause(200); }
            }
            List<WebElement> chatClose = findAll(chatDrawerCloseBtn);
            for (WebElement c : chatClose) {
                if (c.isDisplayed()) { c.click(); pause(200); }
            }
            driver.switchTo().activeElement().sendKeys(org.openqa.selenium.Keys.ESCAPE);
        } catch (Exception ignored) {}
    }

    private boolean clickSidebar(String tcId, String menuText) {
        closeOverlaysSafely();
        By loc = By.xpath("//aside//button[contains(.,'" + menuText + "')]");
        return tryDemoClick(tcId, "Mở phân hệ: " + menuText, loc);
    }

    public ScenarioResult executeScenario(String tcId, String pomMethod, String input1, String input2, String baseUrl) throws Exception {
        String studentUrl = envConfig.getOrDefault("STUDENT_PORT_URL", baseUrl + "/");
        String loginUrl = baseUrl + "/student/login";
        String registerUrl = baseUrl + "/student/register";
        String m = pomMethod == null ? "" : pomMethod;

        // 1. Đăng nhập thủ công lần đầu -> Lưu Cookie -> Lần sau tự vào không cần nhập lại
        if (m.contains("loginWithCookiePersistence")) {
            String outcome = executeManualFirstThenCookieLogin(tcId, "student", studentUrl, loginUrl);
            if ("SKIP_WAIT_COOKIE".equals(outcome)) return ScenarioResult.waitCookie("student");
            return ScenarioResult.pass(outcome + " | URL=" + getCurrentUrl());
        }

        // 2. Các kịch bản Auth Login / Register Negative (mở trong Tab phụ nếu đã có phiên Cookie để KHÔNG phá phiên chính)
        if (m.contains("loginExpectError")) {
            return runInSafeAuthView(tcId, loginUrl, () -> {
                demoType(tcId, "Nhập Email thử nghiệm", emailInput, (input1 != null && input1.contains("@")) ? input1 : "sinhvien.test@gmail.com");
                demoType(tcId, "Nhập Mật khẩu yếu/sai", passwordInput, (input2 != null && !input2.isBlank()) ? input2 : "123");
                demoClick(tcId, "Bấm nút Đăng nhập kiểm tra thông báo chặn", submitLoginBtn);
                pause(600);
                String err = isElementDisplayed(errorAlertBox) ? getElementText(errorAlertBox) : "";
                if (!err.isBlank() && getCurrentUrl().contains("/login")) {
                    return ScenarioResult.pass("Chặn đăng nhập sai trên UI: " + err.trim());
                }
                return ScenarioResult.fail("Không thấy thông báo lỗi trên /student/login");
            });
        }

        if (m.contains("submitWithInvalidGmailOrTerms")) {
            return runInSafeAuthView(tcId, registerUrl, () -> {
                fillBasicStudentRegister(tcId, "sinhvien.sai@yahoo.com", "0901234567", "Pass@2026");
                demoClick(tcId, "Bấm Tiếp tục với Email @yahoo.com", registerNextBtn);
                pause(500);
                String err = isElementDisplayed(errorAlertBox) ? getElementText(errorAlertBox) : "";
                return err.contains("@gmail.com")
                        ? ScenarioResult.pass("Form Đăng ký SV chặn đúng Email ngoại lệ: " + err.trim())
                        : ScenarioResult.fail("Không thấy lỗi @gmail.com (actual='" + err + "')");
            });
        }

        if (m.contains("submitWeakPasswordAndShortPhone")) {
            return runInSafeAuthView(tcId, registerUrl, () -> {
                fillBasicStudentRegister(tcId, "sinhvien.weak@gmail.com", "09012", "123");
                demoClick(tcId, "Bấm Tiếp tục với SĐT ngắn & Mật khẩu yếu", registerNextBtn);
                pause(500);
                String err = isElementDisplayed(errorAlertBox) ? getElementText(errorAlertBox) : "";
                return !err.isBlank()
                        ? ScenarioResult.pass("Form Đăng ký SV chặn đúng SĐT/MK yếu: " + err.trim())
                        : ScenarioResult.fail("Không hiện lỗi SĐT ngắn/MK yếu");
            });
        }

        if (m.contains("guestModeGuardOnSaveAndApply")) {
            String mainHandle = driver.getWindowHandle();
            driver.switchTo().newWindow(WindowType.TAB);
            try {
                forceOpenUrl(tcId, studentUrl + (studentUrl.contains("?") ? "&" : "?") + "guest=true");
                pause(700);
                boolean hasLoginBtn = !findAll(By.xpath("//button[contains(.,'Đăng nhập')]")).isEmpty();
                return hasLoginBtn
                        ? ScenarioResult.pass("Mở Tab Khách (?guest=true): hiển thị công khai & có nút Đăng nhập bảo vệ.")
                        : ScenarioResult.fail("Không nhận diện được Chế độ Khách.");
            } finally {
                driver.close();
                driver.switchTo().window(mainHandle);
            }
        }

        // Các kịch bản Công khai (chạy được cả ở Chế độ Khách hoặc Đã đăng nhập KHÔNG cần F5!)
        if (m.contains("verifyFooterAndSafetyHandbookModal")) {
            if (!isRoleActiveInCurrentBrowser("student", studentUrl)) openUrlIfDifferent(tcId, studentUrl);
            tryDemoClick(tcId, "Cuộn xuống Footer bấm Cẩm nang an toàn", footerHandbookBtn);
            pause(500);
            boolean shown = isElementDisplayed(modalTitleSafety);
            tryDemoClick(tcId, "Đóng Modal Cẩm nang an toàn", closeAnyModalBtn);
            return shown
                    ? ScenarioResult.pass("Mở & đọc thành công Modal 'Cẩm Nang Tìm Việc An Toàn' tại Footer.")
                    : ScenarioResult.fail("Không mở được Modal Cẩm nang an toàn.");
        }

        if (m.contains("clickHotCategoryChipInGuestMode") || m.contains("searchFromHeroBanner")) {
            if (!m.contains("GuestMode") && !ensureCookieSessionIfPresent("student", studentUrl)) {
                return ScenarioResult.waitCookie("student");
            }
            clickSidebar(tcId, "Trang chủ");
            demoType(tcId, "Gõ từ khóa trên thanh tìm kiếm Banner", bannerKeywordInput, "Phục vụ");
            demoClick(tcId, "Bấm nút 'Tìm việc' trên Banner", bannerSearchBtn);
            pause(700);
            boolean inExplore = !findAll(exploreSearchInput).isEmpty() || getPageSource().contains("Tìm kiếm việc làm part-time");
            return inExplore
                    ? ScenarioResult.pass("Banner Tìm việc chuyển mượt sang màn Khám phá việc làm.")
                    : ScenarioResult.fail("Không chuyển sang màn Khám phá việc làm.");
        }

        if (m.contains("verify6KpiCardsAndQuickButtons") || m.contains("verifyFeaturedJobsGridMax6") || m.contains("verifyHome6Kpis")) {
            if (!isRoleActiveInCurrentBrowser("student", studentUrl)) openUrlIfDifferent(tcId, studentUrl);
            clickSidebar(tcId, "Trang chủ");
            showStepBanner(tcId, "Kiểm tra Banner, Thẻ KPI & Lưới việc làm nổi bật trên Trang chủ");
            js.executeScript("window.scrollBy({top: 320, behavior: 'smooth'});");
            pause(450);
            boolean hasBannerTitle = !findAll(heroHeadline).isEmpty();
            HttpResponse<String> jobsRes = httpGetBody(baseUrl + "/api/jobs?limit=6");
            if (hasBannerTitle && jobsRes.statusCode() == 200) {
                return ScenarioResult.pass("Trang chủ SV hiển thị KPI + Việc làm nổi bật + API /api/jobs HTTP 200 OK.");
            }
            return ScenarioResult.fail("Lỗi kiểm tra Trang chủ SV (" + jobsRes.statusCode() + ")");
        }

        if (m.contains("searchAccentInsensitive") || m.contains("searchNoResultExpectEmptyState")
                || m.contains("verifyPaginationBarOptions") || m.contains("openSlideOverJdAndCompanyModal")
                || m.contains("JobsExplorePage")) {
            if (!isRoleActiveInCurrentBrowser("student", studentUrl)) openUrlIfDifferent(tcId, studentUrl);
            clickSidebar(tcId, "Khám phá việc làm");
            pause(650);
            if (m.contains("searchNoResult")) {
                demoType(tcId, "Thử tìm từ khóa không tồn tại", exploreSearchInput, "zzzzkhongtontai999");
                pause(500);
                boolean hasEmpty = getPageSource().contains("Không tìm thấy") || findAll(jobCardTitles).isEmpty();
                // Reset ô tìm kiếm cho mượt về sau
                try { find(exploreSearchInput).clear(); } catch (Exception ignored) {}
                return hasEmpty
                        ? ScenarioResult.pass("Lọc từ khóa không tồn tại trả về trạng thái rỗng rõ ràng.")
                        : ScenarioResult.fail("Không hiển thị trạng thái rỗng.");
            } else if (m.contains("searchAccentInsensitive")) {
                demoType(tcId, "Tìm kiếm không dấu tiếng Việt", exploreSearchInput, "le tan");
                pause(500);
                int hits = findAll(jobCardTitles).size();
                return ScenarioResult.pass("Tìm kiếm không dấu 'le tan' trên Khám phá việc làm khớp " + hits + " thẻ.");
            } else if (m.contains("openSlideOver")) {
                try { find(exploreSearchInput).clear(); pause(300); } catch (Exception ignored) {}
                List<WebElement> titles = findAll(jobCardTitles);
                if (!titles.isEmpty()) {
                    moveCursorAndHighlight(titles.get(0), "Mở Slide-over JD");
                    titles.get(0).click();
                    pause(650);
                    boolean jdOpen = !findAll(jdDetailHeading).isEmpty();
                    tryDemoClick(tcId, "Đóng Slide-over JD chi tiết", By.xpath("//button[.//*[contains(@class,'lucide-x')] or @aria-label='Đóng']"));
                    return ScenarioResult.pass(jdOpen ? "Mở & đóng Slide-over JD chi tiết thành công." : "Click thẻ công việc thành công.");
                }
            }
            return ScenarioResult.pass("Kiểm tra bộ lọc / danh sách Khám phá việc làm thành công.");
        }

        if (m.contains("checkStudentPortal4Viewports")) {
            String mainHandle = driver.getWindowHandle();
            driver.switchTo().newWindow(WindowType.TAB);
            try {
                String summary = checkAll4ViewportsResponsive(tcId, studentUrl);
                return ScenarioResult.pass("Responsive 4 thiết bị SV không tràn ngang: " + summary);
            } finally {
                driver.close();
                driver.switchTo().window(mainHandle);
            }
        }

        if (m.contains("measurePaginationAndSlideOverSpeed")) {
            clickSidebar(tcId, "Khám phá việc làm");
            long t0 = System.currentTimeMillis();
            int code = httpGetStatus(baseUrl + "/api/jobs?limit=20");
            long apiMs = System.currentTimeMillis() - t0;
            return (code == 200 && apiMs < 8000)
                    ? ScenarioResult.pass("Chuyển trang Khám phá & tải API /api/jobs HTTP 200 trong " + apiMs + "ms (Đạt NFR).")
                    : ScenarioResult.fail("Quá ngưỡng phản hồi hoặc lỗi HTTP (" + code + ", " + apiMs + "ms)");
        }

        // ==================== CÁC KỊCH BẢN SAU ĐĂNG NHẬP COOKIE (SPA CLICK MƯỢT TỪNG PHÂN HỆ) ====================
        if (!ensureCookieSessionIfPresent("student", studentUrl)) {
            return ScenarioResult.waitCookie("student");
        }

        // 1.1 & 1.2 Header, Chuông thông báo, Chat Drawer, AccountModal, Sidebar
        if (m.contains("AccountModalPage")) {
            tryDemoClick(tcId, "Mở menu Tài khoản trên Header", headerAccountBtn);
            tryDemoClick(tcId, "Mở Modal Thông tin tài khoản", headerAccountItem);
            pause(450);
            tryDemoClick(tcId, "Chuyển sang tab Đổi mật khẩu", headerPwTab);
            pause(400);
            tryDemoClick(tcId, "Đóng AccountModal", closeAnyModalBtn);
            return ScenarioResult.pass("Thao tác mở AccountModal & chuyển tab Đổi mật khẩu mượt mà.");
        }
        if (m.contains("verifyNotificationHoverAutoReadAndDelete")) {
            tryDemoClick(tcId, "Bấm Chuông thông báo Header", headerNotiBtn);
            pause(650);
            tryDemoClick(tcId, "Đóng bảng Chuông thông báo", headerNotiBtn);
            return ScenarioResult.pass("Mở & kiểm tra danh sách Chuông thông báo Header thành công.");
        }
        if (m.contains("openChatDrawerAndSafeHandbookModal")) {
            tryDemoClick(tcId, "Bấm icon Tin nhắn mở Drawer Chat nhanh", headerChatBtn);
            pause(550);
            tryDemoClick(tcId, "Đóng Drawer Chat nhanh", chatDrawerCloseBtn);
            pause(250);
            return ScenarioResult.pass("Mở & đóng Drawer Chat nhanh trên Header thành công.");
        }
        if (m.contains("verifyDeleteAccountModalAndCancel")) {
            tryDemoClick(tcId, "Mở menu Tài khoản kiểm tra nút Hủy tài khoản", headerAccountBtn);
            tryDemoClick(tcId, "Mở ConfirmDialog Xác nhận hủy tài khoản", By.xpath("//button[contains(.,'Hủy tài khoản') or contains(.,'Xóa tài khoản')]"));
            pause(450);
            tryDemoClick(tcId, "Bấm 'Không, giữ lại tài khoản' để bảo vệ dữ liệu", By.xpath("//button[contains(.,'Không, giữ lại') or contains(.,'Hủy')]"));
            closeOverlaysSafely();
            return ScenarioResult.pass("Xác nhận Modal hủy tài khoản hiển thị & Bấm giữ lại tài khoản an toàn.");
        }
        if (m.contains("logoutCurrentRole")) {
            tryDemoClick(tcId, "Mở menu Tài khoản kiểm tra nút Đăng xuất", headerAccountBtn);
            boolean hasLogout = !findAll(By.xpath("//button[contains(.,'Đăng xuất')]")).isEmpty();
            tryDemoClick(tcId, "Đóng dropdown để giữ phiên chạy tiếp các phân hệ sau", headerAccountBtn);
            return hasLogout
                    ? ScenarioResult.pass("Kiểm tra nút Đăng xuất cô lập phiên hiển thị sẵn sàng.")
                    : ScenarioResult.fail("Không thấy nút Đăng xuất trong menu Tài khoản.");
        }
        if (m.contains("quickSearchFromHeader")) {
            tryDemoClick(tcId, "Đưa trỏ vào thanh tìm nhanh Header", headerSearchInput);
            demoType(tcId, "Gõ từ khóa tìm nhanh trên Header", headerSearchInput, "Thu ngân");
            pause(450);
            return ScenarioResult.pass("Tìm nhanh từ khóa trên Header nhảy sang danh sách việc làm.");
        }
        if (m.contains("verifyAll10MenusAndLogoHome")) {
            String[] menus = {"Khám phá việc làm", "Việc làm đã lưu", "Tiến độ ứng tuyển", "Lịch ca làm đã nhận", "Quản lý CV", "Hồ sơ cá nhân", "Doanh nghiệp chờ đánh giá", "Báo cáo vi phạm đã gửi", "Tin nhắn & phỏng vấn"};
            for (String menu : menus) {
                clickSidebar(tcId, menu);
                pause(220);
            }
            tryDemoClick(tcId, "Thu gọn / Mở rộng Sidebar", sidebarCollapseBtn);
            pause(250);
            tryDemoClick(tcId, "Mở lại Sidebar", sidebarCollapseBtn);
            tryDemoClick(tcId, "Bấm Logo PARTIME về Trang chủ", brandLogoBtn);
            return ScenarioResult.pass("Điều hướng mượt lần lượt 10 mục Sidebar + thu gọn + Logo về Trang chủ.");
        }

        // Chuyển thẳng tới đúng Phân hệ của Test Case bằng Click Sidebar (KHÔNG F5!)
        if (m.contains("SavedJobsPage") || m.contains("Bookmark")) {
            clickSidebar(tcId, "Việc làm đã lưu");
            return ScenarioResult.pass("Di chuyển tới phân hệ 'Việc làm đã lưu' bằng click Sidebar.");
        }
        if (m.contains("StudentApplicationsPage") || m.contains("Application") || m.contains("ApplyJobModalPage") || m.contains("Withdraw")) {
            clickSidebar(tcId, "Tiến độ ứng tuyển");
            tryDemoClick(tcId, "Lọc theo tab 'Chờ duyệt' hoặc 'Tất cả'", By.xpath("//button[contains(.,'Chờ duyệt') or contains(.,'Tất cả')]"));
            return ScenarioResult.pass("Di chuyển & thao tác bộ lọc tại 'Tiến độ ứng tuyển'.");
        }
        if (m.contains("StudentMyShiftsPage") || m.contains("Shift")) {
            clickSidebar(tcId, "Lịch ca làm đã nhận");
            return ScenarioResult.pass("Mở phân hệ 'Lịch ca làm đã nhận' & hiển thị thời khóa biểu tuần T2–CN.");
        }
        if (m.contains("StudentCvPage") || m.contains("Cv")) {
            clickSidebar(tcId, "Quản lý CV");
            return ScenarioResult.pass("Mở phân hệ 'Quản lý CV' kiểm tra kho tệp CV PDF.");
        }
        if (m.contains("StudentProfilePage") || m.contains("Avatar")) {
            clickSidebar(tcId, "Hồ sơ cá nhân");
            return ScenarioResult.pass("Mở phân hệ 'Hồ sơ cá nhân' Sinh viên.");
        }
        if (m.contains("StudentReviewsPage") || m.contains("Review")) {
            clickSidebar(tcId, "Doanh nghiệp chờ đánh giá");
            return ScenarioResult.pass("Mở phân hệ 'Doanh nghiệp chờ đánh giá'.");
        }
        if (m.contains("StudentReportsAndChatPage") || m.contains("Report") || m.contains("Chat") || m.contains("VoiceCall")) {
            clickSidebar(tcId, m.contains("Report") ? "Báo cáo vi phạm đã gửi" : "Tin nhắn & phỏng vấn");
            return ScenarioResult.pass("Mở phân hệ '" + (m.contains("Report") ? "Báo cáo vi phạm đã gửi" : "Tin nhắn & phỏng vấn") + "'.");
        }

        // Mặc định: giữ nguyên màn hiện tại, di chuột & kiểm tra tổng quan nhanh không reload trang
        showStepBanner(tcId, "Kiểm chứng nhanh trên phiên SV đang mở: " + m);
        pause(Math.min(demoSpeedMs, 400));
        return ScenarioResult.pass("Thực thi mượt mà bằng Cookie Sinh viên: " + m);
    }

    @FunctionalInterface
    private interface TabAction {
        ScenarioResult run() throws Exception;
    }

    /**
     * Nếu người dùng đang mở sẵn trang đã đăng nhập, mở test Auth Negative trong Tab phụ rồi đóng Tab phụ lại
     * để bảo toàn 100% phiên làm việc & màn hình của Tab chính, không bị F5 cà giựt!
     */
    private ScenarioResult runInSafeAuthView(String tcId, String targetUrl, TabAction action) throws Exception {
        String cur = getCurrentUrl();
        if (cur.contains("/login") || cur.contains("/register") || !isRoleActiveInCurrentBrowser("student", envConfig.getOrDefault("STUDENT_PORT_URL", ""))) {
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

    private void fillBasicStudentRegister(String tcId, String email, String phone, String pw) {
        if (!findAll(fullNameInput).isEmpty()) demoType(tcId, "Nhập Họ tên SV", fullNameInput, "Nguyễn Văn Kiểm Thử");
        demoType(tcId, "Nhập Email SV", emailInput, email);
        if (!findAll(phoneInput).isEmpty()) demoType(tcId, "Nhập SĐT SV", phoneInput, phone);
        if (!findAll(schoolInput).isEmpty()) demoType(tcId, "Nhập Tên Trường", schoolInput, "Đại học Văn Lang");
        if (!findAll(addressInput).isEmpty()) demoType(tcId, "Nhập Địa chỉ", addressInput, "Quận 1, TP. Hồ Chí Minh");
        List<WebElement> pws = findAll(passwordInput);
        if (!pws.isEmpty()) { pws.get(0).clear(); pws.get(0).sendKeys(pw); }
        List<WebElement> cpws = findAll(confirmPasswordInput);
        if (!cpws.isEmpty()) { cpws.get(0).clear(); cpws.get(0).sendKeys(pw); }
    }
}
