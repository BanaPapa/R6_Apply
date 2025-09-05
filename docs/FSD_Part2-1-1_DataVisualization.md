# 📊 데이터 크롤링 및 시각화 앱 기능 사양 문서 (FSD) - 파트 2-1-1: 데이터 시각화 기능

**문서 버전:** 1.0  
**작성일:** 2025년 7월 24일  
**작성자:** Frontend & Documentation Team  
**승인자:** Technical Architect  
**연관 문서:** PRD v2.0, FSD Part 1 (크롤링 및 데이터 처리)

---

## 📋 1. 개요

### 1.1 문서 목적

본 문서는 한국 아파트 청약 데이터 크롤링 및 시각화 앱의 **데이터 시각화 기능**에 대한 상세 기술 사양서입니다. FSD의 핵심 구성 요소 중 하나로, 수집된 청약 데이터를 사용자가 직관적으로 이해하고 분석할 수 있도록 하는 시각화 시스템의 구현 방안을 정의합니다.

### 1.2 문서 범위

**포함 사항:**
- 지원 시각화 유형 및 특징 정의
- 데이터 바인딩 및 실시간 업데이트 로직
- 사용자 인터랙션 및 동작 방식
- React Native 환경 시각화 라이브러리 적용 방안
- 데이터 유효성 검사 및 오류 처리 전략
- 시각화 전용 API 설계
- 프론트엔드 기술 스택 상세 사양

**제외 사항:**
- 데이터 크롤링 로직 (FSD Part 1 참조)
- 리스트뷰 기능 (FSD Part 2-1-2에서 다룰 예정)
- 백엔드 데이터 처리 로직 (FSD Part 1 참조)

### 1.3 대상 독자

- **프론트엔드 개발자**: 시각화 컴포넌트 구현
- **백엔드 개발자**: 시각화 API 설계 및 구현
- **UI/UX 디자이너**: 시각화 인터페이스 설계
- **프로젝트 매니저**: 기능 범위 및 일정 관리

---

## 🎨 2. 데이터 시각화 기능 상세 정의

### 2.1 지원할 시각화 유형

#### 2.1.1 꺾은선 그래프 (Line Chart)

**🎯 주요 용도:**
- 시간별 경쟁률 변화 추이 분석
- 월별/연도별 분양 동향 파악
- 특정 지역/단지의 시계열 데이터 시각화

**📊 데이터 특성:**
```typescript
interface LineChartData {
  labels: string[];           // X축 라벨 (날짜, 월)
  datasets: {
    data: number[];          // Y축 데이터 (경쟁률, 분양가)
    color?: string;          // 선 색상
    strokeWidth?: number;    // 선 두께
    label: string;           // 데이터셋 라벨
  }[];
  legend?: string[];         // 범례
}
```

**🔧 구현 특징:**
- 다중 데이터셋 지원 (최대 5개 선)
- 실시간 데이터 업데이트 지원
- 애니메이션 효과 적용
- 확대/축소 기능 지원

#### 2.1.2 막대 그래프 (Bar Chart)

**🎯 주요 용도:**
- 지역별 평균 경쟁률 비교
- 시공사별 분양 현황 분석
- 평형별 공급 세대수 비교
- 월별 분양 공고 수 통계

**📊 데이터 특성:**
```typescript
interface BarChartData {
  labels: string[];           // X축 카테고리 (지역명, 시공사명)
  datasets: {
    data: number[];          // Y축 수치 데이터
    backgroundColor?: string; // 막대 배경색
    borderColor?: string;    // 막대 경계색
    label: string;           // 데이터셋 라벨
  }[];
}
```

**🔧 구현 특징:**
- 수직/수평 막대 차트 지원
- 스택형 막대 차트 지원
- 동적 색상 매핑 (경쟁률 구간별)
- 막대 클릭 시 드릴다운 기능

#### 2.1.3 파이 차트 (Pie Chart)

**🎯 주요 용도:**
- 청약 결과 분포 시각화 (1순위 당해마감, 1순위 기타마감 등)
- 지역별 분양 비율 표시
- 평형별 공급 비율 분석
- 시공사별 시장 점유율 표시

**📊 데이터 특성:**
```typescript
interface PieChartData {
  name: string;              // 카테고리 명
  value: number;             // 수치 값
  color: string;             // 섹터 색상
  percentage: number;        // 백분율
  legendFontColor?: string;  // 범례 폰트 색상
  legendFontSize?: number;   // 범례 폰트 크기
}[]
```

**🔧 구현 특징:**
- 도넛 차트 모드 지원
- 섹터 분리 효과 (explode)
- 백분율 자동 계산 및 표시
- 범례 위치 조정 가능

#### 2.1.4 히트맵 (Heatmap)

**🎯 주요 용도:**
- 지역별 경쟁률 밀도 표시
- 시간대별 청약 활동 패턴 분석
- 가격대별 공급 분포 시각화
- 청약 성공률 지역별 분포

**📊 데이터 특성:**
```typescript
interface HeatmapData {
  x: number;                 // X축 좌표 (경도 또는 인덱스)
  y: number;                 // Y축 좌표 (위도 또는 인덱스)
  value: number;             // 강도 값 (경쟁률, 밀도)
  label?: string;            // 툴팁 라벨
}[]
```

**🔧 구현 특징:**
- 색상 그라디언트 매핑
- 인터랙티브 툴팁
- 범위 필터링 기능
- 실시간 업데이트 지원

#### 2.1.5 지도 마커 (Map Markers)

**🎯 주요 용도:**
- 아파트 단지 지리적 위치 표시
- 지역별 청약 현황 시각화
- 교통 접근성 기반 분석
- 주변 시설 정보 연계 표시

**📊 데이터 특성:**
```typescript
interface MapMarkerData {
  id: string;                // 단지 고유 ID
  latitude: number;          // 위도
  longitude: number;         // 경도
  title: string;             // 단지명
  description: string;       // 간단 설명
  competitionRate: number;   // 경쟁률
  status: string;            // 청약 상태
  markerColor: string;       // 마커 색상
  clusterGroup?: string;     // 클러스터 그룹
}[]
```

**🔧 구현 특징:**
- 마커 클러스터링 지원
- 상태별 마커 아이콘 차별화
- 정보 윈도우 표시
- 지도 줌 레벨별 정보 조절

### 2.2 데이터 바인딩 및 업데이트 로직

#### 2.2.1 API 연동 방식

**🔄 데이터 페칭 전략:**

```typescript
// 시각화 데이터 페칭 훅
const useVisualizationData = (params: VisualizationParams) => {
  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(
    ['/api/v1/visualization/chart-data', params],
    (url, params) => fetcher(url, params),
    {
      refreshInterval: getRefreshInterval(params.chartType),
      dedupingInterval: 30000,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  return { data, error, isLoading, refresh: mutate };
};

// 새로고침 주기 결정 로직
const getRefreshInterval = (chartType: string): number => {
  switch (chartType) {
    case 'realtime': return 5 * 60 * 1000;    // 5분 (접수중 단지)
    case 'daily': return 60 * 60 * 1000;      // 1시간 (일간 데이터)
    case 'static': return 0;                   // 수동 (정적 데이터)
    default: return 30 * 60 * 1000;           // 30분 (기본)
  }
};
```

**📡 실시간 데이터 업데이트:**

```typescript
// WebSocket 연결 관리
const useRealTimeUpdates = (chartId: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket(`ws://api.server.com/ws/visualization/${chartId}`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      // 차트 데이터 업데이트
      updateChartData(update);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // 폴링으로 폴백
      fallbackToPolling();
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [chartId]);
  
  return { socket };
};
```

#### 2.2.2 데이터 캐싱 전략

**💾 다층 캐싱 구조:**

```typescript
// 캐시 계층 구조
const cacheConfig = {
  // L1: 메모리 캐시 (React Query)
  memory: {
    maxAge: 5 * 60 * 1000,      // 5분
    maxSize: 50,                 // 최대 50개 쿼리
    gcTime: 30 * 60 * 1000      // 30분 후 가비지 컬렉션
  },
  
  // L2: 로컬 스토리지 (오프라인 지원)
  localStorage: {
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    maxSize: 10 * 1024 * 1024,   // 10MB
    compression: true             // 데이터 압축
  },
  
  // L3: 서버 캐시 (CDN)
  serverCache: {
    maxAge: 60 * 60 * 1000,      // 1시간
    staleWhileRevalidate: true    // 백그라운드 업데이트
  }
};
```

#### 2.2.3 대용량 데이터 처리

**⚡ 성능 최적화 전략:**

```typescript
// 데이터 샘플링 및 집계
const processLargeDataset = (rawData: any[], maxPoints: number = 1000) => {
  if (rawData.length <= maxPoints) {
    return rawData;
  }
  
  // 시간 기반 샘플링
  const interval = Math.ceil(rawData.length / maxPoints);
  const sampledData = rawData.filter((_, index) => index % interval === 0);
  
  // 집계 데이터 생성
  const aggregatedData = sampledData.map((item, index) => {
    const nextIndex = Math.min((index + 1) * interval, rawData.length);
    const chunk = rawData.slice(index * interval, nextIndex);
    
    return {
      ...item,
      value: chunk.reduce((sum, curr) => sum + curr.value, 0) / chunk.length,
      count: chunk.length
    };
  });
  
  return aggregatedData;
};

// 가상화된 차트 렌더링
const VirtualizedChart = ({ data, height }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 });
  
  const visibleData = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);
  
  return (
    <ScrollView
      onScroll={({ nativeEvent }) => {
        const { contentOffset, layoutMeasurement } = nativeEvent;
        const itemHeight = 20; // 예상 아이템 높이
        const start = Math.floor(contentOffset.y / itemHeight);
        const end = start + Math.ceil(layoutMeasurement.height / itemHeight);
        setVisibleRange({ start, end });
      }}
    >
      <Chart data={visibleData} />
    </ScrollView>
  );
};
```

### 2.3 사용자 인터랙션 및 동작

#### 2.3.1 확대/축소 (Zoom) 기능

**🔍 줌 인터랙션 구현:**

```typescript
// 터치 제스처 기반 줌 핸들러
const useZoomGesture = (chartRef: RefObject<any>) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  const pinchGestureHandler = useCallback((event: PinchGestureHandlerEventPayload) => {
    const newZoomLevel = Math.max(0.5, Math.min(5, zoomLevel * event.scale));
    setZoomLevel(newZoomLevel);
    
    // 차트 데이터 세밀도 조정
    if (newZoomLevel > 2) {
      // 확대 시 더 세밀한 데이터 요청
      fetchDetailedData();
    } else if (newZoomLevel < 1) {
      // 축소 시 집계된 데이터 사용
      fetchAggregatedData();
    }
  }, [zoomLevel]);
  
  const panGestureHandler = useCallback((event: PanGestureHandlerEventPayload) => {
    setPanOffset({
      x: panOffset.x + event.translationX,
      y: panOffset.y + event.translationY
    });
  }, [panOffset]);
  
  return {
    zoomLevel,
    panOffset,
    pinchGestureHandler,
    panGestureHandler
  };
};
```

#### 2.3.2 특정 구간 선택 (Brush and Zoom)

**📏 구간 선택 구현:**

```typescript
// 브러시 선택 기능
const useBrushSelection = (chartData: any[]) => {
  const [selectedRange, setSelectedRange] = useState<{start: number, end: number} | null>(null);
  const [brushStart, setBrushStart] = useState<number | null>(null);
  
  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    const x = touch.clientX;
    setBrushStart(x);
  };
  
  const handleTouchMove = (event: TouchEvent) => {
    if (brushStart === null) return;
    
    const touch = event.touches[0];
    const x = touch.clientX;
    
    const startIndex = Math.floor((brushStart / chartWidth) * chartData.length);
    const endIndex = Math.floor((x / chartWidth) * chartData.length);
    
    setSelectedRange({
      start: Math.min(startIndex, endIndex),
      end: Math.max(startIndex, endIndex)
    });
  };
  
  const handleTouchEnd = () => {
    setBrushStart(null);
    
    if (selectedRange) {
      // 선택된 구간의 상세 데이터 표시
      const selectedData = chartData.slice(selectedRange.start, selectedRange.end);
      onRangeSelected(selectedData);
    }
  };
  
  const clearSelection = () => {
    setSelectedRange(null);
  };
  
  return {
    selectedRange,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    clearSelection
  };
};
```

#### 2.3.3 데이터 필터링 시스템

**🔽 다중 조건 필터링:**

```typescript
// 필터 상태 관리
interface FilterState {
  regions: string[];
  priceRange: [number, number];
  competitionRateRange: [number, number];
  constructors: string[];
  dateRange: [Date, Date];
  apartmentTypes: string[];
}

const useVisualizationFilters = (initialData: any[]) => {
  const [filters, setFilters] = useState<FilterState>({
    regions: [],
    priceRange: [0, Infinity],
    competitionRateRange: [0, Infinity],
    constructors: [],
    dateRange: [new Date('2020-01-01'), new Date()],
    apartmentTypes: []
  });
  
  const filteredData = useMemo(() => {
    return initialData.filter(item => {
      // 지역 필터
      if (filters.regions.length > 0 && !filters.regions.includes(item.region)) {
        return false;
      }
      
      // 가격 범위 필터
      if (item.price < filters.priceRange[0] || item.price > filters.priceRange[1]) {
        return false;
      }
      
      // 경쟁률 범위 필터
      if (item.competitionRate < filters.competitionRateRange[0] || 
          item.competitionRate > filters.competitionRateRange[1]) {
        return false;
      }
      
      // 시공사 필터
      if (filters.constructors.length > 0 && !filters.constructors.includes(item.constructor)) {
        return false;
      }
      
      // 날짜 범위 필터
      const itemDate = new Date(item.date);
      if (itemDate < filters.dateRange[0] || itemDate > filters.dateRange[1]) {
        return false;
      }
      
      // 평형 필터
      if (filters.apartmentTypes.length > 0 && !filters.apartmentTypes.includes(item.type)) {
        return false;
      }
      
      return true;
    });
  }, [initialData, filters]);
  
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      regions: [],
      priceRange: [0, Infinity],
      competitionRateRange: [0, Infinity],
      constructors: [],
      dateRange: [new Date('2020-01-01'), new Date()],
      apartmentTypes: []
    });
  };
  
  return {
    filters,
    filteredData,
    updateFilter,
    resetFilters
  };
};
```

#### 2.3.4 드릴다운 (Drill-down) 기능

**🎯 계층적 데이터 탐색:**

```typescript
// 드릴다운 네비게이션 관리
const useDrillDown = () => {
  const [navigationStack, setNavigationStack] = useState<DrillDownLevel[]>([
    { level: 'country', data: null, title: '전국' }
  ]);
  
  const drillDown = (nextLevel: string, filterData: any, title: string) => {
    const newLevel: DrillDownLevel = {
      level: nextLevel,
      data: filterData,
      title
    };
    
    setNavigationStack(prev => [...prev, newLevel]);
    
    // 해당 레벨의 데이터 요청
    fetchDrillDownData(nextLevel, filterData);
  };
  
  const drillUp = () => {
    if (navigationStack.length <= 1) return;
    
    setNavigationStack(prev => prev.slice(0, -1));
  };
  
  const resetToTop = () => {
    setNavigationStack([navigationStack[0]]);
  };
  
  const currentLevel = navigationStack[navigationStack.length - 1];
  
  return {
    currentLevel,
    navigationStack,
    drillDown,
    drillUp,
    resetToTop,
    canDrillUp: navigationStack.length > 1
  };
};

// 차트 클릭 이벤트 핸들러
const handleChartClick = (dataPoint: any, chartType: string) => {
  switch (chartType) {
    case 'regionBar':
      // 지역 클릭 → 해당 지역 상세 차트
      drillDown('district', { region: dataPoint.region }, dataPoint.region);
      break;
      
    case 'constructorPie':
      // 시공사 클릭 → 해당 시공사 분양 현황
      drillDown('constructor', { constructor: dataPoint.name }, dataPoint.name);
      break;
      
    case 'apartmentList':
      // 단지 클릭 → 단지 상세 정보 모달
      showApartmentDetailModal(dataPoint);
      break;
      
    default:
      break;
  }
};
```

#### 2.3.5 지도 특화 인터랙션

**🗺️ 지도 인터랙션 구현:**

```typescript
// 지도 마커 클러스터링
const useMapClustering = (markers: MapMarkerData[]) => {
  const [zoomLevel, setZoomLevel] = useState(10);
  const clusterDistance = 50; // 픽셀 단위
  
  const clusteredMarkers = useMemo(() => {
    if (zoomLevel > 15) {
      // 고해상도에서는 클러스터링 해제
      return markers.map(marker => ({ ...marker, isCluster: false }));
    }
    
    // K-means 클러스터링 알고리즘 적용
    const clusters = performClustering(markers, clusterDistance);
    
    return clusters.map(cluster => ({
      ...cluster,
      isCluster: cluster.memberCount > 1,
      title: cluster.isCluster ? `${cluster.memberCount}개 단지` : cluster.title
    }));
  }, [markers, zoomLevel]);
  
  return { clusteredMarkers, setZoomLevel };
};

// 마커 클릭 핸들러
const handleMarkerPress = (marker: MapMarkerData) => {
  if (marker.isCluster) {
    // 클러스터 클릭 시 확대
    const region = calculateClusterRegion(marker.members);
    mapRef.current?.animateToRegion(region, 1000);
  } else {
    // 개별 마커 클릭 시 정보 윈도우 표시
    setSelectedMarker(marker);
    setInfoWindowVisible(true);
    
    // 상세 정보 페칭
    fetchApartmentDetails(marker.id);
  }
};

// 히트맵 오버레이 토글
const useHeatmapOverlay = (mapData: any[]) => {
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [heatmapIntensity, setHeatmapIntensity] = useState(0.6);
  
  const heatmapData = useMemo(() => {
    return mapData.map(item => ({
      latitude: item.latitude,
      longitude: item.longitude,
      weight: item.competitionRate / 100 // 0-1 범위로 정규화
    }));
  }, [mapData]);
  
  const toggleHeatmap = () => {
    setHeatmapEnabled(!heatmapEnabled);
  };
  
  return {
    heatmapEnabled,
    heatmapData,
    heatmapIntensity,
    toggleHeatmap,
    setHeatmapIntensity
  };
};
```

### 2.4 시각화 라이브러리/프레임워크 적용 방안

#### 2.4.1 주력 라이브러리: React Native ECharts

**🚀 선택 이유:**
- **고성능**: Apache ECharts 기반, WebView 대비 우수한 성능
- **풍부한 기능**: 다양한 차트 유형 및 고급 인터랙션 지원
- **네이티브 렌더링**: SVG/Skia 렌더러를 통한 네이티브 성능
- **커스터마이징**: 거의 무제한의 차트 커스터마이징 가능
- **신뢰성**: 높은 Trust Score (7.8)와 활발한 커뮤니티

**🔧 구현 방안:**

```typescript
// ECharts 초기화 및 설정
import { SvgChart, SVGRenderer } from '@wuba/react-native-echarts';
import * as echarts from 'echarts/core';
import {
  LineChart,
  BarChart,
  PieChart,
  HeatmapChart,
  ScatterChart
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components';

// 필요한 컴포넌트 등록
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  SVGRenderer,
  LineChart,
  BarChart,
  PieChart,
  HeatmapChart,
  ScatterChart
]);

// 공통 차트 컴포넌트
const UniversalChart: React.FC<UniversalChartProps> = ({ 
  option, 
  width, 
  height,
  onChartReady 
}) => {
  const chartRef = useRef<any>(null);
  
  useEffect(() => {
    let chart: any;
    if (chartRef.current) {
      chart = echarts.init(chartRef.current, 'light', {
        renderer: 'svg',
        width,
        height,
      });
      
      chart.setOption(option);
      
      // 차트 이벤트 바인딩
      chart.on('click', handleChartClick);
      chart.on('dataZoom', handleDataZoom);
      chart.on('finished', () => onChartReady?.(chart));
    }
    
    return () => chart?.dispose();
  }, [option, width, height]);
  
  return <SvgChart ref={chartRef} />;
};
```

**📊 차트별 ECharts 옵션 템플릿:**

```typescript
// 경쟁률 추이 선형 차트 옵션
const competitionTrendOption = {
  title: {
    text: '지역별 경쟁률 추이',
    left: 'center',
    textStyle: { fontSize: 18, fontWeight: 'bold' }
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      return `${params[0].name}<br/>${params[0].seriesName}: ${params[0].value}:1`;
    }
  },
  legend: {
    top: '10%',
    type: 'scroll'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: monthLabels
  },
  yAxis: {
    type: 'value',
    name: '경쟁률',
    axisLabel: {
      formatter: '{value}:1'
    }
  },
  dataZoom: [
    {
      type: 'inside',
      start: 0,
      end: 100
    },
    {
      start: 0,
      end: 100
    }
  ],
  series: [
    {
      name: '서울',
      type: 'line',
      smooth: true,
      data: seoulData,
      itemStyle: { color: '#FF6B6B' }
    },
    {
      name: '경기',
      type: 'line',
      smooth: true,
      data: gyeonggiData,
      itemStyle: { color: '#4ECDC4' }
    }
  ]
};

// 청약 결과 분포 파이 차트 옵션
const subscriptionResultOption = {
  title: {
    text: '청약 결과 분포',
    left: 'center'
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c}개 ({d}%)'
  },
  series: [
    {
      name: '청약 결과',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '30',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 335, name: '1순위 당해마감', itemStyle: { color: '#FF6B6B' } },
        { value: 234, name: '1순위 기타마감', itemStyle: { color: '#4ECDC4' } },
        { value: 135, name: '2순위 당해마감', itemStyle: { color: '#45B7D1' } },
        { value: 89, name: '2순위 기타마감', itemStyle: { color: '#96CEB4' } },
        { value: 26, name: '미달', itemStyle: { color: '#FFEAA7' } }
      ]
    }
  ]
};
```

#### 2.4.2 보조 라이브러리: React Native Chart Kit

**🎯 사용 목적:**
- 간단한 차트의 빠른 구현
- 프로토타이핑 및 테스트용
- 특정 스타일이 필요한 경우의 대체재

**📱 적용 시나리오:**

```typescript
// 간단한 월별 통계 카드용 미니 차트
const MiniProgressChart: React.FC<{ data: number[] }> = ({ data }) => {
  const chartData = {
    labels: ['완료', '진행중', '대기'],
    data: data.map(val => val / 100) // 0-1 범위로 정규화
  };
  
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: '#ffffff',
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };
  
  return (
    <ProgressChart
      data={chartData}
      width={200}
      height={120}
      strokeWidth={8}
      radius={24}
      chartConfig={chartConfig}
      hideLegend={true}
      style={{ borderRadius: 16 }}
    />
  );
};

// 간단한 트렌드 라인 차트
const SimpleTrendChart: React.FC<{ data: number[], labels: string[] }> = ({ 
  data, 
  labels 
}) => {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };
  
  return (
    <LineChart
      data={chartData}
      width={300}
      height={180}
      chartConfig={chartConfig}
      bezier
      style={{ marginVertical: 8, borderRadius: 16 }}
      withDots={false}
      withInnerLines={false}
      withOuterLines={false}
    />
  );
};
```

#### 2.4.3 라이브러리 한계점 및 커스터마이징

**⚠️ React Native ECharts 한계점:**
- **번들 크기**: 전체 ECharts 라이브러리 포함 시 크기 증가
- **학습 곡선**: Apache ECharts 옵션 체계 이해 필요
- **메모리 사용량**: 복잡한 차트 다수 렌더링 시 메모리 부담

**🔧 해결 방안:**

```typescript
// 번들 크기 최적화: 필요한 컴포넌트만 임포트
import {
  LineChart,
  BarChart,
  PieChart
  // HeatmapChart, ScatterChart 등은 필요 시에만 임포트
} from 'echarts/charts';

// 메모리 최적화: 차트 가상화
const VirtualizedChartContainer: React.FC<{ charts: ChartConfig[] }> = ({ charts }) => {
  const [visibleCharts, setVisibleCharts] = useState<ChartConfig[]>([]);
  
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    const visible = viewableItems.map((item: any) => item.item);
    setVisibleCharts(visible);
  }, []);
  
  return (
    <FlatList
      data={charts}
      renderItem={({ item, index }) => {
        const isVisible = visibleCharts.includes(item);
        return isVisible ? (
          <UniversalChart {...item} />
        ) : (
          <View style={{ height: item.height }} /> // 플레이스홀더
        );
      }}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
    />
  );
};

// 성능 모니터링 및 최적화
const useChartPerformance = () => {
  const [renderTime, setRenderTime] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  
  const measurePerformance = useCallback(async (chartId: string) => {
    const startTime = performance.now();
    
    // 메모리 사용량 측정 (개발 모드)
    if (__DEV__) {
      const memInfo = await DeviceInfo.getUsedMemory();
      setMemoryUsage(memInfo);
    }
    
    return {
      onRenderComplete: () => {
        const endTime = performance.now();
        setRenderTime(endTime - startTime);
        
        // 성능 임계치 초과 시 경고
        if (endTime - startTime > 1000) {
          console.warn(`Chart ${chartId} rendering took ${endTime - startTime}ms`);
        }
      }
    };
  }, []);
  
  return { renderTime, memoryUsage, measurePerformance };
};
```

**⚠️ React Native Chart Kit 한계점:**
- **제한적 커스터마이징**: 스타일링 옵션 부족
- **인터랙션 부족**: 드릴다운, 줌 등 고급 기능 미지원
- **성능 문제**: 대용량 데이터 처리 한계

**🔧 커스터마이징 솔루션:**

```typescript
// Chart Kit 확장 컴포넌트
const EnhancedLineChart: React.FC<EnhancedLineChartProps> = ({
  data,
  onDataPointClick,
  customTooltip,
  ...props
}) => {
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  
  // 터치 이벤트 핸들링으로 인터랙션 추가
  const handleTouchStart = (event: any) => {
    const { locationX } = event.nativeEvent;
    const dataIndex = Math.floor(locationX / (props.width / data.labels.length));
    const point = {
      index: dataIndex,
      label: data.labels[dataIndex],
      value: data.datasets[0].data[dataIndex]
    };
    
    setSelectedPoint(point);
    onDataPointClick?.(point);
  };
  
  return (
    <View>
      <LineChart
        {...props}
        data={data}
        onTouchStart={handleTouchStart}
      />
      {selectedPoint && customTooltip && (
        <CustomTooltip point={selectedPoint} />
      )}
    </View>
  );
};

// 커스텀 애니메이션 추가
const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({ data, ...props }) => {
  const animatedValues = useRef(
    data.datasets[0].data.map(() => new Animated.Value(0))
  ).current;
  
  useEffect(() => {
    const animations = animatedValues.map((animValue, index) =>
      Animated.timing(animValue, {
        toValue: data.datasets[0].data[index],
        duration: 1000,
        delay: index * 100,
        useNativeDriver: false
      })
    );
    
    Animated.stagger(100, animations).start();
  }, [data]);
  
  const animatedData = {
    ...data,
    datasets: [
      {
        ...data.datasets[0],
        data: animatedValues.map(animValue => animValue._value)
      }
    ]
  };
  
  return <BarChart {...props} data={animatedData} />;
};
```

### 2.5 시각화 데이터의 유효성 검사 및 오류 처리

#### 2.5.1 데이터 유효성 검사

**🔍 입력 데이터 검증:**

```typescript
// 차트 데이터 검증 스키마
import Joi from 'joi';

const chartDataSchema = Joi.object({
  labels: Joi.array().items(Joi.string()).min(1).required(),
  datasets: Joi.array().items(
    Joi.object({
      data: Joi.array().items(Joi.number().min(0)).required(),
      label: Joi.string().required(),
      color: Joi.string().optional(),
      strokeWidth: Joi.number().min(1).max(10).optional()
    })
  ).min(1).required()
});

const mapDataSchema = Joi.object({
  id: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  title: Joi.string().required(),
  competitionRate: Joi.number().min(0).required(),
  status: Joi.string().valid('접수중', '마감', '미달', '발표대기').required()
});

// 데이터 검증 함수
const validateChartData = (data: any, chartType: string): ValidationResult => {
  let schema: Joi.ObjectSchema;
  
  switch (chartType) {
    case 'line':
    case 'bar':
      schema = chartDataSchema;
      break;
    case 'map':
      schema = Joi.array().items(mapDataSchema);
      break;
    case 'pie':
      schema = Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          value: Joi.number().min(0).required(),
          color: Joi.string().required()
        })
      );
      break;
    default:
      return { isValid: false, error: '지원하지 않는 차트 유형' };
  }
  
  const { error } = schema.validate(data);
  
  return {
    isValid: !error,
    error: error?.details[0]?.message,
    sanitizedData: error ? null : data
  };
};

// 데이터 정제 및 기본값 적용
const sanitizeChartData = (rawData: any, chartType: string): any => {
  switch (chartType) {
    case 'line':
    case 'bar':
      return {
        ...rawData,
        labels: rawData.labels || [],
        datasets: rawData.datasets?.map((dataset: any) => ({
          data: dataset.data || [],
          label: dataset.label || '알 수 없음',
          color: dataset.color || '#8884d8',
          strokeWidth: dataset.strokeWidth || 2
        })) || []
      };
      
    case 'pie':
      return rawData.map((item: any) => ({
        name: item.name || '알 수 없음',
        value: Math.max(0, item.value || 0),
        color: item.color || getRandomColor(),
        percentage: 0 // 자동 계산
      }));
      
    case 'map':
      return rawData.filter((item: any) => 
        item.latitude && item.longitude && 
        item.latitude >= -90 && item.latitude <= 90 &&
        item.longitude >= -180 && item.longitude <= 180
      ).map((item: any) => ({
        ...item,
        title: item.title || '이름 없음',
        competitionRate: Math.max(0, item.competitionRate || 0),
        status: item.status || '알 수 없음'
      }));
      
    default:
      return rawData;
  }
};
```

#### 2.5.2 오류 처리 및 사용자 피드백

**🚨 오류 처리 전략:**

```typescript
// 차트 오류 경계 컴포넌트
class ChartErrorBoundary extends React.Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 오류 로깅
    console.error('차트 렌더링 오류:', error, errorInfo);
    
    // 외부 오류 추적 서비스에 전송
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  render() {
    if (this.state.hasError) {
      // 커스텀 오류 UI 표시
      return (
        <ChartErrorFallback
          error={this.state.error}
          onRetry={() => {
            this.setState({ hasError: false, error: null });
            this.props.onRetry?.();
          }}
          chartType={this.props.chartType}
        />
      );
    }
    
    return this.props.children;
  }
}

// 오류 폴백 컴포넌트
const ChartErrorFallback: React.FC<ChartErrorFallbackProps> = ({
  error,
  onRetry,
  chartType
}) => {
  const getErrorMessage = (error: Error) => {
    if (error.message.includes('데이터')) {
      return '차트를 그릴 데이터가 부족합니다.';
    } else if (error.message.includes('네트워크')) {
      return '데이터를 불러오는 중 오류가 발생했습니다.';
    } else {
      return '차트를 표시하는 중 오류가 발생했습니다.';
    }
  };
  
  return (
    <View style={styles.errorContainer}>
      <Icon name="chart-line-variant" size={48} color="#FF6B6B" />
      <Text style={styles.errorTitle}>차트 표시 오류</Text>
      <Text style={styles.errorMessage}>{getErrorMessage(error)}</Text>
      
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>다시 시도</Text>
      </TouchableOpacity>
      
      {/* 개발 모드에서만 상세 오류 정보 표시 */}
      {__DEV__ && (
        <Text style={styles.debugInfo}>
          {error?.message}
        </Text>
      )}
    </View>
  );
};

// 데이터 없음 상태 컴포넌트
const EmptyDataState: React.FC<EmptyDataStateProps> = ({ 
  chartType, 
  onRefresh,
  message 
}) => {
  const getEmptyStateInfo = (type: string) => {
    switch (type) {
      case 'line':
        return {
          icon: 'chart-line',
          title: '추이 데이터 없음',
          defaultMessage: '선택한 기간에 해당하는 데이터가 없습니다.'
        };
      case 'bar':
        return {
          icon: 'chart-bar',
          title: '비교 데이터 없음',
          defaultMessage: '비교할 수 있는 데이터가 충분하지 않습니다.'
        };
      case 'pie':
        return {
          icon: 'chart-pie',
          title: '분포 데이터 없음',
          defaultMessage: '분석할 수 있는 데이터가 없습니다.'
        };
      case 'map':
        return {
          icon: 'map-marker',
          title: '위치 데이터 없음',
          defaultMessage: '지도에 표시할 단지가 없습니다.'
        };
      default:
        return {
          icon: 'chart-box',
          title: '데이터 없음',
          defaultMessage: '표시할 데이터가 없습니다.'
        };
    }
  };
  
  const stateInfo = getEmptyStateInfo(chartType);
  
  return (
    <View style={styles.emptyStateContainer}>
      <Icon name={stateInfo.icon} size={64} color="#C4C4C4" />
      <Text style={styles.emptyStateTitle}>{stateInfo.title}</Text>
      <Text style={styles.emptyStateMessage}>
        {message || stateInfo.defaultMessage}
      </Text>
      
      {onRefresh && (
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Icon name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.refreshButtonText}>새로고침</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 로딩 상태 컴포넌트
const ChartLoadingState: React.FC<ChartLoadingStateProps> = ({ 
  chartType,
  progress 
}) => {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.skeletonChart}>
        {/* 차트 유형별 스켈레톤 UI */}
        {chartType === 'line' && <LineChartSkeleton />}
        {chartType === 'bar' && <BarChartSkeleton />}
        {chartType === 'pie' && <PieChartSkeleton />}
        {chartType === 'map' && <MapSkeleton />}
      </View>
      
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} />
          <Text style={styles.progressText}>
            데이터 로딩 중... {Math.round(progress * 100)}%
          </Text>
        </View>
      )}
      
      <ActivityIndicator size="large" color="#4A90E2" />
    </View>
  );
};
```

---

## 🔌 3. 관련 API 설계 (시각화 기능)

### 3.1 시각화 데이터 조회 API

#### 3.1.1 기본 엔드포인트 구조

```typescript
// API 기본 구조
const API_BASE_URL = 'https://api.apartment-subscription.com/v1';

// 시각화 관련 엔드포인트
const VISUALIZATION_ENDPOINTS = {
  chartData: '/visualization/chart-data',
  mapData: '/visualization/map-data',
  heatmapData: '/visualization/heatmap-data',
  trendData: '/visualization/trend-data',
  compareData: '/visualization/compare-data'
};
```

#### 3.1.2 차트 데이터 조회 API

**📊 엔드포인트:** `GET /api/v1/visualization/chart-data`

**🔧 요청 파라미터:**

```typescript
interface ChartDataRequest {
  // 필수 파라미터
  chartType: 'line' | 'bar' | 'pie' | 'heatmap' | 'scatter';
  
  // 시간 범위
  startDate: string;        // ISO 8601 형식: "2024-01-01"
  endDate: string;          // ISO 8601 형식: "2024-12-31"
  
  // 필터 조건
  regions?: string[];       // ["서울", "경기", "인천"]
  constructors?: string[];  // ["대우건설", "삼성물산"]
  priceRange?: {           // 분양가 범위 (억원)
    min: number;
    max: number;
  };
  competitionRateRange?: { // 경쟁률 범위
    min: number;
    max: number;
  };
  apartmentTypes?: string[]; // ["84㎡", "59㎡"]
  
  // 집계 옵션
  aggregationType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  groupBy?: 'region' | 'constructor' | 'apartmentType' | 'priceRange';
  
  // 성능 옵션
  limit?: number;          // 최대 결과 수 (기본값: 1000)
  sampling?: boolean;      // 대용량 데이터 샘플링 여부
  cacheEnabled?: boolean;  // 캐시 사용 여부
}
```

**📄 응답 형식:**

```typescript
interface ChartDataResponse {
  success: boolean;
  data: {
    chartType: string;
    metadata: {
      totalCount: number;      // 전체 데이터 개수
      filteredCount: number;   // 필터링된 데이터 개수
      aggregationType: string; // 집계 방식
      lastUpdated: string;     // 마지막 업데이트 시간
      dataSource: string;      // 데이터 소스 (applyhome, lh 등)
      cacheHit: boolean;       // 캐시 적중 여부
    };
    
    // 선형/막대 차트용 데이터
    chartData?: {
      labels: string[];        // X축 라벨
      datasets: {
        label: string;         // 데이터셋 라벨
        data: number[];        // Y축 데이터
        backgroundColor?: string;
        borderColor?: string;
        borderWidth?: number;
      }[];
    };
    
    // 파이 차트용 데이터
    pieData?: {
      name: string;
      value: number;
      percentage: number;
      color: string;
    }[];
    
    // 히트맵용 데이터
    heatmapData?: {
      xAxis: string[];
      yAxis: string[];
      data: {
        x: number;
        y: number;
        value: number;
        label?: string;
      }[];
      min: number;
      max: number;
    };
    
    // 통계 정보
    statistics: {
      average: number;         // 평균값
      median: number;          // 중앙값
      min: number;            // 최솟값
      max: number;            // 최댓값
      standardDeviation: number; // 표준편차
      trend: 'increasing' | 'decreasing' | 'stable'; // 추세
    };
    
    // 추가 메타데이터
    filters: ChartDataRequest; // 적용된 필터 조건
    pagination?: {
      page: number;
      limit: number;
      hasNext: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

#### 3.1.3 지도 데이터 조회 API

**🗺️ 엔드포인트:** `GET /api/v1/visualization/map-data`

**🔧 요청 파라미터:**

```typescript
interface MapDataRequest {
  // 지역 범위
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  
  // 확대 레벨
  zoomLevel: number;        // 1-20
  
  // 시간 범위
  startDate: string;
  endDate: string;
  
  // 필터 조건 (ChartDataRequest와 동일)
  regions?: string[];
  constructors?: string[];
  priceRange?: { min: number; max: number };
  competitionRateRange?: { min: number; max: number };
  apartmentTypes?: string[];
  
  // 지도 특화 옵션
  clusteringEnabled?: boolean; // 마커 클러스터링 사용 여부
  clusterRadius?: number;      // 클러스터링 반경 (픽셀)
  includeHeatmap?: boolean;    // 히트맵 데이터 포함 여부
  markerLimit?: number;        // 최대 마커 수 (기본값: 500)
}
```

**📄 응답 형식:**

```typescript
interface MapDataResponse {
  success: boolean;
  data: {
    markers: {
      id: string;
      position: {
        lat: number;
        lng: number;
      };
      title: string;
      description: string;
      details: {
        houseName: string;
        region: string;
        constructor: string;
        totalUnits: number;
        competitionRate: number;
        subscriptionResult: string;
        price: number;
        apartmentType: string;
        noticeDate: string;
        subscriptionPeriod: {
          start: string;
          end: string;
        };
        announcementDate: string;
      };
      markerStyle: {
        color: string;
        icon: string;
        size: 'small' | 'medium' | 'large';
      };
      clusterInfo?: {
        isCluster: boolean;
        memberCount: number;
        averageCompetitionRate: number;
      };
    }[];
    
    // 히트맵 데이터 (요청 시)
    heatmapData?: {
      points: {
        lat: number;
        lng: number;
        weight: number; // 0-1 범위
      }[];
      radius: number;
      maxIntensity: number;
    };
    
    // 통계 정보
    statistics: {
      totalMarkers: number;
      clusterCount: number;
      averageCompetitionRate: number;
      regionDistribution: {
        [region: string]: number;
      };
    };
    
    metadata: {
      bounds: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
      zoomLevel: number;
      lastUpdated: string;
      dataSource: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

#### 3.1.4 트렌드 분석 API

**📈 엔드포인트:** `GET /api/v1/visualization/trend-data`

**🔧 요청 파라미터:**

```typescript
interface TrendDataRequest {
  // 분석 대상
  metric: 'competitionRate' | 'price' | 'supplyCount' | 'successRate';
  
  // 시간 범위
  startDate: string;
  endDate: string;
  
  // 분석 옵션
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  smoothing?: boolean;      // 데이터 스무딩 적용 여부
  forecastPeriods?: number; // 예측할 기간 수
  
  // 비교 분석
  compareWith?: {
    regions?: string[];
    constructors?: string[];
    periods?: string[];     // 이전 년도/분기와 비교
  };
  
  // 필터 조건
  regions?: string[];
  constructors?: string[];
  apartmentTypes?: string[];
}
```

**📄 응답 형식:**

```typescript
interface TrendDataResponse {
  success: boolean;
  data: {
    metric: string;
    granularity: string;
    
    // 시계열 데이터
    timeSeries: {
      date: string;
      value: number;
      smoothedValue?: number;
      confidence?: number;    // 예측 신뢰도 (0-1)
    }[];
    
    // 예측 데이터 (요청 시)
    forecast?: {
      date: string;
      predictedValue: number;
      confidenceInterval: {
        lower: number;
        upper: number;
      };
    }[];
    
    // 트렌드 분석 결과
    analysis: {
      trend: 'increasing' | 'decreasing' | 'stable';
      trendStrength: number;  // -1 ~ 1
      seasonality: boolean;
      changePoints: {
        date: string;
        changeType: 'increase' | 'decrease' | 'volatility';
        magnitude: number;
      }[];
      correlation: {
        [metric: string]: number; // 다른 지표와의 상관관계
      };
    };
    
    // 비교 데이터 (요청 시)
    comparison?: {
      [key: string]: {
        current: number;
        previous: number;
        change: number;
        changePercent: number;
      };
    };
    
    metadata: {
      dataPoints: number;
      accuracy: number;       // 예측 정확도
      lastUpdated: string;
      analysisDate: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

#### 3.1.5 비교 분석 API

**🔍 엔드포인트:** `GET /api/v1/visualization/compare-data`

**🔧 요청 파라미터:**

```typescript
interface CompareDataRequest {
  // 비교 대상
  compareType: 'regions' | 'constructors' | 'periods' | 'apartmentTypes';
  compareItems: string[];   // 비교할 항목들
  
  // 비교 지표
  metrics: ('competitionRate' | 'price' | 'supplyCount' | 'successRate')[];
  
  // 시간 범위
  startDate: string;
  endDate: string;
  
  // 통계 옵션
  includeStatistics?: boolean;
  includeRanking?: boolean;
  includeDistribution?: boolean;
}
```

### 3.2 API 에러 처리 및 상태 코드

```typescript
// HTTP 상태 코드 정의
const API_STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// 에러 코드 정의
const API_ERROR_CODES = {
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CACHE_MISS: 'CACHE_MISS',
  DATA_PROCESSING_ERROR: 'DATA_PROCESSING_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR'
};

// 에러 응답 형식
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      field?: string;
      expectedType?: string;
      receivedValue?: any;
    };
    timestamp: string;
    requestId: string;
    documentation?: string;
  };
}
```

---

## 💻 4. 프론트엔드 기술 스택 상세 (시각화 관련)

### 4.1 핵심 시각화 기술 스택

#### 4.1.1 차트 라이브러리

```typescript
// 패키지 설치 명령어
/*
yarn add @wuba/react-native-echarts echarts
yarn add react-native-chart-kit
yarn add react-native-svg react-native-svg-transformer
yarn add react-native-skia @shopify/react-native-skia
*/

// 의존성 구성
const visualizationDependencies = {
  primary: {
    '@wuba/react-native-echarts': '^1.0.0',  // 주력 차트 라이브러리
    'echarts': '^5.4.0',                      // ECharts 코어
    'react-native-svg': '^13.4.0'            // SVG 렌더링
  },
  secondary: {
    'react-native-chart-kit': '^6.12.0',     // 보조 차트 라이브러리
    '@shopify/react-native-skia': '^0.1.157' // 고성능 그래픽 렌더링
  },
  mapping: {
    'react-native-maps': '^1.8.0',           // 지도 기능
    'react-native-geolocation-service': '^5.3.0', // 위치 서비스
    'react-native-super-cluster': '^1.0.0'   // 마커 클러스터링
  }
};
```

#### 4.1.2 상태 관리 및 데이터 페칭

```typescript
// 상태 관리 및 데이터 페칭 라이브러리
const stateManagementStack = {
  dataFetching: {
    'swr': '^2.2.0',                         // 데이터 페칭 및 캐싱
    'axios': '^1.4.0',                       // HTTP 클라이언트
    'react-query': '^4.29.0'                 // 대안 데이터 페칭 (선택사항)
  },
  stateManagement: {
    'zustand': '^4.3.0',                     // 경량 상태 관리
    'react-hook-form': '^7.45.0'             // 폼 상태 관리
  },
  persistence: {
    '@react-native-async-storage/async-storage': '^1.19.0', // 로컬 스토리지
    'react-native-mmkv': '^2.10.0'          // 고성능 키-값 저장소
  }
};

// SWR 설정
const swrConfig = {
  refreshInterval: 30000,          // 30초마다 자동 갱신
  dedupingInterval: 5000,          // 5초 내 중복 요청 제거
  errorRetryCount: 3,              // 오류 시 재시도 횟수
  errorRetryInterval: 5000,        // 재시도 간격
  onError: (error, key) => {
    console.error(`SWR Error for ${key}:`, error);
    // 에러 추적 서비스에 전송
  }
};

// Zustand 스토어 예시
const useVisualizationStore = create<VisualizationStore>((set, get) => ({
  // 상태
  currentChart: null,
  filters: defaultFilters,
  isLoading: false,
  error: null,
  
  // 액션
  setCurrentChart: (chart) => set({ currentChart: chart }),
  updateFilters: (newFilters) => set({ 
    filters: { ...get().filters, ...newFilters } 
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
}));
```

#### 4.1.3 성능 최적화 도구

```typescript
// 성능 최적화 라이브러리
const performanceOptimizationStack = {
  rendering: {
    'react-native-fast-image': '^8.6.0',    // 이미지 최적화
    'react-window': '^1.8.0',               // 가상화 (웹)
    'react-native-super-grid': '^4.9.0'     // 그리드 가상화
  },
  animation: {
    'react-native-reanimated': '^3.3.0',    // 고성능 애니메이션
    'react-native-gesture-handler': '^2.12.0', // 제스처 처리
    'lottie-react-native': '^6.2.0'         // 벡터 애니메이션
  },
  memory: {
    'react-native-memory-info': '^1.0.0',   // 메모리 모니터링
    'flipper-plugin-react-native-performance': '^0.4.0' // 성능 프로파일링
  }
};

// 메모이제이션 훅 예시
const useMemoizedChartData = (rawData: any[], filters: FilterState) => {
  return useMemo(() => {
    console.time('Data Processing');
    
    const processedData = rawData
      .filter(item => applyFilters(item, filters))
      .map(item => transformData(item))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    console.timeEnd('Data Processing');
    return processedData;
  }, [rawData, filters]);
};

// 가상화된 차트 목록 컴포넌트
const VirtualizedChartList: React.FC<{ charts: ChartConfig[] }> = ({ charts }) => {
  const renderChart = useCallback(({ item, index }: { item: ChartConfig; index: number }) => {
    return (
      <ChartContainer
        key={item.id}
        config={item}
        style={{ height: item.height }}
      />
    );
  }, []);
  
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 300, // 평균 차트 높이
    offset: 300 * index,
    index
  }), []);
  
  return (
    <FlatList
      data={charts}
      renderItem={renderChart}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={3}
      windowSize={5}
      initialNumToRender={2}
    />
  );
};
```

#### 4.1.4 개발 도구 및 품질 관리

```typescript
// 개발 도구 스택
const developmentTools = {
  typeScript: {
    'typescript': '^5.1.0',                 // TypeScript 컴파일러
    '@types/react': '^18.2.0',              // React 타입 정의
    '@types/react-native': '^0.72.0'        // React Native 타입 정의
  },
  linting: {
    'eslint': '^8.44.0',                    // JavaScript 린터
    '@typescript-eslint/parser': '^6.0.0',  // TypeScript ESLint 파서
    'eslint-plugin-react-hooks': '^4.6.0',  // React Hooks 린팅
    'prettier': '^3.0.0'                    // 코드 포매터
  },
  testing: {
    'jest': '^29.5.0',                      // 테스팅 프레임워크
    '@testing-library/react-native': '^12.1.0', // React Native 테스팅
    'detox': '^20.7.0'                      // E2E 테스팅
  },
  debugging: {
    'react-native-debugger': '^0.13.0',     // 디버깅 도구
    'flipper': '^0.200.0',                  // 모바일 디버깅 플랫폼
    'reactotron-react-native': '^5.0.0'     // 개발자 도구
  }
};

// TypeScript 인터페이스 정의
interface ChartComponentProps {
  data: ChartData;
  width: number;
  height: number;
  onInteraction?: (event: ChartInteractionEvent) => void;
  config?: ChartConfiguration;
  style?: ViewStyle;
  testID?: string;
}

interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'heatmap' | 'map';
  labels: string[];
  datasets: Dataset[];
  metadata?: ChartMetadata;
}

interface Dataset {
  label: string;
  data: number[];
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

interface ChartConfiguration {
  responsive: boolean;
  maintainAspectRatio: boolean;
  animation: {
    duration: number;
    easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
  };
  interaction: {
    intersect: boolean;
    mode: 'point' | 'nearest' | 'index';
  };
  plugins: {
    legend: LegendConfiguration;
    tooltip: TooltipConfiguration;
  };
}
```

### 4.2 아키텍처 패턴 및 디자인 원칙

#### 4.2.1 컴포넌트 아키텍처

```typescript
// 컴포넌트 계층 구조
const componentArchitecture = {
  // 최상위 컨테이너
  screens: [
    'DashboardScreen',      // 대시보드 메인 화면
    'AnalyticsScreen',      // 분석 화면
    'ComparisonScreen'      // 비교 분석 화면
  ],
  
  // 페이지 단위 컴포넌트
  containers: [
    'ChartContainer',       // 차트 컨테이너
    'FilterContainer',      // 필터 컨테이너
    'MapContainer'          // 지도 컨테이너
  ],
  
  // 재사용 가능한 컴포넌트
  components: [
    'LineChart',           // 선형 차트
    'BarChart',            // 막대 차트
    'PieChart',            // 파이 차트
    'HeatmapChart',        // 히트맵
    'MapView',             // 지도 뷰
    'ChartToolbar',        // 차트 도구 모음
    'FilterPanel',         // 필터 패널
    'LoadingSpinner',      // 로딩 인디케이터
    'ErrorBoundary'        // 에러 경계
  ],
  
  // 유틸리티 컴포넌트
  utilities: [
    'ChartWrapper',        // 차트 래퍼
    'DataProvider',        // 데이터 제공자
    'ThemeProvider'        // 테마 제공자
  ]
};

// 컴포넌트 합성 패턴
const ChartWithToolbar: React.FC<ChartWithToolbarProps> = ({ 
  chartType, 
  data, 
  onExport,
  onFilter 
}) => {
  return (
    <ChartContainer>
      <ChartToolbar
        onExport={onExport}
        onFilter={onFilter}
        chartType={chartType}
      />
      <ErrorBoundary fallback={<ChartErrorFallback />}>
        <Suspense fallback={<ChartLoadingState />}>
          <DynamicChart type={chartType} data={data} />
        </Suspense>
      </ErrorBoundary>
    </ChartContainer>
  );
};

// 고차 컴포넌트 (HOC) 패턴
const withChartData = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return (props: P & { dataUrl: string }) => {
    const { data, error, isLoading } = useSWR(props.dataUrl, fetcher);
    
    if (isLoading) return <ChartLoadingState />;
    if (error) return <ChartErrorFallback error={error} />;
    if (!data) return <EmptyDataState />;
    
    return <WrappedComponent {...props} data={data} />;
  };
};

// 사용 예시
const EnhancedLineChart = withChartData(LineChart);
```

#### 4.2.2 상태 관리 패턴

```typescript
// Context + Reducer 패턴
const ChartContext = createContext<ChartContextType | undefined>(undefined);

const chartReducer = (state: ChartState, action: ChartAction): ChartState => {
  switch (action.type) {
    case 'SET_CHART_DATA':
      return { ...state, data: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'UPDATE_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'RESET_STATE':
      return initialChartState;
    default:
      return state;
  }
};

const ChartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chartReducer, initialChartState);
  
  const value = useMemo(() => ({
    ...state,
    dispatch
  }), [state]);
  
  return (
    <ChartContext.Provider value={value}>
      {children}
    </ChartContext.Provider>
  );
};

// 커스텀 훅
const useChart = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a ChartProvider');
  }
  return context;
};

// Compound Component 패턴
const Chart = {
  Container: ChartContainer,
  Header: ChartHeader,
  Body: ChartBody,
  Toolbar: ChartToolbar,
  Footer: ChartFooter
};

// 사용 예시
const DashboardChart = () => (
  <Chart.Container>
    <Chart.Header title="경쟁률 추이" />
    <Chart.Toolbar onExport={handleExport} onFilter={handleFilter} />
    <Chart.Body>
      <LineChart data={chartData} />
    </Chart.Body>
    <Chart.Footer>
      <StatisticsSummary data={chartData} />
    </Chart.Footer>
  </Chart.Container>
);
```

#### 4.2.3 성능 최적화 패턴

```typescript
// 가상화 패턴
const VirtualizedChartGrid: React.FC<VirtualizedChartGridProps> = ({ 
  charts,
  itemHeight = 300,
  numColumns = 2 
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  
  const renderItem = useCallback(({ item, index }: { item: ChartConfig; index: number }) => {
    const isVisible = index >= visibleRange.start && index <= visibleRange.end;
    
    return (
      <View style={{ height: itemHeight }}>
        {isVisible ? (
          <LazyChart config={item} />
        ) : (
          <ChartPlaceholder height={itemHeight} />
        )}
      </View>
    );
  }, [visibleRange, itemHeight]);
  
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const start = viewableItems[0].index;
      const end = viewableItems[viewableItems.length - 1].index;
      setVisibleRange({ start: Math.max(0, start - 2), end: end + 2 });
    }
  }, []);
  
  return (
    <FlatList
      data={charts}
      renderItem={renderItem}
      numColumns={numColumns}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ viewAreaCoveragePercentThreshold: 20 }}
      removeClippedSubviews={true}
      maxToRenderPerBatch={6}
      windowSize={10}
    />
  );
};

// 메모이제이션 최적화
const OptimizedChart = React.memo<ChartProps>(({ data, config, ...props }) => {
  const memoizedData = useMemo(() => {
    return processChartData(data);
  }, [data]);
  
  const memoizedConfig = useMemo(() => {
    return { ...defaultConfig, ...config };
  }, [config]);
  
  return (
    <Chart
      data={memoizedData}
      config={memoizedConfig}
      {...props}
    />
  );
}, (prevProps, nextProps) => {
  // 얕은 비교로 리렌더링 최적화
  return (
    prevProps.data === nextProps.data &&
    prevProps.config === nextProps.config &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height
  );
});

// 인터섹션 옵저버 패턴 (웹)
const LazyChart: React.FC<LazyChartProps> = ({ config }) => {
  const [isVisible, setIsVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (chartRef.current) {
      observer.observe(chartRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={chartRef}>
      {isVisible ? (
        <Chart config={config} />
      ) : (
        <ChartSkeleton />
      )}
    </div>
  );
};
```

### 4.3 테스팅 전략

```typescript
// 단위 테스트 예시
describe('ChartDataProcessor', () => {
  test('should process line chart data correctly', () => {
    const rawData = [
      { date: '2024-01', value: 100 },
      { date: '2024-02', value: 150 }
    ];
    
    const processed = processLineChartData(rawData);
    
    expect(processed.labels).toEqual(['2024-01', '2024-02']);
    expect(processed.datasets[0].data).toEqual([100, 150]);
  });
  
  test('should handle empty data gracefully', () => {
    const processed = processLineChartData([]);
    
    expect(processed.labels).toEqual([]);
    expect(processed.datasets[0].data).toEqual([]);
  });
});

// 컴포넌트 테스트 예시
describe('LineChart Component', () => {
  const mockData = {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{ data: [10, 20, 30], label: 'Test' }]
  };
  
  test('should render chart correctly', () => {
    const { getByTestId } = render(
      <LineChart data={mockData} testID="line-chart" />
    );
    
    expect(getByTestId('line-chart')).toBeTruthy();
  });
  
  test('should call onInteraction when chart is tapped', () => {
    const onInteraction = jest.fn();
    const { getByTestId } = render(
      <LineChart 
        data={mockData} 
        onInteraction={onInteraction}
        testID="line-chart" 
      />
    );
    
    fireEvent.press(getByTestId('line-chart'));
    expect(onInteraction).toHaveBeenCalled();
  });
});

// E2E 테스트 예시 (Detox)
describe('Chart Interaction', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  test('should display chart and allow interaction', async () => {
    await element(by.id('dashboard-screen')).tap();
    await expect(element(by.id('competition-trend-chart'))).toBeVisible();
    
    await element(by.id('competition-trend-chart')).tap();
    await expect(element(by.id('chart-detail-modal'))).toBeVisible();
  });
  
  test('should filter chart data', async () => {
    await element(by.id('filter-button')).tap();
    await element(by.id('region-filter')).tap();
    await element(by.text('서울')).tap();
    await element(by.id('apply-filter')).tap();
    
    await expect(element(by.text('서울 데이터만 표시'))).toBeVisible();
  });
});
```

---

## 📋 5. 결론 및 다음 단계

### 5.1 문서 요약

본 FSD Part 2-1-1 문서는 한국 아파트 청약 데이터 시각화 기능의 상세 기술 사양을 정의했습니다. 주요 내용은 다음과 같습니다:

**✅ 완료된 정의:**
- 5가지 핵심 시각화 유형 (Line, Bar, Pie, Heatmap, Map)
- 실시간 데이터 바인딩 및 업데이트 로직
- 포괄적인 사용자 인터랙션 시스템
- React Native ECharts 기반 구현 방안
- 완전한 오류 처리 및 데이터 검증 전략
- RESTful API 설계 (4개 주요 엔드포인트)
- 성능 최적화된 프론트엔드 기술 스택

### 5.2 기술적 의사결정 요약

**📊 시각화 라이브러리:**
- **주력**: React Native ECharts (고성능, 풍부한 기능)
- **보조**: React Native Chart Kit (간단한 차트용)

**🏗️ 아키텍처 패턴:**
- 컴포넌트 합성 및 HOC 패턴
- Context + Reducer 상태 관리
- 가상화 기반 성능 최적화

**🔄 데이터 관리:**
- SWR 기반 데이터 페칭 및 캐싱
- 3단계 캐시 전략 (메모리/로컬/서버)
- WebSocket 실시간 업데이트

### 5.3 다음 단계

**📅 즉시 실행 항목:**
1. **FSD Part 2-1-2 작성**: 리스트뷰 기능 상세 사양
2. **프로토타입 개발**: 핵심 차트 컴포넌트 구현
3. **API 스펙 검토**: 백엔드팀과 API 인터페이스 협의

**🔄 반복 개선 계획:**
1. **성능 벤치마킹**: 대용량 데이터 처리 성능 측정
2. **사용자 테스트**: UI/UX 개선사항 도출
3. **접근성 검토**: WCAG 2.1 AA 준수 확인

### 5.4 위험 요소 및 완화 방안

**⚠️ 주요 위험 요소:**
- React Native ECharts 러닝 커브
- 대용량 데이터 렌더링 성능
- 실시간 업데이트 시 메모리 누수

**🛡️ 완화 방안:**
- 단계적 구현 및 프로토타이핑
- 성능 모니터링 시스템 구축
- 메모리 프로파일링 및 최적화

---

**문서 승인:**
- [ ] 프론트엔드 개발 팀장
- [ ] 백엔드 개발 팀장  
- [ ] UI/UX 디자이너
- [ ] 프로젝트 매니저
- [ ] 기술 아키텍트

**다음 문서:** FSD Part 2-1-2: 리스트뷰 기능 상세 사양