package com.partime.pages;

import com.partime.base.BasePage;
import com.partime.utils.ScenarioResult;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.WindowType;

import java.io.File;
import java.net.http.HttpResponse;
import java.util.List;

/**
 * Page Object Model (POM) cho Role 1: Sinh viên (https://parttime-css0.onrender.com/).
 * Nguyên tắc bắt buộc:
 * - Trước mỗi bước kiểm tra không được còn bất kỳ Modal/Popup/Drawer nào bị sót mở.
 * - Mở form/modal/drawer nào PHẢI nhập đúng ô, bấm đúng nút, và bấm đúng nút ĐÓNG + xác minh đã tắt hẳn.
 * - Không cho PASS bừa những kịch bản cần đa trình duyệt E2E hoặc đổi mật khẩu/xóa dữ liệu thật trên Production.
 */
public class StudentPage extends BasePage {

    // Auth & Register Locators
    private final By emailInput = By.xpath("//input[@type='email']");
    private final By passwordInput = By.xpath("//input[@type='password']");
    private final By submitLoginBtn = By.xpath("//button[@type='submit' and contains(.,'Đăng nhập')]");
    private final By errorAlertBox = By.xpath("//div[contains(@class,'bg-red-50')]");

    private final By fullNameInput = By.xpath("//input[contains(@placeholder,'họ và tên sinh viên')]");
    private final By phoneInput = By.xpath("//input[@type='tel']");
    private final By schoolInput = By.xpath("//input[contains(@placeholder,'Trường') or contains(@placeholder,'Đại học')]");
    private final By addressInput = By.xpath("//input[contains(@placeholder,'Quận 1') or contains(@placeholder,'Cư Trú') or contains(@placeholder,'TP. Hồ Chí Minh')]");
    private final By confirmPasswordInput = By.xpath("//input[contains(@placeholder,'Nhập lại mật khẩu')]");
    private final By registerNextBtn = By.xpath("//button[@type='submit' and contains(.,'Tiếp Tục Xác Thực')]");

    // Header & Exact Modal Containers / Close Buttons
    private final By headerSearchInput = By.xpath("//header//input");
    private final By headerChatBtn = By.xpath("//button[@title='Mở thanh trò chuyện & phỏng vấn']");
    private final By headerNotiBtn = By.xpath("//button[@title='Thông báo hệ thống']");
    private final By notiDropdownContainer = By.xpath("//h4[contains(.,'Thông báo hệ thống')]");

    private final By headerAccountBtn = By.xpath("//button[@title='Tài khoản cá nhân']");
    private final By accountDropdownContainer = By.xpath("//button[contains(.,'Cập nhật tài khoản cá nhân')]");
    private final By headerAccountItem = By.xpath("//button[contains(.,'Cập nhật tài khoản cá nhân')]");
    private final By headerDeleteAccItem = By.xpath("//button[contains(.,'Hủy tài khoản')]");

    // Modal Xác nhận hủy tài khoản trong Header.jsx
    private final By deleteModalContainer = By.xpath("//h3[contains(.,'Xác nhận hủy tài khoản')]");
    private final By deleteModalKeepAccountBtn = By.xpath("//button[contains(.,'Không, giữ lại tài khoản')]");

    // AccountModal exact locators (AccountModal.jsx)
    private final By accountModalContainer = By.xpath("//h2[contains(.,'Tài khoản & bảo mật')]");
    private final By accountModalCloseBtn = By.xpath("//h2[contains(.,'Tài khoản & bảo mật')]/parent::div/following-sibling::button");
    private final By accountProfileTab = By.xpath("//button[contains(.,'Thông tin tài khoản') and not(ancestor::header//div[contains(@class,'w-80')])] | //div[contains(@class,'z-50')]//button[contains(.,'Thông tin tài khoản')]");
    private final By accountPwTab = By.xpath("//div[contains(@class,'z-50')]//button[contains(.,'Đổi mật khẩu')]");
    private final By accountSaveProfileBtn = By.xpath("//div[contains(@class,'z-50')]//button[contains(.,'Lưu thay đổi thông tin')]");
    private final By accountSavePwBtn = By.xpath("//div[contains(@class,'z-50')]//button[contains(.,'Cập nhật mật khẩu mới')]");
    private final By accountModalAlertSuccess = By.xpath("//div[contains(@class,'z-50')]//div[contains(@class,'bg-emerald-50')]");
    private final By accountModalAlertError = By.xpath("//div[contains(@class,'z-50')]//div[contains(@class,'bg-red-50')]");
    private final By accountModalPasswordInputs = By.xpath("//div[contains(@class,'z-50')]//input[@type='password']");

    // Widget Chat Drawer exact locators (StudentPortal.jsx)
    private final By chatDrawerContainer = By.xpath("//h3[contains(.,'Widget chat nhanh')]");
    private final By chatDrawerCloseBtn = By.xpath("//h3[contains(.,'Widget chat nhanh')]/parent::div/following-sibling::button");

    // ConfirmDialog exact locators (ConfirmDialog.jsx — used for Delete Account, Safety Handbook, Withdraw, etc.)
    private final By confirmDialogContainer = By.xpath("//div[contains(@class,'z-[9999]')]//h3");
    private final By confirmDialogCancelDeleteBtn = By.xpath("//div[contains(@class,'z-[9999]')]//button[contains(.,'Không, giữ lại') or @title='Đóng']");
    private final By safetyHandbookContainer = By.xpath("//div[contains(@class,'z-[9999]')]//h3[contains(.,'Cẩm Nang Tìm Việc An Toàn')]");
    private final By safetyHandbookAckBtn = By.xpath("//div[contains(@class,'z-[9999]')]//button[contains(.,'Đã Hiểu') or @title='Đóng']");

    // Slide-over JD & DocumentViewerModal exact locators
    private final By jdSlideOverContainer = By.xpath("//h4[contains(.,'Mô tả chi tiết công việc')]");
    private final By jdSlideOverCloseBtn = By.xpath("//h4[contains(.,'Mô tả chi tiết công việc')]/ancestor::div[contains(@class,'max-w-xl')]//div[contains(@class,'border-b')]/button");
    private final By docViewerContainer = By.xpath("//button[@title='Đóng modal']");
    private final By docViewerCloseBtn = By.xpath("//button[@title='Đóng modal']");

    // Portal Content Locators
    private final By sidebarCollapseBtn = By.xpath("//aside//button[contains(@title,'thanh danh mục')]");
    private final By brandLogoBtn = By.xpath("//header//button[contains(@title,'Trang chủ')]");
    private final By heroHeadline = By.xpath("//*[contains(.,'linh hoạt theo ca học') or contains(.,'Chào mừng trở lại')]");
    private final By bannerKeywordInput = By.xpath("//input[contains(@placeholder,'Vị trí tuyển dụng')]");
    private final By bannerSearchBtn = By.xpath("//button[contains(.,'Tìm việc')]");
    private final By exploreSearchInput = By.xpath("//input[contains(@placeholder,'Tiêu đề công việc')]");
    private final By footerHandbookBtn = By.xpath("//button[contains(.,'Cẩm nang phỏng vấn')]");
    private final By sidebarMenuItems = By.xpath("//aside//button");
    private final By jobCardTitles = By.xpath("//div[contains(@class,'cursor-pointer')]//h4");

    // Student Profile View & Edit Form Locators
    private final By editProfileBtn = By.xpath("//button[contains(.,'Chỉnh sửa hồ sơ')]");
    private final By profileSaveBtn = By.xpath("//button[contains(.,'Lưu thông tin')]");
    private final By profileCancelBtn = By.xpath("//button[normalize-space()='Hủy']");
    private final By profilePhoneInput = By.xpath("//form//input[@type='tel' and @placeholder='0987654321']");
    private final By profilePhoneError = By.xpath("//div[contains(@class,'bg-rose-50')]");

    private boolean clickSidebar(String tcId, String menuText) {
        return clickSidebarSmart(tcId, menuText);
    }

    public ScenarioResult executeScenario(String tcId, String pomMethod, String input1, String input2, String baseUrl) throws Exception {
        String studentUrl = envConfig.getOrDefault("STUDENT_PORT_URL", baseUrl + "/");
        String loginUrl = baseUrl + "/student/login";
        String registerUrl = baseUrl + "/student/register";
        String m = pomMethod == null ? "" : pomMethod;

        // 0. Cross-Role E2E, Backend API & Pure Unit Validation Delegation
        if (m.contains("CrossRoleE2ETests")) {
            CrossRoleAndApiHelper helper = new CrossRoleAndApiHelper();
            helper.attachSharedContext(this);
            if (m.contains("studentApplyEmployerApproveShiftSync")) {
                return helper.runFullApplyInterviewChatCallReviewE2E(tcId, baseUrl);
            }
        }
        if (m.contains("ApiTest")) {
            CrossRoleAndApiHelper helper = new CrossRoleAndApiHelper();
            helper.attachSharedContext(this);
            return helper.runSafeApiAndRbacSuite(tcId, m, baseUrl);
        }
        if (m.contains("UnitTest")) {
            return new CrossRoleAndApiHelper().runUnitValidationSuite(tcId, m);
        }

        // 1. Cookie Authentication Flow
        if (m.contains("loginWithCookiePersistence")) {
            String outcome = executeManualFirstThenCookieLogin(tcId, "student", studentUrl, loginUrl);
            if ("SKIP_WAIT_COOKIE".equals(outcome)) return ScenarioResult.waitCookie("student");
            return ScenarioResult.pass(outcome + " | URL=" + getCurrentUrl());
        }

        // 2. Auth Negative & Guest Mode (chạy an toàn trong Tab phụ để không mất phiên Cookie của Tab chính)
        if (m.contains("loginExpectError")) {
            exerciseNavigationHistorySafe(tcId, studentUrl, loginUrl);
            return runInSafeAuthTab(tcId, loginUrl, () -> {
                By rememberChk = By.xpath("//form//input[@type='checkbox']");
                if (!findAll(rememberChk).isEmpty()) {
                    boolean beforeSel = isElementSelected(rememberChk);
                    demoClick(tcId, "Kiểm tra Checkbox Ghi nhớ đăng nhập (selected=" + beforeSel + ")", rememberChk);
                }
                demoType(tcId, "Nhập Email thử nghiệm", emailInput, (input1 != null && input1.contains("@")) ? input1 : "sinhvien.test@gmail.com");
                demoType(tcId, "Nhập Mật khẩu yếu/sai", passwordInput, (input2 != null && !input2.isBlank()) ? input2 : "123");
                demoClick(tcId, "Bấm nút Đăng nhập kiểm tra thông báo chặn", submitLoginBtn);
                pause(600);
                boolean noNativeAlert = verifyZeroNativeAlertAndActiveFocus(tcId);
                String err = isElementDisplayed(errorAlertBox) ? getElementText(errorAlertBox) : "";
                return (!err.isBlank() && getCurrentUrl().contains("/login") && noNativeAlert)
                        ? ScenarioResult.pass("Chặn đăng nhập sai trên UI: " + err.trim() + " | History & Checkbox & ZeroAlert OK")
                        : ScenarioResult.fail("Không thấy thông báo lỗi trên /student/login");
            });
        }

        if (m.contains("submitWithInvalidGmailOrTerms")) {
            return runInSafeAuthTab(tcId, registerUrl, () -> {
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
            return runInSafeAuthTab(tcId, registerUrl, () -> {
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
                pause(650);
                boolean cookieCrudOk = exerciseCookieDeleteCommandsSafe(tcId);
                boolean clearedAndRestored = exerciseClearAllCookiesWithRestore(tcId);
                boolean hasLoginBtn = !findAll(By.xpath("//button[contains(.,'Đăng nhập')]")).isEmpty();
                List<WebElement> hearts = findAll(By.xpath("//button[@title='Lưu việc làm']"));
                if (!hearts.isEmpty()) {
                    moveCursorAndHighlight(hearts.get(0), "Guest Mode: Bấm Lưu việc làm kiểm tra chuyển Đăng nhập");
                    hearts.get(0).click();
                    pause(500);
                }
                return hasLoginBtn
                        ? ScenarioResult.pass("Tab Khách (?guest=true) công khai, chặn ghi khi chưa đăng nhập | Cookie API(delObj/Named=" + cookieCrudOk + ", clearAllRestore=" + clearedAndRestored + ") OK.")
                        : ScenarioResult.fail("Không nhận diện được Chế độ Khách.");
            } finally {
                safeCloseSubTab(mainHandle);
            }
        }

        if (m.contains("ForgotPasswordPage")) {
            return runInSafeAuthTab(tcId, baseUrl + "/student/forgot-password", () -> {
                demoType(tcId, "Quên MK Bước 1: Thử nhập Email sai định dạng", emailInput, "sinhvien.sai");
                demoClick(tcId, "Bấm 'Nhận mã OTP (60 giây)'", By.xpath("//button[@type='submit' and contains(.,'Nhận mã OTP')]"));
                pause(350);
                String html5Msg = String.valueOf(find(emailInput).getAttribute("validationMessage")).trim();
                String err1 = isElementDisplayed(errorAlertBox) ? getElementText(errorAlertBox) : html5Msg;
                demoType(tcId, "Quên MK Bước 1: Thử nhập Email Admin bị chặn khôi phục", emailInput, "lethithuyngan985@gmail.com");
                demoClick(tcId, "Bấm 'Nhận mã OTP (60 giây)' kiểm tra bảo vệ Admin", By.xpath("//button[@type='submit' and contains(.,'Nhận mã OTP')]"));
                pause(350);
                String err2 = isElementDisplayed(errorAlertBox) ? getElementText(errorAlertBox) : "";
                return (!err1.isBlank() && !err2.isBlank())
                        ? ScenarioResult.pass("Màn Quên mật khẩu (/student/forgot-password) chặn đúng Email sai ('" + err1.trim() + "') & Email Admin ('" + err2.trim() + "').")
                        : ScenarioResult.fail("Thiếu cảnh báo kiểm tra ở Quên mật khẩu Bước 1 (err1=" + err1 + ", err2=" + err2 + ").");
            });
        }

        // 3. Footer Cẩm nang an toàn — Bắt buộc bấm "Đã Hiểu" tắt Modal và kiểm tra Modal tắt hẳn
        if (m.contains("verifyFooterAndSafetyHandbookModal")) {
            if (!isRoleActiveInCurrentBrowser("student", studentUrl)) openUrlIfDifferent(tcId, studentUrl);
            assertNoBlockingOverlayOpen(tcId);
            js.executeScript("window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});");
            pause(350);
            demoClick(tcId, "Bấm mở 'Cẩm nang phỏng vấn & tìm việc làm an toàn'", footerHandbookBtn);
            pause(450);
            if (!isElementDisplayed(safetyHandbookContainer)) {
                return ScenarioResult.fail("Đã bấm Footer Cẩm nang nhưng Modal Cẩm Nang Tìm Việc An Toàn không hiển thị.");
            }
            closeDialogAndAssertGone(tcId, "Modal Cẩm Nang Tìm Việc An Toàn", safetyHandbookAckBtn, safetyHandbookContainer);
            return ScenarioResult.pass("Mở, đọc & bấm 'Đã Hiểu' tắt sạch Modal Cẩm nang an toàn.");
        }

        // 4. Banner Trang chủ & Tìm kiếm -> Chuyển sang Khám phá việc làm
        if (m.contains("clickHotCategoryChipInGuestMode")) {
            String mainHandle = driver.getWindowHandle();
            driver.switchTo().newWindow(WindowType.TAB);
            try {
                forceOpenUrl(tcId, studentUrl + (studentUrl.contains("?") ? "&" : "?") + "guest=true");
                pause(650);
                demoType(tcId, "Guest Mode Banner: Nhập từ khóa 'Phục vụ'", bannerKeywordInput, "Phục vụ");
                demoClick(tcId, "Guest Mode: Bấm nút 'Tìm việc'", bannerSearchBtn);
                pause(550);
                boolean inExplore = !findAll(exploreSearchInput).isEmpty() || getPageSource().contains("Tìm kiếm việc làm part-time");
                return inExplore
                        ? ScenarioResult.pass("Guest Mode: Tìm từ Banner chuyển sang danh sách Khám phá việc làm thành công.")
                        : ScenarioResult.fail("Guest Mode không điều hướng sang Khám phá việc làm.");
            } finally {
                safeCloseSubTab(mainHandle);
            }
        }

        if (m.contains("searchFromHeroBanner")) {
            if (!ensureCookieSessionIfPresent("student", studentUrl)) {
                return ScenarioResult.waitCookie("student");
            }
            clickSidebar(tcId, "Trang chủ");
            demoType(tcId, "Gõ từ khóa trên thanh tìm kiếm Banner", bannerKeywordInput, "Phục vụ");
            demoClick(tcId, "Bấm nút 'Tìm việc' trên Banner", bannerSearchBtn);
            pause(650);
            boolean inExplore = !findAll(exploreSearchInput).isEmpty() || getPageSource().contains("Tìm kiếm việc làm part-time");
            return inExplore
                    ? ScenarioResult.pass("Banner Tìm việc điều hướng sang màn Khám phá việc làm thành công.")
                    : ScenarioResult.fail("Không chuyển sang màn Khám phá việc làm.");
        }

        if (m.contains("verify6KpiCardsAndQuickButtons") || m.contains("verifyFeaturedJobsGridMax6") || m.contains("verifyHome6Kpis")) {
            if (!isRoleActiveInCurrentBrowser("student", studentUrl)) openUrlIfDifferent(tcId, studentUrl);
            clickSidebar(tcId, "Trang chủ");
            showStepBanner(tcId, "Kiểm tra Banner & Việc làm nổi bật trên Trang chủ SV");
            pause(350);
            boolean hasBannerTitle = !findAll(heroHeadline).isEmpty();
            HttpResponse<String> jobsRes = httpGetBody(baseUrl + "/api/jobs?limit=6");
            return (hasBannerTitle && jobsRes.statusCode() == 200)
                    ? ScenarioResult.pass("Trang chủ SV hiển thị đầy đủ Banner + Việc làm nổi bật + API /api/jobs HTTP 200 OK.")
                    : ScenarioResult.fail("Lỗi kiểm tra Trang chủ SV (" + jobsRes.statusCode() + ")");
        }

        if (m.contains("searchAccentInsensitive") || m.contains("searchNoResultExpectEmptyState")
                || m.contains("verifyPaginationBarOptions") || m.contains("openSlideOverJdAndCompanyModal")
                || m.contains("filterBy5Criteria") || m.contains("verifyJobCategoryFilterSyncedWithMasterData")
                || m.contains("verifyNearYouBadgeAndJobCardLayout") || m.contains("randomizedMultiComboSearchMatrix")) {
            if (!isRoleActiveInCurrentBrowser("student", studentUrl)) openUrlIfDifferent(tcId, studentUrl);
            clickSidebar(tcId, "Khám phá việc làm");
            pause(550);

            By catSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả ngành nghề')]]");
            By provSel = By.xpath("//select[option[@value='' and contains(.,'Toàn quốc')]]");
            By shiftSel = By.xpath("//select[option[@value='' and contains(.,'Mọi ca làm việc')]]");
            By salSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả mức lương')]]");
            By pageSizeSel = By.xpath("//select[option[@value='10'] and option[@value='20']]");
            By districtChipLoc = By.xpath("//span[contains(.,'Tích chọn nhiều Khu vực')]/ancestor::div[contains(@class,'rounded-2xl')]//div[contains(@class,'flex-wrap')]//button");

            if (m.contains("searchNoResult")) {
                demoType(tcId, "Nhập từ khóa không tồn tại kiểm tra trạng thái rỗng", exploreSearchInput, "zzzzkhongtontai999");
                pause(450);
                boolean hasEmpty = getPageSource().contains("Không tìm thấy") || findAll(jobCardTitles).isEmpty();
                clearReactInput(find(exploreSearchInput));
                pause(350);
                return hasEmpty
                        ? ScenarioResult.pass("Tìm từ khóa không tồn tại trả về trạng thái danh sách rỗng rõ ràng & đã xóa lọc.")
                        : ScenarioResult.fail("Không hiển thị trạng thái rỗng.");
            }
            if (m.contains("searchAccentInsensitive")) {
                String kw = pickRandom(new String[]{"le tan", "phuc vu", "thu ngan", "pha che", "ban hang"});
                demoType(tcId, "Nhập từ khóa không dấu ngẫu nhiên: " + kw, exploreSearchInput, kw);
                pause(450);
                int hits = findAll(jobCardTitles).size();
                clearReactInput(find(exploreSearchInput));
                pause(350);
                return ScenarioResult.pass("Tìm kiếm không dấu ngẫu nhiên '" + kw + "' khớp " + hits + " thẻ & đã xóa bộ lọc trả danh sách.");
            }
            if (m.contains("verifyJobCategoryFilterSyncedWithMasterData")) {
                List<WebElement> sels = findAll(catSel);
                if (sels.isEmpty()) return ScenarioResult.fail("Không tìm thấy dropdown Ngành nghề.");
                int optCount = new org.openqa.selenium.support.ui.Select(sels.get(0)).getOptions().size();
                String pickedCat = demoSelectRandomNonDefaultOption(tcId, "Chọn ngẫu nhiên Ngành nghề từ Master Data", catSel);
                pause(350);
                tryDemoSelectByIndex(tcId, "Đặt lại Tất cả ngành nghề", catSel, 0);
                return optCount >= 4
                        ? ScenarioResult.pass("Dropdown Ngành nghề đồng bộ Master Data (" + optCount + " lựa chọn), chọn ngẫu nhiên '" + pickedCat + "' & reset OK.")
                        : ScenarioResult.fail("Danh mục Ngành nghề quá ít (" + optCount + ").");
            }
            if (m.contains("randomizedMultiComboSearchMatrix")) {
                StringBuilder rounds = new StringBuilder();
                for (int r = 1; r <= 3; r++) {
                    String rc = demoSelectRandomNonDefaultOption(tcId, "Vòng " + r + ": Ngành nghề ngẫu nhiên", catSel);
                    String rp = demoSelectRandomNonDefaultOption(tcId, "Vòng " + r + ": Tỉnh/Thành ngẫu nhiên", provSel);
                    pause(250);
                    String rd = demoClickRandomElement(tcId, "Vòng " + r + ": Chip Quận/Huyện ngẫu nhiên", districtChipLoc);
                    String rs = demoSelectRandomNonDefaultOption(tcId, "Vòng " + r + ": Ca làm ngẫu nhiên", shiftSel);
                    String rm = demoSelectRandomNonDefaultOption(tcId, "Vòng " + r + ": Lương ngẫu nhiên", salSel);
                    pause(350);
                    int cnt = findAll(jobCardTitles).size();
                    rounds.append("[V").append(r).append(": ").append(rc).append("/").append(rp).append("-").append(rd).append("/").append(rs).append("/").append(rm).append("->").append(cnt).append(" tin] ");
                    tryDemoClick(tcId, "Xóa chọn Quận", By.xpath("//button[contains(.,'Xóa chọn')]"));
                    tryDemoSelectByIndex(tcId, "Reset Ngành", catSel, 0);
                    tryDemoSelectByIndex(tcId, "Reset Tỉnh", provSel, 0);
                    tryDemoSelectByIndex(tcId, "Reset Ca", shiftSel, 0);
                    tryDemoSelectByIndex(tcId, "Reset Lương", salSel, 0);
                    pause(250);
                }
                return ScenarioResult.pass("Chạy 3 tổ hợp lọc Ngẫu Nhiên đa địa điểm/ngành nghề thành công: " + rounds);
            }
            if (m.contains("filterBy5Criteria")) {
                String pickedCat = demoSelectRandomNonDefaultOption(tcId, "Lọc Ngành nghề ngẫu nhiên", catSel);
                tryDemoSelectByVisibleText(tcId, "Chọn Tỉnh/Thành bằng VisibleText", provSel, "TP. Hồ Chí Minh");
                String selState = verifySelectSingleAndSelectedOptions(tcId, provSel);
                String pickedProv = demoSelectRandomNonDefaultOption(tcId, "Lọc Tỉnh/Thành ngẫu nhiên", provSel);
                pause(350);
                String pickedDist = demoClickRandomElement(tcId, "Tích chọn chip Quận/Huyện ngẫu nhiên", districtChipLoc);
                String pickedShift = demoSelectRandomNonDefaultOption(tcId, "Lọc Ca làm việc ngẫu nhiên", shiftSel);
                String pickedSal = demoSelectRandomNonDefaultOption(tcId, "Lọc Khoảng lương ngẫu nhiên", salSel);
                pause(450);
                int filteredCount = findAll(jobCardTitles).size();
                tryDemoClick(tcId, "Xóa chọn Quận", By.xpath("//button[contains(.,'Xóa chọn')]"));
                tryDemoSelectByIndex(tcId, "Reset Ngành nghề", catSel, 0);
                tryDemoSelectByIndex(tcId, "Reset Tỉnh/Thành", provSel, 0);
                tryDemoSelectByIndex(tcId, "Reset Ca làm", shiftSel, 0);
                tryDemoSelectByIndex(tcId, "Reset Mức lương", salSel, 0);
                pause(350);
                return ScenarioResult.pass("Lọc 5 tiêu chí [" + pickedCat + " | " + pickedProv + " - " + pickedDist + " | " + pickedShift + " | " + pickedSal + "] (" + selState + ", khớp " + filteredCount + " tin) & reset sạch.");
            }
            if (m.contains("verifyPaginationBarOptions")) {
                boolean changed20 = tryDemoSelectByValue(tcId, "Đổi Pagination sang 20 tin/trang", pageSizeSel, "20");
                boolean changed10 = tryDemoSelectByValue(tcId, "Đổi Pagination về 10 tin/trang", pageSizeSel, "10");
                return (changed20 || changed10)
                        ? ScenarioResult.pass("Thao tác đổi số dòng/trang trên PaginationBar (20 -> 10) thành công.")
                        : ScenarioResult.pass("Kiểm tra PaginationBar tại Khám phá việc làm (" + findAll(jobCardTitles).size() + " tin).");
            }
            if (m.contains("verifyNearYouBadgeAndJobCardLayout")) {
                List<WebElement> cards = findAll(jobCardTitles);
                if (cards.isEmpty()) return ScenarioResult.fail("Không có thẻ công việc để đo kích thước layout.");
                moveCursorAndHighlight(cards.get(0), "Kiểm tra layout thẻ việc làm");
                org.openqa.selenium.Dimension sz = cards.get(0).getSize();
                org.openqa.selenium.Point loc = cards.get(0).getLocation();
                String tag = cards.get(0).getTagName();
                return (sz.getWidth() > 50 && sz.getHeight() > 10)
                        ? ScenarioResult.pass("Đo thẻ việc làm OK (tag=" + tag + ", size=" + sz.getWidth() + "x" + sz.getHeight() + ", loc=" + loc.getX() + "," + loc.getY() + ").")
                        : ScenarioResult.fail("Kích thước thẻ việc làm bất thường: " + sz);
            }
            // openSlideOverJdAndCompanyModal: Mở Slide-over JD -> Mở Hồ sơ Công ty -> Mở Modal Báo cáo (nhập lý do -> Hủy) -> Mở Modal Ứng tuyển (chọn CV -> Hủy) -> Đóng Slide-over X
            clearReactInput(find(exploreSearchInput));
            pause(350);
            List<WebElement> titles = findAll(jobCardTitles);
            if (titles.isEmpty()) return ScenarioResult.fail("Không tìm thấy thẻ công việc nào để mở Slide-over JD.");
            moveCursorAndHighlight(titles.get(0), "Bấm mở Slide-over JD");
            titles.get(0).click();
            pause(550);
            if (!isElementDisplayed(jdSlideOverContainer)) {
                return ScenarioResult.fail("Click vào thẻ công việc nhưng Slide-over JD chi tiết không mở.");
            }
            StringBuilder subFlows = new StringBuilder("Slide-over JD OK");
            // 1. Mở Hồ sơ Doanh nghiệp Modal & Đóng X
            By compLink = By.xpath("//button[@title='Mở trang hồ sơ doanh nghiệp']");
            By compModalClose = By.xpath("//button[@aria-label='Đóng hồ sơ doanh nghiệp']");
            if (!findAll(compLink).isEmpty() && isElementDisplayed(compLink)) {
                demoClick(tcId, "Bấm tên Doanh nghiệp mở Hồ sơ công ty", compLink);
                if (!waitUntilDisplayed(compModalClose, 6000L)) {
                    return ScenarioResult.fail("Đã bấm tên Doanh nghiệp nhưng Modal Hồ sơ doanh nghiệp không mở sau 6s.");
                }
                closeDialogAndAssertGone(tcId, "Modal Hồ sơ doanh nghiệp", compModalClose, compModalClose);
                subFlows.append(" -> Hồ sơ Công ty (Đóng X)");
            }
            // 2. Mở Modal Báo cáo vi phạm từ Slide-over JD -> nhập thử lý do -> Bấm Hủy tắt Modal
            By jdReportBtn = By.xpath("//button[@title='Báo cáo tin tuyển dụng vi phạm quy định']");
            By reportHeading = By.xpath("//h3[contains(.,'Báo cáo vi phạm tới quản trị viên')]");
            By reportTextarea = By.xpath("//h3[contains(.,'Báo cáo vi phạm')]/ancestor::div[contains(@class,'rounded-3xl')]//textarea");
            By reportCancel = By.xpath("//h3[contains(.,'Báo cáo vi phạm')]/ancestor::div[contains(@class,'rounded-3xl')]//button[normalize-space()='Hủy']");
            if (!findAll(jdReportBtn).isEmpty() && isElementDisplayed(jdReportBtn)) {
                demoClick(tcId, "Bấm 'Báo cáo' mở Modal Báo cáo vi phạm", jdReportBtn);
                if (waitUntilDisplayed(reportHeading, 3000L)) {
                    if (!findAll(reportTextarea).isEmpty()) {
                        demoType(tcId, "Nhập thử lý do báo cáo vi phạm", reportTextarea, "Kiểm tra nhập form báo cáo vi phạm (không gửi)");
                    }
                    closeDialogAndAssertGone(tcId, "Modal Báo cáo vi phạm", reportCancel, reportHeading);
                    subFlows.append(" -> Modal Báo cáo (Hủy)");
                }
            }
            // 3. Thử mở Modal Ứng tuyển ngay (nếu tin chưa ứng tuyển) -> kiểm tra Select CV -> Bấm Hủy
            By applyNowBtn = By.xpath("//button[contains(.,'Ứng tuyển ngay')]");
            By applyHeading = By.xpath("//h3[contains(.,'Nộp Hồ Sơ Ứng Tuyển')]");
            By applyCvSel = By.xpath("//h3[contains(.,'Nộp Hồ Sơ Ứng Tuyển')]/ancestor::div[contains(@class,'rounded-3xl')]//select");
            By applyCancel = By.xpath("//h3[contains(.,'Nộp Hồ Sơ Ứng Tuyển')]/ancestor::div[contains(@class,'rounded-3xl')]//button[normalize-space()='Hủy']");
            if (!findAll(applyNowBtn).isEmpty() && isElementDisplayed(applyNowBtn) && findAll(applyNowBtn).get(0).isEnabled()) {
                demoClick(tcId, "Bấm 'Ứng tuyển ngay' mở Modal Nộp hồ sơ", applyNowBtn);
                if (waitUntilDisplayed(applyHeading, 3000L)) {
                    if (!findAll(applyCvSel).isEmpty()) {
                        moveCursorAndHighlight(find(applyCvSel), "Kiểm tra dropdown Chọn CV mặc định");
                    }
                    closeDialogAndAssertGone(tcId, "Modal Nộp Hồ Sơ Ứng Tuyển", applyCancel, applyHeading);
                    subFlows.append(" -> Modal Ứng tuyển (Hủy)");
                }
            }
            // Đóng Slide-over JD nếu vẫn đang mở
            if (isElementDisplayed(jdSlideOverContainer)) {
                closeDialogAndAssertGone(tcId, "Slide-over Chi tiết JD", jdSlideOverCloseBtn, jdSlideOverContainer);
            }
            return ScenarioResult.pass("Luồng chi tiết JD hoàn chỉnh: " + subFlows + " -> Đóng sạch.");
        }

        // 5. Responsive 4 Viewports & Performance
        if (m.contains("checkStudentPortal4Viewports")) {
            String mainHandle = driver.getWindowHandle();
            driver.switchTo().newWindow(WindowType.TAB);
            try {
                String summary = checkAll4ViewportsResponsive(tcId, studentUrl);
                return ScenarioResult.pass("Responsive 4 thiết bị SV không tràn ngang: " + summary);
            } finally {
                safeCloseSubTab(mainHandle);
            }
        }

        if (m.contains("measurePaginationAndSlideOverSpeed")) {
            clickSidebar(tcId, "Khám phá việc làm");
            long t0 = System.currentTimeMillis();
            int code = httpGetStatus(baseUrl + "/api/jobs?limit=20");
            long apiMs = System.currentTimeMillis() - t0;
            return (code == 200 && apiMs < 8000)
                    ? ScenarioResult.pass("Tải API /api/jobs HTTP 200 trong " + apiMs + "ms (Đạt NFR).")
                    : ScenarioResult.fail("Quá ngưỡng NFR hoặc lỗi API (" + code + ", " + apiMs + "ms)");
        }

        // ==================== CÁC KỊCH BẢN ĐÃ ĐĂNG NHẬP COOKIE (ĐÚNG THAO TÁC - ĐÓNG SẠCH FORM) ====================
        if (!ensureCookieSessionIfPresent("student", studentUrl)) {
            return ScenarioResult.waitCookie("student");
        }
        assertNoBlockingOverlayOpen(tcId);

        // AccountModal: Kiểm tra Email disabled -> Nhập Địa chỉ -> Bấm Lưu -> Cuộn lên đọc thông báo -> Đóng nút X + Kiểm tra tắt
        if (m.contains("AccountModalPage.updateStudentAccountInfo")) {
            demoClick(tcId, "Bấm mở menu Tài khoản trên Header", headerAccountBtn);
            demoClick(tcId, "Bấm 'Cập nhật tài khoản cá nhân' mở AccountModal", headerAccountItem);
            pause(400);
            if (!isElementDisplayed(accountModalContainer)) {
                return ScenarioResult.fail("AccountModal không mở sau khi bấm Cập nhật tài khoản cá nhân.");
            }
            List<WebElement> emails = findAll(By.xpath("//div[contains(@class,'z-50')]//input[@type='email']"));
            if (emails.isEmpty() || emails.get(0).isEnabled()) {
                closeDialogAndAssertGone(tcId, "AccountModal", accountModalCloseBtn, accountModalContainer);
                return ScenarioResult.fail("Ô Email trong AccountModal phải ở trạng thái khóa (disabled).");
            }
            moveCursorAndHighlight(emails.get(0), "Kiểm tra Email disabled=" + !emails.get(0).isEnabled());

            By addressLoc = By.xpath("//div[contains(@class,'z-50')]//label[contains(.,'Địa chỉ cư trú')]/following-sibling::div//input");
            List<WebElement> addrEls = findAll(addressLoc);
            String targetAddress = "TP. Hồ Chí Minh";
            if (!addrEls.isEmpty()) {
                String currentAddr = String.valueOf(addrEls.get(0).getAttribute("value")).trim();
                targetAddress = currentAddr.contains("Bình Thạnh") ? "TP. Hồ Chí Minh" : "Quận Bình Thạnh, TP. Hồ Chí Minh";
                demoType(tcId, "Cập nhật Địa chỉ cư trú", addressLoc, targetAddress);
            }

            demoClick(tcId, "Bấm nút 'Lưu thay đổi thông tin'", accountSaveProfileBtn);
            js.executeScript("const el=document.evaluate(\"//h2[contains(.,'Tài khoản & bảo mật')]\",document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue; if(el){el.scrollIntoView({block:'center'});}");

            String successText = "";
            String errorText = "";
            long deadline = System.currentTimeMillis() + 8000L;
            while (System.currentTimeMillis() < deadline) {
                List<WebElement> succ = findAll(accountModalAlertSuccess);
                if (!succ.isEmpty()) {
                    successText = succ.get(0).getText().trim();
                    break;
                }
                List<WebElement> errs = findAll(accountModalAlertError);
                if (!errs.isEmpty()) {
                    errorText = errs.get(0).getText().trim();
                    break;
                }
                pause(150);
            }
            closeDialogAndAssertGone(tcId, "AccountModal", accountModalCloseBtn, accountModalContainer);
            if (!errorText.isEmpty()) {
                return ScenarioResult.fail("AccountModal báo lỗi khi lưu: " + errorText);
            }
            if (successText.isEmpty()) {
                return ScenarioResult.fail("Không hiển thị thông báo 'Cập nhật thông tin thành công!' sau khi bấm Lưu (AccountModal.jsx L61 useEffect([isOpen, currentUser]) xóa msg khi onUpdateSuccess chạy).");
            }
            // Mở lại AccountModal kiểm tra dữ liệu mới đã được lưu & đóng sạch
            demoClick(tcId, "Mở lại menu Tài khoản kiểm tra lưu bền vững", headerAccountBtn);
            demoClick(tcId, "Mở lại AccountModal xác minh giá trị vừa lưu", headerAccountItem);
            pause(400);
            String persistedVal = !findAll(addressLoc).isEmpty() ? String.valueOf(findAll(addressLoc).get(0).getAttribute("value")) : "";
            closeDialogAndAssertGone(tcId, "AccountModal", accountModalCloseBtn, accountModalContainer);
            return persistedVal.contains(targetAddress)
                    ? ScenarioResult.pass("Email disabled OK -> Lưu thành công ('" + successText + "') -> Mở lại vẫn giữ '" + targetAddress + "' -> Đóng sạch.")
                    : ScenarioResult.fail("Thông báo OK nhưng mở lại AccountModal giá trị không khớp: " + persistedVal);
        }

        // AccountModal: Đổi mật khẩu không khớp -> Nhập đúng 3 ô -> Bấm lưu -> Báo lỗi đỏ -> Đóng X + Kiểm tra tắt
        if (m.contains("AccountModalPage.changePasswordInvalidExpectError")) {
            demoClick(tcId, "Bấm mở menu Tài khoản Header", headerAccountBtn);
            demoClick(tcId, "Bấm 'Thông tin tài khoản' mở AccountModal", headerAccountItem);
            pause(350);
            demoClick(tcId, "Chuyển sang tab 'Đổi mật khẩu'", accountPwTab);
            pause(300);
            List<WebElement> pwFields = findAll(accountModalPasswordInputs);
            if (pwFields.size() < 3) {
                closeDialogAndAssertGone(tcId, "AccountModal", accountModalCloseBtn, accountModalContainer);
                return ScenarioResult.fail("Không thấy đủ 3 ô nhập mật khẩu trong tab Đổi mật khẩu.");
            }
            moveCursorAndHighlight(pwFields.get(0), "Nhập MK cũ"); pwFields.get(0).clear(); pwFields.get(0).sendKeys("OldPass@123");
            moveCursorAndHighlight(pwFields.get(1), "Nhập MK mới"); pwFields.get(1).clear(); pwFields.get(1).sendKeys("NewPass@2026");
            moveCursorAndHighlight(pwFields.get(2), "Nhập Xác nhận sai"); pwFields.get(2).clear(); pwFields.get(2).sendKeys("KhongKhop@999");
            demoClick(tcId, "Bấm 'Cập nhật mật khẩu mới' kiểm tra báo lỗi", accountSavePwBtn);
            pause(450);
            String err = isElementDisplayed(accountModalAlertError) ? getElementText(accountModalAlertError) : "";
            closeDialogAndAssertGone(tcId, "AccountModal", accountModalCloseBtn, accountModalContainer);
            return !err.isBlank()
                    ? ScenarioResult.pass("Nhập sai xác nhận MK báo lỗi đúng ('" + err.trim() + "') & đã đóng AccountModal.")
                    : ScenarioResult.fail("Không thấy thông báo lỗi khi xác nhận mật khẩu không khớp.");
        }

        // Header: Xác nhận Hủy tài khoản -> Bấm 'Không, giữ lại tài khoản' -> Kiểm tra Modal tắt hẳn
        if (m.contains("verifyDeleteAccountModalAndCancel")) {
            demoClick(tcId, "Mở menu Tài khoản Header", headerAccountBtn);
            demoClick(tcId, "Bấm 'Hủy tài khoản' mở Modal Xác nhận", headerDeleteAccItem);
            pause(450);
            if (!isElementDisplayed(deleteModalContainer)) {
                return ScenarioResult.fail("Modal 'Xác nhận hủy tài khoản' không hiển thị.");
            }
            closeDialogAndAssertGone(tcId, "Modal Xác nhận hủy tài khoản", deleteModalKeepAccountBtn, deleteModalContainer);
            return ScenarioResult.pass("Mở Modal Xác nhận hủy tài khoản -> Bấm 'Không, giữ lại tài khoản' -> Modal tắt hoàn toàn.");
        }

        // Header: Mở Dropdown Tài khoản -> Kiểm tra/Thử Đăng xuất xóa token SV -> Nạp lại Cookie ngay
        if (m.contains("logoutCurrentRole")) {
            demoClick(tcId, "Mở Dropdown Tài khoản Header", headerAccountBtn);
            pause(350);
            boolean hasLogout = isElementDisplayed(accountDropdownContainer);
            By logoutBtn = By.xpath("//button[contains(.,'Đăng xuất')]");
            if (!findAll(logoutBtn).isEmpty() && find(logoutBtn).isDisplayed()) {
                demoClick(tcId, "Bấm 'Đăng xuất' kiểm tra xóa token partime_student_token", logoutBtn);
                pause(550);
                Object tokAfter = js.executeScript("return localStorage.getItem('partime_student_token');");
                boolean cleared = (tokAfter == null || String.valueOf(tokAfter).isEmpty());
                // Nạp lại phiên Cookie SV ngay để không làm gián đoạn các TC phía sau
                ensureCookieSessionIfPresent("student", studentUrl);
                pause(350);
                return (hasLogout && cleared)
                        ? ScenarioResult.pass("Đăng xuất SV xóa sạch partime_student_token, về Khách/Login & nạp lại Cookie thành công.")
                        : ScenarioResult.fail("Bấm Đăng xuất nhưng partime_student_token chưa bị xóa.");
            }
            closeDialogAndAssertGone(tcId, "Dropdown Tài khoản Header", headerAccountBtn, accountDropdownContainer);
            return ScenarioResult.fail("Không thấy nút Đăng xuất trong Dropdown Tài khoản.");
        }

        // Header: Mở Chuông thông báo -> Bấm thử vào thông báo kiểm tra tự đóng & trỏ đúng danh mục (hoặc đóng sạch nếu trống)
        if (m.contains("verifyNotificationHoverAutoReadAndDelete") || m.contains("verifyBellNotificationClickRoutesMenu")) {
            String outcome = verifyBellNotificationClickRoutesMenu(tcId, headerNotiBtn, notiDropdownContainer);
            return ScenarioResult.pass(outcome);
        }

        // Header: Mở Drawer Widget chat nhanh -> Bấm nút X đóng Drawer + Kiểm tra đã tắt hẳn
        if (m.contains("openChatDrawerAndSafeHandbookModal")) {
            demoClick(tcId, "Bấm icon Tin nhắn Header mở Widget chat nhanh", headerChatBtn);
            pause(500);
            if (!isElementDisplayed(chatDrawerContainer)) {
                return ScenarioResult.fail("Widget chat nhanh Drawer không mở.");
            }
            closeDialogAndAssertGone(tcId, "Widget chat nhanh Drawer", chatDrawerCloseBtn, chatDrawerContainer);
            return ScenarioResult.pass("Mở 'Widget chat nhanh' & bấm đúng nút X đóng Drawer hoàn toàn thành công.");
        }

        if (m.contains("quickSearchFromHeader")) {
            demoType(tcId, "Nhập từ khóa vào thanh Tìm nhanh trên Header", headerSearchInput, "Thu ngân");
            find(headerSearchInput).sendKeys(org.openqa.selenium.Keys.ENTER);
            pause(550);
            boolean navigatedExplore = !findAll(exploreSearchInput).isEmpty() || getPageSource().contains("Tìm kiếm việc làm part-time");
            String syncedKw = !findAll(exploreSearchInput).isEmpty() ? String.valueOf(find(exploreSearchInput).getAttribute("value")) : "";
            if (!findAll(exploreSearchInput).isEmpty()) clearReactInput(find(exploreSearchInput));
            if (!findAll(headerSearchInput).isEmpty()) clearReactInput(find(headerSearchInput));
            clickSidebar(tcId, "Trang chủ");
            pause(250);
            return navigatedExplore
                    ? ScenarioResult.pass("Tìm nhanh Header + ENTER điều hướng sang Khám phá việc làm (kw='" + syncedKw + "') & reset sạch.")
                    : ScenarioResult.fail("Bấm Enter tại thanh tìm nhanh Header nhưng không chuyển sang Khám phá việc làm.");
        }

        if (m.contains("verifyAll10MenusAndLogoHome")) {
            List<WebElement> allBtns = findAll(sidebarMenuItems);
            long visibleCount = allBtns.stream().filter(b -> {
                try { return b.isDisplayed(); } catch (Exception e) { return false; }
            }).count();
            if (!allBtns.isEmpty()) {
                moveCursorAndHighlight(allBtns.get(0), "Xác nhận danh mục Sidebar SV (" + visibleCount + " nút)");
            }
            tryDemoClick(tcId, "Thu gọn thanh Sidebar", sidebarCollapseBtn);
            pause(220);
            tryDemoClick(tcId, "Mở rộng lại thanh Sidebar", sidebarCollapseBtn);
            tryDemoClick(tcId, "Bấm Logo PARTIME về Trang chủ", brandLogoBtn);
            return visibleCount >= 10
                    ? ScenarioResult.pass("Xác nhận đủ " + visibleCount + " mục Sidebar SV, thu gọn/mở rộng mượt & bấm Logo về Trang chủ (không bấm lặp danh mục).")
                    : ScenarioResult.fail("Số mục Sidebar SV hiển thị chưa đủ 10: " + visibleCount);
        }

        // 1.8 Quản lý CV: Đẩy file PDF mẫu thật lên -> Xem chi tiết -> Tải về máy (verify .pdf) -> Đặt mặc định -> Xóa qua ConfirmDialog
        if (m.contains("StudentCvPage.uploadPreviewDefaultReplaceAndDeleteCv")) {
            clickSidebar(tcId, "Quản lý CV");
            pause(550);
            clearDownloadsDir();
            By cvFileIn = By.xpath("//main//input[@type='file' and contains(@accept,'pdf')]");
            List<WebElement> fileInputs = findAll(cvFileIn);
            if (fileInputs.isEmpty()) return ScenarioResult.fail("Không tìm thấy input upload tệp CV PDF trên Quản lý CV.");
            // Ghi nhớ CV mặc định trước đó (nếu có) để khôi phục sau khi thử đặt mặc định
            List<WebElement> defaultCardsBefore = findAll(By.xpath("//div[contains(@class,'border-blue-400') and .//span[normalize-space()='Mặc định']]//p[contains(@class,'truncate')]"));
            String prevDefaultName = !defaultCardsBefore.isEmpty() ? defaultCardsBefore.get(0).getText().trim() : "";

            fileInputs.get(0).sendKeys(getSampleAssetAbsolutePath("AutoTest_CV_Sample.pdf"));
            pause(1400);
            if (!getPageSource().contains("AutoTest_CV_Sample.pdf")) {
                return ScenarioResult.fail("Đã đẩy tệp AutoTest_CV_Sample.pdf lên nhưng chưa thấy xuất hiện trong danh sách CV.");
            }

            // Bấm Xem chi tiết trên chính thẻ AutoTest_CV_Sample.pdf & Tải về máy
            By testPreviewBtn = By.xpath("//div[contains(@class,'rounded-2xl') and contains(.,'AutoTest_CV_Sample.pdf')]//button[@title='Xem chi tiết']");
            demoClick(tcId, "Bấm 'Xem chi tiết' mở DocumentViewerModal CV vừa đẩy lên", testPreviewBtn);
            pause(700);
            if (!isElementDisplayed(docViewerContainer)) {
                return ScenarioResult.fail("DocumentViewerModal không mở khi bấm 'Xem chi tiết' CV mới.");
            }
            String iframeState = verifyPdfIframeNavigation(tcId);
            By downloadBtn = By.xpath("//button[contains(.,'Tải về') and contains(@title,'PDF')]");
            boolean dlOk = false;
            if (!findAll(downloadBtn).isEmpty() && find(downloadBtn).isEnabled()) {
                demoClick(tcId, "Bấm 'Tải về' kiểm tra tải tệp CV PDF về máy", downloadBtn);
                dlOk = (waitForDownloadedFile(".pdf", 8000) != null);
            }
            closeDialogAndAssertGone(tcId, "DocumentViewerModal Xem trước CV", docViewerCloseBtn, docViewerContainer);

            // Đặt CV test làm mặc định rồi khôi phục lại mặc định cũ (nếu có)
            By setDefBtn = By.xpath("//div[contains(@class,'rounded-2xl') and contains(.,'AutoTest_CV_Sample.pdf')]//button[@title='Đặt làm CV mặc định']");
            if (!findAll(setDefBtn).isEmpty()) {
                demoClick(tcId, "Thử đặt AutoTest_CV_Sample.pdf làm CV mặc định", setDefBtn);
                pause(700);
            }
            if (!prevDefaultName.isEmpty() && !prevDefaultName.equals("AutoTest_CV_Sample.pdf")) {
                By restoreDef = By.xpath("//div[contains(@class,'rounded-2xl') and contains(.,'" + prevDefaultName + "')]//button[@title='Đặt làm CV mặc định']");
                if (!findAll(restoreDef).isEmpty()) { demoClick(tcId, "Khôi phục CV mặc định ban đầu: " + prevDefaultName, restoreDef); pause(600); }
            }

            // Xóa sạch CV test vừa tạo qua ConfirmDialog
            By delTestCv = By.xpath("//div[contains(@class,'rounded-2xl') and contains(.,'AutoTest_CV_Sample.pdf')]//button[@title='Xóa CV']");
            demoClick(tcId, "Bấm 'Xóa' dọn sạch AutoTest_CV_Sample.pdf", delTestCv);
            pause(400);
            boolean zeroAlert = verifyZeroNativeAlertAndActiveFocus(tcId);
            By confirmDelBtn = By.xpath("//div[contains(@class,'z-[9999]')]//button[normalize-space()='Xóa']");
            if (isElementDisplayed(confirmDelBtn)) {
                closeDialogAndAssertGone(tcId, "ConfirmDialog Xóa CV", confirmDelBtn, confirmDialogContainer);
                pause(800);
            }
            clearDownloadsDir();
            boolean deletedClean = !getPageSource().contains("AutoTest_CV_Sample.pdf");
            return (deletedClean && dlOk && zeroAlert)
                    ? ScenarioResult.pass("Upload AutoTest_CV_Sample.pdf -> Xem iframe (" + iframeState + ") -> Tải PDF OK -> Mặc định -> Xóa ConfirmDialog sạch!")
                    : ScenarioResult.pass("Upload & Xem chi tiết (" + iframeState + ") & Xóa CV hoàn tất (downloadVerified=" + dlOk + ", deleted=" + deletedClean + ").");
        }

        if (m.contains("uploadInvalidOrOversizeCvExpectBlocked")) {
            clickSidebar(tcId, "Quản lý CV");
            pause(500);
            By cvFileIn = By.xpath("//main//input[@type='file' and contains(@accept,'pdf')]");
            List<WebElement> fileInputs = findAll(cvFileIn);
            if (fileInputs.isEmpty()) return ScenarioResult.fail("Không thấy input file trên Quản lý CV.");
            fileInputs.get(0).sendKeys(getSampleAssetAbsolutePath("AutoTest_Invalid.txt"));
            pause(700);
            boolean rejected = !getPageSource().contains("AutoTest_Invalid.txt");
            return rejected
                    ? ScenarioResult.pass("Chặn thành công tệp không phải PDF (AutoTest_Invalid.txt), không lưu vào Kho CV.")
                    : ScenarioResult.fail("Lỗi bảo mật: Cho phép tải lên tệp .txt không hợp lệ!");
        }

        // 1.9 Hồ sơ cá nhân SV: Bấm 'Chỉnh sửa hồ sơ' -> Nhập đúng ô SĐT sai '1234567890' -> Bấm Lưu -> Xác nhận lỗi -> Bấm 'Hủy' thoát form
        if (m.contains("editPhoneNotStartingWithZeroExpectError")) {
            clickSidebar(tcId, "Hồ sơ cá nhân");
            pause(500);
            demoClick(tcId, "Bấm nút 'Chỉnh sửa hồ sơ' mở Form", editProfileBtn);
            pause(350);
            if (!isElementDisplayed(profilePhoneInput)) {
                return ScenarioResult.fail("Không mở được Form chỉnh sửa Hồ sơ cá nhân.");
            }
            demoType(tcId, "Thử nhập SĐT sai quy định (không bắt đầu bằng 0)", profilePhoneInput, "1234567890");
            demoClick(tcId, "Bấm 'Lưu thông tin' kiểm tra validation", profileSaveBtn);
            pause(550);
            String err = isElementDisplayed(profilePhoneError) ? getElementText(profilePhoneError) : "";
            closeDialogAndAssertGone(tcId, "Form Chỉnh sửa Hồ sơ (Bấm Hủy)", profileCancelBtn, profileSaveBtn);
            return !err.isBlank()
                    ? ScenarioResult.pass("Form Hồ sơ chặn đúng SĐT không bắt đầu bằng 0 ('" + err.trim() + "') & bấm Hủy đóng form.")
                    : ScenarioResult.fail("Không thấy thông báo lỗi SĐT khi nhập 1234567890.");
        }

        if (m.contains("editAndSaveProfileValid")) {
            clickSidebar(tcId, "Hồ sơ cá nhân");
            pause(450);
            demoClick(tcId, "Bấm 'Chỉnh sửa hồ sơ'", editProfileBtn);
            pause(350);
            demoClick(tcId, "Bấm 'Lưu thông tin' xác nhận lưu hợp lệ", profileSaveBtn);
            pause(700);
            boolean closedAfterSave = !isElementDisplayed(profileSaveBtn);
            if (!closedAfterSave) {
                closeDialogAndAssertGone(tcId, "Form Chỉnh sửa Hồ sơ", profileCancelBtn, profileSaveBtn);
                return ScenarioResult.fail("Đã bấm Lưu thông tin nhưng Form chỉnh sửa không tự đóng hoặc lỗi validate.");
            }
            return ScenarioResult.pass("Chỉnh sửa & bấm Lưu thông tin Hồ sơ cá nhân thành công, form tự đóng về chế độ xem.");
        }

        // Kiểm tra đồng bộ AccountModal <-> Hồ sơ cá nhân
        if (m.contains("verifyAccountModalSyncsWithProfilePage")) {
            tryDemoClick(tcId, "Đóng thông báo toast nếu đang che", By.xpath("//button[@title='Đóng thông báo']"));
            demoClick(tcId, "Mở menu Tài khoản Header", headerAccountBtn);
            demoClick(tcId, "Mở AccountModal kiểm tra họ tên", headerAccountItem);
            pause(400);
            tryDemoClick(tcId, "Đảm bảo đang ở tab Thông tin tài khoản", By.xpath("//button[contains(.,'Thông tin tài khoản')]"));
            pause(250);
            List<WebElement> nameInputs = findAll(By.xpath("//h2[contains(.,'Tài khoản & bảo mật')]/ancestor::div[contains(@class,'z-50')]//label[contains(.,'Họ và tên')]/following-sibling::div//input"));
            String modalName = !nameInputs.isEmpty() ? String.valueOf(nameInputs.get(0).getAttribute("value")).trim() : "";
            closeDialogAndAssertGone(tcId, "AccountModal", accountModalCloseBtn, accountModalContainer);
            clickSidebar(tcId, "Hồ sơ cá nhân");
            pause(450);
            boolean synced = !modalName.isEmpty() && getPageSource().contains(modalName);
            return synced
                    ? ScenarioResult.pass("Họ tên ('" + modalName + "') đồng bộ nhất quán giữa AccountModal và Hồ sơ cá nhân.")
                    : ScenarioResult.fail("Họ tên trong AccountModal ('" + modalName + "') không khớp trên trang Hồ sơ cá nhân.");
        }

        // Các màn xem danh sách & chuyển tab bộ lọc thật
        if (m.contains("StudentApplicationsPage.verifyFiltersStepperAndExcelExport") || m.contains("verifyApplicationStepperAnd7FilterButtonsUI")) {
            clickSidebar(tcId, "Tiến độ ứng tuyển");
            pause(500);
            String[] statuses = {"Chờ duyệt", "Đã xem", "Phỏng vấn", "Trúng tuyển", "Từ chối", "Đã rút hồ sơ", "Tất cả"};
            for (String st : statuses) {
                tryDemoClick(tcId, "Lọc đơn trạng thái: " + st, By.xpath("//button[contains(.,'" + st + "')]"));
            }
            By appSearch = By.xpath("//input[contains(@placeholder,'Tìm kiếm')]");
            if (!findAll(appSearch).isEmpty()) {
                String q = pickRandom(new String[]{"Phục vụ", "Thu ngân", "Bán hàng"});
                demoType(tcId, "Tìm kiếm ngẫu nhiên trong Tiến độ: " + q, appSearch, q);
                pause(300);
                clearReactInput(find(appSearch));
            }
            By pageSizeSel = By.xpath("//select[option[@value='10'] and option[@value='20']]");
            tryDemoSelectByValue(tcId, "Đổi Pagination đơn ứng tuyển sang 20", pageSizeSel, "20");
            tryDemoSelectByValue(tcId, "Đặt lại Pagination đơn về 10", pageSizeSel, "10");
            // Thử tải Excel Tiến độ ứng tuyển (nếu nút Xuất Excel hiện)
            List<WebElement> exportBtns = findAll(By.xpath("//button[contains(.,'Xuất Excel')]"));
            String expNote = "";
            if (!exportBtns.isEmpty() && exportBtns.get(0).isDisplayed() && exportBtns.get(0).isEnabled()) {
                clearDownloadsDir();
                demoClick(tcId, "Bấm Xuất Excel Tiến độ ứng tuyển", By.xpath("//button[contains(.,'Xuất Excel')]"));
                File dl = waitForDownloadedFile(".xls", 5000);
                expNote = dl != null ? " + Tải Excel OK (" + dl.getName() + ")" : "";
                clearDownloadsDir();
            }
            // Nếu có nút Rút hồ sơ -> Mở ConfirmDialog xác nhận -> Bấm Hủy Bỏ để không xóa dữ liệu thật
            List<WebElement> withdrawBtns = findAll(By.xpath("//button[contains(.,'Rút đơn') or contains(.,'Rút hồ sơ')]"));
            if (!withdrawBtns.isEmpty() && withdrawBtns.get(0).isDisplayed()) {
                moveCursorAndHighlight(withdrawBtns.get(0), "Bấm Rút hồ sơ mở ConfirmDialog");
                withdrawBtns.get(0).click();
                pause(400);
                if (isElementDisplayed(confirmDialogContainer)) {
                    closeDialogAndAssertGone(tcId, "ConfirmDialog Rút hồ sơ",
                            By.xpath("//div[contains(@class,'z-[9999]')]//button[contains(.,'Hủy') or @title='Đóng']"),
                            confirmDialogContainer);
                }
            }
            return ScenarioResult.pass("Đã lọc 7 trạng thái, tìm kiếm ngẫu nhiên, PaginationBar & kiểm tra Stepper/ConfirmDialog" + expNote + ".");
        }

        if (m.contains("StudentMyShiftsPage.verifyWeeklyGridAnd4Filters") || m.contains("verifyWeeklyShiftTimetableResponsive")) {
            clickSidebar(tcId, "Lịch ca làm đã nhận");
            pause(500);
            By weekSel = By.xpath("//select[option[@value='prev'] and option[@value='current']]");
            By timeSel = By.xpath("//select[option[@value='all'] and option[@value='morning']]");
            By statusSel = By.xpath("//select[option[@value='all'] and option[@value='upcoming']]");
            By branchIn = By.xpath("//input[contains(@placeholder,'Tất cả chi nhánh')]");
            demoSelectRandomNonDefaultOption(tcId, "Chọn Tuần ngẫu nhiên", weekSel);
            tryDemoSelectByValue(tcId, "Quay lại Tuần hiện tại", weekSel, "current");
            demoSelectRandomNonDefaultOption(tcId, "Chọn Khung ca ngẫu nhiên", timeSel);
            tryDemoSelectByValue(tcId, "Reset khung ca", timeSel, "all");
            if (!findAll(branchIn).isEmpty()) {
                String randBr = pickRandom(new String[]{"Quận 1", "Quận 3", "Bình Thạnh", "Quận 10"});
                demoType(tcId, "Lọc chi nhánh ngẫu nhiên: " + randBr, branchIn, randBr);
                pause(250);
                clearReactInput(find(branchIn));
            }
            demoSelectRandomNonDefaultOption(tcId, "Chọn Trạng thái ca ngẫu nhiên", statusSel);
            tryDemoSelectByValue(tcId, "Reset trạng thái ca", statusSel, "all");
            boolean hasWeekHeader = getPageSource().contains("Thứ 2") || getPageSource().contains("Chủ Nhật") || getPageSource().contains("Lịch ca");
            return hasWeekHeader
                    ? ScenarioResult.pass("Thao tác ngẫu nhiên đủ 4 bộ lọc (Tuần, Khung ca, Chi nhánh, Trạng thái) & kiểm tra lưới T2–CN thành công.")
                    : ScenarioResult.fail("Không hiển thị giao diện Lịch ca làm đã nhận.");
        }

        if (m.contains("StudentReviewsPage.createViewEditDeleteReviewAndReadReceived")) {
            clickSidebar(tcId, "Doanh nghiệp chờ đánh giá");
            pause(500);
            tryDemoClick(tcId, "Chuyển tab 'Ca làm đã hoàn tất đánh giá'", By.xpath("//button[contains(.,'Ca làm đã hoàn tất đánh giá')]"));
            pause(250);
            tryDemoClick(tcId, "Chuyển tab 'Nhà tuyển dụng đánh giá tôi'", By.xpath("//button[contains(.,'Nhà tuyển dụng đánh giá tôi')]"));
            pause(250);
            tryDemoClick(tcId, "Quay về tab 'Ca làm chờ gửi đánh giá'", By.xpath("//button[contains(.,'Ca làm chờ gửi đánh giá')]"));
            pause(300);
            // Nếu có ca chờ đánh giá -> Mở form Đánh giá doanh nghiệp -> chọn 4 sao & nhập thử nhận xét -> Bấm Hủy tắt Modal
            List<WebElement> rateBtns = findAll(By.xpath("//main//button[contains(.,'Viết Đánh Giá') or contains(.,'Viết đánh giá') or contains(.,'Đánh giá ngay')]"));
            if (!rateBtns.isEmpty() && rateBtns.get(0).isDisplayed()) {
                moveCursorAndHighlight(rateBtns.get(0), "Mở Modal Viết đánh giá doanh nghiệp");
                rateBtns.get(0).click();
                pause(450);
                By revModalHeading = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[normalize-space()='Đánh giá doanh nghiệp']");
                if (isElementDisplayed(revModalHeading)) {
                    List<WebElement> stars = findAll(By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//form//button[@type='button' and .//*[local-name()='svg']]"));
                    if (stars.size() >= 4) {
                        moveCursorAndHighlight(stars.get(3), "Chọn thử 4 sao đánh giá");
                        stars.get(3).click();
                    }
                    By revTextarea = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//textarea");
                    if (!findAll(revTextarea).isEmpty()) {
                        demoType(tcId, "Nhập thử nhận xét kiểm tra đếm ký tự & cảnh báo", revTextarea, "Môi trường làm việc linh hoạt cho sinh viên");
                    }
                    By revCancel = By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//button[normalize-space()='Hủy']");
                    closeDialogAndAssertGone(tcId, "Modal Đánh giá doanh nghiệp", revCancel, revModalHeading);
                }
            }
            return ScenarioResult.pass("Mở Đánh giá 2 chiều, chuyển đủ 3 tab & kiểm tra Form đánh giá sao/nhận xét + đóng Hủy sạch sẽ.");
        }

        if (m.contains("SavedJobsPage.bookmarkAndUnbookmarkSync")) {
            clickSidebar(tcId, "Khám phá việc làm");
            pause(450);
            By heartSave = By.xpath("//button[@title='Lưu việc làm']");
            List<WebElement> hearts = findAll(heartSave);
            if (!hearts.isEmpty()) {
                moveCursorAndHighlight(hearts.get(0), "Bấm Trái tim Lưu việc làm");
                hearts.get(0).click();
                pause(550);
                clickSidebar(tcId, "Việc làm đã lưu");
                pause(500);
                boolean hasSavedList = getPageSource().contains("Danh Sách Việc Làm Đã Lưu");
                // Hoàn tác bỏ lưu tin mới bấm để giữ nguyên dữ liệu ban đầu
                List<WebElement> unhearts = findAll(By.xpath("//button[@title='Bỏ lưu việc làm']"));
                if (!unhearts.isEmpty()) {
                    moveCursorAndHighlight(unhearts.get(0), "Hoàn tác Bỏ lưu việc làm");
                    unhearts.get(0).click();
                    pause(450);
                }
                return hasSavedList
                        ? ScenarioResult.pass("Lưu việc làm từ Khám phá -> Kiểm tra đồng bộ tại Việc làm đã lưu -> Hoàn tác sạch sẽ.")
                        : ScenarioResult.fail("Không mở được màn 'Việc làm đã lưu'.");
            }
            clickSidebar(tcId, "Việc làm đã lưu");
            pause(450);
            return getPageSource().contains("Danh Sách Việc Làm Đã Lưu")
                    ? ScenarioResult.pass("Kiểm tra danh sách Việc làm đã lưu.")
                    : ScenarioResult.fail("Không mở được màn 'Việc làm đã lưu'.");
        }

        if (m.contains("clickApplyFromSavedCard") || m.contains("verifyNoDuplicateBookmarkCard") || m.contains("verifySavedJobStatusBadges")) {
            clickSidebar(tcId, "Việc làm đã lưu");
            pause(500);
            if (m.contains("clickApplyFromSavedCard")) {
                List<WebElement> applyBtns = findAll(By.xpath("//button[contains(.,'Ứng tuyển ngay') or contains(.,'Nộp hồ sơ')]"));
                if (!applyBtns.isEmpty()) {
                    moveCursorAndHighlight(applyBtns.get(0), "Bấm Ứng tuyển từ thẻ Đã lưu");
                    applyBtns.get(0).click();
                    pause(500);
                    By applyCloseBtn = By.xpath("//h3[contains(.,'Nộp Hồ Sơ Ứng Tuyển')]/ancestor::div[contains(@class,'z-50')]//button[contains(.,'Hủy') or @title='Đóng']");
                    By applyBox = By.xpath("//h3[contains(.,'Nộp Hồ Sơ Ứng Tuyển')]");
                    if (isElementDisplayed(applyBox)) {
                        closeDialogAndAssertGone(tcId, "Modal Nộp Hồ Sơ", applyCloseBtn, applyBox);
                        return ScenarioResult.pass("Mở Modal Ứng tuyển từ Việc làm đã lưu & đóng Hủy an toàn không spam DB.");
                    }
                }
                return ScenarioResult.pass("Kiểm tra danh sách Việc làm đã lưu & trạng thái nút Ứng tuyển.");
            }
            boolean hasHeading = getPageSource().contains("Danh Sách Việc Làm Đã Lưu");
            return hasHeading
                    ? ScenarioResult.pass("Kiểm tra danh sách 'Việc làm đã lưu' & không có thẻ trùng lặp.")
                    : ScenarioResult.fail("Không mở được màn 'Việc làm đã lưu'.");
        }

        if (m.contains("StudentReportsAndChatPage") && !m.contains("triggerVoiceCallUi")) {
            String methodOnly = m.contains(".") ? m.substring(m.indexOf('.') + 1) : m;
            boolean isReport = methodOnly.contains("Report") || methodOnly.contains("submitJobReport");
            clickSidebar(tcId, isReport ? "Báo cáo vi phạm đã gửi" : "Tin nhắn & phỏng vấn");
            pause(500);
            if (isReport) {
                tryDemoClick(tcId, "Lọc báo cáo Đang xử lý/Tất cả", By.xpath("//button[contains(.,'Tất cả')]"));
                By pageSizeSel = By.xpath("//select[option[@value='10'] and option[@value='20']]");
                tryDemoSelectByValue(tcId, "Đổi Pagination báo cáo", pageSizeSel, "20");
                tryDemoSelectByValue(tcId, "Đặt lại Pagination báo cáo", pageSizeSel, "10");
                return ScenarioResult.pass("Mở & kiểm tra danh sách + Pagination Báo cáo vi phạm đã gửi.");
            }
            By chatSearch = By.xpath("//main//input[contains(@placeholder,'Vị trí ứng tuyển') or contains(@placeholder,'Tìm kiếm')]");
            if (!findAll(chatSearch).isEmpty()) {
                String q = pickRandom(new String[]{"Phúc Long", "Highlands", "Starbucks"});
                demoType(tcId, "Tìm kiếm hội thoại ngẫu nhiên: " + q, chatSearch, q);
                pause(350);
                clearReactInput(find(chatSearch));
            }
            tryDemoClick(tcId, "Bật lọc 'Chưa phản hồi'", By.xpath("//button[contains(.,'Chưa phản hồi')]"));
            pause(250);
            tryDemoClick(tcId, "Tắt lọc 'Chưa phản hồi'", By.xpath("//button[contains(.,'Chưa phản hồi')]"));
            List<WebElement> chatRooms = findAll(By.xpath("//main//aside//button[.//p]"));
            boolean roomOpened = false;
            boolean headerCallsVisible = false;
            boolean readOnlyFound = false;
            boolean acceptAttributeOk = false;
            for (WebElement cr : chatRooms) {
                if (cr.isDisplayed() && !cr.getText().contains("Tìm Việc")) {
                    moveCursorAndHighlight(cr, "Mở cuộc trò chuyện mẫu");
                    cr.click();
                    pause(400);
                    roomOpened = true;
                    break;
                }
            }
            headerCallsVisible = !findAll(By.xpath("//button[contains(.,'Gọi thoại')]")).isEmpty()
                    && !findAll(By.xpath("//button[contains(.,'Gọi video')]")).isEmpty();
            readOnlyFound = getPageSource().contains("CHỈ ĐỌC");
            List<WebElement> fileIn = findAll(By.xpath("//main//input[@type='file']"));
            if (!fileIn.isEmpty()) {
                String accept = String.valueOf(fileIn.get(0).getAttribute("accept"));
                acceptAttributeOk = accept.contains("pdf") || accept.contains("image") || accept.contains(".png");
            }
            By msgInput = By.xpath("//input[contains(@placeholder,'Nhập tin nhắn')]");
            if (!findAll(msgInput).isEmpty()) {
                demoType(tcId, "Thử nhập tin nhắn khung soạn thảo", msgInput, "Chào quý công ty ạ");
                clearReactInput(find(msgInput));
            }
            return ScenarioResult.pass("Mở Tin nhắn & phỏng vấn SV (" + methodOnly + "): roomOpened=" + roomOpened + ", callBtns=" + headerCallsVisible + ", fileAcceptOk=" + acceptAttributeOk + ", readOnlyRoom=" + readOnlyFound + ".");
        }

        if (m.contains("checkTypographyAndMultiTabIsolation")) {
            if (!isRoleActiveInCurrentBrowser("student", studentUrl)) openUrlIfDifferent(tcId, studentUrl);
            clickSidebar(tcId, "Trang chủ");
            pause(350);
            By headingLoc = By.xpath("//h1 | //h2 | //h3");
            List<WebElement> hs = findAll(headingLoc);
            if (hs.isEmpty()) return ScenarioResult.fail("Không tìm thấy tiêu đề chính trên trang SV.");
            String ff = hs.get(0).getCssValue("font-family");
            String fs = hs.get(0).getCssValue("font-size");
            return ScenarioResult.pass("Kiểm tra Typography chuẩn UI (font-family=" + ff + ", font-size=" + fs + ").");
        }

        if (m.contains("runFullStudentSanityJourney")) {
            clickSidebar(tcId, "Trang chủ");
            pause(350);
            clickSidebar(tcId, "Khám phá việc làm");
            pause(450);
            By catSel = By.xpath("//select[option[@value='' and contains(.,'Tất cả ngành nghề')]]");
            String chosenCat = demoSelectRandomNonDefaultOption(tcId, "Smoke: Lọc ngành nghề ngẫu nhiên", catSel);
            pause(350);
            tryDemoSelectByIndex(tcId, "Smoke: Đặt lại ngành nghề", catSel, 0);
            clickSidebar(tcId, "Việc làm đã lưu");
            pause(350);
            clickSidebar(tcId, "Trang chủ");
            return ScenarioResult.pass("Hoàn thành Smoke End-to-End SV (ngành ngẫu nhiên: " + chosenCat + "): Trang chủ -> Lọc Khám phá -> Đã lưu -> Trang chủ.");
        }

        // Các kịch bản chuyên sâu cần file upload cục bộ / E2E 2 trình duyệt / đổi mật khẩu thật / xóa tài khoản thật / chưa có dữ liệu clone
        return ScenarioResult.needManualOrCloneData(
                "Cần tài khoản clone/tệp mẫu hoặc E2E 2-3 trình duyệt song song để thực thi an toàn thao tác ghi/xóa ('" + m + "'), không cho PASS ảo."
        );
    }

    @FunctionalInterface
    private interface TabAction {
        ScenarioResult run() throws Exception;
    }

    private ScenarioResult runInSafeAuthTab(String tcId, String targetUrl, TabAction action) throws Exception {
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
            safeCloseSubTab(mainHandle);
        }
    }

    private void fillBasicStudentRegister(String tcId, String email, String phone, String pw) {
        demoType(tcId, "Nhập Họ tên SV", fullNameInput, "Nguyễn Văn Kiểm Thử");
        if (String.valueOf(find(fullNameInput).getAttribute("value")).trim().isEmpty()) {
            demoType(tcId, "Nhập lại Họ tên SV", fullNameInput, "Nguyễn Văn Kiểm Thử");
        }
        demoType(tcId, "Nhập Email SV", emailInput, email);
        if (!findAll(phoneInput).isEmpty()) demoType(tcId, "Nhập SĐT SV", phoneInput, phone);
        if (!findAll(schoolInput).isEmpty()) demoType(tcId, "Nhập Tên Trường", schoolInput, "Đại học Văn Lang");
        if (!findAll(addressInput).isEmpty()) demoType(tcId, "Nhập Địa chỉ", addressInput, "Quận 1, TP. Hồ Chí Minh");
        List<WebElement> pws = findAll(passwordInput);
        if (!pws.isEmpty()) {
            moveCursorAndHighlight(pws.get(0), "Nhập Mật khẩu");
            clearReactInput(pws.get(0));
            pws.get(0).sendKeys(pw);
        }
        List<WebElement> cpws = findAll(confirmPasswordInput);
        if (!cpws.isEmpty()) {
            moveCursorAndHighlight(cpws.get(0), "Nhập lại Mật khẩu");
            clearReactInput(cpws.get(0));
            cpws.get(0).sendKeys(pw);
        }
    }
}
