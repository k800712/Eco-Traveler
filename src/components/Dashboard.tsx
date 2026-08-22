import React, { useState, useEffect, useRef } from 'react';
import { Footprints, Trees, Leaf, Play, Square, Smartphone, X, Award } from 'lucide-react';

interface DashboardProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  steps: number;
  setSteps: React.Dispatch<React.SetStateAction<number>>;
  co2Saved: number;
  setCo2Saved: React.Dispatch<React.SetStateAction<number>>;
  mockLocation: { lat: number; lng: number } | null;
  setMockLocation: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>;
}

interface GradeConfig {
  name: string;
  icon: string;
  minSteps: number;
  minCo2: number;
  bonusPercent: number;
  shopDiscount: number;
  color: string;
}

const GRADES: GradeConfig[] = [
  { name: '에코 씨앗', icon: '🌱', minSteps: 0, minCo2: 0.0, bonusPercent: 0, shopDiscount: 0, color: '#10b981' }, 
  { name: '에코 새싹', icon: '🌿', minSteps: 5000, minCo2: 0.65, bonusPercent: 5, shopDiscount: 0, color: '#34d399' }, 
  { name: '에코 나무', icon: '🌲', minSteps: 20000, minCo2: 2.60, bonusPercent: 10, shopDiscount: 3, color: '#059669' }, 
  { name: '에코 숲', icon: '🌳', minSteps: 50000, minCo2: 6.50, bonusPercent: 15, shopDiscount: 5, color: '#06b6d4' }, 
  { name: '지구 수호자', icon: '🌍', minSteps: 100000, minCo2: 13.00, bonusPercent: 25, shopDiscount: 10, color: '#3b82f6' } 
];

export const Dashboard: React.FC<DashboardProps> = ({
  points,
  setPoints,
  steps,
  setSteps,
  co2Saved,
  setCo2Saved,
  mockLocation,
  setMockLocation
}) => {
  const [isWalking, setIsWalking] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);
  
  // 센서 제어 상태값
  const [isUsingSensor, setIsUsingSensor] = useState(false);
  const [_hasSensorPermission, setHasSensorPermission] = useState<boolean | null>(null);
  const [motionMagnitude, setMotionMagnitude] = useState(9.8);

  // 팝업 모달 노출 상태 변수
  const [showGradePopup, setShowGradePopup] = useState(false);

  // Peak-detection 알고리즘용 ref
  const lastStepTimeRef = useRef(0);
  const isBelowThresholdRef = useRef(true);

  // 등급 계산 유틸리티
  const getPlayerGrade = (currentSteps: number, currentCo2: number) => {
    let activeIdx = 0;
    for (let i = GRADES.length - 1; i >= 0; i--) {
      if (currentSteps >= GRADES[i].minSteps && currentCo2 >= GRADES[i].minCo2) {
        activeIdx = i;
        break;
      }
    }
    const current = GRADES[activeIdx];
    const next = activeIdx < GRADES.length - 1 ? GRADES[activeIdx + 1] : null;
    return { current, next, index: activeIdx };
  };

  const { current: currentGrade, next: nextGrade, index: currentGradeIdx } = getPlayerGrade(steps, co2Saved);

  // 다음 승급 진행률 계산
  let stepsProgress = 100;
  let co2Progress = 100;
  let overallProgress = 100;

  if (nextGrade) {
    const stepsRange = nextGrade.minSteps - currentGrade.minSteps;
    const currentStepsOffset = steps - currentGrade.minSteps;
    stepsProgress = Math.max(0, Math.min(100, (currentStepsOffset / stepsRange) * 100));

    const co2Range = nextGrade.minCo2 - currentGrade.minCo2;
    const currentCo2Offset = co2Saved - currentGrade.minCo2;
    co2Progress = Math.max(0, Math.min(100, (currentCo2Offset / co2Range) * 100));

    overallProgress = Math.round((stepsProgress + co2Progress) / 2);
  }

  const stepsNeeded = nextGrade ? Math.max(0, nextGrade.minSteps - steps) : 0;
  const co2Needed = nextGrade ? Math.max(0, parseFloat((nextGrade.minCo2 - co2Saved).toFixed(3))) : 0;

  // 1. 센서 권한 요청 핸들러 (iOS 13+ 호환 포함)
  const requestSensorPermission = async () => {
    const DeviceMotionEventClass = (window as any).DeviceMotionEvent;
    
    if (
      typeof DeviceMotionEventClass !== 'undefined' &&
      typeof DeviceMotionEventClass.requestPermission === 'function'
    ) {
      try {
        const permissionState = await DeviceMotionEventClass.requestPermission();
        if (permissionState === 'granted') {
          setHasSensorPermission(true);
          setIsUsingSensor(true);
          return true;
        } else {
          setHasSensorPermission(false);
          setIsUsingSensor(false);
          alert('물리 센서 권한이 거부되어 모의 걷기 시뮬레이션 모드로 전환되었습니다.');
          return false;
        }
      } catch (e) {
        console.error('Sensor permission request error:', e);
        setHasSensorPermission(false);
        setIsUsingSensor(false);
        return false;
      }
    } else {
      if ('DeviceMotionEvent' in window) {
        setHasSensorPermission(true);
        setIsUsingSensor(true);
        return true;
      } else {
        setHasSensorPermission(false);
        setIsUsingSensor(false);
        return false;
      }
    }
  };

  // 2. 모션 감지(Walking Peak-Detection) 알고리즘 적용
  useEffect(() => {
    if (!isWalking || !isUsingSensor) return;

    const threshold = 12.2; 
    const minStepInterval = 380;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      const magnitude = Math.sqrt(x * x + y * y + z * z);
      setMotionMagnitude(parseFloat(magnitude.toFixed(2)));

      const now = Date.now();
      
      if (
        magnitude > threshold && 
        isBelowThresholdRef.current && 
        (now - lastStepTimeRef.current > minStepInterval)
      ) {
        setSteps(prev => {
          const nextSteps = prev + 1;
          setCo2Saved(prevCo2 => parseFloat((prevCo2 + 0.00013).toFixed(5)));
          
          if (nextSteps % 100 === 0) {
            setPoints(prevPoints => prevPoints + 5);
          }
          return nextSteps;
        });

        setSessionSteps(prev => prev + 1);
        lastStepTimeRef.current = now;
        isBelowThresholdRef.current = false;
      } else if (magnitude < threshold - 1.8) {
        isBelowThresholdRef.current = true;
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion, true);
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion, true);
    };
  }, [isWalking, isUsingSensor, setSteps, setPoints, setCo2Saved]);

  // 3. Fallback: 데스크톱/센서 미승인용 가상 시뮬레이션 타이머
  useEffect(() => {
    if (!isWalking || isUsingSensor) return;

    const interval = setInterval(() => {
      setMotionMagnitude(10 + Math.random() * 4);
      
      setSteps(prev => {
        const nextSteps = prev + 1;
        setCo2Saved(prevCo2 => parseFloat((prevCo2 + 0.00013).toFixed(5)));
        
        if (nextSteps % 100 === 0) {
          setPoints(prevPoints => prevPoints + 5);
        }
        return nextSteps;
      });
      setSessionSteps(prev => prev + 1);
    }, 750);

    return () => clearInterval(interval);
  }, [isWalking, isUsingSensor, setSteps, setPoints, setCo2Saved]);

  // 4. E2E 수동 탭 흔들기 트리거 (데스크톱 디버깅용)
  const handleSimulateShake = () => {
    if (!isWalking) return;
    
    setMotionMagnitude(18.4);
    
    setSteps(prev => {
      const nextSteps = prev + 1;
      setCo2Saved(prevCo2 => parseFloat((prevCo2 + 0.00013).toFixed(5)));
      if (nextSteps % 100 === 0) {
        setPoints(prevPoints => prevPoints + 5);
      }
      return nextSteps;
    });
    setSessionSteps(prev => prev + 1);

    setTimeout(() => {
      setMotionMagnitude(9.8);
    }, 200);
  };

  const treesPlanted = (co2Saved / 0.1).toFixed(1);
  const pineProgressPercent = Math.min((co2Saved % 0.5) / 0.5 * 100, 100);

  return (
    <div className="animate-pop">
      {/* 대시보드 헤더 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', background: 'linear-gradient(to right, #00ffaa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Eco Traveler
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>지구를 구하는 뚜벅이 여행기 🌍</p>
        </div>
        
        {/* 클릭 가능한 동적 등급 배지 */}
        <button 
          onClick={() => setShowGradePopup(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: `${currentGrade.color}18`,
            color: currentGrade.color,
            border: `1px solid ${currentGrade.color}`,
            fontSize: '11px',
            fontWeight: '700',
            padding: '6px 12px',
            borderRadius: '20px',
            boxShadow: `0 0 10px ${currentGrade.color}22`,
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
          }}
          className="nav-item-hover-effect"
        >
          <span>{currentGrade.icon} {currentGrade.name}</span>
        </button>
      </div>

      {/* 고양/일산 GPS 시뮬레이터 배지 단추 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => {
            if (mockLocation) {
              setMockLocation(null);
            } else {
              setMockLocation({ lat: 37.6584, lng: 126.8320 });
            }
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            border: mockLocation ? '1.5px solid var(--primary-neon)' : '1px solid rgba(255,255,255,0.08)',
            background: mockLocation ? 'rgba(0, 255, 170, 0.08)' : 'rgba(255,255,255,0.03)',
            color: mockLocation ? 'var(--primary-neon)' : 'var(--text-muted)',
            boxShadow: mockLocation ? 'var(--shadow-glow)' : 'none',
            outline: 'none'
          }}
        >
          <span>📍</span>
          {mockLocation ? '일산 GPS 시뮬레이션 끄기 (서울 복귀)' : '고양/일산 GPS 시뮬레이션 켜기 (호수공원)'}
        </button>
      </div>

      {/* 보유 에코 머니 카드 */}
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

      {/* 걸음 수 및 탄소 절감 카드 */}
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

      {/* 하이브리드 도보 측정기 카드 */}
      <div className="card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span 
            className="badge" 
            style={{ 
              fontSize: '10px', 
              background: isUsingSensor ? 'rgba(6, 182, 212, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: isUsingSensor ? 'var(--secondary)' : '#f59e0b',
              borderColor: isUsingSensor ? 'var(--secondary)' : '#f59e0b'
            }}
          >
            {isUsingSensor ? '📡 물리 모션센서 모드' : '💻 모의 걷기 훈련 모드'}
          </span>
          <button 
            onClick={requestSensorPermission}
            style={{ background: 'none', border: 'none', color: 'var(--primary-neon)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontWeight: '600' }}
          >
            <Smartphone size={10} />
            센서 연결
          </button>
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>하이브리드 도보 측정기</h3>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.4' }}>
          기기 흔들림 및 가속도를 실시간으로 Peak 감지하여 1보씩 정밀하게 리워드를 지급합니다.
        </p>

        {/* 실시간 모션 가속도 파형 인디케이터 */}
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '10px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span>실시간 기기 가속 모션 세기</span>
            <span style={{ color: motionMagnitude > 12.2 ? 'var(--primary-neon)' : 'var(--text-muted)' }}>
              {motionMagnitude} m/s²
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${Math.min(100, (motionMagnitude / 25) * 100)}%`, 
                height: '100%', 
                background: motionMagnitude > 12.2 ? 'linear-gradient(to right, var(--primary), var(--primary-neon))' : 'var(--secondary)',
                transition: 'all 0.15s ease'
              }}
            ></div>
          </div>
        </div>

        {isWalking && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span 
              className="badge badge-primary animate-pulse" 
              style={{ 
                padding: '6px 12px', 
                fontSize: '11px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--primary-neon)',
                borderColor: 'var(--primary-neon)'
              }}
            >
              🏃 여행 인증 진행 중 (+{sessionSteps}보 갱신)
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${isWalking ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => {
              setIsWalking(!isWalking);
              if (!isWalking) {
                setSessionSteps(0);
                requestSensorPermission();
              }
            }}
            style={{ flex: 2, padding: '12px' }}
          >
            {isWalking ? (
              <>
                <Square size={14} fill="white" style={{ marginRight: '4px' }} />
                인증 중단
              </>
            ) : (
              <>
                <Play size={14} fill="white" style={{ marginRight: '4px' }} />
                도보여행 시작
              </>
            )}
          </button>
          
          {isWalking && !isUsingSensor && (
            <button
              onClick={handleSimulateShake}
              style={{
                flex: 1,
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid var(--secondary)',
                color: 'var(--secondary)',
                borderRadius: '12px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📳 가상 흔들기
            </button>
          )}
        </div>
      </div>

      {/* 가상 소나무 카드 */}
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
              width: `${pineProgressPercent}%`, 
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

      {/* [NEW] 에코 등급제 팝업 모달 포탈 */}
      {showGradePopup && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5, 8, 7, 0.94)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(12px)',
            animation: 'success-pop 0.28s cubic-bezier(0.165, 0.84, 0.44, 1)'
          }}
        >
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '340px', 
              background: '#0d1513', 
              border: `1.5px solid ${currentGrade.color}`, 
              borderRadius: '28px', 
              padding: '20px',
              boxShadow: `0 0 30px ${currentGrade.color}22`,
              position: 'relative'
            }}
          >
            {/* 닫기 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={16} color="var(--primary-neon)" />
                나의 에코 등급 여정
              </h3>
              <button 
                onClick={() => setShowGradePopup(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* 등급 가로 로드맵 선 */}
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                position: 'relative', 
                margin: '10px 6px 18px 6px',
                paddingBottom: '6px'
              }}
            >
              <div 
                style={{ 
                  position: 'absolute', 
                  left: '0', 
                  right: '0', 
                  top: '18px', 
                  height: '3px', 
                  background: 'rgba(255,255,255,0.05)', 
                  zIndex: 0 
                }}
              />
              <div 
                style={{ 
                  position: 'absolute', 
                  left: '0', 
                  width: `${(currentGradeIdx / (GRADES.length - 1)) * 100}%`, 
                  top: '18px', 
                  height: '3px', 
                  background: `linear-gradient(to right, ${GRADES[0].color}, ${currentGrade.color})`, 
                  zIndex: 1,
                  transition: 'width 0.5s ease-in-out'
                }}
              />

              {GRADES.map((g, idx) => {
                const isActive = idx <= currentGradeIdx;
                const isCurrent = idx === currentGradeIdx;
                
                return (
                  <div 
                    key={g.name} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      zIndex: 2, 
                      position: 'relative' 
                    }}
                  >
                    <div 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: isActive ? '#131d1a' : '#080d0c', 
                        border: `2.5px solid ${isActive ? g.color : 'rgba(255,255,255,0.1)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        boxShadow: isCurrent ? `0 0 10px ${g.color}` : 'none',
                        animation: isCurrent ? 'pulse-glow 1.8s infinite' : 'none',
                        transition: 'all 0.3s'
                      }}
                    >
                      {g.icon}
                    </div>
                    <span 
                      style={{ 
                        fontSize: '8px', 
                        marginTop: '6px', 
                        color: isCurrent ? g.color : isActive ? 'var(--text-main)' : 'var(--text-muted)',
                        fontWeight: isCurrent ? '800' : '600',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {g.name.split(' ')[1] || g.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 승급 조건 인디케이터 및 진행률 게이지 */}
            {nextGrade ? (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    다음 등급 <strong style={{ color: nextGrade.color }}>{nextGrade.name}</strong>까지
                  </span>
                  <span>진행률 {overallProgress}%</span>
                </div>
                
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div 
                    style={{ 
                      width: `${overallProgress}%`, 
                      height: '100%', 
                      background: `linear-gradient(to right, ${currentGrade.color}, ${nextGrade.color})`,
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '4px' }}>
                  <span>👣 걸음 수: {stepsNeeded.toLocaleString()}보 남음</span>
                  <span>🍃 탄소: {co2Needed.toFixed(2)}kg 남음</span>
                </div>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: 'var(--primary-neon)', fontWeight: '700' }}>
                  🎉 축하합니다! 에코 최고 등급인 [지구 수호자]를 달성하여 25% 적립 혜택을 누리고 있습니다.
                </p>
              </div>
            )}
            
            {/* 현재 등급 보너스 및 혜택 요약 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>현재 등급 적립 보너스</span>
                <strong style={{ color: currentGrade.color }}>+{currentGrade.bonusPercent}% 추가 적립</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>현재 에코샵 할인 혜택</span>
                <strong style={{ color: currentGrade.color }}>{currentGrade.shopDiscount}% 즉시 할인</strong>
              </div>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => setShowGradePopup(false)}
              style={{ width: '100%', padding: '10px', fontSize: '12px', marginTop: '16px', borderRadius: '12px', background: currentGrade.color, borderColor: currentGrade.color }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
