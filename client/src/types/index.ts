// 지역 검색 — 네이버앱(R3_Naver)과 동일한 3단계 캐스케이딩 모델
export interface RegionItem {
  code: string;   // 법정동코드 (level1: 2자리, level2: 5자리, level3: 10자리)
  name: string;
  level: 1 | 2 | 3;
}

export interface RegionSelection {
  large: RegionItem | null; // 시/도
  mid: RegionItem | null;   // 시/군/구
  small: RegionItem | null; // 읍/면/동
}

// 청약홈 검색 진행 모달 — 단지별 경쟁률 정보 수집 진행 상태
export type CollectStatus = 'counting' | 'running' | 'done' | 'stopped';

export interface CollectItem {
  index: number;
  region: string;
  houseName: string;
  status: 'pending' | 'active' | 'done';
  averageCompetitionRate?: number;
  subscriptionResult?: string;
}

// 청약홈 원본처럼 rowspan 병합된 셀 — show=false는 위 셀에 병합되어 렌더 생략
export interface DetailCell {
  v: string;
  rowSpan: number;
  show: boolean;
}

// 단지 상세 — 공식 링크 + 청약홈 원본 청약결과 표(일반공급 / 특별공급)
export interface ApartmentDetail {
  houseManageNo: string;
  pblancNo: string;
  houseName: string;
  homepageUrl: string | null;
  noticeUrl: string | null;
  detailUrl: string;
  // 일반공급 (1·2순위) 경쟁률
  competition: {
    rows: DetailCell[][];
  };
  // 특별공급 청약접수 현황 — 없으면 null
  specialSupply: {
    typeLabels: string[];
    rows: DetailCell[][];
  } | null;
}
