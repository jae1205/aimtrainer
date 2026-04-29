# ValoSens

> 발로란트 플레이어를 위한 감도 진단 시뮬레이션

인게임 감도가 실제 플레이 스타일에 맞는지 3단계 3D 시뮬레이션으로 측정하고, 현재 감도 기준 조정 방향을 제안합니다.

---

## Overview

일반적인 에임 트레이너와 달리 **발로란트의 실제 교전 패턴** (멈추고 쏘기, 코너 피킹, 플릭)에 특화된 시나리오로 구성되어 있습니다.
수집된 측정값은 고정 기준이 아닌 **입력한 현재 eDPI를 기준으로 상대적 조정값**을 계산하는 데 사용됩니다.

---

## Features

| 기능 | 설명 |
|---|---|
| 감도 설정 모달 | DPI 프리셋 + 인게임 감도 입력, eDPI · cm/360° 실시간 미리보기, 7단계 감도 수준 분류 |
| Test 1 · 360° 회전 정밀도 | 마커 배치 후 360° 회전 귀환 정확도 측정 — 각도 편차(°)로 감도 제어력 정량화 |
| Test 2 · 코너 플릭킹 | 좌우 교대 등장 타겟 플릭, 30초 세션 — 오버슈트/언더슈트 비율로 감도 방향 분석 |
| Test 3 · 탭샷 | 20개 정지 타겟, 타겟당 1.5초 제한 — 탭샷 정확도(%)와 평균 반응속도(ms) 측정 |
| 결과 리포트 | 3개 테스트 데이터 종합, 현재 vs 추천 감도 비교, 변화량 뱃지 및 조정 방향 메시지 |
| WASD 이동 | Test 2·3에서 자유 이동 가능, 이동 중 히트 판정 무효 처리 (Test 1은 고정) |
| 테마 | 라이트 / 다크 / 시스템 연동 |

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
├── App.jsx                 # 라우팅 (/, /test1, /test2, /test3, /result)
├── index.css               # Tailwind + Valorant 디자인 토큰
├── pages/
│   ├── Home.jsx            # 랜딩 + 감도 설정 모달 (SetupModal)
│   ├── Test1.jsx           # 360° 회전 정밀도 테스트
│   ├── Test2.jsx           # 코너 플릭킹 테스트
│   ├── Test3.jsx           # 탭샷 테스트
│   └── Result.jsx          # 결과 리포트 + 감도 추천
└── components/
    ├── Layout.jsx          # 공통 헤더 / 푸터 / 테마 토글
    ├── RotationSim.jsx     # 360° 회전 시뮬레이션 — 각도 편차 계산 포함
    ├── FlickingSim.jsx     # 코너 플릭킹 시뮬레이션 — 오버/언더슈트 분석
    └── TrackingSim.jsx     # 탭샷 시뮬레이션 — 반응속도 측정
```

---

## Sensitivity Recommendation Logic

세 테스트 결과를 가중합산하여 현재 발로란트 감도에서 상대 조정값을 계산합니다.

```
adjustedSens = currentValorantSens

# Test 1 — 각도 편차 > 30° → 제어 불안정으로 판단, 감도 8% 하향
if deviationDeg > 30         → × 0.92

# Test 2 — 오버/언더슈트 비율 우세 시 방향 조정
if overshoot 우세            → × 0.90
if undershoot 우세           → × 1.10
if accuracy > 80%            → × 1.02   # 여유 있음, 소폭 상향 가능
if accuracy < 50%            → × 0.95

# Test 3 — 탭샷 정확도 + 반응속도 종합
if accuracy > 75% && rt < 500ms → × 1.03
if accuracy < 50%               → × 0.95

recommendedSens = clamp(adjustedSens, 0.1, 10)
```

> 추천값은 출발점입니다. 실전 몇 판 후 개인 기준으로 미세 조정을 권장합니다.

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

## Architecture Diagram

<img width="1376" height="768" alt="image" src="https://github.com/user-attachments/assets/f759b049-fa5a-467d-8af4-0fb670635767" />


---

## Data Persistence

테스트 설정값과 결과는 `localStorage`에 저장됩니다. 재시작 시 전체 초기화됩니다.

```
localStorage keys:
  userSetup     — { dpi, valorantSens, eDPI }
  userSensitivity
  test1Data / test2Data / test3Data
```
