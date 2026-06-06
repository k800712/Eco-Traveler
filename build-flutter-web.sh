#!/bin/bash
# 에러 발생 시 즉시 중단
set -e

# 프로젝트 루트 경로 확보
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "--------------------------------------------------"
echo "📦 1. Flutter Web 빌드 구동 중..."
echo "--------------------------------------------------"
cd "$PROJECT_ROOT/eco_traveler"
flutter build web --release

echo "--------------------------------------------------"
echo "🧹 2. React public/flutter_web 폴더 갱신..."
echo "--------------------------------------------------"
cd "$PROJECT_ROOT"
rm -rf public/flutter_web
mkdir -p public/flutter_web

echo "--------------------------------------------------"
echo "🚚 3. Flutter Web 빌드 산출물 복사 중..."
echo "--------------------------------------------------"
cp -R eco_traveler/build/web/ public/flutter_web/

echo "--------------------------------------------------"
echo "✅ 4. Flutter Web 뷰포트 배포 통합 성공!"
echo "--------------------------------------------------"
