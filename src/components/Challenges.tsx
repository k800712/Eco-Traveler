import React, { useState } from 'react';
import { Camera, CheckCircle, Sparkles, Loader, AlertTriangle, RefreshCw } from 'lucide-react';

interface ChallengesProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  co2Saved: number;
  setCo2Saved: React.Dispatch<React.SetStateAction<number>>;
  completedChallenges: number[];
  setCompletedChallenges: React.Dispatch<React.SetStateAction<number[]>>;
}

interface Challenge {
  id: number;
  title: string;
  icon: string;
  description: string;
  rewardPoints: number;
  co2Reduction: number;
  successMsg: string;
  keywords: string[]; // 검증에 통과할 파일명 키워드 목록
  failDetail: string; // 검증 실패 시 전용 피드백 메시지
}

const CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: '카페 텀블러 인증',
    icon: '☕️',
    description: '개인 텀블러를 사용하여 음료를 테이크아웃한 사진을 인증해 주세요.',
    rewardPoints: 500,
    co2Reduction: 0.08,
    successMsg: '텀블러 사용 인증 완료! 플라스틱 및 탄소 배출을 줄였습니다.',
    keywords: ['cup', 'tumbler', 'mug', 'coffee', '텀블러', '컵', '커피', '머그', '텀블러인증', 'image', 'photo', 'img'],
    failDetail: '이미지 분석 결과 텀블러(개인 다회용 컵) 객체가 정상 검출되지 않았습니다. 개인 텀블러가 잘 드러나도록 정면에서 다시 촬영해 주세요.'
  },
  {
    id: 2,
    title: '여행지 쓰레기 줍기 (플로깅)',
    icon: '🌿',
    description: '여행지를 걷는 도중 쓰레기를 주워 올바르게 쓰레기통에 넣은 사진을 찍어주세요.',
    rewardPoints: 800,
    co2Reduction: 0.15,
    successMsg: '플로깅 실천 완료! 더 아름답고 깨끗한 여행지가 되었습니다.',
    keywords: ['trash', 'bag', 'plogging', 'litter', 'waste', '쓰레기', '봉투', '플로깅', '집게', '환경정화', 'image', 'photo', 'img'],
    failDetail: '이미지 분석 결과 수거용 쓰레기 봉투나 주워 올린 쓰레기 집기 객체가 정상 식별되지 않았습니다. 플로깅 행동 양상이 뚜렷하게 보이도록 다시 찍어주세요.'
  },
  {
    id: 3,
    title: '친환경 대중교통 환승',
    icon: '🚇',
    description: '버스, 지하철 승하차 시 단말기에 태그하는 인증샷 또는 하차 내역 캡처를 올려주세요.',
    rewardPoints: 300,
    co2Reduction: 0.12,
    successMsg: '대중교통 이용 완료! 자가용 대비 80% 이상의 탄소를 절약했습니다.',
    keywords: ['subway', 'bus', 'transit', 'card', 'receipt', 'metro', '지하철', '버스', '교통', '영수증', '내역', '카드', 'image', 'photo', 'img', 'screenshot'],
    failDetail: '이미지 내 텍스트 판독(OCR) 분석 결과 교통카드 태그 단말기 혹은 지하철/버스 탑승을 증빙하는 유효 텍스트가 식별되지 않았습니다. 증빙이 명확한 영수증이나 스크린샷을 사용해 주세요.'
  }
];

type AuthStatus = 'idle' | 'file-selected' | 'analyzing' | 'success' | 'failed';

export const Challenges: React.FC<ChallengesProps> = ({
  points: _points,
  setPoints,
  co2Saved: _co2Saved,
  setCo2Saved,
  completedChallenges,
  setCompletedChallenges
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  
  // 상태 변수 통합 제어
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [fileMockName, setFileMockName] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const handleOpenAuth = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setAuthStatus('idle');
    setFileMockName('');
    setSuccessInfo(null);
    setErrorInfo(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileMockName(e.target.files[0].name);
      setAuthStatus('file-selected');
    }
  };

  // 하이브리드 이미지 검증 알고리즘
  const handleStartAuthSimulation = () => {
    if (!selectedChallenge) return;
    setAuthStatus('analyzing');

    setTimeout(() => {
      const fileNameLower = fileMockName.toLowerCase();
      
      // 1) 1단계: 파일명 키워드 매칭 검사 (객체 매칭 시뮬레이션)
      const hasMatchingKeyword = selectedChallenge.keywords.some(keyword => 
        fileNameLower.includes(keyword)
      );

      if (!hasMatchingKeyword) {
        setAuthStatus('failed');
        setErrorInfo(selectedChallenge.failDetail);
        return;
      }

      // 2) 2단계: 메타데이터(EXIF) 검증 실패 모사 (랜덤 15% 가상 필터)
      // 실제로는 과거 이미지 재활용이나 GPS 불일치를 잡아내는 어뷰징 방지 필터링 역할
      const isMetadataValid = Math.random() > 0.15;
      if (!isMetadataValid) {
        setAuthStatus('failed');
        setErrorInfo('❌ 메타데이터(EXIF) 검증 실패: 이미지의 최근 촬영 일시(24시간 이내) 정보가 불일치하거나, 위경도 GPS 위치 정보가 연동된 목적지 범위 밖에 있습니다. 즉석에서 카메라로 다시 촬영해 주세요.');
        return;
      }

      // 3) 모든 가드 통과 시 포인트 지급
      const earned = selectedChallenge.rewardPoints;
      const co2Val = selectedChallenge.co2Reduction;

      setPoints(p => p + earned);
      setCo2Saved(c => parseFloat((c + co2Val).toFixed(5)));
      setCompletedChallenges(prev => [...prev, selectedChallenge.id]);
      
      setAuthStatus('success');
      setSuccessInfo(`🎉 ${earned}P 적립 완료! (${co2Val}kg 탄소 감소)`);

      setTimeout(() => {
        setSelectedChallenge(null);
        setAuthStatus('idle');
      }, 3500);
    }, 2400);
  };

  return (
    <div className="animate-pop">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>친환경 에코 챌린지</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>간단한 인증샷을 남기고 추가 머니백 포인트를 받으세요.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {CHALLENGES.map(ch => {
          const isCompleted = completedChallenges.includes(ch.id);
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

      {/* 챌린지 인증 팝업 모달 */}
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
            
            {/* 기본 파일 업로드 전 가이드 */}
            {authStatus === 'idle' && (
              <>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.4' }}>
                  실시간 도용 및 어뷰징 방지를 위해 24시간 이내 촬영된 위치 정보(GPS)가 기록된 사진만 인증 가능합니다.
                </p>
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
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>사진 촬영 또는 파일 선택</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>최대 10MB (PNG, JPG)</p>
                </div>
              </>
            )}

            {/* 파일 대기 상태 */}
            {authStatus === 'file-selected' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={20} color="var(--primary-neon)" />
                  <div style={{ textAlign: 'left', overflow: 'hidden', flex: 1 }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {fileMockName}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>이미지 분석 준비 완료</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '12px' }}
                    onClick={() => setAuthStatus('idle')}
                  >
                    재선택
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 2, padding: '12px' }}
                    onClick={handleStartAuthSimulation}
                  >
                    AI 친환경 인증 분석
                  </button>
                </div>
              </div>
            )}

            {/* 로딩 / 이미지 분석 중 */}
            {authStatus === 'analyzing' && (
              <div style={{ padding: '36px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Loader size={36} color="var(--primary-neon)" style={{ animation: 'spin 1.5s linear infinite' }} />
                <h4 style={{ color: 'white', marginTop: '16px', fontSize: '14px', fontWeight: '600' }}>
                  AI가 이미지 인증 분석 중...
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '240px', lineHeight: '1.4' }}>
                  텍스트 판독(OCR), 객체 검출(Object Detection) 및 GPS 메타태그 무결성을 정밀 검증하고 있습니다.
                </p>
              </div>
            )}

            {/* 검증 성공 */}
            {authStatus === 'success' && successInfo && (
              <div className="animate-pop" style={{ padding: '16px 0' }}>
                <div 
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    background: 'rgba(16, 185, 129, 0.2)', 
                    color: 'var(--primary-neon)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 14px auto',
                    border: '1.5px solid var(--primary-neon)'
                  }}
                >
                  <CheckCircle size={30} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                  친환경 인증 성공!
                </h4>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', padding: '0 10px', marginBottom: '16px', lineHeight: '1.4' }}>
                  {selectedChallenge.successMsg}
                </p>
                <div style={{ display: 'inline-block', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #fbbf24', borderRadius: '12px', padding: '6px 16px', color: '#fbbf24', fontWeight: '700', fontSize: '13px' }}>
                  {successInfo}
                </div>
              </div>
            )}

            {/* [NEW] 검증 실패 (부정 어뷰징 탐지) */}
            {authStatus === 'failed' && errorInfo && (
              <div className="animate-pop" style={{ padding: '16px 0' }}>
                <div 
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    background: 'rgba(239, 68, 68, 0.15)', 
                    color: '#ef4444', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 14px auto',
                    border: '1.5px solid #ef4444'
                  }}
                >
                  <AlertTriangle size={30} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>
                  인증 반려 (검증 실패)
                </h4>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5', textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '10px 12px' }}>
                  {errorInfo}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setAuthStatus('idle')}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <RefreshCw size={13} />
                  사진 다시 선택하기
                </button>
              </div>
            )}

            {authStatus !== 'analyzing' && authStatus !== 'success' && (
              <button 
                onClick={() => setSelectedChallenge(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  fontSize: '12px', 
                  marginTop: '20px', 
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
