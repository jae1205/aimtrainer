# AimForge

> FPS 플레이어를 위한 에임 트레이닝 시뮬레이터

3D 환경에서 다양한 훈련 드릴을 통해 에임 능력을 측정하고, 현재 감도 기준 조정 방향을 제안합니다.

---

## Overview

일반적인 에임 트레이너와 달리 **실제 FPS 교전 패턴** (트래킹, 플릭킹, 탭샷)에 특화된 시나리오로 구성되어 있습니다.
수집된 측정값은 고정 기준이 아닌 **입력한 현재 eDPI를 기준으로 상대적 조정값**을 계산하는 데 사용됩니다.

---

## Features

| 기능 | 설명 |
|---|---|
| 감도 설정 모달 | DPI 프리셋 + 인게임 감도 입력, eDPI · cm/360° 실시간 미리보기, 7단계 감도 수준 분류 |
| 훈련 목록 | 드릴 카드 목록에서 원하는 훈련을 선택해 바로 시작 |
| Test 1 · 스키트 트래킹 | 좌우 벽에서 호를 그리며 날아오는 타겟을 크로스헤어로 추적 — HP 드레인 방식으로 정확도 측정 |
| 테마 | 라이트 / 다크 / 시스템 연동 |
| 다국어 | 한국어 / English 전환 지원 |

---

## Tech Stack

- **Frontend** — React 18, React Router v7
- **3D** — Three.js, @react-three/fiber, @react-three/drei
- **Styling** — Tailwind CSS v4
- **Build** — Vite 6

---

## Project Structure

```
src/
├── App.jsx                     # 라우팅 (/, /drills, /test1~3, /result)
├── index.css                   # Tailwind + 디자인 토큰
├── contexts/
│   └── LanguageContext.jsx     # 다국어 컨텍스트 (ko / en)
├── utils/
│   ├── i18n.js                 # 한국어·영어 번역 텍스트
│   └── sounds.js               # Web Audio API 효과음
├── pages/
│   ├── Home.jsx                # 랜딩 + 감도 설정 모달
│   ├── DrillList.jsx           # 훈련 목록 페이지
│   └── Test1.jsx               # 스키트 트래킹 테스트
└── components/
    ├── Layout.jsx              # 공통 헤더 / 테마 토글
    ├── SkeetTrackingSim.jsx    # 스키트 트래킹 시뮬레이션
    ├── RotationSim.jsx         # 360° 회전 시뮬레이션
    ├── GunViewModel.jsx        # 1인칭 건 뷰모델
    └── Crosshair.jsx           # 크로스헤어 오버레이
```

---

## eDPI Sensitivity Tiers

| eDPI | 수준 |
|---|---|
| ~ 99 | 초저감도 |
| 100 ~ 183 | 저감도 |
| 184 ~ 267 | 중저감도 |
| 268 ~ 351 | 중감도 |
| 352 ~ 435 | 중고감도 |
| 436 ~ 519 | 고감도 |
| 520 ~ | 초고감도 |

---

## Getting Started

```bash
npm install
npm run dev
```

```bash
# 프로덕션 빌드
npm run build
npm run preview
```

---

## Data Persistence

테스트 설정값과 결과는 `localStorage`에 저장됩니다. 재시작 시 전체 초기화됩니다.

```
localStorage keys:
  userSetup     — { dpi, valorantSens, eDPI }
  userSensitivity
  test1Data / test2Data / test3Data
```
