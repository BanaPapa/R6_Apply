# R6 Apply - Korean Apartment Subscription Data App

A modern web application for crawling and visualizing Korean apartment subscription (청약) data from applyhome.co.kr.

## Features

- **Real-time Data Crawling**: Extract apartment subscription data from applyhome.co.kr
- **Advanced Search**: Filter by region, date range, keyword, and competition rates
- **Interactive Visualization**: Charts, maps, and detailed tables
- **Data Export**: Export results to Excel format
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

**Backend:**
- Node.js with Express.js
- PostgreSQL database
- Puppeteer for web crawling
- Redis for caching and job queues

**Frontend:**
- React with TypeScript
- Modern UI components
- Responsive design

## Getting Started

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 15+
- Redis 7+ (optional, for advanced features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/BanaPapa/R6_Apply.git
cd R6_Apply
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Set up PostgreSQL database:
```sql
CREATE DATABASE r6_apply;
```

6. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:3000

## API Endpoints

### Crawling
- `POST /api/crawl/trigger` - Start new crawling job
- `GET /api/crawl/status/:jobId` - Check crawling progress

### Apartment Data
- `GET /api/apartments/search` - Search apartments with filters
- `GET /api/apartments/:id` - Get apartment details
- `GET /api/apartments/:id/competition-history` - Get competition history

### Export
- `GET /api/export/excel` - Export search results to Excel format

## Search Parameters

- `startDate`: Start date in YYYYMM format
- `endDate`: End date in YYYYMM format  
- `region`: Target region (optional)
- `keyword`: Search keyword for apartment name (optional)
- `status`: Subscription status filter
- `minCompetitionRate`: Minimum competition rate
- `maxCompetitionRate`: Maximum competition rate

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run typecheck
```

### Building for Production
```bash
npm run build
```

## Data Sources

- **Primary**: applyhome.co.kr (Korean apartment subscription portal)
- **Secondary**: LH apply.lh.or.kr, reb.or.kr (additional real estate data)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on Excel VBA macro system for apartment subscription data analysis
- Inspired by Korean real estate market data needs
- Built for real estate professionals, investors, and home buyers

## Support

If you encounter any issues or have questions, please open an issue on GitHub.