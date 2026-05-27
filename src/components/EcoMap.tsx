import React, { useState, useEffect } from 'react';
import { MapPin, Compass, Navigation, CheckCircle, Info } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

interface EcoMapProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  co2Saved: number;
  setCo2Saved: React.Dispatch<React.SetStateAction<number>>;
}

interface EcoSpot {
  id: number;
  name: string;
  category: 'cafe' | 'shop' | 'bike' | 'restaurant';
  address: string;
  description: string;
  lat: number;
  lng: number;
  pointsReward: number;
}

const ECO_SPOTS: EcoSpot[] = [
  {
    id: 1,
    name: '에코 브루 카페',
    category: 'cafe',
    address: '서울시 중구 을지로 12',
    description: '개인 텀블러 지참 시 전 음료 500원 할인 & 100P 적립',
    lat: 37.5662,
    lng: 126.9820,
    pointsReward: 100
  },
  {
    id: 2,
    name: '지구 살리기 리필스테이션',
    category: 'shop',
    address: '서울시 종로구 삼청로 24',
    description: '용기를 가져와 세제를 리필하면 플라스틱 절감 200P 적립',
    lat: 37.5790,
    lng: 126.9790,
    pointsReward: 200
  },
  {
    id: 3,
    name: '공공자전거 따릉이 대여소 (시청역)',
    category: 'bike',
    address: '서울시 중구 세종대로 110',
    description: '대중교통 환승 및 따릉이 이용 시 탄소 절감 150P 적립',
    lat: 37.5655,
    lng: 126.9755,
    pointsReward: 150
  },
  {
    id: 4,
    name: '그린 슬로우 레스토랑',
    category: 'restaurant',
    address: '서울시 중구 명동길 55',
    description: '국산 유기농 식자재 사용 및 비건 옵션 제공 150P 적립',
    lat: 37.5625,
    lng: 126.9845,
    pointsReward: 150
  }
];

const containerStyle = {
  width: '100%',
  height: '380px',
  borderRadius: '20px'
};

const defaultCenter = {
  lat: 37.5670,
  lng: 126.9790
};

export const EcoMap: React.FC<EcoMapProps> = ({ points, setPoints, co2Saved, setCo2Saved }) => {
  const [selectedSpot, setSelectedSpot] = useState<EcoSpot | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'cafe' | 'shop' | 'bike'>('all');
  const [navigationTarget, setNavigationTarget] = useState<EcoSpot | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const hasValidKey = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: hasValidKey ? apiKey : ''
  });

  const filteredSpots = ECO_SPOTS.filter(
    spot => activeTab === 'all' || spot.category === activeTab
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (navigating && navigationTarget) {
      interval = setInterval(() => {
        setNavProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setNavigating(false);
            
            const earnedPoints = navigationTarget.pointsReward;
            const co2Gained = parseFloat((Math.random() * 0.1 + 0.05).toFixed(3));
            
            setPoints(p => p + earnedPoints);
            setCo2Saved(c => parseFloat((c + co2Gained).toFixed(5)));
            
            setAlertMsg(`🎉 친환경 이동 완료! ${earnedPoints}P 적립 & CO2 ${co2Gained}kg 절감`);
            setTimeout(() => setAlertMsg(null), 4000);
            
            return 0;
          }
          return prev + 10;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [navigating, navigationTarget, setPoints, setCo2Saved]);

  const handleStartNavigation = (spot: EcoSpot) => {
    setNavigationTarget(spot);
    setNavigating(true);
    setNavProgress(0);
  };

  const getSpotColor = (category: string) => {
    switch (category) {
      case 'cafe': return '#10b981';
      case 'shop': return '#06b6d4';
      case 'bike': return '#fbbf24';
      default: return '#a855f7';
    }
  };

  return (
    <div className="animate-pop">
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>주변 에코 스팟</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>친환경 장소를 방문하고 에코 포인트를 적립하세요.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {(['all', 'cafe', 'shop', 'bike'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === tab ? '#000' : 'var(--text-main)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab === 'all' && '전체'}
            {tab === 'cafe' && '☕️ 에코 카페'}
            {tab === 'shop' && '♻️ 제로웨이스트'}
            {tab === 'bike' && '🚲 따릉이'}
          </button>
        ))}
      </div>

      {alertMsg && (
        <div 
          style={{
            background: 'rgba(16, 185, 129, 0.95)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-glow)',
            animation: 'success-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <CheckCircle size={16} />
          <span>{alertMsg}</span>
        </div>
      )}

      {navigating && navigationTarget && (
        <div className="card" style={{ marginBottom: '16px', border: '1px solid var(--secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--secondary)' }}>
              <Navigation size={12} className="glow-active" />
              {navigationTarget.name}까지 친환경 이동 중...
            </span>
            <span>{navProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${navProgress}%`, 
                height: '100%', 
                background: 'linear-gradient(to right, var(--secondary), var(--primary))',
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
        {hasValidKey && isLoaded && !loadError ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={15}
            options={{
              styles: [
                { elementType: 'geometry', stylers: [{ color: '#1b2320' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#1b2320' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                {
                  featureType: 'water',
                  elementType: 'geometry',
                  stylers: [{ color: '#0d161a' }]
                },
                {
                  featureType: 'road',
                  elementType: 'geometry',
                  stylers: [{ color: '#27332f' }]
                }
              ],
              disableDefaultUI: true
            }}
          >
            {filteredSpots.map(spot => (
              <Marker
                key={spot.id}
                position={{ lat: spot.lat, lng: spot.lng }}
                onClick={() => setSelectedSpot(spot)}
                title={spot.name}
              />
            ))}

            {selectedSpot && (
              <InfoWindow
                position={{ lat: selectedSpot.lat, lng: selectedSpot.lng }}
                onCloseClick={() => setSelectedSpot(null)}
              >
                <div style={{ color: '#000', padding: '4px', maxWidth: '200px' }}>
                  <h4 style={{ fontWeight: '700', fontSize: '13px' }}>{selectedSpot.name}</h4>
                  <p style={{ fontSize: '11px', margin: '4px 0', color: '#475569' }}>{selectedSpot.description}</p>
                  <button 
                    onClick={() => handleStartNavigation(selectedSpot)}
                    disabled={navigating}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      marginTop: '4px',
                      fontWeight: '600'
                    }}
                  >
                    이동 인증 (+{selectedSpot.pointsReward}P)
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div style={{ position: 'relative', height: '380px', background: 'radial-gradient(circle at center, #0f241d 0%, #060a09 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
              <span className="badge badge-primary">
                <Compass size={12} className="glow-active" />
                <span>에코 가이드 맵 (데모)</span>
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Info size={10} />
                API 키 미설정시 데모 맵이 표시됩니다.
              </span>
            </div>

            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <svg width="100%" height="100%" style={{ opacity: 0.1 }}>
                <line x1="10%" y1="0" x2="90%" y2="100%" stroke="var(--primary)" strokeWidth="3" />
                <line x1="90%" y1="0" x2="10%" y2="100%" stroke="var(--primary)" strokeWidth="3" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="var(--primary)" strokeWidth="2" />
                <circle cx="50%" cy="50%" r="90" fill="none" stroke="var(--secondary)" strokeWidth="1" strokeDasharray="5,5" />
              </svg>
            </div>

            <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
              {filteredSpots.map(spot => {
                const xPercent = ((spot.lng - 126.97) * 7000 + 40);
                const yPercent = (100 - ((spot.lat - 37.56) * 1500 + 30));
                const spotColor = getSpotColor(spot.category);
                
                return (
                  <button
                    key={spot.id}
                    onClick={() => setSelectedSpot(spot)}
                    style={{
                      position: 'absolute',
                      left: `${xPercent}%`,
                      top: `${yPercent}%`,
                      transform: 'translate(-50%, -50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: selectedSpot?.id === spot.id ? 100 : 10
                    }}
                  >
                    <div 
                      style={{ 
                        background: 'rgba(0,0,0,0.8)', 
                        padding: '3px 6px', 
                        borderRadius: '6px', 
                        fontSize: '9px', 
                        color: 'white',
                        border: `1px solid ${spotColor}`,
                        whiteSpace: 'nowrap',
                        marginBottom: '4px',
                        fontWeight: '600'
                      }}
                    >
                      {spot.name}
                    </div>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: spotColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      boxShadow: `0 0 10px ${spotColor}`,
                      animation: selectedSpot?.id === spot.id ? 'pulse-glow 1.5s infinite' : 'none'
                    }}>
                      <MapPin size={14} fill="#000" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ width: '100%', zIndex: 10, display: 'flex', justifyContent: 'flex-end', flexDirection: 'column' }}>
              {selectedSpot ? (
                <div className="card" style={{ margin: 0, background: 'rgba(11, 20, 17, 0.95)', border: `1px solid ${getSpotColor(selectedSpot.category)}`, padding: '12px', animation: 'success-pop 0.25s ease' }}>
                  <h4 style={{ fontSize: '14px', color: 'white', fontWeight: '700' }}>{selectedSpot.name}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0' }}>{selectedSpot.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '600' }}>+{selectedSpot.pointsReward}P 지급</span>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleStartNavigation(selectedSpot)}
                      disabled={navigating}
                      style={{ padding: '6px 12px', fontSize: '11px', width: 'auto', borderRadius: '8px' }}
                    >
                      이동 인증 시작
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '12px', background: 'rgba(0,0,0,0.5)', borderRadius: '12px' }}>
                  지도의 에코 마커를 클릭하여 혜택을 확인해 보세요.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '16px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>추천 친환경 스팟</h3>
        {filteredSpots.map(spot => {
          const spotColor = getSpotColor(spot.category);
          return (
            <div 
              key={spot.id} 
              className="card" 
              onClick={() => setSelectedSpot(spot)}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '14px 16px', 
                marginBottom: '10px', 
                cursor: 'pointer',
                borderColor: selectedSpot?.id === spot.id ? spotColor : 'var(--card-border)'
              }}
            >
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600' }}>{spot.name}</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{spot.address}</p>
              </div>
              <span className="badge badge-accent" style={{ color: spotColor, borderColor: spotColor, background: 'rgba(255,255,255,0.03)' }}>
                +{spot.pointsReward}P
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
