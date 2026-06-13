import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../services/mock_services.dart';
import '../models/eco_calculator.dart';

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

  @override
  void initState() {
    super.initState();
    _loadData(isInitial: true);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final newAppState = Provider.of<AppState>(context);
    if (_appState != newAppState) {
      _appState?.removeListener(_onAppStateChanged);
      _appState = newAppState;
      _appState?.addListener(_onAppStateChanged);
    }
  }

  @override
  void dispose() {
    _appState?.removeListener(_onAppStateChanged);
    super.dispose();
  }

  void _onAppStateChanged() {
    _loadData();
  }

  void _loadData({bool isInitial = false}) async {
    if (isInitial) {
      setState(() {
        _loading = true;
      });
    }
    final spots = await MockServices.getEcoTourSpots();
    final price = await MockServices.getAverageFuelPrice();
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
    }
  }

  void _simulateTravel(AppState appState, int totalEarned, double co2Reduction) async {
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

    // 적립 완료 처리
    appState.addPoints(totalEarned, co2Reduction);
    
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
      return const Center(child: CircularProgressIndicator(color: Colors.greenAccent));
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
          // 1. 에코맵 캔버스 그래픽 위젯 (지도 목업)
          Container(
            height: 240,
            decoration: BoxDecoration(
              gradient: RadialGradient(
                colors: [Colors.green[900]!, Colors.black],
                radius: 1.2,
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.greenAccent.withOpacity(0.15)),
            ),
            child: Stack(
              children: [
                // 가상 지도 도로망 백그라운드 선형 아트
                Positioned.fill(
                  child: Opacity(
                    opacity: 0.1,
                    child: CustomPaint(
                      painter: RoadGridPainter(),
                    ),
                  ),
                ),
                // 마커 배치
                ..._spots.map((spot) {
                  bool isSelected = _selectedSpot?.name == spot.name;
                  
                  // 위경도 스케일 모의 좌표 매핑
                  double x = 200.0;
                  double y = 120.0;
                  if (spot.name.contains('단양')) { x = 280; y = 140; }
                  if (spot.name.contains('태안')) { x = 110; y = 160; }
                  if (spot.name.contains('정선')) { x = 320; y = 80; }
                  if (spot.name.contains('경복궁')) { x = 200; y = 115; }

                  return Positioned(
                    left: x - 12,
                    top: y - 24,
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedSpot = spot;
                        });
                      },
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: isSelected ? Colors.greenAccent : Colors.black87,
                              border: Border.all(color: Colors.greenAccent),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              spot.name.split(' ').first,
                              style: TextStyle(
                                fontSize: 8, 
                                color: isSelected ? Colors.black : Colors.white,
                                fontWeight: FontWeight.bold
                              ),
                            ),
                          ),
                          Icon(
                            Icons.location_on, 
                            color: isSelected ? Colors.greenAccent : Colors.green[300], 
                            size: isSelected ? 28 : 22,
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                // 지도 좌측 상단 범례
                Positioned(
                  left: 12,
                  top: 12,
                  right: 12,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.map, size: 14, color: Colors.greenAccent),
                          SizedBox(width: 4),
                          Text('에코 맵 가이드', style: TextStyle(fontSize: 10, color: Colors.grey)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: MockServices.isTourApiRealConnected 
                              ? Colors.blue.withOpacity(0.2) 
                              : Colors.orange.withOpacity(0.2),
                          border: Border.all(
                            color: MockServices.isTourApiRealConnected ? Colors.blueAccent : Colors.orangeAccent,
                            width: 0.5,
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          MockServices.isTourApiRealConnected 
                              ? '📡 실시간 TourAPI 연동 중' 
                              : '💻 로컬 모의 데이터 연동 중',
                          style: TextStyle(
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                            color: MockServices.isTourApiRealConnected ? Colors.blueAccent : Colors.orangeAccent,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
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
                onPressed: () => _simulateTravel(appState, totalReward, co2Reduction),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.greenAccent,
                  foregroundColor: Colors.black,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('대중교통 여정 개시 및 머니백 적립', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              ),
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
