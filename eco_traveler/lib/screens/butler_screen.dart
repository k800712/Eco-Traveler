import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../services/mock_services.dart';

class ButlerScreen extends StatefulWidget {
  const ButlerScreen({super.key});

  @override
  State<ButlerScreen> createState() => _ButlerScreenState();
}

class _ButlerScreenState extends State<ButlerScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<TourSpot> _spots = [];
  bool _loading = true;
  
  // 버틀러 멘토링 상태
  bool _analyzing = false;
  String? _recommendationText;
  TourSpot? _currentSpot;
  String _weather = '화창함 ☀️';
  double _trafficLevel = 0.5;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadSpots();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadSpots() async {
    final spots = await MockServices.getEcoTourSpots();
    if (mounted) {
      setState(() {
        _spots = spots;
        _currentSpot = spots.first; // 기본값
        _loading = false;
      });
    }
  }

  void _fetchButlerAdvice() async {
    if (_currentSpot == null) return;
    
    setState(() {
      _analyzing = true;
      _recommendationText = null;
    });

    final fuelPrice = await MockServices.getAverageFuelPrice();
    final advice = await MockServices.generateButlerRecommendation(
      fuelPrice: fuelPrice,
      destinationName: _currentSpot!.name,
      regionWeight: _currentSpot!.regionWeight,
      trafficLevel: _trafficLevel,
      weather: _weather,
    );

    if (mounted) {
      setState(() {
        _analyzing = false;
        _recommendationText = advice;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: Colors.greenAccent));
    }

    return Column(
      children: [
        // 상단 탭 구분
        TabBar(
          controller: _tabController,
          indicatorColor: Colors.greenAccent,
          labelColor: Colors.greenAccent,
          unselectedLabelColor: Colors.grey,
          tabs: const [
            Tab(icon: Icon(Icons.psychology), text: 'AI 에코 버틀러'),
            Tab(icon: Icon(Icons.explore), text: '지역 관광 안내 (TourAPI)'),
          ],
        ),
        
        // 메인 탭 내용
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              // 1. AI 에코 버틀러 탭
              _buildButlerTab(),
              
              // 2. 지역 관광 안내 탭
              _buildTourInfoTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildButlerTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            '🤖 AI 에코 버틀러가 유저 맞춤 여정을 플래닝해 드립니다.',
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 16),

          // 매개변수 설정 패널
          Card(
            color: Colors.white.withOpacity(0.02),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: Colors.white.withOpacity(0.05)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('1단계: 상황 설정', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 12),
                  
                  // 목적지 선택
                  DropdownButtonFormField<TourSpot>(
                    value: _currentSpot,
                    decoration: const InputDecoration(
                      labelText: '목적지 설정',
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    dropdownColor: Colors.grey[950],
                    onChanged: (spot) {
                      setState(() {
                        _currentSpot = spot;
                      });
                    },
                    items: _spots.map((spot) {
                      return DropdownMenuItem(
                        value: spot,
                        child: Text(spot.name, style: const TextStyle(fontSize: 13)),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),

                  // 날씨 선택
                  DropdownButtonFormField<String>(
                    value: _weather,
                    decoration: const InputDecoration(
                      labelText: '현지 날씨 설정',
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    dropdownColor: Colors.grey[950],
                    onChanged: (weather) {
                      if (weather != null) {
                        setState(() {
                          _weather = weather;
                        });
                      }
                    },
                    items: const [
                      DropdownMenuItem(value: '화창함 ☀️', child: Text('화창함 ☀️', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: '흐림 ☁️', child: Text('흐림 ☁️', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: '비 ☔️', child: Text('비 ☔️', style: TextStyle(fontSize: 13))),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // 혼잡도 설정
                  const Text('도로 교통 혼잡도 설정', style: TextStyle(fontSize: 11, color: Colors.grey)),
                  Slider(
                    value: _trafficLevel,
                    min: 0.0,
                    max: 1.0,
                    activeColor: Colors.greenAccent,
                    inactiveColor: Colors.white10,
                    onChanged: (val) {
                      setState(() {
                        _trafficLevel = val;
                      });
                    },
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('원활 (0.0)', style: TextStyle(fontSize: 9, color: Colors.grey[400])),
                      Text('중간 혼잡 (0.5)', style: TextStyle(fontSize: 9, color: Colors.greenAccent)),
                      Text('정체 극심 (1.0)', style: TextStyle(fontSize: 9, color: Colors.grey[400])),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 에코 버틀러 구동 단추
          ElevatedButton(
            onPressed: _analyzing ? null : _fetchButlerAdvice,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.greenAccent,
              foregroundColor: Colors.black,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: _analyzing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2),
                  )
                : const Text('Gemini AI 여정 멘토링 생성', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 16),

          // 멘토링 출력 카드
          if (_recommendationText != null) ...[
            Card(
              color: Colors.green[950]?.withOpacity(0.2),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: Colors.greenAccent, width: 1),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.face, color: Colors.greenAccent),
                        const SizedBox(width: 8),
                        Text(
                          'AI 버틀러 조언',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green[300]),
                        ),
                      ],
                    ),
                    const Divider(color: Colors.white12, height: 20),
                    // 결과 메시지 출력 (마크다운 포맷 모사)
                    Text(
                      _recommendationText!,
                      style: const TextStyle(fontSize: 12, height: 1.5, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTourInfoTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: _spots.length,
      itemBuilder: (context, index) {
        final spot = _spots[index];
        return Card(
          color: Colors.white.withOpacity(0.02),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.white.withOpacity(0.04)),
          ),
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(spot.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                    Chip(
                      backgroundColor: Colors.greenAccent.withOpacity(0.15),
                      label: Text('가중치 ${spot.regionWeight}x', style: const TextStyle(color: Colors.greenAccent, fontSize: 10)),
                    )
                  ],
                ),
                const SizedBox(height: 2),
                Text(spot.region, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                const SizedBox(height: 8),
                Text(spot.description, style: const TextStyle(fontSize: 12, color: Colors.white70)),
                const Divider(color: Colors.white10, height: 24),
                
                // 1) 무장애 정보 표시
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.accessible, size: 14, color: Colors.amberAccent),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '무장애 정보: ${spot.accessibilityInfo}',
                        style: const TextStyle(fontSize: 11, color: Colors.amberAccent),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                
                // 2) 축제 정보 표시
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.celebration, size: 14, color: Colors.greenAccent),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '연계 축제: ${spot.festivalName}',
                        style: const TextStyle(fontSize: 11, color: Colors.greenAccent),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
