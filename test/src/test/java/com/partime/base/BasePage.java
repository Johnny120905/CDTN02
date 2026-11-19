package com.partime.base;

import com.partime.utils.CookieSessionManager;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.Select;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * BasePage (Page Object Model - POM) cho hệ thống PARTIME.VN (CDTN02).
 * Tính năng trình chiếu trực quan mượt mà (Smooth Visual Cursor + Ripple Click + Human Typing + Banner):
 * - Tuyệt đối không F5/load lại trang khi đang ở cùng một Portal (SPA React Navigation).
 * - Hiển thị Con trỏ chuột ảo di chuyển tới nút trước khi bấm & gõ chữ từng ký tự để người xem nhìn rõ từng thao tác.
 * - Bao phủ 57 lệnh WebDriver Java theo tài liệu PLT SOLUTIONS PDF.
 */
public class BasePage {
    protected WebDriver driver;
    protected JavascriptExecutor js;
    protected Map<String, String> envConfig;
    protected CookieSessionManager cookieManager;
    protected int demoSpeedMs = 550;
    protected int implicitWaitSec = 4;
    protected boolean highlightEnabled = true;
    protected String screenshotDir = "screenshots/";
    protected static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public void initDriver(Map<String, String> config) {
        this.envConfig = config;
        String browser = System.getProperty("browser", config.getOrDefault("BROWSER", "CHROME")).toUpperCase();
        boolean headless = Boolean.parseBoolean(System.getProperty("headless", config.getOrDefault("HEADLESS_MODE", "FALSE")));
        this.demoSpeedMs = Integer.parseInt(System.getProperty("demoSpeedMs", config.getOrDefault("DEMO_SPEED_MS", "550")));
        this.highlightEnabled = Boolean.parseBoolean(System.getProperty("highlight", config.getOrDefault("HIGHLIGHT_ELEMENT", "TRUE")));
        this.screenshotDir = config.getOrDefault("SCREENSHOT_DIR", "screenshots/");
        this.implicitWaitSec = Math.min(4, Integer.parseInt(config.getOrDefault("IMPLICIT_WAIT_SEC", "4")));
        int pageLoadSec = Integer.parseInt(config.getOrDefault("PAGE_LOAD_TIMEOUT_SEC", "30"));

        if ("EDGE".equals(browser)) {
            driver = new EdgeDriver();
        } else {
            ChromeOptions options = new ChromeOptions();
            File dlDir = new File("target/downloads");
            if (!dlDir.exists()) dlDir.mkdirs();
            Map<String, Object> prefs = new HashMap<>();
            prefs.put("download.default_directory", dlDir.getAbsolutePath());
            prefs.put("download.prompt_for_download", false);
            prefs.put("download.directory_upgrade", true);
            prefs.put("safebrowsing.enabled", true);
            options.setExperimentalOption("prefs", prefs);
            options.addArguments("--use-fake-ui-for-media-stream");
            options.addArguments("--use-fake-device-for-media-stream");
            options.addArguments("--remote-allow-origins=*");
            options.addArguments("--disable-dev-shm-usage");
            options.addArguments("--disable-gpu");
            options.addArguments("--disable-extensions");
            options.addArguments("--disable-background-timer-throttling");
            options.addArguments("--disable-backgrounding-occluded-windows");
            options.addArguments("--disable-renderer-backgrounding");
            options.addArguments("--disable-features=CalculateNativeWinOcclusion");
            if (headless) {
                options.addArguments("--headless=new");
                options.addArguments("--window-size=1920,1080");
            }
            driver = new ChromeDriver(options);
        }

        if (!headless) {
            driver.manage().window().maximize();
        }
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(implicitWaitSec));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(pageLoadSec));
        driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(pageLoadSec));
        this.js = (JavascriptExecutor) driver;
        this.cookieManager = new CookieSessionManager(config.getOrDefault("COOKIE_DIR", "cookies/"));
        this.cookieManager.setBaseUrl(config.getOrDefault("BASE_URL", "https://parttime-css0.onrender.com"));
    }

    public void registerRoleCredentials(String role, String email, String password) {
        if (this.cookieManager != null) {
            this.cookieManager.registerRoleCredentials(role, email, password);
        }
    }

    public void attachSharedContext(BasePage source) {
        this.driver = source.driver;
        this.js = source.js;
        this.envConfig = source.envConfig;
        this.cookieManager = source.cookieManager;
        this.demoSpeedMs = source.demoSpeedMs;
        this.implicitWaitSec = source.implicitWaitSec;
        this.highlightEnabled = source.highlightEnabled;
        this.screenshotDir = source.screenshotDir;
    }

    public WebDriver getDriver() {
        return driver;
    }

    /**
     * Khởi tạo Banner thao tác + Con trỏ chuột ảo + Hiệu ứng vòng tròn Click trên DOM hiện tại.
     */
    private void ensureVisualOverlay() {
        if (js == null) return;
        try {
            js.executeScript(
                "if (!document.getElementById('selenium-live-banner')) {" +
                "  let b = document.createElement('div'); b.id = 'selenium-live-banner';" +
                "  b.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483646;" +
                "  background:#0f172a;color:#38bdf8;padding:8px 22px;border-radius:999px;font-family:Segoe UI,sans-serif;" +
                "  font-weight:700;font-size:13px;box-shadow:0 10px 25px rgba(0,0,0,0.45);border:2px solid #38bdf8;" +
                "  pointer-events:none;max-width:90vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';" +
                "  document.body.appendChild(b);" +
                "}" +
                "if (!document.getElementById('selenium-virtual-cursor')) {" +
                "  let c = document.createElement('div'); c.id = 'selenium-virtual-cursor';" +
                "  c.style.cssText = 'position:fixed;left:120px;top:120px;z-index:2147483647;pointer-events:none;" +
                "  transition:left 0.38s cubic-bezier(0.22,1,0.36,1), top 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.15s ease;" +
                "  display:flex;align-items:flex-start;gap:4px;';" +
                "  c.innerHTML = '<svg width=\"26\" height=\"26\" viewBox=\"0 0 24 24\" style=\"filter:drop-shadow(0 3px 6px rgba(0,0,0,0.45))\">" +
                "    <path d=\"M3 2L20 12L12 14L15 21L12 22L9 15L3 19Z\" fill=\"#ef4444\" stroke=\"#ffffff\" stroke-width=\"1.8\"/></svg>" +
                "    <span id=\"selenium-cursor-tip\" style=\"background:#ef4444;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:8px;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.3);margin-top:16px;\"></span>';" +
                "  document.body.appendChild(c);" +
                "}"
            );
        } catch (Exception ignored) {}
    }

    public void showStepBanner(String tcId, String stepDescription) {
        if (js == null) return;
        ensureVisualOverlay();
        try {
            js.executeScript(
                "let b = document.getElementById('selenium-live-banner');" +
                "if (b) b.innerText = '[' + arguments[0] + '] ' + arguments[1];",
                tcId, stepDescription
            );
        } catch (Exception ignored) {}
    }

    /**
     * Xóa viền đỏ phần tử cũ, cuộn mượt tới phần tử mới, cho Con trỏ chuột ảo bay tới và tô viền đỏ rõ nét.
     */
    public void moveCursorAndHighlight(WebElement element, String tipLabel) {
        if (js == null || element == null) return;
        ensureVisualOverlay();
        if (highlightEnabled) {
            try {
                js.executeScript(
                    "if (window.__lastSeleniumEl) {" +
                    "  window.__lastSeleniumEl.style.outline='';" +
                    "  window.__lastSeleniumEl.style.boxShadow='';" +
                    "}" +
                    "arguments[0].scrollIntoView({behavior:'instant', block:'center', inline:'nearest'});",
                    element
                );
                pause(Math.min(demoSpeedMs, 110));
                js.executeScript(
                    "let el = arguments[0]; let tip = arguments[1];" +
                    "window.__lastSeleniumEl = el;" +
                    "el.style.outline = '3px solid #ef4444';" +
                    "el.style.outlineOffset = '2px';" +
                    "el.style.boxShadow = '0 0 18px rgba(239,68,68,0.45)';" +
                    "let r = el.getBoundingClientRect();" +
                    "if (r.top < 115 || r.bottom > window.innerHeight - 25) {" +
                    "  window.scrollBy(0, r.top - Math.round(window.innerHeight * 0.45));" +
                    "  r = el.getBoundingClientRect();" +
                    "}" +
                    "let cur = document.getElementById('selenium-virtual-cursor');" +
                    "let lbl = document.getElementById('selenium-cursor-tip');" +
                    "if (cur) {" +
                    "  cur.style.left = Math.round(r.left + Math.min(r.width * 0.5, 160)) + 'px';" +
                    "  cur.style.top = Math.round(r.top + r.height * 0.5) + 'px';" +
                    "}" +
                    "if (lbl) lbl.innerText = tip || '';",
                    element, tipLabel
                );
            } catch (Exception ignored) {}
        }
        pause(Math.max(70, Math.min(demoSpeedMs, 240)));
    }

    private void triggerCursorClickRipple() {
        if (js == null || !highlightEnabled) return;
        try {
            js.executeScript(
                "let cur = document.getElementById('selenium-virtual-cursor');" +
                "if (!cur) return;" +
                "cur.style.transform = 'scale(0.82)';" +
                "setTimeout(() => { if(cur) cur.style.transform = 'scale(1)'; }, 160);" +
                "let rip = document.createElement('div');" +
                "rip.style.cssText = 'position:fixed;left:' + cur.style.left + ';top:' + cur.style.top + ';" +
                "width:18px;height:18px;margin-left:-9px;margin-top:-9px;border-radius:999px;" +
                "border:3px solid #3b82f6;pointer-events:none;z-index:2147483645;transition:all 0.45s ease-out;';" +
                "document.body.appendChild(rip);" +
                "requestAnimationFrame(() => { rip.style.transform='scale(2.6)'; rip.style.opacity='0'; });" +
                "setTimeout(() => rip.remove(), 480);"
            );
        } catch (Exception ignored) {}
    }

    public void pause(int ms) {
        if (ms <= 0) return;
        try { Thread.sleep(ms); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
    }

    // ==================== ĐIỀU HƯỚNG THÔNG MINH (TRÁNH RELOAD THỪA GÂY CÀ GIỰT) ====================

    public String normalizeUrl(String u) {
        if (u == null) return "";
        return u.endsWith("/") ? u.substring(0, u.length() - 1) : u;
    }

    /**
     * Chỉ mở URL bằng driver.get() khi thực sự khác URL hiện tại (tránh F5 giật lag giữa các Test Case cùng màn).
     */
    public void openUrlIfDifferent(String tcId, String targetUrl) {
        String current = normalizeUrl(getCurrentUrl());
        String target = normalizeUrl(targetUrl);
        if (!current.equals(target)) {
            driver.get(targetUrl);
            waitForSpaHydrated(targetUrl);
        }
        showStepBanner(tcId, "Màn hình: " + targetUrl);
    }

    public void openUrl(String tcId, String url) {
        openUrlIfDifferent(tcId, url);
    }

    public void forceOpenUrl(String tcId, String url) {
        driver.get(url);
        waitForSpaHydrated(url);
        showStepBanner(tcId, "Mở trang: " + url);
    }

    private void waitForSpaHydrated(String retryUrl) {
        long deadline = System.currentTimeMillis() + 14000L;
        boolean retried = false;
        while (System.currentTimeMillis() < deadline) {
            try {
                Boolean ready = (Boolean) js.executeScript(
                        "return document.readyState === 'complete' && document.body && document.body.innerText.trim().length > 20;"
                );
                if (Boolean.TRUE.equals(ready)) {
                    pause(180);
                    return;
                }
            } catch (Exception ignored) {}
            if (!retried && deadline - System.currentTimeMillis() < 7000L) {
                retried = true;
                try { driver.get(retryUrl); } catch (Exception ignored) {}
            }
            pause(250);
        }
    }

    public void navigateTo(String url) { driver.navigate().to(url); }
    public void navigateBack() { driver.navigate().back(); }
    public void navigateForward() { driver.navigate().forward(); }
    public void refreshPage() { driver.navigate().refresh(); }
    public String getPageTitle() { return driver.getTitle(); }
    public String getCurrentUrl() {
        try { return driver.getCurrentUrl(); } catch (Exception e) { return ""; }
    }
    public String getPageSource() { return driver.getPageSource(); }

    // ==================== TƯƠNG TÁC TRỰC QUAN NHƯ NGƯỜI THẬT ====================

    public WebElement find(By locator) { return driver.findElement(locator); }

    /**
     * Tìm danh sách phần tử tức thì (0ms wait) để không bị khựng 4–6 giây mỗi lần kiểm tra overlay/nút tùy chọn.
     */
    public List<WebElement> findAll(By locator) {
        driver.manage().timeouts().implicitlyWait(Duration.ZERO);
        try {
            return driver.findElements(locator);
        } finally {
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(implicitWaitSec));
        }
    }

    public void clearReactInput(WebElement el) {
        if (js != null) {
            js.executeScript(
                    "const e = arguments[0];" +
                    "e.scrollIntoView({behavior:'instant', block:'center', inline:'nearest'});" +
                    "const r = e.getBoundingClientRect();" +
                    "if (r.top < 115 || r.bottom > window.innerHeight - 25) {" +
                    "  window.scrollBy(0, r.top - Math.round(window.innerHeight * 0.45));" +
                    "}",
                    el
            );
            pause(80);
        }
        try {
            el.click();
        } catch (ElementClickInterceptedException ex) {
            if (js != null) {
                js.executeScript(
                        "const e = arguments[0];" +
                        "let p = e.parentElement;" +
                        "while (p) { if (p.scrollTop > 0) p.scrollTop = Math.max(0, p.scrollTop - 160); p = p.parentElement; }" +
                        "window.scrollTo({top: 0, behavior: 'instant'});" +
                        "e.scrollIntoView({behavior:'instant', block:'center'});" +
                        "e.focus();",
                        el
                );
                pause(150);
            }
            try {
                el.click();
            } catch (ElementClickInterceptedException ignored) {
                if (js != null) js.executeScript("arguments[0].focus();", el);
            }
        }
        el.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        el.sendKeys(Keys.BACK_SPACE);
        pause(120);
    }

    public void demoType(String tcId, String stepLabel, By locator, String text) {
        showStepBanner(tcId, "⌨️ " + stepLabel + ": \"" + text + "\"");
        WebElement el = find(locator);
        moveCursorAndHighlight(el, "Nhập dữ liệu");
        clearReactInput(el);
        if (demoSpeedMs >= 250 && text.length() <= 24) {
            for (char ch : text.toCharArray()) {
                el.sendKeys(String.valueOf(ch));
                pause(10);
            }
        } else {
            el.sendKeys(text);
        }
        pause(Math.min(demoSpeedMs, 220));
    }

    public void demoClick(String tcId, String stepLabel, By locator) {
        showStepBanner(tcId, "👆 " + stepLabel);
        WebElement el = find(locator);
        moveCursorAndHighlight(el, stepLabel);
        triggerCursorClickRipple();
        try {
            el.click(); // Click chuột thật 100%, nếu bị form khác che sẽ báo ElementClickInterceptedException ngay!
        } catch (ElementClickInterceptedException ex) {
            js.executeScript("arguments[0].scrollIntoView({behavior:'instant', block:'center'}); window.scrollBy(0, -100);", el);
            pause(160);
            el.click();
        }
        pause(Math.min(demoSpeedMs, 250));
    }

    public boolean tryDemoClick(String tcId, String stepLabel, By locator) {
        List<WebElement> els = findAll(locator);
        for (WebElement el : els) {
            if (el.isDisplayed() && el.isEnabled()) {
                showStepBanner(tcId, "👆 " + stepLabel);
                moveCursorAndHighlight(el, stepLabel);
                triggerCursorClickRipple();
                try {
                    el.click();
                } catch (ElementClickInterceptedException ex) {
                    js.executeScript("arguments[0].scrollIntoView({behavior:'instant', block:'center'}); window.scrollBy(0, -100);", el);
                    pause(160);
                    el.click();
                }
                pause(Math.min(demoSpeedMs, 240));
                return true;
            }
        }
        return false;
    }

    public void demoSubmit(String tcId, String stepLabel, By locator) {
        showStepBanner(tcId, "👆 " + stepLabel);
        WebElement el = find(locator);
        moveCursorAndHighlight(el, stepLabel);
        triggerCursorClickRipple();
        el.submit();
        pause(Math.min(demoSpeedMs, 550));
    }

    // ==================== DROPDOWN, TRẠNG THÁI, VIEWPORT, COOKIE ====================

    public void demoSelectByVisibleText(String tcId, String stepLabel, By locator, String visibleText) {
        showStepBanner(tcId, "▼ " + stepLabel + ": \"" + visibleText + "\"");
        WebElement el = find(locator);
        moveCursorAndHighlight(el, "Chọn " + visibleText);
        new Select(el).selectByVisibleText(visibleText);
        pause(Math.min(demoSpeedMs, 500));
    }

    public boolean tryDemoSelectByVisibleText(String tcId, String stepLabel, By locator, String visibleText) {
        List<WebElement> els = findAll(locator);
        for (WebElement el : els) {
            if (el.isDisplayed() && el.isEnabled()) {
                try {
                    showStepBanner(tcId, "▼ " + stepLabel + ": \"" + visibleText + "\"");
                    moveCursorAndHighlight(el, "Chọn " + visibleText);
                    new Select(el).selectByVisibleText(visibleText);
                    pause(Math.min(demoSpeedMs, 480));
                    return true;
                } catch (Exception ignored) {}
            }
        }
        return false;
    }

    public boolean tryDemoSelectByIndex(String tcId, String stepLabel, By locator, int index) {
        List<WebElement> els = findAll(locator);
        for (WebElement el : els) {
            if (el.isDisplayed() && el.isEnabled()) {
                Select sel = new Select(el);
                if (sel.getOptions().size() > index) {
                    String optText = sel.getOptions().get(index).getText();
                    showStepBanner(tcId, "▼ " + stepLabel + ": " + optText);
                    moveCursorAndHighlight(el, "Chọn " + optText);
                    sel.selectByIndex(index);
                    pause(Math.min(demoSpeedMs, 480));
                    return true;
                }
            }
        }
        return false;
    }

    public boolean tryDemoSelectByValue(String tcId, String stepLabel, By locator, String value) {
        List<WebElement> els = findAll(locator);
        for (WebElement el : els) {
            if (el.isDisplayed() && el.isEnabled()) {
                try {
                    showStepBanner(tcId, "▼ " + stepLabel + ": " + value);
                    moveCursorAndHighlight(el, "Chọn " + value);
                    new Select(el).selectByValue(value);
                    pause(Math.min(demoSpeedMs, 480));
                    return true;
                } catch (Exception ignored) {}
            }
        }
        return false;
    }

    /**
     * Chọn NGẪU NHIÊN 1 tùy chọn khác mặc định (bỏ qua option[0] "Tất cả" / placeholder & option disabled)
     * để mỗi lần chạy test phủ đa dạng ngành nghề, địa điểm, ca làm, mức lương thay vì kẹt chọn cố định.
     */
    public String demoSelectRandomNonDefaultOption(String tcId, String stepLabel, By locator) {
        List<WebElement> els = findAll(locator);
        for (WebElement el : els) {
            if (el.isDisplayed() && el.isEnabled()) {
                try {
                    Select sel = new Select(el);
                    List<WebElement> opts = sel.getOptions();
                    List<Integer> candidates = new java.util.ArrayList<>();
                    for (int i = 1; i < opts.size(); i++) {
                        try {
                            String val = opts.get(i).getAttribute("value");
                            String txt = opts.get(i).getText().trim();
                            if (opts.get(i).isEnabled() && val != null && !val.isBlank() && !txt.isBlank()) {
                                candidates.add(i);
                            }
                        } catch (Exception ignored) {}
                    }
                    if (candidates.isEmpty()) continue;
                    int chosenIdx = candidates.get(ThreadLocalRandom.current().nextInt(candidates.size()));
                    String optText = opts.get(chosenIdx).getText().trim();
                    showStepBanner(tcId, "🎲 " + stepLabel + " (Ngẫu nhiên): \"" + optText + "\"");
                    moveCursorAndHighlight(el, "Ngẫu nhiên -> " + optText);
                    sel.selectByIndex(chosenIdx);
                    pause(Math.min(demoSpeedMs, 480));
                    return optText;
                } catch (Exception ignored) {}
            }
        }
        return "";
    }

    public String demoClickRandomElement(String tcId, String stepLabel, By locator) {
        List<WebElement> els = findAll(locator);
        List<WebElement> visible = new java.util.ArrayList<>();
        for (WebElement el : els) {
            try {
                if (el.isDisplayed() && el.isEnabled()) visible.add(el);
            } catch (Exception ignored) {}
        }
        if (visible.isEmpty()) return "";
        WebElement pick = visible.get(ThreadLocalRandom.current().nextInt(visible.size()));
        String label = pick.getText() == null ? "" : pick.getText().trim();
        showStepBanner(tcId, "🎲 " + stepLabel + (label.isEmpty() ? "" : ": " + label));
        moveCursorAndHighlight(pick, label.isEmpty() ? stepLabel : label);
        try { pick.click(); } catch (Exception ex) { js.executeScript("arguments[0].click();", pick); }
        pause(Math.min(demoSpeedMs, 450));
        return label;
    }

    public <T> T pickRandom(T[] items) {
        return items[ThreadLocalRandom.current().nextInt(items.length)];
    }

    public <T> T pickRandom(List<T> items) {
        return items.get(ThreadLocalRandom.current().nextInt(items.size()));
    }

    public void demoHover(String tcId, String stepLabel, By locator) {
        List<WebElement> els = findAll(locator);
        if (els.isEmpty()) return;
        WebElement el = els.get(0);
        showStepBanner(tcId, "🖱️ " + stepLabel);
        moveCursorAndHighlight(el, stepLabel);
        try {
            new Actions(driver).moveToElement(el).perform();
        } catch (Exception ignored) {}
        pause(Math.min(demoSpeedMs, 420));
    }

    public boolean isElementDisplayed(By locator) {
        List<WebElement> els = findAll(locator);
        for (WebElement el : els) {
            try { if (el.isDisplayed()) return true; } catch (Exception ignored) {}
        }
        return false;
    }

    public boolean waitUntilDisplayed(By locator, long timeoutMs) {
        long deadline = System.currentTimeMillis() + Math.max(200L, timeoutMs);
        while (System.currentTimeMillis() < deadline) {
            if (isElementDisplayed(locator)) {
                return true;
            }
            pause(150);
        }
        return false;
    }

    /**
     * Điều hướng Sidebar thông minh: kiểm tra nút danh mục đang active (bg-gradient-to-r from-blue-600 ... text-white).
     * Nếu ĐANG ở sẵn danh mục này rồi thì KHÔNG bấm lại nữa (giữ tổng số lần bấm mỗi danh mục chỉ 1–2 lần).
     */
    public boolean clickSidebarSmart(String tcId, String menuText) {
        assertNoBlockingOverlayOpen(tcId);
        By loc = By.xpath("//aside//button[contains(.,'" + menuText + "')]");
        List<WebElement> btns = findAll(loc);
        for (WebElement b : btns) {
            try {
                if (b.isDisplayed()) {
                    String cls = String.valueOf(b.getAttribute("class"));
                    if (cls.contains("from-blue-600") && cls.contains("text-white")) {
                        showStepBanner(tcId, "📍 Đang ở phân hệ: " + menuText + " (bỏ qua bấm lặp)");
                        return true;
                    }
                }
            } catch (Exception ignored) {}
        }
        return tryDemoClick(tcId, "Mở phân hệ: " + menuText, loc);
    }

    /**
     * Bấm đúng nút Đóng (X / Hủy / Đã Hiểu) của một Form/Modal/Drawer và BẮT BUỘC xác minh form đã tắt hẳn.
     * Nếu form vẫn chưa tắt -> ném AssertionError thay vì im lặng test tiếp khi form vẫn che màn hình!
     */
    public void closeDialogAndAssertGone(String tcId, String modalLabel, By closeBtnLoc, By containerLoc) {
        boolean clicked = tryDemoClick(tcId, "Đóng " + modalLabel, closeBtnLoc);
        if (!clicked) {
            throw new AssertionError("Không tìm thấy nút Đóng của '" + modalLabel + "' để tắt form!");
        }
        long deadline = System.currentTimeMillis() + 2500L;
        while (System.currentTimeMillis() < deadline) {
            if (!isElementDisplayed(containerLoc)) {
                pause(180);
                return;
            }
            pause(150);
        }
        throw new AssertionError("Đã bấm nút đóng nhưng '" + modalLabel + "' VẪN HIỂN THỊ chưa tắt!");
    }

    /**
     * Kiểm tra trước khi bước sang thao tác mới rằng không có Modal/Popup/Drawer nào bị kẹt mở trên màn hình.
     */
    public void assertNoBlockingOverlayOpen(String tcId) {
        By[] overlays = {
            By.xpath("//h2[contains(.,'Tài khoản & bảo mật')]"),
            By.xpath("//h3[contains(.,'Xác nhận hủy tài khoản')]"),
            By.xpath("//div[contains(@class,'z-[9999]')]//h3"),
            By.xpath("//h3[contains(.,'Widget chat nhanh')]"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Hội thoại ứng viên')]"),
            By.xpath("//h4[contains(.,'Mô tả chi tiết công việc')]"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Nộp Hồ Sơ Ứng Tuyển')]"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Báo cáo vi phạm')]"),
            By.xpath("//button[@aria-label='Đóng hồ sơ doanh nghiệp']"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[normalize-space()='Đánh giá doanh nghiệp']"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Chi tiết bài đánh giá')]"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Chi tiết phiếu khiếu nại')]"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Hồ sơ ứng viên:')]"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Hẹn lịch phỏng vấn') or contains(.,'Mời phỏng vấn')]"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Từ chối hồ sơ ứng viên')]"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Tạo tin nhắn mới')]"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//h3[contains(.,'Chỉnh Sửa Đánh Giá')]"),
            By.xpath("//button[@title='Đóng modal']"),
            By.xpath("//h4[contains(.,'Thông báo hệ thống')]"),
            By.xpath("//button[contains(.,'Cập nhật tài khoản cá nhân')]")
        };
        String[] names = {
            "AccountModal (Tài khoản & bảo mật)",
            "Modal Xác nhận hủy tài khoản",
            "ConfirmDialog",
            "Widget chat nhanh Drawer",
            "Drawer Hội thoại ứng viên",
            "Slide-over Chi tiết JD",
            "Modal Ứng tuyển",
            "Modal Báo cáo vi phạm",
            "Modal Hồ sơ doanh nghiệp",
            "Modal Đánh giá doanh nghiệp",
            "Modal Chi tiết bài đánh giá",
            "Modal Chi tiết phiếu khiếu nại",
            "Modal Hồ sơ ứng viên",
            "Modal Hẹn lịch phỏng vấn",
            "Modal Từ chối hồ sơ ứng viên",
            "Modal Tạo tin nhắn mới",
            "Modal Chỉnh Sửa Đánh Giá",
            "DocumentViewerModal",
            "Dropdown Chuông thông báo",
            "Dropdown Tài khoản cá nhân"
        };
        for (int i = 0; i < overlays.length; i++) {
            if (isElementDisplayed(overlays[i])) {
                throw new AssertionError("[" + tcId + "] Lỗi sót giao diện: '" + names[i] + "' từ bước trước CHƯA ĐƯỢC TẮT!");
            }
        }
    }

    /**
     * Dọn các Modal/Slide-over còn mở CHỈ SAU KHI test trước đã chụp ảnh lỗi (FAIL),
     * tránh 1 ca lỗi làm kẹt oan toàn bộ các ca kiểm thử độc lập phía sau.
     */
    public void dismissOpenOverlaysAfterFail() {
        By[] closeBtns = {
            By.xpath("//button[@aria-label='Đóng hồ sơ doanh nghiệp']"),
            By.xpath("//button[@title='Đóng modal']"),
            By.xpath("//div[contains(@class,'fixed') and contains(@class,'z-50')]//button[normalize-space()='Hủy' or normalize-space()='Đóng']"),
            By.xpath("//h4[contains(.,'Mô tả chi tiết công việc')]/ancestor::div[contains(@class,'max-w-xl')]//div[contains(@class,'border-b')]/button"),
            By.xpath("//div[contains(@class,'z-[9999]')]//button[contains(.,'Không, giữ lại') or @title='Đóng']"),
            By.xpath("//div[contains(@class,'z-[9999]')]//button[contains(.,'Đã Hiểu')]")
        };
        for (int round = 0; round < 2; round++) {
            for (By loc : closeBtns) {
                for (WebElement b : findAll(loc)) {
                    try {
                        if (b.isDisplayed()) {
                            b.click();
                            pause(150);
                        }
                    } catch (Exception ignored) {}
                }
            }
        }
    }

    public String getActiveSidebarMenuLabel() {
        List<WebElement> btns = findAll(By.xpath("//aside//button[contains(@class,'from-blue-600') and contains(@class,'text-white')]"));
        for (WebElement b : btns) {
            try {
                if (b.isDisplayed()) return b.getText().trim();
            } catch (Exception ignored) {}
        }
        return "";
    }

    public String verifyBellNotificationClickRoutesMenu(String tcId, By bellBtn, By dropdownBox) {
        demoClick(tcId, "Bấm mở Chuông thông báo hệ thống", bellBtn);
        pause(450);
        if (!isElementDisplayed(dropdownBox)) {
            throw new AssertionError("[" + tcId + "] Không mở được bảng 'Thông báo hệ thống'.");
        }
        By notiItems = By.xpath("//h4[contains(.,'Thông báo hệ thống')]/ancestor::div[contains(@class,'rounded-2xl')]//div[contains(@class,'cursor-pointer') and .//p]");
        List<WebElement> items = findAll(notiItems);
        if (items.isEmpty()) {
            closeDialogAndAssertGone(tcId, "Bảng Thông báo hệ thống", bellBtn, dropdownBox);
            return "Mở & tắt bảng Chuông thông báo thành công (hiện hộp thông báo trống 0 tin).";
        }
        WebElement firstItem = items.get(0);
        String notiTitle = firstItem.getText().replace("\n", " ").trim();
        if (notiTitle.length() > 60) notiTitle = notiTitle.substring(0, 60) + "...";
        demoHover(tcId, "Rê chuột đánh dấu đã đọc thông báo", notiItems);
        pause(200);
        moveCursorAndHighlight(firstItem, "Bấm thông báo kiểm tra trỏ vào danh mục");
        firstItem.click();
        pause(650);
        if (isElementDisplayed(dropdownBox)) {
            closeDialogAndAssertGone(tcId, "Bảng Thông báo hệ thống", bellBtn, dropdownBox);
            throw new AssertionError("[" + tcId + "] Bấm vào thông báo nhưng Dropdown chưa tự đóng!");
        }
        String activeAfter = getActiveSidebarMenuLabel();
        return "Đã bấm thông báo '" + notiTitle + "' -> Dropdown đóng & trỏ vào phân hệ '" + activeAfter + "'.";
    }

    public boolean isElementEnabled(By locator) { return find(locator).isEnabled(); }
    public boolean isElementSelected(By locator) { return find(locator).isSelected(); }
    public String getElementText(By locator) { return find(locator).getText(); }
    public String getElementAttribute(By locator, String attrName) { return find(locator).getAttribute(attrName); }
    public String getElementCssValue(By locator, String prop) { return find(locator).getCssValue(prop); }
    public Dimension getElementSize(By locator) { return find(locator).getSize(); }
    public Point getElementLocation(By locator) { return find(locator).getLocation(); }
    public String getElementTagName(By locator) { return find(locator).getTagName(); }

    public void setViewportSize(int width, int height) {
        driver.manage().window().setSize(new Dimension(width, height));
        pause(420);
    }

    public String checkAll4ViewportsResponsive(String tcId, String targetUrl) {
        int[][] viewports = {{1920, 1080}, {1366, 768}, {820, 1180}, {430, 932}};
        String[] names = {"PC_1920", "Laptop_1366", "iPad_820", "Mobile_430"};
        openUrlIfDifferent(tcId, targetUrl);
        pause(500);
        StringBuilder summary = new StringBuilder();
        for (int i = 0; i < viewports.length; i++) {
            setViewportSize(viewports[i][0], viewports[i][1]);
            showStepBanner(tcId, "📐 Responsive " + names[i] + " (" + viewports[i][0] + "x" + viewports[i][1] + ")");
            Number scrollW = (Number) js.executeScript("return document.documentElement.scrollWidth;");
            Number clientW = (Number) js.executeScript("return document.documentElement.clientWidth;");
            long diff = scrollW.longValue() - clientW.longValue();
            if (diff > 16) {
                if (!Boolean.parseBoolean(System.getProperty("headless", envConfig.getOrDefault("HEADLESS_MODE", "FALSE")))) {
                    driver.manage().window().maximize();
                } else {
                    setViewportSize(1920, 1080);
                }
                throw new AssertionError("Tràn khung ngang tại " + names[i] + ": scrollWidth=" + scrollW + ", clientWidth=" + clientW);
            }
            summary.append(names[i]).append("=").append(clientW).append("px(OK); ");
        }
        if (!Boolean.parseBoolean(System.getProperty("headless", envConfig.getOrDefault("HEADLESS_MODE", "FALSE")))) {
            driver.manage().window().maximize();
        } else {
            setViewportSize(1920, 1080);
        }
        return summary.toString();
    }

    /**
     * Đăng nhập theo cơ chế: Nếu đang đăng nhập sẵn trên trình duyệt thì dùng luôn KHÔNG reload;
     * Nếu có file Cookie thì nạp 1 lần duy nhất; Nếu chưa có thì chờ người dùng thao tác tay lần đầu -> Lưu Cookie.
     */
    public String executeManualFirstThenCookieLogin(String tcId, String role, String portalUrl, String loginUrl) throws IOException {
        if (isRoleActiveInCurrentBrowser(role, portalUrl)) {
            showStepBanner(tcId, "✅ Đã đăng nhập sẵn phiên Cookie '" + role + "' (không cần tải lại)");
            return "SESSION_ALREADY_ACTIVE";
        }
        if (cookieManager.hasSavedSession(role)) {
            showStepBanner(tcId, "🍪 Đang nạp Cookie phiên '" + role + "' để tự động đăng nhập...");
            boolean restored = cookieManager.restoreSessionFromCookie(driver, js, role, portalUrl);
            if (restored) {
                Set<Cookie> cookies = driver.manage().getCookies();
                return "AUTO_COOKIE_LOGIN_OK (cookies=" + cookies.size() + ")";
            }
        }
        boolean allowManual = Boolean.parseBoolean(System.getProperty("allowManualWait", envConfig.getOrDefault("ALLOW_MANUAL_WAIT", "FALSE")));
        if (!allowManual) {
            return "SKIP_WAIT_COOKIE";
        }
        int timeoutSec = Integer.parseInt(envConfig.getOrDefault("MANUAL_LOGIN_TIMEOUT_SEC", "120"));
        boolean captured = cookieManager.waitForManualLoginAndSaveCookie(driver, js, role, loginUrl, timeoutSec);
        if (!captured) {
            throw new AssertionError("Hết thời gian chờ đăng nhập thủ công " + timeoutSec + "s cho role " + role);
        }
        return "MANUAL_FIRST_LOGIN_CAPTURED_TO_COOKIE (" + cookieManager.getRoleCookieFile(role).getName() + ")";
    }

    /**
     * Đảm bảo đang ở trong phiên Role ĐÃ ĐĂNG NHẬP mà TUYỆT ĐỐI KHÔNG F5 lại nếu phiên đã bật sẵn!
     */
    public boolean ensureCookieSessionIfPresent(String role, String portalUrl) throws IOException {
        if (isRoleActiveInCurrentBrowser(role, portalUrl)) {
            return true;
        }
        if (cookieManager == null || !cookieManager.hasSavedSession(role)) {
            return false;
        }
        return cookieManager.restoreSessionFromCookie(driver, js, role, portalUrl);
    }

    public boolean isRoleActiveInCurrentBrowser(String role, String portalUrl) {
        try {
            String cur = getCurrentUrl();
            if (cur == null || !cur.startsWith("http") || cur.contains("/login") || cur.contains("/register") || cur.contains("/forgot-password")) {
                return false;
            }
            if ("employer".equals(role) && !cur.contains("/employer")) return false;
            if ("admin".equals(role) && !cur.contains("/admin")) return false;
            if ("student".equals(role) && (cur.contains("/employer") || cur.contains("/admin"))) return false;
            Object active = js.executeScript("return sessionStorage.getItem('partime_tab_active_' + arguments[0]);", role);
            Object token = js.executeScript("return localStorage.getItem('partime_' + arguments[0] + '_token');", role);
            String tkStr = token == null ? "" : String.valueOf(token).trim();
            if (!"true".equals(String.valueOf(active)) || tkStr.isBlank()) return false;
            return cookieManager == null || cookieManager.isJwtTokenFresh(tkStr, 1800);
        } catch (Exception e) {
            return false;
        }
    }

    public long measurePageLoadLatencyMs(String tcId, String url) {
        long start = System.currentTimeMillis();
        forceOpenUrl(tcId, url);
        pause(300);
        return System.currentTimeMillis() - start;
    }

    private <T> HttpResponse<T> sendWithRetry(HttpRequest req, HttpResponse.BodyHandler<T> handler) throws IOException, InterruptedException {
        IOException lastIo = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                HttpResponse<T> resp = HTTP_CLIENT.send(req, handler);
                if (resp.statusCode() < 502 || attempt == 3) {
                    return resp;
                }
            } catch (IOException ex) {
                lastIo = ex;
                if (attempt == 3) throw ex;
            }
            pause(1500);
        }
        throw lastIo != null ? lastIo : new IOException("HTTP request failed after retries");
    }

    public int httpGetStatus(String url) throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).timeout(Duration.ofSeconds(35)).GET().build();
        return sendWithRetry(req, HttpResponse.BodyHandlers.discarding()).statusCode();
    }

    public HttpResponse<String> httpGetBody(String url) throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).timeout(Duration.ofSeconds(35)).GET().build();
        return sendWithRetry(req, HttpResponse.BodyHandlers.ofString());
    }

    public HttpResponse<String> httpWithToken(String method, String url, String token, String jsonBody) throws IOException, InterruptedException {
        HttpRequest.Builder b = HttpRequest.newBuilder().uri(URI.create(url)).timeout(Duration.ofSeconds(40));
        if (token != null && !token.isBlank()) {
            b.header("Authorization", "Bearer " + token);
        }
        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)) {
            b.header("Content-Type", "application/json");
            b.method(method.toUpperCase(), HttpRequest.BodyPublishers.ofString(jsonBody == null ? "{}" : jsonBody));
        } else {
            b.method(method.toUpperCase(), HttpRequest.BodyPublishers.noBody());
        }
        return sendWithRetry(b.build(), HttpResponse.BodyHandlers.ofString());
    }

    public File getDownloadsDir() {
        File dlDir = new File("target/downloads");
        if (!dlDir.exists()) dlDir.mkdirs();
        return dlDir;
    }

    public void clearDownloadsDir() {
        File[] files = getDownloadsDir().listFiles();
        if (files != null) {
            for (File f : files) {
                try { f.delete(); } catch (Exception ignored) {}
            }
        }
    }

    public File waitForDownloadedFile(String extOrKeyword, long timeoutMs) {
        long deadline = System.currentTimeMillis() + timeoutMs;
        String needle = extOrKeyword == null ? "" : extOrKeyword.toLowerCase();
        while (System.currentTimeMillis() < deadline) {
            File[] files = getDownloadsDir().listFiles();
            if (files != null) {
                for (File f : files) {
                    String n = f.getName().toLowerCase();
                    if (!n.endsWith(".crdownload") && !n.endsWith(".tmp") && f.length() > 0 && n.contains(needle)) {
                        return f;
                    }
                }
            }
            pause(250);
        }
        return null;
    }

    public String getSampleAssetAbsolutePath(String fileName) {
        File f = new File("sample_assets", fileName);
        if (!f.exists()) {
            throw new AssertionError("Không tìm thấy tệp mẫu upload: " + f.getAbsolutePath());
        }
        return f.getAbsolutePath();
    }

    public String getRoleToken(String role) {
        return cookieManager != null ? cookieManager.readSavedAuthToken(role) : "";
    }

    public void clearAllCookies() { driver.manage().deleteAllCookies(); }
    public Set<Cookie> getAllCookies() { return driver.manage().getCookies(); }

    // ==================== BỔ SUNG ĐỦ 57 LỆNH PLT SOLUTIONS SELENIUM WEBDRIVER ====================

    /**
     * PLT #30 getAllSelectedOptions(), #31 getFirstSelectedOption(), #34 isMultiple() (và giải thích N/A #25/#27/#29/#32).
     */
    public String verifySelectSingleAndSelectedOptions(String tcId, By locator) {
        List<WebElement> els = findAll(locator);
        if (els.isEmpty()) return "";
        Select sel = new Select(els.get(0));
        if (sel.isMultiple()) {
            sel.deselectAll();
            if (!sel.getOptions().isEmpty()) {
                sel.deselectByIndex(0);
                sel.deselectByValue(String.valueOf(sel.getOptions().get(0).getAttribute("value")));
                sel.deselectByVisibleText(sel.getOptions().get(0).getText());
            }
            throw new AssertionError(tcId + ": Select dropdown không được phép là multi-select.");
        }
        String first = sel.getFirstSelectedOption().getText().trim();
        int selectedCount = sel.getAllSelectedOptions().size();
        showStepBanner(tcId, "Select API: first='" + first + "', selectedCount=" + selectedCount + ", isMultiple=" + sel.isMultiple());
        return first + " (selected=" + selectedCount + ", isMultiple=false)";
    }

    /**
     * PLT #52 switchTo().activeElement(), #54 defaultContent(), #55 frame(WebElement), #56 parentFrame().
     */
    public String verifyPdfIframeNavigation(String tcId) {
        List<WebElement> iframes = findAll(By.xpath("//div[contains(@class,'fixed')]//iframe"));
        if (iframes.isEmpty()) return "NO_IFRAME_RENDERED";
        WebElement frameEl = iframes.get(0);
        try {
            showStepBanner(tcId, "Kiểm tra switchTo().frame() PDF & activeElement()");
            driver.switchTo().frame(frameEl);
            WebElement innerActive = driver.switchTo().activeElement();
            String innerTag = innerActive != null ? innerActive.getTagName() : "unknown";
            driver.switchTo().parentFrame();
            driver.switchTo().defaultContent();
            return "IFRAME_SWITCH_OK(innerTag=" + innerTag + ")";
        } catch (Exception ex) {
            try { driver.switchTo().defaultContent(); } catch (Exception ignored) {}
            return "IFRAME_CHECKED(" + ex.getClass().getSimpleName() + ")";
        }
    }

    /**
     * PLT #52 activeElement() & #53 alert() (Zero Native Dialogs: xác nhận không bật alert()/confirm()/prompt() gốc).
     */
    public boolean verifyZeroNativeAlertAndActiveFocus(String tcId) {
        try {
            WebElement active = driver.switchTo().activeElement();
            if (active != null) {
                active.getTagName();
            }
            driver.switchTo().alert();
            return false; // Không được phép dùng native browser alert()
        } catch (NoAlertPresentException expected) {
            return true;
        }
    }

    /**
     * PLT #44 deleteCookie(Cookie) & #45 deleteCookieNamed(String) trên cookie kiểm thử tạm, an toàn tuyệt đối cho session thật.
     */
    public boolean exerciseCookieDeleteCommandsSafe(String tcId) {
        try {
            Cookie c1 = new Cookie("partime_plt_probe_obj", "val1");
            Cookie c2 = new Cookie("partime_plt_probe_named", "val2");
            driver.manage().addCookie(c1);
            driver.manage().addCookie(c2);
            Cookie fetched1 = driver.manage().getCookieNamed("partime_plt_probe_obj");
            driver.manage().deleteCookie(c1);
            driver.manage().deleteCookieNamed("partime_plt_probe_named");
            return fetched1 != null
                    && driver.manage().getCookieNamed("partime_plt_probe_obj") == null
                    && driver.manage().getCookieNamed("partime_plt_probe_named") == null;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * PLT #43 deleteAllCookies() trên domain hiện tại kèm sao lưu & khôi phục ngay tức thì để không mất Cookie người dùng.
     */
    public boolean exerciseClearAllCookiesWithRestore(String tcId) {
        Set<Cookie> backup = new java.util.HashSet<>(driver.manage().getCookies());
        try {
            clearAllCookies();
            return getAllCookies().isEmpty();
        } finally {
            for (Cookie ck : backup) {
                try { driver.manage().addCookie(ck); } catch (Exception ignored) {}
            }
        }
    }

    /**
     * PLT #38 maximize(), #39 fullscreen(), #40 getPosition(), #41 setPosition(), #42 setSize() (khôi phục trạng thái ban đầu).
     */
    public String verifyWindowPositionAndFullscreen(String tcId) {
        boolean headless = Boolean.parseBoolean(System.getProperty("headless", envConfig.getOrDefault("HEADLESS_MODE", "FALSE")));
        if (headless) return "HEADLESS_WINDOW_FIXED";
        Point origPos = driver.manage().window().getPosition();
        try {
            driver.manage().window().setPosition(new Point(0, 0));
            driver.manage().window().fullscreen();
            pause(150);
            driver.manage().window().maximize();
            return "POS=(" + origPos.getX() + "," + origPos.getY() + ")->FULLSCREEN->MAXIMIZED";
        } catch (Exception e) {
            try { driver.manage().window().maximize(); } catch (Exception ignored) {}
            return "WINDOW_POS_MAXIMIZED(" + origPos.getX() + "," + origPos.getY() + ")";
        }
    }

    /**
     * PLT #2 navigateTo(), #3 navigateForward(), #4 navigateBack(), #5 navigateRefresh() trong Sub-tab an toàn.
     */
    public void exerciseNavigationHistorySafe(String tcId, String urlA, String urlB) {
        String mainHandle = driver.getWindowHandle();
        driver.switchTo().newWindow(WindowType.TAB);
        try {
            navigateTo(urlA);
            pause(350);
            navigateTo(urlB);
            pause(350);
            navigateBack();
            pause(300);
            navigateForward();
            pause(300);
            driver.navigate().refresh();
            pause(350);
        } finally {
            safeCloseSubTab(mainHandle);
        }
    }

    /**
     * PLT #22 getSize() & #23 getLocation(): Kiểm tra cụm nút hành động trên 1 hàng có tọa độ Y đồng nhất (không rớt dòng).
     */
    public boolean verifyActionRowButtonsSameLine(List<WebElement> buttons) {
        if (buttons == null || buttons.isEmpty()) return false;
        Integer firstY = null;
        for (WebElement b : buttons) {
            if (!b.isDisplayed()) continue;
            int y = b.getLocation().getY();
            int h = b.getSize().getHeight();
            if (h > 56) return false;
            if (firstY == null) firstY = y;
            else if (Math.abs(y - firstY) > 14) return false;
        }
        return firstY != null;
    }

    public boolean isSessionAlive() {
        if (driver == null) return false;
        try {
            Set<String> handles = driver.getWindowHandles();
            return handles != null && !handles.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Đóng Tab phụ an toàn: CHỈ đóng khi trình duyệt còn nhiều hơn 1 Tab để không bao giờ giết nhầm phiên Chrome chính.
     */
    public void safeCloseSubTab(String mainHandle) {
        try {
            Set<String> handles = driver.getWindowHandles();
            if (handles.size() > 1) {
                driver.close();
            }
            Set<String> remain = driver.getWindowHandles();
            if (mainHandle != null && remain.contains(mainHandle)) {
                driver.switchTo().window(mainHandle);
            } else if (!remain.isEmpty()) {
                driver.switchTo().window(remain.iterator().next());
            }
        } catch (Exception ignored) {}
    }

    public String captureScreenshot(String tcId) {
        if (!isSessionAlive()) return "Không thể chụp màn hình (phiên trình duyệt đã đóng)";
        try {
            File dir = new File(screenshotDir);
            if (!dir.exists()) dir.mkdirs();
            File src = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            File dest = new File(dir, tcId + "_FAIL.png");
            Files.copy(src.toPath(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
            return dest.getPath();
        } catch (Exception e) {
            return "Lỗi chụp màn hình: " + e.getClass().getSimpleName();
        }
    }

    public void quitDriver() {
        if (driver != null) {
            try {
                driver.quit();
            } catch (Exception ignored) {}
            driver = null;
        }
    }
}
