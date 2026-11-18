package com.partime.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Đọc cấu hình môi trường (Config_Environment), đọc 17 cột kịch bản từ 3 Sheet Role,
 * gom toàn bộ kết quả chạy trong bộ nhớ (tránh xung đột khóa file I/O) và ghi đồng bộ 1 lần
 * vào TestCases_Selenium_PARTIME_VN.xlsx ở cuối phiên chạy.
 */
public class ExcelTestManager {
    private final String excelFilePath;
    private final Map<String, BufferedResult> bufferedResults = new LinkedHashMap<>();
    private static final ObjectMapper JSON = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    public static class BufferedResult {
        public String sheetName;
        public int rowIndex;
        public String tcId;
        public String autoStatus;
        public String logMessage;

        public BufferedResult() {}

        public BufferedResult(String sheetName, int rowIndex, String tcId, String autoStatus, String logMessage) {
            this.sheetName = sheetName;
            this.rowIndex = rowIndex;
            this.tcId = tcId;
            this.autoStatus = autoStatus;
            this.logMessage = logMessage;
        }
    }

    public ExcelTestManager(String excelFilePath) {
        this.excelFilePath = excelFilePath;
    }

    public Map<String, String> readConfigEnvironment() throws IOException {
        Map<String, String> config = new LinkedHashMap<>();
        try (FileInputStream fis = new FileInputStream(excelFilePath);
             Workbook wb = new XSSFWorkbook(fis)) {
            Sheet sheet = wb.getSheet("Config_Environment");
            DataFormatter fmt = new DataFormatter();
            for (int r = 3; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String key = fmt.formatCellValue(row.getCell(0)).trim();
                String val = fmt.formatCellValue(row.getCell(1)).trim();
                if (!key.isEmpty()) {
                    config.put(key, val);
                }
            }
        }
        return config;
    }

    public List<Map<String, String>> readRoleTestCases(String sheetName) throws IOException {
        List<Map<String, String>> cases = new ArrayList<>();
        try (FileInputStream fis = new FileInputStream(excelFilePath);
             Workbook wb = new XSSFWorkbook(fis)) {
            Sheet sheet = wb.getSheet(sheetName);
            DataFormatter fmt = new DataFormatter();
            Row headerRow = sheet.getRow(2);
            int numCols = headerRow.getLastCellNum();

            for (int r = 3; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                Map<String, String> tcMap = new LinkedHashMap<>();
                tcMap.put("_rowIndex", String.valueOf(r));
                tcMap.put("_sheetName", sheetName);
                for (int c = 0; c < numCols; c++) {
                    String colName = fmt.formatCellValue(headerRow.getCell(c)).trim();
                    String cellVal = fmt.formatCellValue(row.getCell(c)).trim();
                    tcMap.put(colName, cellVal);
                }
                if (!tcMap.getOrDefault("TC_ID", "").isEmpty()) {
                    cases.add(tcMap);
                }
            }
        }
        return cases;
    }

    public synchronized void bufferExecutionResult(String sheetName, int rowIndex, String tcId, String autoStatus, String logOrScreenshot) {
        bufferedResults.put(sheetName + "#" + rowIndex, new BufferedResult(sheetName, rowIndex, tcId, autoStatus, logOrScreenshot));
    }

    /**
     * Ghi đồng bộ toàn bộ kết quả xuống file Excel (và backup JSON + fallback file nếu file chính đang bị mở trong Excel).
     */
    public synchronized String flushAllBufferedResults(String browserNote) throws IOException {
        File targetDir = new File("target");
        if (!targetDir.exists()) targetDir.mkdirs();
        JSON.writeValue(new File("target/latest_run_results.json"), bufferedResults.values());

        try (FileInputStream fis = new FileInputStream(excelFilePath);
             Workbook wb = new XSSFWorkbook(fis)) {

            CellStyle passStyle = createStatusStyle(wb, IndexedColors.LIGHT_GREEN.getIndex(), IndexedColors.DARK_GREEN.getIndex());
            CellStyle failStyle = createStatusStyle(wb, IndexedColors.ROSE.getIndex(), IndexedColors.DARK_RED.getIndex());
            CellStyle waitStyle = createStatusStyle(wb, IndexedColors.WHITE.getIndex(), IndexedColors.GREY_50_PERCENT.getIndex());

            for (BufferedResult br : bufferedResults.values()) {
                Sheet sheet = wb.getSheet(br.sheetName);
                if (sheet == null) continue;
                Row row = sheet.getRow(br.rowIndex);
                if (row == null) continue;

                // Xóa inlineStr XML cũ của openpyxl trước khi tạo ô String chuẩn của Apache POI
                Cell oldStatus = row.getCell(15);
                if (oldStatus != null) row.removeCell(oldStatus);
                Cell statusCell = row.createCell(15, CellType.STRING); // Cột P: Auto_Status
                statusCell.setCellValue(br.autoStatus);

                Cell oldLog = row.getCell(16);
                CellStyle logStyle = oldLog != null ? oldLog.getCellStyle() : null;
                if (oldLog != null) row.removeCell(oldLog);
                Cell logCell = row.createCell(16, CellType.STRING);    // Cột Q: Auto_Log_Error
                logCell.setCellValue(br.logMessage);
                if (logStyle != null) logCell.setCellStyle(logStyle);

                if ("PASS".equalsIgnoreCase(br.autoStatus)) {
                    statusCell.setCellStyle(passStyle);
                } else if ("FAIL".equalsIgnoreCase(br.autoStatus)) {
                    statusCell.setCellStyle(failStyle);
                } else {
                    statusCell.setCellStyle(waitStyle);
                }
            }

            Sheet ov = wb.getSheet("Overview_Summary");
            if (ov != null) {
                Row dateRow = ov.getRow(7); // Row 8: Execution Date
                if (dateRow != null) {
                    String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                    Cell oldDate = dateRow.getCell(1);
                    CellStyle st = oldDate != null ? oldDate.getCellStyle() : null;
                    if (oldDate != null) dateRow.removeCell(oldDate);
                    Cell cDate = dateRow.createCell(1, CellType.STRING);
                    cDate.setCellValue(nowStr + " — Đã chạy kiểm thử thực tế trên Render (https://parttime-css0.onrender.com)");
                    if (st != null) cDate.setCellStyle(st);
                }
                if (browserNote != null && !browserNote.isBlank()) {
                    Row brRow = ov.getRow(8);
                    if (brRow != null) {
                        Cell oldBr = brRow.getCell(1);
                        CellStyle st = oldBr != null ? oldBr.getCellStyle() : null;
                        if (oldBr != null) brRow.removeCell(oldBr);
                        Cell cBr = brRow.createCell(1, CellType.STRING);
                        cBr.setCellValue(browserNote);
                        if (st != null) cBr.setCellStyle(st);
                    }
                }
            }

            wb.setForceFormulaRecalculation(true);
            wb.getCreationHelper().createFormulaEvaluator().evaluateAll();

            try (FileOutputStream fos = new FileOutputStream(excelFilePath)) {
                wb.write(fos);
                return excelFilePath;
            } catch (IOException lockEx) {
                System.err.println("[CẢNH BÁO] Bạn đang mở file '" + excelFilePath + "' trong Excel nên Windows khóa ghi đè!");
                System.err.println("[HƯỚNG DẪN] Hãy đóng cửa sổ Excel lại rồi chạy '.\\cleanup_and_sync_excel.bat' để ghi kết quả vào duy nhất " + excelFilePath);
                return excelFilePath + " (Đang khóa — Đã lưu tạm vào target/latest_run_results.json)";
            }
        }
    }

    private CellStyle createStatusStyle(Workbook wb, short bgColor, short fontColor) {
        CellStyle style = wb.createCellStyle();
        style.setFillForegroundColor(bgColor);
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        BorderStyle bs = BorderStyle.THIN;
        style.setBorderTop(bs); style.setBorderBottom(bs); style.setBorderLeft(bs); style.setBorderRight(bs);
        Font font = wb.createFont();
        font.setFontName("Calibri");
        font.setFontHeightInPoints((short) 10);
        font.setBold(true);
        font.setColor(fontColor);
        style.setFont(font);
        return style;
    }

    /**
     * Tiện ích đồng bộ kết quả từ target/latest_run_results.json sang duy nhất file TestCases_Selenium_PARTIME_VN.xlsx.
     */
    public static void main(String[] args) throws IOException {
        File jsonFile = new File("target/latest_run_results.json");
        if (!jsonFile.exists()) jsonFile = new File("latest_run_results.json");
        ExcelTestManager mgr = new ExcelTestManager("TestCases_Selenium_PARTIME_VN.xlsx");
        List<BufferedResult> list = JSON.readValue(
                jsonFile,
                new com.fasterxml.jackson.core.type.TypeReference<List<BufferedResult>>() {}
        );
        for (BufferedResult br : list) {
            mgr.bufferExecutionResult(br.sheetName, br.rowIndex, br.tcId, br.autoStatus, br.logMessage);
        }
        String out = mgr.flushAllBufferedResults("Google Chrome 157 + Selenium WebDriver 4 Java POM (Render Deploy | Cookie Session)");
        System.out.println("Synced JSON -> " + out);
    }
}
