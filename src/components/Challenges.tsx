import React, { useState } from 'react';
import { Camera, CheckCircle, Sparkles, Loader } from 'lucide-react';

interface ChallengesProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  co2Saved: number;
  setCo2Saved: React.Dispatch<React.SetStateAction<number>>;
}

interface Challenge {
  id: number;
  title: string;
  icon: string;
  description: string;
  rewardPoints: number;
  co2Reduction: number;
  successMsg: string;
}

const CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: '카페 텀블러 인증',
    icon: '☕️',
    description: '개인 텀블러를 사용하여 음료를 테이크아웃한 사진을 인증해 주세요.',
    rewardPoints: 500,
    co2Reduction: 0.08,
    successMsg: '텀블러 사용 인증 완료! 플라스틱 및 탄소 배출을 줄였습니다.'
  },
  {
    id: 2,
    title: '여행지 쓰레기 줍기 (플로깅)',
    icon: '🌿',
    description: '여행지를 걷는 도중 쓰레기를 주워 올바르게 쓰레기통에 넣은 사진을 찍어주세요.',
    rewardPoints: 800,
    co2Reduction: 0.15,
    successMsg: '플로깅 실천 완료! 더 아름답고 깨끗한 여행지가 되었습니다.'
  },
  {
    id: 3,
    title: '친환경 대중교통 환승',
    icon: '🚇',
    description: '버스, 지하철 승하차 시 단말기에 태그하는 인증샷 또는 하차 내역 캡처를 올려주세요.',
    rewardPoints: 300,
    co2Reduction: 0.12,
    successMsg: '대중교통 이용 완료! 자가용 대비 80% 이상의 탄소를 절약했습니다.'
  }
];

export const Challenges: React.FC<ChallengesProps> = ({ points, setPoints, co2Saved, setCo2Saved }) => {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [fileSelected, setFileSelected] = useState<boolean>(false);
  const [fileMockName, setFileMockName] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [completedList, setCompletedList] = useState<number[]>([]);

  const handleOpenAuth = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setFileSelected(false);
    setFileMockName('');
    setSuccessInfo(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileMockName(e.target.files[0].name);
      setFileSelected(true);
    }
  };

  const handleStartAuthSimulation = () => {
    if (!selectedChallenge) return;
    setAnalyzing(true);

    setTimeout(() => {
      setAnalyzing(false);
      const earned = selectedChallenge.rewardPoints;
      const co2Val = selectedChallenge.co2Reduction;

      setPoints(p => p + earned);
      setCo2Saved(c => parseFloat((c + co2Val).toFixed(5)));
      setCompletedList(prev => [...prev, selectedChallenge.id]);
      setSuccessInfo(`🎉 ${earned}P 적립 완료! (${co2Val}kg 탄소 감소)`);

      setTimeout(() => {
        setSelectedChallenge(null);
        setSuccessInfo(null);
      }, 3000);
    }, 2500);
  };

  return (
    <div className="animate-pop">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>친환경 에코 챌린지</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>간단한 인증샷을 남기고 추가 머니백 포인트를 받으세요.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {CHALLENGES.map(ch => {
          const isCompleted = completedList.includes(ch.id);
          return (
            <div 
              key={ch.id} 
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden',
                borderColor: isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'var(--card-border)'
              }}
            >
              <div 
                style={{ 
                  fontSize: '28px', 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '16px', 
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {ch.icon}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', color: 'white', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {ch.title}
                  {isCompleted && (
                    <span style={{ fontSize: '11px', color: 'var(--primary-neon)', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                      <CheckCircle size={10} style={{ marginRight: '2px' }} /> 완료됨
                    </span>
                  )}
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{ch.description}</p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className="badge badge-accent">+{ch.rewardPoints}P</span>
                  <span className="badge badge-primary">-{ch.co2Reduction}kg CO₂</span>
                </div>
              </div>

              <button 
                className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                style={{ 
                  width: 'auto', 
                  padding: '10px 14px', 
                  fontSize: '12px', 
                  borderRadius: '10px'
                }}
                onClick={() => handleOpenAuth(ch)}
                disabled={isCompleted}
              >
                <Camera size={13} />
                {isCompleted ? '인증 완료' : '인증'}
              </button>
            </div>
          );
        })}
      </div>

      {selectedChallenge && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5, 8, 7, 0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(20px)',
            animation: 'success-pop 0.3s ease-out'
          }}
        >
          <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '8px' }}>
              {selectedChallenge.title} 인증
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              스마트폰 앨범에서 사진을 선택하거나 즉석에서 촬영하세요.
            </p>

            {!fileSelected && !analyzing && (
              <div 
                style={{ 
                  border: '2px dashed rgba(16, 185, 129, 0.3)', 
                  borderRadius: '16px', 
                  padding: '36px 20px', 
                  cursor: 'pointer',
                  position: 'relative',
                  marginBottom: '24px',
                  background: 'rgba(255,255,255,0.02)'
                }}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                <Camera size={36} color="var(--primary-neon)" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
                <p style={{ fontSize: '13px', fontWeight: '600' }}>사진 촬영 또는 선택</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>최대 10MB (PNG, JPG)</p>
              </div>
            )}

            {fileSelected && !analyzing && !successInfo && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={20} color="var(--primary-neon)" />
                  <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {fileMockName}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>이미지 준비 완료</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => setFileSelected(false)}
                  >
                    다시 올리기
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 2 }}
                    onClick={handleStartAuthSimulation}
                  >
                    AI 친환경 인증 분석
                  </button>
                </div>
              </div>
            )}

            {analyzing && (
              <div style={{ padding: '36px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Loader size={36} color="var(--primary-neon)" style={{ animation: 'spin 1.5s linear infinite' }} />
                <h4 style={{ color: 'white', marginTop: '16px', fontSize: '14px', fontWeight: '600' }}>
                  AI가 이미지 인증 분석 중...
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  인증물(텀블러/쓰레기봉투 등) 및 여행지 패턴 검출 중
                </p>
              </div>
            )}

            {successInfo && (
              <div className="animate-pop" style={{ padding: '24px 0' }}>
                <div 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    background: 'rgba(16, 185, 129, 0.2)', 
                    color: 'var(--primary-neon)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    border: '1px solid var(--primary-neon)'
                  }}
                >
                  <CheckCircle size={32} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                  친환경 인증 성공!
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '0 12px', marginBottom: '16px' }}>
                  {selectedChallenge.successMsg}
                </p>
                <div style={{ display: 'inline-block', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #fbbf24', borderRadius: '12px', padding: '6px 16px', color: '#fbbf24', fontWeight: '700', fontSize: '13px' }}>
                  {successInfo}
                </div>
              </div>
            )}

            {!analyzing && !successInfo && (
              <button 
                onClick={() => setSelectedChallenge(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  fontSize: '12px', 
                  marginTop: '16px', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                닫기
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
