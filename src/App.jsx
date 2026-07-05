import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { calculateNextCycle } from './utils/cycleEngine';
import './App.css';

const SYMPTOM_LIST = [
  { id: 'cramps', label: 'Cramps', icon: '⚡' },
  { id: 'headache', label: 'Headache', icon: '🤕' },
  { id: 'bloating', label: 'Bloating', icon: '🎈' },
  { id: 'tired', label: 'Fatigue', icon: '🥱' },
  { id: 'happy', label: 'Happy', icon: '☀️' },
];

export default function App() {
  // Onboarding States
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [username, setUsername] = useState('');
  const [avgCycleDays, setAvgCycleDays] = useState(28);
  const [lastStart, setLastStart] = useState('');
  const [lastEnd, setLastEnd] = useState('');

  // Main Dashboard States
  const [history, setHistory] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [activeDate, setActiveDate] = useState(new Date());

  // Load setup profiles or existing accounts
  useEffect(() => {
    const savedOnboarding = localStorage.getItem('user_onboarded');
    const savedName = localStorage.getItem('username');
    const savedCycle = localStorage.getItem('avg_cycle_length');
    const savedHistory = JSON.parse(localStorage.getItem('periodHistory')) || [];

    if (savedOnboarding === 'true') {
      setIsOnboarded(true);
      setUsername(savedName || 'Friend');
      if (savedCycle) setAvgCycleDays(parseInt(savedCycle));
      setHistory(savedHistory);
    }
  }, []);

  // Update dynamic predictions based on history logs or user fallback
  useEffect(() => {
    if (history.length > 0) {
      const computedPredictions = calculateNextCycle(history);
      const chosenCycleLength = parseInt(localStorage.getItem('avg_cycle_length') || avgCycleDays);
      
      // If the engine calculates a realistic cycle length (> 10 days), use it.
      // Otherwise, fall back to your custom onboarding cycle entry!
      if (computedPredictions && computedPredictions.averageLength > 10) {
        setPredictions(computedPredictions);
      } else {
        // Fallback calculation using the first day of the last period
        const nextStart = new Date(history[0]); 
        nextStart.setDate(nextStart.getDate() + chosenCycleLength);
        
        setPredictions({
          predictedStart: nextStart.toISOString().split('T')[0],
          averageLength: chosenCycleLength
        });
      }
    }
    if (isOnboarded) {
      localStorage.setItem('periodHistory', JSON.stringify(history));
    }
  }, [history, isOnboarded, avgCycleDays]);

  // Handle Form Submission on entry screen
  const handleOnboardingSubmit = (e) => {
    e.preventDefault();
    if (!username || !lastStart || !lastEnd) {
      alert('Please fill out all onboarding fields to personalize your dashboard.');
      return;
    }

    // Generate explicit date sequences from the user's input window
    const start = new Date(lastStart);
    const end = new Date(lastEnd);
    const generatedHistory = [];

    let current = new Date(start);
    while (current <= end) {
      generatedHistory.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Save configurations permanently to local state
    localStorage.setItem('user_onboarded', 'true');
    localStorage.setItem('username', username);
    localStorage.setItem('avg_cycle_length', avgCycleDays.toString());

    setHistory(generatedHistory);
    setIsOnboarded(true);
  };

  const logPeriodDay = () => {
    const offset = activeDate.getTimezoneOffset();
    const adjustedDate = new Date(activeDate.getTime() - (offset * 60 * 1000));
    const dateString = adjustedDate.toISOString().split('T')[0];

    if (!history.includes(dateString)) {
      setHistory([...history, dateString].sort());
    } else {
      setHistory(history.filter(d => d !== dateString));
    }
  };

  const toggleSymptom = (id) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const clearAppStorage = () => {
    localStorage.clear();
    setIsOnboarded(false);
    setHistory([]);
    setPredictions(null);
    setUsername('');
    setAvgCycleDays(28);
    setLastStart('');
    setLastEnd('');
  };

  const activeDateString = new Date(activeDate.getTime() - (activeDate.getTimezoneOffset() * 60 * 1000))
    .toISOString()
    .split('T')[0];

  // RENDER INTERACTIVE SETUP FORM IF NEW USER
  if (!isOnboarded) {
    return (
      <div className="mobile-container onboarding-mode">
        <header>
          <h1>Welcome</h1>
          <p className="subtitle">Let's set up your custom period tracking profile</p>
        </header>
        <form onSubmit={handleOnboardingSubmit} className="onboarding-form">
          <div className="form-group">
            <label>What should we call you?</label>
            <input 
              type="text" 
              placeholder="Enter username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>How many days does your average cycle last?</label>
            <input 
              type="number" 
              min="20" 
              max="45" 
              value={avgCycleDays}
              onChange={(e) => setAvgCycleDays(parseInt(e.target.value) || 28)}
              required 
            />
          </div>

          <div className="form-group">
            <label>Start date of your last period?</label>
            <input 
              type="date" 
              value={lastStart}
              onChange={(e) => setLastStart(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>End date of your last period?</label>
            <input 
              type="date" 
              value={lastEnd}
              onChange={(e) => setLastEnd(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>
            Enter Dashboard
          </button>
        </form>
      </div>
    );
  }

  // RENDER MAIN DASHBOARD ONCE SET UP LOGS MATCH
  return (
    <div className="mobile-container">
      <header>
        <h1>{username}'s Tracker</h1>
        <p className="subtitle">simple and trusted period calendar</p>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="cycle-status-display">
          <h3>Next Period Predicted</h3>
          <h2 className="prediction-date">{predictions ? predictions.predictedStart : "Calculating..."}</h2>
          
          <div className="stats-row">
            <div className="stat-item">
              <span>Avg Cycle</span>
              <strong>{predictions ? `${predictions.averageLength} days` : `${avgCycleDays} days`}</strong>
            </div>
            <div className="stat-item">
              <span>Logged Days</span>
              <strong>{history.length} days</strong>
            </div>
          </div>
        </div>

        <div className="symptoms-section">
          <h4>How are you feeling today?</h4>
          <div className="symptoms-grid">
            {SYMPTOM_LIST.map(sym => (
              <div 
                key={sym.id} 
                className={`symptom-pill ${selectedSymptoms.includes(sym.id) ? 'active' : ''}`}
                onClick={() => toggleSymptom(sym.id)}
              >
                <span className="symptom-icon">{sym.icon}</span>
                <span>{sym.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="calendar-card">
          <Calendar 
            onChange={setActiveDate}
            value={activeDate}
            tileClassName={({ date }) => {
              const offset = date.getTimezoneOffset();
              const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
              const dateString = adjustedDate.toISOString().split('T')[0];
              
              if (history.includes(dateString)) return 'logged-period-day';
              if (predictions && predictions.predictedStart === dateString) return 'predicted-period-day';
              return null;
            }}
          />
        </div>

        <button className="btn-primary" onClick={logPeriodDay}>
          {history.includes(activeDateString) 
            ? "Remove Period Log for This Day" 
            : `Log Period on This Day`}
        </button>

        <button className="btn-clear" onClick={clearAppStorage}>
          Reset Profile Account
        </button>
      </main>
    </div>
  );
}