import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

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

// GPS 기반 지역 코드 매핑 정보 클래스
class RegionMapping {
  final String name;
  final int areaCode;
  final int sigunguCode;
  final double latitude;
  final double longitude;
  final double weight;

  RegionMapping({
    required this.name,
    required this.areaCode,
    required this.sigunguCode,
    required this.latitude,
    required this.longitude,
    required this.weight,
  });
}

class MockServices {
  // ① 대상 리워드 우대 지역 및 매핑 테이블 정의
  static final List<RegionMapping> _regions = [
    RegionMapping(name: '단양', areaCode: 33, sigunguCode: 3, latitude: 36.9845, longitude: 128.3650, weight: 2.0),
    RegionMapping(name: '태안', areaCode: 34, sigunguCode: 14, latitude: 36.7456, longitude: 126.2980, weight: 1.8),
    RegionMapping(name: '정선', areaCode: 32, sigunguCode: 11, latitude: 37.3800, longitude: 128.6600, weight: 1.5),
    RegionMapping(name: '서울', areaCode: 1, sigunguCode: 0, latitude: 37.5665, longitude: 126.9780, weight: 1.0),
  ];

  // 하버사인(Haversine) 직선거리 계산 공식
  static double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295; // pi / 180
    final a = 0.5 - cos((lat2 - lat1) * p) / 2 +
        cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
    return 12742 * asin(sqrt(a)); // 지구 지름 12742km 기반 반환
  }

  // 1. 오피넷 실시간 평균 유가 모킹 (원/L)
  static Future<double> getAverageFuelPrice() async {
    await Future.delayed(const Duration(milliseconds: 300));
    // 1620원 ~ 1680원 사이 실시간 무작위 유가 반환
    return 1620.0 + Random().nextInt(60);
  }

  // 2. 한국관광공사 TourAPI 실제 REST API 연동 및 하이브리드 Fallback 구현
  static Future<List<TourSpot>> getEcoTourSpots({
    double? latitude,
    double? longitude,
    String? bjdCode,
  }) async {
    // 디폴트 GPS 좌표: 서울 시청 기준
    final double currentLat = latitude ?? 37.5665;
    final double currentLng = longitude ?? 126.9780;

    // 공공데이터포털 API 인증키 획득
    final String? apiKey = dotenv.env['TOUR_API_KEY'];

    // API 키가 비어있거나 모의 데이터 지시 상태이면 즉시 Fallback 동작 수행
    if (apiKey == null || apiKey.isEmpty || apiKey.startsWith('MOCK_')) {
      debugPrint('TourAPI_Warning: Valid API Key not found. Falling back to Mock local database.');
      return _getMockFallbackSpots();
    }

    try {
      // 1) GPS 좌표와 가장 근접한 활성화 대상 지역(단양, 태안, 정선, 서울) 판별
      RegionMapping nearestRegion = _regions.first;
      double minDistance = double.maxFinite;

      for (var region in _regions) {
        double dist = _calculateDistance(currentLat, currentLng, region.latitude, region.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearestRegion = region;
        }
      }

      // 2) KTO 국문 관광정보 서비스(KorService1) areaBasedList1 API 호출 구성 (인코딩된 오리지널 키 강제 송출용 Uri 생성자 활용)
      final Uri requestUri = Uri(
        scheme: 'https',
        host: 'apis.data.go.kr',
        path: '/B551011/KorService1/areaBasedList1',
        query: 'serviceKey=$apiKey'
            '&MobileOS=ETC'
            '&MobileApp=EcoTraveler'
            '&_type=json'
            '&areaCode=${nearestRegion.areaCode}'
            '&contentTypeId=12'
            '&numOfRows=5'
            '&pageNo=1'
            '&listYN=Y'
            '&arrange=O'
            '${nearestRegion.sigunguCode > 0 ? "&sigunguCode=${nearestRegion.sigunguCode}" : ""}',
      );
      debugPrint('TourAPI_Request: Sending GET to ${requestUri.toString().substring(0, min(80, requestUri.toString().length))}...');

      final http.Response response = await http.get(requestUri).timeout(const Duration(seconds: 5));

      if (response.statusCode != 200) {
        debugPrint('TourAPI_ErrorBody: ${utf8.decode(response.bodyBytes)}');
        throw Exception('API Server responded with status code: ${response.statusCode}');
      }

      final dynamic decodedJson = json.decode(utf8.decode(response.bodyBytes));
      final dynamic body = decodedJson['response']?['body'];
      if (body == null || body['items'] == null || body['items'] == '') {
        throw Exception('No tourist items found in response for areaCode ${nearestRegion.areaCode}');
      }

      final List<dynamic> itemList = body['items']['item'] is List 
          ? body['items']['item'] 
          : [body['items']['item']];

      final List<TourSpot> spots = [];

      // 3) 각 관광지 상세 및 무장애 편의 정보 연합 조회 (detailWithTour1)
      for (var item in itemList) {
        final String contentId = item['contentid']?.toString() ?? '';
        final String title = item['title']?.toString() ?? '에코 여행지';
        final String addr = item['addr1']?.toString() ?? nearestRegion.name;
        final double spotLng = double.tryParse(item['mapx']?.toString() ?? '') ?? nearestRegion.longitude;
        final double spotLat = double.tryParse(item['mapy']?.toString() ?? '') ?? nearestRegion.latitude;

        // 서울 시청 기준 실제 거리 연산 (Haversine 공식)
        final double distance = _calculateDistance(37.5665, 126.9780, spotLat, spotLng);
        // 이동거리에 비례한 톨비 및 대중교통 요금 정밀 산정 (보간식)
        final int tollFee = distance > 10.0 ? (distance * 48).round() : 0;
        final int publicTransitFee = (distance * 85 + 1400).round();

        // 무장애 정보 수집을 위한 API 호출 (인코딩된 오리지널 키 강제 송출용 Uri 생성자 활용)
        String accessibilityInfo = '♿️ 기본 휠체어 접근성 구비';
        try {
          final Uri bfUri = Uri(
            scheme: 'https',
            host: 'apis.data.go.kr',
            path: '/B551011/KorWithBarrierFreeService1/detailWithTour1',
            query: 'serviceKey=$apiKey'
                '&MobileOS=ETC'
                '&MobileApp=EcoTraveler'
                '&_type=json'
                '&contentId=$contentId',
          );

          final http.Response bfResponse = await http.get(bfUri).timeout(const Duration(seconds: 3));
          if (bfResponse.statusCode == 200) {
            final dynamic bfDecoded = json.decode(utf8.decode(bfResponse.bodyBytes));
            final dynamic bfBody = bfDecoded['response']?['body']?['items']?['item'];
            if (bfBody != null) {
              final Map<String, dynamic> bfData = bfBody is List ? bfBody.first : bfBody;
              
              // 무장애 편의시설 항목 추출 및 병합
              final List<String> bfFacil = [];
              if (bfData['parking'] != null && bfData['parking'].toString().trim().isNotEmpty) {
                bfFacil.add('주차: ' + bfData['parking'].toString().trim());
              }
              if (bfData['wheelchair'] != null && bfData['wheelchair'].toString().trim().isNotEmpty) {
                bfFacil.add('대여: ' + bfData['wheelchair'].toString().trim());
              }
              if (bfData['route'] != null && bfData['route'].toString().trim().isNotEmpty) {
                bfFacil.add('경사로: ' + bfData['route'].toString().trim());
              }
              
              if (bfFacil.isNotEmpty) {
                accessibilityInfo = '♿️ ' + bfFacil.take(2).join(' | ');
              }
            }
          }
        } catch (bfError) {
          debugPrint('TourAPI_BF_Warning: Could not fetch Barrier-free info for $contentId: $bfError');
        }

        // 임의 축제 정보 연계
        String festivalName = '${nearestRegion.name} 생태 숲길 챌린지';
        if (nearestRegion.name == '단양') festivalName = '단양 온달 문화 축제';
        if (nearestRegion.name == '태안') festivalName = '태안 모래조각 축제';
        if (nearestRegion.name == '정선') festivalName = '정선 인형극 축제';

        spots.add(
          TourSpot(
            name: title,
            region: addr,
            description: '한국관광공사 실시간 연동 생태 에코 코스. 친환경 여정 전환으로 탄소 배출 저감에 동참해 주세요.',
            accessibilityInfo: accessibilityInfo,
            regionWeight: nearestRegion.weight,
            festivalName: festivalName,
            distanceKm: double.parse(distance.toStringAsFixed(1)),
            tollFee: (tollFee / 100).round() * 100, // 100원 단위 절사
            publicTransitFee: (publicTransitFee / 100).round() * 100,
          ),
        );
      }

      return spots;
    } catch (e) {
      debugPrint('TourAPI_Error: Actual REST API failed ($e). Resorting to local Mock Fallback.');
      return _getMockFallbackSpots();
    }
  }

  // API 장애 및 키 누락 시 안전을 위한 Fallback 모의 데이터 데이터베이스
  static List<TourSpot> _getMockFallbackSpots() {
    return [
      TourSpot(
        name: '단양 온달동굴',
        region: '충청북도 단양군 (인구 감소 우대 지역)',
        description: '고구려 온달 장군과 평강 공주의 설화가 깃든 유서 깊은 천연동굴',
        accessibilityInfo: '♿️ 휠체어 전용 램프 및 점자 블록 완비, 시각장애인 음성 가이드 제공',
        regionWeight: 2.0,
        festivalName: '단양 온달 문화 축제 (10월 개최)',
        distanceKm: 185.0,
        tollFee: 8500,
        publicTransitFee: 14500,
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
        publicTransitFee: 10200,
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
        publicTransitFee: 16100,
      ),
      TourSpot(
        name: '서울 경복궁',
        region: '서울특별시 종로구',
        description: '조선 왕조의 법궁으로서 한국의 역사와 건축미를 대표하는 고궁',
        accessibilityInfo: '♿️ 유모차 및 휠체어 무료 대여, 입구 경사로 구비',
        regionWeight: 1.0,
        festivalName: '경복궁 야간 특별 관람 행사',
        distanceKm: 2.5,
        tollFee: 0,
        publicTransitFee: 1400,
      ),
    ];
  }

  // 3. Gemini API 기반 'AI 에코 버틀러' 모킹
  static Future<String> generateButlerRecommendation({
    required double fuelPrice,
    required String destinationName,
    required double regionWeight,
    required double trafficLevel,
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
