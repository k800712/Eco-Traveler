import 'package:flutter/material.dart';
import '../models/eco_calculator.dart';
import '../services/web_communication.dart';
import '../services/supabase_service.dart';

class RefundRecord {
  final String id;
  final String bank;
  final String account;
  final String holder;
  final int amount;
  final String date;
  String status;

  RefundRecord({
    required this.id,
    required this.bank,
    required this.account,
    required this.holder,
    required this.amount,
    required this.date,
    this.status = '처리중',
  });
}

class AppState extends ChangeNotifier {
  // 전역 상태 변수
  int _points = 8500;
  int _steps = 2400;
  double _co2Saved = 4.82;
  UserGrade _userGrade = UserGrade.beginner;
  double _carEfficiency = 12.0; // km/L (유저 입력 연비)
  List<int> _completedChallenges = [];

  // API 로딩 상태 제어 변수
  bool _isTourApiLoading = false;
  String? _tourApiError;
  bool get isTourApiLoading => _isTourApiLoading;
  String? get tourApiError => _tourApiError;

  // 로그인 회원 상태 변수 (Bypass 대응)
  bool _isLoggedIn = false;
  String _userUid = '';
  String _userName = '';
  bool get isLoggedIn => _isLoggedIn;
  String get userUid => _userUid;
  String get userName => _userName;

  // Supabase 주변 제휴 파트너 상태 변수
  List<Map<String, dynamic>> _nearbyPartners = [];
  List<Map<String, dynamic>> get nearbyPartners => _nearbyPartners;
  
  final List<RefundRecord> _refundHistory = [
    RefundRecord(
      id: 'TX8982',
      bank: '신한은행',
      account: '110-***-8982',
      holder: '홍길동',
      amount: 5000,
      date: '5월 24일',
      status: '이체완료',
    )
  ];

  double? _mockLatitude;
  double? _mockLongitude;

  // Getter들
  int get points => _points;
  int get steps => _steps;
  double get co2Saved => _co2Saved;
  UserGrade get userGrade => _userGrade;
  double get carEfficiency => _carEfficiency;
  List<RefundRecord> get refundHistory => _refundHistory;
  List<int> get completedChallenges => _completedChallenges;
  double? get mockLatitude => _mockLatitude;
  double? get mockLongitude => _mockLongitude;

  void setTourApiLoading(bool loading) {
    _isTourApiLoading = loading;
    notifyListeners();
  }

  void setTourApiError(String? error) {
    _tourApiError = error;
    notifyListeners();
  }

  // Supabase 실시간 제휴사 로드
  Future<void> loadNearbyPartners(double lat, double lng) async {
    try {
      final partners = await SupabaseService().fetchNearbyPartners(lat, lng);
      _nearbyPartners = partners;
      notifyListeners();
    } catch (e) {
      debugPrint('AppState_Error: Failed to load nearby partners ($e)');
    }
  }

  // Supabase 실서버 로그인 및 프로필 로드
  Future<void> loginWithSupabase(String uid, {String? email, String? displayName}) async {
    try {
      // 1. 프로필 정보 패치 시도
      Map<String, dynamic>? profile = await SupabaseService().getProfile(uid);
      
      // 2. 만약 프로필이 존재하지 않는 신규 유저라면 기본값으로 생성
      if (profile == null) {
        await SupabaseService().upsertProfile(
          uid: uid,
          email: email ?? 'grader@eco.traveler',
          displayName: displayName ?? '심사위원(실서버)',
          carModel: 'Eco EV',
          fuelEfficiency: 15.0,
          totalPoints: _points,
          totalCo2Saved: _co2Saved,
        );
        profile = await SupabaseService().getProfile(uid);
      }

      if (profile != null) {
        _isLoggedIn = true;
        _userUid = uid;
        _userName = profile['display_name'] ?? '사용자';
        _points = profile['total_points'] ?? 0;
        _co2Saved = double.tryParse(profile['total_co2_saved']?.toString() ?? '') ?? 0.0;
        _carEfficiency = double.tryParse(profile['fuel_efficiency']?.toString() ?? '') ?? 12.0;
        
        // 등급 업데이트 (포인트 기반)
        if (_points >= 30000) {
          _userGrade = UserGrade.master;
        } else if (_points >= 15000) {
          _userGrade = UserGrade.pro;
        } else {
          _userGrade = UserGrade.beginner;
        }

        notifyListeners();
        
        // 부모 창(React)으로 로그인 동기화 알림 발송
        _syncStateToWeb();
      }
    } catch (e) {
      debugPrint('AppState_Error: loginWithSupabase failed ($e)');
    }
  }

  // 공통 React 상태 동기화 알림
  void _syncStateToWeb() {
    WebCommunication.send('SYNC_STATE', {
      'points': _points,
      'steps': _steps,
      'co2Saved': _co2Saved,
      'completedChallenges': _completedChallenges,
      'refundHistory': _refundHistory.map((r) => {
        'id': r.id,
        'bank': r.bank,
        'account': r.account,
        'holder': r.holder,
        'amount': r.amount,
        'date': r.date,
        'status': r.status == '이체완료' ? 'completed' : 'processing'
      }).toList(),
      'mockLatitude': _mockLatitude,
      'mockLongitude': _mockLongitude,
      'isLoggedIn': true,
      'userUid': _userUid,
      'userName': _userName,
    });
  }

  // 심사위원용 원클릭 Bypass 로그인
  Future<void> bypassLogin() async {
    // UUID 형식 규격을 충족하는 가상 테스트 계정 ID 설정
    const String demoUid = 'd4090000-0000-0000-0000-0000000000d0';
    _points = 50000;
    _co2Saved = 4.82;
    _userGrade = UserGrade.master; // 에코 마스터

    // Supabase 서버에 프로필 강제 설정/Upsert
    try {
      await SupabaseService().upsertProfile(
        uid: demoUid,
        email: 'grader@eco.traveler',
        displayName: '심사위원(실서버)',
        carModel: 'Eco EV',
        fuelEfficiency: 15.0,
        totalPoints: _points,
        totalCo2Saved: _co2Saved,
      );
    } catch (e) {
      debugPrint('AppState_Warning: Could not upsert bypass profile on Supabase: $e');
    }

    // Supabase 데이터 패치 및 상태 반영
    await loginWithSupabase(demoUid);
  }

  void logout() {
    _isLoggedIn = false;
    _userUid = '';
    _userName = '';
    notifyListeners();

    WebCommunication.send('LOGOUT', {});
  }

  // 포인트 증가
  Future<void> addPoints(int earned, double co2Val) async {
    _points += earned;
    _co2Saved += co2Val;
    notifyListeners();

    // 부모 창(React)으로 이벤트 전송
    WebCommunication.send('ADD_POINTS', {
      'earned': earned,
      'co2Val': co2Val,
    });

    // Supabase 프로필 실시간 동기화
    if (_isLoggedIn && _userUid.isNotEmpty) {
      try {
        await SupabaseService().upsertProfile(
          uid: _userUid,
          email: _userUid == 'd4090000-0000-0000-0000-0000000000d0' ? 'grader@eco.traveler' : 'user@eco.traveler',
          displayName: _userName,
          carModel: 'Eco EV',
          fuelEfficiency: _carEfficiency,
          totalPoints: _points,
          totalCo2Saved: _co2Saved,
        );
      } catch (e) {
        debugPrint('AppState_Warning: Could not sync points to Supabase ($e)');
      }
    }
  }

  // 걸음 수 시뮬레이터 연동
  Future<void> addSteps(int added) async {
    _steps += added;
    // 20걸음당 0.0026kg 이산화탄소 절감 모의 산출 (일반 차량 대비)
    final double co2Val = added * 0.00013;
    _co2Saved += co2Val;
    
    // 100걸음당 5포인트 적립
    int earnedPoints = 0;
    if (_steps % 100 == 0) {
      earnedPoints = 5;
      _points += earnedPoints;
    }
    notifyListeners();

    // 부모 창(React)으로 이벤트 전송
    WebCommunication.send('ADD_STEPS', {
      'added': added,
      'earned': earnedPoints,
      'co2Val': co2Val,
    });

    // Supabase 프로필 실시간 동기화 (포인트나 탄소량이 변했을 때)
    if (_isLoggedIn && _userUid.isNotEmpty) {
      try {
        await SupabaseService().upsertProfile(
          uid: _userUid,
          email: _userUid == 'd4090000-0000-0000-0000-0000000000d0' ? 'grader@eco.traveler' : 'user@eco.traveler',
          displayName: _userName,
          carModel: 'Eco EV',
          fuelEfficiency: _carEfficiency,
          totalPoints: _points,
          totalCo2Saved: _co2Saved,
        );
      } catch (e) {
        debugPrint('AppState_Warning: Could not sync steps to Supabase ($e)');
      }
    }
  }

  // 부모 창(React)으로부터 전송받은 데이터 동기화
  void syncState(
    int points, 
    int steps, 
    double co2Saved, 
    List<int> completedChallenges, 
    List<RefundRecord> refundHistory, {
    double? mockLatitude, 
    double? mockLongitude,
  }) {
    _points = points;
    _steps = steps;
    _co2Saved = co2Saved;
    _completedChallenges = completedChallenges;
    _refundHistory.clear();
    _refundHistory.addAll(refundHistory);
    _mockLatitude = mockLatitude;
    _mockLongitude = mockLongitude;
    notifyListeners();
  }

  // 연비 업데이트
  void updateCarEfficiency(double value) {
    _carEfficiency = value;
    notifyListeners();
  }

  // 관리자 모드 가중치/유가 갱신 알림 트리거
  void triggerAdminSettingsUpdated() {
    notifyListeners();
  }

  // 유저 등급 업그레이드 시뮬레이션
  void upgradeGrade(UserGrade newGrade) {
    _userGrade = newGrade;
    notifyListeners();
  }

  // 계좌 환급 신청
  bool requestRefund({
    required int amount,
    required String bank,
    required String account,
    required String holder,
  }) {
    if (amount > _points || amount < 5000) return false;
    
    _points -= amount;
    
    final newRecord = RefundRecord(
      id: 'TX${(1000 + _refundHistory.length * 7).toString()}',
      bank: bank,
      account: account.length > 8 
          ? '${account.substring(0, 3)}-***-${account.substring(account.length - 4)}'
          : account,
      holder: holder,
      amount: amount,
      date: '오늘',
    );
    
    _refundHistory.insert(0, newRecord);
    notifyListeners();
    
    // 부모 창(React)으로 이벤트 전송
    WebCommunication.send('REFUND_REQUESTED', {
      'refundItem': {
        'id': newRecord.id,
        'bank': newRecord.bank,
        'account': newRecord.account,
        'holder': newRecord.holder,
        'amount': newRecord.amount,
        'date': newRecord.date,
        'status': 'processing'
      }
    });
    
    // 가상으로 3초 후 완료 상태로 전환하는 비동기 연출
    Future.delayed(const Duration(seconds: 4), () {
      newRecord.status = '이체완료';
      notifyListeners();

      // 부모 창(React)으로 이체완료 상태 업데이트 전송
      WebCommunication.send('REFUND_STATUS_UPDATED', {
        'id': newRecord.id,
        'status': 'completed'
      });
    });

    return true;
  }
}
