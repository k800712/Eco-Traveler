### [개발 현황 보고서] 에코-트래블러 (Eco-Traveler) 프로젝트 종합 명세
*   **작성 일자** : 2026년 5월 27일
*   **작성 대상** : 친환경 대중교통 관광 머니백 플랫폼 '에코-트래블러' 1단계 프로토타입 구현 현황

#### 1. 프로젝트 개요
*   **기본 컨셉** : 고유가 시대 자차 여행객의 대중교통 전환을 유도하고, 이로 인해 절감되는 실질 주행 비용을 계산하여 지역 관광 활성화 포인트(에코머니)로 환급해 주는 플랫폼.
*   **주요 타겟** : 뚜벅이 여행객, 대중교통 전환 자차 여행객, 배리어프리(무장애) 관광 요구 고객.

#### 2. 기술 스택 및 개발 환경
*   **Frontend Framework** : Flutter 3.29.2 (Stable Channel) / Dart 3.7.2
*   **State Management** : ChangeNotifierProvider
*   **Target Platform** : Flutter Web (Chrome 브라우저 구동 모드)
*   **UI/UX 디자인** : 다크 모드 기반의 에코 그린/에메랄드/앰버 네온 테마 구현. 데스크톱 접속 시 실제 iPhone 크기 래퍼로 렌더링.

#### 3. 핵심 비즈니스 로직
앱의 비즈니스 로직 및 리워드 계산 모델(`lib/models/eco_calculator.dart`)에 탑재된 수식 명세 적용 (상세 로직은 GUIDELINE.md 참조).

#### 4. 아키텍처 및 구현 파일 명세
모든 소스코드는 `eco_traveler/lib` 경로 하위에 구조화되어 설계됨.
*   `lib/main.dart` : 앱의 진입점, 글로벌 Provider 등록 및 모바일 프레임 쉘 구성
*   `lib/models/eco_calculator.dart` : 자차비용, 등급 리워드, 보너스 머니백 연산 모델
*   `lib/providers/app_state.dart` : 전역 상태 관리 (포인트 적립액, 누적 탄소 절감량, 환급 이력 등)
*   `lib/services/mock_services.dart` : 오피넷 실시간 유가, TourAPI 정보, Gemini AI 추천 어드바이스 모킹
*   `lib/screens/dashboard_screen.dart` : 대시보드 탭 구현
*   `lib/screens/map_screen.dart` : 에코 맵 탭 구현
*   `lib/screens/butler_screen.dart` : AI 버틀러 탭 구현
*   `lib/screens/refund_screen.dart` : 정산 탭 구현
*   `test/eco_calculator_test.dart` : 산출 공식 무결성 검증 3대 핵심 단위 테스트 코드

#### 5. 세부 화면별 구현 기능
1.  **대시보드** : 소셜 간편 로그인(Google, Kakao, Naver) 연출, 연비 조절기, 가상 소나무 식재 게이지 비주얼 구현(0.1kg CO2 당 1그루).
2.  **에코 맵** : 관광 스팟 인터랙티브 마커 연출, 자차 대비 대중교통 요금 명세서 출력.
3.  **AI 에코 버틀러** : 목적지, 날씨, 혼잡도를 기반으로 한 Gemini AI 텍스트 어드바이스 생성, TourAPI 배리어프리/지역 축제 정보 출력.
4.  **머니백 정산 및 샵** : 계좌 정보 폼 및 최근 환급 이력 트래킹 위젯(환급 시 3초 후 이체완료 자동 변환 연출).
