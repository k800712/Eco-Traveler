import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../providers/app_state.dart';
import '../services/mock_services.dart';
import '../models/eco_calculator.dart';
import '../models/tour_spot.dart';
import '../services/tour_api_service.dart';
import '../services/supabase_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  List<TourSpot> _spots = [];
  TourSpot? _selectedSpot;
  bool _loading = true;
  double _fuelPrice = 1650.0;
  AppState? _appState;

  // 게이미피케이션 체크박스 상태
  bool _isTrainBonus = true;
  bool _isOffPeakBonus = false;
  bool _isDuroNubiBonus = false;

  // 여정 이동 시뮬레이션 상태
  bool _isTraveling = false;
  double _travelProgress = 0.0;

  // 구글맵 및 위치 상태 변수
  GoogleMapController? _googleMapController;
  LatLng _centerLatLng = const LatLng(37.5665, 126.9780); // 서울 시청 디폴트
  Set<Marker> _markers = {};

  @override
  void initState() {
    super.initState();
    _loadData(isInitial: true);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _appState = Provider.of<AppState>(context, listen: false);
  }

  @override
  void dispose() {
    super.dispose();
  }

  // Geolocator 기반의 GPS 획득 비동기 헬퍼
  Future<Position?> _determinePosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    try {
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        debugPrint('Location services are disabled.');
        return null;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          debugPrint('Location permissions are denied');
          return null;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        debugPrint('Location permissions are permanently denied.');
        return null;
      } 

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 5),
      );
    } catch (e) {
      debugPrint('Error getting position via Geolocator: $e');
      return null;
    }
  }

  // 동적 마커 갱신 루틴 (구글맵 위젯 지원용)
  void _updateMarkers(AppState appState) {
    final Set<Marker> newMarkers = {};

    // 1. 사용자 현재 위치 마커 (파란색 핀)
    newMarkers.add(
      Marker(
        markerId: const MarkerId('my_location'),
        position: _centerLatLng,
        infoWindow: const InfoWindow(title: '내 위치'),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
      ),
    );

    // 2. 관광 스팟 마커 (선택 시 초록색, 비선택 시 빨간색 핀)
    for (var spot in _spots) {
      double x = 126.9780;
      double y = 37.5665;
      if (spot.name.contains('단양')) { x = 128.3650; y = 36.9845; }
      else if (spot.name.contains('태안')) { x = 126.2980; y = 36.7456; }
      else if (spot.name.contains('정선')) { x = 128.6600; y = 37.3800; }
      else if (spot.name.contains('경복궁')) { x = 126.9768; y = 37.5796; }
      else if (spot.name.contains('일산') || spot.name.contains('고양')) { x = 126.7642; y = 37.6582; }

      final bool isSelected = _selectedSpot?.name == spot.name;

      newMarkers.add(
        Marker(
          markerId: MarkerId('spot_${spot.name}'),
          position: LatLng(y, x),
          infoWindow: InfoWindow(title: spot.name, snippet: spot.region),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            isSelected ? BitmapDescriptor.hueGreen : BitmapDescriptor.hueRed,
          ),
          onTap: () {
            setState(() {
              _selectedSpot = spot;
            });
            // 선택 스팟 변경 시 마커 정보 실시간 업데이트
            _updateMarkers(appState);
          },
        ),
      );
    }

    // 3. Supabase 제휴 파트너 마커 (정비소: 주황색, 카페: 시안색 핀)
    for (var partner in appState.nearbyPartners) {
      final String name = partner['name'] ?? '제휴 파트너';
      final String category = partner['category'] ?? '';
      final double plat = double.tryParse(partner['latitude']?.toString() ?? '') ?? (_centerLatLng.latitude + 0.002);
      final double plng = double.tryParse(partner['longitude']?.toString() ?? '') ?? (_centerLatLng.longitude + 0.002);

      double hue = BitmapDescriptor.hueOrange;
      if (category == 'cafe') {
        hue = BitmapDescriptor.hueCyan;
      }

      newMarkers.add(
        Marker(
          markerId: MarkerId('partner_${partner['id'] ?? name}'),
          position: LatLng(plat, plng),
          infoWindow: InfoWindow(title: name, snippet: partner['description']),
          icon: BitmapDescriptor.defaultMarkerWithHue(hue),
        ),
      );
    }

    setState(() {
      _markers = newMarkers;
    });
  }

  void _loadData({bool isInitial = false}) async {
    if (isInitial) {
      setState(() {
        _loading = true;
      });
    }

    double? lat;
    double? lng;

    // Geolocator로 실시간 GPS 위치 수집
    final position = await _determinePosition();
    if (position != null) {
      lat = position.latitude;
      lng = position.longitude;
      _centerLatLng = LatLng(lat, lng);
      // 구글맵 카메라 위치 이동
      _googleMapController?.animateCamera(
        CameraUpdate.newLatLngZoom(_centerLatLng, 13.0),
      );
      debugPrint('Geolocator_Success: GPS coordinates captured. Lat: $lat, Lng: $lng');
    } else {
      debugPrint('Geolocator_Fallback: Failed to capture GPS. Using default Seoul Center.');
    }

    if (_appState != null) {
      _appState!.setTourApiLoading(true);
      _appState!.setTourApiError(null);
    }

    try {
      final spots = await TourApiService().fetchLocationBasedSpots(latitude: lat, longitude: lng);
      final price = await MockServices.getAverageFuelPrice();
      
      // Supabase 주변 제휴 파트너 로드
      if (_appState != null) {
        await _appState!.loadNearbyPartners(lat ?? 37.5665, lng ?? 126.9780);
      }

      if (mounted) {
        setState(() {
          _spots = spots;
          _fuelPrice = price;
          _loading = false;

          // 선택된 스팟이 있으면 새 목록의 동일 스팟(가중치 갱신됨)으로 참조 갱신
          if (_selectedSpot != null) {
            try {
              _selectedSpot = spots.firstWhere((s) => s.name == _selectedSpot!.name);
            } catch (_) {
              _selectedSpot = null;
            }
          }
        });
        if (_appState != null) {
          _updateMarkers(_appState!);
        }
      }
    } catch (e) {
      debugPrint('MapScreen_Error: Failed to fetch API data ($e)');
      if (_appState != null) {
        _appState!.setTourApiError(e.toString());
      }
      final spots = await MockServices.getMockFallbackSpots();
      final price = await MockServices.getAverageFuelPrice();
      if (_appState != null) {
        await _appState!.loadNearbyPartners(lat ?? 37.5665, lng ?? 126.9780);
      }
      if (mounted) {
        setState(() {
          _spots = spots;
          _fuelPrice = price;
          _loading = false;
        });
        if (_appState != null) {
          _updateMarkers(_appState!);
        }
      }
    } finally {
      if (_appState != null) {
        _appState!.setTourApiLoading(false);
      }
    }
  }

  void _simulateTravel(AppState appState, int totalEarned, double co2Reduction, double carCost) async {
    setState(() {
      _isTraveling = true;
      _travelProgress = 0.0;
    });

    // 0.3초마다 10%씩 진행
    for (int i = 0; i <= 10; i++) {
      await Future.delayed(const Duration(milliseconds: 300));
      if (!mounted) return;
      setState(() {
        _travelProgress = i / 10.0;
      });
    }

    // Supabase 실서버 trips 테이블 기록 저장
    if (appState.isLoggedIn) {
      try {
        await SupabaseService().saveTrip(
          userId: appState.userUid.isNotEmpty ? appState.userUid : 'd4090000-0000-0000-0000-0000000000d0',
          originName: '현 위치',
          destinationName: _selectedSpot?.name ?? '에코 목적지',
          distanceKm: _selectedSpot?.distanceKm ?? 0.0,
          carCost: carCost.round(),
          publicTransportCost: _selectedSpot?.publicTransitFee ?? 0,
          savedCost: (carCost - (_selectedSpot?.publicTransitFee ?? 0)).round(),
          pointsEarned: totalEarned,
          co2Saved: co2Reduction,
          isLocalBonus: (_selectedSpot?.name.contains('고양') ?? false) || (_selectedSpot?.name.contains('일산') ?? false),
        );
      } catch (e) {
        debugPrint('MapScreen_Warning: Could not save trip on Supabase: $e');
      }
    }

    // 적립 완료 처리
    await appState.addPoints(totalEarned, co2Reduction);
    
    if (mounted) {
      setState(() {
        _isTraveling = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('🎉 친환경 이동 적립 완료! +$totalEarned P (${co2Reduction.toStringAsFixed(2)}kg CO₂ 절감)'),
          backgroundColor: Colors.green[800],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    if (_loading) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 지도 스켈레톤
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.04)),
              ),
              child: const Center(
                child: CircularProgressIndicator(color: Colors.greenAccent),
              ),
            ),
            const SizedBox(height: 20),
            // 스팟 선택 스켈레톤
            Container(
              height: 48,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            const SizedBox(height: 20),
            // 세부 카드 스켈레톤
            Container(
              height: 150,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ],
        ),
      );
    }

    // 머니백 계산식 연동
    double carCost = 0.0;
    int baseReward = 0;
    int bonusReward = 0;
    int totalReward = 0;
    double co2Reduction = 0.0;

    if (_selectedSpot != null) {
      // 1) 자차 주행 실질 비용 계산
      carCost = EcoCalculator.calculateCarCost(
        distance: _selectedSpot!.distanceKm,
        fuelPrice: _fuelPrice,
        fuelEfficiency: appState.carEfficiency,
        tollFee: _selectedSpot!.tollFee.toDouble(),
      );

      // 2) 대중교통 전환 리워드 계산
      baseReward = EcoCalculator.calculateRewardPoints(
        carCost: carCost,
        publicTransitFee: _selectedSpot!.publicTransitFee.toDouble(),
        grade: appState.userGrade,
        regionWeight: _selectedSpot!.regionWeight,
      );

      // 3) 보너스 포인트 계산
      bonusReward = EcoCalculator.calculateBonusPoints(
        isTrainOrSharedBike: _isTrainBonus,
        isOffPeakTime: _isOffPeakBonus,
        isDuroNubiCompleted: _isDuroNubiBonus,
      );

      totalReward = baseReward + bonusReward;
      
      // 대중교통 전환에 따른 가상 이산화탄소 절감 (1km당 약 0.15kg 탄소 절감 효과 상정)
      co2Reduction = _selectedSpot!.distanceKm * 0.15;
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. 에코맵 오픈스트리트맵(OSM) 위젯
          Container(
            height: 300,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.greenAccent.withOpacity(0.2)),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Stack(
                children: [
                  GoogleMap(
                    initialCameraPosition: CameraPosition(
                      target: _centerLatLng,
                      zoom: 13.0,
                    ),
                    markers: _markers,
                    onMapCreated: (GoogleMapController controller) {
                      _googleMapController = controller;
                      _updateMarkers(appState);
                    },
                  ),
                  // 지도 좌측 상단 범례 오버레이
                  Positioned(
                    left: 12,
                    top: 12,
                    right: 12,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.black87,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.greenAccent.withOpacity(0.3)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.map, size: 14, color: Colors.greenAccent),
                              SizedBox(width: 6),
                              Text('실시간 Google Maps 연동', style: TextStyle(fontSize: 10, color: Colors.white)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: TourApiService().isTourApiRealConnected 
                                ? Colors.blue.withOpacity(0.8) 
                                : Colors.orange.withOpacity(0.8),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            TourApiService().isTourApiRealConnected 
                                ? '📡 실시간 TourAPI' 
                                : '💻 로컬 모의 데이터',
                            style: const TextStyle(
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 2. 여행지 리스트 및 가중치 확인
          const Text('관광지 선택 및 머니백 시뮬레이션', style: TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          
          DropdownButtonFormField<TourSpot>(
            value: _selectedSpot,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white.withOpacity(0.03),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            hint: const Text('목적지를 선택하세요', style: TextStyle(fontSize: 14, color: Colors.grey)),
            dropdownColor: Colors.grey[950],
            onChanged: (spot) {
              setState(() {
                _selectedSpot = spot;
              });
            },
            items: _spots.map((spot) {
              return DropdownMenuItem(
                value: spot,
                child: Text('${spot.name} (${spot.regionWeight}x)', style: const TextStyle(fontSize: 14)),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // 3. 이동 경로 머니백 연산서 출력
          if (_selectedSpot != null) ...[
            Card(
              color: Colors.white.withOpacity(0.02),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: Colors.greenAccent.withOpacity(0.1)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(_selectedSpot!.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.greenAccent)),
                    const SizedBox(height: 4),
                    Text(_selectedSpot!.region, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    const SizedBox(height: 6),
                    Text(_selectedSpot!.accessibilityInfo, style: const TextStyle(fontSize: 11, color: Colors.amberAccent)),
                    const Divider(color: Colors.white10, height: 20),
                    
                    // 자차 비용 명세
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('🚘 자차 이동비 (C_car)', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text('${carCost.round().toLocaleString()} 원', style: const TextStyle(fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Padding(
                      padding: const EdgeInsets.only(left: 10.0),
                      child: Text(
                        '거리: ${_selectedSpot!.distanceKm}km | 유가: ${_fuelPrice.toInt()}원/L | 연비: ${appState.carEfficiency}km/L | 톨비: ${_selectedSpot!.tollFee}원 | 정비비: ${(120 * _selectedSpot!.distanceKm).round()}원',
                        style: const TextStyle(fontSize: 9, color: Colors.grey),
                      ),
                    ),
                    const SizedBox(height: 10),

                    // 대중교통 비용 명세
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('🚇 대중교통비 (C_public)', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text('${_selectedSpot!.publicTransitFee.toLocaleString()} 원', style: const TextStyle(fontSize: 12)),
                      ],
                    ),
                    const Divider(color: Colors.white10, height: 20),

                    // 머니백 포인트 적립 연산서
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('기본 리워드 적립금 (Savings * R * L)', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text('$baseReward P', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.greenAccent)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('게이미피케이션 보너스 적립금', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text('+$bonusReward P', style: const TextStyle(fontSize: 12, color: Colors.amberAccent)),
                      ],
                    ),
                    const Divider(color: Colors.white12, height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('최종 지급 예정 머니백', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                        Text(
                          '$totalReward P', 
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.greenAccent),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 4. 게이미피케이션 (보너스) 체크박스 그룹
            const Text('보너스 포인트 추가 달성 미션', style: TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Card(
              color: Colors.white.withOpacity(0.01),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  CheckboxListTile(
                    title: const Text('초저탄소 보너스 (기차/공유자전거 이용)', style: TextStyle(fontSize: 12)),
                    subtitle: const Text('여정에 KTX, 무궁화, 따릉이 이용 시 +500P', style: TextStyle(fontSize: 10, color: Colors.grey)),
                    value: _isTrainBonus,
                    activeColor: Colors.greenAccent,
                    checkColor: Colors.black,
                    onChanged: (val) {
                      setState(() {
                        _isTrainBonus = val ?? false;
                      });
                    },
                  ),
                  CheckboxListTile(
                    title: const Text('스마트 타임 보너스 (오프피크 시간 방문)', style: TextStyle(fontSize: 12)),
                    subtitle: const Text('관광지 혼잡 시간대를 비켜 방문 시 +500P', style: TextStyle(fontSize: 10, color: Colors.grey)),
                    value: _isOffPeakBonus,
                    activeColor: Colors.greenAccent,
                    checkColor: Colors.black,
                    onChanged: (val) {
                      setState(() {
                        _isOffPeakBonus = val ?? false;
                      });
                    },
                  ),
                  CheckboxListTile(
                    title: const Text('라스트 마일 보너스 (두루누비 코스 완주)', style: TextStyle(fontSize: 12)),
                    subtitle: const Text('연계 걷기 코스 미션 성공 시 +1000P', style: TextStyle(fontSize: 10, color: Colors.grey)),
                    value: _isDuroNubiBonus,
                    activeColor: Colors.greenAccent,
                    checkColor: Colors.black,
                    onChanged: (val) {
                      setState(() {
                        _isDuroNubiBonus = val ?? false;
                      });
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 5. 여정 개시 및 시뮬레이터 구동
            if (_isTraveling) ...[
              Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('🚇 대중교통으로 목적지 이동 중...', style: TextStyle(fontSize: 12, color: Colors.greenAccent)),
                      Text('${(_travelProgress * 100).toInt()}%'),
                    ],
                  ),
                  const SizedBox(height: 6),
                  LinearProgressIndicator(
                    value: _travelProgress,
                    backgroundColor: Colors.white10,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.greenAccent),
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ],
              )
            ] else
              ElevatedButton(
                onPressed: () => _simulateTravel(appState, totalReward, co2Reduction, carCost),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.greenAccent,
                  foregroundColor: Colors.black,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('대중교통 여정 개시 및 머니백 적립', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              ),
            const SizedBox(height: 24),
            Row(
              children: [
                const Icon(Icons.store, color: Colors.cyanAccent, size: 18),
                const SizedBox(width: 6),
                const Text('내 주변 에코 제휴 파트너 (Supabase)', style: TextStyle(fontSize: 13, color: Colors.white, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            if (appState.nearbyPartners.isEmpty)
              Card(
                color: Colors.white.withOpacity(0.01),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Center(
                    child: Text('주변 2km 내에 제휴 상점이 없습니다.', style: TextStyle(fontSize: 11, color: Colors.grey)),
                  ),
                ),
              )
            else
              ...appState.nearbyPartners.map((partner) {
                final String name = partner['name'] ?? '제휴 파트너';
                final String category = partner['category'] ?? '';
                final String address = partner['address'] ?? '';
                final String description = partner['description'] ?? '';
                final double distance = double.tryParse(partner['distance_meters']?.toString() ?? '') ?? 0.0;
                
                String categoryLabel = '상점';
                Color categoryColor = Colors.cyan;
                if (category == 'maintenance') {
                  categoryLabel = '정비';
                  categoryColor = Colors.cyan;
                } else if (category == 'cafe') {
                  categoryLabel = '카페';
                  categoryColor = Colors.orangeAccent;
                }

                return Card(
                  color: Colors.white.withOpacity(0.02),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: categoryColor.withOpacity(0.1)),
                  ),
                  margin: const EdgeInsets.only(bottom: 10),
                  child: Padding(
                    padding: const EdgeInsets.all(14.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: categoryColor.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    categoryLabel, 
                                    style: TextStyle(color: categoryColor, fontSize: 9, fontWeight: FontWeight.bold)
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                              ],
                            ),
                            Text('${distance.round()}m', style: TextStyle(fontSize: 11, color: categoryColor, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(address, style: const TextStyle(fontSize: 10, color: Colors.grey)),
                        const SizedBox(height: 4),
                        Text(description, style: const TextStyle(fontSize: 11, color: Colors.white70)),
                      ],
                    ),
                  ),
                );
              }).toList(),
          ],
        ],
      ),
    );
  }
}

// 가상 지도 도로망 선형 그리기용 CustomPainter
class RoadGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.greenAccent
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    // 가로 도로들
    canvas.drawLine(Offset(0, size.height * 0.3), Offset(size.width, size.height * 0.4), paint);
    canvas.drawLine(Offset(0, size.height * 0.7), Offset(size.width, size.height * 0.65), paint);
    
    // 세로 도로들
    canvas.drawLine(Offset(size.width * 0.25, 0), Offset(size.width * 0.3, size.height), paint);
    canvas.drawLine(Offset(size.width * 0.7, 0), Offset(size.width * 0.6, size.height), paint);

    // 서울 중심 순환망
    canvas.drawCircle(Offset(size.width * 0.49, size.height * 0.52), 45, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// 숫자 천단위 콤마 포맷팅용 헬퍼
extension NumberFormatter on num {
  String toLocaleString() {
    RegExp reg = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
    return toString().replaceAllMapped(reg, (Match m) => '${m[1]},');
  }
}
