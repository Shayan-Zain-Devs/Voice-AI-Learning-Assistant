export default function Header() {
    return (
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">A</div>
                    <h1 className="text-xl font-bold tracking-tight">AI Study <span className="text-blue-500">Assistant</span></h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">Student ID: 507257</span>
                    <button className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md text-sm transition">Logout</button>
                </div>
            </div>
        </header>
    );
}