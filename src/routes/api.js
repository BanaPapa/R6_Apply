const express = require('express');
const router = express.Router();

const crawlController = require('../controllers/crawlController');
const apartmentController = require('../controllers/apartmentController');

// Apartment search and data routes
router.get('/apartments/search', apartmentController.searchApartments);
router.get('/apartments/:id', apartmentController.getApartmentDetails);
router.get('/apartments/:id/competition-history', apartmentController.getCompetitionHistory);

// Crawling control routes
router.post('/crawl/trigger', crawlController.triggerCrawl);
router.get('/crawl/status/:jobId', crawlController.getCrawlStatus);

// Data export routes
router.get('/export/excel', apartmentController.exportToExcel);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;