// Utility functions for manufacturing data processing

export interface ManufacturingData {
  formulaId: number;
  wipBatchId: number;
  wipBatchNo: string;
  wipActStartDate: number;
  wipCmpltDate: number;
  batchCloseDate: number;
  lineNo: number;
  wipType: 'Product' | 'Ingredient';
  transactionTypeName: string;
  inventoryItemId: number;
  transactionUom: string;
  planQty: number;
  originalQty: number;
  wipQty: number;
  wipPeriodName: string;
  wipRate: number;
  wipValue: number;
  wipBatchStatus: string;
  wipLotNumber: string;
  scrapFactor: number;
  routingId: number;
  reason?: string;
  resource?: string;
}

/**
 * Parse date string to JavaScript Date (handles various formats)
 * @param dateString - Date string in various formats
 * @returns JavaScript Date object
 */
export function parseDate(dateString: string | number): Date {
  if (typeof dateString === 'number') {
    // Handle Julian dates if they're numbers
    const unixEpochJulian = 2440588;
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const unixTimestamp = (dateString - unixEpochJulian) * millisecondsPerDay;
    return new Date(unixTimestamp);
  }
  
  if (!dateString || dateString === '') return new Date();
  
  // Handle common date formats like "04-Jul-2015 10:25:09 AM"
  return new Date(dateString);
}

/**
 * Format date to readable string
 * @param dateValue - Date string or number
 * @returns Formatted date string
 */
export function formatDate(dateValue: string | number): string {
  if (!dateValue) return 'N/A';
  
  try {
    const date = parseDate(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Get month-year from date for grouping
 * @param dateValue - Date string or number
 * @returns Month-Year string (e.g., "Jul-15")
 */
export function getMonthYear(dateValue: string | number): string {
  if (!dateValue) return 'Unknown';
  
  try {
    const date = parseDate(dateValue);
    if (isNaN(date.getTime())) return 'Unknown';
    
    return date.toLocaleDateString('en-US', { 
      year: '2-digit', 
      month: 'short' 
    }).replace(' ', '-').toUpperCase();
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Legacy function for backward compatibility
 */
export function formatJulianDate(julianDate: number): string {
  return formatDate(julianDate);
}

/**
 * Legacy function for backward compatibility
 */
export function getMonthYearFromJulian(julianDate: number): string {
  return getMonthYear(julianDate);
}

/**
 * Calculate batch duration in days
 * @param startDate - Start Julian date
 * @param endDate - End Julian date
 * @returns Duration in days
 */
export function calculateBatchDuration(startDate: number, endDate: number): number {
  if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) return 0;
  return Math.abs(endDate - startDate);
}

/**
 * Group batch data by type (Product vs Ingredient)
 * @param data - Array of manufacturing data rows
 * @returns Grouped data
 */
export function groupByWipType(data: any[]): { products: any[], ingredients: any[] } {
  const products = data.filter(row => row.WIP_TYPE === 'Product');
  const ingredients = data.filter(row => row.WIP_TYPE === 'Ingredient');
  return { products, ingredients };
}

/**
 * Calculate efficiency metrics for batches
 * @param data - Array of manufacturing data rows
 * @returns Efficiency metrics
 */
export function calculateBatchEfficiency(data: any[]): {
  batchId: string;
  planVsActual: number;
  efficiency: number;
  totalValue: number;
}[] {
  const batches = new Map();
  
  data.forEach(row => {
    const batchId = row.WIP_BATCH_NO || row.WIP_BATCH_ID;
    if (!batches.has(batchId)) {
      batches.set(batchId, {
        batchId,
        totalPlan: 0,
        totalActual: 0,
        totalValue: 0,
        productCount: 0
      });
    }
    
    const batch = batches.get(batchId);
    if (row.WIP_TYPE === 'Product') {
      batch.totalPlan += Number(row.PLAN_QTY) || 0;
      batch.totalActual += Number(row.WIP_QTY) || 0;
      batch.totalValue += Number(row.WIP_VALUE) || 0;
      batch.productCount++;
    }
  });
  
  return Array.from(batches.values()).map(batch => ({
    batchId: batch.batchId,
    planVsActual: batch.totalPlan > 0 ? (batch.totalActual / batch.totalPlan) * 100 : 0,
    efficiency: batch.totalPlan > 0 ? Math.min((batch.totalActual / batch.totalPlan) * 100, 100) : 0,
    totalValue: batch.totalValue
  }));
}

/**
 * Get top ingredients by usage
 * @param data - Array of manufacturing data rows
 * @param limit - Number of top ingredients to return
 * @returns Top ingredients with usage data
 */
export function getTopIngredients(data: any[], limit: number = 10): {
  itemId: number;
  totalQty: number;
  totalValue: number;
  batchCount: number;
}[] {
  const ingredients = new Map();
  
  data.filter(row => row.WIP_TYPE === 'Ingredient').forEach(row => {
    const itemId = row.INVENTORY_ITEM_ID;
    if (!ingredients.has(itemId)) {
      ingredients.set(itemId, {
        itemId,
        totalQty: 0,
        totalValue: 0,
        batches: new Set()
      });
    }
    
    const ingredient = ingredients.get(itemId);
    ingredient.totalQty += Math.abs(Number(row.WIP_QTY) || 0);
    ingredient.totalValue += Math.abs(Number(row.WIP_VALUE) || 0);
    ingredient.batches.add(row.WIP_BATCH_NO || row.WIP_BATCH_ID);
  });
  
  return Array.from(ingredients.values())
    .map(ing => ({
      itemId: ing.itemId,
      totalQty: ing.totalQty,
      totalValue: ing.totalValue,
      batchCount: ing.batches.size
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, limit);
}

/**
 * Detect manufacturing data columns
 * @param headers - Array of column headers
 * @returns Object indicating which manufacturing columns are present
 */
export function detectManufacturingColumns(headers: string[]): {
  hasWipBatchNo: boolean;
  hasWipValue: boolean;
  hasWipQty: boolean;
  hasWipType: boolean;
  hasWipStartDate: boolean;
  hasPlanQty: boolean;
  hasScrapFactor: boolean;
  hasWipPeriodName: boolean;
  wipBatchNoCol?: string;
  wipValueCol?: string;
  wipQtyCol?: string;
  wipTypeCol?: string;
  wipStartDateCol?: string;
  planQtyCol?: string;
  scrapFactorCol?: string;
  wipPeriodNameCol?: string;
} {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  const wipBatchNoCol = headers.find(h => 
    h.toLowerCase().includes('wip_batch_no') || 
    h.toLowerCase().includes('batch_no')
  );
  
  const wipValueCol = headers.find(h => 
    h.toLowerCase().includes('wip_value') || 
    h.toLowerCase().includes('value')
  );
  
  const wipQtyCol = headers.find(h => 
    h.toLowerCase().includes('wip_qty') || 
    h.toLowerCase().includes('quantity')
  );
  
  const wipTypeCol = headers.find(h => 
    h.toLowerCase().includes('wip_type') || 
    h.toLowerCase().includes('type')
  );
  
  const wipStartDateCol = headers.find(h => 
    h.toLowerCase().includes('wip_act_start_date') || 
    h.toLowerCase().includes('start_date')
  );
  
  const planQtyCol = headers.find(h => 
    h.toLowerCase().includes('plan_qty') || 
    h.toLowerCase().includes('planned')
  );
  
  const scrapFactorCol = headers.find(h => 
    h.toLowerCase().includes('scrap_factor') || 
    h.toLowerCase().includes('scrap')
  );
  
  const wipPeriodNameCol = headers.find(h => 
    h.toLowerCase().includes('wip_period_name') || 
    h.toLowerCase().includes('period_name') ||
    h.toLowerCase().includes('period')
  );
  
  return {
    hasWipBatchNo: !!wipBatchNoCol,
    hasWipValue: !!wipValueCol,
    hasWipQty: !!wipQtyCol,
    hasWipType: !!wipTypeCol,
    hasWipStartDate: !!wipStartDateCol,
    hasPlanQty: !!planQtyCol,
    hasScrapFactor: !!scrapFactorCol,
    hasWipPeriodName: !!wipPeriodNameCol,
    wipBatchNoCol,
    wipValueCol,
    wipQtyCol,
    wipTypeCol,
    wipStartDateCol,
    planQtyCol,
    scrapFactorCol,
    wipPeriodNameCol
  };
}
