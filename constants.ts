
export const MAX_FILE_SIZE_MB = 100;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const LARGE_FILE_THRESHOLD_MB = 10;
export const NOTIFICATION_DURATION = 4000; // ms
export const UPLOAD_SIMULATION_SPEED_MS_PER_STEP = 50; // ms per 1% progress
export const SHOP_ID_MAX_LENGTH = 12;

export const FILE_TYPE_DISPLAY_NAMES: { [key: string]: string } = {
  'pdf': 'PDF', 
  'doc': 'Word', 'docx': 'Word',
  'jpg': 'Image', 'jpeg': 'Image', 'png': 'Image', 'gif': 'Image', 'webp': 'Image', 'svg': 'Image',
  'txt': 'Text', 'rtf': 'RTF', 'odt': 'OpenDoc',
  'ppt': 'PowerPoint', 'pptx': 'PowerPoint',
  'xls': 'Excel', 'xlsx': 'Excel',
  'zip': 'Archive', 'rar': 'Archive', '7z': 'Archive',
  'html': 'HTML', 'css': 'CSS', 'js': 'JavaScript',
  'mp3': 'Audio', 'wav': 'Audio',
  'mp4': 'Video', 'mov': 'Video', 'avi': 'Video',
};

export const DEFAULT_FILE_TYPE_DISPLAY = 'Document';
    