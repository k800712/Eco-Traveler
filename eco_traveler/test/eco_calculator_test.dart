import 'package:test/test.dart';
import '../lib/models/eco_calculator.dart';

void main() {
  group('에코 머니-백 산출 공식 단위 테스트', () {
    
    test('1) 자차 이동 실질 비용(C_car) 산출 정확도 검증', () {
      double distance = 100.0;
      double fuelPrice = 1650.0;
      double fuelEfficiency = 10.0;
      double tollFee = 5000.0;
      double maintenanceCost = 120.0;

      double cCar = EcoCalculator.calculateCarCost(
        distance: distance,
        fuelPrice: fuelPrice,
        fuelEfficiency: fuelEfficiency,
        tollFee: tollFee,
        maintenanceCost: maintenanceCost,
      );

      // (100 * 1650 / 10) + 5000 + (100 * 120) = 16500 + 5000 + 12000 = 33500
      expect(cCar, equals(33500.0));
    });

    test('2) 유저 등급 및 지역 가중치에 따른 리워드 포인트(P_reward) 산출 정확도 검증', () {
      double carCost = 33500.0;
      double publicTransitFee = 12000.0;
      UserGrade grade = UserGrade.pro; // R = 0.10
      double regionWeight = 1.8;

      int pReward = EcoCalculator.calculateRewardPoints(
        carCost: carCost,
        publicTransitFee: publicTransitFee,
        grade: grade,
        regionWeight: regionWeight,
      );

      // Savings = 33500 - 12000 = 21500
      // Points = 21500 * 0.10 * 1.8 = 3870
      expect(pReward, equals(3870));
    });

    test('3) 게이미피케이션 보너스 합산 검증', () {
      bool train = true;
      bool offPeak = true;
      bool duroNubi = false;

      int bonus = EcoCalculator.calculateBonusPoints(
        isTrainOrSharedBike: train,
        isOffPeakTime: offPeak,
        isDuroNubiCompleted: duroNubi,
      );

      expect(bonus, equals(1000));
    });
  });
}
