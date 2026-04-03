import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { LogIn, UserPlus, Mail, Lock, User, Hash, Loader2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Signup

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cmsId, setCmsId] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // CRITICAL: This 'data' object is what our DB Trigger 
            // 'handle_new_user' looks for to create the profile!
            data: {
              full_name: fullName,
              cms_id: cmsId,
            },
          },
        });
        if (error) throw error;
        alert('Success! Check your email for the confirmation link.');
      } else {
        // --- LOGIN LOGIC ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Logo Section */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-lg shadow-blue-900/20 mb-4">A</div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Study <span className="text-blue-500">Assistant</span></h1>
        <p className="text-slate-500 text-sm mt-2">{isSignUp ? 'Create your student account' : 'Welcome back, student'}</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <form onSubmit={handleAuth} className="space-y-5">
          
          {isSignUp && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full bg-slate-800 border border-slate-700 p-3 pl-11 rounded-xl focus:border-blue-500 outline-none transition"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="relative">
                <Hash className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                  type="text"
                  placeholder="CMS ID (e.g. 507257)"
                  required
                  className="w-full bg-slate-800 border border-slate-700 p-3 pl-11 rounded-xl focus:border-blue-500 outline-none transition"
                  value={cmsId}
                  onChange={(e) => setCmsId(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-500" size={20} />
            <input
              type="email"
              placeholder="University Email"
              required
              className="w-full bg-slate-800 border border-slate-700 p-3 pl-11 rounded-xl focus:border-blue-500 outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-500" size={20} />
            <input
              type="password"
              placeholder="Password"
              required
              className="w-full bg-slate-800 border border-slate-700 p-3 pl-11 rounded-xl focus:border-blue-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isSignUp ? (
              <><UserPlus size={20} /> Sign Up</>
            ) : (
              <><LogIn size={20} /> Sign In</>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-slate-400 hover:text-blue-400 text-sm transition"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}