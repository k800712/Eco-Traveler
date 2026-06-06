import 'package:flutter/material.dart';
import '../models/eco_calculator.dart';
import '../services/web_communication.dart';

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

  // Getter들
  int get points => _points;
  int get steps => _steps;
  double get co2Saved => _co2Saved;
  UserGrade get userGrade => _userGrade;
  double get carEfficiency => _carEfficiency;
  List<RefundRecord> get refundHistory => _refundHistory;
  List<int> get completedChallenges => _completedChallenges;

  // 포인트 증가
  void addPoints(int earned, double co2Val) {
    _points += earned;
    _co2Saved += co2Val;
    notifyListeners();

    // 부모 창(React)으로 이벤트 전송
    WebCommunication.send('ADD_POINTS', {
      'earned': earned,
      'co2Val': co2Val,
    });
  }

  // 걸음 수 시뮬레이터 연동
  void addSteps(int added) {
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
  }

  // 부모 창(React)으로부터 전송받은 데이터 동기화
  void syncState(int points, int steps, double co2Saved, List<int> completedChallenges, List<RefundRecord> refundHistory) {
    _points = points;
    _steps = steps;
    _co2Saved = co2Saved;
    _completedChallenges = completedChallenges;
    _refundHistory.clear();
    _refundHistory.addAll(refundHistory);
    notifyListeners();
  }

  // 연비 업데이트
  void updateCarEfficiency(double value) {
    _carEfficiency = value;
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
