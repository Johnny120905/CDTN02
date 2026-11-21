# BUG LOG — chỗ web làm khác tài liệu, phát hiện bằng test Python (Lê Thị Thuỳ Ngân)

**Cập nhật 21/11/2026:** chỉ tính là bug khi web làm **khác tài liệu của nhóm** (`tailieu/bailam/Tonghop.xlsx`, `dieukienrangbuoc.md`, `noidung.md`, kịch bản TC gốc).
Test nằm trong `test/python/test_doi_chieu_tai_lieu.py` (trước đây `test_known_bugs.py`), **tên test đặt theo mã TC/BR**, mã BUG chỉ dùng trong file này.
Khi Backend được sửa, chạy lại `run_python_tests.bat`: test chuyển PASS thì đổi cột "Trạng thái" thành "Đã sửa <ngày>, kiểm thử lại PASS" (KHÔNG xóa dòng, giữ làm minh chứng và kiểm thử hồi quy).
**Không sửa test cho PASS.**

Cách chạy riêng 1 test (đứng ở thư mục `test\python`):
```
python -X utf8 -m unittest -v test_doi_chieu_tai_lieu.DoiChieuTaiLieuTest.test_TC_QTV_029_tu_choi_GPKD_bat_buoc_ly_do
```

## Bug đã phát hiện (10, đã sửa hết ngày 21/11/2026)

| Mã | Mức độ | Phân hệ | Căn cứ tài liệu | Hiện tượng | Mong đợi theo tài liệu | Test phát hiện | Trạng thái |
|---|---|---|---|---|---|---|---|
| BUG-04 | TB | QTV `api/admin` | TC-QTV-029 (kịch bản gốc), BR-QTV-04, FR-QTV-04.04 | Từ chối GPKD bỏ trống lý do vẫn trả 200 | 400 | `test_TC_QTV_029_tu_choi_GPKD_bat_buoc_ly_do` | Đã sửa 21/11/2026 (Vũ Thế Long), kiểm thử lại Python PASS |
| BUG-05 | TB | QTV `api/admin` | TC-QTV-064 (kịch bản gốc), BR-QTV-04 ("thuộc {Đã duyệt, Từ chối}") | Thẩm định GPKD với trạng thái lạ `abc_xyz` vẫn 200 | 400 | `test_TC_QTV_064_trang_thai_GPKD_la_bi_chan` | Đã sửa 21/11 (Long), kiểm thử lại PASS |
| BUG-06 | TB | QTV `api/admin` | FR-QTV-05.04 ("lý do ẩn bắt buộc"), TC-QTV-023 | Ẩn tin vi phạm không có lý do vẫn 200 | 400 | `test_TC_QTV_023_an_tin_bat_buoc_ly_do` | Đã sửa 21/11 (Long), kiểm thử lại PASS |
| BUG-07 | TB | QTV `api/admin` | TC-QTV-064 (kịch bản gốc: sai ID -> 404) | Khóa user / ẩn tin với ID không tồn tại vẫn báo thành công | 404 | `test_TC_QTV_064_ID_khong_ton_tai_tra_404` | Đã sửa 21/11 (Long), kiểm thử lại PASS |
| BUG-09 | TB | SV `api/student` | FR-SV-06.01, `dieukienrangbuoc.md` dòng 85, `noidung.md` dòng 606 | SV chưa có CV vẫn nộp đơn thành công 201 | Chặn, yêu cầu tải CV | `test_TC_SV_044_chua_co_CV_khong_duoc_nop_don` | Đã sửa 21/11 (Long), kiểm thử lại PASS |
| BUG-10 | TB | Dùng chung chat | BR-CH-10, `dieukienrangbuoc.md` dòng 109 | Đơn bị Từ chối: NTD bị khóa chat nhưng SV vẫn gửi tin được | Chỉ đọc cho cả 2 phía (403) | `test_TC_SV_075_don_bi_tu_choi_SV_khong_gui_duoc_tin` | Đã sửa 21/11 (Long), kiểm thử lại PASS |
| BUG-11 | Thấp | QTV `api/admin` | BR-QTV-07 ("tên danh mục sau cắt khoảng trắng != rỗng") | Sửa tên danh mục thành chuỗi trắng vẫn 200 | 400 | `test_BR_QTV_07_sua_ten_danh_muc_rong_bi_chan` | Đã sửa 21/11 (Long), kiểm thử lại PASS |
| BUG-13 | TB | Dùng chung upload | TC-SV-061 (kịch bản gốc), BR-SV-03 ("định dạng thực == PDF"), NFR-05, `dieukienrangbuoc.md` dòng 78 | Tệp `.exe` đổi đuôi `.pdf` vẫn tải lên được | 400 | `test_TC_SV_061_chan_file_gia_PDF` | Đã sửa 21/11/2026 (Vũ Thế Long), kiểm thử lại Python PASS |
| BUG-14 | Thấp | QTV `api/admin` | TC-QTV-050 (kịch bản gốc: "không trùng lặp") | Thêm danh mục trùng tên (sau khi cắt khoảng trắng) vẫn 201 | 400/409 | `test_TC_QTV_050_chan_danh_muc_trung_ten` | Đã sửa 21/11/2026 (Vũ Thế Long), kiểm thử lại Python PASS |
| BUG-15 | Thấp | QTV `api/admin` | FR-QTV-09.04, BR-QTV-08 ("thuộc {pending, investigating, resolved, dismissed}") | Cập nhật phiếu khiếu nại với trạng thái lạ vẫn 200 | 400 | `test_FR_QTV_09_04_trang_thai_khieu_nai_chi_4_gia_tri` | Đã sửa 21/11 (Long), kiểm thử lại PASS |

## Đã bỏ khỏi danh sách bug ngày 21/11/2026 (web khớp tài liệu)

| Mã cũ | Nội dung cũ | Lý do bỏ |
|---|---|---|
| BUG-01 | API `/send-otp` trả kèm mã OTP | Không tài liệu nào cấm; tài liệu chỉ quy định OTP gửi về Gmail và người dùng tự nhập (web làm đúng). |
| BUG-02 | Đăng ký được bằng mã `654321` | `dieukienrangbuoc.md` dòng 63 và `noidung.md` dòng 1069 ghi rõ đây là mã nội bộ cho luồng dev. Test đổi thành `test_BR_CH_04_nhap_sai_OTP_bi_chan` (nhập sai mã thì bị chặn, đang PASS). |
| BUG-03 | API đăng ký nhận email `@yahoo.com` | BR-CH-01 quy định báo lỗi ngay trên màn hình; giao diện đã chặn (TC-SV-003). TC-SV-013 khôi phục như bản gốc. |
| BUG-08 | MST 11–12 số vẫn đăng ký được | FR-NTD-01.01, BR-NTD-01, `dieukienrangbuoc.md` dòng 91 ghi MST "từ 10 đến 13 chữ số". Riêng kịch bản TC-NTD-008 ghi "chỉ 10 hoặc 13", đang lệch FR (cần nhóm chọn 1 cách ghi). |
| BUG-12 | API sửa hồ sơ nhận SĐT sai | BR-SV-02 quy định báo lỗi dưới ô SĐT trên màn hình; giao diện đã chặn (TC-SV-064). TC-SV-068 khôi phục như bản gốc. |

## Ghi chú kỹ thuật (KHÔNG tính là bug vì tài liệu không quy định; chỉ để nhóm tham khảo)
- `Backend/src/core/config.py` ghi cứng chuỗi kết nối MongoDB Atlas (có mật khẩu) trong code: nên chuyển hết vào `.env`.
- `hash_password()` dùng muối (salt) cố định cho mọi tài khoản: 2 người cùng mật khẩu sẽ có cùng chuỗi băm.
- Khi mọi đánh giá của 1 công ty bị ẩn, điểm trung bình quay về 5.0 (nên là "Chưa có đánh giá").
- `PUT /api/admin/categories/<id>` ghi thẳng toàn bộ JSON gửi lên vào DB (`$set: data`), có thể ghi đè trường không mong muốn.

## Ghi chú lỗi dữ liệu (không tính là bug code)

- 21/11/2026, TC-QTV-026: 1 doanh nghiệp có GPKD trỏ tới tệp cũ `/uploads/gpkd_b1c51471.pdf` đã mất trên Render (web báo "Tệp tin không tồn tại hoặc đã được dọn dẹp."). Xử lý: tải lại GPKD bằng tài khoản NTD đó (lưu vào MongoDB), Admin duyệt lại. Chạy lại PASS.