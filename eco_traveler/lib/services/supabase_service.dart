import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  SupabaseClient get _client => Supabase.instance.client;

  // 1. 프로필 정보 동기화 (Upsert)
  Future<void> upsertProfile({
    required String uid,
    required String email,
    required String displayName,
    required String carModel,
    required double fuelEfficiency,
    required int totalPoints,
    required double totalCo2Saved,
  }) async {
    try {
      await _client.from('profiles').upsert({
        'id': uid,
        'email': email,
        'display_name': displayName,
        'car_model': carModel,
        'fuel_type': 'gasoline', // 기본값 설정
        'fuel_efficiency': fuelEfficiency,
        'total_points': totalPoints,
        'total_co2_saved': totalCo2Saved,
        'updated_at': DateTime.now().toIso8601String(),
      });
      debugPrint('SupabaseService_Success: upsertProfile completed for $uid');
    } catch (e) {
      debugPrint('SupabaseService_Error: upsertProfile failed ($e)');
      rethrow;
    }
  }

  // 2. 프로필 정보 조회
  Future<Map<String, dynamic>?> getProfile(String uid) async {
    try {
      final data = await _client.from('profiles').select().eq('id', uid).maybeSingle();
      debugPrint('SupabaseService_Success: getProfile completed for $uid');
      return data;
    } catch (e) {
      debugPrint('SupabaseService_Error: getProfile failed ($e)');
      return null;
    }
  }

  // 3. 위치 기반 제휴처 검색 (PostGIS RPC 호출)
  Future<List<Map<String, dynamic>>> fetchNearbyPartners(double lat, double lng, {double radiusMeters = 2000.0}) async {
    try {
      final List<dynamic> response = await _client.rpc(
        'get_nearby_partners', 
        params: {
          'user_lng': lng,
          'user_lat': lat,
          'radius_meters': radiusMeters,
        }
      );
      
      debugPrint('SupabaseService_Success: Fetched ${response.length} nearby partners.');
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint("Supabase RPC (get_nearby_partners) 호출 실패: $e");
      // 호출 실패 시 로컬 더미 파트너 데이터를 Fallback으로 반환 (하이브리드 예외 처리 원칙 준수)
      return _getMockPartners(lat, lng);
    }
  }

  // 4. 에코 머니백 적립 기록 저장 (Insert)
  Future<void> saveTrip({
    required String userId,
    required String originName,
    required String destinationName,
    required double distanceKm,
    required int carCost,
    required int publicTransportCost,
    required int savedCost,
    required int pointsEarned,
    required double co2Saved,
    required bool isLocalBonus,
  }) async {
    try {
      await _client.from('trips').insert({
        'user_id': userId,
        'origin_name': originName,
        'destination_name': destinationName,
        'distance_km': distanceKm,
        'car_cost': carCost,
        'public_transport_cost': publicTransportCost,
        'saved_cost': savedCost,
        'points_earned': pointsEarned,
        'co2_saved': co2Saved,
        'is_local_bonus': isLocalBonus,
        'created_at': DateTime.now().toIso8601String(),
      });
      debugPrint('SupabaseService_Success: saveTrip completed for user $userId');
    } catch (e) {
      debugPrint('SupabaseService_Error: saveTrip failed ($e)');
      rethrow;
    }
  }

  // 로컬 더미 파트너 데이터 (데이터베이스가 연결되지 않았거나 RPC 함수가 등록되지 않았을 때의 Fallback)
  List<Map<String, dynamic>> _getMockPartners(double lat, double lng) {
    return [
      {
        'id': 'dummy-partner-1',
        'name': '에프원모터스 일산점 (Mock)',
        'category': 'maintenance',
        'address': '경기도 고양시 일산동구 중앙로 123',
        'phone': '031-123-4567',
        'description': '에코-트래블러 공식 제휴 정비소 할인 및 엔진오일 무상 점검 혜택을 제공합니다.',
        'latitude': 37.6582,
        'longitude': 126.7642,
        'distance_meters': 250.0
      },
      {
        'id': 'dummy-partner-2',
        'name': '그린 어스 카페 일산 (Mock)',
        'category': 'cafe',
        'address': '경기도 고양시 일산동구 호수로 456',
        'phone': '031-987-6543',
        'description': '대중교통 이용 영수증 지참 또는 에코 포인트 결제 시 모든 음료 20% 특별 할인을 적용합니다.',
        'latitude': 37.6534,
        'longitude': 126.7721,
        'distance_meters': 850.0
      }
    ];
  }
}
