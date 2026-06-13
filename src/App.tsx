import { useEffect, useState, useRef } from 'react';
import { Leaf, Smartphone, Sparkles, MapPin, Activity, Download, ArrowRight, CheckCircle, Shield, Globe, Users } from 'lucide-react';
import EcoApp from './components/EcoApp';
import type { RefundItem } from './components/MoneyBack';
import { AdminBackoffice } from './components/AdminBackoffice';

function App() {
  const [activeNav, setActiveNav] = useState('hero');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);



  // 모바일 앱 상태 Lift Up
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

  const [completedChallenges, setCompletedChallenges] = useState<number[]>(() => {
    const saved = localStorage.getItem('eco_completed_challenges');
    return saved ? JSON.parse(saved) : [];
  });

  const [adminFuelPrice, setAdminFuelPrice] = useState<number | null>(null);
  const [adminRegionWeights, setAdminRegionWeights] = useState<Record<string, number>>({
    '단양': 2.0,
    '태안': 1.8,
    '정선': 1.5,
    '고양(일산)': 1.5,
    '서울': 1.0,
  });

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

  useEffect(() => {
    localStorage.setItem('eco_completed_challenges', JSON.stringify(completedChallenges));
  }, [completedChallenges]);

  // 크로스 탭 상태 동기화 Effect (window storage 이벤트 감지)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      try {
        if (e.key === 'eco_points' && e.newValue) {
          setPoints(parseInt(e.newValue, 10));
        } else if (e.key === 'eco_steps' && e.newValue) {
          setSteps(parseInt(e.newValue, 10));
        } else if (e.key === 'eco_co2' && e.newValue) {
          setCo2Saved(parseFloat(e.newValue));
        } else if (e.key === 'eco_refund_history' && e.newValue) {
          setRefundHistory(JSON.parse(e.newValue));
        } else if (e.key === 'eco_completed_challenges' && e.newValue) {
          setCompletedChallenges(JSON.parse(e.newValue));
        } else if (e.key === 'admin_fuel_price') {
          setAdminFuelPrice(e.newValue ? parseInt(e.newValue, 10) : null);
        } else if (e.key === 'admin_region_weights' && e.newValue) {
          setAdminRegionWeights(JSON.parse(e.newValue));
        }
      } catch (err) {
        console.error('Cross-Tab Sync Error:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);



  // 스크롤 시 GNB 활성 탭 전환 및 투명도 조절
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.landing-header');
      if (window.scrollY > 50) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }

      const sections = ['hero', 'features', 'demo'];
      const scrollPos = window.scrollY + 150;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveNav(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer를 이용한 스크롤 Reveal 효과
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.15 }
    );

    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach((el) => observer.observe(el));

    return () => {
      reveals.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // 다운로드 시뮬레이션 핸들러
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading || downloadSuccess) return;
    
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 3000);
    }, 1200);
  };

  // 데모 섹션으로 스크롤 이동
  const scrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    demoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (window.location.pathname === '/admin') {
    return <AdminBackoffice />;
  }

  return (
    <div style={{ width: '100%' }}>
      {/* 백그라운드 블러 글로우 (다크에코 무드) */}
      <div className="bg-blur-green"></div>
      <div className="bg-blur-blue"></div>

      {/* GNB Header */}
      <header className="landing-header">
        <div className="header-inner">
          <a href="#hero" className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Leaf size={24} style={{ color: 'var(--primary-neon)' }} />
            Eco<span>Traveler</span>
          </a>
          <ul className="nav-menu">
            <li>
              <a 
                href="#hero" 
                className={`nav-link ${activeNav === 'hero' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                홈
              </a>
            </li>
            <li>
              <a 
                href="#features" 
                className={`nav-link ${activeNav === 'features' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                서비스 특징
              </a>
            </li>
            <li>
              <a 
                href="#demo" 
                className={`nav-link ${activeNav === 'demo' ? 'active' : ''}`}
                onClick={(e) => {
                  scrollToDemo(e);
                }}
              >
                실시간 데모
              </a>
            </li>
          </ul>
          <a href="#download" className="header-cta" onClick={handleDownload}>
            {downloading ? '준비 중...' : downloadSuccess ? '다운로드 완료!' : '앱 다운로드'}
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="section hero-section">
        <div className="landing-container">
          <div className="hero-grid">
            <div className="hero-content reveal">
              <div className="hero-badge">
                <Sparkles size={14} /> 쉽고 재미있는 친환경 여행 가이드
              </div>
              <h1 className="hero-title">
                지구를 구하는 여행,<br />
                당신의 <span>발걸음</span>으로<br />
                시작됩니다.
              </h1>
              <p className="hero-desc">
                에코-트래블러는 휠체어나 유모차가 가기 편한 좋은 길을 알려주고, 지구를 지킬 수 있는 저탄소 여행지를 알려주는 앱이에요. 
                지구를 아끼는 미션을 성공하고 포인트를 모아 통장에 진짜 돈으로 돌려받아 보세요!
              </p>
              <div className="hero-ctas">
                <a href="#demo" className="btn-hero btn-hero-primary" onClick={scrollToDemo}>
                  지금 바로 사용해보기 <ArrowRight size={18} />
                </a>
                <a href="#download" className="btn-hero btn-hero-secondary" onClick={handleDownload}>
                  <Download size={18} /> {downloading ? '설치 파일 준비 중...' : '앱 무료 다운로드'}
                </a>
              </div>

              {/* 실시간 다운로드 다운로드 알림 토스트 마이크로 인터랙션 */}
              {downloadSuccess && (
                <div 
                  className="animate-pop"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(0, 255, 170, 0.1)',
                    border: '1px solid rgba(0, 255, 170, 0.3)',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    color: 'var(--primary-neon)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginTop: '-16px',
                    marginBottom: '24px',
                    width: 'fit-content'
                  }}
                >
                  <CheckCircle size={18} /> Eco-Traveler.apk 다운로드가 시작되었습니다!
                </div>
              )}

              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-val">12,480kg</span>
                  <span className="stat-lbl">아낀 탄소 무게</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">99.4%</span>
                  <span className="stat-lbl">길찾기 성공률</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">4.9★</span>
                  <span className="stat-lbl">사용자 만족도</span>
                </div>
              </div>
            </div>

            {/* 히어로 영역 오른쪽 목업 엿보기 */}
            <div className="demo-phone-container reveal delay-200" style={{ perspective: '1000px' }}>
              <div 
                style={{
                  transform: 'rotateY(-12deg) rotateX(8deg)',
                  boxShadow: '25px 25px 50px rgba(0, 0, 0, 0.75)',
                  borderRadius: '44px',
                  transition: 'transform 0.5s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'rotateY(-2deg) rotateX(2deg) scale(1.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'rotateY(-12deg) rotateX(8deg)';
                }}
              >
                <EcoApp
                  points={points}
                  setPoints={setPoints}
                  steps={steps}
                  setSteps={setSteps}
                  co2Saved={co2Saved}
                  setCo2Saved={setCo2Saved}
                  refundHistory={refundHistory}
                  setRefundHistory={setRefundHistory}
                  completedChallenges={completedChallenges}
                  setCompletedChallenges={setCompletedChallenges}
                  adminFuelPrice={adminFuelPrice}
                  adminRegionWeights={adminRegionWeights}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section features-section">
        <div className="landing-container">
          <div className="section-header reveal">
            <h2 className="section-title">
              지구를 지켜주는 <span>착한 걷기 파트너</span>
            </h2>
            <p className="section-desc">
              에코-트래블러와 함께 걷는 여행을 시작해봐요! 내가 걸으면서 지구를 구하고, 다 함께 행복해지는 친환경 여행을 가꾸어 갑니다.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card reveal">
              <div className="feature-icon-wrapper">
                <MapPin size={28} />
              </div>
              <h3 className="feature-title">모두가 걷기 좋은 에코 지도</h3>
              <p className="feature-desc">
                휠체어나 유모차도 편하게 갈 수 있는 경사로 길을 보여줘요. 자연을 지켜주는 깨끗한 대중교통 이용 방법과 가까운 친환경 여행지를 쉽게 찾을 수 있는 친화적인 지도입니다.
              </p>
            </div>

            <div className="feature-card reveal delay-100">
              <div className="feature-icon-wrapper">
                <Sparkles size={28} />
              </div>
              <h3 className="feature-title">AI 에코 비서</h3>
              <p className="feature-desc">
                내가 가보고 싶은 취향과 오늘 날씨를 척척 분석해서, 자연환경을 아끼고 사랑할 수 있는 보물 같은 로컬 여행지를 추천해 드립니다.
              </p>
            </div>

            <div className="feature-card reveal delay-200">
              <div className="feature-icon-wrapper">
                <Activity size={28} />
              </div>
              <h3 className="feature-title">지구를 지키고 돈 받기</h3>
              <p className="feature-desc">
                많이 걷기, 버스 타기, 텀블러 사용하기 미션을 하고 얻은 에코 포인트를 내 통장에 진짜 돈으로 입금받는 재미있는 리워드 시스템입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" ref={demoRef} className="section demo-section">
        <div className="landing-container">
          <div className="demo-grid">
            <div className="demo-info reveal">
              <div className="hero-badge">
                <Smartphone size={14} /> 가상 스마트폰 체험존
              </div>
              <h2 className="section-title" style={{ fontSize: '38px' }}>
                앱을 안 깔아도 괜찮아요,<br />
                지금 <span>직접 눌러보세요!</span>
              </h2>
              <p className="section-desc" style={{ marginBottom: '32px' }}>
                오른쪽에 있는 스마트폰 화면을 손가락으로 누르듯이 마우스로 클릭해 보세요! 
                걷기, 지도 조작하기, 텀블러 미션 하기, 모은 포인트 진짜로 돈 돌려받기까지 미리 체험해 볼 수 있습니다.
              </p>

              <div className="demo-step-list">
                <div className="demo-step-item active">
                  <div className="demo-step-num">1</div>
                  <div>
                    <h4 className="demo-step-title">걸음 수와 포인트 확인하기</h4>
                    <p className="demo-step-desc">내가 오늘 열심히 걸어서 모은 포인트와 아낀 공기(탄소) 무게를 대시보드에서 보아요.</p>
                  </div>
                </div>

                <div className="demo-step-item">
                  <div className="demo-step-num">2</div>
                  <div>
                    <h4 className="demo-step-title">에코 지도 탐색하기</h4>
                    <p className="demo-step-desc">유모차나 휠체어가 가기 쉬운 길과 푸릇푸릇한 친환경 여행지를 지도 마커로 확인하며 경로를 짜요.</p>
                  </div>
                </div>

                <div className="demo-step-item">
                  <div className="demo-step-num">3</div>
                  <div>
                    <h4 className="demo-step-title">미션 완료하고 돈 돌려받기</h4>
                    <p className="demo-step-desc">개인 텀블러 미션이나 걷기 미션으로 포인트를 모아 진짜 내 지갑(통장)으로 쏙 돌려받습니다.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 실제 마우스 인터랙션이 활성화된 폰 데모 프레임 */}
            <div className="demo-phone-container reveal delay-200">
              <div style={{ position: 'relative' }}>
                <EcoApp
                  points={points}
                  setPoints={setPoints}
                  steps={steps}
                  setSteps={setSteps}
                  co2Saved={co2Saved}
                  setCo2Saved={setCo2Saved}
                  refundHistory={refundHistory}
                  setRefundHistory={setRefundHistory}
                  completedChallenges={completedChallenges}
                  setCompletedChallenges={setCompletedChallenges}
                  adminFuelPrice={adminFuelPrice}
                  adminRegionWeights={adminRegionWeights}
                />
                <div 
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    background: 'var(--primary-neon)',
                    color: 'var(--text-dark)',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    animation: 'bounce 2s infinite',
                    pointerEvents: 'none',
                    zIndex: 999
                  }}
                >
                  🖱️ 터치하여 작동!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 다운로드 유도 및 약속 섹션 */}
      <section 
        id="download" 
        className="section"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 255, 170, 0.05) 0%, rgba(0,0,0,0) 80%)',
          borderTop: '1px solid rgba(0, 255, 170, 0.05)'
        }}
      >
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <div className="reveal" style={{ maxWidth: '750px', margin: '0 auto' }}>
            <h2 className="section-title" style={{ fontSize: '42px', marginBottom: '20px' }}>
              푸른 지구를 만드는 착한 여행,<br /><span>지금 바로 시작해요!</span>
            </h2>
            <p className="section-desc" style={{ marginBottom: '40px' }}>
              에코-트래블러는 걷기 운동과 일상 속 작은 친환경 실천으로 이산화탄소를 줄이고, 누구나 즐겁고 편하게 자연을 즐기며 힐링할 수 있도록 돕는 친화적인 도우미 서비스입니다.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <a 
                href="#download" 
                className="btn-hero btn-hero-primary" 
                style={{ padding: '18px 40px', fontSize: '17px' }}
                onClick={handleDownload}
              >
                <Download size={20} /> {downloading ? '다운로드 준비 중...' : 'Google Play 다운로드'}
              </a>
              <a 
                href="#download" 
                className="btn-hero btn-hero-secondary" 
                style={{ padding: '18px 40px', fontSize: '17px' }}
                onClick={handleDownload}
              >
                <Download size={20} /> App Store 다운로드
              </a>
            </div>

            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
                marginTop: '80px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '48px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Shield size={24} style={{ color: 'var(--primary-neon)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>개인정보 안전 보장</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>소중한 내 정보 안전하게 보관</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Globe size={24} style={{ color: 'var(--primary-neon)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>전국의 가 볼 만한 곳 추천</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>어디서든 편하게 볼 수 있는 여행 정보</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Users size={24} style={{ color: 'var(--primary-neon)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>친환경 라이프 실천</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>지구를 살리는 착한 도보 동행</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-inner">
            <a href="#hero" className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Leaf size={20} style={{ color: 'var(--primary-neon)' }} />
              Eco<span>Traveler</span>
            </a>
            <div className="footer-links">
              <a href="#privacy" className="footer-link" onClick={(e) => e.preventDefault()}>개인정보처리방침</a>
              <a href="#terms" className="footer-link" onClick={(e) => e.preventDefault()}>서비스이용약관</a>
              <a href="#contact" className="footer-link" onClick={(e) => e.preventDefault()}>고객지원</a>
            </div>
          </div>
          <div className="footer-copyright">
            <p>&copy; 2026 Eco-Traveler Team. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* CSS Bounce Animation for Cursor Alert */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

export default App;
