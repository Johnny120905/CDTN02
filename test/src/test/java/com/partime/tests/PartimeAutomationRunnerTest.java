package com.partime.tests;

import com.partime.pages.AdminPage;
import com.partime.pages.EmployerPage;
import com.partime.pages.StudentPage;
import com.partime.utils.ExcelTestManager;
import com.partime.utils.ScenarioResult;
import org.testng.Assert;
import org.testng.SkipException;
import org.testng.annotations.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Bộ điều phối kiểm thử tự động Data-Driven + Page Object Model (POM) cho 3 Role PARTIME.VN.
 * - Đọc 245 Test Cases từ TestCases_Selenium_PARTIME_VN.xlsx.
 * - Sử dụng chung 1 WebDriver trình chiếu Chrome/Edge và lưu/nạp Cookie đăng nhập cho 3 Role.
 * - Gom kết quả sạch trong RAM và đồng bộ 1 lần xuống Excel sau khi kết thúc để tránh lỗi khóa file I/O.
 */
public class PartimeAutomationRunnerTest {

    private static final String EXCEL_PATH = "TestCases_Selenium_PARTIME_VN.xlsx";
    private ExcelTestManager excelManager;
    private Map<String, String> envConfig;
    private StudentPage studentPage;
    private EmployerPage employerPage;
    private AdminPage adminPage;

    @BeforeClass
    public void setUpSuite() throws IOException {
        excelManager = new ExcelTestManager(EXCEL_PATH);
        envConfig = excelManager.readConfigEnvironment();

        studentPage = new StudentPage();
        studentPage.initDriver(envConfig);

        employerPage = new EmployerPage();
        employerPage.attachSharedContext(studentPage);

        adminPage = new AdminPage();
        adminPage.attachSharedContext(studentPage);
    }

    @DataProvider(name = "excelHybridTestCases")
    public Object[][] provideAllRoleTestCases() throws IOException {
        String roleFilter = System.getProperty("roleFilter", "").trim().toUpperCase();
        List<Map<String, String>> allCases = new ArrayList<>();
        if (roleFilter.isEmpty() || "SV".equals(roleFilter) || "STUDENT".equals(roleFilter)) {
            allCases.addAll(excelManager.readRoleTestCases("TestCases_Role Sinh viên"));
        }
        if (roleFilter.isEmpty() || "NTD".equals(roleFilter) || "EMPLOYER".equals(roleFilter)) {
            allCases.addAll(excelManager.readRoleTestCases("TestCases_Role Nhà tuyển dụng"));
        }
        if (roleFilter.isEmpty() || "QTV".equals(roleFilter) || "ADMIN".equals(roleFilter)) {
            allCases.addAll(excelManager.readRoleTestCases("TestCases_Role Quản trị viên"));
        }

        Object[][] data = new Object[allCases.size()][1];
        for (int i = 0; i < allCases.size(); i++) {
            data[i][0] = allCases.get(i);
        }
        return data;
    }

    @Test(dataProvider = "excelHybridTestCases")
    public void runHybridTestCase(Map<String, String> tcRow) throws Exception {
        String tcId = tcRow.get("TC_ID");
        String sheetName = tcRow.get("_sheetName");
        int rowIndex = Integer.parseInt(tcRow.get("_rowIndex"));
        String runMode = tcRow.getOrDefault("Run_Mode", "YES");
        String pomMethod = tcRow.getOrDefault("POM_Method", "");
        String input1 = tcRow.getOrDefault("Input_Data_1", "");
        String input2 = tcRow.getOrDefault("Input_Data_2", "");
        String baseUrl = envConfig.getOrDefault("BASE_URL", "https://parttime-css0.onrender.com");

        if (!"YES".equalsIgnoreCase(runMode)) {
            throw new SkipException("Run_Mode = NO (Tầng Unit/API/JMeter tách riêng)");
        }

        ensureBrowserSessionAlive();

        try {
            ScenarioResult result;
            if (tcId.startsWith("TC-SV-")) {
                result = studentPage.executeScenario(tcId, pomMethod, input1, input2, baseUrl);
            } else if (tcId.startsWith("TC-NTD-")) {
                result = employerPage.executeScenario(tcId, pomMethod, input1, input2, baseUrl);
            } else {
                result = adminPage.executeScenario(tcId, pomMethod, input1, input2, baseUrl);
            }

            if (result.getStatus() == ScenarioResult.Status.NOT_RUN_WAIT_COOKIE) {
                excelManager.bufferExecutionResult(sheetName, rowIndex, tcId, "NOT RUN", result.getLogMessage());
                throw new SkipException(result.getLogMessage());
            }

            if (result.getStatus() == ScenarioResult.Status.FAIL) {
                String shotPath = studentPage.captureScreenshot(tcId);
                String errMsg = result.getLogMessage() + " | Screenshot: " + shotPath;
                excelManager.bufferExecutionResult(sheetName, rowIndex, tcId, "FAIL", errMsg);
                Assert.fail(errMsg);
            }

            excelManager.bufferExecutionResult(sheetName, rowIndex, tcId, "PASS", result.getLogMessage());
        } catch (SkipException skip) {
            throw skip;
        } catch (Throwable ex) {
            String shotPath = studentPage.captureScreenshot(tcId);
            String errMsg = ex.getClass().getSimpleName() + ": " + ex.getMessage() + " | Screenshot: " + shotPath;
            excelManager.bufferExecutionResult(sheetName, rowIndex, tcId, "FAIL", errMsg);
            throw ex;
        }
    }

    @AfterClass(alwaysRun = true)
    public void tearDownSuite() {
        try {
            if (excelManager != null) {
                boolean isHeadless = Boolean.parseBoolean(System.getProperty("headless", envConfig.getOrDefault("HEADLESS_MODE", "FALSE")));
                String modeDesc = isHeadless ? "Headless Chrome" : "Headed Chrome (Trình chiếu trực quan)";
                String outFile = excelManager.flushAllBufferedResults(
                        "Google Chrome + Selenium WebDriver 4 Java POM (" + modeDesc + " | Cookie Session)"
                );
                System.out.println("[PARTIME.VN] Đã đồng bộ kết quả kiểm thử vào: " + outFile);
            }
        } catch (IOException ex) {
            System.err.println("[CẢNH BÁO] Lỗi ghi Excel: " + ex.getMessage());
        }
        if (studentPage != null) {
            studentPage.quitDriver();
        }
    }

    private void ensureBrowserSessionAlive() {
        if (studentPage != null && !studentPage.isSessionAlive()) {
            studentPage.quitDriver();
            studentPage.initDriver(envConfig);
            employerPage.attachSharedContext(studentPage);
            adminPage.attachSharedContext(studentPage);
        }
    }
}
