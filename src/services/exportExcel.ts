import type ExcelJS from 'exceljs';
import { ApplyApartment, ApplySavedSlot, ApplySearchMeta } from '../types';

// exceljs(~900KB)는 내보내기 클릭 시에만 동적 로드해 초기 번들을 가볍게 유지.
// (CJS 모듈이라 esModuleInterop 하에 .default 또는 네임스페이스로 들어옴 — 런타임 형태가
//  유동적이라 any 로 받고, 타입 안전성은 아래 워크시트 헬퍼의 ExcelJS.Workbook 파라미터로 확보)
async function loadExcelJS(): Promise<{ Workbook: new () => ExcelJS.Workbook }> {
  const mod = (await import('exceljs')) as any;
  return mod.default ?? mod;
}

/**
 * 청약 결과 Excel/JSON 내보내기. naver-kb(src/services/api.ts)의 exceljs 방식을
 * 청약 도메인 컬럼에 맞춰 이식 — 헤더 스타일, 자동필터, 정렬/숫자서식, 다운로드
 * 메커니즘 동일. 슬롯별 시트 분리 내보내기도 동일 패턴.
 */

// '1,234' | '-' → number | null (셀을 숫자로 넣어 정렬/합계가 되도록)
function toNum(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return Number.isNaN(n) ? null : n;
}

function rate(v: number): number | null {
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
}

type ColSpec = { header: string; key: string; width: number };

const COLS: ColSpec[] = [
  { header: '번호', key: 'no', width: 7 },
  { header: '지역', key: 'region', width: 10 },
  { header: '단지명', key: 'houseName', width: 32 },
  { header: '시공사', key: 'constructor', width: 22 },
  { header: '모집공고일', key: 'noticeDate', width: 14 },
  { header: '청약기간', key: 'subscriptionPeriod', width: 22 },
  { header: '당첨자발표일', key: 'announcementDate', width: 14 },
  { header: '총세대수', key: 'totalUnits', width: 10 },
  { header: '1순위접수', key: 'firstRoundApplications', width: 11 },
  { header: '평균경쟁률', key: 'averageCompetitionRate', width: 11 },
  { header: '최고경쟁률', key: 'maxCompetitionRate', width: 11 },
  { header: '청약결과', key: 'subscriptionResult', width: 14 },
];

const LEFT_KEYS = new Set(['houseName', 'constructor', 'subscriptionPeriod']);
const INT_KEYS = new Set(['totalUnits', 'firstRoundApplications']);
const RATE_KEYS = new Set(['averageCompetitionRate', 'maxCompetitionRate']);

// 워크북에 청약 결과 시트 1개 추가 (단일 / 슬롯별 시트 공용)
function addApartmentsWorksheet(workbook: ExcelJS.Workbook, sheetName: string, rows: ApplyApartment[]): void {
  const ws = workbook.addWorksheet(sheetName);
  ws.columns = COLS;

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  headerRow.height = 20;

  const lastCol = ws.getColumn(COLS.length).letter;
  ws.autoFilter = { from: 'A1', to: `${lastCol}1` };

  rows.forEach((a, i) => {
    const row = ws.addRow({
      no: i + 1,
      region: a.region || '-',
      houseName: a.houseName || '-',
      constructor: a.constructor || '-',
      noticeDate: a.noticeDate || '-',
      subscriptionPeriod: a.subscriptionPeriod || '-',
      announcementDate: a.announcementDate || '-',
      totalUnits: toNum(a.totalUnits),
      firstRoundApplications: toNum(a.firstRoundApplications),
      averageCompetitionRate: rate(a.averageCompetitionRate),
      maxCompetitionRate: rate(a.maxCompetitionRate),
      subscriptionResult: a.subscriptionResult || '-',
    });
    row.height = 16.5;

    for (let c = 1; c <= COLS.length; c++) {
      const key = COLS[c - 1].key;
      const cell = row.getCell(c);
      cell.alignment = { horizontal: LEFT_KEYS.has(key) ? 'left' : 'center', vertical: 'middle' };
      if (INT_KEYS.has(key) && typeof cell.value === 'number') cell.numFmt = '#,##0';
      else if (RATE_KEYS.has(key) && typeof cell.value === 'number') cell.numFmt = '#,##0.00';
    }
  });
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Excel 금지 문자 제거 + 31자 제한
function sanitizeSheetName(name: string): string {
  const clean = name.replace(/[\\/?*[\]:]/g, ' ').trim() || '시트';
  return clean.slice(0, 31);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
}

// 'YYYYMM' → 'YYYY.MM'
function ym(v: string): string {
  return v && v.length >= 6 ? `${v.slice(0, 4)}.${v.slice(4, 6)}` : v;
}

// 예: "2026.06.26 서울특별시 2024.01~2024.03 청약 65건"
export function buildExportBaseName(meta: ApplySearchMeta, count: number): string {
  const now = new Date();
  const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const region = (meta.regionName || '전체').trim();
  const period = meta.startDate && meta.endDate ? `${ym(meta.startDate)}~${ym(meta.endDate)}` : '';
  const kw = meta.keyword ? ` ${meta.keyword}` : '';
  return sanitizeFileName(`${date} ${region} ${period}${kw} 청약 ${count.toLocaleString()}건`);
}

// 현재 결과 단일 시트로 내보내기
export async function exportApartmentsExcel(rows: ApplyApartment[], filenameBase?: string): Promise<void> {
  if (rows.length === 0) return;
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  addApartmentsWorksheet(workbook, '청약', rows);
  const name = filenameBase ? `${filenameBase}.xlsx` : `apply_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await downloadWorkbook(workbook, name);
}

// 여러 슬롯을 슬롯별 시트로 분리해 하나의 엑셀로
export async function exportSlotsExcel(slots: ApplySavedSlot[]): Promise<void> {
  const valid = slots.filter((s) => s.apartments.length > 0);
  if (valid.length === 0) return;

  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  const used = new Set<string>();

  valid.forEach((slot, idx) => {
    let base = sanitizeSheetName(`${idx + 1}_${slot.meta.regionName || '전체'}`);
    let name = base;
    let dup = 2;
    while (used.has(name)) name = sanitizeSheetName(`${base} (${dup++})`);
    used.add(name);
    addApartmentsWorksheet(workbook, name, slot.apartments);
  });

  await downloadWorkbook(workbook, `apply_slots_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// 현재 결과 JSON 내보내기
export function exportApartmentsJSON(rows: ApplyApartment[], filenameBase?: string): void {
  if (rows.length === 0) return;
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase ? sanitizeFileName(filenameBase) : `apply_${new Date().toISOString().slice(0, 10)}`}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
