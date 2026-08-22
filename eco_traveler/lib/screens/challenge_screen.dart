import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/app_state.dart';

class ChallengeScreen extends StatefulWidget {
  const ChallengeScreen({super.key});

  @override
  State<ChallengeScreen> createState() => _ChallengeScreenState();
}

class _ChallengeScreenState extends State<ChallengeScreen> {
  // 선택한 이미지 XFile 상태 변수
  XFile? _selectedImage;
  // 선택한 이미지의 바이너리 바이트 정보 (Web/Mobile 하이브리드 호환용)
  Uint8List? _imageBytes;
  // 이미지 파일명 및 임시 로컬 파일 경로 저장
  String? _imagePath;
  String? _imageName;

  // 인증할 활성 챌린지 ID
  int? _activeChallengeId;

  // 가상 챌린지 목록 데이터
  final List<Map<String, dynamic>> _challenges = [
    {
      'id': 1,
      'title': '🥤 텀블러/다회용기 미션',
      'description': '카페에서 개인 텀블러를 사용하여 음료 주문하기',
      'reward': 500,
      'co2': 0.15,
    },
    {
      'id': 2,
      'title': '🚌 대중교통 이용 인증',
      'description': '버스 또는 지하철 하차 태그 후 보행 연계하기',
      'reward': 800,
      'co2': 0.35,
    },
    {
      'id': 3,
      'title': '🗑️ 에코 플로깅 (줍깅) 인증',
      'description': '관광지 주변에서 쓰레기 줍고 쓰레기통 인증하기',
      'reward': 1000,
      'co2': 0.50,
    },
  ];

  Future<void> _pickImage(ImageSource source) async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 600,
        maxHeight: 600,
        imageQuality: 80,
      );

      if (pickedFile != null) {
        final Uint8List bytes = await pickedFile.readAsBytes();
        setState(() {
          _selectedImage = pickedFile;
          _imageBytes = bytes;
          _imagePath = pickedFile.path;
          _imageName = pickedFile.name;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('📸 이미지를 불러왔습니다: ${pickedFile.name}'),
              backgroundColor: Colors.green[800],
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ 이미지 선택 실패: $e'),
            backgroundColor: Colors.red[800],
          ),
        );
      }
    }
  }

  void _showImageSourceBottomSheet(BuildContext context, int challengeId) {
    setState(() {
      _activeChallengeId = challengeId;
    });

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF131D1A), // 다크 에코 테마 배경
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (BuildContext bc) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  '📸 인증 사진 업로드',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  '미션 성공 여부를 확인하기 위해 사진을 등록해 주세요.',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ListTile(
                  leading: const Icon(Icons.camera_alt_outlined, color: Colors.greenAccent),
                  title: const Text('카메라로 직접 촬영하기', style: TextStyle(fontSize: 14)),
                  onTap: () {
                    Navigator.of(context).pop();
                    _pickImage(ImageSource.camera);
                  },
                ),
                const Divider(color: Colors.white10, height: 1),
                ListTile(
                  leading: const Icon(Icons.photo_library_outlined, color: Colors.greenAccent),
                  title: const Text('갤러리에서 사진 선택하기', style: TextStyle(fontSize: 14)),
                  onTap: () {
                    Navigator.of(context).pop();
                    _pickImage(ImageSource.gallery);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _submitVerification(AppState appState) {
    if (_activeChallengeId == null || _selectedImage == null) return;

    final challenge = _challenges.firstWhere((c) => c['id'] == _activeChallengeId);
    final int points = challenge['reward'];
    final double co2 = challenge['co2'];

    // 포인트 및 탄소 절감 갱신
    appState.addPoints(points, co2);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🎉 인증 성공! +$points 에코포인트 적립 완료! (${co2}kg CO₂ 저감)'),
        backgroundColor: Colors.green[800],
      ),
    );

    setState(() {
      _selectedImage = null;
      _imageBytes = null;
      _imagePath = null;
      _imageName = null;
      _activeChallengeId = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            '🌱 일상 속 친환경 에코 챌린지',
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 16),

          // 챌린지 항목 리스트
          ..._challenges.map((c) {
            final int id = c['id'];
            final String title = c['title'];
            final String desc = c['description'];
            final int reward = c['reward'];
            final double co2 = c['co2'];

            final bool isCurrentActive = _activeChallengeId == id;

            return Card(
              color: Colors.white.withOpacity(0.02),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isCurrentActive ? Colors.greenAccent.withOpacity(0.4) : Colors.white.withOpacity(0.04),
                  width: isCurrentActive ? 1.5 : 1,
                ),
              ),
              margin: const EdgeInsets.only(bottom: 16),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
                        Chip(
                          backgroundColor: Colors.greenAccent.withOpacity(0.1),
                          label: Text('+$reward P', style: const TextStyle(color: Colors.greenAccent, fontSize: 10, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(desc, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 6),
                    Text('탄소 절감 효과: ${co2}kg CO₂', style: const TextStyle(fontSize: 10, color: Colors.cyanAccent)),
                    const Divider(color: Colors.white10, height: 24),

                    // 이미지 프리뷰 오버레이가 들어갈 영역
                    if (isCurrentActive && _selectedImage != null)
                      Center(
                        child: Column(
                          children: [
                            Stack(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.network(
                                    _selectedImage!.path,
                                    width: 200,
                                    height: 150,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Container(
                                        width: 200,
                                        height: 150,
                                        decoration: BoxDecoration(
                                          color: Colors.grey[900],
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Icon(Icons.image_not_supported, size: 50, color: Colors.grey),
                                      );
                                    },
                                  ),
                                ),
                                Positioned(
                                  top: 4,
                                  right: 4,
                                  child: GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _selectedImage = null;
                                        _imageBytes = null;
                                        _imagePath = null;
                                        _imageName = null;
                                      });
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(
                                        color: Colors.black54,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.close,
                                        color: Colors.white,
                                        size: 16,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '임시 파일 경로: ${_imagePath ?? ""}',
                              style: const TextStyle(fontSize: 9, color: Colors.grey, fontFamily: 'monospace'),
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: () => _showImageSourceBottomSheet(context, id),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.white,
                                    side: const BorderSide(color: Colors.white24),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  icon: const Icon(Icons.sync, size: 14),
                                  label: const Text('다시 선택', style: TextStyle(fontSize: 11)),
                                ),
                                const SizedBox(width: 12),
                                ElevatedButton.icon(
                                  onPressed: () => _submitVerification(appState),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.greenAccent,
                                    foregroundColor: Colors.black,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  icon: const Icon(Icons.check, size: 14),
                                  label: const Text('인증 제출하기', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      )
                    else
                      // 사진 인증 유도 버튼
                      ElevatedButton.icon(
                        onPressed: () => _showImageSourceBottomSheet(context, id),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white.withOpacity(0.04),
                          foregroundColor: Colors.greenAccent,
                          minimumSize: const Size(double.infinity, 42),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.greenAccent.withOpacity(0.15)),
                          ),
                        ),
                        icon: const Icon(Icons.camera_alt_outlined, size: 18),
                        label: const Text('사진 촬영 및 인증 제출', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                  ],
                ),
              ),
            );
          }).toList(),
          ],
        ),
      );
  }
}
