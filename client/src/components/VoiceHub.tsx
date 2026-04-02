import { useState } from 'react';

export default function VoiceHub() {
    const [isListening, setIsListening] = useState(false);

    return (
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-2xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-blue-600/5 blur-[120px] rounded-full"></div>

            <h2 className="text-xl font-semibold mb-8 text-slate-200">Voice Assessment Mode</h2>

            {/* Pulsing Visualizer (Only visible when listening) */}
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isListening ? 'bg-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.5)] scale-110' : 'bg-slate-800'}`}>
                <button
                    onClick={() => setIsListening(!isListening)}
                    className="text-4xl"
                >
                    {isListening ? '🛑' : '🎙️'}
                </button>
            </div>

            <p className="mt-8 text-slate-400 text-center max-w-md">
                {isListening ? "Listening... 'Explain what happens to a Foreign Key during a DELETE CASCADE?'" : "Click the mic to start your oral quiz"}
            </p>

            {/* Live Transcript Placeholder */}
            <div className="mt-10 w-full bg-black/20 p-4 rounded-lg border border-white/5 font-mono text-sm text-blue-300">
                <span className="text-slate-500">Live Transcript:</span> {isListening ? "Student is explaining the concept of..." : "Waiting for voice input..."}
            </div>
        </div>
    );
}