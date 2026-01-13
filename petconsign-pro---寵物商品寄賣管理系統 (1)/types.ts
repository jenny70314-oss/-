
export interface Product {
  id: string;
  category: string;
  name: string;
  wholesalePrice: number;
  retailPrice: number;
}

export interface InventoryItem extends Product {
  consignmentTotal: number; // 寄賣總數
  weeklySales: number;      // 每週賣出
}

export interface SummaryStats {
  totalRevenue: number;
  totalCost: number;      // 已售出的總批價
  totalProfit: number;
  totalUnitsSold: number;
  remainingStockCount: number;
  totalConsignmentValue: number; // 原始寄賣的總進貨價值 (總批價)
}
