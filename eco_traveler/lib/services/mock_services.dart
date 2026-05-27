import 'dart:async';
import 'dart:math';

// 관광 스팟 정보 모델
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
}

class MockServices {
  // 1. 오피넷 실시간 평균 유가 모킹 (원/L)
  static Future<double> getAverageFuelPrice() async {
    await Future.delayed(const Duration(milliseconds: 300));
    // 1620원 ~ 1680원 사이 실시간 무작위 유가 반환
    return 1620.0 + Random().nextInt(60);
  }

  // 2. 한국관광공사 TourAPI 데이터 모킹 (축제, 관광지, 무장애 정보 포함)
  static Future<List<TourSpot>> getEcoTourSpots() async {
    await Future.delayed(const Duration(milliseconds: 400));
    return [
      TourSpot(
        name: '단양 온달동굴',
        region: '충청북도 단양군 (인구 감소 우대 지역)',
        description: '고구려 온달 장군과 평강 공주의 설화가 깃든 유서 깊은 천연동굴',
        accessibilityInfo: '♿️ 휠체어 전용 램프 및 점자 블록 완비, 시각장애인 음성 가이드 제공',
        regionWeight: 2.0, // 고 가중치
        festivalName: '단양 온달 문화 축제 (10월 개최)',
        distanceKm: 185.0,
        tollFee: 8500,
        publicTransitFee: 14500, // 기차 요금 기준
      ),
      TourSpot(
        name: '태안 천리포 수목원',
        region: '충청남도 태안군 (인구 감소 우대 지역)',
        description: '세계 푸른 수목원으로 지정된 서해안 최고의 생태 보고',
        accessibilityInfo: '♿️ 무장애 나눔길 설치 (경사도 8% 이하 나무 데크 로드)',
        regionWeight: 1.8,
        festivalName: '태안 백합 & 다알리아 꽃 축제',
        distanceKm: 152.0,
        tollFee: 6200,
        publicTransitFee: 10200, // 고속버스 기준
      ),
      TourSpot(
        name: '정선 아리랑 시장',
        region: '강원도 정선군 (인구 감소 우대 지역)',
        description: '강원의 정취와 정선 아리랑의 선율이 흐르는 전통 생태 시골 장터',
        accessibilityInfo: '♿️ 주출입구 무단차 및 배리어프리 전용 화장실 제공',
        regionWeight: 1.5,
        festivalName: '정선 아리랑제 축제 (9월 개최)',
        distanceKm: 210.0,
        tollFee: 9600,
        publicTransitFee: 16100, // KTX 정선선 기준
      ),
      TourSpot(
        name: '서울 경복궁',
        region: '서울특별시 종로구',
        description: '조선 왕조의 법궁으로서 한국의 역사와 건축미를 대표하는 고궁',
        accessibilityInfo: '♿️ 유모차 및 휠체어 무료 대여, 입구 경사로 구비',
        regionWeight: 1.0, // 기본 가중치
        festivalName: '경복궁 야간 특별 관람 행사',
        distanceKm: 2.5,
        tollFee: 0,
        publicTransitFee: 1400, // 지하철 기본요금
      ),
    ];
  }

  // 3. Gemini API 기반 'AI 에코 버틀러' 모킹
  // 상황 매개변수(유가, 목적지, 혼잡도, 날씨)를 조합하여 개인화된 조언을 생성
  static Future<String> generateButlerRecommendation({
    required double fuelPrice,
    required String destinationName,
    required double regionWeight,
    required double trafficLevel, // 0.0 (원활) ~ 1.0 (극심)
    required String weather,
  }) async {
    await Future.delayed(const Duration(milliseconds: 800));

    String trafficStatus = trafficLevel > 0.7 
        ? '정체가 매우 심각하여 자차 주행 시 매연 배출과 연비 저하가 우려되는 상황'
        : '도로 소통은 원활한 편';

    String weightMessage = regionWeight > 1.0
        ? '특별히 이번 행선지는 인구 감소 지역으로 지정되어 **에코머니 가중치 ${regionWeight}배**가 적격 적용됩니다!'
        : '도심지 탄소배출을 낮추기 위한 친환경 챌린지 대상 구역입니다.';

    return '🤖 **AI 에코 버틀러 비서의 추천**\n\n'
        '안녕하세요! 오늘 여행 목적지는 **[$destinationName]** 이군요. '
        '현재 실시간 전국 평균 유가는 **${fuelPrice.toInt()}원/L**로 다소 높은 부담이 있으며, '
        '목적지까지 경로상 $trafficStatus입니다. '
        '날씨는 현재 **[$weather]**로 야외 활동에 매우 쾌적하네요. ☀️\n\n'
        '💡 **추천 여정 플랜:**\n'
        '자가용 대신 기차를 예매하시어 **초저탄소 보너스(+500P)**를 챙기시고, '
        '현지에서 친환경 걷기 인증을 달성하면 **라스트마일 두루누비 보너스(+1,000P)**까지 추가 적립됩니다. '
        '$weightMessage\n\n'
        '대중교통을 탑승하시고 이동하시는 동안 가벼운 소설이나 음악을 들으며 여행의 시작을 더욱 편안하게 누려보세요! 🎧';
  }
}
