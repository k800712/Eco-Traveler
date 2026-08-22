class TourSpot {
  final String name;
  final String region;
  final String description;
  final String accessibilityInfo; // 무장애 정보
  final double regionWeight;      // L: 지역 가중치 (인구 감소 지역 등)
  final String festivalName;      // 축제 정보
  final double distanceKm;        // 서울 시청 기준 가상 거리
  final int tollFee;              // 가상 톨게이트 비
  final int publicTransitFee;     // 가상 대중교통 요금

  TourSpot({
    required this.name,
    required this.region,
    required this.description,
    required this.accessibilityInfo,
    required this.regionWeight,
    required this.festivalName,
    required this.distanceKm,
    required this.tollFee,
    required this.publicTransitFee,
  });

  // JSON 데이터로부터 역직렬화하는 팩토리 생성자 추가 (TourAPI 파싱 대응)
  factory TourSpot.fromJson(Map<String, dynamic> json, {
    required double distance,
    required String accessibility,
    required String festival,
    required double weight,
  }) {
    final double dist = distance;
    final int toll = dist > 10.0 ? (dist * 48).round() : 0;
    final int transit = (dist * 85 + 1400).round();

    return TourSpot(
      name: json['title'] ?? '에코 관광지',
      region: json['addr1'] ?? '대한민국 관광지',
      description: '실시간 API 연동 에코 코스. 친환경 여정 전환으로 탄소 배출 저감에 동참해 주세요.',
      accessibilityInfo: accessibility,
      regionWeight: weight,
      festivalName: festival,
      distanceKm: double.parse(dist.toStringAsFixed(1)),
      tollFee: (toll / 100).round() * 100,
      publicTransitFee: (transit / 100).round() * 100,
    );
  }
}
