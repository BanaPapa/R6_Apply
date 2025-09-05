/**
 * Data processing utilities adapted from VBA logic
 */

/**
 * Calculate competition rate (from VBA logic)
 */
function calculateCompetitionRate(applications, supply) {
  if (!supply || supply === 0) {
    return { rate: 0, formatted: '0.00:1', category: '미달' };
  }

  const rate = applications / supply;
  
  return {
    rate: Math.round(rate * 100) / 100,
    formatted: `${rate.toFixed(2)}:1`,
    category: classifyCompetition(rate)
  };
}

/**
 * Classify competition level
 */
function classifyCompetition(rate) {
  if (rate >= 100) return '초고경쟁';
  if (rate >= 50) return '고경쟁';
  if (rate >= 10) return '중경쟁';
  if (rate >= 1) return '저경쟁';
  return '미달';
}

/**
 * Classify subscription result (adapted from VBA logic)
 */
function classifySubscriptionResult(statusCounts, totalTypes) {
  const { 
    firstLocal, 
    firstOther, 
    secondLocal, 
    secondOther, 
    underSubscribed, 
    inProgress 
  } = statusCounts;

  // VBA logic adaptation
  if (firstLocal === totalTypes) {
    return '1순위 당해마감';
  }
  if (firstOther > 0 && secondLocal === 0 && secondOther === 0) {
    return '1순위 기타마감';
  }
  if (secondLocal > 0 && secondOther === 0) {
    return '2순위 당해마감';
  }
  if (secondOther > 0) {
    return '2순위 기타마감';
  }
  if (underSubscribed === totalTypes) {
    return '전체 미달';
  }
  if (inProgress > 0) {
    return '청약 접수중';
  }
  if (underSubscribed > 0) {
    return '일부타입 미달';
  }
  
  return '청약 접수일 미도래';
}

/**
 * Format date string for display
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  } catch (error) {
    return dateString;
  }
}

/**
 * Parse and clean numeric values
 */
function parseNumericValue(value) {
  if (!value || value === '-') return 0;
  
  if (typeof value === 'string') {
    return parseInt(value.replace(/[^\d]/g, '')) || 0;
  }
  
  return parseInt(value) || 0;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  if (!num || num === 0) return '-';
  return num.toLocaleString();
}

/**
 * Validate apartment data
 */
function validateApartmentData(data) {
  const required = ['houseManageNo', 'region', 'houseName'];
  
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  return true;
}

/**
 * Clean and normalize apartment name
 */
function normalizeApartmentName(name) {
  if (!name) return '';
  
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s가-힣]/g, '');
}

/**
 * Generate search keywords from apartment name
 */
function generateSearchKeywords(apartmentName) {
  if (!apartmentName) return [];
  
  const keywords = apartmentName
    .split(/\s+/)
    .filter(word => word.length > 1)
    .map(word => word.toLowerCase());
    
  return [...new Set(keywords)]; // Remove duplicates
}

module.exports = {
  calculateCompetitionRate,
  classifyCompetition,
  classifySubscriptionResult,
  formatDate,
  parseNumericValue,
  formatNumber,
  validateApartmentData,
  normalizeApartmentName,
  generateSearchKeywords
};