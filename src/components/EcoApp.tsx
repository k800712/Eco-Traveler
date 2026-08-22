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
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  mockLocation: { lat: number; lng: number } | null;
  setMockLocation: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>;
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
  adminRegionWeights,
  isLoggedIn,
  setIsLoggedIn,
  mockLocation,
  setMockLocation
}: EcoAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if ((username === 'testuser' && password === '1234') || (username === 'admin' && password === 'admin')) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="mobile-frame">
      <div className="mobile-notch"></div>

      {/* 모바일 최상단 상태바 */}
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

      {/* 배경 광원 효과들 */}
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

      {!isLoggedIn ? (
        /* 미래지향적 다크 에코 데모 로그인 화면 */
        <div 
          className="animate-pop"
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            padding: '54px 20px 20px 20px', 
            zIndex: 1, 
            position: 'relative',
            height: '100%',
            overflowY: 'auto'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div 
              style={{ 
                width: '56px', 
                height: '56px', 
                background: 'rgba(0, 255, 170, 0.08)', 
                border: '1.5px solid rgba(0, 255, 170, 0.25)', 
                borderRadius: '18px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '24px',
                marginBottom: '12px',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              🌱
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, var(--primary-neon) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Eco-Traveler
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              지구를 구하는 도보 관광 가이드 플랫폼
            </p>
          </div>

          <div className="card" style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(0, 255, 170, 0.15)', padding: '16px', borderRadius: '20px', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', color: 'var(--primary-neon)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              💡 1차 기능 심사위원용 계정
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              <div>• 아이디: <strong style={{ color: 'white' }}>testuser</strong> | 비번: <strong style={{ color: 'white' }}>1234</strong></div>
              <div>• 관리자: <strong style={{ color: 'white' }}>admin</strong> | 비번: <strong style={{ color: 'white' }}>admin</strong></div>
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: '0px' }}>
              <label className="form-label">아이디</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="아이디를 입력하세요" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ background: 'rgba(0, 0, 0, 0.5)' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0px' }}>
              <label className="form-label">비밀번호</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="비밀번호를 입력하세요" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ background: 'rgba(0, 0, 0, 0.5)' }}
              />
            </div>

            {loginError && (
              <div style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: '600', textAlign: 'left', marginTop: '-4px' }}>
                ⚠️ {loginError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '14px' }}>
              데모 로그인
            </button>
          </form>
        </div>
      ) : (
        /* 로그인 성공 시 노출되는 메인 탭 뷰포트 */
        <>
          <div className="app-content" style={{ zIndex: 1, position: 'relative' }}>
            {activeTab === 'dashboard' && (
              <Dashboard
                points={points}
                setPoints={setPoints}
                steps={steps}
                setSteps={setSteps}
                co2Saved={co2Saved}
                setCo2Saved={setCo2Saved}
                mockLocation={mockLocation}
                setMockLocation={setMockLocation}
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
                mockLocation={mockLocation}
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
        </>
      )}
    </div>
  );
}

export default EcoApp;
