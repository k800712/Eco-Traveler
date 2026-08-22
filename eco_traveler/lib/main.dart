import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/foundation.dart';
import 'package:universal_html/html.dart' as html;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'providers/app_state.dart';
import 'services/web_communication.dart';
import 'screens/dashboard_screen.dart';
import 'screens/map_screen.dart';
import 'screens/butler_screen.dart';
import 'screens/challenge_screen.dart';
import 'screens/refund_screen.dart';

Future<void> main() async {
  // 앱 실행 전 바인딩 초기화
  WidgetsFlutterBinding.ensureInitialized();
  
  // .env 로드
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    debugPrint("Warning: Could not load .env file: $e");
  }

  // Google Maps SDK 동적 주입 (Web 타겟일 때만)
  if (kIsWeb) {
    try {
      final String? mapsKey = dotenv.env['GOOGLE_MAPS_API_KEY'];
      if (mapsKey != null && mapsKey.isNotEmpty) {
        final existingScript = html.document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript == null) {
          final html.ScriptElement script = html.ScriptElement()
            ..src = 'https://maps.googleapis.com/maps/api/js?key=$mapsKey'
            ..type = 'text/javascript';
          html.document.head?.append(script);
          debugPrint("Google Maps SDK script injected successfully.");
        }
      }
    } catch (e) {
      debugPrint("Error injecting Google Maps SDK: $e");
    }
  }

  // Supabase 초기화
  try {
    await Supabase.initialize(
      url: dotenv.env['SUPABASE_URL'] ?? '',
      anonKey: dotenv.env['SUPABASE_ANON_KEY'] ?? '',
    );
  } catch (e) {
    debugPrint("Warning: Could not initialize Supabase: $e");
  }
  
  // 파이어베이스 연동 및 기타 초기화가 실제 키 없이도 통과하도록 연출
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) {
          final state = AppState();
          WebCommunication.init(state);
          return state;
        }),
      ],
      child: const EcoTravelerApp(),
    ),
  );
}

class EcoTravelerApp extends StatelessWidget {
  const EcoTravelerApp({super.key});

  Widget _buildHomeScreen() {
    if (kIsWeb) {
      try {
        if (html.window.self != html.window.top) {
          return const MapScreen();
        }
      } catch (_) {
        return const MapScreen();
      }
    }
    return const DesktopLayoutWrapper(
      child: MainShellScreen(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '에코 트래블러 (Eco-Traveler)',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF070B0A), // 매우 깊은 어두운 그린 다크 모드
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),       // 에메랄드 그린
          secondary: Color(0xFF06B6D4),     // 시안 블루
          surface: Color(0xFF131D1A),       // 깊은 카드 배경
          background: Color(0xFF070B0A),
        ),
        cardTheme: CardTheme(
          color: const Color(0xFF131D1A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          elevation: 2,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.black26,
          labelStyle: const TextStyle(color: Colors.grey, fontSize: 13),
          floatingLabelStyle: const TextStyle(color: Color(0xFF10B981)),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Colors.white10),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF10B981)),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0D1513),
          elevation: 0,
          centerTitle: true,
        ),
      ),
      home: _buildHomeScreen(),
    );
  }
}

// 웹/데스크톱 뷰포트에서 스마트폰 모양 목업 프레임을 형성해주는 래퍼 위젯
class DesktopLayoutWrapper extends StatelessWidget {
  final Widget child;
  const DesktopLayoutWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    // 가로 크기를 감지하여 데스크톱 브라우저인 경우 중앙에 폰 모양으로 고정
    double screenWidth = MediaQuery.of(context).size.width;
    double screenHeight = MediaQuery.of(context).size.height;
    
    if (screenWidth > 600) {
      return Scaffold(
        backgroundColor: const Color(0xFF020303),
        body: Center(
          child: Container(
            width: 412,
            height: screenHeight > 900 ? 892 : screenHeight * 0.95,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(40),
              border: Border.all(color: const Color(0xFF1C2422), width: 10),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black87,
                  blurRadius: 30,
                  offset: Offset(0, 15),
                )
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(30),
              child: child,
            ),
          ),
        ),
      );
    }
    
    return child;
  }
}

class MainShellScreen extends StatefulWidget {
  const MainShellScreen({super.key});

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const MapScreen(),
    const ButlerScreen(),
    const ChallengeScreen(),
    const RefundScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.spa, color: Color(0xFF10B981), size: 20),
            SizedBox(width: 6),
            Text(
              '에코-트래블러',
              style: TextStyle(
                fontWeight: FontWeight.bold, 
                fontSize: 16,
                letterSpacing: -0.5
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex,
          children: _screens,
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF0D1513),
        selectedItemColor: const Color(0xFF10B981),
        unselectedItemColor: Colors.grey,
        selectedFontSize: 11,
        unselectedFontSize: 11,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.explore),
            activeIcon: Icon(Icons.explore, color: Color(0xFF10B981)),
            label: '대시보드',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.map),
            activeIcon: Icon(Icons.map, color: Color(0xFF10B981)),
            label: '에코 맵',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.psychology),
            activeIcon: Icon(Icons.psychology, color: Color(0xFF10B981)),
            label: 'AI 버틀러',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.stars),
            activeIcon: Icon(Icons.stars, color: Color(0xFF10B981)),
            label: '에코 챌린지',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet),
            activeIcon: Icon(Icons.account_balance_wallet, color: Color(0xFF10B981)),
            label: '머니백/샵',
          ),
        ],
      ),
    );
  }
}
