/**
 * Shared Excel (.xls UTF-8 HTML Spreadsheet) export utility for all 3 portals (Student, Employer, Admin).
 */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function exportTablesToExcelHtml({
  filename = 'BaoCao_PartimeVN.xls',
  title = 'BÁO CÁO DỮ LIỆU PARTIME.VN',
  subtitle = '',
  tables = []
}) {
  const exportedAt = new Date().toLocaleString('vi-VN');
  const sectionsHtml = tables
    .map((tbl, idx) => {
      const headersHtml = (tbl.headers || [])
        .map((h) => `<th>${escapeHtml(h)}</th>`)
        .join('');
      const rows = tbl.rows || [];
      const bodyHtml = rows.length
        ? rows
            .map(
              (row) =>
                `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
            )
            .join('')
        : `<tr><td colspan="${Math.max(1, (tbl.headers || []).length)}">Chưa có dữ liệu</td></tr>`;

      return `
        <div class="section-title">${idx + 1}. ${escapeHtml(tbl.title || tbl.sheetTitle || 'BẢNG DỮ LIỆU')} (${rows.length} dòng)</div>
        <table>
          <thead><tr>${headersHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      `;
    })
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; }
        .header { text-align: center; margin-bottom: 16px; }
        .title { font-size: 18px; font-weight: bold; color: #1e40af; }
        .sub { font-size: 12px; color: #475569; margin-top: 4px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #1e40af; color: #ffffff; font-weight: bold; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .section-title { font-size: 14px; font-weight: bold; color: #0f172a; margin: 16px 0 8px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${escapeHtml(title)}</div>
        ${subtitle ? `<div class="sub">${escapeHtml(subtitle)}</div>` : ''}
        <div class="sub">Ngày xuất: ${escapeHtml(exportedAt)} | Hệ thống Tuyển dụng Việc làm Part-time PARTIME.VN</div>
      </div>
      ${sectionsHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
