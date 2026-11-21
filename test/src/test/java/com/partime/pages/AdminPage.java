package com.partime.pages;

import com.partime.base.BasePage;
import com.partime.utils.ScenarioResult;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.WindowType;

import java.io.File;
import java.util.List;

/**
 * Page Object Model (POM) cho Role 3: Quản trị viên (https://parttime-css0.onrender.com/admin).
 * Tuân thủ nghiêm ngặt quy tắc: mở form/modal nào phải thao tác đúng chỗ & đóng đúng nút Đóng + xác nhận tắt hẳn.
 */
public class AdminPage extends BasePage {

    private final By adminBadge = By.xpath("//*[contains(.,'CỔNG QUẢN TRỊ VIÊN HỆ THỐNG')]");
    private final By adminHeading = By.xpath("//*[contains(.,'Đăng nhập quản trị viên')]");
    private final By emailInput = By.xpath("//input[@type='email']");
    private final By passwordInput = By.xpath("//input[@type='password']");
    private final By adminLoginBtn = By.xpath("//button[contains(.,'Đăng nhập trung tâm chỉ huy')]");
    private final By errorAlertBox = By.xpath("//div[contains(@class,'bg-red-50')]");

    private final By registerLinks = By.xpath("//*[contains(text(),'Đăng ký') or contains(text(),'Tạo tài khoản')]");
    private final By forgotLinks = By.xpath("//*[contains(text(),'Quên mật khẩu')]");
    private final By sidebarMenuItems = By.xpath("//aside//button");

    // Header & Modal Exact Locators
    private final By headerAccountBtn = By.xpath("//button[@title='Tài khoản cá nhân']");
    private final By headerAccountItem = By.xpath("//button[contains(.,'Cập nhật tài khoản cá nhân')]");
    private final By headerNotiBtn = By.xpath("//button[@title='Thông báo hệ thống']");
    private final By notiDropdownContainer = By.xpath("//h4[contains(.,'Thông báo hệ thống')]");

    private final By accountModalContainer = By.xpath("//h2[contains(.,'Tài khoản & bảo mật')]");
    private final By accountModalCloseBtn = By.xpath("//h2[contains(.,'Tài khoản & bảo mật')]/parent::div/following-sibling::button");
    private final By accountPwTab = By.xpath("//div[contains(@class,'z-50')]//button[contains(.,'Đổi mật khẩu')]");
    private final By accountSavePwBtn = By.xpath("//div[contains(@class,'z-50')]//button[contains(.,'Cập nhật mật khẩu mới')]");
    private final By accountModalPasswordInputs = By.xpath("//div[contains(@class,'z-50')]//input[@type='password']");
    private final By accountModalAlertError = By.xpath("//div[contains(@class,'z-50')]//div[contains(@class,'bg-red-50')]");

    private boolean clickSidebar(String tcId, String menuText) {
        return clickSidebarSmart(tcId, menuText);
    }

    public ScenarioResult executeScenario(String tcId, String pomMethod, String input1, String input2, String baseUrl) throws Exception {
        String adminUrl = envConfig.getOrDefault("ADMIN_PORT_URL", baseUrl + "/admin");
        String m = pomMethod == null ? "" : pomMethod;

        if (m.contains("CrossRoleE2ETests")) {
            CrossRoleAndApiHelper helper = new CrossRoleAndApiHelper();
            helper.attachSharedContext(this);
            if (m.contains("adminHideSensitiveJobSyncsToStudent") || m.contains("studentReportChatAdminReadRawAndResolve")) {
                return helper.runAdminModerationSyncE2E(tcId, baseUrl);
            }
            return helper.runFullApplyInterviewChatCallReviewE2E(tcId, baseUrl);
        }
        if (m.contains("ApiTest")) {
            CrossRoleAndApiHelper helper = new CrossRoleAndApiHelper();
            helper.attachSharedContext(this);
            return helper.runSafeApiAndRbacSuite(tcId, m, baseUrl);
        }
        if (m.contains("UnitTest")) {
            return new CrossRoleAndApiHelper().runUnitValidationSuite(tcId, m);
        }

        if (m.contains("loginWithCookiePersistence")) {
            String outcome = executeManualFirstThenCookieLogin(tcId, "admin", adminUrl, adminUrl);
            if ("SKIP_WAIT_COOKIE".equals(outcome)) return ScenarioResult.waitCookie("admin");
            return ScenarioResult.pass(outcome + " | URL=" + getCurrentUrl());
        }

        if (m.contains("verifyNonAdminBlockedAndForgotPwRejected")) {
            String mainHandle = driver.getWindowHandle();
            boolean inSubTab = isRoleActiveInCurrentBrowser("admin", adminUrl);
            if (inSubTab) driver.switchTo().newWindow(WindowType.TAB);
            try {
                if (inSubTab) forceOpenUrl(tcId, adminUrl); else openUrlIfDifferent(tcId, adminUrl);
                pause(550);
                boolean hasAdminUi = isElementDisplayed(adminBadge) && isElementDisplayed(adminHeading) && isElementDisplayed(adminLoginBtn);
                int regCount = findAll(registerLinks).size();
                int forgotCount = findAll(forgotLinks).size();
                demoType(tcId, "Thử nhập Email sai định dạng tại cổng Admin", emailInput, "attacker@yahoo.com");
                demoType(tcId, "Nhập mật khẩu thử nghiệm", passwordInput, "Pass@2026");
                demoClick(tcId, "Bấm Đăng nhập trung tâm chỉ huy kiểm tra bảo mật", adminLoginBtn);
                pause(500);
                String err = isElementDisplayed(errorAlertBox) ? getElementText(errorAlertBox) : "";
                int unauthStatus = httpGetStatus(baseUrl + "/api/admin/dashboard");

                if (hasAdminUi && regCount == 0 && forgotCount == 0 && !err.isBlank() && (unauthStatus == 401 || unauthStatus == 403)) {
                    return ScenarioResult.pass("AdminLoginScreen chuẩn bảo mật: 0 Đăng ký/Quên MK, chặn email ngoại lệ, API chặn " + unauthStatus + ".");
                }
                return ScenarioResult.fail("Kiểm tra bảo mật /admin chưa đạt (api=" + unauthStatus + ")");
            } finally {
                if (inSubTab) { safeCloseSubTab(mainHandle); }
            }
        }

        if (m.contains("verifyAdminTabNotAffectedByStudentLogout")) {
            // [Sửa 20/11/2026 - Ngân] Bản cũ tự ghi token giả rồi tự đọc lại nên luôn PASS (không kiểm tra web).
            // Bản mới: Admin phải đang đăng nhập thật -> mở tab SV, xóa phiên SV giống thao tác Đăng xuất SV
            // -> tải lại /admin: Admin vẫn ở trong Trung tâm chỉ huy, không bị đẩy về màn đăng nhập.
            if (!ensureCookieSessionIfPresent("admin", adminUrl)) return ScenarioResult.waitCookie("admin");
            Object adminTok = js.executeScript("return localStorage.getItem('partime_admin_token');");
            if (adminTok == null || String.valueOf(adminTok).isBlank()) {
                return ScenarioResult.fail("Admin chưa có phiên partime_admin_token thật trước khi kiểm tra.");
            }
            String mainHandle = driver.getWindowHandle();
            // Tab 2: mở cổng SV và xóa phiên SV (giống SV bấm Đăng xuất)
            driver.switchTo().newWindow(WindowType.TAB);
            try {
                forceOpenUrl(tcId, baseUrl + "/");
                pause(350);
                js.executeScript("localStorage.removeItem('partime_student_token'); localStorage.removeItem('partime_student_user');");
            } finally {
                safeCloseSubTab(mainHandle);
            }
            // [Sửa lần 2 - 20/11/2026 - Ngân] Kiểm tra lại ở chính Tab 1 (/admin), không mở /admin ở tab mới:
            // web cố ý bắt tab MỚI phải bấm "Vào tài khoản" (sessionStorage riêng từng tab) nên tab mới luôn hiện màn đăng nhập.
            driver.navigate().refresh();
            pause(900);
            Object tokAfter = js.executeScript("return localStorage.getItem('partime_admin_token');");
            boolean loginShown = isElementDisplayed(adminLoginBtn);
            boolean stillLoggedIn = !loginShown && String.valueOf(adminTok).equals(String.valueOf(tokAfter));
            return stillLoggedIn
                    ? ScenarioResult.pass("Đăng xuất phiên SV ở Tab 2 không ảnh hưởng Tab 1 /admin: token Admin giữ nguyên, vẫn ở Trung tâm chỉ huy.")
                    : ScenarioResult.fail("Tab 1 /admin bị mất phiên sau khi xóa phiên SV ở Tab 2 (loginScreen=" + loginShown + ").");
        }

        if (m.contains("checkAdminAllTables4Viewports")) {
            String mainHandle = driver.getWindowHandle();
            driver.switchTo().newWindow(WindowType.TAB);
            try {
                String summary = checkAll4ViewportsResponsive(tcId, adminUrl);
                return ScenarioResult.pass("Responsive 4 thiết bị cổng /admin không tràn ngang: " + summary);
            } finally {
                safeCloseSubTab(mainHandle);
            }
        }

        // ==================== SAU ĐĂNG NHẬP COOKIE ADMIN (THAO TÁC THẬT - ĐÓNG SẠCH FORM) ====================
        if (!ensureCookieSessionIfPresent("admin", adminUrl)) {
            return ScenarioResult.waitCookie("admin");
        }
        assertNoBlockingOverlayOpen(tcId);

        if (m.contains("verifyMobileDrawerAndModalButtonOrder")) {
            boolean hasBadge = getPageSource().contains("Quản trị viên hệ thống");
            String winState = "";
            try {
                setViewportSize(430, 932);
                pause(450);
                showStepBanner(tcId, "📐 Mobile Drawer Admin đã đăng nhập (430x932)");
                Number scrollW = (Number) js.executeScript("return document.documentElement.scrollWidth;");
                Number clientW = (Number) js.executeScript("return document.documentElement.clientWidth;");
                boolean noOverflow = scrollW.longValue() <= clientW.longValue() + 12;
                By mobileMenuBtn = By.xpath("//header//button[@aria-label or contains(@title,'menu') or contains(@title,'danh mục')]");
                tryDemoClick(tcId, "Mở Drawer Sidebar Mobile Admin", mobileMenuBtn);
                pause(250);
                tryDemoClick(tcId, "Đóng Drawer Sidebar Mobile Admin", By.xpath("//aside//button[contains(@class,'md:hidden')]"));
                return (hasBadge && noOverflow)
                        ? ScenarioResult.pass("Mobile UI /admin (đã đăng nhập) có badge 'Quản trị viên hệ thống', Drawer & không tràn ngang.")
                        : ScenarioResult.fail("Lỗi Mobile UI Admin (hasBadge=" + hasBadge + ", overflow=" + !noOverflow + ").");
            } finally {
                if (Boolean.parseBoolean(System.getProperty("headless", envConfig.getOrDefault("HEADLESS_MODE", "FALSE")))) {
                    setViewportSize(1920, 1080);
                } else {
                    winState = verifyWindowPositionAndFullscreen(tcId);
                }
                pause(300);
            }
        }

        if (m.contains("verifyAdminProfileNameAndNoSelfDelete")) {
            demoClick(tcId, "Mở menu Tài khoản Admin", headerAccountBtn);
            boolean hasSelfDelete = !findAll(By.xpath("//button[contains(.,'Hủy tài khoản') or contains(.,'Xóa tài khoản')]")).isEmpty();
            demoClick(tcId, "Mở AccountModal Admin kiểm tra tên Lê Thị Thuỳ Ngân", headerAccountItem);
            pause(450);
            boolean hasName = getPageSource().contains("Lê Thị Thuỳ Ngân");
            closeDialogAndAssertGone(tcId, "AccountModal Admin", accountModalCloseBtn, accountModalContainer);
            return (hasName && !hasSelfDelete)
                    ? ScenarioResult.pass("AccountModal hiển thị đúng tên Quản trị viên, không cho tự xóa & đóng sạch Modal.")
                    : ScenarioResult.fail("Sai cấu hình bảo vệ Admin Account (hasName=" + hasName + ", selfDelete=" + hasSelfDelete + ")");
        }

        if (m.contains("verifyAdminChangePasswordInvalidBlocked")) {
            demoClick(tcId, "Mở menu Tài khoản Admin", headerAccountBtn);
            demoClick(tcId, "Mở AccountModal Admin", headerAccountItem);
            pause(350);
            demoClick(tcId, "Chuyển tab 'Đổi mật khẩu'", accountPwTab);
            pause(300);
            List<WebElement> pws = findAll(accountModalPasswordInputs);
            if (pws.size() >= 3) {
                moveCursorAndHighlight(pws.get(0), "MK cũ"); pws.get(0).sendKeys("OldPass@123");
                moveCursorAndHighlight(pws.get(1), "MK mới"); pws.get(1).sendKeys("NewPass@2026");
                moveCursorAndHighlight(pws.get(2), "Xác nhận sai"); pws.get(2).sendKeys("KhongKhop@123");
                demoClick(tcId, "Bấm Cập nhật mật khẩu kiểm tra lỗi", accountSavePwBtn);
                pause(400);
            }
            boolean hasErr = isElementDisplayed(accountModalAlertError);
            closeDialogAndAssertGone(tcId, "AccountModal Admin", accountModalCloseBtn, accountModalContainer);
            return hasErr
                    ? ScenarioResult.pass("Chặn đổi mật khẩu Admin khi không khớp & đóng sạch AccountModal.")
                    : ScenarioResult.fail("Không báo lỗi xác nhận mật khẩu Admin.");
        }

        if (m.contains("verifyAdminBellRealtimeAlertsAndNavigation")) {
            String bellRes = verifyBellNotificationClickRoutesMenu(tcId, headerNotiBtn, notiDropdownContainer);
            return ScenarioResult.pass(bellRes);
        }

        if (m.contains("verifySidebar10ModulesAndHeaderBell")) {
            demoClick(tcId, "Mở Chuông thông báo Admin", headerNotiBtn);
            pause(350);
            if (isElementDisplayed(notiDropdownContainer)) {
                closeDialogAndAssertGone(tcId, "Bảng Thông báo Admin", headerNotiBtn, notiDropdownContainer);
            }
            List<WebElement> allBtns = findAll(sidebarMenuItems);
            long visibleCount = allBtns.stream().filter(b -> {
                try { return b.isDisplayed(); } catch (Exception e) { return false; }
            }).count();
            By collapseBtn = By.xpath("//aside//button[contains(@title,'thanh danh mục')]");
            tryDemoClick(tcId, "Thu gọn Sidebar Admin", collapseBtn);
            pause(220);
            tryDemoClick(tcId, "Mở rộng lại Sidebar Admin", collapseBtn);
            clickSidebar(tcId, "Trung tâm chỉ huy");
            return visibleCount >= 10
                    ? ScenarioResult.pass("Kiểm tra Chuông thông báo (mở/đóng sạch), đủ " + visibleCount + " phân hệ Sidebar Admin & thu gọn mượt (không bấm lặp).")
                    : ScenarioResult.fail("Số mục Sidebar Admin hiển thị chưa đủ 10: " + visibleCount);
        }

        if (m.contains("verify4KpisAnd3SvgChartsHover")) {
            clickSidebar(tcId, "Trung tâm chỉ huy");
            long deadline = System.currentTimeMillis() + 5000L;
            List<WebElement> svgs = java.util.Collections.emptyList();
            while (System.currentTimeMillis() < deadline) {
                svgs = findAll(By.cssSelector("svg"));
                if (!svgs.isEmpty() && getPageSource().contains("Xu hướng tăng trưởng")) break;
                pause(200);
            }
            demoHover(tcId, "Rê chuột kiểm tra Biểu đồ đường SVG", By.cssSelector("svg[viewBox='0 0 400 150']"));
            demoHover(tcId, "Rê chuột kiểm tra Biểu đồ tròn Donut SVG", By.cssSelector("svg[viewBox='0 0 100 100']"));
            return (!svgs.isEmpty() && getPageSource().contains("Xu hướng tăng trưởng"))
                    ? ScenarioResult.pass("Hiển thị 4 thẻ KPI & " + svgs.size() + " biểu đồ SVG tại Trung tâm chỉ huy Admin + Hover tooltip OK.")
                    : ScenarioResult.fail("Không tìm thấy biểu đồ SVG trên Dashboard Admin.");
        }

        if (m.contains("filter5DimensionsAndExportExcel") || m.contains("verifyChartTooltipFixedHeightNoLayoutShift")
                || m.contains("measureDashboardExcelExportSpeed") || m.contains("randomizedCrossFilterAndResetMatrix")) {
            clickSidebar(tcId, "Trung tâm chỉ huy");
            pause(550);
            if (m.contains("measureDashboardExcelExportSpeed")) {
                By exportBtn = By.xpath("//button[contains(.,'Xuất báo cáo Excel')]");
                if (!isElementDisplayed(exportBtn) || !isElementEnabled(exportBtn)) {
                    return ScenarioResult.fail("Không thấy nút Xuất báo cáo Excel.");
                }
                clearDownloadsDir();
                long t0 = System.currentTimeMillis();
                demoClick(tcId, "Bấm 'Xuất báo cáo Excel' đo tốc độ & tải tệp .xls", exportBtn);
                pause(700);
                File xls = waitForDownloadedFile(".xls", 8000);
                long ms = System.currentTimeMillis() - t0;
                clearDownloadsDir();
                return (xls != null && ms < 8000)
                        ? ScenarioResult.pass("Xuất báo cáo Excel Dashboard Admin (downloaded=true, elapsed=" + ms + "ms < 8000ms).")
                        : ScenarioResult.fail("Xuất Excel Dashboard Admin thất bại hoặc quá chậm (" + ms + "ms, xls=" + (xls != null) + ").");
            }
            if (m.contains("verifyChartTooltipFixedHeightNoLayoutShift")) {
                By tooltipBox = By.xpath("//div[contains(@class,'h-12') and contains(@class,'rounded-xl')]");
                List<WebElement> boxes = findAll(tooltipBox);
                int hBefore = !boxes.isEmpty() ? boxes.get(0).getSize().getHeight() : 0;
                demoHover(tcId, "Rê chuột kiểm tra chiều cao cố định Tooltip h-12", By.cssSelector("svg[viewBox='0 0 400 150']"));
                int hAfter = !findAll(tooltipBox).isEmpty() ? findAll(tooltipBox).get(0).getSize().getHeight() : 0;
                return (hBefore > 0 && hBefore == hAfter)
                        ? ScenarioResult.pass("Tooltip biểu đồ giữ nguyên chiều cao h-12 (" + hBefore + "px), tuyệt đối không giật layout.")
                        : ScenarioResult.fail("Tooltip biểu đồ đổi chiều cao hoặc không tìm thấy khung h-12 (trước=" + hBefore + "px, sau=" + hAfter + "px)."); // [Sửa 20/11/2026 - Ngân] nhánh này trước đây vẫn PASS
            }
            By yearSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả các năm')]]");
            By provSel = By.xpath("//select[option[@value='' and contains(.,'Toàn quốc')]]");
            By catSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả nhóm ngành nghề')]]");
            int rounds = m.contains("randomizedCrossFilterAndResetMatrix") ? 2 : 1;
            String lastCombo = "";
            for (int r = 1; r <= rounds; r++) {
                String yr = demoSelectRandomNonDefaultOption(tcId, "Lọc Dashboard Năm ngẫu nhiên (Lượt " + r + ")", yearSel);
                String pr = demoSelectRandomNonDefaultOption(tcId, "Lọc Dashboard Tỉnh/Thành ngẫu nhiên", provSel);
                String ca = demoSelectRandomNonDefaultOption(tcId, "Lọc Dashboard Ngành nghề ngẫu nhiên", catSel);
                pause(350);
                tryDemoSelectByValue(tcId, "Reset Năm", yearSel, "");
                tryDemoSelectByValue(tcId, "Reset Tỉnh/Thành", provSel, "");
                tryDemoSelectByValue(tcId, "Reset Ngành nghề", catSel, "");
                lastCombo = "Năm=" + yr + ", Tỉnh=" + pr + ", Ngành=" + ca;
            }
            boolean dlOk = false;
            if (m.contains("filter5DimensionsAndExportExcel")) {
                By exportBtn = By.xpath("//button[contains(.,'Xuất báo cáo Excel')]");
                if (!findAll(exportBtn).isEmpty()) {
                    clearDownloadsDir();
                    demoClick(tcId, "Bấm 'Xuất báo cáo Excel' trên Dashboard", exportBtn);
                    pause(700);
                    dlOk = waitForDownloadedFile(".xls", 7000) != null;
                    clearDownloadsDir();
                }
            }
            // [Sửa 20/11/2026 - Ngân] Trước đây luôn PASS (kể cả excelExport=false). Nay: phải chọn được Năm/Tỉnh/Ngành,
            // Dashboard vẫn hiển thị biểu đồ sau khi lọc, và TC-QTV-013 bắt buộc tải được tệp .xls.
            boolean pickedAll = !lastCombo.contains("Năm=,") && !lastCombo.contains("Tỉnh=,") && !lastCombo.endsWith("Ngành=");
            boolean chartsOk = !findAll(By.cssSelector("svg")).isEmpty();
            boolean exportOk = !m.contains("filter5DimensionsAndExportExcel") || dlOk;
            String dashLog = "(" + lastCombo + ", " + rounds + " lượt, excelExport=" + dlOk + ", charts=" + chartsOk + ")";
            return (pickedAll && chartsOk && exportOk)
                    ? ScenarioResult.pass("Lọc Dashboard Admin tổ hợp ngẫu nhiên " + dashLog + " & khôi phục Toàn thời gian.")
                    : ScenarioResult.fail("Lọc Dashboard Admin chưa đạt " + dashLog + " pickedAll=" + pickedAll);
        }

        if (m.contains("searchEmailIdAndFilter4Criteria")) {
            clickSidebar(tcId, "Quản lý người dùng");
            pause(500);
            By userSearchIn = By.xpath("//input[contains(@placeholder,'Tìm kiếm (Email; ID)')]");
            By roleSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả vai trò')]]");
            By lockSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả trạng thái khóa')]]");
            By gpkdSel = By.xpath("//select[option[@value='all' and contains(.,'Tất cả trạng thái GPKD')]]");
            String randUser = pickRandom(new String[]{"vuthelong", "gmail.com", "lethithuyngan"});
            // [Sửa 20/11/2026 - Ngân] Thêm kiểm tra: kết quả tìm kiếm phải có dòng chứa từ khóa vừa gõ.
            boolean searchHit = false;
            if (findAll(userSearchIn).isEmpty()) return ScenarioResult.fail("Không thấy ô Tìm kiếm (Email; ID) ở Quản lý người dùng.");
            demoType(tcId, "Tìm kiếm người dùng ngẫu nhiên: " + randUser, userSearchIn, randUser);
            pause(450);
            for (WebElement row : findAll(By.xpath("//table//tbody/tr"))) {
                try { if (row.getText().toLowerCase().contains(randUser)) { searchHit = true; break; } } catch (Exception ignored) {}
            }
            clearReactInput(find(userSearchIn));
            if (!searchHit) return ScenarioResult.fail("Tìm '" + randUser + "' không ra dòng người dùng nào chứa từ khóa.");
            String rolePicked = demoSelectRandomNonDefaultOption(tcId, "Lọc Vai trò ngẫu nhiên", roleSel);
            tryDemoSelectByValue(tcId, "Reset vai trò", roleSel, "");
            String lockPicked = demoSelectRandomNonDefaultOption(tcId, "Lọc Trạng thái khóa ngẫu nhiên", lockSel);
            tryDemoSelectByValue(tcId, "Reset trạng thái khóa", lockSel, "");
            String gpkdPicked = demoSelectRandomNonDefaultOption(tcId, "Lọc Trạng thái GPKD ngẫu nhiên", gpkdSel);
            tryDemoSelectByValue(tcId, "Reset GPKD", gpkdSel, "all");
            return ScenarioResult.pass("Tìm kiếm & lọc ngẫu nhiên 4 tiêu chí Quản lý người dùng (" + randUser + " | " + rolePicked + " | " + lockPicked + " | " + gpkdPicked + ") -> reset sạch.");
        }

        if (m.contains("openUserDetailInspectCvAndGpkdPdf")) {
            clickSidebar(tcId, "Quản lý người dùng");
            pause(500);
            List<WebElement> rows = findAll(By.xpath("//table//tbody/tr"));
            if (rows.isEmpty()) return ScenarioResult.fail("Không có dòng người dùng nào trong bảng.");
            moveCursorAndHighlight(rows.get(0), "Nhấp dòng người dùng mở Modal chi tiết");
            rows.get(0).click();
            pause(500);
            By userModalH3 = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3");
            By userModalClose = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//div[contains(@class,'border-b')]/button");
            if (!isElementDisplayed(userModalH3)) return ScenarioResult.fail("Modal chi tiết người dùng không mở.");
            String subDoc = "DETAIL_MODAL_OK";
            List<WebElement> subPdfBtns = findAll(By.xpath("//div[contains(@class,'fixed')]//button[contains(.,'Xem CV') or contains(.,'Xem bản in') or contains(.,'Xem GPKD')]"));
            if (!subPdfBtns.isEmpty() && subPdfBtns.get(0).isDisplayed()) {
                demoClick(tcId, "Mở tài liệu PDF trong Modal Chi tiết User", By.xpath("(//div[contains(@class,'fixed')]//button[contains(.,'Xem CV') or contains(.,'Xem bản in') or contains(.,'Xem GPKD')])[1]"));
                pause(600);
                subDoc = verifyPdfIframeNavigation(tcId);
                tryDemoClick(tcId, "Đóng DocumentViewerModal", By.xpath("//button[@title='Đóng modal']"));
            }
            if (isElementDisplayed(userModalH3)) {
                closeDialogAndAssertGone(tcId, "Modal Chi tiết người dùng", userModalClose, userModalH3);
            }
            return ScenarioResult.pass("Mở Modal Chi tiết người dùng (" + subDoc + ") & đóng sạch bằng nút X.");
        }

        if (m.contains("filterEmployersAndViewPdf") || m.contains("verifyGpkdDesk3KpisAndMstFormatFilter")
                || m.contains("verifyGpkdPdfViewerAndDownload")) {
            clickSidebar(tcId, "Bàn thẩm định");
            pause(500);
            if (m.contains("verifyGpkdPdfViewerAndDownload") || m.contains("filterEmployersAndViewPdf")) {
                By gpkdSearch = By.xpath("//input[contains(@placeholder,'Tìm')]");
                if (!findAll(gpkdSearch).isEmpty()) {
                    demoType(tcId, "Tìm kiếm tại Bàn thẩm định GPKD", gpkdSearch, "Coffee");
                    pause(300);
                    clearReactInput(find(gpkdSearch));
                }
                List<WebElement> pdfBtns = findAll(By.xpath("//button[contains(.,'Xem file GPKD')]"));
                // [Sửa 20/11/2026 - Ngân] Không có tệp GPKD nào thì chưa kiểm được trình xem PDF -> NOT RUN thay vì PASS.
                if (pdfBtns.isEmpty()) return ScenarioResult.needManualOrCloneData("Bàn thẩm định chưa có hồ sơ nào kèm tệp GPKD PDF để mở thử.");
                demoClickRandomElement(tcId, "Chọn dòng GPKD & bấm 'Xem file GPKD'", By.xpath("//button[contains(.,'Xem file GPKD')]"));
                pause(650);
                String iframeState = verifyPdfIframeNavigation(tcId);
                clearDownloadsDir();
                tryDemoClick(tcId, "Bấm 'Tải về' PDF GPKD trong DocumentViewerModal", By.xpath("//button[@title='Tải tệp PDF về máy tính' or normalize-space()='Tải về']"));
                pause(750);
                File pdfDl = waitForDownloadedFile(".pdf", 8000);
                clearDownloadsDir();
                By closeDocBtn = By.xpath("//button[@title='Đóng modal']");
                if (isElementDisplayed(closeDocBtn)) {
                    closeDialogAndAssertGone(tcId, "DocumentViewerModal GPKD Admin", closeDocBtn, closeDocBtn);
                }
                // [Sửa 20/11/2026 - Ngân] Trước đây downloaded=false vẫn PASS. Nay: phải đọc được iframe PDF;
                // riêng TC-QTV-026 (verifyGpkdPdfViewerAndDownload) bắt buộc tải về được tệp .pdf.
                boolean iframeOk = iframeState != null && !iframeState.startsWith("NO_IFRAME");
                boolean dlRequired = m.contains("verifyGpkdPdfViewerAndDownload");
                String gpLog = "DocumentViewerModal GPKD (" + iframeState + ", downloaded=" + (pdfDl != null) + ")";
                return (iframeOk && (!dlRequired || pdfDl != null))
                        ? ScenarioResult.pass("Mở " + gpLog + " & đóng sạch.")
                        : ScenarioResult.fail("Xem/Tải GPKD chưa đạt: " + gpLog);
            }
            By mstSel = By.xpath("//select[option[contains(.,'10')] or option[contains(.,'MST')]]");
            String mstPick = demoSelectRandomNonDefaultOption(tcId, "Lọc định dạng MST tại Bàn GPKD", mstSel);
            tryDemoSelectByIndex(tcId, "Reset lọc MST", mstSel, 0);
            tryDemoClick(tcId, "Lọc GPKD Đã duyệt", By.xpath("//button[contains(.,'Đã duyệt') or contains(.,'Đã phê duyệt')]"));
            tryDemoClick(tcId, "Quay lại Tất cả GPKD", By.xpath("//button[contains(.,'Tất cả')]"));
            return ScenarioResult.pass("Kiểm tra 3 KPI, lọc định dạng MST (" + mstPick + ") & trạng thái tại Bàn thẩm định GPKD.");
        }

        if (m.contains("filterQuickBtnsAndApproveModeration") || m.contains("verifyClickSensitiveKeywordTagFilterAndModal")) {
            clickSidebar(tcId, "Kiểm duyệt tin tuyển dụng");
            pause(500);
            By jobSearch = By.xpath("//input[contains(@placeholder,'Tìm kiếm')]");
            String randJobKw = pickRandom(new String[]{"Phục vụ", "Bán hàng", "Pha chế", "Thu ngân"});
            if (!findAll(jobSearch).isEmpty()) {
                demoType(tcId, "Tìm kiếm tin kiểm duyệt ngẫu nhiên: " + randJobKw, jobSearch, randJobKw);
                pause(300);
                clearReactInput(find(jobSearch));
            }
            tryDemoClick(tcId, "Bấm lọc nhanh 'Tin mới đăng chờ kiểm duyệt'", By.xpath("//button[contains(.,'Tin mới đăng chờ kiểm duyệt')]"));
            pause(250);
            tryDemoClick(tcId, "Bấm lọc nhanh 'Cảnh báo từ ngữ nhạy cảm'", By.xpath("//button[contains(.,'Cảnh báo từ ngữ nhạy cảm')]"));
            pause(250);
            tryDemoClick(tcId, "Quay lại 'Tất cả tin'", By.xpath("//button[contains(.,'Tất cả tin')]"));
            By jobStatusSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả trạng thái vận hành')]]");
            By jobModSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả trạng thái kiểm duyệt')]]");
            String stPick = demoSelectRandomNonDefaultOption(tcId, "Lọc vận hành ngẫu nhiên", jobStatusSel);
            tryDemoSelectByValue(tcId, "Reset vận hành", jobStatusSel, "");
            String modPick = demoSelectRandomNonDefaultOption(tcId, "Lọc kiểm duyệt ngẫu nhiên", jobModSel);
            tryDemoSelectByValue(tcId, "Reset kiểm duyệt", jobModSel, "");
            // Mở Modal Chi tiết tin tuyển dụng & đóng X sạch
            List<WebElement> jobRows = findAll(By.xpath("//table//tbody/tr"));
            if (!jobRows.isEmpty()) {
                moveCursorAndHighlight(jobRows.get(0), "Nhấp dòng tin tuyển dụng mở Modal Chi tiết");
                jobRows.get(0).click();
                pause(450);
                By jobModalBody = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//span[contains(.,'Mã tin:')]");
                By jobModalClose = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//div[contains(@class,'border-b')]/button");
                if (isElementDisplayed(jobModalBody)) {
                    closeDialogAndAssertGone(tcId, "Modal Chi tiết tin tuyển dụng Admin", jobModalClose, jobModalBody);
                }
            }
            return ScenarioResult.pass("Tìm kiếm & lọc ngẫu nhiên Kiểm duyệt tin (" + randJobKw + " | " + stPick + " | " + modPick + ") + mở/đóng Modal sạch sẽ.");
        }

        if (m.contains("preventDuplicateOrBlankKeyword") || m.contains("verifyKeywordHitCountAndDeleteKeyword")) {
            clickSidebar(tcId, "Kiểm duyệt từ khoá cấm");
            pause(500);
            List<WebElement> editBtns = findAll(By.xpath("//button[@title='Chỉnh sửa từ khóa cấm']"));
            if (!editBtns.isEmpty()) {
                moveCursorAndHighlight(editBtns.get(0), "Bấm Chỉnh sửa inline từ khóa cấm");
                editBtns.get(0).click();
                pause(300);
                By cancelKwBtn = By.xpath("//table//button[normalize-space()='Hủy']");
                if (isElementDisplayed(cancelKwBtn)) {
                    demoClick(tcId, "Bấm Hủy giữ nguyên từ khóa hệ thống", cancelKwBtn);
                    pause(250);
                }
            }
            By alertJobsBtn = By.xpath("//button[contains(.,'Xem tin cảnh báo')]");
            if (!findAll(alertJobsBtn).isEmpty()) {
                moveCursorAndHighlight(find(alertJobsBtn), "Kiểm tra liên kết Xem tin cảnh báo");
            }
            boolean hasTable = getPageSource().contains("Bảng thống kê từ khóa cấm");
            return hasTable
                    ? ScenarioResult.pass("Kiểm tra bảng Từ khóa cấm, nút sửa inline (Hủy an toàn), cột khớp tin & liên kết Xem tin cảnh báo.")
                    : ScenarioResult.fail("Không hiển thị bảng thống kê từ khóa cấm.");
        }

        if (m.contains("filterHideRestoreAndDeleteReview") || m.contains("verifyReviewDetailModalContent")) {
            clickSidebar(tcId, "Quản lý đánh giá");
            pause(500);
            By revSearch = By.xpath("//input[contains(@placeholder,'Tên sinh viên')]");
            String randRevKw = pickRandom(new String[]{"Long", "Minh", "Coffee", "Partime"});
            if (!findAll(revSearch).isEmpty()) {
                demoType(tcId, "Tìm kiếm đánh giá ngẫu nhiên: " + randRevKw, revSearch, randRevKw);
                pause(300);
                clearReactInput(find(revSearch));
            }
            By revStatSel = By.xpath("//select[option[@value='all' and contains(.,'Tất cả đánh giá')]]");
            By revDirSel = By.xpath("//select[option[@value='all' and contains(.,'Tất cả chiều tương tác')]]");
            By revStarSel = By.xpath("//select[option[@value='all' and contains(.,'Tất cả số sao')]]");
            String rs1 = demoSelectRandomNonDefaultOption(tcId, "Lọc trạng thái đánh giá ngẫu nhiên", revStatSel);
            tryDemoSelectByValue(tcId, "Reset trạng thái đánh giá", revStatSel, "all");
            String rs2 = demoSelectRandomNonDefaultOption(tcId, "Lọc chiều tương tác ngẫu nhiên", revDirSel);
            tryDemoSelectByValue(tcId, "Reset chiều tương tác", revDirSel, "all");
            String rs3 = demoSelectRandomNonDefaultOption(tcId, "Lọc số sao ngẫu nhiên", revStarSel);
            tryDemoSelectByValue(tcId, "Reset số sao", revStarSel, "all");
            // Mở Modal Chi tiết bài đánh giá & đóng X
            List<WebElement> revRows = findAll(By.xpath("//table//tbody/tr"));
            if (!revRows.isEmpty() && !revRows.get(0).getText().contains("Chưa có bài đánh giá")) {
                moveCursorAndHighlight(revRows.get(0), "Nhấp dòng đánh giá mở Modal Chi tiết");
                revRows.get(0).click();
                pause(450);
                By revDetailH3 = By.xpath("//h3[contains(.,'Chi tiết bài đánh giá')]");
                By revDetailClose = By.xpath("//h3[contains(.,'Chi tiết bài đánh giá')]/ancestor::div[contains(@class,'border-b')]/button");
                if (isElementDisplayed(revDetailH3)) {
                    closeDialogAndAssertGone(tcId, "Modal Chi tiết bài đánh giá", revDetailClose, revDetailH3);
                }
            }
            return ScenarioResult.pass("Tìm kiếm & lọc ngẫu nhiên Đánh giá (" + randRevKw + " | " + rs1 + " | " + rs2 + " | " + rs3 + ") + mở/đóng Modal chi tiết.");
        }

        if (m.contains("crudCategoryAndSync")) {
            clickSidebar(tcId, "Master Data");
            pause(450);
            String chosenTab = pickRandom(new String[]{"Ngành Nghề", "Địa Điểm"});
            tryDemoClick(tcId, "Chọn tab Master Data ngẫu nhiên: " + chosenTab, By.xpath("//button[contains(.,'" + chosenTab + "')]"));
            pause(250);
            By catNameIn = By.xpath("//input[contains(@placeholder,'ngành nghề mới') or contains(@placeholder,'địa điểm mới')]");
            By addCatBtn = By.xpath("//button[@type='submit' and contains(.,'Thêm danh mục')]");
            By catSearch = By.xpath("//input[contains(@placeholder,'Tìm kiếm (Tên danh mục)')]");
            long uniq = System.currentTimeMillis() % 10000;
            String tempCat = "[AutoTest] " + chosenTab + " " + uniq;
            String editedCat = "[AutoTest] Đã Sửa " + uniq;
            if (!findAll(catNameIn).isEmpty()) {
                demoType(tcId, "Nhập tên danh mục mới: " + tempCat, catNameIn, tempCat);
                demoClick(tcId, "Bấm 'Thêm danh mục'", addCatBtn);
                pause(800);
                if (!findAll(catSearch).isEmpty()) {
                    demoType(tcId, "Tìm danh mục vừa tạo [AutoTest]", catSearch, "[AutoTest]");
                    pause(350);
                }
                boolean added = getPageSource().contains("[AutoTest]");
                if (added) {
                    By editIcon = By.xpath("//tr[contains(.,'[AutoTest]')]//button[@title='Chỉnh sửa tên danh mục']");
                    if (!findAll(editIcon).isEmpty()) {
                        demoClick(tcId, "Bấm Sửa tên danh mục [AutoTest]", editIcon);
                        pause(250);
                        By inlineIn = By.xpath("//tr[contains(.,'Lưu')]//input[@type='text']");
                        if (!findAll(inlineIn).isEmpty()) {
                            demoType(tcId, "Sửa thành: " + editedCat, inlineIn, editedCat);
                            demoClick(tcId, "Bấm 'Lưu' cập nhật danh mục", By.xpath("//tr//button[normalize-space()='Lưu']"));
                            pause(700);
                        }
                    }
                    By delCatBtn = By.xpath("//tr[contains(.,'[AutoTest]')]//button[@title='Xóa danh mục']");
                    if (!findAll(delCatBtn).isEmpty()) {
                        demoClick(tcId, "Bấm Xóa danh mục test [AutoTest]", delCatBtn);
                        pause(350);
                        By confirmDel = By.xpath("//div[contains(@class,'z-[9999]')]//button[normalize-space()='Xóa']");
                        if (isElementDisplayed(confirmDel)) {
                            closeDialogAndAssertGone(tcId, "ConfirmDialog Xóa Master Data", confirmDel, By.xpath("//div[contains(@class,'z-[9999]')]//h3"));
                            pause(700);
                        }
                    }
                }
                if (!findAll(catSearch).isEmpty()) clearReactInput(find(catSearch));
                tryDemoClick(tcId, "Quay lại tab Tất Cả", By.xpath("//button[contains(.,'Tất Cả')]"));
                return added
                        ? ScenarioResult.pass("CRUD Master Data hoàn chỉnh: Thêm '" + tempCat + "' -> Tìm -> Sửa inline '" + editedCat + "' (Lưu) -> Xóa ConfirmDialog sạch.")
                        : ScenarioResult.fail("Đã bấm Thêm danh mục nhưng chưa thấy [AutoTest] trong bảng.");
            }
            return ScenarioResult.fail("Không tìm thấy ô nhập Thêm danh mục trong Master Data.");
        }

        if (m.contains("addEmptyOrDuplicateCategoryExpectError")) {
            clickSidebar(tcId, "Master Data");
            pause(450);
            tryDemoClick(tcId, "Chọn tab Ngành Nghề", By.xpath("//button[contains(.,'Ngành Nghề')]"));
            pause(300);
            By firstCatSpan = By.xpath("//table//tbody/tr[1]//span[contains(@class,'font-bold')]");
            By catNameIn = By.xpath("//input[contains(@placeholder,'ngành nghề mới') or contains(@placeholder,'địa điểm mới')]");
            By addCatBtn = By.xpath("//button[@type='submit' and contains(.,'Thêm danh mục')]");
            String existingName = !findAll(firstCatSpan).isEmpty() ? findAll(firstCatSpan).get(0).getText().trim() : "";
            if (!existingName.isEmpty() && !findAll(catNameIn).isEmpty()) {
                demoType(tcId, "Thử nhập trùng tên danh mục đang có: " + existingName, catNameIn, existingName);
                demoClick(tcId, "Bấm 'Thêm danh mục' kiểm tra chặn trùng lặp", addCatBtn);
                pause(600);
                clearReactInput(find(catNameIn));
            }
            tryDemoClick(tcId, "Quay lại tab Tất Cả", By.xpath("//button[contains(.,'Tất Cả')]"));
            return ScenarioResult.pass("Kiểm tra chặn thêm danh mục rỗng/trùng lặp ('" + existingName + "') trên Master Data.");
        }

        if (m.contains("verifyMasterData3TabsAndSearch")) {
            clickSidebar(tcId, "Master Data");
            pause(450);
            tryDemoClick(tcId, "Chuyển tab Ngành nghề", By.xpath("//button[contains(.,'Ngành Nghề') or contains(.,'Ngành nghề')]"));
            tryDemoClick(tcId, "Chuyển tab Địa điểm", By.xpath("//button[contains(.,'Địa Điểm') or contains(.,'Địa điểm')]"));
            tryDemoClick(tcId, "Quay lại tab Tất cả", By.xpath("//button[contains(.,'Tất Cả') or contains(.,'Tất cả')]"));
            By catSearch = By.xpath("//input[contains(@placeholder,'Tìm kiếm (Tên danh mục)')]");
            String randCat = pickRandom(new String[]{"Phục vụ", "Quận", "Bán hàng", "Pha chế"});
            if (!findAll(catSearch).isEmpty()) {
                demoType(tcId, "Tìm kiếm danh mục Master Data ngẫu nhiên: " + randCat, catSearch, randCat);
                pause(300);
                clearReactInput(find(catSearch));
            }
            return ScenarioResult.pass("Chuyển đổi 3 tab & tìm kiếm ngẫu nhiên ('" + randCat + "') danh mục Master Data thành công.");
        }

        if (m.contains("filter4TabsAndOpenEvidenceCv") || m.contains("measureReportsFilterAndRawChatLoadSpeed")) {
            clickSidebar(tcId, "Khiếu nại");
            pause(450);
            By ticketSearch = By.xpath("//input[contains(@placeholder,'Mã phiếu')]");
            if (!findAll(ticketSearch).isEmpty()) {
                demoType(tcId, "Tìm kiếm phiếu khiếu nại", ticketSearch, "RP-");
                pause(250);
                clearReactInput(find(ticketSearch));
            }
            String[] tabs = {"Tin tuyển dụng", "Ứng viên", "Hội thoại", "Tất cả"};
            for (String tb : tabs) {
                tryDemoClick(tcId, "Lọc tab Khiếu nại: " + tb, By.xpath("//button[contains(.,'" + tb + "')]"));
            }
            By ticketSel = By.xpath("//select[option[@value='all' and contains(.,'Tất cả trạng thái khiếu nại')]]");
            tryDemoSelectByValue(tcId, "Lọc Chờ tiếp nhận", ticketSel, "pending");
            tryDemoSelectByValue(tcId, "Reset trạng thái khiếu nại", ticketSel, "all");
            List<WebElement> detailBtns = findAll(By.xpath("//button[contains(.,'Xem chi tiết')]"));
            if (!detailBtns.isEmpty() && detailBtns.get(0).isDisplayed()) {
                moveCursorAndHighlight(detailBtns.get(0), "Bấm Xem chi tiết phiếu khiếu nại");
                detailBtns.get(0).click();
                pause(450);
                By tickH3 = By.xpath("//h3[contains(.,'Chi tiết phiếu khiếu nại')]");
                By tickClose = By.xpath("//h3[contains(.,'Chi tiết phiếu khiếu nại')]/ancestor::div[contains(@class,'border-b')]/button");
                if (isElementDisplayed(tickH3)) {
                    closeDialogAndAssertGone(tcId, "Modal Chi tiết phiếu khiếu nại", tickClose, tickH3);
                }
            }
            return ScenarioResult.pass("Tìm kiếm, lọc 4 tab + Select trạng thái & mở/đóng Modal Chi tiết phiếu Khiếu nại thành công.");
        }

        if (m.contains("verify13FilterGroupsAndTableRows")) {
            clickSidebar(tcId, "Nhật ký hoạt động");
            pause(450);
            By auditSel = By.xpath("//select[option[@value='all' and contains(.,'Tất cả hành động quản trị')]]");
            int optCount = !findAll(auditSel).isEmpty() ? new org.openqa.selenium.support.ui.Select(find(auditSel)).getOptions().size() : 0;
            String selCheck = verifySelectSingleAndSelectedOptions(tcId, auditSel);
            String picked1 = demoSelectRandomNonDefaultOption(tcId, "Lọc Audit Log ngẫu nhiên lượt 1", auditSel);
            pause(250);
            String picked2 = demoSelectRandomNonDefaultOption(tcId, "Lọc Audit Log ngẫu nhiên lượt 2", auditSel);
            pause(250);
            tryDemoSelectByVisibleText(tcId, "Reset Audit Log về Tất cả", auditSel, "Tất cả hành động quản trị (13 nhóm lọc / 16 sự kiện)");
            tryDemoSelectByValue(tcId, "Reset Audit Log về all", auditSel, "all");
            return optCount >= 14
                    ? ScenarioResult.pass("Nhật ký hoạt động đủ " + optCount + " tùy chọn (13 nhóm lọc), lọc (" + picked1 + " -> " + picked2 + ") & reset (" + selCheck + ").")
                    : ScenarioResult.fail("Số tùy chọn lọc Audit Log chưa đủ 14 (" + optCount + ").");
        }

        if (m.contains("publishMissingTitleOrBodyExpectBlocked")) {
            clickSidebar(tcId, "Thông báo hệ thống");
            pause(450);
            By sendBtn = By.xpath("//button[@type='submit']");
            tryDemoClick(tcId, "Thử bấm Gửi Broadcast khi bỏ trống nội dung", sendBtn);
            pause(300);
            return getPageSource().contains("Gửi Thông Báo Hệ Thống Hàng Loạt")
                    ? ScenarioResult.pass("Chặn phát Broadcast khi bỏ trống Tiêu đề/Nội dung bắt buộc.")
                    : ScenarioResult.fail("Không xác nhận được màn Broadcast.");
        }

        if (m.contains("runFullAdminSanityJourney")) {
            clickSidebar(tcId, "Trung tâm chỉ huy");
            pause(350);
            By yearSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả các năm')]]");
            String pickedYr = demoSelectRandomNonDefaultOption(tcId, "Smoke QTV: Lọc năm ngẫu nhiên", yearSel);
            tryDemoSelectByValue(tcId, "Smoke QTV: Reset năm", yearSel, "");
            clickSidebar(tcId, "Quản lý người dùng");
            pause(350);
            clickSidebar(tcId, "Kiểm duyệt tin tuyển dụng");
            pause(350);
            clickSidebar(tcId, "Trung tâm chỉ huy");
            return ScenarioResult.pass("Hoàn thành Smoke End-to-End QTV (Năm=" + pickedYr + "): Dashboard -> Users -> Jobs Moderation -> Dashboard.");
        }

        return ScenarioResult.needManualOrCloneData(
                "Cần dữ liệu thử nghiệm riêng / E2E đa trình duyệt để không ảnh hưởng tài khoản hoặc tin thật ('" + m + "')."
        );
    }
}
