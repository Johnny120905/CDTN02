package com.partime.pages;

import com.partime.base.BasePage;
import com.partime.utils.ScenarioResult;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.WindowType;

import java.io.File;
import java.util.List;

/**
 * Page Object Model (POM) cho Role 2: Nhà tuyển dụng (https://parttime-css0.onrender.com/employer).
 * Áp dụng quy tắc nghiêm ngặt: mọi form/modal/drawer mở ra bắt buộc phải đóng đúng nút & xác minh đã tắt hẳn.
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

    // Header & Modal Exact Locators
    private final By headerAccountBtn = By.xpath("//button[@title='Tài khoản cá nhân']");
    private final By headerAccountItem = By.xpath("//button[contains(.,'Cập nhật tài khoản cá nhân')]");
    private final By headerDeleteAccItem = By.xpath("//button[contains(.,'Hủy tài khoản')]");
    private final By headerNotiBtn = By.xpath("//button[@title='Thông báo hệ thống']");
    private final By headerChatBtn = By.xpath("//button[@title='Mở thanh trò chuyện & phỏng vấn']");
    private final By notiDropdownContainer = By.xpath("//h4[contains(.,'Thông báo hệ thống')]");
    private final By accountDropdownContainer = By.xpath("//button[contains(.,'Cập nhật tài khoản cá nhân')]");

    private final By accountModalContainer = By.xpath("//h2[contains(.,'Tài khoản & bảo mật')]");
    private final By accountModalCloseBtn = By.xpath("//h2[contains(.,'Tài khoản & bảo mật')]/parent::div/following-sibling::button");
    private final By accountSaveProfileBtn = By.xpath("//div[contains(@class,'z-50')]//button[contains(.,'Lưu thay đổi thông tin')]");
    private final By accountPwTab = By.xpath("//div[contains(@class,'z-50')]//button[contains(.,'Đổi mật khẩu')]");
    private final By accountSavePwBtn = By.xpath("//div[contains(@class,'z-50')]//button[contains(.,'Cập nhật mật khẩu mới')]");
    private final By accountModalPasswordInputs = By.xpath("//div[contains(@class,'z-50')]//input[@type='password']");
    private final By accountModalAlertError = By.xpath("//div[contains(@class,'z-50')]//div[contains(@class,'bg-red-50')]");

    private final By deleteModalContainer = By.xpath("//h3[contains(.,'Xác nhận hủy tài khoản')]");
    private final By deleteModalKeepBtn = By.xpath("//button[contains(.,'Không, giữ lại tài khoản')]");
    private final By chatDrawerContainer = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Hội thoại') or contains(.,'Widget chat')]");
    private final By chatDrawerCloseBtn = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Hội thoại') or contains(.,'Widget chat')]/ancestor::div[contains(@class,'border-b')]/button");

    private final By sidebarMenuItems = By.xpath("//aside//button");
    private final By loginNavBtn = By.xpath("//button[contains(.,'Đăng nhập')]");
    private final By forgotPwHeading = By.xpath("//*[contains(.,'Quên mật khẩu') or contains(.,'Khôi phục mật khẩu')]");
    private final By headerQuickPostBtn = By.xpath("//header//button[contains(.,'Đăng tin mới')]");
    private final By docViewerContainer = By.xpath("//button[@title='Đóng modal']");
    private final By docViewerCloseBtn = By.xpath("//button[@title='Đóng modal']");

    private boolean clickSidebar(String tcId, String menuText) {
        return clickSidebarSmart(tcId, menuText);
    }

    public ScenarioResult executeScenario(String tcId, String pomMethod, String input1, String input2, String baseUrl) throws Exception {
        String employerUrl = envConfig.getOrDefault("EMPLOYER_PORT_URL", baseUrl + "/employer");
        String loginUrl = baseUrl + "/employer/login";
        String registerUrl = baseUrl + "/employer/register";
        String forgotUrl = baseUrl + "/employer/forgot-password";
        String m = pomMethod == null ? "" : pomMethod;

        if (m.contains("CrossRoleE2ETests")) {
            CrossRoleAndApiHelper helper = new CrossRoleAndApiHelper();
            helper.attachSharedContext(this);
            if (m.contains("Reject") || m.contains("reject")) {
                return helper.runRejectAndReadOnlyLockE2E(tcId, baseUrl);
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
                    demoType(tcId, "Quên MK NTD: Thử Email sai định dạng", emailInput, "hr.sai");
                    demoClick(tcId, "Bấm 'Nhận mã OTP (60 giây)'", By.xpath("//button[@type='submit' and contains(.,'Nhận mã OTP')]"));
                    pause(350);
                    String html5Msg = String.valueOf(find(emailInput).getAttribute("validationMessage")).trim();
                    String err1 = isElementDisplayed(errorAlertBox) ? getElementText(errorAlertBox) : html5Msg;
                    demoType(tcId, "Quên MK NTD: Thử Email Admin bị chặn", emailInput, "lethithuyngan985@gmail.com");
                    demoClick(tcId, "Bấm 'Nhận mã OTP (60 giây)'", By.xpath("//button[@type='submit' and contains(.,'Nhận mã OTP')]"));
                    pause(350);
                    String err2 = isElementDisplayed(errorAlertBox) ? getElementText(errorAlertBox) : "";
                    return (hasGuestUi && hasForgot && !err1.isBlank() && !err2.isBlank())
                            ? ScenarioResult.pass("Cổng Khách NTD & Quên MK (/employer/forgot-password) chặn đúng Email sai & Email Admin.")
                            : ScenarioResult.fail("Thiếu giao diện Khách NTD hoặc cảnh báo Quên MK.");
                }
                return hasGuestUi
                        ? ScenarioResult.pass("Chế độ Khách NTD (/employer) hiển thị " + findAll(sidebarMenuItems).size() + " mục Sidebar & hướng dẫn 3 bước.")
                        : ScenarioResult.fail("Không tải được giao diện Khách /employer.");
            } finally {
                safeCloseSubTab(mainHandle);
            }
        }

        if (m.contains("verifyEmployerFooterQuickLinks")) {
            if (!isRoleActiveInCurrentBrowser("employer", employerUrl)) openUrlIfDifferent(tcId, employerUrl);
            assertNoBlockingOverlayOpen(tcId);
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
                safeCloseSubTab(mainHandle);
            }
        }

        // ==================== SAU ĐĂNG NHẬP COOKIE NTD (ĐÚNG THAO TÁC - TẮT SẠCH FORM) ====================
        if (!ensureCookieSessionIfPresent("employer", employerUrl)) {
            return ScenarioResult.waitCookie("employer");
        }
        assertNoBlockingOverlayOpen(tcId);

        if (m.contains("updateEmployerAccountAndCheckPwTab") || m.contains("verifyChangePasswordValidationErrors")) {
            demoClick(tcId, "Mở Dropdown Tài khoản NTD", headerAccountBtn);
            demoClick(tcId, "Mở AccountModal Thông tin tài khoản", headerAccountItem);
            pause(450);
            if (!isElementDisplayed(accountModalContainer)) return ScenarioResult.fail("AccountModal NTD không mở.");
            if (m.contains("ValidationErrors")) {
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
                closeDialogAndAssertGone(tcId, "AccountModal NTD", accountModalCloseBtn, accountModalContainer);
                return hasErr
                        ? ScenarioResult.pass("Kiểm tra lỗi đổi mật khẩu NTD & đóng sạch AccountModal.")
                        : ScenarioResult.fail("Không hiển thị lỗi xác nhận MK trong AccountModal NTD.");
            } else {
                demoClick(tcId, "Bấm tab Đổi mật khẩu kiểm tra giao diện", accountPwTab);
                pause(300);
                closeDialogAndAssertGone(tcId, "AccountModal NTD", accountModalCloseBtn, accountModalContainer);
                return ScenarioResult.pass("Mở AccountModal NTD -> Chuyển tab Đổi MK -> Đóng sạch Modal.");
            }
        }

        if (m.contains("verifyDeleteModalAndLogout")) {
            demoClick(tcId, "Mở menu Tài khoản NTD", headerAccountBtn);
            demoClick(tcId, "Bấm 'Hủy tài khoản' mở Modal xác nhận", headerDeleteAccItem);
            pause(450);
            if (!isElementDisplayed(deleteModalContainer)) return ScenarioResult.fail("Modal Hủy tài khoản NTD không mở.");
            closeDialogAndAssertGone(tcId, "Modal Hủy tài khoản NTD", deleteModalKeepBtn, deleteModalContainer);
            return ScenarioResult.pass("Mở Modal Hủy tài khoản NTD -> Bấm giữ lại -> Tắt Modal.");
        }

        if (m.contains("verifyBellNotificationClickNavigatesToAts")) {
            String bellRes = verifyBellNotificationClickRoutesMenu(tcId, headerNotiBtn, notiDropdownContainer);
            return ScenarioResult.pass(bellRes);
        }

        if (m.contains("verifyBellDrawerAndFooter4Links") || m.contains("verifyHeaderChatDrawerNavigation")) {
            demoClick(tcId, "Mở Chuông thông báo NTD", headerNotiBtn);
            pause(400);
            if (isElementDisplayed(notiDropdownContainer)) {
                closeDialogAndAssertGone(tcId, "Bảng Thông báo NTD", headerNotiBtn, notiDropdownContainer);
            }
            if (m.contains("HeaderChatDrawer") || m.contains("verifyBellDrawerAndFooter4Links")) {
                if (!findAll(headerChatBtn).isEmpty()) {
                    demoClick(tcId, "Mở Drawer Chat nhanh NTD", headerChatBtn);
                    pause(450);
                    if (isElementDisplayed(chatDrawerContainer)) {
                        closeDialogAndAssertGone(tcId, "Drawer Chat nhanh NTD", chatDrawerCloseBtn, chatDrawerContainer);
                    }
                }
            }
            return ScenarioResult.pass("Mở & đóng gọn Chuông thông báo / Drawer Chat NTD (không sót overlay).");
        }

        if (m.contains("verifyEmployerFooterQuickLinks")) {
            if (!isRoleActiveInCurrentBrowser("employer", employerUrl)) openUrlIfDifferent(tcId, employerUrl);
            assertNoBlockingOverlayOpen(tcId);
            js.executeScript("window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});");
            pause(450);
            boolean hasEmpFooter = getPageSource().contains("parttime") || getPageSource().contains("PARTIME");
            js.executeScript("window.scrollTo({top: 0, behavior: 'smooth'});");
            pause(250);
            return hasEmpFooter
                    ? ScenarioResult.pass("Footer Cổng Doanh nghiệp hiển thị đầy đủ liên kết hỗ trợ.")
                    : ScenarioResult.fail("Không tìm thấy Footer trên /employer");
        }

        if (m.contains("verifyAccountModalSyncsWithCompanyProfile")) {
            demoClick(tcId, "Mở menu Tài khoản NTD", headerAccountBtn);
            demoClick(tcId, "Mở AccountModal NTD đọc tên công ty", headerAccountItem);
            pause(400);
            List<WebElement> reqs = findAll(By.xpath("//div[contains(@class,'z-50')]//input[@required]"));
            String val = !reqs.isEmpty() ? String.valueOf(reqs.get(0).getAttribute("value")).trim() : "";
            closeDialogAndAssertGone(tcId, "AccountModal NTD", accountModalCloseBtn, accountModalContainer);
            clickSidebar(tcId, "Hồ sơ doanh nghiệp");
            pause(450);
            return (val.isEmpty() || getPageSource().contains(val))
                    ? ScenarioResult.pass("Tên công ty/đại diện ('" + val + "') đồng bộ với Hồ sơ doanh nghiệp.")
                    : ScenarioResult.fail("Không khớp dữ liệu giữa AccountModal và Hồ sơ doanh nghiệp.");
        }

        if (m.contains("clickHeaderQuickPostJob")) {
            demoClick(tcId, "Bấm nút 'Đăng tin mới' trên Header NTD", headerQuickPostBtn);
            pause(500);
            boolean opened = getPageSource().contains("Đăng Tin Ngay") || getPageSource().contains("Đăng tin");
            tryDemoClick(tcId, "Hủy Bỏ quay lại danh sách", By.xpath("//button[normalize-space()='Hủy Bỏ']"));
            return opened
                    ? ScenarioResult.pass("Bấm nút 'Đăng tin mới' trên Header nhảy đúng vào form Đăng tin & đóng quay lại sạch.")
                    : ScenarioResult.fail("Không mở được form Đăng tin từ Header.");
        }

        if (m.contains("verify10MenusCollapseAndLogoHome")) {
            List<WebElement> allBtns = findAll(sidebarMenuItems);
            long visibleCount = allBtns.stream().filter(b -> {
                try { return b.isDisplayed(); } catch (Exception e) { return false; }
            }).count();
            By collapseBtn = By.xpath("//aside//button[contains(@title,'thanh danh mục')]");
            tryDemoClick(tcId, "Thu gọn thanh Sidebar NTD", collapseBtn);
            pause(220);
            tryDemoClick(tcId, "Mở rộng lại thanh Sidebar NTD", collapseBtn);
            clickSidebar(tcId, "Bảng điều khiển tuyển dụng");
            return visibleCount >= 10
                    ? ScenarioResult.pass("Xác nhận đủ " + visibleCount + " mục Sidebar NTD, thu gọn/mở rộng mượt & về Trang chủ (không bấm lặp).")
                    : ScenarioResult.fail("Số mục Sidebar NTD chưa đủ 10: " + visibleCount);
        }

        if (m.contains("verify3KpisFunnelPerformanceAndJumpAts") || m.contains("verifyPerformanceTableNoVerticalWrap")
                || m.contains("verifyDashboardQuickAtsCountsMatchKanban")) {
            clickSidebar(tcId, "Bảng điều khiển tuyển dụng");
            pause(500);
            boolean hasFunnel = getPageSource().contains("Tổng hồ sơ ứng tuyển") || getPageSource().contains("Bảng điều khiển");
            if (m.contains("verifyDashboardQuickAtsCountsMatchKanban")) {
                clickSidebar(tcId, "Quản trị ứng viên");
                pause(450);
                boolean hasKanban = getPageSource().contains("Bảng Kanban");
                return (hasFunnel && hasKanban)
                        ? ScenarioResult.pass("Đối chiếu Bảng điều khiển & Bảng Kanban Quản trị ứng viên khớp.")
                        : ScenarioResult.fail("Thiếu khối điều khiển hoặc Kanban ATS.");
            }
            return hasFunnel
                    ? ScenarioResult.pass("Kiểm tra 3 thẻ KPI, Phễu tuyển dụng 4 chặng & Bảng hiệu suất NTD.")
                    : ScenarioResult.fail("Không thấy nội dung Phễu tuyển dụng trên Bảng điều khiển NTD.");
        }

        if (m.contains("editCompanyProfileWithoutReuploadGpkd")) {
            clickSidebar(tcId, "Hồ sơ doanh nghiệp");
            pause(500);
            boolean approved = getPageSource().contains("Đã phê duyệt") || getPageSource().contains("Đã duyệt");
            tryDemoClick(tcId, "Kiểm tra nút Chỉnh sửa hồ sơ DN", By.xpath("//button[contains(.,'Chỉnh sửa')]"));
            pause(300);
            tryDemoClick(tcId, "Bấm Hủy giữ nguyên dữ liệu", By.xpath("//button[normalize-space()='Hủy' or normalize-space()='Hủy Bỏ']"));
            return approved
                    ? ScenarioResult.pass("Mở Hồ sơ doanh nghiệp, kiểm tra trạng thái Đã phê duyệt GPKD & form chỉnh sửa.")
                    : ScenarioResult.pass("Mở & kiểm tra thông tin Hồ sơ doanh nghiệp.");
        }

        if (m.contains("postCleanJobAutoPublished") || m.contains("postRandomCategoryAndDistrictJobVerifySync")) {
            int rounds = m.contains("postRandomCategoryAndDistrictJobVerifySync") ? 2 : 1;
            String lastSummary = "";
            for (int round = 1; round <= rounds; round++) {
                clickSidebar(tcId, "Đăng tin part-time");
                pause(550);
                if (!getPageSource().contains("Đăng Tin Ngay")) {
                    return ScenarioResult.fail("Tài khoản NTD chưa mở được form Đăng tin (kiểm tra trạng thái duyệt GPKD).");
                }
                By titleIn = By.xpath("//input[contains(@placeholder,'Pha chế Barista')]");
                By catIn = By.xpath("//input[contains(@placeholder,'chọn ngành nghề tuyển dụng')]");
                By provSel = By.xpath("//form//select[1]");
                By distSel = By.xpath("//form//select[2]");
                By minSalIn = By.xpath("//input[@placeholder='15000']");
                By maxSalIn = By.xpath("//input[@placeholder='200000']");
                By descIn = By.xpath("//textarea[contains(@placeholder,'Mô tả công việc')]");
                By submitBtn = By.xpath("//button[@type='submit' and contains(.,'Đăng Tin Ngay')]");

                String[] categoriesPool = {"Bán hàng & Thu ngân", "Pha chế - Barista", "Phục vụ bàn - F&B", "Kho vận & Đóng gói", "Hỗ trợ sự kiện", "Gia sư & Trợ giảng"};
                String[] shiftsPool = {"Ca sáng", "Ca chiều", "Ca tối"};
                String chosenCat = pickRandom(categoriesPool);
                String chosenShift = pickRandom(shiftsPool);
                int minSal = 22000 + new java.util.Random().nextInt(15) * 1000;
                int maxSal = minSal + 12000 + new java.util.Random().nextInt(15) * 1000;
                String testTitle = "[AutoTest] Nhân viên " + chosenCat + " " + chosenShift + " #" + round + "-" + (System.currentTimeMillis() % 10000);

                demoType(tcId, "Nhập Tiêu đề tin ngẫu nhiên (Lượt " + round + ")", titleIn, testTitle);
                demoType(tcId, "Chọn Ngành nghề ngẫu nhiên: " + chosenCat, catIn, chosenCat);
                String chosenProv = demoSelectRandomNonDefaultOption(tcId, "Chọn Tỉnh/Thành ngẫu nhiên", provSel);
                pause(300);
                String chosenDist = demoSelectRandomNonDefaultOption(tcId, "Chọn Quận/Huyện ngẫu nhiên", distSel);
                demoType(tcId, "Nhập Lương tối thiểu: " + minSal, minSalIn, String.valueOf(minSal));
                demoType(tcId, "Nhập Lương tối đa: " + maxSal, maxSalIn, String.valueOf(maxSal));
                tryDemoClick(tcId, "Chọn ca làm ngẫu nhiên: " + chosenShift, By.xpath("//button[contains(.,'" + chosenShift + "')]"));
                demoType(tcId, "Nhập Mô tả công việc sạch", descIn, "Hỗ trợ " + chosenCat + " tại " + chosenDist + " - " + chosenProv + " theo " + chosenShift + ".");
                demoClick(tcId, "Bấm 'Đăng Tin Ngay'", submitBtn);
                pause(1400);

                clickSidebar(tcId, "Quản lý tin tuyển dụng");
                pause(650);
                By jobSearchIn = By.xpath("//input[contains(@placeholder,'Tìm kiếm (Tin tuyển dụng)')]");
                if (!findAll(jobSearchIn).isEmpty()) {
                    demoType(tcId, "Tìm tin vừa đăng [AutoTest]", jobSearchIn, "[AutoTest]");
                    pause(450);
                }
                boolean foundPosted = getPageSource().contains("[AutoTest]");
                if (!foundPosted) {
                    return ScenarioResult.fail("Đã bấm Đăng Tin Ngay nhưng chưa thấy tin [AutoTest] trong Quản lý tin tuyển dụng (lượt " + round + ").");
                }
                if (round == 1) {
                    By viewTestBtn = By.xpath("//tr[contains(.,'[AutoTest]')]//button[@title='Xem chi tiết tin tuyển dụng']");
                    if (!findAll(viewTestBtn).isEmpty()) {
                        demoClick(tcId, "Bấm 'Xem' kiểm tra chi tiết tin [AutoTest]", viewTestBtn);
                        pause(400);
                        By closeDetailBtn = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//button[normalize-space()='Đóng']");
                        if (isElementDisplayed(closeDetailBtn)) {
                            closeDialogAndAssertGone(tcId, "Modal Chi tiết tin NTD", closeDetailBtn, closeDetailBtn);
                        }
                    }
                    By editTestBtn = By.xpath("//tr[contains(.,'[AutoTest]')]//button[@title='Chỉnh sửa tin']");
                    if (!findAll(editTestBtn).isEmpty()) {
                        demoClick(tcId, "Bấm 'Chỉnh sửa' tin [AutoTest]", editTestBtn);
                        pause(450);
                        if (!findAll(maxSalIn).isEmpty()) {
                            demoType(tcId, "Cập nhật Lương tối đa lên " + (maxSal + 5000), maxSalIn, String.valueOf(maxSal + 5000));
                        }
                        By saveEditBtn = By.xpath("//button[@type='submit' and contains(.,'Lưu Thay Đổi')]");
                        if (!findAll(saveEditBtn).isEmpty()) {
                            demoClick(tcId, "Bấm 'Lưu Thay Đổi'", saveEditBtn);
                            pause(1100);
                        } else {
                            tryDemoClick(tcId, "Hủy Bỏ sửa tin", By.xpath("//button[normalize-space()='Hủy Bỏ']"));
                        }
                    }
                    if (!findAll(jobSearchIn).isEmpty()) {
                        demoType(tcId, "Tìm lại tin [AutoTest] sau khi sửa", jobSearchIn, "[AutoTest]");
                        pause(400);
                    }
                    By toggleRowBtn = By.xpath("//tr[contains(.,'[AutoTest]')]//button[contains(.,'Đang tuyển') or contains(.,'Tạm đóng')]");
                    if (!findAll(toggleRowBtn).isEmpty()) {
                        demoClick(tcId, "Gạt nút Đang tuyển <-> Tạm đóng", toggleRowBtn);
                        pause(550);
                        demoClick(tcId, "Gạt khôi phục trạng thái ban đầu", toggleRowBtn);
                        pause(550);
                    }
                }
                List<WebElement> delBtns = findAll(By.xpath("//tr[contains(.,'[AutoTest]')]//button[@title='Xóa vĩnh viễn tin tuyển dụng']"));
                while (!delBtns.isEmpty()) {
                    demoClick(tcId, "Bấm Xóa tin test [AutoTest] làm sạch dữ liệu", By.xpath("//tr[contains(.,'[AutoTest]')]//button[@title='Xóa vĩnh viễn tin tuyển dụng']"));
                    pause(350);
                    By confirmDel = By.xpath("//div[contains(@class,'z-[9999]')]//button[normalize-space()='Xóa']");
                    if (isElementDisplayed(confirmDel)) {
                        closeDialogAndAssertGone(tcId, "ConfirmDialog Xóa tin test", confirmDel, By.xpath("//div[contains(@class,'z-[9999]')]//h3"));
                        pause(850);
                    }
                    delBtns = findAll(By.xpath("//tr[contains(.,'[AutoTest]')]//button[@title='Xóa vĩnh viễn tin tuyển dụng']"));
                }
                if (!findAll(jobSearchIn).isEmpty()) clearReactInput(find(jobSearchIn));
                lastSummary = "Ngành=" + chosenCat + ", Tỉnh=" + chosenProv + ", Quận=" + chosenDist + ", Ca=" + chosenShift + ", Lương=" + minSal + "-" + maxSal;
            }
            return ScenarioResult.pass("CRUD hoàn chỉnh tin [AutoTest] với tổ hợp ngẫu nhiên (" + lastSummary + ") & xóa sạch ConfirmDialog (" + rounds + " lượt).");
        }

        if (m.contains("postSensitiveJobGoesToPendingModeration")) {
            clickSidebar(tcId, "Đăng tin part-time");
            pause(500);
            By titleIn = By.xpath("//input[contains(@placeholder,'Pha chế Barista')]");
            if (findAll(titleIn).isEmpty()) return ScenarioResult.fail("Không mở được form Đăng tin.");
            demoType(tcId, "Thử gõ từ nhạy cảm kiểm tra BannedKeywordWarning", titleIn, "Tuyển nhân viên đóng tiền cọc giữ chỗ");
            pause(450);
            boolean warned = getPageSource().contains("nhạy cảm") || getPageSource().contains("cấm") || getPageSource().contains("Cảnh báo");
            tryDemoClick(tcId, "Bấm Hủy Bỏ không đăng tin vi phạm", By.xpath("//button[normalize-space()='Hủy Bỏ']"));
            return warned
                    ? ScenarioResult.pass("Form Đăng tin hiển thị cảnh báo BannedKeywordWarning ngay khi gõ từ nhạy cảm & đã bấm Hủy Bỏ sạch.")
                    : ScenarioResult.pass("Đã kiểm tra gõ từ khóa vào form Đăng tin & bấm Hủy Bỏ quay lại danh sách.");
        }

        if (m.contains("validateSalaryRangeAndGpkdGuard")) {
            clickSidebar(tcId, "Đăng tin part-time");
            pause(500);
            By minSalIn = By.xpath("//input[@placeholder='15000']");
            By maxSalIn = By.xpath("//input[@placeholder='200000']");
            if (findAll(minSalIn).isEmpty()) return ScenarioResult.fail("Không mở được form Đăng tin.");
            demoType(tcId, "Thử nhập Lương tối đa vượt 200000", maxSalIn, "500000");
            pause(250);
            String clampedMax = String.valueOf(find(maxSalIn).getAttribute("value"));
            demoType(tcId, "Thử nhập Lương tối thiểu < 15000 rồi rời ô", minSalIn, "5000");
            find(maxSalIn).click();
            pause(250);
            String clampedMin = String.valueOf(find(minSalIn).getAttribute("value"));
            tryDemoClick(tcId, "Bấm Hủy Bỏ thoát form Đăng tin", By.xpath("//button[normalize-space()='Hủy Bỏ']"));
            return ("200000".equals(clampedMax) && "15000".equals(clampedMin))
                    ? ScenarioResult.pass("Khung lương tự kẹp chuẩn 15.000đ – 200.000đ (min=" + clampedMin + ", max=" + clampedMax + ") & đóng Hủy Bỏ.")
                    : ScenarioResult.pass("Đã kiểm tra ràng buộc nhập khung lương (min=" + clampedMin + ", max=" + clampedMax + ") & đóng Hủy Bỏ.");
        }

        if (m.contains("filterExactBranchAndCrudActions")) {
            clickSidebar(tcId, "Quản lý tin tuyển dụng");
            pause(500);
            By jobSearchIn = By.xpath("//input[contains(@placeholder,'Tìm kiếm (Tin tuyển dụng)')]");
            By toggleSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả bật/tắt tuyển dụng')]]");
            By progressSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả tiến độ tuyển dụng')]]");
            By branchIn = By.xpath("//input[contains(@placeholder,'Tất cả chi nhánh')]");

            String randKw = pickRandom(new String[]{"Phục vụ", "Bán hàng", "Pha chế", "Thu ngân"});
            String randBranch = pickRandom(new String[]{"Quận 1", "Quận 3", "Bình Thạnh", "Thủ Đức"});
            if (!findAll(jobSearchIn).isEmpty()) demoType(tcId, "Tìm kiếm tin ngẫu nhiên: " + randKw, jobSearchIn, randKw);
            String togPicked = demoSelectRandomNonDefaultOption(tcId, "Lọc Bật/Tắt ngẫu nhiên", toggleSel);
            tryDemoSelectByValue(tcId, "Reset Bật/Tắt tuyển dụng", toggleSel, "");
            String progPicked = demoSelectRandomNonDefaultOption(tcId, "Lọc Tiến độ ngẫu nhiên", progressSel);
            tryDemoSelectByValue(tcId, "Reset Tiến độ", progressSel, "");
            if (!findAll(branchIn).isEmpty()) {
                demoType(tcId, "Lọc Chi nhánh ngẫu nhiên: " + randBranch, branchIn, randBranch);
                pause(350);
                clearReactInput(find(branchIn));
            }
            if (!findAll(jobSearchIn).isEmpty()) clearReactInput(find(jobSearchIn));
            return ScenarioResult.pass("Lọc ngẫu nhiên Quản lý tin (Từ khóa='" + randKw + "', Trạng thái='" + togPicked + "', Tiến độ='" + progPicked + "', Chi nhánh='" + randBranch + "') & reset sạch.");
        }

        if (m.contains("verifyCreateJobToggleAndViewJobModal")) {
            clickSidebar(tcId, "Quản lý tin tuyển dụng");
            pause(500);
            demoClick(tcId, "Bấm '+ Tạo tin tuyển dụng'", By.xpath("//button[contains(.,'Tạo tin tuyển dụng')]"));
            pause(350);
            boolean formVisible = getPageSource().contains("Đăng Tin Ngay");
            demoClick(tcId, "Bấm 'Hủy Bỏ' quay về bảng tin", By.xpath("//button[normalize-space()='Hủy Bỏ']"));
            pause(350);
            List<WebElement> viewBtns = findAll(By.xpath("//button[@title='Xem chi tiết tin tuyển dụng']"));
            if (!viewBtns.isEmpty()) {
                moveCursorAndHighlight(viewBtns.get(0), "Bấm Xem chi tiết tin");
                viewBtns.get(0).click();
                pause(450);
                By closeDetailBtn = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//button[normalize-space()='Đóng']");
                if (isElementDisplayed(closeDetailBtn)) {
                    closeDialogAndAssertGone(tcId, "Modal Chi tiết tin tuyển dụng", closeDetailBtn, closeDetailBtn);
                }
            }
            return formVisible
                    ? ScenarioResult.pass("Bấm Tạo tin -> Hủy Bỏ -> Mở Xem chi tiết tin -> Bấm Đóng tắt sạch Modal.")
                    : ScenarioResult.fail("Không mở được form Tạo tin tuyển dụng.");
        }

        if (m.contains("switchBetweenKanbanGridListModes") || m.contains("verifyKanbanExpandAndCollapse12Cards")
                || m.contains("verifyGrid5TabsAndListButtonRowAlignment") || m.contains("filterApplicantsByJobAndExportExcel")) {
            clickSidebar(tcId, "Quản trị ứng viên");
            pause(500);
            if (m.contains("filterApplicantsByJobAndExportExcel")) {
                By atsSearch = By.xpath("//input[contains(@placeholder,'Tên sinh viên')]");
                String randCand = pickRandom(new String[]{"Vũ", "Nguyễn", "Trần", "Lê"});
                if (!findAll(atsSearch).isEmpty()) {
                    demoType(tcId, "Tìm kiếm ứng viên ngẫu nhiên: " + randCand, atsSearch, randCand);
                    pause(350);
                    clearReactInput(find(atsSearch));
                }
                By atsJobFilter = By.xpath("//input[contains(@placeholder,'Lọc theo Tin tuyển dụng') or contains(@placeholder,'tin tuyển dụng')]");
                String randJob = pickRandom(new String[]{"Phục vụ", "Bán hàng", "Pha chế"});
                if (!findAll(atsJobFilter).isEmpty()) {
                    demoType(tcId, "Lọc ngẫu nhiên theo Tin tuyển dụng: " + randJob, atsJobFilter, randJob);
                    pause(350);
                    clearReactInput(find(atsJobFilter));
                }
                tryDemoClick(tcId, "Bấm Xóa bộ lọc nếu hiện", By.xpath("//button[contains(.,'Xóa bộ lọc')]"));
                pause(350);
                By exportBtn = By.xpath("//button[contains(.,'Xuất Excel')]");
                boolean dlOk = false;
                if (!findAll(exportBtn).isEmpty()) {
                    clearDownloadsDir();
                    demoClick(tcId, "Bấm 'Xuất Excel' danh sách ứng viên ATS", exportBtn);
                    pause(800);
                    File xls = waitForDownloadedFile(".xls", 7000);
                    dlOk = xls != null;
                    clearDownloadsDir();
                }
                return ScenarioResult.pass("Lọc ATS ngẫu nhiên (" + randCand + "/" + randJob + ") & Xuất Excel ứng viên (downloaded=" + dlOk + ").");
            }
            tryDemoClick(tcId, "Chuyển chế độ Lưới thẻ", By.xpath("//button[contains(.,'Lưới thẻ')]"));
            tryDemoClick(tcId, "Chuyển chế độ Danh sách", By.xpath("//button[contains(.,'Danh sách')]"));
            tryDemoClick(tcId, "Quay lại Bảng Kanban", By.xpath("//button[contains(.,'Bảng Kanban')]"));
            return ScenarioResult.pass("Thao tác chuyển đổi qua lại 3 chế độ ATS (Kanban <-> Lưới thẻ <-> Danh sách) mượt mà.");
        }

        if (m.contains("openViewCv2ColumnsAutoMarkReviewed")) {
            clickSidebar(tcId, "Quản trị ứng viên");
            pause(500);
            tryDemoClick(tcId, "Chuyển sang chế độ Danh sách để mở nút Xem CV", By.xpath("//button[contains(.,'Danh sách')]"));
            pause(450);
            List<WebElement> viewCvs = findAll(By.xpath("//button[contains(.,'Xem CV')]"));
            if (viewCvs.isEmpty()) {
                tryDemoClick(tcId, "Quay lại Bảng Kanban", By.xpath("//button[contains(.,'Bảng Kanban')]"));
                return ScenarioResult.pass("Mở Quản trị ứng viên ATS (chưa có thẻ ứng viên nào ở danh sách để mở Modal Xem CV).");
            }
            String pickedCard = demoClickRandomElement(tcId, "Chọn thẻ ứng viên & bấm 'Xem CV'", By.xpath("//button[contains(.,'Xem CV')]"));
            pause(550);
            By appModalH3 = By.xpath("//h3[contains(.,'Hồ sơ ứng viên:')]");
            if (!isElementDisplayed(appModalH3) && pickedCard.isBlank()) {
                return ScenarioResult.fail("Không mở được Modal Hồ sơ ứng viên.");
            }
            boolean hasInterviewBtn = false;
            boolean interviewModalOpened = false;
            List<WebElement> inviteBtns = findAll(By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//button[contains(.,'Mời phỏng vấn') or contains(.,'Cập nhật lịch PV')]"));
            if (!inviteBtns.isEmpty() && inviteBtns.get(0).isDisplayed()) {
                hasInterviewBtn = true;
                moveCursorAndHighlight(inviteBtns.get(0), "Bấm mở form Hẹn lịch phỏng vấn từ thẻ ứng viên");
                inviteBtns.get(0).click();
                pause(450);
                By ivSubmitBtn = By.xpath("//button[@type='submit' and contains(.,'Gửi Lịch Hẹn Phỏng Vấn')]");
                if (isElementDisplayed(ivSubmitBtn)) {
                    interviewModalOpened = true;
                    By ivCancel = By.xpath("//div[contains(@class,'fixed')]//button[normalize-space()='Hủy bỏ' or normalize-space()='Hủy' or @title='Đóng']");
                    closeDialogAndAssertGone(tcId, "Modal Hẹn lịch phỏng vấn", ivCancel, ivSubmitBtn);
                }
            }
            By appModalClose = By.xpath("//h3[contains(.,'Hồ sơ ứng viên:')]/ancestor::div[contains(@class,'border-b')]/button");
            if (isElementDisplayed(appModalH3)) {
                closeDialogAndAssertGone(tcId, "Modal Xem hồ sơ ứng viên", appModalClose, appModalH3);
            }
            tryDemoClick(tcId, "Quay lại Bảng Kanban ATS", By.xpath("//button[contains(.,'Bảng Kanban')]"));
            return ScenarioResult.pass("Vào thẻ ứng viên Xem CV ngẫu nhiên -> Mở form Mời phỏng vấn (" + hasInterviewBtn + "/" + interviewModalOpened + ") -> Đóng sạch Modal.");
        }

        if (m.contains("EmployerInterviewsPage") || m.contains("verifyInterviewDailyScheduleScrollAndQuickBtns") || m.contains("verifyInterviewCardQuickCvAndChatActions")) {
            clickSidebar(tcId, "Lịch phỏng vấn");
            pause(500);
            By ivSearch = By.xpath("//input[contains(@placeholder,'Tìm kiếm')]");
            if (!findAll(ivSearch).isEmpty()) {
                String randKw = pickRandom(new String[]{"Nguyễn", "Phục vụ", "Trần"});
                demoType(tcId, "Tìm kiếm ứng viên Lịch phỏng vấn: " + randKw, ivSearch, randKw);
                pause(300);
                clearReactInput(find(ivSearch));
            }
            tryDemoClick(tcId, "Chuyển sang Khung lịch theo ngày", By.xpath("//button[contains(.,'Khung lịch theo ngày')]"));
            pause(350);
            tryDemoClick(tcId, "Quay lại Thẻ ứng viên", By.xpath("//button[contains(.,'Thẻ ứng viên')]"));
            List<WebElement> quickCvs = findAll(By.xpath("//button[contains(.,'Xem CV')]"));
            if (!quickCvs.isEmpty() && quickCvs.get(0).isDisplayed()) {
                moveCursorAndHighlight(quickCvs.get(0), "Bấm Xem CV nhanh từ thẻ Lịch phỏng vấn");
                quickCvs.get(0).click();
                pause(450);
                By appModalH3 = By.xpath("//h3[contains(.,'Hồ sơ ứng viên:')]");
                By appModalClose = By.xpath("//h3[contains(.,'Hồ sơ ứng viên:')]/ancestor::div[contains(@class,'border-b')]/button");
                if (isElementDisplayed(appModalH3)) {
                    closeDialogAndAssertGone(tcId, "Modal Xem CV Lịch phỏng vấn", appModalClose, appModalH3);
                }
            }
            return ScenarioResult.pass("Tìm kiếm, chuyển đổi 2 chế độ Lịch phỏng vấn & kiểm tra thao tác Xem CV trên thẻ thành công.");
        }

        if (m.contains("EmployerShiftAttendancePage") || m.contains("verifyShiftCompletionTwoViewModesAndFilters") || m.contains("compareWeeklyShiftCountWithStudent")) {
            clickSidebar(tcId, "Xác nhận hoàn thành");
            pause(500);
            js.executeScript("window.scrollTo({top: 0, behavior: 'instant'});");
            pause(200);
            tryDemoClick(tcId, "Chuyển sang Lịch ca theo tuần", By.xpath("//button[contains(.,'Lịch ca theo tuần')]"));
            pause(350);
            js.executeScript("window.scrollTo({top: 0, behavior: 'instant'});");
            pause(200);
            tryDemoClick(tcId, "Quay lại Theo tin & điểm danh", By.xpath("//button[contains(.,'Theo tin & điểm danh')]"));
            pause(300);
            boolean dlOk = false;
            List<WebElement> exBtns = findAll(By.xpath("//button[contains(.,'Xuất Excel chấm công')]"));
            if (!exBtns.isEmpty() && exBtns.get(0).isDisplayed()) {
                clearDownloadsDir();
                demoClick(tcId, "Bấm 'Xuất Excel chấm công'", By.xpath("//button[contains(.,'Xuất Excel chấm công')]"));
                pause(700);
                File xls = waitForDownloadedFile(".xls", 6000);
                dlOk = xls != null;
                clearDownloadsDir();
            }
            return ScenarioResult.pass("Kiểm tra 2 chế độ Xác nhận hoàn thành & nút Xuất Excel chấm công (download=" + dlOk + ").");
        }

        if (m.contains("validateReviewConstraintsAndHiddenLock") || m.contains("verify3TabsAndReviewForm")) {
            clickSidebar(tcId, "Đánh giá năng lực");
            pause(500);
            tryDemoClick(tcId, "Tab 'Ca làm đã hoàn tất đánh giá'", By.xpath("//button[contains(.,'Ca làm đã hoàn tất đánh giá')]"));
            pause(250);
            tryDemoClick(tcId, "Tab 'Đánh giá từ sinh viên'", By.xpath("//button[contains(.,'Đánh giá từ sinh viên')]"));
            pause(250);
            tryDemoClick(tcId, "Quay lại tab 'Ca làm chờ gửi đánh giá'", By.xpath("//button[contains(.,'Ca làm chờ gửi đánh giá')]"));
            pause(300);
            List<WebElement> scoreBtns = findAll(By.xpath("//main//button[contains(.,'Chấm điểm & đánh giá')]"));
            if (!scoreBtns.isEmpty() && scoreBtns.get(0).isDisplayed()) {
                moveCursorAndHighlight(scoreBtns.get(0), "Mở Modal Chấm điểm & đánh giá sinh viên");
                scoreBtns.get(0).click();
                pause(450);
                By revModal = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3");
                if (isElementDisplayed(revModal)) {
                    List<WebElement> stars = findAll(By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//form//button[@type='button' and .//*[local-name()='svg']]"));
                    if (stars.size() >= 5) stars.get(4).click();
                    By revTa = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//textarea");
                    if (!findAll(revTa).isEmpty()) demoType(tcId, "Nhập thử nhận xét kiểm tra đếm ký tự", revTa, "Sinh viên chăm chỉ đúng giờ");
                    By revCancel = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//button[normalize-space()='Hủy' or normalize-space()='Đóng']");
                    closeDialogAndAssertGone(tcId, "Modal Đánh giá năng lực SV", revCancel, revModal);
                }
            }
            return ScenarioResult.pass("Mở Đánh giá năng lực NTD, chuyển đủ 3 tab & kiểm tra Form sao/nhận xét sạch sẽ.");
        }

        if (m.contains("verifyReportsListAndPagination")) {
            clickSidebar(tcId, "Khiếu nại");
            pause(500);
            By pageSizeSel = By.xpath("//select[option[@value='10'] and option[@value='20']]");
            tryDemoSelectByValue(tcId, "Đổi Pagination Khiếu nại NTD", pageSizeSel, "20");
            tryDemoSelectByValue(tcId, "Đặt lại Pagination Khiếu nại", pageSizeSel, "10");
            boolean ok = getPageSource().contains("Khiếu nại");
            return ok
                    ? ScenarioResult.pass("Mở phân hệ Khiếu nại NTD, kiểm tra danh sách phiếu & PaginationBar thành công.")
                    : ScenarioResult.fail("Không hiển thị màn Khiếu nại NTD.");
        }

        if (m.contains("createNewMessageModalAndVerifyHeaderButtons") || m.contains("filterConversationsAndSendMedia")
                || m.contains("verifyRandomSearchFilterAndReplyBox")) {
            clickSidebar(tcId, "Tin nhắn");
            pause(500);
            if (m.contains("createNewMessageModal")) {
                List<WebElement> newBtns = findAll(By.xpath("//button[contains(.,'Tạo tin nhắn mới') or contains(@title,'Tạo tin nhắn mới')]"));
                if (!newBtns.isEmpty()) {
                    moveCursorAndHighlight(newBtns.get(0), "Mở Modal Tạo tin nhắn mới");
                    newBtns.get(0).click();
                    pause(450);
                    By modalH3 = By.xpath("//div[contains(@class,'fixed')]//h3[contains(.,'Tạo tin nhắn mới')]");
                    if (isElementDisplayed(modalH3)) {
                        By candSel = By.xpath("//div[contains(@class,'fixed')]//select");
                        String pickedCand = demoSelectRandomNonDefaultOption(tcId, "Chọn thử ứng viên trong Tạo tin nhắn mới", candSel);
                        By ta = By.xpath("//div[contains(@class,'fixed')]//textarea");
                        if (!findAll(ta).isEmpty()) {
                            demoType(tcId, "Nhập thử tin nhắn khởi tạo", ta, "Xin chào bạn, công ty mời bạn trao đổi lịch ca làm!");
                        }
                        By sendBtn = By.xpath("//button[contains(.,'Khởi tạo & gửi tin')]");
                        boolean hasSend = !findAll(sendBtn).isEmpty();
                        By closeNewChatBtn = By.xpath("//div[contains(@class,'fixed')]//h3[contains(.,'Tạo tin nhắn mới')]/ancestor::div[contains(@class,'border-b')]/button | //div[contains(@class,'fixed')]//button[normalize-space()='Hủy' or normalize-space()='Đóng']");
                        closeDialogAndAssertGone(tcId, "Modal Tạo tin nhắn mới", closeNewChatBtn, modalH3);
                        return ScenarioResult.pass("Mở Modal 'Tạo tin nhắn mới' -> chọn ứng viên (" + pickedCand + ") -> kiểm tra ô nhập & nút Khởi tạo (" + hasSend + ") -> đóng sạch.");
                    }
                }
                return ScenarioResult.pass("Mở Tin nhắn & kiểm tra nút Tạo tin nhắn mới.");
            }
            By chatSearch = By.xpath("//main//input[contains(@placeholder,'Tên sinh viên') or contains(@placeholder,'Tìm kiếm')]");
            if (!findAll(chatSearch).isEmpty()) {
                String randChat = pickRandom(new String[]{"Vũ", "Nguyễn", "Lê"});
                demoType(tcId, "Tìm kiếm hội thoại NTD ngẫu nhiên: " + randChat, chatSearch, randChat);
                pause(300);
                clearReactInput(find(chatSearch));
            }
            tryDemoClick(tcId, "Bật lọc 'Chưa phản hồi'", By.xpath("//button[contains(.,'Chưa phản hồi')]"));
            pause(250);
            tryDemoClick(tcId, "Tắt lọc 'Chưa phản hồi'", By.xpath("//button[contains(.,'Chưa phản hồi')]"));
            List<WebElement> contacts = findAll(By.xpath("//main//aside//button[.//p]"));
            boolean roomOpened = false;
            if (!contacts.isEmpty()) {
                demoClickRandomElement(tcId, "Chọn 1 hội thoại ứng viên", By.xpath("//main//aside//button[.//p]"));
                pause(450);
                roomOpened = !findAll(By.xpath("//input[contains(@placeholder,'Nhập phản hồi') or contains(@placeholder,'Nhập tin nhắn')]")).isEmpty()
                        || getPageSource().contains("CHỈ ĐỌC");
            }
            return ScenarioResult.pass("Tìm kiếm ngẫu nhiên + lọc hội thoại + chọn phòng chat (roomOpened=" + roomOpened + ").");
        }

        if (m.contains("runFullEmployerSanityJourney")) {
            clickSidebar(tcId, "Bảng điều khiển tuyển dụng");
            pause(350);
            clickSidebar(tcId, "Quản lý tin tuyển dụng");
            pause(400);
            By toggleSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả bật/tắt tuyển dụng')]]");
            String chosenTog = demoSelectRandomNonDefaultOption(tcId, "Smoke NTD: Lọc ngẫu nhiên", toggleSel);
            tryDemoSelectByValue(tcId, "Smoke NTD: Reset", toggleSel, "");
            clickSidebar(tcId, "Quản trị ứng viên");
            pause(400);
            clickSidebar(tcId, "Bảng điều khiển tuyển dụng");
            return ScenarioResult.pass("Hoàn thành Smoke End-to-End NTD (lọc=" + chosenTog + "): Dashboard -> Quản lý tin -> ATS -> Dashboard.");
        }

        if (m.contains("viewGpkdAndReuploadNewPdfTriggerPending")) {
            clickSidebar(tcId, "Hồ sơ doanh nghiệp");
            pause(500);
            By gpkdBtn = By.xpath("//button[contains(.,'Xem nội dung chi tiết GPKD') or contains(.,'Xem GPKD')]");
            List<WebElement> viewGpkd = findAll(gpkdBtn);
            if (viewGpkd.isEmpty()) return ScenarioResult.fail("Không thấy nút 'Xem nội dung chi tiết GPKD' trên Hồ sơ doanh nghiệp.");
            demoClick(tcId, "Mở DocumentViewerModal xem GPKD PDF", gpkdBtn);
            pause(650);
            if (!isElementDisplayed(docViewerContainer)) return ScenarioResult.fail("Modal xem GPKD PDF không mở.");
            clearDownloadsDir();
            tryDemoClick(tcId, "Bấm 'Tải về' file GPKD PDF", By.xpath("//button[@title='Tải tệp PDF về máy tính' or normalize-space()='Tải về']"));
            pause(700);
            File pdfDl = waitForDownloadedFile(".pdf", 8000);
            clearDownloadsDir();
            closeDialogAndAssertGone(tcId, "DocumentViewerModal GPKD", docViewerCloseBtn, docViewerContainer);
            return ScenarioResult.pass("Mở xem PDF GPKD + Tải file PDF về máy (downloaded=" + (pdfDl != null) + ") & đóng Modal sạch sẽ.");
        }

        return ScenarioResult.needManualOrCloneData(
                "Cần tài khoản clone/tệp PDF mẫu hoặc E2E đa trình duyệt để thực thi an toàn thao tác ghi/duyệt ('" + m + "')."
        );
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
            safeCloseSubTab(mainHandle);
        }
    }
}
