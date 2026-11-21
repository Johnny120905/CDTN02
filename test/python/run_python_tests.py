# -*- coding: utf-8 -*-
"""
[Thêm 20/11/2026 - Ngân] Chạy toàn bộ test Python (Unit + Integration trên dữ liệu RAM, KHÔNG chạm MongoDB Atlas / Render).

Cách chạy (đứng ở thư mục test):
    python -X utf8 python/run_python_tests.py            -> chạy + in tóm tắt + ghi python/ket_qua_python.json
    python -X utf8 python/run_python_tests.py --excel    -> thêm: ghi cột Kết quả vào sheet 'TestCases_Python' của file Excel
Yêu cầu: pip install -r ../Backend/requirements.txt  (openpyxl chỉ cần khi dùng --excel)
"""
import json
import os
import sys
import time
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)


def collect(suite):
    for t in suite:
        if isinstance(t, unittest.TestSuite):
            yield from collect(t)
        else:
            yield t


class _Result(unittest.TextTestResult):
    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.rows = {}

    def _put(self, test, status, detail=""):
        self.rows[test.id()] = {"status": status, "detail": detail[-800:]}

    def addSuccess(self, test):
        super().addSuccess(test); self._put(test, "PASS")

    def addFailure(self, test, err):
        super().addFailure(test, err); self._put(test, "FAIL", self._exc_info_to_string(err, test))

    def addError(self, test, err):
        super().addError(test, err); self._put(test, "ERROR", self._exc_info_to_string(err, test))


def main():
    suite = unittest.defaultTestLoader.discover(HERE, pattern="test_*.py", top_level_dir=HERE)
    tests = list(collect(suite))
    runner = unittest.TextTestRunner(verbosity=1, resultclass=_Result, stream=sys.stderr)
    res = runner.run(suite)
    out = []
    for t in tests:
        tid = t.id()
        mod, cls, name = tid.split(".")[-3:]
        doc = (getattr(t, "_testMethodDoc", "") or "").strip()
        r = res.rows.get(tid, {"status": "SKIP", "detail": ""})
        out.append({"id": f"{mod}.{cls}.{name}", "module": mod, "class": cls, "test": name, "doc": doc, **r})
    stamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(os.path.join(HERE, "ket_qua_python.json"), "w", encoding="utf-8") as f:
        json.dump({"run_at": stamp, "results": out}, f, ensure_ascii=False, indent=1)
    n_pass = sum(1 for o in out if o["status"] == "PASS")
    # [Sửa 21/11/2026 - Ngân] test_known_bugs.py đổi tên thành test_doi_chieu_tai_lieu.py (tên test theo mã TC/BR)
    bugs = [o for o in out if o["module"] == "test_doi_chieu_tai_lieu" and o["status"] != "PASS"]
    other_fail = [o for o in out if o["module"] != "test_doi_chieu_tai_lieu" and o["status"] != "PASS"]
    print(f"\n[{stamp}] Tổng {len(out)} test | PASS {n_pass} | Lệch tài liệu (bug trong BUG_LOG.md) {len(bugs)} | Lỗi ngoài danh sách bug {len(other_fail)}")
    for o in other_fail:
        print("  !! LỖI MỚI:", o["id"])
    if "--excel" in sys.argv:
        write_excel(out, stamp)
    return 0 if not other_fail else 1


def write_excel(out, stamp):
    import openpyxl
    from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE
    path = os.path.join(HERE, "..", "TestCases_Selenium_PARTIME_VN.xlsx")
    wb = openpyxl.load_workbook(path)
    if "TestCases_Python" not in wb.sheetnames:
        print("Không thấy sheet TestCases_Python trong file Excel."); return
    ws = wb["TestCases_Python"]
    head = [c.value for c in ws[3]]
    c_id, c_res, c_log = head.index("Test_ID_Python") + 1, head.index("Ket_Qua") + 1, head.index("Log_Loi") + 1
    by_id = {o["id"]: o for o in out}
    for row in range(4, ws.max_row + 1):
        o = by_id.get(ws.cell(row, c_id).value)
        if o:
            ws.cell(row, c_res).value = o["status"]
            # [Sửa 21/11/2026 - Ngân] bỏ ký tự điều khiển (Python 3.13+ trên Windows có thể chèn) để openpyxl ghi được
            log = (o["detail"].strip().splitlines() or [""])[-1][:300]
            ws.cell(row, c_log).value = ILLEGAL_CHARACTERS_RE.sub("", log)
    ws.cell(2, 1).value = f"Lần chạy gần nhất: {stamp}"
    wb.save(path)
    print("Đã ghi kết quả vào sheet TestCases_Python.")


if __name__ == "__main__":
    sys.exit(main())
