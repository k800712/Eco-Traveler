import React, { useState, useEffect } from 'react';
import { Footprints, Trees, Leaf, Award, Play, Square } from 'lucide-react';

interface DashboardProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  steps: number;
  setSteps: React.Dispatch<React.SetStateAction<number>>;
  co2Saved: number;
  setCo2Saved: React.Dispatch<React.SetStateAction<number>>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  points,
  setPoints,
  steps,
  setSteps,
  co2Saved,
  setCo2Saved
}) => {
  const [isWalking, setIsWalking] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWalking) {
      interval = setInterval(() => {
        setSteps(prev => {
          const nextSteps = prev + Math.floor(Math.random() * 5) + 2;
          setCo2Saved(prevCo2 => parseFloat((prevCo2 + 0.00013).toFixed(5)));
          
          if (nextSteps % 20 === 0) {
            setPoints(prevPoints => prevPoints + 1);
          }

          return nextSteps;
        });
        setSessionSteps(prev => prev + 1);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isWalking, setSteps, setPoints, setCo2Saved]);

  const treesPlanted = (co2Saved / 0.1).toFixed(1);
  const progressPercent = Math.min((co2Saved % 0.5) / 0.5 * 100, 100);

  return (
    <div className="animate-pop">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', background: 'linear-gradient(to right, #00ffaa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Eco Traveler
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>지구를 구하는 뚜벅이 여행기 🌍</p>
        </div>
        <div className="badge badge-accent">
          <Award size={12} />
          <span>뚜벅이 마스터</span>
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>보유 에코 머니</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '8px 0' }}>
          <span style={{ fontSize: '36px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--primary-neon)' }}>
            {points.toLocaleString()}
          </span>
          <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>원</span>
        </div>
        <p style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Leaf size={12} fill="#10b981" />
          포인트는 머니백(환급) 신청 또는 기프티콘 교환 가능!
        </p>
      </div>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'center' }}>
        <div style={{ borderRight: '1px solid rgba(16, 185, 129, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--primary-neon)', marginBottom: '8px' }}>
            <Footprints size={24} />
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>오늘의 걸음 수</p>
          <p style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
            {steps.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>보</span>
          </p>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--secondary)', marginBottom: '8px' }}>
            <Leaf size={24} />
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>탄소 절감량</p>
          <p style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
            {co2Saved.toFixed(3)} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>kg</span>
          </p>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>실시간 도보 시뮬레이터</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          앱이 여행 중 걸음 수를 실시간으로 감지하여 포인트를 적립하는 동작을 체험해 보세요.
        </p>

        {isWalking && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--primary-neon)' }} className="glow-active">
            <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              <span style={{ width: '6px', height: '6px', background: 'var(--primary-neon)', borderRadius: '50%', display: 'inline-block', marginRight: '6px', animation: 'pulse-glow 1s infinite' }}></span>
              도보 여행 인증 중 ({sessionSteps}보 감지)
            </span>
          </div>
        )}

        <button 
          className={`btn ${isWalking ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => {
            setIsWalking(!isWalking);
            if (!isWalking) setSessionSteps(0);
          }}
          style={{ width: '100%', padding: '16px' }}
        >
          {isWalking ? (
            <>
              <Square size={16} fill="white" />
              걷기 중단 (적립 일시정지)
            </>
          ) : (
            <>
              <Play size={16} fill="white" />
              도보 여행 시작 (포인트 적립)
            </>
          )}
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trees color="var(--primary-neon)" size={20} />
            <h3 style={{ fontSize: '15px' }}>내가 심은 가상 소나무</h3>
          </div>
          <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-neon)', fontFamily: 'var(--font-display)' }}>
            {treesPlanted} 그루 효과
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          도보와 대중교통 이동을 통해 소나무가 흡수해야 할 이산화탄소를 직접 절감했습니다!
        </p>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
          <div 
            style={{ 
              width: `${progressPercent}%`, 
              height: '100%', 
              background: 'linear-gradient(to right, var(--primary), var(--secondary))',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }}
          ></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>이전 나무 심기 완료</span>
          <span>다음 1그루까지 {Math.max(0, 0.5 - (co2Saved % 0.5)).toFixed(3)}kg CO₂ 남음</span>
        </div>
      </div>
    </div>
  );
};
