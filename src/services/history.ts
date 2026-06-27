// Re-export from unified userActivity module for backward compatibility
export {
  type HistoryEntry,
  type HistoryListResponse,
  type HistoryParams,
  fetchHistory,
  recordHistory,
  deleteHistoryEntry,
  clearHistory,
} from './userActivity'
