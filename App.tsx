import React, { useState, useEffect, useCallback } from 'react';
import { AppMode, DocumentItem, ShopStats, NotificationMessage } from './types';
import { StudentInterface } from './components/StudentInterface';
import { ShopInterface } from './components/ShopInterface';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { NotificationToast } from './components/NotificationToast';
import {  getFileTypeDisplay } from './utils/fileUtils';
import { database } from './firebase';
import { ref, set, onValue, off } from 'firebase/database';
import Footer from './Footer';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.Student);
  const [shopId, setShopId] = useState<string | null>(localStorage.getItem('docuShareShopId'));
  const [documentQueue, setDocumentQueue] = useState<DocumentItem[]>([]);
  
  const [dailyCounter, setDailyCounter] = useState<number>(1);
  const [lastResetDate, setLastResetDate] = useState<string>(new Date().toDateString());
  
  const initialShopStats: ShopStats = { 
  documentsToday: 0,
  inQueue: 0,
  completedToday: 0,
  totalWaitTime: 0,
  avgWaitTimeCalculatedForItems: 0,
  totalProcessed: 0,
  todayCount: 0,
  avgWaitTimeMinutes: 0,
};

  const [shopStats, setShopStats] = useState<ShopStats>(initialShopStats);
  const [notification, setNotification] = useState<NotificationMessage | null>(null);
  const [soundNotificationsEnabled, setSoundNotificationsEnabled] = useState<boolean>(true);



  // ... (keep all your existing useEffect hooks for audio, localStorage, etc.)

  useEffect(() => {
    // Basic beep sound for notifications
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext) {
      let oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);

      const blob = new Blob([], {type: 'audio/wav'});
      const audio = new Audio(URL.createObjectURL(blob));
      
      audio.onplay = () => {
        if(audioContext.state === 'suspended') audioContext.resume();
        gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.35);
        const newOscillator = audioContext.createOscillator();
        newOscillator.connect(gainNode);
        newOscillator.type = 'sine';
        newOscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        // @ts-ignore
        oscillator = newOscillator;
      };
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (soundNotificationsEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if(!audioContext) return;
        if(audioContext.state === 'suspended') audioContext.resume();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
          console.warn('Audio notification failed:', error);
      }
    }
  }, [soundNotificationsEnabled]);

  useEffect(() => {
    const savedCounter = localStorage.getItem('docuShareCounter');
    const savedResetDate = localStorage.getItem('docuShareResetDate');

    if (savedResetDate && savedResetDate !== new Date().toDateString()) {
      localStorage.setItem('docuShareResetDate', new Date().toDateString());
      setLastResetDate(new Date().toDateString());
      setDailyCounter(1);
      localStorage.setItem('docuShareCounter', '1');
      setShopStats(prev => ({...prev, documentsToday: 0, completedToday: 0, totalWaitTime: 0, avgWaitTimeCalculatedForItems: 0 }));
      showAppNotification('Daily stats reset.', 'info');
    } else if (savedResetDate) {
      setLastResetDate(savedResetDate);
      if (savedCounter) setDailyCounter(parseInt(savedCounter, 10));
    } else {
       localStorage.setItem('docuShareResetDate', lastResetDate);
       localStorage.setItem('docuShareCounter', dailyCounter.toString());
    }
  }, []);

  // UPDATED: Firebase listener that merges with local file data
  useEffect(() => {
    if (currentMode === AppMode.Shop && shopId) {
      const shopDocumentsRef = ref(database, `documents/${shopId}`);
      
      const handleDocumentUpdate = (snapshot: any) => {
        if (snapshot.exists()) {
          const documentsData = snapshot.val();
          const documents: DocumentItem[] = Object.values(documentsData).map((doc: any) => ({
            id: doc.id,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            fileTypeDisplay: doc.fileTypeDisplay,
            uploadTimestamp: doc.uploadTimestamp,
            status: doc.status || 'pending',
            fileData: doc.fileData, // ✅ Get fileData from Firebase!
          }));
          
          documents.sort((a, b) => a.uploadTimestamp - b.uploadTimestamp);
          setDocumentQueue(documents);
        } else {
          setDocumentQueue([]);
        }
      };
      
      onValue(shopDocumentsRef, handleDocumentUpdate);
      
      return () => {
        off(shopDocumentsRef, 'value', handleDocumentUpdate);
      };
    } else {
      setDocumentQueue([]);
    }
  }, [currentMode, shopId]); // ✅ Removed localFileData dependency

  useEffect(() => {
    setShopStats(prev => ({ ...prev, inQueue: documentQueue.length }));
  }, [documentQueue]);

  useEffect(() => {
    if (shopId) localStorage.setItem('docuShareShopId', shopId);
    else localStorage.removeItem('docuShareShopId');
  }, [shopId]);
  
  useEffect(() => {
    localStorage.setItem('docuShareCounter', dailyCounter.toString());
  }, [dailyCounter]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await set(ref(database, 'test'), {
          message: 'Hello Firebase!',
          timestamp: Date.now()
        });
        
        const testRef = ref(database, 'test');
        onValue(testRef, (snapshot) => {
          const data = snapshot.val();
          console.log('Firebase connected! Test data:', data);
          showAppNotification('Firebase connected successfully!', 'success');
        });
      } catch (error) {
        console.error('Firebase connection failed:', error);
        showAppNotification('Firebase connection failed!', 'error');
      }
    };
    
    testConnection();
  }, []);

  const showAppNotification = useCallback((text: string, type: NotificationMessage['type'] = 'info') => {
    setNotification({ id: Date.now().toString(), text, type });
    if (type === 'success' || (type === 'info' && text.toLowerCase().includes('new document'))) {
      playNotificationSound();
    }
  }, [playNotificationSound]);

  const handleSetShopId = (id: string) => {
    const normalizedId = id.toUpperCase().trim();
    setShopId(normalizedId);
    showAppNotification(`Shop "${normalizedId}" is now active.`, 'success');
  };

  // UPDATED: Store file data in Firebase for multi-user access
  const handleFileUpload = async (file: File, shopName?: string, fileData?: string): Promise<string> => {
    const today = new Date();
    const datePrefix = `${String(today.getFullYear()).slice(2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    
    const activeShopName = shopName || shopId || 'UNKNOWN';
    const shopPrefix = activeShopName.substring(0, 4).toUpperCase();
    
    const shopCounterRef = ref(database, `counters/${activeShopName}/${datePrefix}`);
    let currentCounter = 1;
    
    try {
      const counterSnapshot = await new Promise<any>((resolve) => {
        onValue(shopCounterRef, resolve, { onlyOnce: true });
      });
      
      if (counterSnapshot.exists()) {
        currentCounter = counterSnapshot.val() + 1;
      }
      
      await set(shopCounterRef, currentCounter);
      
    } catch (error) {
      console.error('Error managing counter:', error);
      currentCounter = dailyCounter;
      setDailyCounter(prev => prev + 1);
    }
    
    const collectionCode = `${shopPrefix}-${datePrefix}-${String(currentCounter).padStart(3, '0')}`;

    try {
      // Save ALL data including fileData to Firebase
      const documentRef = ref(database, `documents/${activeShopName}/${collectionCode}`);
      console.log('fileData before saving:', fileData);
      await set(documentRef, {
        id: collectionCode,
        fileName: file.name,
        fileSize: file.size,
        fileTypeDisplay: getFileTypeDisplay(file.name),
        uploadTimestamp: Date.now(),
        status: 'pending',
        shopName: activeShopName,
        fileData: fileData, // ✅ Store fileData in Firebase for multi-user access!
      });


      try {
  console.log('fileData before saving:', fileData);

  await set(documentRef, {
    id: collectionCode,
    fileName: file.name,
    fileSize: file.size,
    fileTypeDisplay: getFileTypeDisplay(file.name),
    uploadTimestamp: Date.now(),
    status: 'pending',
    shopName: activeShopName,
    fileData: fileData,
  });

  console.log('✅ Upload successful');
} catch (error) {
  console.error('❌ Firebase set failed:', error);
}


      setDailyCounter(prev => prev + 1);
      
      setShopStats(prev => ({
        ...prev,
        documentsToday: prev.documentsToday + 1,
      }));
      
      showAppNotification(`Document "${file.name}" uploaded to ${activeShopName}! Code: ${collectionCode}`, 'success');
      
      return collectionCode;
      
    } catch (error) {
      console.error('Error uploading to Firebase:', error);
      showAppNotification('Failed to upload document. Please try again.', 'error');
      throw error;
    }
  };

  const handleCompleteDocument = async (docId: string) => {
    const doc = documentQueue.find(d => d.id === docId);
    if (!doc || !shopId) return;

    const waitTime = (Date.now() - doc.uploadTimestamp) / (1000 * 60);

    try {
      const documentRef = ref(database, `documents/${shopId}/${docId}`);
      await set(documentRef, {
        ...doc,
        status: 'completed',
        completedTimestamp: Date.now(),
      });

      setShopStats(prev => ({
        ...prev,
        completedToday: prev.completedToday + 1,
        totalWaitTime: prev.totalWaitTime + waitTime,
        avgWaitTimeCalculatedForItems: prev.avgWaitTimeCalculatedForItems + 1,
      }));
      
      showAppNotification(`Document "${doc.fileName}" (${doc.id}) marked as complete.`, 'info');
      
      setDocumentQueue(prevQueue => prevQueue.filter(d => d.id !== docId));
      
    } catch (error) {
      console.error('Error completing document:', error);
      showAppNotification('Failed to complete document. Please try again.', 'error');
    }
  };
  
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-200 min-h-screen text-neutral-text antialiased">
      <div className="container mx-auto p-4 md:p-5 max-w-screen-xl">
        <Header />
        <ModeSelector currentMode={currentMode} onSwitchMode={setCurrentMode} />

        {currentMode === AppMode.Student && (
          <StudentInterface onFileUpload={handleFileUpload} showNotification={showAppNotification} />
        )}
        {currentMode === AppMode.Shop && (
          <ShopInterface
            shopId={shopId}
            onSetShopId={handleSetShopId}
            documentQueue={documentQueue}
            stats={shopStats}
            onCompleteDocument={handleCompleteDocument}
            soundNotificationsEnabled={soundNotificationsEnabled}
            onToggleSoundNotifications={() => setSoundNotificationsEnabled(prev => !prev)}
            showNotification={showAppNotification}
          />
        )}
      </div>
      {notification && (
        <NotificationToast
          message={notification.text}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}
      <Footer />
    </div>
  );
};

export default App;