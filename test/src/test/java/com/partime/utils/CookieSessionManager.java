package com.partime.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.openqa.selenium.Cookie;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * CookieSessionManager:
 * Thực thi cơ chế "Lần đầu thao tác đăng nhập thủ công -> Tự động lưu Cookie -> Lần sau tự động vào không cần gõ mật khẩu".
 * Hỗ trợ tự động kiểm tra hạn JWT (exp) và tự gia hạn lại token mới qua /api/auth/login khi quá 24h
 * để chạy test liên tục qua Cookie nhiều ngày liền mà không bị lỗi 401 hết hạn phiên.
 */
public class CookieSessionManager {
    private static final ObjectMapper MAPPER = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
    private static final Map<String, String[]> ROLE_CREDENTIALS = new ConcurrentHashMap<>();

    private final File cookieDir;
    private String baseUrl = "https://parttime-css0.onrender.com";

    public CookieSessionManager(String cookieDirPath) {
        this.cookieDir = new File(cookieDirPath);
        if (!this.cookieDir.exists()) {
            this.cookieDir.mkdirs();
        }
    }

    public void setBaseUrl(String baseUrl) {
        if (baseUrl != null && !baseUrl.isBlank()) {
            this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        }
    }

    public void registerRoleCredentials(String role, String email, String password) {
        if (role != null && email != null && !email.isBlank() && password != null && !password.isBlank()) {
            ROLE_CREDENTIALS.put(role.toLowerCase(), new String[]{email.trim(), password.trim()});
        }
    }

    public File getRoleCookieFile(String role) {
        return new File(cookieDir, role.toLowerCase() + "_session.json");
    }

    /**
     * Giải mã payload JWT (không cần secret) để kiểm tra thời hạn exp (giây).
     * Trả về true nếu token còn hạn ít nhất minRemainingSec giây.
     */
    public boolean isJwtTokenFresh(String token, long minRemainingSec) {
        if (token == null || token.isBlank()) return false;
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return false;
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            Map<String, Object> claims = MAPPER.readValue(decoded, new TypeReference<>() {});
            Object expObj = claims.get("exp");
            if (!(expObj instanceof Number)) return true;
            long expSec = ((Number) expObj).longValue();
            long nowSec = System.currentTimeMillis() / 1000L;
            return expSec > (nowSec + minRemainingSec);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Tự động gia hạn token 24h mới cho Cookie đã lưu bằng tài khoản test khi JWT cũ hết hạn.
     */
    @SuppressWarnings("unchecked")
    public synchronized boolean tryAutoRefreshSession(String role) {
        String key = role.toLowerCase();
        String[] creds = ROLE_CREDENTIALS.get(key);
        if (creds == null || creds.length < 2) {
            return false;
        }
        try {
            Map<String, String> loginBody = new LinkedHashMap<>();
            loginBody.put("email", creds[0]);
            loginBody.put("password", creds[1]);
            loginBody.put("role", key);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/auth/login"))
                    .timeout(Duration.ofSeconds(40))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(loginBody)))
                    .build();

            HttpResponse<String> resp = null;
            IOException lastIo = null;
            for (int attempt = 1; attempt <= 3; attempt++) {
                try {
                    resp = HTTP_CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
                    if (resp.statusCode() < 502 || attempt == 3) break;
                } catch (IOException ioEx) {
                    lastIo = ioEx;
                    if (attempt == 3) throw ioEx;
                }
                Thread.sleep(1500L);
            }
            if (resp == null) {
                if (lastIo != null) throw lastIo;
                return false;
            }
            if (resp.statusCode() != 200) {
                return false;
            }
            Map<String, Object> parsed = MAPPER.readValue(resp.body(), new TypeReference<>() {});
            if (!Boolean.TRUE.equals(parsed.get("success")) || parsed.get("token") == null || parsed.get("user") == null) {
                return false;
            }
            String newToken = String.valueOf(parsed.get("token"));
            String newUserJson = MAPPER.writeValueAsString(parsed.get("user"));
            String encodedUser = URLEncoder.encode(newUserJson, StandardCharsets.UTF_8);

            File f = getRoleCookieFile(key);
            List<Map<String, Object>> serializedCookies = new ArrayList<>();
            if (f.exists()) {
                try {
                    Map<String, Object> oldData = MAPPER.readValue(f, new TypeReference<>() {});
                    Object rawCookies = oldData.get("cookies");
                    if (rawCookies instanceof List) {
                        for (Object o : (List<?>) rawCookies) {
                            if (o instanceof Map) {
                                Map<String, Object> cm = new LinkedHashMap<>((Map<String, Object>) o);
                                String cname = String.valueOf(cm.get("name"));
                                if (("partime_cookie_token_" + key).equals(cname)) {
                                    cm.put("value", newToken);
                                } else if (("partime_cookie_user_" + key).equals(cname) && encodedUser.length() <= 3500) {
                                    cm.put("value", encodedUser);
                                }
                                serializedCookies.add(cm);
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }
            if (serializedCookies.isEmpty()) {
                Map<String, Object> cTok = new LinkedHashMap<>();
                cTok.put("name", "partime_cookie_token_" + key);
                cTok.put("value", newToken);
                cTok.put("path", "/");
                cTok.put("isSecure", baseUrl.startsWith("https"));
                cTok.put("isHttpOnly", false);
                serializedCookies.add(cTok);

                Map<String, Object> cAct = new LinkedHashMap<>();
                cAct.put("name", "partime_cookie_active_" + key);
                cAct.put("value", "true");
                cAct.put("path", "/");
                cAct.put("isSecure", baseUrl.startsWith("https"));
                cAct.put("isHttpOnly", false);
                serializedCookies.add(cAct);
            }

            Map<String, Object> sessionFile = new LinkedHashMap<>();
            sessionFile.put("role", key);
            sessionFile.put("savedAt", new Date().toString() + " (auto-refreshed)");
            sessionFile.put("authToken", newToken);
            sessionFile.put("authUserJson", newUserJson);
            sessionFile.put("cookies", serializedCookies);

            MAPPER.writeValue(f, sessionFile);
            System.out.println("[CookieSessionManager] Da tu dong gia han JWT Cookie moi cho role: " + key);
            return true;
        } catch (Exception e) {
            System.err.println("[CookieSessionManager] Auto-refresh that bai cho role " + key + ": " + e.getMessage());
            return false;
        }
    }

    public boolean hasSavedSession(String role) {
        File f = getRoleCookieFile(role);
        if (!f.exists() || f.length() < 20) return false;
        try {
            Map<String, Object> payload = MAPPER.readValue(f, new TypeReference<>() {});
            Object tokenObj = payload.get("authToken");
            String token = tokenObj == null ? "" : String.valueOf(tokenObj).trim();
            if (token.isBlank()) return false;
            if (isJwtTokenFresh(token, 1800)) {
                return true;
            }
            // Token trong file Cookie da het han hoac sap het han (<30p) -> Tu dong gia han ngay
            return tryAutoRefreshSession(role);
        } catch (IOException e) {
            return false;
        }
    }

    public String readSavedAuthToken(String role) {
        File f = getRoleCookieFile(role);
        if (!f.exists()) {
            tryAutoRefreshSession(role);
            f = getRoleCookieFile(role);
            if (!f.exists()) return "";
        }
        try {
            Map<String, Object> payload = MAPPER.readValue(f, new TypeReference<>() {});
            Object tokenObj = payload.get("authToken");
            String token = tokenObj == null ? "" : String.valueOf(tokenObj).trim();
            if (!isJwtTokenFresh(token, 1800) && tryAutoRefreshSession(role)) {
                payload = MAPPER.readValue(f, new TypeReference<>() {});
                tokenObj = payload.get("authToken");
                token = tokenObj == null ? "" : String.valueOf(tokenObj).trim();
            }
            return token;
        } catch (IOException e) {
            return "";
        }
    }

    /**
     * Nạp riêng phiên cho Tab hiện tại mà vẫn giữ nguyên token của vai trò khác trong localStorage
     * (dùng khi mở song song Tab Sinh viên <-> Tab Nhà tuyển dụng <-> Tab Admin trong cùng 1 Chrome).
     */
    public boolean activateRoleTabSession(WebDriver driver, JavascriptExecutor js, String role, String portalUrl) throws IOException {
        if (!hasSavedSession(role)) return false;
        File f = getRoleCookieFile(role);
        Map<String, Object> sessionFile = MAPPER.readValue(f, new TypeReference<>() {});
        String authToken = String.valueOf(sessionFile.getOrDefault("authToken", ""));
        String authUserJson = String.valueOf(sessionFile.getOrDefault("authUserJson", ""));
        if (authToken.isBlank() || authUserJson.isBlank()) return false;

        driver.get(portalUrl);
        try { Thread.sleep(500); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
        js.executeScript(
                "localStorage.setItem('partime_' + arguments[0] + '_token', arguments[1]);" +
                "localStorage.setItem('partime_' + arguments[0] + '_user', arguments[2]);" +
                "localStorage.setItem('partime_token', arguments[1]);" +
                "localStorage.setItem('partime_user', arguments[2]);" +
                "sessionStorage.setItem('partime_tab_active_' + arguments[0], 'true');" +
                "sessionStorage.setItem('partime_tab_role', arguments[0]);",
                role, authToken, authUserJson
        );
        driver.navigate().refresh();
        try { Thread.sleep(900); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
        return "true".equals(String.valueOf(js.executeScript("return sessionStorage.getItem('partime_tab_active_' + arguments[0]);", role)));
    }

    /**
     * Lần chạy đầu tiên: Chờ người dùng tự thao tác đăng nhập thủ công trên trình duyệt.
     * Ngay khi phát hiện đã đăng nhập thành công -> Lưu phiên vào Browser Cookie & file JSON.
     */
    public boolean waitForManualLoginAndSaveCookie(
            WebDriver driver, JavascriptExecutor js, String role, String loginUrl, int timeoutSec) throws IOException {
        driver.get(loginUrl);
        long deadline = System.currentTimeMillis() + (timeoutSec * 1000L);

        while (System.currentTimeMillis() < deadline) {
            long remainSec = Math.max(0, (deadline - System.currentTimeMillis()) / 1000L);
            showManualBanner(js, role, remainSec);

            Object tokenObj = js.executeScript("return localStorage.getItem('partime_' + arguments[0] + '_token');", role);
            Object tabActive = js.executeScript("return sessionStorage.getItem('partime_tab_active_' + arguments[0]);", role);

            if (tokenObj != null && !String.valueOf(tokenObj).isBlank() && "true".equals(String.valueOf(tabActive))) {
                saveSessionToBrowserCookieAndFile(driver, js, role);
                return true;
            }
            try {
                Thread.sleep(800);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        return false;
    }

    /**
     * Sau khi đăng nhập xong: đóng gói phiên Auth thành Browser Cookie (addCookie + getCookies)
     * và lưu xuống file cookies/<role>_session.json cho các lần chạy sau.
     */
    public void saveSessionToBrowserCookieAndFile(WebDriver driver, JavascriptExecutor js, String role) throws IOException {
        String token = String.valueOf(js.executeScript("return localStorage.getItem('partime_' + arguments[0] + '_token') || '';", role));
        String userJson = String.valueOf(js.executeScript("return localStorage.getItem('partime_' + arguments[0] + '_user') || '';", role));

        String encodedUser = URLEncoder.encode(userJson, StandardCharsets.UTF_8);

        // Lệnh Cookie chuẩn WebDriver Java: addCookie + getCookieNamed + getCookies
        Cookie tokenCookie = new Cookie.Builder("partime_cookie_token_" + role, token).path("/").build();
        Cookie activeCookie = new Cookie.Builder("partime_cookie_active_" + role, "true").path("/").build();
        driver.manage().addCookie(tokenCookie);
        driver.manage().addCookie(activeCookie);

        // Lưu nếu chuỗi user JSON mã hóa vừa chuẩn giới hạn 4KB của Cookie
        if (encodedUser.length() <= 3500) {
            Cookie userCookie = new Cookie.Builder("partime_cookie_user_" + role, encodedUser).path("/").build();
            driver.manage().addCookie(userCookie);
        }

        // Thu thập toàn bộ cookies hiện có bằng driver.manage().getCookies() (Lệnh 46 PLT Solutions PDF)
        Set<Cookie> browserCookies = driver.manage().getCookies();
        List<Map<String, Object>> serializedCookies = new ArrayList<>();
        for (Cookie c : browserCookies) {
            Map<String, Object> cm = new LinkedHashMap<>();
            cm.put("name", c.getName());
            cm.put("value", c.getValue());
            cm.put("domain", c.getDomain());
            cm.put("path", c.getPath());
            cm.put("isSecure", c.isSecure());
            cm.put("isHttpOnly", c.isHttpOnly());
            serializedCookies.add(cm);
        }

        Map<String, Object> sessionFile = new LinkedHashMap<>();
        sessionFile.put("role", role);
        sessionFile.put("savedAt", new Date().toString());
        sessionFile.put("authToken", token);
        sessionFile.put("authUserJson", userJson);
        sessionFile.put("cookies", serializedCookies);

        MAPPER.writeValue(getRoleCookieFile(role), sessionFile);
    }

    /**
     * Lần chạy tiếp theo: Mở URL, nạp lại Cookie qua driver.manage().addCookie(),
     * đồng bộ token từ Cookie vào trình duyệt và refresh() để vào thẳng mà không phải gõ lại.
     */
    @SuppressWarnings("unchecked")
    public boolean restoreSessionFromCookie(WebDriver driver, JavascriptExecutor js, String role, String portalUrl) throws IOException {
        if (!hasSavedSession(role)) return false;
        File f = getRoleCookieFile(role);

        Map<String, Object> sessionFile = MAPPER.readValue(f, new TypeReference<>() {});
        String authToken = String.valueOf(sessionFile.getOrDefault("authToken", ""));
        String authUserJson = String.valueOf(sessionFile.getOrDefault("authUserJson", ""));
        if (authToken.isBlank() || authUserJson.isBlank()) return false;

        String curUrl = "";
        try { curUrl = driver.getCurrentUrl(); } catch (Exception ignored) {}
        if (!curUrl.startsWith("http") || !curUrl.contains("parttime-css0.onrender.com")) {
            driver.get(portalUrl);
        } else if (!curUrl.equals(portalUrl) && !curUrl.equals(portalUrl + "/")) {
            driver.get(portalUrl);
        }

        List<Map<String, Object>> cookies = (List<Map<String, Object>>) sessionFile.getOrDefault("cookies", List.of());
        for (Map<String, Object> cm : cookies) {
            String name = String.valueOf(cm.get("name"));
            String val = String.valueOf(cm.get("value"));
            String path = String.valueOf(cm.getOrDefault("path", "/"));
            try {
                driver.manage().addCookie(new Cookie.Builder(name, val).path(path).build());
            } catch (Exception ignored) {
                // Bỏ qua cookie khác domain nếu có
            }
        }

        // Luôn ưu tiên token mới nhất từ sessionFile (sau auto-refresh) + verify Browser Cookie
        Cookie verified = driver.manage().getCookieNamed("partime_cookie_token_" + role);
        String tokenToInject = (verified != null && isJwtTokenFresh(verified.getValue(), 1800)) ? verified.getValue() : authToken;

        Cookie userCookie = driver.manage().getCookieNamed("partime_cookie_user_" + role);
        String userToInject = authUserJson;
        if (userToInject.isBlank() && userCookie != null) {
            userToInject = URLDecoder.decode(userCookie.getValue(), StandardCharsets.UTF_8);
        }

        js.executeScript(
                "localStorage.setItem('partime_' + arguments[0] + '_token', arguments[1]);" +
                "localStorage.setItem('partime_' + arguments[0] + '_user', arguments[2]);" +
                "localStorage.setItem('partime_token', arguments[1]);" +
                "localStorage.setItem('partime_user', arguments[2]);" +
                "sessionStorage.setItem('partime_tab_active_' + arguments[0], 'true');" +
                "sessionStorage.setItem('partime_tab_role', arguments[0]);",
                role, tokenToInject, userToInject
        );

        driver.navigate().refresh(); // Lệnh 5 PLT Solutions PDF
        try { Thread.sleep(1000); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
        return String.valueOf(js.executeScript("return sessionStorage.getItem('partime_tab_active_' + arguments[0]);", role)).equals("true");
    }

    private void showManualBanner(JavascriptExecutor js, String role, long remainSec) {
        try {
            js.executeScript(
                    "let b = document.getElementById('selenium-live-banner');" +
                    "if (!b) { b = document.createElement('div'); b.id = 'selenium-live-banner';" +
                    "b.style.cssText='position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:999999;" +
                    "background:#9a3412;color:#fef3c7;padding:10px 22px;border-radius:999px;font-family:sans-serif;" +
                    "font-weight:700;font-size:14px;box-shadow:0 10px 25px rgba(0,0,0,0.45);border:2px solid #f59e0b;pointer-events:none;';" +
                    "document.body.appendChild(b); }" +
                    "b.innerText='[LẦN ĐẦU - ' + arguments[0].toUpperCase() + '] Vui lòng ĐĂNG NHẬP THỦ CÔNG trên màn hình (còn ' + arguments[1] + 's) — Sau khi vào trang chính sẽ TỰ ĐỘNG LƯU COOKIE!';",
                    role, remainSec
            );
        } catch (Exception ignored) {}
    }
}
