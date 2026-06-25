import { useState, useCallback, useRef } from 'react';
import { Home, ChevronRight, ChevronLeft, SlidersHorizontal, LineChart, Play } from 'lucide-react';
import './index.css';
import { Sidebar } from './components/Sidebar';
import { RegionSelect } from './components/RegionSelect';
import { ApplyCrawlModal } from './components/ApplyCrawlModal';
import { ApartmentDetailModal } from './components/ApartmentDetailModal';
import { ApplySlotModal } from './components/ApplySlotModal';
import {
  RegionItem, RegionSelection, CollectItem, CollectStatus, ApartmentDetail,
  ApplyApartment, ApplySearchMeta, ApplySavedSlot,
} from './types';
import { toApplyhomeRegion } from './services/kbland';
import { useApplySlots } from './hooks/useApplySlots';
import { exportApartmentsExcel, exportApartmentsJSON, buildExportBaseName } from './services/exportExcel';

// 청약홈(applyhome)에 매핑되는 시/도만 노출 (KB의 '전남광주통합특별시' 같은 비실존 항목 제외).
const onlyApplyhomeRegions = (r: RegionItem) => !!toApplyhomeRegion(r.code);

// 시/도 드롭다운 최상단의 '전체' = 청약홈의 '공급지역 전체'.
const ALL_REGION: RegionItem = { code: 'ALL', name: '전체', level: 1 };

const CURRENT_YEAR = new Date().getFullYear();
// 과거 조회 하한 2015 (청약홈 detail/odcloud 로 그 이후 데이터 제공) ~ 내년까지.
// 최신이 위로 오도록 내림차순.
const MIN_YEAR = 2015;
const YEARS = Array.from({ length: CURRENT_YEAR + 1 - MIN_YEAR + 1 }, (_, i) => CURRENT_YEAR + 1 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

// 내보내기/슬롯 저장 시 수집할 최대 페이지 (단지별 경쟁률 크롤 비용 상한). 50p = 500건.
const MAX_COLLECT_PAGES = 50;

type Apartment = ApplyApartment;

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

// 청약결과 배지 색상 (네이버앱 톤에 맞춘 인라인 색)
function resultColor(result: string): { bg: string; fg: string } {
  if (result.includes('당해마감')) return { bg: 'rgba(239,68,68,.14)', fg: '#dc2626' };
  if (result.includes('기타마감')) return { bg: 'rgba(245,158,11,.16)', fg: '#d97706' };
  if (result.includes('접수중')) return { bg: 'rgba(59,130,246,.14)', fg: '#2563eb' };
  if (result.includes('미도래')) return { bg: 'rgba(16,185,129,.14)', fg: '#059669' };
  if (result.includes('미달')) return { bg: 'rgba(100,116,139,.14)', fg: '#64748b' };
  return { bg: 'rgba(100,116,139,.12)', fg: '#64748b' };
}

function rateClass(rate: number): string {
  if (rate >= 100) return 'rate-high';
  if (rate >= 10) return 'rate-mid';
  if (rate >= 1) return 'rate-low';
  return 'rate-zero';
}

// 검색 조건 → 청약홈 쿼리 문자열
function queryFromMeta(m: ApplySearchMeta, page: number): string {
  return new URLSearchParams({
    ...(m.regionCode ? { region: m.regionCode } : {}),
    startDate: m.startDate,
    endDate: m.endDate,
    ...(m.keyword ? { keyword: m.keyword } : {}),
    page: String(page),
    limit: '10',
  }).toString();
}

export default function App() {
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [ctrlCollapsed, setCtrlCollapsed] = useState(false);

  const [region, setRegion] = useState<RegionSelection>({ large: null, mid: null, small: null });
  const [startYear, setStartYear] = useState(String(CURRENT_YEAR));
  const [startMonth, setStartMonth] = useState('01');
  const [endYear, setEndYear] = useState(String(CURRENT_YEAR));
  const [endMonth, setEndMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [keyword, setKeyword] = useState('');

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 현재 표시 중인 결과의 검색 조건 (페이지 이동·내보내기·재검색에 사용)
  const [activeMeta, setActiveMeta] = useState<ApplySearchMeta | null>(null);
  const [searchRegionName, setSearchRegionName] = useState('전체');

  // 저장 슬롯 (게스트는 localStorage, 로그인 시 apply_slots)
  const slots = useApplySlots(null);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [collecting, setCollecting] = useState(false); // 내보내기/슬롯 저장용 전 페이지 수집 중
  const [collectProgress, setCollectProgress] = useState(''); // '3/7' 형태 진행률

  // 검색 진행 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [collectStatus, setCollectStatus] = useState<CollectStatus>('counting');
  const [collectItems, setCollectItems] = useState<CollectItem[]>([]);
  const [collectTotal, setCollectTotal] = useState(0);
  const [collectTotalPages, setCollectTotalPages] = useState(1);
  const [collectPage, setCollectPage] = useState(1);
  const [durationSec, setDurationSec] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const startRef = useRef(0);

  // 현재 폼 상태의 검색 조건 스냅샷
  const currentMeta = useCallback((): ApplySearchMeta => ({
    regionName: region.large?.name ?? '전체',
    regionCode: toApplyhomeRegion(region.large?.code) || undefined,
    startDate: `${startYear}${startMonth}`,
    endDate: `${endYear}${endMonth}`,
    keyword: keyword || undefined,
  }), [region, startYear, startMonth, endYear, endMonth, keyword]);

  // 메인 검색 — SSE 스트리밍으로 진행률 모달을 띄운다. meta 미지정 시 현재 폼 조건.
  const runSearch = useCallback((page = 1, meta?: ApplySearchMeta) => {
    esRef.current?.close();

    const m = meta ?? currentMeta();
    setActiveMeta(m);
    setSearchRegionName(m.regionName);
    setLoading(true);
    setSearched(true);
    setModalOpen(true);
    setCollectStatus('counting');
    setCollectItems([]);
    setCollectTotal(0);
    setCollectTotalPages(1);
    setCollectPage(page);
    startRef.current = Date.now();

    const es = new EventSource(`/api/apartments/search/stream?${queryFromMeta(m, page)}`);
    esRef.current = es;

    es.addEventListener('total', (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setCollectTotal(d.totalCount);
      setCollectTotalPages(d.totalPages);
      setCollectStatus('running');
    });

    es.addEventListener('listed', (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setCollectItems(
        (d.items as Array<{ index: number; region: string; houseName: string }>).map((it) => ({
          ...it,
          status: 'pending' as const,
        }))
      );
    });

    es.addEventListener('progress', (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setCollectItems((prev) =>
        prev.map((it) =>
          it.index === d.index
            ? {
                ...it,
                status: d.stage === 'done' ? 'done' : 'active',
                averageCompetitionRate: d.averageCompetitionRate ?? it.averageCompetitionRate,
                subscriptionResult: d.subscriptionResult ?? it.subscriptionResult,
              }
            : it
        )
      );
    });

    es.addEventListener('done', (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setApartments(d.apartments || []);
      setPagination(d.pagination || null);
      setCurrentPage(page);
      setCollectItems((prev) => prev.map((it) => ({ ...it, status: 'done' as const })));
      setDurationSec(Math.round((Date.now() - startRef.current) / 1000));
      setCollectStatus('done');
      setLoading(false);
      es.close();
      esRef.current = null;
    });

    es.addEventListener('failed', (e) => {
      try {
        const d = JSON.parse((e as MessageEvent).data);
        console.error('Search failed:', d.message);
      } catch { /* no-op */ }
      setApartments([]);
      setPagination(null);
      setCollectStatus('stopped');
      setLoading(false);
      es.close();
      esRef.current = null;
    });

    // EventSource 연결 오류 (서버 종료/네트워크) — 완료 전이면 중지 처리
    es.onerror = () => {
      es.close();
      esRef.current = null;
      setLoading(false);
      setCollectStatus((s) => (s === 'done' ? s : 'stopped'));
    };
  }, [currentMeta]);

  const stopSearch = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setLoading(false);
    setCollectStatus('stopped');
    setDurationSec(Math.round((Date.now() - startRef.current) / 1000));
  }, []);

  const closeModal = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setModalOpen(false);
  }, []);

  // 단지 상세 모달
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [detailData, setDetailData] = useState<ApartmentDetail | null>(null);
  const [detailApt, setDetailApt] = useState<{ houseName: string; region: string } | null>(null);

  const openDetail = useCallback(async (apt: Apartment) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(false);
    setDetailData(null);
    setDetailApt({ houseName: apt.houseName, region: apt.region });
    try {
      const qs = new URLSearchParams({
        ...(apt.pblancNo ? { pblancNo: apt.pblancNo } : {}),
        houseNm: apt.houseName || '',
      });
      const res = await fetch(`/api/apartments/${encodeURIComponent(apt.houseManageNo)}/detail?${qs}`);
      if (!res.ok) throw new Error('detail fetch failed');
      setDetailData(await res.json());
    } catch {
      setDetailError(true);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => setDetailOpen(false), []);

  // 페이지 이동 — 모달 없이 가벼운 인라인 로딩으로 처리.
  const paginate = useCallback(async (page: number) => {
    const m = activeMeta ?? currentMeta();
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/apartments/search?${queryFromMeta(m, page)}`);
      const data = await res.json();
      if (res.ok) {
        setApartments(data.apartments || []);
        setPagination(data.pagination || null);
        setCurrentPage(page);
      } else {
        setApartments([]);
        setPagination(null);
      }
    } catch {
      setApartments([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [activeMeta, currentMeta]);

  // 내보내기/슬롯 저장용 — 페이지를 순회 수집해 결과를 모은다.
  // 청약은 단지별 경쟁률을 on-demand 크롤하므로 전량 수집이 비싸다 → 상한(MAX_COLLECT_PAGES)을
  // 두고, 초과 시 상위 N건만 수집(호출부에서 알림). 진행률은 setCollectProgress 로 노출.
  const collectAll = useCallback(async (): Promise<{ meta: ApplySearchMeta; apartments: Apartment[]; count: number; capped: boolean }> => {
    const m = activeMeta ?? currentMeta();
    const first = await fetch(`/api/apartments/search?${queryFromMeta(m, 1)}`);
    const d0 = await first.json();
    const all: Apartment[] = [...((d0.apartments as Apartment[]) || [])];
    const totalPages: number = d0.pagination?.totalPages || 1;
    const count: number = d0.pagination?.totalCount ?? all.length;
    const lastPage = Math.min(totalPages, MAX_COLLECT_PAGES);
    setCollectProgress(`1/${lastPage}`);
    for (let p = 2; p <= lastPage; p++) {
      const r = await fetch(`/api/apartments/search?${queryFromMeta(m, p)}`);
      const d = await r.json();
      all.push(...((d.apartments as Apartment[]) || []));
      setCollectProgress(`${p}/${lastPage}`);
    }
    setCollectProgress('');
    return { meta: m, apartments: all, count, capped: totalPages > MAX_COLLECT_PAGES };
  }, [activeMeta, currentMeta]);

  const hasResults = !!pagination && pagination.totalCount > 0;
  const busy = loading || collecting;
  const savedCount = slots.slots.filter(Boolean).length;

  const onExportExcel = useCallback(async () => {
    setCollecting(true);
    try {
      const { meta, apartments: all, count, capped } = await collectAll();
      if (all.length === 0) return;
      await exportApartmentsExcel(all, buildExportBaseName(meta, all.length));
      if (capped) alert(`결과가 많아 상위 ${all.length.toLocaleString()}건만 내보냈습니다 (전체 ${count.toLocaleString()}건).`);
    } catch (err) {
      console.error('Excel 내보내기 실패:', err);
      alert('내보내기에 실패했습니다.');
    } finally {
      setCollecting(false);
    }
  }, [collectAll]);

  const onExportJSON = useCallback(async () => {
    setCollecting(true);
    try {
      const { meta, apartments: all, capped, count } = await collectAll();
      if (all.length === 0) return;
      exportApartmentsJSON(all, buildExportBaseName(meta, all.length));
      if (capped) alert(`결과가 많아 상위 ${all.length.toLocaleString()}건만 내보냈습니다 (전체 ${count.toLocaleString()}건).`);
    } catch (err) {
      console.error('JSON 내보내기 실패:', err);
      alert('내보내기에 실패했습니다.');
    } finally {
      setCollecting(false);
    }
  }, [collectAll]);

  // 첫 빈 슬롯에 현재 결과 저장 → 슬롯 모달 열기
  const handleSaveSlot = useCallback(async () => {
    setCollecting(true);
    try {
      const { meta, apartments: all, count, capped } = await collectAll();
      if (all.length === 0) return;
      if (capped) alert(`결과가 많아 상위 ${all.length.toLocaleString()}건만 슬롯에 저장합니다 (전체 ${count.toLocaleString()}건).`);
      const idx = slots.saveFirstEmpty(meta, count, all);
      if (idx === -1) {
        alert('저장 슬롯이 가득 찼습니다 (최대 20개). 기존 슬롯을 삭제한 뒤 다시 시도해 주세요.');
        return;
      }
      setSlotModalOpen(true);
    } catch (err) {
      console.error('슬롯 저장 실패:', err);
    } finally {
      setCollecting(false);
    }
  }, [collectAll, slots]);

  // 지정 슬롯에 저장/덮어쓰기
  const handleSaveAt = useCallback(async (index: number) => {
    setCollecting(true);
    try {
      const { meta, apartments: all, count, capped } = await collectAll();
      if (all.length === 0) return;
      if (capped) alert(`결과가 많아 상위 ${all.length.toLocaleString()}건만 슬롯에 저장합니다 (전체 ${count.toLocaleString()}건).`);
      slots.saveAt(index, meta, count, all);
    } catch (err) {
      console.error('슬롯 저장 실패:', err);
    } finally {
      setCollecting(false);
    }
  }, [collectAll, slots]);

  // 슬롯 데이터를 현재 결과로 불러오기 (저장 시점 스냅샷 표시)
  const handleLoadSlot = useCallback((slot: ApplySavedSlot) => {
    setActiveMeta(slot.meta);
    setSearchRegionName(slot.meta.regionName);
    setApartments(slot.apartments);
    setPagination({ currentPage: 1, totalPages: 1, totalCount: slot.count });
    setCurrentPage(1);
    setSearched(true);
    setSlotModalOpen(false);
  }, []);

  // 같은 조건으로 재검색 (라이브)
  const handleReSearch = useCallback((slot: ApplySavedSlot) => {
    setSlotModalOpen(false);
    runSearch(1, slot.meta);
  }, [runSearch]);

  const regionPreview = region.large
    ? [region.large.name, region.mid?.name, region.small?.name].filter(Boolean).join(' ')
    : null;
  const applyRegionLabel = toApplyhomeRegion(region.large?.code);

  const wsState = loading ? 'run' : apartments.length > 0 ? '' : 'off';
  const statusText = loading
    ? '청약 데이터 조회 중'
    : pagination
      ? `${pagination.totalCount.toLocaleString()}건 조회됨`
      : 'applyhome 청약 · 대기 중';

  const pageNumbers = () => {
    if (!pagination) return [];
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(pagination.totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className={`eos-app${sideCollapsed ? ' side-collapsed' : ''}`}>
      <Sidebar collapsed={sideCollapsed} onToggleCollapse={() => setSideCollapsed((v) => !v)} />

      <div className="eos-main">
        <header className="eos-hdr">
          <div className="eos-crumb">
            <Home className="home" />
            <ChevronRight className="sep" />
            <span>분석 모듈</span>
            <ChevronRight className="sep" />
            <b>지역별 청약현황</b>
            <span className="tag">LIVE</span>
          </div>

          <div className="eos-hdr-right">
            <div className={`eos-ws ${wsState}`}>
              <span className="wd" />
              <span>{statusText}</span>
            </div>
          </div>
        </header>

        <div className={`eos-work${ctrlCollapsed ? ' ctrl-collapsed' : ''}`}>
          {/* ── 검색 조건 패널 ── */}
          <aside className="eos-ctrl">
            <div className="eos-ctrl-head">
              <div className="ch-ic">
                <SlidersHorizontal />
              </div>
              <b>검색 조건</b>
              <button className="eos-ctrl-toggle" title="패널 접기" onClick={() => setCtrlCollapsed((v) => !v)}>
                <ChevronLeft />
              </button>
            </div>

            <div className="eos-ctrl-body">
              <RegionSelect
                value={region}
                onChange={setRegion}
                disabled={loading}
                sidoOnly
                filterLarge={onlyApplyhomeRegions}
                allOption={ALL_REGION}
              />

              {regionPreview && (
                <div className="keyword-preview">
                  <span className="keyword-label">지역</span>
                  <span className="keyword-value">{regionPreview}</span>
                  {applyRegionLabel && <span className="keyword-code">청약필터: {applyRegionLabel}</span>}
                </div>
              )}

              <div className="region-select">
                <label className="form-label">모집공고 기간</label>
                <div className="region-select-row">
                  <div className="select-wrapper">
                    <select className="form-select" value={startYear} onChange={(e) => setStartYear(e.target.value)} disabled={loading}>
                      {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
                    </select>
                  </div>
                  <div className="select-wrapper">
                    <select className="form-select" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} disabled={loading}>
                      {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
                    </select>
                  </div>
                </div>
                <div className="region-select-row" style={{ marginTop: 8 }}>
                  <div className="select-wrapper">
                    <select className="form-select" value={endYear} onChange={(e) => setEndYear(e.target.value)} disabled={loading}>
                      {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
                    </select>
                  </div>
                  <div className="select-wrapper">
                    <select className="form-select" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} disabled={loading}>
                      {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="region-select">
                <label className="form-label">단지명 검색</label>
                <input
                  className="search-input"
                  style={{ width: '100%' }}
                  type="text"
                  placeholder="예) 래미안, 힐스테이트"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch(1)}
                  disabled={loading}
                />
              </div>

              <div className="run-btn-wrap">
                <button className="eos-run-btn" onClick={() => runSearch(1)} disabled={loading}>
                  <Play />
                  {loading ? '조회 중…' : '청약 조회 실행'}
                </button>
              </div>
            </div>
          </aside>

          {/* ── 결과 영역 ── */}
          <main className="eos-view">
            <div className="eos-card grow nv-result-card">
              {!searched ? (
                <div className="nv-result-empty">
                  <LineChart strokeWidth={1.6} />
                  <h2>아직 조회 전입니다</h2>
                  <p>좌측에서 지역·기간을 설정한 뒤 <b>청약 조회 실행</b>을 눌러주세요.</p>
                </div>
              ) : (
                <>
                  <div className="result-header">
                    <span className="result-title">청약 경쟁률 조회 결과</span>
                  </div>

                  <div className="result-table-container">
                    <div className="result-toolbar">
                      <div className="result-info">
                        <span className="result-count">
                          {pagination ? <>총 <strong>{pagination.totalCount.toLocaleString()}</strong>건</> : '—'}
                        </span>
                      </div>

                      <div className="result-actions">
                        <button className="btn-outline btn-sm" onClick={onExportExcel} disabled={!hasResults || busy}>
                          {collecting ? (collectProgress ? `수집 ${collectProgress}…` : '수집 중…') : 'Excel 내보내기'}
                        </button>
                        <button className="btn-outline btn-sm" onClick={onExportJSON} disabled={!hasResults || busy}>
                          JSON 내보내기
                        </button>
                        <button
                          className="btn-outline btn-sm"
                          onClick={handleSaveSlot}
                          disabled={!hasResults || busy}
                          title="현재 결과를 슬롯에 저장"
                        >
                          슬롯 저장
                        </button>
                        <button className="btn-outline btn-sm" onClick={() => setSlotModalOpen(true)}>
                          저장 슬롯 {savedCount > 0 ? `(${savedCount})` : ''}
                        </button>
                      </div>
                    </div>

                    <div className="table-wrapper">
                      <table className="result-table">
                        <thead>
                          <tr>
                            <th>번호</th>
                            <th>지역</th>
                            <th>단지명</th>
                            <th>시공사</th>
                            <th>모집공고일</th>
                            <th>청약 기간</th>
                            <th>총세대수</th>
                            <th>1순위 접수</th>
                            <th>평균경쟁률</th>
                            <th>최고경쟁률</th>
                            <th>청약결과</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={11} className="table-empty">
                                <span className="cm-live-spin" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />
                                데이터를 불러오는 중…
                              </td>
                            </tr>
                          ) : apartments.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="table-empty">
                                검색 결과가 없습니다.
                              </td>
                            </tr>
                          ) : (
                            apartments.map((apt, idx) => {
                              const num = (currentPage - 1) * 10 + idx + 1;
                              const c = resultColor(apt.subscriptionResult || '');
                              return (
                                <tr
                                  key={apt.id}
                                  className="result-row"
                                  onDoubleClick={() => openDetail(apt)}
                                  title="더블클릭하면 상세 정보를 볼 수 있습니다"
                                >
                                  <td>{num}</td>
                                  <td className="td-region">{apt.region}</td>
                                  <td><span className="complex-name">{apt.houseName}</span></td>
                                  <td>{apt.constructor || '-'}</td>
                                  <td>{apt.noticeDate || '-'}</td>
                                  <td style={{ fontSize: 12 }}>{apt.subscriptionPeriod || '-'}</td>
                                  <td>{apt.totalUnits || '-'}</td>
                                  <td>{apt.firstRoundApplications || '-'}</td>
                                  <td className={`td-price ${rateClass(apt.averageCompetitionRate)}`}>
                                    {apt.averageCompetitionRate != null ? `${apt.averageCompetitionRate.toFixed(2)} : 1` : '-'}
                                  </td>
                                  <td className={`td-price ${rateClass(apt.maxCompetitionRate)}`}>
                                    {apt.maxCompetitionRate != null ? `${apt.maxCompetitionRate.toFixed(2)} : 1` : '-'}
                                  </td>
                                  <td>
                                    <span
                                      className="trade-badge"
                                      style={{ background: c.bg, color: c.fg }}
                                    >
                                      {apt.subscriptionResult || '-'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                      <div className="pagination">
                        <button className="btn-ghost btn-sm" disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)}>
                          ← 이전
                        </button>
                        {pageNumbers().map((p) => (
                          <button
                            key={p}
                            className={`btn-ghost btn-sm${p === currentPage ? ' active' : ''}`}
                            onClick={() => paginate(p)}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          className="btn-ghost btn-sm"
                          disabled={currentPage === pagination.totalPages}
                          onClick={() => paginate(currentPage + 1)}
                        >
                          다음 →
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {modalOpen && (
        <ApplyCrawlModal
          status={collectStatus}
          regionName={searchRegionName}
          items={collectItems}
          totalCount={collectTotal}
          totalPages={collectTotalPages}
          page={collectPage}
          durationSec={durationSec}
          onClose={closeModal}
          onStop={stopSearch}
        />
      )}

      {detailOpen && (
        <ApartmentDetailModal
          houseName={detailApt?.houseName ?? ''}
          region={detailApt?.region}
          loading={detailLoading}
          error={detailError}
          detail={detailData}
          onClose={closeDetail}
        />
      )}

      {slotModalOpen && (
        <ApplySlotModal
          slots={slots.slots}
          canSave={hasResults && !busy}
          onSaveAt={handleSaveAt}
          onLoad={handleLoadSlot}
          onReSearch={handleReSearch}
          onDelete={slots.deleteSlot}
          onClose={() => setSlotModalOpen(false)}
        />
      )}
    </div>
  );
}
