const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const iconv = require('iconv-lite');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { calculateCompetitionRate, classifySubscriptionResult } = require('../utils/dataProcessor');

class ApplyHomeCrawler {
  constructor() {
    this.baseUrl = 'https://www.applyhome.co.kr';
    this.jobs = new Map(); // In-memory job storage (use Redis in production)
  }

  /**
   * Start crawling job based on VBA logic
   */
  async startCrawling(params) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      status: 'running',
      progress: 0,
      results: [],
      error: null,
      startedAt: new Date(),
      completedAt: null
    };

    this.jobs.set(jobId, job);

    // Run crawling in background
    this.performCrawling(jobId, params).catch(error => {
      logger.error(`Crawling job ${jobId} failed:`, error);
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
        job.completedAt = new Date();
      }
    });

    return jobId;
  }

  /**
   * Main crawling logic adapted from VBA Apply_Run()
   */
  async performCrawling(jobId, params) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      const { startDate, endDate, region, keyword } = params;
      
      // Step 1: Validate date range (from VBA logic)
      if (!this.validateDateRange(startDate, endDate)) {
        throw new Error('Invalid date range');
      }

      job.progress = 10;
      logger.info(`Job ${jobId}: Starting apartment list extraction`);

      // Step 2: Get total count and page count (similar to VBA step 2)
      const { totalCount, pageCount } = await this.getTotalCount(startDate, endDate, region, keyword);
      
      if (totalCount === 0) {
        job.status = 'completed';
        job.completedAt = new Date();
        job.progress = 100;
        return;
      }

      job.progress = 20;
      logger.info(`Job ${jobId}: Found ${totalCount} apartments across ${pageCount} pages`);

      // Step 3: Extract basic apartment info from all pages
      const apartmentsList = [];
      for (let page = 1; page <= pageCount; page++) {
        const apartments = await this.extractApartmentsFromPage(page, startDate, endDate, region, keyword);
        apartmentsList.push(...apartments);
        
        job.progress = 20 + (page / pageCount) * 30; // Progress 20-50%
        logger.info(`Job ${jobId}: Processed page ${page}/${pageCount}`);
      }

      job.progress = 50;
      logger.info(`Job ${jobId}: Extracted ${apartmentsList.length} basic apartment records`);

      // Step 4: Get detailed competition data for each apartment
      const results = [];
      for (let i = 0; i < apartmentsList.length; i++) {
        const apartment = apartmentsList[i];
        
        try {
          const detailedData = await this.getApartmentDetails(apartment);
          results.push({
            ...apartment,
            ...detailedData
          });
          
          job.progress = 50 + ((i + 1) / apartmentsList.length) * 45; // Progress 50-95%
          
          if (i % 10 === 0) {
            logger.info(`Job ${jobId}: Processed ${i + 1}/${apartmentsList.length} apartment details`);
          }
          
        } catch (error) {
          logger.error(`Failed to get details for apartment ${apartment.houseManageNo}:`, error);
          // Continue with basic data
          results.push(apartment);
        }
      }

      // Complete job
      job.status = 'completed';
      job.results = results;
      job.progress = 100;
      job.completedAt = new Date();
      
      logger.info(`Job ${jobId}: Completed successfully with ${results.length} results`);

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
      throw error;
    }
  }

  /**
   * Validate date range (from VBA Apply_Date validation)
   */
  validateDateRange(startDate, endDate) {
    const start = new Date(startDate + '01');
    const end = new Date(endDate + '01');
    const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    return monthDiff >= 0 && monthDiff <= 11; // Max 12 months
  }

  /**
   * Get total count (VBA step 2)
   */
  async getTotalCount(startDate, endDate, region, keyword) {
    const url = `${this.baseUrl}/ai/aia/selectAPTLttotPblancListView.do`;
    const payload = this.buildPayload(startDate, endDate, region, keyword, 1);

    try {
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        responseType: 'arraybuffer'
      });

      const html = iconv.decode(response.data, 'euc-kr');
      const $ = cheerio.load(html);
      
      const totalText = $('.total_txt.dis_in_imp span b').text();
      const totalCount = parseInt(totalText) || 0;
      const pageCount = Math.ceil(totalCount / 10);

      return { totalCount, pageCount };
    } catch (error) {
      logger.error('Failed to get total count:', error);
      throw new Error('Failed to access apartment listing page');
    }
  }

  /**
   * Extract apartments from single page (VBA step 3)
   */
  async extractApartmentsFromPage(page, startDate, endDate, region, keyword) {
    const url = `${this.baseUrl}/ai/aia/selectAPTLttotPblancListView.do`;
    const payload = this.buildPayload(startDate, endDate, region, keyword, page);

    try {
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        responseType: 'arraybuffer'
      });

      const html = iconv.decode(response.data, 'euc-kr');
      const $ = cheerio.load(html);
      
      const apartments = [];
      $('tbody tr').each((index, element) => {
        const $row = $(element);
        
        apartments.push({
          houseManageNo: $row.attr('data-hmno'),
          region: $row.find('td').eq(0).text().trim(),
          houseName: $row.attr('data-honm'),
          constructor: $row.find('td').eq(4).text().trim(),
          noticeDate: $row.find('td').eq(6).text().trim(),
          subscriptionPeriod: $row.find('td').eq(7).html(),
          announcementDate: $row.find('td').eq(8).html()
        });
      });

      return apartments;
    } catch (error) {
      logger.error(`Failed to extract apartments from page ${page}:`, error);
      return [];
    }
  }

  /**
   * Get detailed competition data (VBA step 4)
   */
  async getApartmentDetails(apartment) {
    const url = `${this.baseUrl}/ai/aia/selectAPTCompetitionPopup.do`;
    const payload = `houseManageNo=${apartment.houseManageNo}&pblancNo=${apartment.houseManageNo}&houseNm=${encodeURIComponent(apartment.houseName)}&gvPgmId=AIA01M01`;

    try {
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        responseType: 'arraybuffer'
      });

      const html = iconv.decode(response.data, 'euc-kr');
      const $ = cheerio.load(html);
      
      let totalSupply = 0;
      let firstRoundApplications = 0;
      let maxCompetitionRate = 0;
      const statusCounts = {
        firstLocal: 0,
        firstOther: 0,
        secondLocal: 0,
        secondOther: 0,
        underSubscribed: 0,
        inProgress: 0
      };

      // Process competition data (similar to VBA logic)
      $('tbody tr').each((index, element) => {
        const $row = $(element);
        const priority = $row.find('td').eq(2).text().trim();
        const supply = parseInt($row.find('td').eq(1).text().replace(/,/g, '')) || 0;
        const applications = parseInt($row.find('td').eq(4).text().replace(/,/g, '')) || 0;
        const competitionRateText = $row.find('td').eq(5).text().trim();
        const statusText = $row.find('td').eq(6).text().trim();

        // Calculate totals for first priority applications and supply
        if (priority === '1순위' && $row.attr('data-sem') && $row.attr('data-sem').includes('해당지역')) {
          totalSupply += supply;
        }
        if (priority === '1순위') {
          firstRoundApplications += applications;
        }

        // Track maximum competition rate
        if (competitionRateText && !competitionRateText.includes('△')) {
          const rate = parseFloat(competitionRateText);
          if (rate > maxCompetitionRate) {
            maxCompetitionRate = rate;
          }
        }

        // Classify subscription status (simplified version of VBA logic)
        if (statusText.includes('1순위 마감')) {
          statusCounts.firstLocal++;
        } else if (statusText.includes('접수중')) {
          statusCounts.inProgress++;
        } else if (competitionRateText.includes('△')) {
          statusCounts.underSubscribed++;
        }
      });

      const averageCompetitionRate = totalSupply > 0 ? (firstRoundApplications / totalSupply) : 0;
      const subscriptionResult = classifySubscriptionResult(statusCounts, $('tbody tr').length);

      return {
        totalSupply: totalSupply.toLocaleString(),
        firstRoundApplications: firstRoundApplications.toLocaleString(),
        averageCompetitionRate: averageCompetitionRate.toFixed(2),
        maxCompetitionRate: maxCompetitionRate.toFixed(2),
        subscriptionResult
      };

    } catch (error) {
      logger.error(`Failed to get apartment details for ${apartment.houseManageNo}:`, error);
      throw error;
    }
  }

  /**
   * Build request payload (similar to VBA Payload construction)
   */
  buildPayload(startDate, endDate, region, keyword, page) {
    const params = new URLSearchParams({
      beginPd: startDate,
      endPd: endDate,
      houseDetailSecd: '01', // 민영주택 고정
      pageIndex: page
    });

    if (region && region !== '공급지역 전체') {
      params.append('suplyAreaCode', encodeURIComponent(region));
    }
    
    if (keyword) {
      params.append('houseNm', encodeURIComponent(keyword));
    }

    return params.toString();
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    return this.jobs.get(jobId) || null;
  }
}

module.exports = ApplyHomeCrawler;