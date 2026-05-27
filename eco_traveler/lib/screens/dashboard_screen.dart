import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/eco_calculator.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isLoggedIn = true; // 가상 로그인 상태
  bool _isWalking = false;
  int _sessionSteps = 0;
  
  // 걸음 수 시뮬레이터 구동 타이머 모사
  void _toggleWalking(AppState appState) {
    setState(() {
      _isWalking = !_isWalking;
    });

    if (_isWalking) {
      _sessionSteps = 0;
      _simulateSteps(appState);
    }
  }

  void _simulateSteps(AppState appState) async {
    while (_isWalking) {
      await Future.delayed(const Duration(milliseconds: 600));
      if (!mounted || !_isWalking) break;
      
      int added = (5 + (10 * (1 - 0.5))).toInt(); // 모의 걸음 수
      appState.addSteps(added);
      setState(() {
        _sessionSteps += added;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final theme = Theme.of(context);

    // 등급 문자열 매핑
    String gradeText = '에코 비기너 (R: 5%)';
    if (appState.userGrade == UserGrade.pro) gradeText = '에코 프로 (R: 10%)';
    if (appState.userGrade == UserGrade.master) gradeText = '에코 마스터 (R: 15%)';

    // 탄소 환산 나무 계산 (0.1kg CO2 = 나무 1그루 효과로 스케일 모의)
    double trees = appState.co2Saved / 0.1;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. 헤더 영역 (소셜 로그인 연출 포함)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _isLoggedIn ? '반가워요, 홍길동님! 👋' : '로그인이 필요합니다',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  Text(
                    _isLoggedIn ? '구글 소셜 계정으로 로그인됨' : '간편 소셜 로그인을 진행하세요',
                    style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isLoggedIn = !_isLoggedIn;
                  });
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isLoggedIn ? Colors.grey[800] : Colors.green[700],
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: Text(_isLoggedIn ? '로그아웃' : '간편 로그인', style: const TextStyle(fontSize: 12, color: Colors.white)),
              )
            ],
          ),
          const SizedBox(height: 20),

          if (!_isLoggedIn) ...[
            // 로그인 유도 카드
            Card(
              color: Colors.green[900]?.withOpacity(0.4),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: Colors.green.withOpacity(0.3)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    const Icon(Icons.security, size: 48, color: Colors.greenAccent),
                    const SizedBox(height: 12),
                    const Text('소셜 간편 로그인 필수 연동', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    const Text(
                      '자차 연비 입력 및 포인트 적립을 시작하려면 간편 로그인을 완료하세요.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    const SizedBox(height: 20),
                    // 카카오, 네이버, 구글 버튼 모의
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _socialButton('구글', Colors.red[700]!),
                        _socialButton('카카오', Colors.yellow[700]!),
                        _socialButton('네이버', Colors.green[600]!),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            // 2. 머니백 포인트 카드
            Card(
              elevation: 4,
              shadowColor: Colors.greenAccent.withOpacity(0.2),
              color: Colors.green[900]?.withOpacity(0.25),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
                side: BorderSide(color: Colors.greenAccent.withOpacity(0.2)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('현재 출금 가능한 에코 머니', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 6),
                    Row(
                      textBaseline: TextBaseline.alphabetic,
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      children: [
                        Text(
                          '${appState.points}',
                          style: const TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Courier', // 모노스페이스 느낌
                            color: Colors.greenAccent,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text('원', style: TextStyle(fontSize: 16, color: Colors.white)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.stars, size: 16, color: Colors.amberAccent),
                            const SizedBox(width: 4),
                            Text(gradeText, style: const TextStyle(fontSize: 12, color: Colors.amberAccent, fontWeight: FontWeight.w600)),
                          ],
                        ),
                        // 등급 변경 토글
                        DropdownButton<UserGrade>(
                          value: appState.userGrade,
                          dropdownColor: Colors.grey[900],
                          underline: const SizedBox(),
                          icon: const Icon(Icons.arrow_drop_down, color: Colors.grey),
                          onChanged: (newGrade) {
                            if (newGrade != null) appState.upgradeGrade(newGrade);
                          },
                          items: const [
                            DropdownMenuItem(value: UserGrade.beginner, child: Text('비기너', style: TextStyle(fontSize: 12))),
                            DropdownMenuItem(value: UserGrade.pro, child: Text('프로', style: TextStyle(fontSize: 12))),
                            DropdownMenuItem(value: UserGrade.master, child: Text('마스터', style: TextStyle(fontSize: 12))),
                          ],
                        )
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 3. 자차 등록 정보 수정 위젯
            Card(
              color: Colors.white.withOpacity(0.03),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: Colors.white.withOpacity(0.05)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('🚗 마이카 공인 연비 설정', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        SizedBox(height: 2),
                        Text('머니백 계산의 기준 연비입니다.', style: TextStyle(fontSize: 11, color: Colors.grey)),
                      ],
                    ),
                    Row(
                      children: [
                        IconButton(
                          onPressed: () {
                            if (appState.carEfficiency > 5.0) {
                              appState.updateCarEfficiency(appState.carEfficiency - 0.5);
                            }
                          },
                          icon: const Icon(Icons.remove_circle_outline, color: Colors.greenAccent),
                        ),
                        Text(
                          '${appState.carEfficiency.toStringAsFixed(1)}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        IconButton(
                          onPressed: () {
                            if (appState.carEfficiency < 30.0) {
                              appState.updateCarEfficiency(appState.carEfficiency + 0.5);
                            }
                          },
                          icon: const Icon(Icons.add_circle_outline, color: Colors.greenAccent),
                        ),
                        const Text('km/L', style: TextStyle(fontSize: 11, color: Colors.grey)),
                      ],
                    )
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 4. 실시간 걸음 수 측정 시뮬레이터 (게이미피케이션 - 라스트 마일)
            Card(
              color: Colors.white.withOpacity(0.03),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: Colors.white.withOpacity(0.05)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.directions_walk, color: Colors.greenAccent),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('라스트 마일 걷기 측정', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                Text('오늘 걸은 수: ${appState.steps} 걸음', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                              ],
                            )
                          ],
                        ),
                        if (_isWalking)
                          Chip(
                            backgroundColor: Colors.greenAccent.withOpacity(0.2),
                            label: Text('$_sessionSteps걸음 측정중', style: const TextStyle(color: Colors.greenAccent, fontSize: 10)),
                          )
                      ],
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: () => _toggleWalking(appState),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isWalking ? Colors.red[800] : Colors.green[800],
                        minimumSize: const Size(double.infinity, 44),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: Icon(_isWalking ? Icons.stop : Icons.play_arrow, color: Colors.white),
                      label: Text(_isWalking ? '센서 측정 중지' : '실시간 걷기 모의 측정 시작', style: const TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 5. 가상 소나무 식재 (탄소 절감 게이지)
            Card(
              color: Colors.white.withOpacity(0.03),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: Colors.white.withOpacity(0.05)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.park, color: Colors.greenAccent),
                            SizedBox(width: 8),
                            Text('탄소 감축 소나무 식재 효과', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        Text(
                          '${trees.toStringAsFixed(1)} 그루',
                          style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 14),
                        )
                      ],
                    ),
                    const SizedBox(height: 10),
                    LinearProgressIndicator(
                      value: (appState.co2Saved % 1.0),
                      backgroundColor: Colors.white.withOpacity(0.05),
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.greenAccent),
                      minHeight: 8,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '누적 탄소 절감량: ${appState.co2Saved.toStringAsFixed(2)}kg CO₂ '
                      '(다음 나무 한 그루 식재까지 ${(1.0 - (appState.co2Saved % 1.0)).toStringAsFixed(2)}kg 남음)',
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            )
          ]
        ],
      ),
    );
  }

  Widget _socialButton(String name, Color color) {
    return Container(
      width: 60,
      height: 40,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        border: Border.all(color: color, width: 1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(name, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
