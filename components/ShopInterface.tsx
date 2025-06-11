import React, { useState, useEffect } from 'react';
import { DocumentItem, ShopStats, NotificationMessage } from '../types';
import { SHOP_ID_MAX_LENGTH } from '../constants';
import { formatFileSize } from '../utils/fileUtils';

const InfoIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-sky-700">
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

const EmptyQueueIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 text-slate-400 mb-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125.504-1.125 1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
);

interface ShopInterfaceProps {
  shopId: string | null;
  onSetShopId: (id: string) => void;
  documentQueue: DocumentItem[];
  stats: ShopStats;
  onCompleteDocument: (docId: string) => void;
  soundNotificationsEnabled: boolean;
  onToggleSoundNotifications: () => void;
  showNotification: (text: string, type?: NotificationMessage['type']) => void;
}

const StatCard: React.FC<{ label: string; value: string | number; bgColor?: string, textColor?: string, icon?: React.ReactNode }> = ({ label, value, bgColor = 'bg-white', textColor = 'text-brand-primary' }) => (
  <div className={`${bgColor} p-5 rounded-xl shadow-lg border-l-4 border-brand-primary transition-all hover:shadow-xl`}>
    <p className={`text-3xl font-bold ${textColor} mb-1`}>{value}</p>
    <p className="text-sm text-subtle-text font-medium">{label}</p>
  </div>
);

export const ShopInterface: React.FC<ShopInterfaceProps> = ({
  shopId,
  onSetShopId,
  documentQueue,
  stats,
  onCompleteDocument,
  soundNotificationsEnabled,
  onToggleSoundNotifications,
  showNotification
}) => {
  const [inputShopId, setInputShopId] = useState<string>('');
  const [newItemFlash, setNewItemFlash] = useState<string | null>(null);

  useEffect(() => {
    if (documentQueue.length > 0) {
      const latestItem = documentQueue[documentQueue.length - 1];
      if (latestItem.id !== newItemFlash) {
        setNewItemFlash(latestItem.id); 
        setTimeout(() => setNewItemFlash(null), 1000);
      }
    }
  }, [documentQueue, newItemFlash]);

  const handleSetupShop = () => {
    if (inputShopId.trim()) {
      onSetShopId(inputShopId.trim().toUpperCase());
    } else {
        showNotification("Shop ID cannot be empty.", "error");
    }
  };

  // 🔥 FIXED: Browser-native file download with proper MIME types
  const handleDownload = async (doc: DocumentItem) => {
    try {
      console.log('Starting download for:', doc.fileName);
      console.log('File data available:', !!doc.fileData);
      
      if (doc.fileData) {
        // Get proper MIME type from file extension
        const mimeType = getMimeTypeFromFileName(doc.fileName);
        console.log('MIME type determined:', mimeType);
        
        // Create data URL - let browser handle base64 conversion
        const dataUrl = `data:${mimeType};base64,${doc.fileData}`;
        
        // Use fetch to convert data URL to blob (browser handles everything)
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        console.log('Blob created:', blob.type, blob.size);
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        showNotification(`Downloaded "${doc.fileName}" successfully!`, 'success');
        onCompleteDocument(doc.id);
        
      } else {
        // Fallback for documents without file data
        console.log('No file data available, creating fallback');
        showNotification("File data not available. Creating info file...", 'warning');
        
        const placeholderContent = `Document: ${doc.fileName}\nUploaded: ${new Date(doc.uploadTimestamp).toLocaleString()}\nSize: ${formatFileSize(doc.fileSize)}\nType: ${doc.fileTypeDisplay}\n\nNote: Original file data not available for download.\nThis is an information file about the uploaded document.`;
        
        const blob = new Blob([placeholderContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${doc.fileName.split('.')[0]}_info.txt`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        onCompleteDocument(doc.id);
      }
    } catch (error) {
      console.error('Download failed:', error);
      showNotification("Download failed. Please try again.", 'error');
    }
  };

  // 🔥 IMPROVED: More comprehensive MIME type mapping
  const getMimeTypeFromFileName = (fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'rtf': 'application/rtf',
      'odt': 'application/vnd.oasis.opendocument.text',
      
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
      
      // Archives
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      
      // Other common types
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'csv': 'text/csv',
      'json': 'application/json',
      'xml': 'application/xml',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript'
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  };
  
  const avgWaitTimeDisplay = stats.avgWaitTimeCalculatedForItems > 0 
    ? `${(stats.avgWaitTimeMinutes / 60).toFixed(1)}h`
    : 'N/A';

  if (!shopId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-primary mb-2">Shop Setup</h1>
            <p className="text-subtle-text">Enter your Shop ID to get started</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-primary mb-2">
                Shop ID
              </label>
              <input
                type="text"
                value={inputShopId}
                onChange={(e) => setInputShopId(e.target.value.slice(0, SHOP_ID_MAX_LENGTH))}
                placeholder="Enter your shop ID"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                maxLength={SHOP_ID_MAX_LENGTH}
                onKeyPress={(e) => e.key === 'Enter' && handleSetupShop()}
              />
              <p className="text-xs text-subtle-text mt-1">
                {inputShopId.length}/{SHOP_ID_MAX_LENGTH} characters
              </p>
            </div>
            
            <button
              onClick={handleSetupShop}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
            >
              Start Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-primary mb-2">
                Shop Dashboard
              </h1>
              <p className="text-subtle-text flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-brand-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                  ID: {shopId}
                </span>
                Active and ready for documents
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              <button
                onClick={onToggleSoundNotifications}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  soundNotificationsEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  {soundNotificationsEnabled ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.71-1.59-1.59V9.75c0-.88.71-1.59 1.59-1.59H6.75z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53L7.5 21l-4.72-4.72m0 0H4.51c-.88 0-1.59-.71-1.59-1.59V9.75c0-.88.71-1.59 1.59-1.59H2.78l4.72 4.72z" />
                  )}
                </svg>
                Sound {soundNotificationsEnabled ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            label="Documents in Queue" 
            value={documentQueue.length}
            bgColor="bg-gradient-to-r from-white-500 to-blue-600"
            textColor="text-bg-brand-primary"
          />
          <StatCard 
            label="Total Processed" 
            value={stats.totalProcessed}
            bgColor="bg-gradient-to-r from-white-500 to-green-600"
            textColor="text-bg-brand-primary"
          />
          <StatCard 
            label="Today's Documents" 
            value={stats.todayCount}
            bgColor="bg-gradient-to-r from-white-500 to-purple-600"
            textColor="text-bg-brand-primary"
          />
          <StatCard 
            label="Avg Wait Time" 
            value={avgWaitTimeDisplay}
            bgColor="bg-gradient-to-r from-white-500 to-orange-600"
            textColor="text-white"
          />
        </div>

        {/* Document Queue */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-brand-primary">Document Queue</h2>
              <div className="flex items-center gap-2 text-subtle-text">
                <InfoIcon />
                <span className="text-sm">Click download to complete documents</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {documentQueue.length === 0 ? (
              <div className="text-center py-12">
                <EmptyQueueIcon />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No documents in queue</h3>
                <p className="text-subtle-text">Documents will appear here when customers upload them</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documentQueue.map((doc) => (
                  <div
                    key={doc.id}
                    className={`border rounded-xl p-5 transition-all hover:shadow-md ${
                      newItemFlash === doc.id
                        ? 'border-green-400 bg-green-50 shadow-lg scale-[1.02]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-brand-primary">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5B4.875 8.25 1.5 11.625 1.5 15v2.625c0 .621.504 1.125 1.125 1.125h15.75c.621 0 1.125-.504 1.125-1.125zM10.5 11.25a.75.75 0 000 1.5v3.75a.75.75 0 001.5 0V12a.75.75 0 000-1.5h-1.5z" />
                            </svg>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-brand-primary text-lg truncate">
                              {doc.fileName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-subtle-text">
                              <span className="inline-flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(doc.uploadTimestamp).toLocaleString()}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v3.776m-16.5 0V9a48.055 48.055 0 0116.5 0V9" />
                                </svg>
                                {formatFileSize(doc.fileSize)}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                                {doc.fileTypeDisplay}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};