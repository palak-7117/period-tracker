import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { calculateNextCycle } from './utils/cycleEngine';
import './App.css';

const SYMPTOM_LIST = [
  { 
    id: 'cramps', 
    label: 'Cramps', 
    icon: '⚡',
    advice: 'Rest with a warm heating pad, sip chamomile tea, or try gentle stretches like child\'s pose to soothe pelvic muscles.' 
  },
  { 
    id: 'headache', 
    label: 'Headache', 
    icon: '🤕',
    advice: 'Dim the lights, stay well hydrated with water, and take a small break from phone and laptop screens.' 
  },
  { 
    id: 'bloating', 
    label: 'Bloating', 
    icon: '🎈',
    advice: 'Eat smaller meals slowly, avoid carbonated drinks, and enjoy a warm mug of peppermint or ginger tea.' 
  },
  { 
    id: 'tired', 
    label: 'Fatigue', 
    icon: '🥱',
    advice: 'Listen to your body and rest. Avoid heavy tasks today, and prioritize a relaxing night of deep sleep.' 
  },
  { 
    id: 'happy', 
    label: 'Happy', 
    icon: '☀️',
    advice: 'Ride that high energy wave! It’s a wonderful day for your favorite creative project, social time, or a fun workout.' 
  },
];

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' }
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

export default function App() {
  // Onboarding Profile States
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [username, setUsername] = useState('');
  const [avgCycleDays, setAvgCycleDays] = useState(''); // Empty string for blank placeholder

  // Dropdown Split Date Selectors initialized as empty strings
  const [startMonth, setStartMonth] = useState('');
  const [startDay, setStartDay] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endDay, setEndDay] = useState('');

  // Main Dashboard States
  const [history, setHistory] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [activeDate, setActiveDate] = useState(new Date());

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

  useEffect(() => {
    if (history.length > 0) {
      const computedPredictions = calculateNextCycle(history);
      const chosenCycleLength = parseInt(localStorage.getItem('avg_cycle_length') || avgCycleDays || 28);
      
      if (computedPredictions && computedPredictions.averageLength > 10) {
        setPredictions(computedPredictions);
      } else {
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

  const handleOnboardingSubmit = (e) => {
    e.preventDefault();
    if (!username) {
      alert('Please enter a username.');
      return;
    }
    if (!avgCycleDays) {
      alert('Please enter your average cycle length.');
      return;
    }
    if (!startMonth || !startDay || !endMonth || !endDay) {
      alert('Please complete all month and day selections.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const formattedStart = `${currentYear}-${startMonth}-${startDay}`;
    const formattedEnd = `${currentYear}-${endMonth}-${endDay}`;

    const start = new Date(formattedStart);
    const end = new Date(formattedEnd);

    if (end < start) {
      alert('The end date cannot be earlier than your start date!');
      return;
    }

    const generatedHistory = [];
    let current = new Date(start);
    while (current <= end) {
      generatedHistory.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

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
    setAvgCycleDays('');
    setStartMonth('');
    setStartDay('');
    setEndMonth('');
    setEndDay('');
  };

  const activeDateString = new Date(activeDate.getTime() - (activeDate.getTimezoneOffset() * 60 * 1000))
    .toISOString()
    .split('T')[0];

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
              placeholder="e.g. 28"
              value={avgCycleDays}
              onChange={(e) => setAvgCycleDays(e.target.value === '' ? '' : parseInt(e.target.value))}
              required 
            />
          </div>

          <div className="form-group">
            <label>Start date of your last period?</label>
            <div className="dropdown-row">
              <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)} required>
                <option value="" disabled hidden>Month</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={startDay} onChange={(e) => setStartDay(e.target.value)} required>
                <option value="" disabled hidden>Day</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>End date of your last period?</label>
            <div className="dropdown-row">
              <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)} required>
                <option value="" disabled hidden>Month</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={endDay} onChange={(e) => setEndDay(e.target.value)} required>
                <option value="" disabled hidden>Day</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>
            Enter Dashboard
          </button>
        </form>
      </div>
    );
  }

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

        {selectedSymptoms.length > 0 && (
          <div className="advice-card">
            <h3>Care Tips For You</h3>
            {SYMPTOM_LIST.filter(s => selectedSymptoms.includes(s.id)).map(s => (
              <div key={s.id} className="advice-item">
                <strong>{s.icon} {s.label}:</strong> {s.advice}
              </div>
            ))}
          </div>
        )}

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