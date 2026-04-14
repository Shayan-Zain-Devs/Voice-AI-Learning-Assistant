import { Mic2, BookOpen, BarChart3, Settings, LogOut, Library } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error.message);
    };

    const menuItems = [
        { id: 'study', label: 'Voice Study', icon: Mic2 },
        { id: 'library', label: 'My Textbooks', icon: Library },
        { id: 'roadmap', label: 'My Roadmap', icon: BookOpen },
        { id: 'analytics', label: 'Mastery & Stats', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="w-64 h-screen bg-bg-card border-r border-border-color flex flex-col fixed left-0 top-0 z-20">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-accent-lime rounded-lg flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(190,242,100,0.3)]">A</div>
                <span className="text-xl font-bold tracking-tight text-white">AI Assistant</span>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                            ? 'bg-accent-lime text-black shadow-lg shadow-accent-lime/20 font-bold'
                            : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                            }`}
                    >
                        <item.icon size={20} className={activeTab === item.id ? 'text-black' : 'text-slate-500'} />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-border-color">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 transition"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}