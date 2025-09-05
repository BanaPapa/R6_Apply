const logger = require('../utils/logger');
const ApplyHomeCrawler = require('../services/ApplyHomeCrawler');
const { validateCrawlRequest } = require('../utils/validation');

class CrawlController {
  /**
   * Trigger apartment data crawling
   * POST /api/crawl/trigger
   */
  async triggerCrawl(req, res) {
    try {
      const { error, value } = validateCrawlRequest(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request parameters', 
          details: error.details 
        });
      }

      const { startDate, endDate, region, keyword } = value;
      
      logger.info('Triggering crawl job', { 
        startDate, 
        endDate, 
        region, 
        keyword: keyword || 'none' 
      });

      const crawler = new ApplyHomeCrawler();
      const jobId = await crawler.startCrawling({
        startDate,
        endDate,
        region,
        keyword
      });

      res.json({
        success: true,
        jobId,
        message: 'Crawling job started successfully',
        estimatedTime: '2-5 minutes'
      });

    } catch (error) {
      logger.error('Failed to trigger crawl:', error);
      res.status(500).json({
        error: 'Failed to start crawling job',
        message: error.message
      });
    }
  }

  /**
   * Get crawling job status
   * GET /api/crawl/status/:jobId
   */
  async getCrawlStatus(req, res) {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        return res.status(400).json({ error: 'Job ID is required' });
      }

      const crawler = new ApplyHomeCrawler();
      const status = await crawler.getJobStatus(jobId);

      if (!status) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({
        jobId,
        status: status.status,
        progress: status.progress,
        results: status.results,
        error: status.error,
        startedAt: status.startedAt,
        completedAt: status.completedAt
      });

    } catch (error) {
      logger.error('Failed to get crawl status:', error);
      res.status(500).json({
        error: 'Failed to get job status',
        message: error.message
      });
    }
  }
}

module.exports = new CrawlController();