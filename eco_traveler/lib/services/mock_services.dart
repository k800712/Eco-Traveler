import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../models/tour_spot.dart';

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
  // TourAPI 실시간 연결 성공 여부 플래그
  static bool isTourApiRealConnected = false;

  // 관리자 설정 제어 변수
  static double? adminFuelPrice;
  static final Map<String, double> adminRegionWeights = {};

  // ① 대상 리워드 우대 지역 및 매핑 테이블 정의
  static final List<RegionMapping> _regions = [
    RegionMapping(name: '단양', areaCode: 33, sigunguCode: 3, latitude: 36.9845, longitude: 128.3650, weight: 2.0),
    RegionMapping(name: '태안', areaCode: 34, sigunguCode: 14, latitude: 36.7456, longitude: 126.2980, weight: 1.8),
    RegionMapping(name: '정선', areaCode: 32, sigunguCode: 11, latitude: 37.3800, longitude: 128.6600, weight: 1.5),
    RegionMapping(name: '고양(일산)', areaCode: 31, sigunguCode: 2, latitude: 37.6584, longitude: 126.8320, weight: 1.5),
    RegionMapping(name: '서울', areaCode: 1, sigunguCode: 0, latitude: 37.5665, longitude: 126.9780, weight: 1.0),
  ];

  // 하버사인(Haversine) 직선거리 계산 공식
  static double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295; // pi / 180
    final a = 0.5 - cos((lat2 - lat1) * p) / 2 +
        cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
    return 12742 * asin(sqrt(a)); // 지구 지름 12742km 기반 반환
  }

  // 1. 오피넷 실시간 평균 유가 실제 연동 및 하이브리드 Fallback 구현 (원/L)
  static Future<double> getAverageFuelPrice() async {
    // 관리자 오버라이드 유가가 설정되어 있으면 최우선 적용
    if (adminFuelPrice != null) {
      debugPrint('Admin_Override: Using admin configured fuel price: $adminFuelPrice');
      return adminFuelPrice!;
    }

    final String? apiKey = dotenv.env['OPINET_API_KEY'];
    final double defaultPrice = double.tryParse(dotenv.env['BASE_FUEL_PRICE'] ?? '1650.0') ?? 1650.0;

    // API Key가 없거나 모킹 지시 상태이면 즉시 Fallback 작동
    if (apiKey == null || apiKey.isEmpty || apiKey.startsWith('MOCK_')) {
      debugPrint('OpinetAPI_Warning: Valid API Key not found. Using default fuel price.');
      return defaultPrice + Random().nextInt(30) - 15; // 기본값 인근 변동
    }

    try {
      final Uri requestUri = Uri.parse('http://www.opinet.co.kr/api/avgAllPrice.do?out=json&code=$apiKey');
      final http.Response response = await http.get(requestUri).timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final Map<String, dynamic> decoded = json.decode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
        final dynamic result = decoded['RESULT'];
        if (result != null && result['OIL'] is List) {
          final List<dynamic> oilList = result['OIL'];
          
          // 휘발유(B027) 제품 코드 필터링 및 가격 파싱
          for (var oil in oilList) {
            if (oil['PRODCD'] == 'B027') {
              final double? price = double.tryParse(oil['PRICE']?.toString() ?? '');
              if (price != null && price > 0) {
                debugPrint('OpinetAPI_Success: Fetched real gasoline price: $price');
                return price;
              }
            }
          }
        }
      }
      throw Exception('Invalid status code or JSON response format');
    } catch (e) {
      debugPrint('OpinetAPI_Error: Real API invocation failed ($e). Falling back to default price.');
      // 통신 실패 시 기본 유가(BASE_FUEL_PRICE)에 약간의 무작위성을 부여해 반환
      return defaultPrice + Random().nextInt(30) - 15;
    }
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
      isTourApiRealConnected = false;
      return getMockFallbackSpots();
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

      // 2) 이중 인코딩 방지를 위해 Uri.parse 방식으로 안전하게 raw URL 문자열 구성
      final String urlStr = 'https://apis.data.go.kr/B551011/KorService1/areaBasedList1'
          '?serviceKey=$apiKey'
          '&MobileOS=ETC'
          '&MobileApp=EcoTraveler'
          '&_type=json'
          '&areaCode=${nearestRegion.areaCode}'
          '&contentTypeId=12'
          '&numOfRows=5'
          '&pageNo=1'
          '&listYN=Y'
          '&arrange=O'
          '${nearestRegion.sigunguCode > 0 ? "&sigunguCode=${nearestRegion.sigunguCode}" : ""}';

      final Uri requestUri = Uri.parse(urlStr);
      debugPrint('TourAPI_Request: Sending GET to ${requestUri.toString().substring(0, min(80, requestUri.toString().length))}...');

      final http.Response response = await http.get(requestUri).timeout(const Duration(seconds: 5));

      if (response.statusCode != 200) {
        throw Exception('API Server responded with status code: ${response.statusCode}');
      }

      final String responseBody = utf8.decode(response.bodyBytes);
      // 공공데이터 포털 서버의 Unexpected errors 에러 감지 처리
      if (responseBody.contains('Unexpected errors') || responseBody.contains('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) {
        throw Exception('API Gateway error: Key is invalid or not registered yet.');
      }

      final dynamic decodedJson = json.decode(responseBody);
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

        // 무장애 정보 수집을 위한 API 호출 (이중 인코딩 방지 Uri.parse 사용)
        String accessibilityInfo = '♿️ 기본 휠체어 접근성 구비';
        try {
          final String bfUrlStr = 'https://apis.data.go.kr/B551011/KorWithBarrierFreeService1/detailWithTour1'
              '?serviceKey=$apiKey'
              '&MobileOS=ETC'
              '&MobileApp=EcoTraveler'
              '&_type=json'
              '&contentId=$contentId';

          final Uri bfUri = Uri.parse(bfUrlStr);
          final http.Response bfResponse = await http.get(bfUri).timeout(const Duration(seconds: 3));
          if (bfResponse.statusCode == 200) {
            final String bfResponseBody = utf8.decode(bfResponse.bodyBytes);
            if (!bfResponseBody.contains('Unexpected errors')) {
              final dynamic bfDecoded = json.decode(bfResponseBody);
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
            regionWeight: adminRegionWeights[nearestRegion.name] ?? nearestRegion.weight,
            festivalName: festivalName,
            distanceKm: double.parse(distance.toStringAsFixed(1)),
            tollFee: (tollFee / 100).round() * 100, // 100원 단위 절사
            publicTransitFee: (publicTransitFee / 100).round() * 100,
          ),
        );
      }

      // API 연동 성공 설정
      isTourApiRealConnected = true;
      return spots;
    } catch (e) {
      debugPrint('TourAPI_Error: Actual REST API failed ($e). Resorting to local Mock Fallback.');
      isTourApiRealConnected = false;
      return getMockFallbackSpots();
    }
  }

  // API 장애 및 키 누락 시 안전을 위한 Fallback 모의 데이터 데이터베이스
  static List<TourSpot> getMockFallbackSpots() {
    return [
      TourSpot(
        name: '단양 온달동굴',
        region: '충청북도 단양군 (인구 감소 우대 지역)',
        description: '고구려 온달 장군과 평강 공주의 설화가 깃든 유서 깊은 천연동굴',
        accessibilityInfo: '♿️ 휠체어 전용 램프 및 점자 블록 완비, 시각장애인 음성 가이드 제공',
        regionWeight: adminRegionWeights['단양'] ?? 2.0,
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
        regionWeight: adminRegionWeights['태안'] ?? 1.8,
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
        regionWeight: adminRegionWeights['정선'] ?? 1.5,
        festivalName: '정선 아리랑제 축제 (9월 개최)',
        distanceKm: 210.0,
        tollFee: 9600,
        publicTransitFee: 16100,
      ),
      TourSpot(
        name: '일산 호수공원',
        region: '경기도 고양시 일산동구 (시범 가점 지역)',
        description: '동양 최대의 인공 호수로 자연 생태계가 잘 보존된 친환경 도심 공원',
        accessibilityInfo: '♿️ 무장애 보행로 및 유모차/휠체어 경사로 완비, 배리어프리 화장실 보유',
        regionWeight: adminRegionWeights['고양(일산)'] ?? 1.5,
        festivalName: '고양 국제 꽃 박람회 (4~5월 개최)',
        distanceKm: 28.5,
        tollFee: 2900,
        publicTransitFee: 1650,
      ),
      TourSpot(
        name: '서울 경복궁',
        region: '서울특별시 종로구',
        description: '조선 왕조의 법궁으로서 한국의 역사와 건축미를 대표하는 고궁',
        accessibilityInfo: '♿️ 유모차 및 휠체어 무료 대여, 입구 경사로 구비',
        regionWeight: adminRegionWeights['서울'] ?? 1.0,
        festivalName: '경복궁 야간 특별 관람 행사',
        distanceKm: 2.5,
        tollFee: 0,
        publicTransitFee: 1400,
      ),
    ];
  }

  // 3. Gemini API 기반 'AI 에코 버틀러' 연동
  static Future<String> generateButlerRecommendation({
    required double fuelPrice,
    required String destinationName,
    required double regionWeight,
    required double trafficLevel,
    required String weather,
  }) async {
    final String? apiKey = dotenv.env['GEMINI_API_KEY'];

    // API Key가 없거나 모킹 지시 상태이면 즉시 Fallback 작동
    if (apiKey == null || apiKey.isEmpty || apiKey.startsWith('MOCK_')) {
      debugPrint('GeminiAPI_Warning: Valid API Key not found. Using Mock recommendation.');
      return _getMockRecommendation(fuelPrice, destinationName, regionWeight, trafficLevel, weather);
    }

    try {
      final String trafficStatus = trafficLevel > 0.7 
          ? '정체가 매우 심각하여 자차 주행 시 매연 배출과 연비 저하가 우려되는 상황'
          : '도로 소통은 원활한 편';

      final String weightMessage = regionWeight > 1.0
          ? '특별히 이번 행선지는 우대 지역으로 지정되어 에코머니 가중치 ${regionWeight}배가 적용됩니다.'
          : '도심지 탄소배출을 낮추기 위한 친환경 챌린지 대상 구역입니다.';

      final String prompt = '''
너는 친환경 대중교통 관광 플랫폼 '에코-트래블러'의 개인화 여정 추천 AI 비서 'AI 에코 버틀러'이다.
사용자가 입력한 아래 정보를 바탕으로, 대중교통 전환을 유도하고 친환경 걷기 여정을 친근하고 위트 있게 추천하는 멘토링 조언을 작성하라.
작성 언어는 한글(Korean)이며, 반드시 마크다운(Markdown) 포맷으로 작성하고 분량은 3-4문장 내외로 간결하게 하라.

[여행 정보]
- 목적지: $destinationName
- 현재 실시간 휘발유 가격: ${fuelPrice.toInt()}원/L
- 도로 정체 수준: $trafficLevel (1.0에 가까울수록 정체 극심, 현재 상황: $trafficStatus)
- 목적지 날씨: $weather
- 우대 혜택 적용 여부: $weightMessage

[작성 가이드라인]
1. 인사말과 함께 목적지의 특징을 언급하고, 현재 날씨에 맞춰서 친환경적인 도보나 대중교통 이용을 적극 권장하라.
2. 높은 유가와 도로 정체 수준을 연계하여 자차 이동 대비 대중교통(KTX, 전철, 버스 등) 이용 시 얻을 수 있는 이점을 유머러스하고 설득력 있게 언급하라.
3. 획득할 포인트(에코머니) 가중치 혜택을 짚어주고, 텀블러 미션이나 걷기 코스(두루누비)를 추천하여 지구를 구하는 뿌듯함을 강조하라.
4. 마지막은 여행의 설렘을 돋우는 이모티콘을 섞은 한 문장으로 마무리하라.
''';

      final Uri requestUri = Uri.parse(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey'
      );

      final http.Response response = await http.post(
        requestUri,
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'contents': [
            {
              'parts': [
                {'text': prompt}
              ]
            }
          ]
        }),
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final Map<String, dynamic> decoded = json.decode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
        final String? text = decoded['candidates']?[0]?['content']?['parts']?[0]?['text']?.toString();
        if (text != null && text.trim().isNotEmpty) {
          debugPrint('GeminiAPI_Success: Fetched advice from Gemini.');
          return text.trim();
        }
      }
      throw Exception('Invalid Gemini API response status: ${response.statusCode}');
    } catch (e) {
      debugPrint('GeminiAPI_Error: Gemini API call failed ($e). Falling back to Mock.');
      return _getMockRecommendation(fuelPrice, destinationName, regionWeight, trafficLevel, weather);
    }
  }

  static String _getMockRecommendation(
    double fuelPrice,
    String destinationName,
    double regionWeight,
    double trafficLevel,
    String weather,
  ) {
    String trafficStatus = trafficLevel > 0.7 
        ? '정체가 매우 심각하여 자차 주행 시 매연 배출과 연비 저하가 우려되는 상황'
        : '도로 소통은 원활한 편';

    String weightMessage = regionWeight > 1.0
        ? '특별히 이번 행선지는 우대 지역으로 지정되어 **에코머니 가중치 ${regionWeight}배**가 적격 적용됩니다!'
        : '도심지 탄소배출을 낮추기 위한 친환경 챌린지 대상 구역입니다.';

    return '🤖 **AI 에코 버틀러 비서의 추천 (Mock)**\n\n'
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
