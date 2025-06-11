import React, { useState, useCallback, useRef } from 'react';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, UPLOAD_SIMULATION_SPEED_MS_PER_STEP } from '../constants';
import { formatFileSize, getFileTypeDisplay } from '../utils/fileUtils';
import { NotificationMessage } from '../types';


interface StudentInterfaceProps {
  onFileUpload: (file: File, shopName?: string, fileData?: string) => Promise<string>;
  showNotification: (text: string, type?: NotificationMessage['type']) => void;
}


const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-400 mb-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const SuccessIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 text-accent-green mb-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const InfoIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-sky-700">
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

const ShopIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-brand-primary">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.001 3.001 0 0 1-.621-4.72L4.318 3.44A1.5 1.5 0 0 1 5.378 3h13.243a1.06 1.06 0 0 1 1.06 1.44L18.622 7.62a3.001 3.001 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
  </svg>
);

// 🔥 NEW: File to Base64 conversion function
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const StudentInterface: React.FC<StudentInterfaceProps> = ({ onFileUpload, showNotification }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shopName, setShopName] = useState<string>('');
  const [shopError, setShopError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [collectionCode, setCollectionCode] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setFileError(null);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File is too large. Max size: ${MAX_FILE_SIZE_MB}MB. Your file: ${formatFileSize(file.size)}`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleShopNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toUpperCase().trim();
    setShopName(value);
    setShopError(null);
    
    if (value && value.length < 3) {
      setShopError('Shop name must be at least 3 characters long');
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }, []);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // 🔥 UPDATED: Now converts file to base64 and passes it to onFileUpload
  const simulateUpload = useCallback(async () => {
    if (!selectedFile || !shopName.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);
    setCollectionCode(null);

    try {
      // Convert file to base64
      console.log('Converting file to base64...');
      const fileData = await fileToBase64(selectedFile);
      console.log('File converted to base64, length:', fileData.length);

       // Simulate upload progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += 1;
            setUploadProgress(progress);

            if (progress >= 100) {
              clearInterval(interval);

              // ✅ Use an async IIFE to handle the await
              (async () => {
                try {
                  const code = await onFileUpload(selectedFile, shopName.trim(), fileData);
                  console.log('Upload completed with code:', code);

                  setCollectionCode(code);
                  setIsUploading(false);
                } catch (error) {
                  console.error('Upload failed:', error);
                  showNotification('Upload failed. Please try again.', 'error');
                  setIsUploading(false);
                }
              })();
            }
          }, UPLOAD_SIMULATION_SPEED_MS_PER_STEP / (selectedFile.size / (1024 * 1024) > 10 ? 2 : 1));

      
    } catch (error) {
      console.error('File conversion failed:', error);
      showNotification('Failed to process file. Please try again.', 'error');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, shopName, onFileUpload, showNotification]);

  const handleUploadClick = async () => {
    if (!shopName.trim()) {
      setShopError('Please enter the shop name');
      return;
    }
    if (shopName.trim().length < 3) {
      setShopError('Shop name must be at least 3 characters long');
      return;
    }
    if (selectedFile && !fileError) {
      simulateUpload();
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setShopName('');
    setShopError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setCollectionCode(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (collectionCode && !isUploading) {
    return (
      <div id="success-section" className="bg-white p-6 sm:p-10 rounded-xl shadow-lg text-center interface-animate-in">
        <SuccessIcon />
        <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-text mb-4">Document Uploaded Successfully!</h2>
        <div className="bg-gradient-to-r from-brand-light to-indigo-100 border-2 border-brand-primary rounded-xl p-6 sm:p-8 my-6 sm:my-8 shadow-inner max-w-md mx-auto">
          <p className="text-sm sm:text-base text-indigo-700 font-medium mb-2">Your collection code is:</p>
          <p id="collection-code" className="text-3xl sm:text-4xl font-extrabold text-brand-dark font-mono tracking-wider break-all" aria-label="Collection code">{collectionCode}</p>
        </div>
        <p className="text-subtle-text mb-6 sm:mb-8 max-w-lg mx-auto">Show this code to the print shop owner to collect your document. This code is unique and helps protect your privacy.</p>
        <button 
            onClick={resetUpload} 
            className="btn bg-brand-primary hover:bg-brand-dark focus:ring-brand-primary text-white py-3 px-6 rounded-lg font-semibold transition duration-150 ease-in-out"
        >
            Upload Another Document
        </button>
      </div>
    );
  }

  return (
    <main id="student-interface" className="bg-white p-6 sm:p-10 rounded-xl shadow-lg interface-animate-in" role="tabpanel">
      <div id="upload-section">
        {!collectionCode && (
          <div className="shop-selector bg-gradient-to-r from-slate-50 to-sky-50 border border-slate-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <ShopIcon />
              <h3 className="text-lg font-semibold text-neutral-text">Select Print Shop</h3>
            </div>
            <div className="max-w-md">
              <label htmlFor="shopName" className="block text-sm font-medium text-neutral-text mb-2">
                Enter the shop name where you want to print:
              </label>
              <input
                type="text"
                id="shopName"
                value={shopName}
                onChange={handleShopNameChange}
                placeholder="e.g., BLITZCYBER"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-lg font-medium uppercase tracking-wide transition duration-150 ease-in-out"
                disabled={isUploading}
              />
              {shopError && (
                <p className="error-message bg-red-100 border border-red-300 text-accent-red p-3 rounded-md mt-3 text-sm" role="alert">
                  {shopError}
                </p>
              )}
              <p className="text-xs text-subtle-text mt-2">
                Make sure to enter the exact shop name as told/shown by the shop owner.
              </p>
            </div>
          </div>
        )}

        {!selectedFile && !isUploading && (
          <div
            className={`upload-area border-2 border-dashed rounded-xl p-8 sm:p-16 text-center transition-all duration-300 ease-in-out cursor-pointer 
                        ${isDragOver ? 'border-brand-primary bg-brand-light scale-105' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
            onClick={triggerFileInput}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Click to select file or drag and drop"
          >
            <UploadIcon />
            <p className="upload-text text-xl sm:text-2xl font-semibold text-neutral-text mb-2">Drop your document here or click to select</p>
            <p className="upload-subtext text-sm sm:text-base text-subtle-text">Supports PDF, DOCX, JPG, PNG & more. Max {MAX_FILE_SIZE_MB}MB.</p>
          </div>
        )}
        
        <input 
            type="file" 
            id="fileInput" 
            ref={fileInputRef} 
            className="sr-only" 
            onChange={handleFileChange} 
            accept="*/*"
            aria-hidden="true"
        />
        
        {selectedFile && !isUploading && (
          <div id="file-preview" className="file-preview bg-slate-50 border border-slate-200 rounded-xl p-6 my-6 text-center">
            <h3 className="text-lg font-semibold text-neutral-text mb-1">Selected File:</h3>
            <p className="text-brand-primary font-medium text-xl break-all">{selectedFile.name}</p>
            <p className="text-subtle-text text-sm mt-1">
              Type: {getFileTypeDisplay(selectedFile.name)} | Size: {formatFileSize(selectedFile.size)}
            </p>
            {fileError && <p id="error-message" className="error-message bg-red-100 border border-red-300 text-accent-red p-3 rounded-md my-4 text-sm" role="alert">{fileError}</p>}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <button 
                className="btn bg-brand-primary hover:bg-brand-dark focus:ring-brand-primary text-white py-3 px-6 rounded-lg font-semibold transition duration-150 ease-in-out disabled:bg-slate-400 disabled:cursor-not-allowed" 
                onClick={handleUploadClick} 
                id="upload-btn"
                disabled={!!fileError || !!shopError || !shopName.trim() || isUploading}
              >
                {isUploading ? <span className="loading-spinner inline-block mr-2"></span> : null}
                Upload Document
              </button>
              <button 
                className="btn-outline border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white focus:ring-brand-primary py-3 px-6 rounded-lg font-semibold transition duration-150 ease-in-out" 
                onClick={resetUpload}
                disabled={isUploading}
              >
                Choose Different File
              </button>
            </div>
          </div>
        )}
        
        {isUploading && (
          <div id="progress-container" className="my-8 pt-4 text-center">
            <p className="text-lg font-medium text-neutral-text mb-2">Uploading "{selectedFile?.name}" to {shopName}...</p>
            <div className="progress-bar w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
              <div 
                className="progress-fill h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-100 ease-linear" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="progress-text text-sm text-subtle-text mt-2">{uploadProgress}% complete</p>
          </div>
        )}
      </div>
      
      {!collectionCode && (
        <div className="instructions bg-sky-50 border border-sky-200 rounded-xl p-5 sm:p-6 mt-8">
            <div className="instructions-title text-sky-800 font-semibold mb-3 flex items-center gap-2 text-base sm:text-lg">
                <InfoIcon /> How it works
            </div>
            <ol className="steps-list list-none p-0 m-0 space-y-2 text-sky-700 text-sm sm:text-base">
                {[
                  "Enter the name of the print shop where you want to print.",
                  "Upload your document using the area below.",
                  "Receive a unique collection code instantly.",
                  "Show this code to the print shop owner.",
                  "Collect your printed document - no personal info shared!"
                ].map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 bg-sky-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 mt-0.5">{index + 1}</span>
                    {step}
                  </li>
                ))}
            </ol>
        </div>
      )}
    </main>
  );
};