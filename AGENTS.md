# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

This is a Korean apartment subscription (청약) data crawling and visualization application. The project is transitioning from legacy VBA macros to a modern web application stack, focusing on real-time data processing and interactive visualizations for apartment subscription competitive rates and market data.

## Architecture & Technology Stack

**Backend Stack:**
- Runtime: Node.js 18+ LTS with TypeScript 5.0+
- Framework: Express.js 4.18+ with Prisma 5.0+ ORM
- Database: PostgreSQL 15+ (primary), Redis 7.0+ (cache)
- Queue System: Bull Queue (Redis-based)

**Frontend Stack:**
- Framework: React with TypeScript
- Mobile: React Native for mobile app
- Visualization: Chart.js, D3.js for interactive charts
- Maps: Kakao Map API integration
- PWA: Progressive Web App support

**Data Sources:**
- Primary: applyhome.co.kr (Korean apartment subscription portal)
- Secondary: LH apply.lh.or.kr, reb.or.kr (Korean real estate data)

## Key Development Commands

Since this is primarily a documentation-focused repository currently, there are no specific build/test commands defined yet. The documents indicate the following planned commands:

**Backend (when implemented):**
```bash
npm run dev          # Development server
npm run build        # Production build  
npm run test         # Run Jest tests
npm run lint         # ESLint checking
npm run typecheck    # TypeScript validation
```

**Database:**
```bash
npx prisma generate  # Generate Prisma client
npx prisma migrate   # Run database migrations
npx prisma studio    # Open database GUI
```

## Core Business Logic

**Data Processing Pipeline:**
1. **Crawling**: Multi-endpoint scraping of apartment subscription data
2. **Processing**: Competition rate calculation, subscription result classification
3. **Storage**: PostgreSQL with time-series data for trend analysis  
4. **Visualization**: Real-time charts, maps, and dashboards

**Key Algorithms:**
- Competition rate calculation: `applications / supply` with status classification
- Subscription result classification: Complex logic based on application status by region/priority
- Data validation: Multi-stage pipeline (validation → normalization → calculation → classification)

## Important Data Models

**Apartment Data Structure:**
```typescript
interface ApartmentData {
  houseManageNo: string;      // Unique apartment complex ID
  region: string;             // Geographic region
  houseName: string;          // Apartment complex name
  competitionRate: number;    // Current competition ratio
  subscriptionResult: string; // Status classification
  supplyInfo: object;         // Supply details and dates
  coordinates: { lat, lng };  // Map coordinates
}
```

## API Endpoints (Planned)

**Crawling Control:**
- `POST /api/v1/crawl/trigger` - Start new crawling job
- `GET /api/v1/crawl/status/{jobId}` - Check crawling progress

**Data Access:**
- `GET /api/v1/apartments/search` - Search apartments with filters
- `GET /api/v1/apartments/{id}/competition-history` - Historical data

**Real-time Updates:**
- WebSocket events for live competition rate updates
- Region-based and apartment-specific subscriptions

## Error Handling Strategy

The system implements a comprehensive error handling approach:
- **Retry Logic**: Exponential backoff for network failures
- **Classification**: Errors categorized by type and severity
- **Recovery**: Circuit breaker pattern for external API failures
- **Monitoring**: Prometheus metrics with Slack/email alerting

## Performance Requirements

- **Crawling**: < 10 seconds for parallel processing (vs 30+ seconds in VBA)
- **API Response**: < 500ms (95th percentile)
- **Data Accuracy**: > 99.5% success rate
- **Concurrent Users**: Support for 5,000+ simultaneous users
- **Real-time Updates**: WebSocket-based live data streaming

## Development Notes

**Legacy VBA Migration:**
- Original VBA code in `docs/Apply VBA Code.md` shows synchronous, single-threaded approach
- New system uses async/parallel processing for 60-75% speed improvement
- Key VBA functions being migrated: `Apply_Setting()`, `Apply_List()`, `Apply_Run()`

**Data Sources Security:**
- Implements rate limiting and respectful crawling practices
- User-Agent rotation and request throttling
- Error recovery for blocked or rate-limited requests

**Multilingual Support:**
- Primary language: Korean
- Documentation includes English translations
- UI supports Korean apartment market terminology

## File Structure Context

- `docs/PRD.md` - Product requirements and business objectives
- `docs/FSD_Part1.md` - Technical specification for crawling/backend
- `docs/FSD_Part2-1-1_DataVisualization.md` - Frontend visualization specs
- `docs/Apply VBA Code.md` - Original VBA macro code (reference only)

This is a data-intensive application requiring careful attention to web scraping ethics, real-time data processing, and Korean real estate market domain knowledge.

## Git Configuration & Workflow

**Repository Information:**
- Remote URL: https://github.com/BanaPapa/R6_Apply.git
- Branch Strategy: main branch with feature tags

**Git User Configuration:**
```bash
# Git user setup (required for commits)
git config --global user.email "polateria@gmail.com"
git config --global user.name "BanaPapa"
```

**API Configuration (수동 입력 필요):**
```yaml
# GitHub Personal Access Token (PAT) - 사용자가 직접 입력
GITHUB_TOKEN: "your_github_pat_token_here"

# Additional API Keys if needed
KAKAO_API_KEY: "your_kakao_api_key_here"
DATABASE_URL: "your_database_connection_string_here"
```

**Codex Git Workflow:**
1. **자동 태깅**: 코드 수정 완료시 자동으로 태그 생성
   - 태그 형식: `v{YYYY.MM.DD}-{HH.mm}` (예: v2024.01.15-14.30)
   - 의미있는 커밋 메시지와 함께 자동 커밋 생성

2. **커밋 규칙**:
   - 각 작업 단위별로 개별 커밋 생성
   - 커밋 메시지 형식: `[태그] 작업내용 설명`
   - 예: `[v2024.01.15-14.30] Add apartment data crawling logic`

3. **푸시 전략**:
   - 사용자 푸시 요청시 모든 로컬 커밋을 한번에 원격 저장소로 푸시
   - 푸시 전 자동 충돌 검사 및 해결 가이드 제공

**Project Initialization Rules (MANDATORY):**
1. **세션 시작 프로토콜**:
   - **반드시** `docs/PRD.md`를 먼저 읽어서 비즈니스 목표와 요구사항 파악
   - **반드시** `docs/project-progress.md`(존재하는 경우)를 읽어서 현재 프로젝트 상태 파악
   - PRD 요구사항과 현재 진행상황을 기반으로 체계적인 태스크 계획 수립
   - 복잡한 기능을 명확한 의존성을 가진 관리 가능한 태스크로 분해

2. **진행사항 문서화 요구사항**:
   - 모든 개발 활동에 대해 `docs/project-progress.md` 생성 및 유지관리
   - 중요한 코드 수정이나 태스크 완료 후마다 진행상황 파일 업데이트
   - 대화 요약 및 태스크 완료율 포함
   - 블로커, 결정사항, 다음 단계를 명확히 문서화

3. **프로젝트 연속성 보장**:
   - PRD와 진행상황 문서 읽기 없이는 절대 작업 시작 금지
   - 상세한 진행상황 추적을 통해 세션 간 컨텍스트 유지
   - 다른 개발 세션 간 원활한 핸드오프 보장
   - 진행상황 문서에서 이전 결정사항과 근거 참조

**Codex에게 지시사항:**
- 코드 수정 작업 완료시 반드시 태그와 함께 커밋 생성
- 푸시 명령 받으면 모든 미푸시 커밋을 원격 저장소에 업로드
- API 키 설정 필요시 위 설정 섹션 참조하도록 안내
- **프로젝트 시작시 PRD와 project-progress.md 필수 읽기**
- **작업 완료시마다 project-progress.md 업데이트 필수**