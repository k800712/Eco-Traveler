import { useState, useEffect } from 'react';
import { Compass, Map, Award, Wallet } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { EcoMap } from './EcoMap';
import { Challenges } from './Challenges';
import { MoneyBack, RefundItem } from './MoneyBack';

type TabType = 'dashboard' | 'map' | 'challenges' | 'moneyback';

export function EcoApp() {
  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem('eco_points');
    return saved ? parseInt(saved, 10) : 3500;
  });

  const [steps, setSteps] = useState<number>(() => {
    const saved = localStorage.getItem('eco_steps');
    return saved ? parseInt(saved, 10) : 4320;
  });

  const [co2Saved, setCo2Saved] = useState<number>(() => {
    const saved = localStorage.getItem('eco_co2');
    return saved ? parseFloat(saved) : 0.85;
  });

  const [refundHistory, setRefundHistory] = useState<RefundItem[]>(() => {
    const saved = localStorage.getItem('eco_refund_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  useEffect(() => {
    localStorage.setItem('eco_points', points.toString());
  }, [points]);

  useEffect(() => {
    localStorage.setItem('eco_steps', steps.toString());
  }, [steps]);

  useEffect(() => {
    localStorage.setItem('eco_co2', co2Saved.toString());
  }, [co2Saved]);

  useEffect(() => {
    localStorage.setItem('eco_refund_history', JSON.stringify(refundHistory));
  }, [refundHistory]);

  return (
    <div className="mobile-frame">
      <div className="mobile-notch"></div>

      <div 
        style={{
          position: 'absolute',
          top: '8px',
          left: '0',
          width: '100%',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)',
          zIndex: 995,
          fontFamily: 'var(--font-display)',
          pointerEvents: 'none'
        }}
      >
        <span>14:06</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <span>📶</span>
          <span>LTE</span>
          <span>🔋 85%</span>
        </div>
      </div>

      <div 
        style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(0,0,0,0) 70%)',
          top: '5%',
          left: '-20%',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      ></div>
      <div 
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, rgba(0,0,0,0) 70%)',
          bottom: '15%',
          right: '-30%',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      ></div>

      <div className="app-content" style={{ zIndex: 1, position: 'relative' }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            points={points}
            setPoints={setPoints}
            steps={steps}
            setSteps={setSteps}
            co2Saved={co2Saved}
            setCo2Saved={setCo2Saved}
          />
        )}

        {activeTab === 'map' && (
          <EcoMap
            points={points}
            setPoints={setPoints}
            co2Saved={co2Saved}
            setCo2Saved={setCo2Saved}
          />
        )}

        {activeTab === 'challenges' && (
          <Challenges
            points={points}
            setPoints={setPoints}
            co2Saved={co2Saved}
            setCo2Saved={setCo2Saved}
          />
        )}

        {activeTab === 'moneyback' && (
          <MoneyBack
            points={points}
            setPoints={setPoints}
            refundHistory={refundHistory}
            setRefundHistory={setRefundHistory}
          />
        )}
      </div>

      <nav className="bottom-nav">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <Compass />
          <span>대시보드</span>
        </button>
        <button 
          onClick={() => setActiveTab('map')} 
          className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
        >
          <Map />
          <span>에코 맵</span>
        </button>
        <button 
          onClick={() => setActiveTab('challenges')} 
          className={`nav-item ${activeTab === 'challenges' ? 'active' : ''}`}
        >
          <Award />
          <span>챌린지</span>
        </button>
        <button 
          onClick={() => setActiveTab('moneyback')} 
          className={`nav-item ${activeTab === 'moneyback' ? 'active' : ''}`}
        >
          <Wallet />
          <span>머니백/샵</span>
        </button>
      </nav>
    </div>
  );
}

export default EcoApp;
