import { useState } from 'react';
import { Compass, Map, Award, Wallet } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { EcoMap } from './EcoMap';
import { Challenges } from './Challenges';
import { MoneyBack } from './MoneyBack';
import type { RefundItem } from './MoneyBack';

type TabType = 'dashboard' | 'map' | 'challenges' | 'moneyback';

interface EcoAppProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  steps: number;
  setSteps: React.Dispatch<React.SetStateAction<number>>;
  co2Saved: number;
  setCo2Saved: React.Dispatch<React.SetStateAction<number>>;
  refundHistory: RefundItem[];
  setRefundHistory: React.Dispatch<React.SetStateAction<RefundItem[]>>;
  completedChallenges: number[];
  setCompletedChallenges: React.Dispatch<React.SetStateAction<number[]>>;
  adminFuelPrice: number | null;
  adminRegionWeights: Record<string, number>;
}

export function EcoApp({
  points,
  setPoints,
  steps,
  setSteps,
  co2Saved,
  setCo2Saved,
  refundHistory,
  setRefundHistory,
  completedChallenges,
  setCompletedChallenges,
  adminFuelPrice,
  adminRegionWeights
}: EcoAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

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

        {/* 에코 맵(Flutter Web iframe)은 리로딩 지연 제거 및 백그라운드 양방향 실시간 동기화를 위해 DOM 상시 유지 */}
        <div style={{ display: activeTab === 'map' ? 'block' : 'none', height: '100%' }}>
          <EcoMap
            points={points}
            setPoints={setPoints}
            co2Saved={co2Saved}
            setCo2Saved={setCo2Saved}
            steps={steps}
            setSteps={setSteps}
            completedChallenges={completedChallenges}
            refundHistory={refundHistory}
            setRefundHistory={setRefundHistory}
            adminFuelPrice={adminFuelPrice}
            adminRegionWeights={adminRegionWeights}
          />
        </div>

        {activeTab === 'challenges' && (
          <Challenges
            points={points}
            setPoints={setPoints}
            co2Saved={co2Saved}
            setCo2Saved={setCo2Saved}
            completedChallenges={completedChallenges}
            setCompletedChallenges={setCompletedChallenges}
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
