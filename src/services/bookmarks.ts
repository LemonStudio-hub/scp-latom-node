// Re-export from unified userActivity module for backward compatibility
export {
  type BookmarkItem,
  type BookmarksResponse,
  type BookmarkCheckResponse,
  type BookmarkActionResponse,
  fetchBookmarks,
  addBookmark,
  removeBookmark,
  checkBookmark,
} from './userActivity'
