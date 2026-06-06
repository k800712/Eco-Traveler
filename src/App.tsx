import { useEffect, useState, useRef } from 'react';
import { Leaf, Smartphone, Sparkles, MapPin, Activity, Award, Download, ArrowRight, CheckCircle, Shield, Globe, Users } from 'lucide-react';
import EcoApp from './components/EcoApp';

function App() {
  const [activeNav, setActiveNav] = useState('hero');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

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
                onClick={scrollToDemo}
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
                <Sparkles size={14} /> AI 기반 다크 에코 관광 플랫폼
              </div>
              <h1 className="hero-title">
                지구를 구하는 여행,<br />
                당신의 <span>발걸음</span>으로<br />
                시작됩니다.
              </h1>
              <p className="hero-desc">
                에코-트래블러는 배리어프리(Barrier-Free) 무장애 관광 정보와 AI 저탄소 맞춤형 여정 추천을 제공합니다. 
                지속 가능한 로컬 환경을 탐험하고, 이산화탄소를 절감해 실시간 현금 머니백 혜택까지 누리세요.
              </p>
              <div className="hero-ctas">
                <a href="#demo" className="btn-hero btn-hero-primary" onClick={scrollToDemo}>
                  실시간 데모 체험 <ArrowRight size={18} />
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
                  <span className="stat-lbl">총 이산화탄소 절감</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">99.4%</span>
                  <span className="stat-lbl">무장애 동선 정확도</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">4.9★</span>
                  <span className="stat-lbl">스토어 사용자 평점</span>
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
                <EcoApp />
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
              더 나은 내일을 위한 <span>에코 파트너</span>
            </h2>
            <p className="section-desc">
              에코-트래블러는 단순히 길을 찾는 지도를 넘어, 친환경 이동과 로컬 챌린지 및 데이터 검증 기술을 결합하여 누구나 참여할 수 있는 녹색 관광 생태계를 만듭니다.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card reveal">
              <div className="feature-icon-wrapper">
                <MapPin size={28} />
              </div>
              <h3 className="feature-title">무장애 & 에코 맵</h3>
              <p className="feature-desc">
                경사로 및 리프트가 완비된 무장애(Barrier-Free) 최적 이동 루트와 탄소 배출량이 가장 적은 에코 관광 정보 및 대중교통 동선을 결합하여 완벽한 에코 지도를 서비스합니다.
              </p>
            </div>

            <div className="feature-card reveal delay-100">
              <div className="feature-icon-wrapper">
                <Sparkles size={28} />
              </div>
              <h3 className="feature-title">AI 에코 버틀러</h3>
              <p className="feature-desc">
                당신의 성향, 실시간 기상 상태, 에너지 절감 선호도를 분석하여 지구에 해를 끼치지 않는 나만의 에코 로컬 여행지를 스마트하게 추천해 드립니다.
              </p>
            </div>

            <div className="feature-card reveal delay-200">
              <div className="feature-icon-wrapper">
                <Activity size={28} />
              </div>
              <h3 className="feature-title">탄소 저감 머니백</h3>
              <p className="feature-desc">
                도보 이동, 대중교통 탑승, 제로웨이스트 실천 챌린지를 완수할 때마다 실시간으로 에코 포인트를 획득하고 계좌로 즉시 현금 환급(머니백)을 받으실 수 있습니다.
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
                <Smartphone size={14} /> 실시간 하이브리드 앱 데모
              </div>
              <h2 className="section-title" style={{ fontSize: '38px' }}>
                기다리지 말고,<br />
                지금 <span>직접 조작</span>해 보세요
              </h2>
              <p className="section-desc" style={{ marginBottom: '32px' }}>
                설치 없이 웹 화면에서 에코-트래블러의 스마트폰 환경을 동일하게 시뮬레이션할 수 있습니다. 
                우측의 목업 스마트폰 내부 탭을 클릭하여 맵 연동, 챌린지 수행, 현금 머니백 시스템을 즉시 경험하세요.
              </p>

              <div className="demo-step-list">
                <div className="demo-step-item active">
                  <div className="demo-step-num">1</div>
                  <div>
                    <h4 className="demo-step-title">대시보드에서 탄소 추적</h4>
                    <p className="demo-step-desc">실시간 걸음 수와 절감한 누적 CO2 배출량을 직관적으로 확인하고 포인트를 적립합니다.</p>
                  </div>
                </div>

                <div className="demo-step-item">
                  <div className="demo-step-num">2</div>
                  <div>
                    <h4 className="demo-step-title">로컬 에코 맵 탐색</h4>
                    <p className="demo-step-desc">Barrier-Free 마크와 에코 마크가 연동된 친환경 목적지를 탐색하고 최적 루트를 설계합니다.</p>
                  </div>
                </div>

                <div className="demo-step-item">
                  <div className="demo-step-num">3</div>
                  <div>
                    <h4 className="demo-step-title">에코 챌린지 및 머니백</h4>
                    <p className="demo-step-desc">다양한 미션을 달성하여 쌓인 포인트를 실시간으로 출금 신청하여 현금으로 환급받습니다.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 실제 마우스 인터랙션이 활성화된 폰 데모 프레임 */}
            <div className="demo-phone-container reveal delay-200">
              <div style={{ position: 'relative' }}>
                <EcoApp />
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
              더 푸른 지구를 만드는 여행,<br /><span>지금 바로 시작하세요</span>
            </h2>
            <p className="section-desc" style={{ marginBottom: '40px' }}>
              에코-트래블러는 환경부가 보증하는 탄소 인증 알고리즘과 지자체 연동 배리어프리 지도 데이터 인프라를 활용하여 검증되고 투명한 친환경 여행 여정을 가꿔 갑니다.
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
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>강력한 데이터 암호화 준수</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Globe size={24} style={{ color: 'var(--primary-neon)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>전국 관광 데이터 지원</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>로컬 투어 인프라 완벽 연동</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Users size={24} style={{ color: 'var(--primary-neon)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>공식 에코 기관 협업</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>탄소 중립 실천 검증 완료</span>
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
