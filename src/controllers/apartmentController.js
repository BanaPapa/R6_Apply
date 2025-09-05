const logger = require('../utils/logger');
const { query, transaction } = require('../config/database');
const { validateSearchRequest } = require('../utils/validation');
const { formatNumber } = require('../utils/dataProcessor');

class ApartmentController {
  /**
   * Search apartments with filters
   * GET /api/apartments/search
   */
  async searchApartments(req, res) {
    try {
      const { error, value } = validateSearchRequest(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid search parameters',
          details: error.details
        });
      }

      const {
        startDate,
        endDate,
        region,
        keyword,
        status,
        minCompetitionRate,
        maxCompetitionRate,
        page,
        limit
      } = value;

      const offset = (page - 1) * limit;
      
      // Build dynamic query
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (region && region !== '공급지역 전체') {
        whereConditions.push(`a.region ILIKE $${paramIndex}`);
        queryParams.push(`%${region}%`);
        paramIndex++;
      }

      if (keyword) {
        whereConditions.push(`a.house_name ILIKE $${paramIndex}`);
        queryParams.push(`%${keyword}%`);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`cd.subscription_result = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (minCompetitionRate !== undefined) {
        whereConditions.push(`cd.average_competition_rate >= $${paramIndex}`);
        queryParams.push(minCompetitionRate);
        paramIndex++;
      }

      if (maxCompetitionRate !== undefined) {
        whereConditions.push(`cd.average_competition_rate <= $${paramIndex}`);
        queryParams.push(maxCompetitionRate);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      const searchQuery = `
        SELECT 
          a.id,
          a.house_manage_no,
          a.region,
          a.house_name,
          a.constructor,
          si.notice_date,
          si.subscription_start,
          si.subscription_end,
          si.announcement_date,
          si.total_units,
          cd.first_round_applications,
          cd.average_competition_rate,
          cd.max_competition_rate,
          cd.subscription_result,
          cd.record_date
        FROM apartments a
        LEFT JOIN supply_info si ON a.id = si.apartment_id
        LEFT JOIN competition_data cd ON a.id = cd.apartment_id
        ${whereClause}
        ORDER BY cd.record_date DESC, cd.average_competition_rate DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT a.id) as total
        FROM apartments a
        LEFT JOIN supply_info si ON a.id = si.apartment_id
        LEFT JOIN competition_data cd ON a.id = cd.apartment_id
        ${whereClause}
      `;

      const [searchResult, countResult] = await Promise.all([
        query(searchQuery, queryParams),
        query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
      ]);

      const apartments = searchResult.rows.map(apartment => ({
        id: apartment.id,
        houseManageNo: apartment.house_manage_no,
        region: apartment.region,
        houseName: apartment.house_name,
        constructor: apartment.constructor,
        noticeDate: apartment.notice_date,
        subscriptionPeriod: `${apartment.subscription_start} ~ ${apartment.subscription_end}`,
        announcementDate: apartment.announcement_date,
        totalUnits: formatNumber(apartment.total_units),
        firstRoundApplications: formatNumber(apartment.first_round_applications),
        averageCompetitionRate: apartment.average_competition_rate,
        maxCompetitionRate: apartment.max_competition_rate,
        subscriptionResult: apartment.subscription_result,
        recordDate: apartment.record_date
      }));

      const totalCount = parseInt(countResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        apartments,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });

    } catch (error) {
      logger.error('Failed to search apartments:', error);
      res.status(500).json({
        error: 'Failed to search apartments',
        message: error.message
      });
    }
  }

  /**
   * Get apartment details by ID
   * GET /api/apartments/:id
   */
  async getApartmentDetails(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'Invalid apartment ID' });
      }

      const apartmentQuery = `
        SELECT 
          a.*,
          si.notice_date,
          si.subscription_start,
          si.subscription_end,
          si.announcement_date,
          si.total_units,
          cd.first_round_applications,
          cd.average_competition_rate,
          cd.max_competition_rate,
          cd.subscription_result,
          cd.status_breakdown,
          cd.record_date
        FROM apartments a
        LEFT JOIN supply_info si ON a.id = si.apartment_id
        LEFT JOIN competition_data cd ON a.id = cd.apartment_id
        WHERE a.id = $1
        ORDER BY cd.record_date DESC
        LIMIT 1
      `;

      const result = await query(apartmentQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Apartment not found' });
      }

      const apartment = result.rows[0];
      
      res.json({
        id: apartment.id,
        houseManageNo: apartment.house_manage_no,
        region: apartment.region,
        houseName: apartment.house_name,
        constructor: apartment.constructor,
        address: apartment.address,
        coordinates: apartment.coordinates,
        noticeDate: apartment.notice_date,
        subscriptionPeriod: `${apartment.subscription_start} ~ ${apartment.subscription_end}`,
        announcementDate: apartment.announcement_date,
        totalUnits: apartment.total_units,
        firstRoundApplications: apartment.first_round_applications,
        averageCompetitionRate: apartment.average_competition_rate,
        maxCompetitionRate: apartment.max_competition_rate,
        subscriptionResult: apartment.subscription_result,
        statusBreakdown: apartment.status_breakdown,
        lastUpdated: apartment.record_date
      });

    } catch (error) {
      logger.error('Failed to get apartment details:', error);
      res.status(500).json({
        error: 'Failed to get apartment details',
        message: error.message
      });
    }
  }

  /**
   * Get competition history for apartment
   * GET /api/apartments/:id/competition-history
   */
  async getCompetitionHistory(req, res) {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'Invalid apartment ID' });
      }

      const historyQuery = `
        SELECT 
          record_date,
          first_round_applications,
          average_competition_rate,
          max_competition_rate,
          subscription_result
        FROM competition_data
        WHERE apartment_id = $1 
          AND record_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
        ORDER BY record_date DESC
      `;

      const result = await query(historyQuery, [id]);

      const history = result.rows.map(record => ({
        date: record.record_date,
        firstRoundApplications: record.first_round_applications,
        averageCompetitionRate: record.average_competition_rate,
        maxCompetitionRate: record.max_competition_rate,
        subscriptionResult: record.subscription_result
      }));

      res.json({ history });

    } catch (error) {
      logger.error('Failed to get competition history:', error);
      res.status(500).json({
        error: 'Failed to get competition history',
        message: error.message
      });
    }
  }

  /**
   * Export apartments to Excel
   * GET /api/export/excel
   */
  async exportToExcel(req, res) {
    try {
      // Similar to search but without pagination
      const { error, value } = validateSearchRequest(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid export parameters',
          details: error.details
        });
      }

      // Build query similar to searchApartments but without limit
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      const { region, keyword, status, minCompetitionRate, maxCompetitionRate } = value;

      if (region && region !== '공급지역 전체') {
        whereConditions.push(`a.region ILIKE $${paramIndex}`);
        queryParams.push(`%${region}%`);
        paramIndex++;
      }

      if (keyword) {
        whereConditions.push(`a.house_name ILIKE $${paramIndex}`);
        queryParams.push(`%${keyword}%`);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`cd.subscription_result = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      const exportQuery = `
        SELECT 
          a.region,
          a.house_name,
          a.constructor,
          si.notice_date,
          si.subscription_start,
          si.subscription_end,
          si.announcement_date,
          si.total_units,
          cd.first_round_applications,
          cd.average_competition_rate,
          cd.max_competition_rate,
          cd.subscription_result
        FROM apartments a
        LEFT JOIN supply_info si ON a.id = si.apartment_id
        LEFT JOIN competition_data cd ON a.id = cd.apartment_id
        ${whereClause}
        ORDER BY cd.record_date DESC, cd.average_competition_rate DESC
      `;

      const result = await query(exportQuery, queryParams);

      // Format data for Excel export
      const excelData = result.rows.map(apartment => ({
        '지역': apartment.region,
        '주택명': apartment.house_name,
        '시공사': apartment.constructor || '-',
        '모집공고일': apartment.notice_date || '-',
        '청약시작일': apartment.subscription_start || '-',
        '청약종료일': apartment.subscription_end || '-',
        '당첨자발표일': apartment.announcement_date || '-',
        '총공급세대수': apartment.total_units || '-',
        '1순위접수건수': apartment.first_round_applications || '-',
        '평균경쟁률': apartment.average_competition_rate || '-',
        '최고경쟁률': apartment.max_competition_rate || '-',
        '청약결과': apartment.subscription_result || '-'
      }));

      // Set headers for Excel download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=apartments_${new Date().toISOString().split('T')[0]}.json`);
      
      res.json({
        data: excelData,
        exportDate: new Date().toISOString(),
        totalRecords: excelData.length
      });

    } catch (error) {
      logger.error('Failed to export apartments:', error);
      res.status(500).json({
        error: 'Failed to export apartments',
        message: error.message
      });
    }
  }
}

module.exports = new ApartmentController();