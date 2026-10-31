import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import ScannerPage from './pages/ScannerPage';
import InventoryPage from './pages/InventoryPage';
import SettingsPage from './pages/SettingsPage';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import { Mic } from 'lucide-react';
import { checkHealth } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState('offline');
  const [isChecking, setIsChecking] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const verifyBackend = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await checkHealth();
      // Handle either standard { success: true, service: ... } or wrapped { success: true, data: { ... } }
      const data = response?.data || response;
      if (response?.success || data?.service) {
        setBackendStatus('online');
        setHealthData(data);
      } else {
        setBackendStatus('offline');
      }
    } catch (err) {
      console.warn('Backend health check error:', err.message);
      setBackendStatus('offline');
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    verifyBackend();
    // Periodic health check every 15 seconds
    const interval = setInterval(verifyBackend, 15000);
    return () => clearInterval(interval);
  }, [verifyBackend]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            healthData={healthData}
            isChecking={isChecking}
            backendStatus={backendStatus}
            onNavigate={setActiveTab}
          />
        );
      case 'scanner':
        return <ScannerPage onNavigate={setActiveTab} />;
      case 'inventory':
        return <InventoryPage onNavigate={setActiveTab} />;
      case 'settings':
        return (
          <SettingsPage
            backendStatus={backendStatus}
            healthData={healthData}
            onNavigate={setActiveTab}
          />
        );
      default:
        return (
          <Dashboard
            healthData={healthData}
            isChecking={isChecking}
            backendStatus={backendStatus}
            onNavigate={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center">
      {/* Mobile-first viewport container (constrained to max-w-md: 430px) */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col shadow-2xl relative">
        <Header
          backendStatus={backendStatus}
          onRefreshStatus={verifyBackend}
          isChecking={isChecking}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        />

        <main className="flex-1 px-4 overflow-y-auto">
          {renderActivePage()}
        </main>

        {/* Global Floating Voice Assistant Mic Button */}
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          title="Trợ lý hỏi đáp giọng nói (Voice BI)"
          className="fixed bottom-20 right-4 sm:right-[calc(50%-200px)] z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-300 hover:shadow-indigo-400 flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-2 border-white/80"
        >
          <Mic className="w-5 h-5" />
          <span className="sr-only">Hỏi đáp giọng nói</span>
        </button>

        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Voice BI Conversational Assistant Modal */}
        <VoiceAssistantModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
        />
      </div>
    </div>
  );
}
