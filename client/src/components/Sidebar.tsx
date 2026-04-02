import { LayoutDashboard, Mic2, BookOpen, BarChart3, Settings, LogOut, Library } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const menuItems = [
        { id: 'study', label: 'Voice Study', icon: Mic2 },
        { id: 'library', label: 'My Textbooks', icon: Library },
        { id: 'roadmap', label: 'My Roadmap', icon: BookOpen },
        { id: 'analytics', label: 'Mastery & Stats', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
                <span className="text-xl font-bold tracking-tight">AI Assistant</span>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}