import { useState, useEffect } from 'react';
import { Leaf, ShieldAlert, Cpu, Database, RefreshCw, CheckCircle, TrendingUp, Users, Activity, Settings, UserCheck, Award, Coins, Globe } from 'lucide-react';
import type { RefundItem } from './MoneyBack';

export function AdminBackoffice() {
  // 1. 로컬 스토리지에서 초기 상태 가져오기
  const [adminFuelPrice, setAdminFuelPrice] = useState<number | null>(() => {
    const saved = localStorage.getItem('admin_fuel_price');
    return saved ? parseInt(saved, 10) : null;
  });

  const [adminRegionWeights, setAdminRegionWeights] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('admin_region_weights');
    return saved ? JSON.parse(saved) : {
      '단양': 2.0,
      '태안': 1.8,
      '정선': 1.5,
      '고양(일산)': 1.5,
      '서울': 1.0,
    };
  });

  const [refundHistory, setRefundHistory] = useState<RefundItem[]>(() => {
    const saved = localStorage.getItem('eco_refund_history');
    return saved ? JSON.parse(saved) : [];
  });

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

  // 플랫폼 통계 상태 추가
  const [totalUsers, setTotalUsers] = useState<number>(() => {
    const saved = localStorage.getItem('eco_total_users');
    return saved ? parseInt(saved, 10) : 1482;
  });

  const [activeUsers, setActiveUsers] = useState<number>(42);

  const [apiStatus, setApiStatus] = useState({
    opinet: 'ONLINE',
    tourApi: 'ONLINE',
    gemini: 'ONLINE',
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // 2. 크로스 탭 동기화 (Storage Event)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      try {
        if (e.key === 'eco_refund_history' && e.newValue) {
          setRefundHistory(JSON.parse(e.newValue));
        } else if (e.key === 'eco_points' && e.newValue) {
          setPoints(parseInt(e.newValue, 10));
        } else if (e.key === 'eco_steps' && e.newValue) {
          setSteps(parseInt(e.newValue, 10));
        } else if (e.key === 'eco_co2' && e.newValue) {
          setCo2Saved(parseFloat(e.newValue));
        } else if (e.key === 'admin_fuel_price') {
          setAdminFuelPrice(e.newValue ? parseInt(e.newValue, 10) : null);
        } else if (e.key === 'admin_region_weights' && e.newValue) {
          setAdminRegionWeights(JSON.parse(e.newValue));
        } else if (e.key === 'eco_total_users' && e.newValue) {
          setTotalUsers(parseInt(e.newValue, 10));
        }
      } catch (err) {
        console.error('Admin Cross-Tab Sync Error:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 실시간 접속자 수 가상 변동 Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        // 38명 ~ 46명 사이에서 부드럽게 변동
        return next >= 38 && next <= 46 ? next : prev;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // 3. 상태 변경 시 로컬 스토리지 반영 및 갱신 전송
  const updateFuelPrice = (price: number | null) => {
    setAdminFuelPrice(price);
    if (price === null) {
      localStorage.removeItem('admin_fuel_price');
    } else {
      localStorage.setItem('admin_fuel_price', price.toString());
    }
    // StorageEvent는 동일 탭 내에서 발생하지 않으므로 직접 dispatch도 가능하나,
    // window.dispatchEvent(new Event('storage')) 등을 통해 현재 탭 내의 리스너도 깨울 수 있음.
    // 여기서는 크로스 탭 동기화가 목적이므로 localstorage에만 써놓으면 다른 데모 탭이 즉각 반응함.
  };

  const updateRegionWeight = (region: string, val: number) => {
    const updated = { ...adminRegionWeights, [region]: val };
    setAdminRegionWeights(updated);
    localStorage.setItem('admin_region_weights', JSON.stringify(updated));
  };

  const approveRefund = (itemId: string) => {
    const updatedHistory = refundHistory.map(r => 
      r.id === itemId ? { ...r, status: 'completed' as const } : r
    );
    setRefundHistory(updatedHistory);
    localStorage.setItem('eco_refund_history', JSON.stringify(updatedHistory));
  };

  // 모의 API 연결 상태 새로고침
  const handleApiRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setApiStatus({
        opinet: Math.random() > 0.05 ? 'ONLINE' : 'LATENCY',
        tourApi: Math.random() > 0.08 ? 'ONLINE' : 'LATENCY',
        gemini: 'ONLINE',
      });
    }, 800);
  };

  // 대기 중인 환급 신청 건수 필터링
  const pendingRefunds = refundHistory.filter(r => r.status === 'processing');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090d16',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 24px',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* 백그라운드 어드민 네온 조명 */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, rgba(0,0,0,0) 70%)',
        top: '-10%',
        right: '-10%',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.03) 0%, rgba(0,0,0,0) 70%)',
        bottom: '-10%',
        left: '-10%',
        pointerEvents: 'none'
      }}></div>

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          paddingBottom: '24px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '10px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Leaf size={24} style={{ color: '#00ffaa' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: '#fff' }}>
                  EcoTraveler
                </h1>
                <span style={{
                  background: 'rgba(6, 182, 212, 0.12)',
                  color: '#06b6d4',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  border: '1px solid rgba(6, 182, 212, 0.2)'
                }}>
                  BACKOFFICE
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', margin: 0 }}>
                에코-트래블러 플랫폼 실시간 통합 관제 시스템
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => window.open('/', '_blank')}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              사용자 화면 열기 ↗
            </button>
            <div style={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '6px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#34d399',
              fontWeight: '600'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                background: '#10b981',
                borderRadius: '50%',
                display: 'inline-block',
                boxShadow: '0 0 8px #10b981'
              }}></span>
              실시간 상태 동기화 중
            </div>
          </div>
        </header>

        {/* Live Traffic & Member Statistics */}
        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe size={16} style={{ color: '#00ffaa' }} />
          실시간 플랫폼 종합 트래픽 및 가입 현황
        </h2>
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* 실시간 접속자 */}
          <div style={{
            background: '#0d1527',
            border: '1px solid rgba(0, 255, 170, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
              <span>실시간 동시 접속자</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="live-dot" style={{
                  width: '6px',
                  height: '6px',
                  background: '#00ffaa',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'pulse 1.5s infinite'
                }}></span>
                <span style={{ color: '#00ffaa', fontSize: '10px' }}>LIVE</span>
              </div>
            </div>
            <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', marginTop: '12px', marginBottom: 0, fontFamily: 'monospace' }}>
              {activeUsers} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>명</span>
            </h3>
            <p style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', margin: 0 }}>
              체험 시뮬레이션 활성화 세션 포함
            </p>
          </div>

          {/* 누적 회원 수 */}
          <div style={{ background: '#0e1320', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
              <span>누적 가입 회원 수</span>
              <UserCheck size={16} style={{ color: '#00ffaa' }} />
            </div>
            <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', marginTop: '12px', marginBottom: 0, fontFamily: 'monospace' }}>
              {totalUsers.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>명</span>
            </h3>
            <p style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', margin: 0 }}>
              데모 폰에서 친구 모의 가입 시 즉각 카운트업
            </p>
          </div>

          {/* 누적 챌린지 성공 횟수 */}
          <div style={{ background: '#0e1320', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
              <span>오늘 달성한 에코 챌린지</span>
              <Award size={16} style={{ color: '#06b6d4' }} />
            </div>
            <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', marginTop: '12px', marginBottom: 0, fontFamily: 'monospace' }}>
              324 <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>건</span>
            </h3>
            <p style={{ fontSize: '10px', color: '#34d399', marginTop: '8px', margin: 0 }}>
              목표 대비 108% 초과 달성 중 📈
            </p>
          </div>

          {/* 누적 에코 머니백 지급 총액 */}
          <div style={{ background: '#0e1320', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
              <span>누적 머니백 정산 총액</span>
              <Coins size={16} style={{ color: '#fbbf24' }} />
            </div>
            <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', marginTop: '12px', marginBottom: 0, fontFamily: 'monospace' }}>
              1,842,000 <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>원</span>
            </h3>
            <p style={{ fontSize: '10px', color: '#fbbf24', marginTop: '8px', margin: 0 }}>
              지역 가맹점 연계 포인트 정산 포함
            </p>
          </div>
        </section>

        {/* Simulator Integration Section */}
        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={16} style={{ color: '#00ffaa' }} />
          가상 스마트폰 시뮬레이터 연동 데이터
        </h2>
        {/* Overview Stats */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{ background: '#0e1320', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
              <span>시뮬레이터 활성 유저 포인트</span>
              <Users size={16} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginTop: '12px', marginBottom: 0, fontFamily: 'monospace' }}>
              {points.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>P</span>
            </h3>
          </div>

          <div style={{ background: '#0e1320', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
              <span>시뮬레이터 오늘 걸음 수</span>
              <Activity size={16} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginTop: '12px', marginBottom: 0, fontFamily: 'monospace' }}>
              {steps.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>걸음</span>
            </h3>
          </div>

          <div style={{ background: '#0e1320', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
              <span>시뮬레이터 누적 탄소 절감량</span>
              <TrendingUp size={16} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#00ffaa', marginTop: '12px', marginBottom: 0, fontFamily: 'monospace' }}>
              {co2Saved.toFixed(2)} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>kg</span>
            </h3>
          </div>

          <div style={{ background: '#0e1320', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
              <span>대기 중인 환급 신청 건</span>
              <ShieldAlert size={16} style={{ color: pendingRefunds.length > 0 ? '#f59e0b' : '#64748b' }} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: pendingRefunds.length > 0 ? '#f59e0b' : '#fff', marginTop: '12px', marginBottom: 0, fontFamily: 'monospace' }}>
              {pendingRefunds.length} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>건</span>
            </h3>
          </div>
        </section>

        {/* Main Console Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '7fr 5fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Left Column: Settings Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 유가 오버라이드 제어 */}
            <div style={{
              background: '#0e1320',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={18} style={{ color: '#00ffaa' }} />
                  <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#fff' }}>⛽ 실시간 주행 유가 시뮬레이션 제어</h2>
                </div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={adminFuelPrice === null} 
                    onChange={(e) => updateFuelPrice(e.target.checked ? null : 1850)} 
                  />
                  오피넷 API 실시간 유가 자동 연동
                </label>
              </div>

              {adminFuelPrice !== null ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>강제 설정 중인 휘발유 가격</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#00ffaa', fontFamily: 'monospace' }}>
                      {adminFuelPrice.toLocaleString()}원 / L
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="1400" 
                    max="2200" 
                    step="10" 
                    value={adminFuelPrice} 
                    onChange={(e) => updateFuelPrice(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#00ffaa', cursor: 'pointer', marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                    <span>1,400원</span>
                    <span>고유가 유가 상승 상황 가상 연출</span>
                    <span>2,200원</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px dashed rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    실시간 오피넷(Opinet) 전국 평균가 정보를 수집하여 머니백 계산기에 제공하고 있습니다.
                  </p>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: '4px 0 0 0' }}>
                    수동으로 요금을 변동하려면 위 체크박스를 해제하세요.
                  </p>
                </div>
              )}
            </div>

            {/* 지역별 에코 적립 가중치 제어 */}
            <div style={{
              background: '#0e1320',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Database size={18} style={{ color: '#00ffaa' }} />
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#fff' }}>🗺️ 지역별 혜택 가중치 오버라이드 (L_weight)</h2>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px', lineHeight: '1.4' }}>
                인구 감소 관심 지역이나 특정 프로모션 지역 방문 시 가점 가중치를 실시간으로 적용합니다. (일산은 가점 시범 지구)
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {Object.keys(adminRegionWeights).map((region) => (
                  <div 
                    key={region} 
                    style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '14px 16px', 
                      borderRadius: '14px', 
                      border: '1px solid rgba(255,255,255,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', color: region.includes('고양') ? '#00ffaa' : '#fff' }}>
                        {region} {region.includes('고양') && '⭐'}
                      </span>
                      <span style={{ color: '#00ffaa', fontWeight: '800', fontFamily: 'monospace' }}>
                        {adminRegionWeights[region].toFixed(1)}x
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1.0" 
                      max="3.0" 
                      step="0.1" 
                      value={adminRegionWeights[region]} 
                      onChange={(e) => updateRegionWeight(region, parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#00ffaa', cursor: 'pointer' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Payout Queue & APIs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 환급 승인 대기열 */}
            <div style={{
              background: '#0e1320',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <CheckCircle size={18} style={{ color: '#00ffaa' }} />
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#fff' }}>💳 실시간 환급 승인 및 이체 대기열</h2>
              </div>

              {pendingRefunds.length === 0 ? (
                <div style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  background: 'rgba(0, 0, 0, 0.15)',
                  borderRadius: '14px',
                  border: '1px dashed rgba(255, 255, 255, 0.04)'
                }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    현재 관제 대기 중인 환급 신청 건이 없습니다.
                  </p>
                  <p style={{ fontSize: '10px', color: '#475569', marginTop: '6px', margin: 0, lineHeight: '1.4' }}>
                    다른 탭에서 사용자 모드로 실행 중인 스마트폰 데모 내 [머니백] 탭에서 환급을 신청하면 즉시 이 대기열에 실시간 노출됩니다.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
                  {pendingRefunds.map((item) => (
                    <div 
                      key={item.id} 
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255,255,255,0.03)',
                        borderRadius: '14px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                            {item.bank} | {item.holder}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                            계좌: {item.account}
                          </div>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#fbbf24', fontFamily: 'monospace' }}>
                          {item.amount.toLocaleString()}원
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid rgba(255,255,255,0.03)',
                        paddingTop: '10px'
                      }}>
                        <span style={{ fontSize: '10px', color: '#475569' }}>
                          ID: {item.id} | {item.date}
                        </span>
                        <button 
                          onClick={() => approveRefund(item.id)}
                          style={{
                            background: '#00ffaa',
                            color: '#090d16',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'transform 0.1s ease'
                          }}
                          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          즉시 송금 승인
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 외부 API 연동 상태 모니터링 */}
            <div style={{
              background: '#0e1320',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} style={{ color: '#00ffaa' }} />
                  <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#fff' }}>🤖 외부 연동 OpenAPI 상태 모니터링</h2>
                </div>
                <button 
                  onClick={handleApiRefresh}
                  disabled={isRefreshing}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00ffaa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}
                >
                  <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                  {isRefreshing ? '조회 중...' : '새로고침'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>⛽ 한국석유공사 Opinet API</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: apiStatus.opinet === 'ONLINE' ? '#10b981' : '#f59e0b',
                    background: apiStatus.opinet === 'ONLINE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>{apiStatus.opinet}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>🗺️ 한국관광공사 국문 관광정보 TourAPI</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: apiStatus.tourApi === 'ONLINE' ? '#10b981' : '#f59e0b',
                    background: apiStatus.tourApi === 'ONLINE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>{apiStatus.tourApi}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>✨ Google Gemini Pro 추천 AI Engine</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: apiStatus.gemini === 'ONLINE' ? '#10b981' : '#f59e0b',
                    background: apiStatus.gemini === 'ONLINE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>{apiStatus.gemini}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; box-shadow: 0 0 0 0 rgba(0, 255, 170, 0.7); }
          70% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 6px rgba(0, 255, 170, 0); }
          100% { transform: scale(0.95); opacity: 0.5; box-shadow: 0 0 0 0 rgba(0, 255, 170, 0); }
        }
      `}</style>
    </div>
  );
}
