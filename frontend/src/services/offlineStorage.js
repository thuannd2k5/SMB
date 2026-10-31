/**
 * Offline Storage Service for SMB Smart Inventory
 * Provides persistent local caching for Store Inventory and Health Analytics
 * using browser localStorage with timestamp tracking.
 */

const STORAGE_KEYS = {
  INVENTORY_ITEMS: 'smb_offline_inventory',
  HEALTH_ANALYTICS: 'smb_offline_health',
  LAST_SYNC: 'smb_offline_last_sync',
};

export const isNetworkOnline = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

/**
 * Lưu danh sách hàng tồn kho vào bộ nhớ Offline máy
 */
export const saveInventoryOffline = (items) => {
  if (!items || !Array.isArray(items)) return;
  try {
    const payload = {
      items,
      cachedAt: new Date().toISOString(),
      count: items.length,
    };
    localStorage.setItem(STORAGE_KEYS.INVENTORY_ITEMS, JSON.stringify(payload));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.warn('[OfflineStorage] Failed to save inventory:', err);
  }
};

/**
 * Lấy danh sách hàng tồn kho từ bộ nhớ Offline máy
 */
export const getInventoryOffline = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY_ITEMS);
    if (!raw) return { items: [], cachedAt: null };
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      cachedAt: parsed.cachedAt || null,
      isOffline: true,
    };
  } catch (err) {
    console.warn('[OfflineStorage] Failed to read offline inventory:', err);
    return { items: [], cachedAt: null };
  }
};

/**
 * Lưu chỉ số sức khỏe kho vào bộ nhớ Offline
 */
export const saveHealthOffline = (healthData) => {
  if (!healthData) return;
  try {
    const payload = {
      data: healthData,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.HEALTH_ANALYTICS, JSON.stringify(payload));
  } catch (err) {
    console.warn('[OfflineStorage] Failed to save health analytics:', err);
  }
};

/**
 * Lấy chỉ số sức khỏe kho từ bộ nhớ Offline
 */
export const getHealthOffline = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HEALTH_ANALYTICS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data || null;
  } catch (err) {
    console.warn('[OfflineStorage] Failed to read offline health:', err);
    return null;
  }
};
