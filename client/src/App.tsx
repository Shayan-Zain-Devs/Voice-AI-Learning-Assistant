import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

interface Segment {
  id: string;
  content: string;
  page_number: number;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = new SpeechRecognition();

function App() {
  const [data, setData] = useState<Segment[]>([]);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  // Fetch all data for the list view
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('textbook_segments').select('*');
      if (error) console.error(error);
      else setData(data);
    };
    fetchData();
  }, []);

  // --- LOGIC: SEARCH THE DATABASE (Keyword Match) ---
  const findAnswerInDB = async (query: string) => {
    setAnswer("Searching my brain...");

    // 1. Clean the query: Remove common words to find the 'Subject'
    const stopWords = ["what", "is", "a", "the", "explain", "tell", "me", "about"];
    const keywords = query.toLowerCase().split(' ').filter(word => !stopWords.includes(word));
    
    // Take the most important word (usually the last one or the longest one)
    const primaryKeyword = keywords[keywords.length - 1]; 

    console.log("Searching for keyword:", primaryKeyword);

    // 2. ADBMS Logic: Using Pattern Matching on the extracted keyword
    const { data, error } = await supabase
      .from('textbook_segments')
      .select('content')
      .ilike('content', `%${primaryKeyword}%`) 
      .limit(1);

    if (error) {
      setAnswer("Error searching database.");
    } else if (data && data.length > 0) {
      const foundContent = data[0].content;
      setAnswer(foundContent);
      
      // Voice Synthesis
      const speech = new SpeechSynthesisUtterance(foundContent);
      window.speechSynthesis.speak(speech);
    } else {
      setAnswer(`I know about B-Trees and Normalization, but I couldn't find "${primaryKeyword}" in my notes.`);
    }
  };

  const handleListen = () => {
    setAnswer(null);
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  recognition.onresult = (event: any) => {
    const current = event.resultIndex;
    const text = event.results[current][0].transcript;
    setTranscript(text);
    setIsListening(false);
    
    // Trigger the DB Search based on what you said
    findAnswerInDB(text); 
  };

  return (
    <div style={{ padding: '40px', background: '#121212', color: 'white', minHeight: '100vh', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>🎙️ Voice-AI Learning Assistant</h1>
      <p style={{ color: '#888' }}>CMS ID: 507257 (Zain Abid)</p>

      <div style={{ margin: '40px auto', padding: '30px', background: '#1e1e1e', borderRadius: '20px', width: '80%', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <button 
          onClick={handleListen} 
          style={{ padding: '20px 40px', fontSize: '18px', borderRadius: '50px', cursor: 'pointer', background: isListening ? '#ff4b2b' : '#00d2ff', border: 'none', color: 'white', fontWeight: 'bold', transition: '0.3s' }}
        >
          {isListening ? '🛑 Stop Listening' : '🎤 Push to Talk'}
        </button>
        
        <p style={{ marginTop: '25px', color: '#00d2ff' }}>"{transcript || 'Ask me: What is a B-Tree?'}"</p>
        
        {answer && (
          <div style={{ marginTop: '20px', padding: '15px', borderLeft: '4px solid #00d2ff', background: '#252525', textAlign: 'left' }}>
            <p><strong>Assistant:</strong> {answer}</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '50px', textAlign: 'left', maxWidth: '700px', margin: 'auto', opacity: 0.6 }}>
        <hr style={{ borderColor: '#333' }} />
        <h3>Raw Textbook Knowledge (Database View):</h3>
        {data.map(item => (
          <p key={item.id} style={{ fontSize: '14px' }}>• {item.content}</p>
        ))}
      </div>
    </div>
  );
}

export default App;