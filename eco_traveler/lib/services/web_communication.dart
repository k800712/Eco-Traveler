import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:universal_html/html.dart' as html;
import '../providers/app_state.dart';

class WebCommunication {
  static AppState? _appState;

  // 웹 통신 초기화 및 이벤트 리스너 등록
  static void init(AppState appState) {
    _appState = appState;

    if (!kIsWeb) {
      debugPrint('WebCommunication: Not running on Web. Skipping message listener setup.');
      return;
    }

    debugPrint('WebCommunication: Initializing message listener for Web environment.');

    // 부모 창(React)으로부터 오는 메시지(SYNC_STATE) 수신
    html.window.addEventListener('message', (html.Event event) {
      if (event is html.MessageEvent) {
        try {
          final dynamic rawData = event.data;
          if (rawData == null) return;

          Map<String, dynamic> data;
          if (rawData is String) {
            // JSON 문자열 형태로 왔을 경우 파싱
            data = jsonDecode(rawData) as Map<String, dynamic>;
          } else if (rawData is Map) {
            data = Map<String, dynamic>.from(rawData);
          } else {
            // 직렬화된 JS Object 등의 형태인 경우
            data = jsonDecode(jsonEncode(rawData)) as Map<String, dynamic>;
          }

          if (data['type'] == 'SYNC_STATE') {
            final int? points = data['points'];
            final int? steps = data['steps'];
            final double? co2Saved = double.tryParse(data['co2Saved']?.toString() ?? '');

            final List<dynamic>? rawCompleted = data['completedChallenges'];
            final List<int> completedChallenges = rawCompleted != null 
                ? rawCompleted.map((e) => int.parse(e.toString())).toList() 
                : [];
                
            final List<dynamic>? rawRefunds = data['refundHistory'];
            final List<RefundRecord> refundHistory = [];
            if (rawRefunds != null) {
              for (var r in rawRefunds) {
                if (r is Map) {
                  String status = r['status'] == 'completed' ? '이체완료' : '처리중';
                  refundHistory.add(RefundRecord(
                    id: r['id']?.toString() ?? '',
                    bank: r['bank']?.toString() ?? '',
                    account: r['account']?.toString() ?? '',
                    holder: r['holder']?.toString() ?? '',
                    amount: int.tryParse(r['amount']?.toString() ?? '0') ?? 0,
                    date: r['date']?.toString() ?? '',
                    status: status,
                  ));
                }
              }
            }

            if (points != null && steps != null && co2Saved != null) {
              debugPrint('WebCommunication: Received SYNC_STATE from React. Points: $points, Steps: $steps, CO2: $co2Saved, CompletedChallenges: $completedChallenges, RefundHistoryCount: ${refundHistory.length}');
              _appState?.syncState(points, steps, co2Saved, completedChallenges, refundHistory);
            }
          }
        } catch (e) {
          debugPrint('WebCommunication_Error: Failed to process incoming message: $e');
        }
      }
    });
  }

  // 부모 창(React)으로 메시지 전송
  static void send(String type, Map<String, dynamic> payload) {
    if (!kIsWeb) {
      debugPrint('WebCommunication: Skipping send on non-web platform. Message: $type');
      return;
    }

    try {
      final Map<String, dynamic> message = {
        'type': type,
        ...payload,
      };

      // postMessage를 이용해 부모 창으로 전송 (JSON string으로 전송하여 호환성 보장)
      final String jsonStr = jsonEncode(message);
      html.window.parent?.postMessage(jsonStr, '*');
      debugPrint('WebCommunication: Sent message to parent: $jsonStr');
    } catch (e) {
      debugPrint('WebCommunication_Error: Failed to send message to parent: $e');
    }
  }
}
