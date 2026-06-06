import React, { useState } from 'react';
import { Wallet, Gift, ArrowRightLeft, CheckCircle, CreditCard, Users, Copy, PlusCircle, Sparkles, Share2 } from 'lucide-react';

export interface RefundItem {
  id: string;
  bank: string;
  account: string;
  holder: string;
  amount: number;
  date: string;
  status: 'processing' | 'completed';
}

interface MoneyBackProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  refundHistory: RefundItem[];
  setRefundHistory: React.Dispatch<React.SetStateAction<RefundItem[]>>;
}

interface ShopItem {
  id: number;
  name: string;
  cost: number;
  description: string;
  icon: string;
  category: 'fnb' | 'car' | 'life';
}

// 친구 추천 가상 기여 내역 모델
interface ReferralFeedItem {
  id: string;
  friendName: string;
  actionType: 'sign_up' | 'activity';
  actionName: string;
  earnedPoints: number;
  date: string;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 1,
    name: '유기농 공정무역 드립커피 5입 팩',
    cost: 5000,
    description: '화학 비료를 전혀 쓰지 않은 탄소중립 인증 공정무역 친환경 원두 팩',
    icon: '☕',
    category: 'fnb'
  },
  {
    id: 2,
    name: '비건 에코 식음료 1만원 모바일 금액권',
    cost: 10000,
    description: '제휴 비건/유기농 레스토랑 및 친환경 카페에서 사용 가능한 1만원 금액권',
    icon: '🥗',
    category: 'fnb'
  },
  {
    id: 3,
    name: '[서초 오토갤러리] 연비 정밀 점검 & 친환경 오일 2만원 할인권',
    cost: 20000,
    description: '타이어 공기압 보정, 흡기 진단 및 친환경 연비 개선 오일 교환 우대 혜택',
    icon: '🛠️',
    category: 'car'
  },
  {
    id: 4,
    name: '[서초 오토갤러리] 친환경 스팀 실내살균 세차 2만원 할인권',
    cost: 20000,
    description: '생분해성 생태 약제와 초소량 물 스팀 분사로 오염 및 세균을 박멸하는 디테일링 케어',
    icon: '🧼',
    category: 'car'
  },
  {
    id: 5,
    name: '[서초 오토갤러리] 탄소저감 초고성능 열차단 틴팅 5만원 시공 할인권',
    cost: 50000,
    description: '에어컨 가동률을 대폭 낮춰 연료 소비와 탄소 발생을 감축해 주는 IR 열차단 필름 할인권',
    icon: '☀️',
    category: 'car'
  },
  {
    id: 6,
    name: '따릉이 / 친환경 공유자전거 2시간권',
    cost: 2000,
    description: '서울 따릉이 등 제휴 공유자전거 서비스에서 사용 가능한 2시간 에코 이용권',
    icon: '🚲',
    category: 'life'
  },
  {
    id: 7,
    name: '리유저블 실리콘 접이식 에코 컵',
    cost: 7000,
    description: '접어서 휴대가 편리한 100% 무독성 실리콘 다회용 컵 (카페 300원 할인 매칭)',
    icon: '🥤',
    category: 'life'
  },
  {
    id: 8,
    name: '제로웨이스트 친환경 욕실 세트',
    cost: 8000,
    description: '대나무 칫솔, 고체 샴푸바, 삼베 수건이 포함된 여행용 에코 세트',
    icon: '🧽',
    category: 'life'
  },
  {
    id: 9,
    name: '사막화 방지 반려나무 1그루 기부권',
    cost: 15000,
    description: '사회적 기업 트리플래닛과 연계하여 강원도 산불 피해 지역에 실제 나무 1그루 식재 기부',
    icon: '🌲',
    category: 'life'
  }
];

export const MoneyBack: React.FC<MoneyBackProps> = ({
  points,
  setPoints,
  refundHistory,
  setRefundHistory
}) => {
  // 1. subTab 상태 확장: referral(친구 추천) 추가
  const [subTab, setSubTab] = useState<'cashback' | 'shop' | 'referral'>('shop');
  const [shopCategory, setShopCategory] = useState<'all' | 'fnb' | 'car' | 'life'>('all');
  
  const [bank, setBank] = useState('국민은행');
  const [account, setAccount] = useState('');
  const [holder, setHolder] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [purchasedItem, setPurchasedItem] = useState<ShopItem | null>(null);

  // 2. 친구 추천 로열티 데이터 상태값
  const [referralCode] = useState('ECO-WALK12');
  const [referralFeed, setReferralFeed] = useState<ReferralFeedItem[]>([
    {
      id: 'F_FEED_1',
      friendName: '김뚜벅',
      actionType: 'activity',
      actionName: '카페 텀블러 인증 완료',
      earnedPoints: 40, // 친구가 500P 적립한 것의 8% (새싹 등급)
      date: '어제'
    },
    {
      id: 'F_FEED_2',
      friendName: '김뚜벅',
      actionType: 'sign_up',
      actionName: '추천 가입 및 첫 인증 완료 보너스',
      earnedPoints: 1000,
      date: '어제'
    }
  ]);

  // 대시보드 상태와 동기화된 유저 등급 산정 (로열티 비율 및 할인율 연동용)
  const getDiscountAndBonus = (currentPoints: number) => {
    // 임의 보정: 보유 포인트 및 환급 히스토리 크기로 등급 간접 예측
    // 실생활 기준 steps는 App.tsx 전역 상태이나 여기에 points만 내려오므로 points 비례 계산
    // 8500P 인근일 때는 2단계 새싹으로 판정
    if (currentPoints >= 100000) return { name: '지구 수호자', bonus: 25, discount: 10, color: '#3b82f6' };
    if (currentPoints >= 50000) return { name: '에코 숲', bonus: 12, discount: 5, color: '#06b6d4' };
    if (currentPoints >= 20000) return { name: '에코 나무', bonus: 10, discount: 3, color: '#059669' };
    if (currentPoints >= 4000) return { name: '에코 새싹', bonus: 8, discount: 0, color: '#34d399' };
    return { name: '에코 씨앗', bonus: 5, discount: 0, color: '#10b981' };
  };

  const userGradeInfo = getDiscountAndBonus(points);

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refundAmount = parseInt(amount);

    if (isNaN(refundAmount) || refundAmount < 5000) {
      alert('최소 환급 신청 금액은 5,000원입니다.');
      return;
    }

    if (refundAmount > points) {
      alert('보유하신 포인트 내에서만 환급 신청이 가능합니다.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      
      const newPoints = points - refundAmount;
      setPoints(newPoints);

      const newRefund: RefundItem = {
        id: Math.random().toString(36).substring(2, 9).toUpperCase(),
        bank,
        account: account.replace(/(\d{4})\d+(\d{4})/, '$1-******-$2'),
        holder,
        amount: refundAmount,
        date: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'processing'
      };

      setRefundHistory(prev => [newRefund, ...prev]);
      setSuccessMsg(`🏦 ${refundAmount.toLocaleString()}원 환급 신청이 완료되었습니다! (영업일 기준 1~2일 소요)`);
      
      setAccount('');
      setHolder('');
      setAmount('');

      setTimeout(() => setSuccessMsg(null), 4000);
    }, 1500);
  };

  const handleBuyShopItem = (item: ShopItem) => {
    // 1번 항목인 등급별 즉시 할인율 계산
    const discount = userGradeInfo.discount;
    const finalCost = discount > 0 ? Math.round(item.cost * (1 - discount / 100)) : item.cost;

    if (points < finalCost) {
      alert('포인트가 부족합니다.');
      return;
    }

    const confirmMsg = discount > 0 
      ? `"${item.name}" 상품을 ${userGradeInfo.name} 등급 ${discount}% 할인가인 ${finalCost.toLocaleString()}P에 교환하시겠습니까?`
      : `"${item.name}" 상품을 ${item.cost.toLocaleString()}P에 교환하시겠습니까?`;

    if (confirm(confirmMsg)) {
      setPoints(p => p - finalCost);
      setPurchasedItem({
        ...item,
        cost: finalCost // 실제 지불한 포인트 저장
      });
    }
  };

  // 3. 추천 코드 복사 함수
  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setSuccessMsg('📋 초대 코드가 클립보드에 복사되었습니다. 친구에게 발송해 보세요!');
    setTimeout(() => {
      setCopied(false);
      setSuccessMsg(null);
    }, 3500);
  };

  // 4. 모바일 네이티브 공유 및 SMS 문자 전송 핸들러
  const handleShare = async (platform: 'native' | 'sms') => {
    const downloadUrl = 'https://ecotraveler.page.link/download';
    const message = `[에코 트래블러] 친환경 도보 여행 동참하고 1,000P를 무료로 받아 가세요!\n\n초대코드: ${referralCode}\n앱 다운로드: ${downloadUrl}`;

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: '에코 트래블러 초대',
          text: message,
          url: downloadUrl
        });
        setSuccessMsg('📤 성공적으로 공유 창이 활성화되었습니다!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (e) {
        console.warn('Native share failed or dismissed:', e);
      }
    } else {
      // iOS / Android SMS 스키마 구분 처리
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
      const smsBody = encodeURIComponent(message);
      const smsUrl = isIOS ? `sms:&body=${smsBody}` : `sms:?body=${smsBody}`;
      
      window.location.href = smsUrl;
      setSuccessMsg('💬 문자 메시지 발송 창으로 연결 중입니다...');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // 4. E2E 가상 친구 가입 & 로열티 적립 시뮬레이터
  const handleSimulateReferralJoin = () => {
    const friendNames = ['이초록', '박에코', '강뚜벅', '한나무'];
    const selectedFriend = friendNames[Math.floor(Math.random() * friendNames.length)];
    const isNewJoin = Math.random() > 0.4; // 60% 확률로 새 가입, 40% 확률로 기여활동

    if (isNewJoin) {
      // 신규 친구 가입 보상 (+1,000P)
      const bonusAmount = 1000;
      setPoints(p => p + bonusAmount);
      
      const newFeed: ReferralFeedItem = {
        id: `F_FEED_${Date.now()}`,
        friendName: selectedFriend,
        actionType: 'sign_up',
        actionName: '추천 가입 및 첫 인증 웰컴 성공',
        earnedPoints: bonusAmount,
        date: '방금 전'
      };

      setReferralFeed(prev => [newFeed, ...prev]);
      setSuccessMsg(`🎉 [친구 초대] ${selectedFriend}님이 첫 친환경 인증을 완료하여 나에게 +${bonusAmount}P가 즉시 적립되었습니다!`);
    } else {
      // 친구 활동 기여 (텀블러 인증 500P의 8% = 40P 등)
      const friendActivities = [
        { name: '텀블러 친환경 인증 성공', basePoints: 500 },
        { name: '도보여행 걷기 미션 달성', basePoints: 200 },
        { name: '플로깅 환경 정화 성공', basePoints: 800 }
      ];
      const activity = friendActivities[Math.floor(Math.random() * friendActivities.length)];
      
      // 등급에 따른 보너스 비율 계산
      const bonusRate = userGradeInfo.bonus; // 5%, 8%, 10%, 12%, 15%
      const royaltyEarned = Math.round(activity.basePoints * (bonusRate / 100));

      setPoints(p => p + royaltyEarned);

      const newFeed: ReferralFeedItem = {
        id: `F_FEED_${Date.now()}`,
        friendName: selectedFriend,
        actionType: 'activity',
        actionName: `${activity.name} 기여`,
        earnedPoints: royaltyEarned,
        date: '방금 전'
      };

      setReferralFeed(prev => [newFeed, ...prev]);
      setSuccessMsg(`📈 [로열티 보너스] 친구 ${selectedFriend}님의 친환경 활동으로 나에게 로열티 ${bonusRate}% 보너스 (+${royaltyEarned}P)가 적립되었습니다!`);
    }

    setTimeout(() => setSuccessMsg(null), 4500);
  };

  return (
    <div className="animate-pop">
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>에코 머니백 & 샵</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>누적한 에코 포인트를 계좌로 입금받거나 리워드로 교환해 보세요.</p>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>현재 사용 가능 포인트</span>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-neon)', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
            {points.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>P</span>
          </h3>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}>
          <Wallet color="var(--primary-neon)" size={24} />
        </div>
      </div>

      {/* 3가지 서브 탭 탭바 구성 (에코 샵, 현금 머니백, 친구 초대) */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px', marginBottom: '16px', gap: '2px' }}>
        <button
          onClick={() => setSubTab('shop')}
          style={{
            flex: 1,
            padding: '10px 4px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            background: subTab === 'shop' ? 'rgba(16, 185, 129, 0.15)' : 'none',
            color: subTab === 'shop' ? 'var(--primary-neon)' : 'var(--text-muted)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          <Gift size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          에코 샵
        </button>
        <button
          onClick={() => setSubTab('cashback')}
          style={{
            flex: 1,
            padding: '10px 4px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            background: subTab === 'cashback' ? 'rgba(16, 185, 129, 0.15)' : 'none',
            color: subTab === 'cashback' ? 'var(--primary-neon)' : 'var(--text-muted)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          <ArrowRightLeft size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          현금 머니백
        </button>
        {/* [NEW] 친구 초대 독립 탭 단추 */}
        <button
          onClick={() => setSubTab('referral')}
          style={{
            flex: 1,
            padding: '10px 4px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            background: subTab === 'referral' ? 'rgba(16, 185, 129, 0.15)' : 'none',
            color: subTab === 'referral' ? 'var(--primary-neon)' : 'var(--text-muted)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          <Users size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          친구 초대
        </button>
      </div>

      {successMsg && (
        <div 
          style={{ 
            background: 'rgba(16, 185, 129, 0.95)', 
            color: 'white', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginBottom: '16px', 
            fontSize: '11.5px', 
            fontWeight: '600', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            boxShadow: 'var(--shadow-glow)',
            animation: 'success-pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <CheckCircle size={15} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. 에코 샵 서브 탭 화면 */}
      {subTab === 'shop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 에코 샵 카테고리 필터 탭 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', overflowX: 'auto', paddingBottom: '8px' }}>
            {(['all', 'fnb', 'car', 'life'] as const).map(cat => {
              let label = '전체';
              if (cat === 'fnb') label = '☕ 음식/음료';
              if (cat === 'car') label = '🚗 차량 케어';
              if (cat === 'life') label = '🌱 에코 용품';
              return (
                <button
                  key={cat}
                  onClick={() => setShopCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: '1px solid',
                    borderColor: shopCategory === cat ? 'var(--primary-neon)' : 'rgba(255,255,255,0.08)',
                    background: shopCategory === cat ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    color: shopCategory === cat ? 'var(--primary-neon)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {SHOP_ITEMS.filter(item => shopCategory === 'all' || item.category === shopCategory).map(item => {
            // 등급별 할인 가격 동적 계산
            const discount = userGradeInfo.discount;
            const finalCost = discount > 0 ? Math.round(item.cost * (1 - discount / 100)) : item.cost;
            const hasDiscount = discount > 0;

            return (
              <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontSize: '26px', width: '46px', height: '46px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '13.5px', color: 'white', fontWeight: '600' }}>{item.name}</h3>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>{item.description}</p>
                  
                  {/* 할인가 표시 연출 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    {hasDiscount ? (
                      <>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {item.cost.toLocaleString()}P
                        </span>
                        <span style={{ fontSize: '12.5px', color: '#fbbf24', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
                          {finalCost.toLocaleString()} P
                        </span>
                        <span style={{ fontSize: '9px', background: 'rgba(251,191,36,0.12)', color: '#fbbf24', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                          {discount}%할인
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
                        {item.cost.toLocaleString()} P
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '8px 12px', fontSize: '11px', borderRadius: '8px' }}
                  onClick={() => handleBuyShopItem(item)}
                  disabled={points < finalCost}
                >
                  교환
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. 현금 머니백 서브 탭 화면 */}
      {subTab === 'cashback' && (
        <div>
          <div className="card">
            <h3 style={{ fontSize: '15px', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={16} color="var(--primary-neon)" />
              계좌 입금 신청
            </h3>
            <form onSubmit={handleRefundSubmit}>
              <div className="form-group">
                <label className="form-label">환급 은행</label>
                <select 
                  className="form-control" 
                  value={bank} 
                  onChange={(e) => setBank(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.5)', appearance: 'none', color: 'white' }}
                >
                  <option>국민은행</option>
                  <option>신한은행</option>
                  <option>우리은행</option>
                  <option>하나은행</option>
                  <option>카카오뱅크</option>
                  <option>토스뱅크</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">계좌 번호</label>
                <input 
                  type="text" 
                  required
                  placeholder="숫자만 입력하세요" 
                  className="form-control"
                  value={account}
                  onChange={(e) => setAccount(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">예금주명</label>
                <input 
                  type="text" 
                  required
                  placeholder="예금주 성함" 
                  className="form-control"
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">신청 금액 (최소 5,000원)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    required
                    placeholder="신청 금액" 
                    className="form-control"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ paddingRight: '48px' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setAmount(points.toString())}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--primary-neon)', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    최대
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || points < 5000}
                style={{ marginTop: '8px' }}
              >
                {loading ? '신청 처리 중...' : points < 5000 ? '5,000P 이상부터 신청 가능' : '환급 신청하기'}
              </button>
            </form>
          </div>

          <div>
            <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>최근 신청 내역</h3>
            {refundHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
                최근 신청 내역이 없습니다.
              </div>
            ) : (
              refundHistory.map(item => (
                <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '600' }}>{item.bank} 환급</h4>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.account} | {item.date}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>-{item.amount.toLocaleString()}원</p>
                    <span 
                      style={{ 
                        fontSize: '9px', 
                        fontWeight: '600', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        background: item.status === 'processing' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: item.status === 'processing' ? '#f59e0b' : 'var(--primary-neon)',
                        display: 'inline-block',
                        marginTop: '4px'
                      }}
                    >
                      {item.status === 'processing' ? '처리중' : '이체완료'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* [NEW] 3. 친구 추천 (Referral) 서브 탭 화면 */}
      {subTab === 'referral' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* 나의 초대 코드 카드 */}
          <div className="card" style={{ border: '1px solid rgba(6, 182, 212, 0.2)', background: 'rgba(6, 182, 212, 0.02)' }}>
            <h3 style={{ fontSize: '14px', color: 'white', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={14} color="var(--secondary)" />
              나의 고유 초대 코드
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              친구가 이 코드를 쓰고 가입 후 첫 챌린지를 완료하면 둘 다 1,000P를 획득합니다.
            </p>

            <div 
              onClick={handleCopyCode}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '12px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '12px'
              }}
              className="nav-item-hover-effect"
            >
              <span style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--secondary)', letterSpacing: '0.05em' }}>
                {referralCode}
              </span>
              <span style={{ fontSize: '11px', color: copied ? 'var(--primary-neon)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                <Copy size={12} />
                {copied ? '복사됨!' : '코드 복사'}
              </span>
            </div>

            {/* [NEW] 카톡/문자 발송용 공유 액션 버튼 그룹 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleShare('sms')}
                style={{
                  flex: 1,
                  fontSize: '11px',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }}
              >
                💬 문자로 전송
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleShare('native')}
                style={{
                  flex: 1,
                  fontSize: '11px',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <Share2 size={12} />
                친구에게 공유
              </button>
            </div>
          </div>

          {/* 나의 로열티 상태 요약 카드 */}
          <div className="card">
            <h3 style={{ fontSize: '14px', color: 'white', fontWeight: '700', marginBottom: '8px' }}>
              📈 에코 로열티 등급 현황
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '12px' }}>
              내가 초대한 친구들이 대중교통 이용, 걷기 등을 인증할 때마다 친구들이 획득하는 리워드 대비 보너스를 추가로 적립받습니다.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>현재 로열티 보너스율</span>
                <p style={{ fontSize: '18px', fontWeight: '800', color: userGradeInfo.color, fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {userGradeInfo.bonus}% <span style={{ fontSize: '10px', fontWeight: '500', color: 'var(--text-muted)' }}>적립</span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>보너스 혜택 만료 기한</span>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'white', marginTop: '6px' }}>
                  {userGradeInfo.name === '지구 수호자' ? '영구 무제한' : '친구 가입 후 60일간'}
                </p>
              </div>
            </div>
          </div>

          {/* 친구 활동 실시간 기여 피드 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                👥 친구 활동 보너스 피드
              </h3>
              
              {/* 모의 친구 가입 및 챌린지 성공 시뮬레이터 (테스트용) */}
              <button 
                onClick={handleSimulateReferralJoin}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary-neon)',
                  fontSize: '9.5px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <PlusCircle size={10} />
                모의 가입/기여 (테스트)
              </button>
            </div>

            {referralFeed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '11.5px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px' }}>
                가입한 에코 친구가 없습니다. 초대 코드를 복사해서 첫 친구를 초대해 보세요!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {referralFeed.map(feed => (
                  <div 
                    key={feed.id} 
                    className="card" 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 14px', 
                      margin: 0,
                      borderColor: feed.actionType === 'sign_up' ? 'rgba(6, 182, 212, 0.2)' : 'var(--card-border)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>{feed.friendName}</span>
                        <span 
                          style={{ 
                            fontSize: '8px', 
                            background: feed.actionType === 'sign_up' ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.05)', 
                            color: feed.actionType === 'sign_up' ? 'var(--secondary)' : 'var(--text-muted)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}
                        >
                          {feed.actionType === 'sign_up' ? '신규가입' : '기여활동'}
                        </span>
                      </div>
                      <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {feed.actionName}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--primary-neon)', fontFamily: 'var(--font-display)' }}>
                        +{feed.earnedPoints.toLocaleString()}P
                      </span>
                      <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{feed.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 기프티콘 교환 완료 오버레이 */}
      {purchasedItem && (
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
          <div style={{ width: '100%', maxWidth: '320px', background: 'var(--card-bg)', border: '1px solid var(--primary)', borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '48px' }}>🎉</span>
            <h3 style={{ fontSize: '18px', color: 'white', marginTop: '12px' }}>기프티콘 교환 완료</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              교환하신 쿠폰은 보관함에 저장되었습니다. 오프라인 매장에서 바코드를 보여주세요.
            </p>

            <div style={{ background: 'white', padding: '16px', borderRadius: '12px', margin: '20px 0', border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#000', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>{purchasedItem.name}</p>
              <div style={{ height: '50px', background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 8px, #000 8px, #000 12px)', margin: '8px 0' }}></div>
              <p style={{ color: '#64748b', fontSize: '9px', letterSpacing: '0.2em' }}>* 2026-0527-ECOLINE *</p>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => setPurchasedItem(null)}
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
