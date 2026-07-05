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
  const [history, setHistory] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [activeDate, setActiveDate] = useState(new Date());

  useEffect(() => {
    const savedDates = JSON.parse(localStorage.getItem('periodHistory')) || [];
    setHistory(savedDates);
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      setPredictions(calculateNextCycle(history));
    }
    localStorage.setItem('periodHistory', JSON.stringify(history));
  }, [history]);

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

  const activeDateString = new Date(activeDate.getTime() - (activeDate.getTimezoneOffset() * 60 * 1000))
    .toISOString()
    .split('T')[0];

  return (
    <div className="mobile-container">
      <header>
        <h1>Period Tracker</h1>
        <p className="subtitle">simple and trusted period calendar</p>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Metric Status Header Card */}
        <div className="cycle-status-display">
          <h3>Next Period Predicted</h3>
          <h2 className="prediction-date">{predictions ? predictions.predictedStart : "No Logs Yet"}</h2>
          
          <div className="stats-row">
            <div className="stat-item">
              <span>Avg Cycle</span>
              <strong>{predictions ? `${predictions.averageLength} days` : '--'}</strong>
            </div>
            <div className="stat-item">
              <span>Logged Days</span>
              <strong>{history.length} days</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Symptom Horizontal Scroll Bar */}
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

        {/* Premium Clean Calendar Grid */}
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

        {/* Bottom Action Button */}
        <button className="btn-primary" onClick={logPeriodDay}>
          {history.includes(activeDateString) 
            ? "Remove Period Log for This Day" 
            : `Log Period on This Day`}
        </button>

        {history.length > 0 && (
          <button className="btn-clear" onClick={() => { setHistory([]); setPredictions(null); }}>
            Clear Analytics Storage
          </button>
        )}
      </main>
    </div>
  );
}