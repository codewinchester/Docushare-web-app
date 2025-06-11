export enum AppMode {
  Student = 'student',
  Shop = 'shop',
}

export interface DocumentItem {
  id: string; // collection code
  fileName: string;
  fileSize: number; // in bytes
  fileTypeDisplay: string; // e.g., 'PDF', 'Word'
  uploadTimestamp: number; // timestamp
  originalFile?: File; 
  fileData?: string; // ✅ Already added - stores base64 file data
  status?: 'pending' | 'completed';
}

// 🔥 NEW: Shop statistics interface (updated from your current version)
export interface ShopStats {
  totalProcessed: number; // ✅ Used in ShopInterface
  todayCount: number; // ✅ Used in ShopInterface  
  avgWaitTimeMinutes: number; // ✅ Used for wait time calculation
  avgWaitTimeCalculatedForItems: number; // ✅ Used for avg calculation
  
  // Legacy fields (keeping for compatibility)
  documentsToday: number;
  inQueue: number;
  completedToday: number;
  totalWaitTime: number;
}

export interface NotificationMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning'; // ✅ Added 'warning' type used in ShopInterface
}

// 🔥 NEW: Component prop interfaces
export interface StudentInterfaceProps {
  onFileUpload: (file: File, shopName: string, fileData: string) => string;
  showNotification: (text: string, type?: NotificationMessage['type']) => void;
}

export interface ShopInterfaceProps {
  shopId: string | null;
  onSetShopId: (id: string) => void;
  documentQueue: DocumentItem[];
  stats: ShopStats;
  onCompleteDocument: (docId: string) => void;
  soundNotificationsEnabled: boolean;
  onToggleSoundNotifications: () => void;
  showNotification: (text: string, type?: NotificationMessage['type']) => void;
}

// 🔥 NEW: File handling utility types
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileSize?: number;
}

export interface MimeTypeMap {
  [extension: string]: string;
}

// 🔥 NEW: Upload state management types
export interface UploadState {
  isUploading: boolean;
  progress: number;
  selectedFile: File | null;
  fileData: string | null;
  error: string | null;
}

// 🔥 NEW: Download operation types  
export interface DownloadOperation {
  documentId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}