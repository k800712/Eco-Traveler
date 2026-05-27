enum UserGrade { beginner, pro, master }

class EcoCalculator {
  // 1. 자차 이동 실질 비용 산출 (C_car)
  // C_car = (D * P_fuel / F) + T + (D * M)
  static double calculateCarCost({
    required double distance,        // D: 총 이동 거리 (km)
    required double fuelPrice,       // P_fuel: 실시간 평균 유가 (원/L)
    required double fuelEfficiency,  // F: 사용자 차량 연비 (km/L)
    required double tollFee,         // T: 통행료 (원)
    double maintenanceCost = 120.0,  // M: 차량 정비 감가상각 지수 (원/km)
  }) {
    if (fuelEfficiency <= 0) return 0;
    
    double fuelCost = (distance * fuelPrice) / fuelEfficiency;
    double wearCost = distance * maintenanceCost;
    
    return fuelCost + tollFee + wearCost;
  }

  // 유저 등급별 적립률 (R)
  static double getGradeRatio(UserGrade grade) {
    switch (grade) {
      case UserGrade.beginner:
        return 0.05; // 5%
      case UserGrade.pro:
        return 0.10; // 10%
      case UserGrade.master:
        return 0.15; // 15%
    }
  }

  // 2. 최종 지급 포인트 산출 (P_reward)
  // P_reward = (C_car - C_public) * R * L
  static int calculateRewardPoints({
    required double carCost,             // C_car: 자차 이동 비용
    required double publicTransitFee,    // C_public: 대중교통 요금
    required UserGrade grade,            // R에 대응하는 등급
    double regionWeight = 1.0,           // L: 인구 감소 지역 가중치 (1.5 ~ 2.0)
  }) {
    double savings = carCost - publicTransitFee;
    if (savings <= 0) return 0; // 절감액이 없거나 마이너스면 리워드 없음

    double baseRatio = getGradeRatio(grade);
    double calculatedPoints = savings * baseRatio * regionWeight;
    
    return calculatedPoints.round(); // 정수로 반올림하여 포인트 지급
  }

  // 3. 스페셜 보너스 포인트 산출
  static int calculateBonusPoints({
    bool isTrainOrSharedBike = false,  // 기차/공유자전거 보너스 (+500P)
    bool isOffPeakTime = false,        // 오프피크 시간대 방문 (+500P)
    bool isDuroNubiCompleted = false,  // 두루누비 걷기 미션 완료 (+1000P)
  }) {
    int bonus = 0;
    if (isTrainOrSharedBike) bonus += 500;
    if (isOffPeakTime) bonus += 500;
    if (isDuroNubiCompleted) bonus += 1000;
    return bonus;
  }
}
