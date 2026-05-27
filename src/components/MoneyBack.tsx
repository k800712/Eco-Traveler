import React, { useState } from 'react';
import { Wallet, Gift, ArrowRightLeft, CheckCircle, CreditCard } from 'lucide-react';

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
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 1,
    name: '지역사랑상품권 5,000원권',
    cost: 5000,
    description: '지역 제로웨이스트 샵 및 제휴 가맹점에서 현금처럼 사용 가능',
    icon: '🎫'
  },
  {
    id: 2,
    name: '스타벅스 에코 텀블러 쿠폰',
    cost: 12000,
    description: '전국 스타벅스 매장에서 에코 텀블러 구입 시 적용 가능한 1.2만원 할인권',
    icon: '🥤'
  },
  {
    id: 3,
    name: '제로웨이스트 친환경 욕실 세트',
    cost: 8000,
    description: '대나무 칫솔, 고체 샴푸바, 삼베 수건이 포함된 여행용 에코 세트',
    icon: '🧼'
  }
];

export const MoneyBack: React.FC<MoneyBackProps> = ({
  points,
  setPoints,
  refundHistory,
  setRefundHistory
}) => {
  const [subTab, setSubTab] = useState<'cashback' | 'shop'>('cashback');
  
  const [bank, setBank] = useState('국민은행');
  const [account, setAccount] = useState('');
  const [holder, setHolder] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [purchasedItem, setPurchasedItem] = useState<ShopItem | null>(null);

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
    if (points < item.cost) {
      alert('포인트가 부족합니다.');
      return;
    }

    if (confirm(`"${item.name}" 상품을 ${item.cost.toLocaleString()}P에 교환하시겠습니까?`)) {
      setPoints(p => p - item.cost);
      setPurchasedItem(item);
    }
  };

  return (
    <div className="animate-pop">
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>에코 머니백 & 샵</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>누적한 에코 포인트를 계좌로 입금받거나 리워드로 교환해 보세요.</p>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>현재 출금 가능 포인트</span>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-neon)', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
            {points.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>P</span>
          </h3>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}>
          <Wallet color="var(--primary-neon)" size={24} />
        </div>
      </div>

      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
        <button
          onClick={() => setSubTab('cashback')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            background: subTab === 'cashback' ? 'rgba(16, 185, 129, 0.15)' : 'none',
            color: subTab === 'cashback' ? 'var(--primary-neon)' : 'var(--text-muted)',
            transition: 'all 0.2s'
          }}
        >
          <ArrowRightLeft size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          현금 머니백
        </button>
        <button
          onClick={() => setSubTab('shop')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            background: subTab === 'shop' ? 'rgba(16, 185, 129, 0.15)' : 'none',
            color: subTab === 'shop' ? 'var(--primary-neon)' : 'var(--text-muted)',
            transition: 'all 0.2s'
          }}
        >
          <Gift size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          에코 샵
        </button>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.95)', color: 'white', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

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

      {subTab === 'shop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {SHOP_ITEMS.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '28px', width: '48px', height: '48px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '14px', color: 'white', fontWeight: '600' }}>{item.name}</h3>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.4' }}>{item.description}</p>
                <p style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700', marginTop: '6px', fontFamily: 'var(--font-display)' }}>
                  {item.cost.toLocaleString()} P
                </p>
              </div>
              <button 
                className="btn btn-primary"
                style={{ width: 'auto', padding: '8px 12px', fontSize: '11px', borderRadius: '8px' }}
                onClick={() => handleBuyShopItem(item)}
                disabled={points < item.cost}
              >
                교환
              </button>
            </div>
          ))}
        </div>
      )}

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
