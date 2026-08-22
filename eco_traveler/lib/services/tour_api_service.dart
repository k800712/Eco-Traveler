import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../models/tour_spot.dart';
import 'mock_services.dart';

class TourApiService {
  static final TourApiService _instance = TourApiService._internal();
  factory TourApiService() => _instance;
  TourApiService._internal();

  bool isTourApiRealConnected = false;

  // 하버사인 직선거리 계산
  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295; // pi / 180
    final a = 0.5 - cos((lat2 - lat1) * p) / 2 +
        cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
    return 12742 * asin(sqrt(a)); // 지구 지름 12742km 기반 반환
  }

  // 위치 기반 친환경 관광지 조회 및 무장애 상세정보 병합
  Future<List<TourSpot>> fetchLocationBasedSpots({
    double? latitude,
    double? longitude,
  }) async {
    final double currentLat = latitude ?? 37.5665; // 서울 시청 디폴트
    final double currentLng = longitude ?? 126.9780;

    final String? apiKey = dotenv.env['TOUR_API_KEY'];

    // API Key가 없거나 MOCK_으로 채워진 경우 Mock Fallback으로 자동 폴백
    if (apiKey == null || apiKey.isEmpty || apiKey.startsWith('MOCK_')) {
      debugPrint('TourApiService_Warning: Valid API Key not found. Falling back to Mock.');
      isTourApiRealConnected = false;
      return MockServices.getMockFallbackSpots();
    }

    try {
      // 1) locationBasedList1 API 호출 (이중 인코딩 방지를 위한 String Interpolation)
      final String urlStr = 'https://apis.data.go.kr/B551011/KorService1/locationBasedList1'
          '?serviceKey=$apiKey'
          '&MobileOS=ETC'
          '&MobileApp=EcoTraveler'
          '&_type=json'
          '&mapX=$currentLng'
          '&mapY=$currentLat'
          '&radius=20000' // 20km 반경
          '&contentTypeId=12' // 관광지 유형
          '&numOfRows=5'
          '&pageNo=1'
          '&listYN=Y'
          '&arrange=O'; // 거리순

      final Uri requestUri = Uri.parse(urlStr);
      debugPrint('TourApiService_Request: Sending GET to ${requestUri.toString().substring(0, min(80, requestUri.toString().length))}...');

      final http.Response response = await http.get(requestUri).timeout(const Duration(seconds: 5));

      if (response.statusCode != 200) {
        throw Exception('API Server responded with status code: ${response.statusCode}');
      }

      final String responseBody = utf8.decode(response.bodyBytes);
      if (responseBody.contains('Unexpected errors') || responseBody.contains('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) {
        throw Exception('API Gateway error: Key is invalid or not registered yet.');
      }

      final dynamic decodedJson = json.decode(responseBody);
      final dynamic body = decodedJson['response']?['body'];
      if (body == null || body['items'] == null || body['items'] == '') {
        throw Exception('No tourist items found in response for coordinate ($currentLat, $currentLng)');
      }

      final List<dynamic> itemList = body['items']['item'] is List 
          ? body['items']['item'] 
          : [body['items']['item']];

      final List<TourSpot> spots = [];

      // 2) 각 관광지 상세 및 무장애 편의 정보 연합 조회 (detailWithTour1)
      for (var item in itemList) {
        final String contentId = item['contentid']?.toString() ?? '';
        final String title = item['title']?.toString() ?? '에코 여행지';
        final String addr = item['addr1']?.toString() ?? '대한민국 관광지';
        final double spotLng = double.tryParse(item['mapx']?.toString() ?? '') ?? currentLng;
        final double spotLat = double.tryParse(item['mapy']?.toString() ?? '') ?? currentLat;

        // 실제 이동 거리 계산 (Haversine 공식)
        final double distance = _calculateDistance(currentLat, currentLng, spotLat, spotLng);
        
        // 무장애 정보 수집을 위한 API 호출 (이중 인코딩 방지)
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
          debugPrint('TourApiService_BF_Warning: Could not fetch Barrier-free info for $contentId: $bfError');
        }

        // 고양/일산 가점 지역(1.5배), 기타 단양(2.0배), 태안(1.8배), 정선(1.5배) 가중치 매핑
        double weight = 1.0;
        if (title.contains('일산') || addr.contains('고양') || addr.contains('일산')) {
          weight = 1.5;
        } else if (addr.contains('단양')) {
          weight = 2.0;
        } else if (addr.contains('태안')) {
          weight = 1.8;
        } else if (addr.contains('정선')) {
          weight = 1.5;
        }

        String festivalName = '생태 숲길 챌린지';
        if (addr.contains('고양') || title.contains('일산')) {
          festivalName = '고양 국제 꽃 박람회';
        } else if (addr.contains('단양')) {
          festivalName = '단양 온달 문화 축제';
        } else if (addr.contains('태안')) {
          festivalName = '태안 모래조각 축제';
        } else if (addr.contains('정선')) {
          festivalName = '정선 인형극 축제';
        }

        spots.add(
          TourSpot.fromJson(
            item as Map<String, dynamic>,
            distance: distance,
            accessibility: accessibilityInfo,
            festival: festivalName,
            weight: weight,
          ),
        );
      }

      isTourApiRealConnected = true;
      return spots;
    } catch (e) {
      debugPrint('TourApiService_Error: Actual REST API failed ($e). Falling back to Mock.');
      isTourApiRealConnected = false;
      return MockServices.getMockFallbackSpots();
    }
  }
}
