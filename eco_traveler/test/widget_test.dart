import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:eco_traveler/main.dart';
import 'package:eco_traveler/providers/app_state.dart';

void main() {
  setUpAll(() {
    // dotenv 모의 로딩 수행
    dotenv.testLoad(fileInput: '''
OPINET_API_KEY=MOCK_OPINET_KEY_12345
TOUR_API_KEY=MOCK_TOUR_KEY_12345
GEMINI_API_KEY=MOCK_GEMINI_KEY_ABCDE
GOOGLE_MAPS_API_KEY=MOCK_GOOGLE_KEY_12345
BASE_FUEL_PRICE=1650.0
CAR_DEPRECIATION_RATE=120.0
''');
  });

  testWidgets('에코 트래블러 앱 초기 렌더링 테스트', (WidgetTester tester) async {
    // 테스트 화면 크기를 키워 레이아웃 Overflow 에러 방지
    tester.view.physicalSize = const Size(1200, 1920);
    tester.view.devicePixelRatio = 1.0;

    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    // Build our app and trigger a frame.
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AppState()),
        ],
        child: const EcoTravelerApp(),
      ),
    );

    // '에코-트래블러' 타이틀이 존재하는지 검증
    expect(find.text('에코-트래블러'), findsOneWidget);
  });
}
