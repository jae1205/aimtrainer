# AimForge

FPS 플레이어를 위한 브라우저 기반 에임 트레이닝 앱입니다. 현재 앱은 스키트 트래킹 훈련에 집중하며, DPI와 인게임 감도를 기준으로 eDPI와 cm/360을 계산해 훈련 감도를 일관되게 맞춥니다.

## 현재 기능

- 스키트 트래킹: 호를 그리며 움직이는 타겟을 크로스헤어로 추적해 체력을 깎는 60초 훈련
- 감도 설정: DPI, 인게임 감도, eDPI, cm/360, 감도 수준 표시
- 커스텀 훈련 옵션: 공 색상, 크기, 개수, 궤적 높이 조정
- 결과 측정: 처치 수, 정확도, 누적 대미지, 평균 TTK, 총점
- 설정 패널: 한국어/영어, 라이트/다크/시스템 테마, 조준선, 효과음 볼륨
- Vercel 배포: `main` 브랜치 push 시 프로덕션 배포

## 기술 스택

- React 18
- React Router
- Three.js
- @react-three/fiber
- @react-three/drei
- Tailwind CSS v4
- Vite
- Vercel Analytics

## 프로젝트 구조

```text
src/
  App.jsx                         # 라우팅: /, /drills, /test1
  main.jsx                        # React entrypoint + Vercel Analytics
  index.css                       # Tailwind import + global styles
  components/
    Crosshair.jsx                 # 조준선 렌더링과 프리셋
    GunViewModel.jsx              # 1인칭 총 모델
    Layout.jsx                    # 공통 헤더, 푸터, 설정 패널
    SkeetTrackingSim.jsx          # 스키트 트래킹 3D 시뮬레이션
  contexts/
    LanguageContext.jsx           # 언어 상태와 번역 공급
  pages/
    DrillList.jsx                 # 훈련 목록
    Home.jsx                      # 홈 화면과 초기 감도 설정
    Test1.jsx                     # 스키트 트래킹 페이지와 HUD
  utils/
    i18n.js                       # 화면 번역 문자열
    sounds.js                     # Web Audio 효과음
public/
  Fps Rig.glb                     # 총 모델
  aimforge.svg                    # favicon
```

## 로컬 실행

```bash
npm install
npm run dev
```

프로덕션 빌드는 Vercel과 같은 명령을 사용합니다.

```bash
npm run build
npm run preview
```

코드 점검은 다음 명령으로 합니다.

```bash
npm run lint
```

## 배포

Vercel 설정은 `vercel.json`에 명시되어 있습니다.

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
- SPA rewrite: 모든 경로를 `/index.html`로 rewrite

일반 작업 흐름은 `dev`에서 작업한 뒤 `main`으로 반영하는 방식입니다.

## 로컬 저장 데이터

브라우저 `localStorage`에 다음 값이 저장됩니다.

```text
lang
themeMode
crosshairType
soundVolume
userSetup        # { dpi, valorantSens, eDPI }
userSensitivity
test1Data
```
