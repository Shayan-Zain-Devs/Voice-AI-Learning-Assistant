import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
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

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // The "Live Wire" listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show a loading spinner while checking if the user is logged in
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // THE GUARD: If no session, show Auth screen
  if (!session) {
    return <Auth />;
  }

  // THE MAIN APP: Only visible if 'session' exists
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* 1. Permanent Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">

          {/* Header Context */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold capitalize">{activeTab.replace('-', ' ')}</h1>
              <p className="text-slate-400">
                Welcome back, {session.user.user_metadata.full_name || 'Student'}. Let's reach your goals today.
              </p>
            </div>
            {/* Sign Out Button */}
            <button 
              onClick={() => supabase.auth.signOut()}
              className="bg-slate-900 border border-slate-800 hover:bg-red-900/20 hover:text-red-400 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              Sign Out
            </button>
          </div>

          {/* Tab Logic */}
          {activeTab === 'study' && (
            <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="col-span-8">
                <VoiceHub />
              </div>
              <div className="col-span-4">
                <DailyMission />
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="animate-in fade-in duration-500">
              <Textbooks />
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <Roadmap />
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-lg font-semibold mb-4 text-blue-400">Roadmap Details</h3>
                <p className="text-slate-400 text-sm">
                  Your plan is optimized based on your textbook. Next milestone: Mid-term prep on Day 15.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
              <MasteryHeatMap />
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center justify-center italic text-slate-500 text-center">
                Detailed performance charts and "Weak Topic" history will appear here once you complete more quizzes.
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 animate-in fade-in duration-500">
              <h2 className="text-xl font-bold mb-4">Account Settings</h2>
              <div className="space-y-4 text-slate-400">
                <p>Email: {session.user.email}</p>
                <p>CMS ID: {session.user.user_metadata.cms_id}</p>
                <p className="italic text-sm">Voice preferences and AI personality settings coming soon.</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;