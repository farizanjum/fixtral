// Reddit API Types
export interface RedditPost {
  id: string
  title: string
  selftext: string
  url: string
  author: string
  created_utc: number
  thumbnail?: string
  num_comments?: number
  score?: number
  permalink?: string
}

// Edit Form Types (Gemini Parse Output)
export interface EditForm {
  task_type: 'object_removal' | 'object_addition' | 'color_enhancement' | 'background_removal' | 'text_addition' | 'style_transfer' | 'other'
  instructions: string
  objects_to_remove: string[]
  objects_to_add: string[]
  style: 'realistic' | 'artistic' | 'vintage' | 'modern' | 'other'
  mask_needed: boolean
  additional_instructions?: string
}

// Processing Request Types
export interface EditRequest {
  id: string
  post: RedditPost
  status: 'pending' | 'processing' | 'completed' | 'failed'
  editForm?: EditForm
  editedImageUrl?: string
  error?: string
  processingTime?: number
  timestamp: number
}

// History Item Types
export interface HistoryItem {
  id: string
  postId: string
  postTitle: string
  requestText: string
  status: 'completed' | 'failed'
  originalImageUrl: string
  editedImageUrl?: string
  editForm: EditForm
  timestamp: number
  processingTime?: number
}

// API Response Types
export interface RedditApiResponse {
  posts: RedditPost[]
  total: number
  timestamp: string
  note?: string
}

export interface ParseApiResponse extends EditForm {}

export interface EditApiResponse {
  success: boolean
  imageUrl?: string
  error?: string
  processingTime: number
}

// Component Props Types
export interface QueueViewProps {
  onProcessEdit?: (post: RedditPost) => Promise<void>
  refreshTrigger?: number
}

export interface EditorViewProps {
  currentRequest?: EditRequest
  onDownload?: (url: string, filename: string) => void
}

export interface HistoryViewProps {
  items?: HistoryItem[]
  onViewDetails?: (item: HistoryItem) => void
  onDownload?: (url: string, filename: string) => void
}

// Dashboard State Types
export interface DashboardState {
  activeTab: 'queue' | 'editor' | 'history'
  posts: RedditPost[]
  editRequests: EditRequest[]
  history: HistoryItem[]
  selectedResult?: EditRequest
  loading: boolean
}

// Error Types
export interface ApiError {
  message: string
  code?: string
  status?: number
}

// Utility Types
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type TaskType = EditForm['task_type']
export type StyleType = EditForm['style']

// Theme Types
export type Theme = 'dark' | 'light'

export interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}