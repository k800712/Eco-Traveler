import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:pedometer/pedometer.dart';
import 'package:permission_handler/permission_handler.dart';

enum WalkSensorMode {
  none,
  hardware,
  simulation,
}

class PedometerService {
  static final PedometerService _instance = PedometerService._internal();
  factory PedometerService() => _instance;
  PedometerService._internal();

  StreamSubscription<StepCount>? _stepCountSubscription;
  StreamSubscription<PedestrianStatus>? _statusSubscription;
  Timer? _simulationTimer;

  WalkSensorMode _sensorMode = WalkSensorMode.none;
  WalkSensorMode get sensorMode => _sensorMode;

  int _lastHardwareSteps = -1;
  int _sessionStartSteps = 0;

  // 신체활동 인식 권한 획득 여부 조회 및 획득 시도
  Future<bool> requestActivityPermission() async {
    if (kIsWeb) return false;
    
    try {
      final status = await Permission.activityRecognition.status;
      if (status.isGranted) {
        return true;
      }
      
      final result = await Permission.activityRecognition.request();
      return result.isGranted;
    } catch (e) {
      debugPrint('Error requesting activity permission: \$e');
      return false;
    }
  }

  // 실시간 도보 측정 시작
  Future<void> startStepListening({
    required Function(int addedSteps) onStepCountChanged,
    required Function(String status) onStatusChanged,
    required Function(WalkSensorMode mode) onModeDetermined,
  }) async {
    // 1. 기존 연동 상태 초기화
    await stopStepListening();
    
    _lastHardwareSteps = -1;
    _sessionStartSteps = 0;

    // 2. 권한 점검
    bool hasPermission = await requestActivityPermission();
    
    if (hasPermission && !kIsWeb) {
      try {
        _sensorMode = WalkSensorMode.hardware;
        onModeDetermined(_sensorMode);

        // 실제 하드웨어 센서 스트림 구독
        _stepCountSubscription = Pedometer.stepCountStream.listen(
          (StepCount event) {
            if (_lastHardwareSteps == -1) {
              _lastHardwareSteps = event.steps;
              _sessionStartSteps = 0;
            } else {
              _sessionStartSteps = event.steps - _lastHardwareSteps;
            }
            onStepCountChanged(_sessionStartSteps);
          },
          onError: (error) {
            debugPrint('Pedometer hardware error (\$error). Falling back to simulation.');
            _switchToSimulation(onStepCountChanged, onStatusChanged, onModeDetermined);
          },
        );

        _statusSubscription = Pedometer.pedestrianStatusStream.listen(
          (PedestrianStatus event) {
            onStatusChanged(event.status == 'walking' ? '걷는 중 🚶' : '멈춤 🛑');
          },
          onError: (error) {
            debugPrint('Pedestrian status error: \$error');
          },
        );
        
        onStatusChanged('센서 대기 중 📶');
        return;
      } catch (e) {
        debugPrint('Failed to bind hardware sensor (\$e). Falling back to simulation.');
      }
    }

    // 3. 웹이거나, 모바일 에뮬레이터 혹은 센서 비활성화 시 모의 가동
    _switchToSimulation(onStepCountChanged, onStatusChanged, onModeDetermined);
  }

  // 시뮬레이션 모드로 전환 (Fallback)
  void _switchToSimulation(
    Function(int) onStepCountChanged,
    Function(String) onStatusChanged,
    Function(WalkSensorMode) onModeDetermined,
  ) {
    _sensorMode = WalkSensorMode.simulation;
    onModeDetermined(_sensorMode);
    onStatusChanged('시뮬레이션 가동 중 💻');

    int simulatedSteps = 0;
    _simulationTimer = Timer.periodic(const Duration(milliseconds: 1000), (timer) {
      simulatedSteps += 1 + (timer.tick % 2); // 초당 약 1~2 걸음 생성
      onStepCountChanged(simulatedSteps);
    });
  }

  // 측정 정지 및 자원 해제
  Future<void> stopStepListening() async {
    await _stepCountSubscription?.cancel();
    _stepCountSubscription = null;
    
    await _statusSubscription?.cancel();
    _statusSubscription = null;

    _simulationTimer?.cancel();
    _simulationTimer = null;

    _sensorMode = WalkSensorMode.none;
  }
}
