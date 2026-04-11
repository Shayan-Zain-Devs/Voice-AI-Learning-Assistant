import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import VoiceHub from './components/VoiceHub';
import Roadmap from './components/RoadMap';
import MasteryHeatMap from './components/MasteryHeatMap';
import DailyMission from './components/DailyMission';
import Textbooks from './components/Textbooks';

function App() {
  const [activeTab, setActiveTab] = useState('study');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- NEW GLOBAL STATE ---
  const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedBookId, setSelectedBookId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!session) return <Auth />;

  return (
    <div className="flex min-h-screen bg-bg-main text-white relative">
      
      {/* 1. TOP PROGRESS BAR (Persistent) */}
      {isGlobalProcessing && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[100] bg-white/5">
          <div 
            className="h-full bg-accent-lime transition-all duration-700 ease-out shadow-[0_0_15px_rgba(190,242,100,0.6)]"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 ml-64 p-8 relative">
        
        {/* 2. FLOATING PROCESSING STATUS (Persistent) */}
        {isGlobalProcessing && (
          <div className="fixed bottom-8 right-8 bg-bg-card border border-border-color p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-8 z-50">
            <div className="w-12 h-12 rounded-full border-4 border-accent-lime/10 border-t-accent-lime animate-spin"></div>
            <div>
               <p className="text-sm font-bold text-white">AI Engine Working... {uploadProgress}%</p>
               <p className="text-xs text-slate-500">Injecting knowledge & building roadmap.</p>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          {activeTab === 'study' && (
            <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="col-span-8">
                <VoiceHub selectedBookId={selectedBookId} setSelectedBookId={setSelectedBookId} />
              </div>
              <div className="col-span-4">
                <DailyMission selectedBookId={selectedBookId} />
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <Textbooks 
              setIsGlobalProcessing={setIsGlobalProcessing} 
              setUploadProgress={setUploadProgress} 
              isGlobalProcessing={isGlobalProcessing}
              setSelectedBookId={setSelectedBookId}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'roadmap' && (
            <Roadmap 
              selectedBookId={selectedBookId} 
              setSelectedBookId={setSelectedBookId} 
            />
          )}
          {activeTab === 'analytics' && <MasteryHeatMap />}
          {activeTab === 'settings' && (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <h2 className="text-xl font-bold">Account: {session.user.email}</h2>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;