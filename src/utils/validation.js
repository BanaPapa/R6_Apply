const Joi = require('joi');

/**
 * Validation schemas for API requests
 */

const crawlRequestSchema = Joi.object({
  startDate: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'Start date must be in YYYYMM format',
      'any.required': 'Start date is required'
    }),
    
  endDate: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'End date must be in YYYYMM format',
      'any.required': 'End date is required'
    }),
    
  region: Joi.string()
    .allow('', '공급지역 전체')
    .optional(),
    
  keyword: Joi.string()
    .max(100)
    .allow('')
    .optional()
});

const searchApartmentsSchema = Joi.object({
  startDate: Joi.string().pattern(/^\d{6}$/).optional(),
  endDate: Joi.string().pattern(/^\d{6}$/).optional(),
  region: Joi.string().optional(),
  keyword: Joi.string().max(100).optional(),
  status: Joi.string().valid(
    '1순위 당해마감',
    '1순위 기타마감', 
    '2순위 당해마감',
    '2순위 기타마감',
    '전체 미달',
    '청약 접수중',
    '일부타입 미달',
    '청약 접수일 미도래'
  ).optional(),
  minCompetitionRate: Joi.number().min(0).optional(),
  maxCompetitionRate: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

function validateCrawlRequest(data) {
  return crawlRequestSchema.validate(data, { abortEarly: false });
}

function validateSearchRequest(data) {
  return searchApartmentsSchema.validate(data, { abortEarly: false });
}

/**
 * Custom validation for date range
 */
function validateDateRange(startDate, endDate) {
  const start = new Date(startDate + '01');
  const end = new Date(endDate + '01');
  
  if (start > end) {
    return { error: 'Start date must be before end date' };
  }
  
  const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
  
  if (monthDiff > 11) {
    return { error: 'Date range cannot exceed 12 months' };
  }
  
  return { error: null };
}

module.exports = {
  validateCrawlRequest,
  validateSearchRequest,
  validateDateRange
};