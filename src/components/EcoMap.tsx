import React, { useState, useEffect } from 'react';
import { Compass, Info, ShieldAlert } from 'lucide-react';
import type { RefundItem } from './MoneyBack';

interface EcoMapProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  co2Saved: number;
  setCo2Saved: React.Dispatch<React.SetStateAction<number>>;
  steps: number;
  setSteps: React.Dispatch<React.SetStateAction<number>>;
  completedChallenges: number[];
  refundHistory: RefundItem[];
  setRefundHistory: React.Dispatch<React.SetStateAction<RefundItem[]>>;
  adminFuelPrice: number | null;
  adminRegionWeights: Record<string, number>;
}

export const EcoMap: React.FC<EcoMapProps> = ({
  points,
  setPoints,
  co2Saved,
  setCo2Saved,
  steps,
  setSteps,
  completedChallenges,
  refundHistory,
  setRefundHistory,
  adminFuelPrice,
  adminRegionWeights
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 1. Flutter Web iframe 상태 동기화 송신 Effect
  useEffect(() => {
    if (!iframeLoaded) return;

    const iframe = document.getElementById('flutter-map-iframe') as HTMLIFrameElement | null;
    if (iframe && iframe.contentWindow) {
      const statePayload = {
        type: 'SYNC_STATE',
        points,
        steps,
        co2Saved,
        completedChallenges,
        refundHistory
      };
      
      // 구조화 객체 형태로 postMessage 전송
      iframe.contentWindow.postMessage(statePayload, '*');
      
      // JSON String 호환성용 postMessage 동시 전송
      iframe.contentWindow.postMessage(JSON.stringify(statePayload), '*');

      // 관리자 설정 동기화 추가 전송
      const adminPayload = {
        type: 'SYNC_ADMIN_SETTINGS',
        fuelPrice: adminFuelPrice,
        regionWeights: adminRegionWeights
      };
      iframe.contentWindow.postMessage(adminPayload, '*');
      iframe.contentWindow.postMessage(JSON.stringify(adminPayload), '*');
      
      console.log('React -> Flutter: Sent SYNC_STATE & SYNC_ADMIN_SETTINGS message.', { statePayload, adminPayload });
    }
  }, [points, steps, co2Saved, completedChallenges, refundHistory, adminFuelPrice, adminRegionWeights, iframeLoaded]);

  // 2. Flutter Web -> React 수신 메시지 리스너 Effect
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const rawData = event.data;
        if (!rawData) return;

        let data: any;
        if (typeof rawData === 'string') {
          // JSON string 파싱 처리
          data = JSON.parse(rawData);
        } else if (typeof rawData === 'object') {
          data = rawData;
        } else {
          return;
        }

        if (!data || !data.type) return;

        console.log('Flutter -> React: Received message.', data);

        if (data.type === 'ADD_POINTS') {
          const earned = Number(data.earned || 0);
          const co2Val = Number(data.co2Val || 0);
          
          setPoints(prev => prev + earned);
          setCo2Saved(prev => parseFloat((prev + co2Val).toFixed(5)));
        } else if (data.type === 'ADD_STEPS') {
          const added = Number(data.added || 0);
          const earned = Number(data.earned || 0);
          const co2Val = Number(data.co2Val || 0);

          setSteps(prev => prev + added);
          if (earned > 0) {
            setPoints(prev => prev + earned);
          }
          setCo2Saved(prev => parseFloat((prev + co2Val).toFixed(5)));
        } else if (data.type === 'REFUND_REQUESTED') {
          const item = data.refundItem;
          if (item) {
            setPoints(prev => prev - Number(item.amount || 0));
            setRefundHistory(prev => [item, ...prev]);
          }
        } else if (data.type === 'REFUND_STATUS_UPDATED') {
          const id = data.id;
          const status = data.status;
          if (id && status) {
            setRefundHistory(prev =>
              prev.map(r => (r.id === id ? { ...r, status } : r))
            );
          }
        }
      } catch (e) {
        // 제3자 스크립트나 구글 맵 SDK 등 다른 모듈의 메시지는 안전하게 바이패스
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setPoints, setSteps, setCo2Saved, setRefundHistory]);

  const handleIframeLoad = () => {
    console.log('Flutter Web Map iframe successfully loaded.');
    setIframeLoaded(true);
    setLoadError(false);
  };

  const handleIframeError = () => {
    console.error('Failed to load Flutter Web Map iframe.');
    setLoadError(true);
  };

  // 3초 이상 상태 동기화가 되지 않거나 에러 발생 시를 위한 타이머 가드
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!iframeLoaded) {
        // 로딩 지연 경고 표시 (실제 에러가 아닐 수 있으므로 안내만 유지)
        console.warn('Flutter iframe connection is taking longer than expected.');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [iframeLoaded]);

  return (
    <div className="animate-pop" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '2px' }}>실시간 에코 맵</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              실시간 TourAPI 무장애 연계 관광 데이터와 연동 상태를 확인해 보세요.
            </p>
          </div>
          <span 
            className="badge badge-primary" 
            style={{ 
              fontSize: '10px', 
              padding: '4px 8px', 
              background: iframeLoaded ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: iframeLoaded ? 'var(--primary)' : '#ef4444',
              color: iframeLoaded ? 'var(--primary)' : '#ef4444'
            }}
          >
            <Compass size={11} className={iframeLoaded ? 'glow-active' : ''} style={{ marginRight: '4px' }} />
            {iframeLoaded ? '시스템 연결됨' : '연결 대기중'}
          </span>
        </div>
      </div>

      {loadError ? (
        <div 
          style={{ 
            flex: 1, 
            background: 'rgba(239, 68, 68, 0.05)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            textAlign: 'center'
          }}
        >
          <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>맵 뷰포트를 불러올 수 없습니다</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px', marginBottom: '16px' }}>
            Flutter Web 빌드가 완료되지 않았거나 파일 경로에 문제가 생겼습니다. 개발 터미널 빌드 로그를 확인해 주세요.
          </p>
        </div>
      ) : (
        <div 
          style={{ 
            flex: 1, 
            position: 'relative', 
            borderRadius: '24px', 
            overflow: 'hidden', 
            border: '1px solid rgba(16, 185, 129, 0.15)',
            boxShadow: 'var(--shadow-glow)',
            height: '460px',
            background: '#060a09'
          }}
        >
          {/* iframe 로딩 스피너 오버레이 */}
          {!iframeLoaded && (
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, #0f241d 0%, #060a09 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
                gap: '12px'
              }}
            >
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid rgba(16, 185, 129, 0.1)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                엔진 시동 및 맵 데이터 로드 중...
              </span>
            </div>
          )}

          <iframe
            id="flutter-map-iframe"
            src="/flutter_web/index.html"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block'
            }}
            title="Flutter Eco Traveler Map"
            allow="geolocation"
          />
        </div>
      )}

      <div 
        style={{ 
          marginTop: '12px', 
          padding: '10px 14px', 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
          flexShrink: 0
        }}
      >
        <Info size={14} style={{ color: 'var(--primary)', marginTop: '1px', flexShrink: 0 }} />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          지도에서 GPS 이동인증을 완료하면 획득한 에코 리워드 포인트와 CO2 탄소 저감 성과가 부모 웹 플랫폼의 상단 대시보드 스토리지 정보와 실시간으로 양방향 통신 동기화됩니다.
        </p>
      </div>
    </div>
  );
};
