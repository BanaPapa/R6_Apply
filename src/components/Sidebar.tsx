import React from 'react';
import {
  LineChart, BarChart3, Building2, TrendingUp, FileCheck2, MessageCircle,
  Store, ShoppingBag, MapPin, GraduationCap, Building, ChevronLeft, Settings,
} from 'lucide-react';

// 네이버앱(R3_Naver) 사이드바를 그대로 따른 좌측 네비게이션.
// 이 앱은 '지역별 청약현황' 모듈에 해당하므로 해당 항목만 live/active 이고
// 나머지는 개발 예정(soon)으로 비활성 표시한다.
// 아이콘은 naver-kb와 동일하게 lucide-react로 통일 (기존 .ic CSS가 크기·굵기·색을 유지).

const SOON_TIP = '현재 개발중이므로 추가예정입니다';

type ModStatus = 'live' | 'soon';

interface NavModule {
  key: string;
  label: string;
  status: ModStatus;
  active?: boolean;
  icon: React.ReactElement;
}

const NAV_MODULES: NavModule[] = [
  { key: 'kb-timeseries', label: 'KB 시계열 분석', status: 'soon', icon: <LineChart className="ic" /> },
  { key: 'kb-price', label: 'KB시세', status: 'soon', icon: <BarChart3 className="ic" /> },
  { key: 'naver', label: '매물시세', status: 'soon', icon: <Building2 className="ic" /> },
  { key: 'real-deal', label: '실거래가', status: 'soon', icon: <TrendingUp className="ic" /> },
  { key: 'subscription', label: '지역별 청약현황', status: 'live', active: true, icon: <FileCheck2 className="ic" /> },
  { key: 'reviews', label: '입주민 리뷰', status: 'soon', icon: <MessageCircle className="ic" /> },
  { key: 'brokers', label: '중개업소 추출', status: 'soon', icon: <Store className="ic" /> },
  { key: 'commercial', label: '상업시설 특화', status: 'soon', icon: <ShoppingBag className="ic" /> },
  { key: 'location', label: '입지분석', status: 'soon', icon: <MapPin className="ic" /> },
  { key: 'school', label: '학군상세', status: 'soon', icon: <GraduationCap className="ic" /> },
  { key: 'development', label: '개발계획', status: 'soon', icon: <Building className="ic" /> },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ onToggleCollapse }: SidebarProps) {
  return (
    <aside className="eos-side">
      <button className="eos-side-toggle" title="사이드바 접기" onClick={onToggleCollapse}>
        <ChevronLeft />
      </button>

      <div className="eos-brand">
        <div className="eos-brand-mark" />
        <div className="eos-brand-tx">
          <b>Estate&nbsp;OS</b>
          <span>Analytics</span>
        </div>
      </div>

      <nav className="eos-nav">
        <div className="eos-nav-sec">Workspace</div>
        {NAV_MODULES.map((m) => {
          const clickable = m.status === 'live';
          return (
            <button
              key={m.key}
              className={`eos-nav-item${m.active ? ' active' : ''}${clickable ? '' : ' disabled'}`}
              aria-disabled={!clickable}
              title={clickable ? m.label : SOON_TIP}
            >
              {m.icon}
              <span className="eos-nav-label">{m.label}</span>
              <span className={`eos-dot${m.status === 'live' ? ' live' : ''}`} />
            </button>
          );
        })}

        <div className="eos-nav-sec">시스템</div>
        <button className="eos-nav-item disabled" aria-disabled title={SOON_TIP}>
          <Settings className="ic" />
          <span className="eos-nav-label">설정</span>
        </button>
      </nav>

      <div className="eos-acct">
        <div className="eos-acct-av">NV</div>
        <div className="eos-acct-tx">
          <b>부동산 애널리스트</b>
          <span>데이터 데스크 · Pro</span>
        </div>
      </div>
    </aside>
  );
}
