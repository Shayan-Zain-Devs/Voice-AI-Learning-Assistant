import { useState } from 'react';
import Sidebar from './components/Sidebar';
import VoiceHub from './components/VoiceHub';
import Roadmap from './components/RoadMap';
import MasteryHeatMap from './components/MasteryHeatMap';
import DailyMission from './components/DailyMission';
import Textbooks from './components/Textbooks';

function App() {
  const [activeTab, setActiveTab] = useState('study');

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* 1. Permanent Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">

          {/* Header context - changes based on page */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold capitalize">{activeTab.replace('-', ' ')}</h1>
            <p className="text-slate-400">Welcome back, Zain. Let's reach your goals today.</p>
          </div>

          {/* Conditional Rendering Logic */}
          {activeTab === 'study' && (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8">
                <VoiceHub />
              </div>
              <div className="col-span-4">
                <DailyMission />
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <Roadmap />
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-lg font-semibold mb-4 text-blue-400">Roadmap Details</h3>
                <p className="text-slate-400 text-sm">Your 30-day plan is optimized based on your textbook: "Database Systems". Next milestone: Mid-term prep on Day 15.</p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MasteryHeatMap />
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center justify-center italic text-slate-500">
                Performance charts and "Weak Topic" history will appear here.
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <h2 className="text-xl font-bold mb-4">Account Settings</h2>
              <p className="text-slate-400 italic">Configure your AI voice preference and textbook upload history here.</p>
            </div>
          )}

          {activeTab === 'library' && (
            <Textbooks />
          )}

        </div>
      </main>
    </div>
  );
}

export default App;