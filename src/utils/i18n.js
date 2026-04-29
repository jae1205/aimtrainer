export const translations = {
  kr: {
    // Layout
    crosshairLabel: '조준선',
    soundLabel: '효과음',

    // Home – Setup Modal
    setupTitle: '마우스 설정을 입력해 주세요',
    setupDesc: '정확한 측정을 위해 현재 사용 중인 DPI와 인게임 감도를 입력해 주세요',
    mouseDPI: '마우스 DPI',
    customInput: '직접 입력',
    inGameSens: '인게임 감도',
    level: '수준',
    sensLevels: ['초저감도', '저감도', '중저감도', '중감도', '중고감도', '고감도', '초고감도'],
    startTestBtn: '훈련 시작하기',

    // Home – Hero
    badge: '에임 트레이닝 플랫폼',
    heroLine1: '지금 당신의',
    heroLine2: '에임을',
    heroLine3: '다음 레벨로',
    heroSubtitle: '플리킹, 회전 제어, 탭샷 — 3가지 훈련으로\n에임의 약점을 찾고 빠르게 실력을 끌어올리세요.',
    freeDuration: '무료 · 3분 소요',

    // Home – Test cards
    testsLabel: '훈련 구성',
    testsHeading: '3가지 핵심 에임 훈련',
    test1Title: '360° 회전 제어',
    test1Desc: '아무 곳이나 클릭 후 오른쪽으로 360° 회전하고 같은 지점으로 돌아옵니다. 각도 편차로 회전 정밀도를 측정합니다.',
    test1Tag: '회전 제어',
    test2Title: '코너 플릭킹',
    test2Desc: '좌우로 튀어나오는 타겟을 빠르게 플릭합니다. 오버슈트/언더슈트 경향을 분석합니다.',
    test2Tag: '플릭 에임',
    test3Title: '정지 타겟 탭샷',
    test3Desc: '제한 시간 내 20개 타겟을 클릭합니다. 탭샷 정확도와 반응속도를 동시에 측정합니다.',
    test3Tag: '탭샷 속도',

    // Home – Features section
    featuresLabel: '왜 AimForge인가',
    featuresHeading: '과학적인 에임 분석',
    feat1Title: '정밀한 데이터 분석',
    feat1Desc: '단순한 점수가 아닌 오버슈트·언더슈트·반응속도 등 세부 지표를 제공합니다.',
    feat2Title: '즉각적인 피드백',
    feat2Desc: '훈련이 끝나면 현재 감도가 내 플레이 스타일에 맞는지 바로 확인할 수 있습니다.',
    feat3Title: '완전 무료',
    feat3Desc: '설치 없이 브라우저에서 바로 시작하세요. 로그인도 필요 없습니다.',

    // Home – CTA
    ctaHeading: '지금 바로 시작해 보세요',
    ctaDesc: 'DPI와 인게임 감도만 있으면 바로 시작할 수 있습니다',
    ctaBtn: '에임 훈련 시작',

    // Sim – shared
    testStart: '테스트 시작',
    clickToLock: '화면을 클릭하여 마우스를 고정하세요',
    lockedHint: '마우스가 고정되었습니다. 조준하여 타겟을 클릭하세요. · ESC 키로 마우스 고정 해제',
    unlockedHint: '화면을 클릭하여 마우스를 고정하세요.',
    pressStartHint: '테스트 시작 버튼을 누르세요.',

    // RotationSim
    rotTitle: '360° 회전 테스트',
    rotDesc: '아무 곳이나 클릭 후 오른쪽으로 360° 회전하고 같은 지점으로 돌아옵니다. 각도 편차로 회전 정밀도를 측정합니다.',
    rotInst: '클릭으로 시작 지점을 찍고, 오른쪽으로 한 바퀴 돌아 같은 지점을 다시 클릭하세요.',
    rotHint1: '아무 곳이나 클릭해서 시작 지점을 찍으세요',
    rotHint2: '오른쪽으로 360° 회전 후 처음 지점을 다시 클릭하세요!',
    rotEsc: 'ESC 키로 마우스 고정 해제',

    // FlickingSim
    flickTitle: '플릭킹 테스트',
    flickDesc: '화면 곳곳에 나타나는 타겟을 빠르고 정확하게 클릭하는 능력을 측정합니다.',
    flickInst: '30초 동안 최대한 많은 타겟을 맞춰보세요.',
    flickCountdown: '3, 2, 1 카운트다운 이후에 타겟이 나타납니다.',
    recGood: '적절함',
    recGoodDetail: '현재 감도가 잘 맞습니다.',
    recLower: '감도 낮춤 추천',
    recLowerDetail: '타겟을 지나치는 경향(Overshoot)이 있어 감도를 조금 낮추는 것을 추천합니다.',
    recHigher: '감도 높임 추천',
    recHigherDetail: '타겟에 못 미치는 경향(Undershoot)이 있어 감도를 조금 높이는 것을 추천합니다.',

    // TrackingSim
    tapTitle: '탭샷 테스트',
    tapDesc: '나타나는 정지 타겟을 빠르게 조준하여 클릭하세요.',
    tapTimeHighlight: '0.5초',
    tapTimeSuffix: '후 사라집니다.',
    tapInfo: (n) => `총 ${n}개의 타겟 · 멈추고 쏘는 에임 방식을 시뮬레이션합니다.`,
    tapCountdown: '3, 2, 1 카운트다운 후 타겟이 나타납니다.',

    // Test pages – HUD
    currentMovement: '현재 이동량',
    currentStatus: '현재 현황',
    currentSensSettings: '현재 감도 설정',
    sensLabel: '감도',

    // Test1 sidebar
    t1Heading: '360° 회전 정밀도',
    t1Desc: '3D FPS 시점에서 360° 회전 후 원점에 정확히 돌아오는 능력을 측정합니다.',
    t1Step1: '1. 시작 지점을 클릭합니다.',
    t1Step2: '2. 360° 회전 후 다시 같은 지점을 바라봅니다.',
    t1Step3: '3. 클릭하면 편차가 측정됩니다.',
    t1Tip: '정확히 돌아올수록 각도 편차가 낮아집니다.',

    // Test2 sidebar
    t2Heading: '코너 플릭킹',
    t2Desc: '좌우 코너에서 피킹하는 타겟을 빠르게 클릭하세요.',
    t2Detail1: '· 타겟은 머리 높이 고정, 좌우 교대로 등장합니다.',
    t2Detail2: '· 30초 동안 오버슈트·언더슈트 경향을 분석합니다.',

    // Test3 sidebar
    t3Heading: '탭샷',
    t3Desc: '순간적으로 등장하는 정지 타겟을 빠르게 조준하여 클릭하세요.',
    t3Detail1: '· 총 20개 타겟, 각 0.5초 제한.',
    t3Detail2: '· 멈추고 쏘는 탭샷 에임 정밀도와 반응속도를 측정합니다.',

    // Result
    resultBadge: '훈련 완료',
    resultHeading: '결과 리포트',
    resultDesc: '세 가지 훈련 데이터를 종합해서 현재 감도와 플레이 스타일의 궁합을 정리했습니다.',
    testSensLabel: '테스트 감도',
    valoSensLabel: '인게임 감도',
    rotMetric: '360° 회전 시 마우스 이동량',
    deviationBadge: (deg) => `각도 편차 ${deg}°`,
    netScore: (s, m, d) => `Hit ${s} · Miss ${m} · 순점수 ${d}`,
    tapAccuracy: (h, total) => `정지 타겟 탭샷 정확도 (${h} / ${total})`,
    avgReaction: (ms) => `평균 반응속도 ${ms}ms`,
    flickAnalysis: '플릭킹 정밀 분석:',
    sensRecommend: '감도 추천',
    currentSensCard: '현재 감도',
    recommendedSensCard: '추천 감도',
    deltaGood: '현재 감도가 테스트 결과와 잘 맞습니다.',
    deltaLower: (d) => `감도를 ${d} 낮추세요. 오버슈트 또는 제어 불안정 경향이 있습니다.`,
    deltaHigher: (d) => `감도를 ${d} 높이세요. 언더슈트 또는 반응 여유가 있습니다.`,
    disclaimer: '현재 테스트 데이터 기준 추정값입니다. 실제 게임에서 몇 판 플레이하며 미세 조정해 보세요.',
    restart: '처음부터 다시 훈련하기',
    levelLabels: { high: '상', mid: '중', low: '하' },

    // Test 2 completion overlay
    t2CompleteBadge: 'Test 2 완료',
    t2Hits: '히트',
    t2Accuracy: '정확도',
    t2Miss: '미스',
    t2Next: '다음 훈련 →',
  },

  en: {
    // Layout
    crosshairLabel: 'Crosshair',
    soundLabel: 'Sound',

    // Home – Setup Modal
    setupTitle: 'Enter your mouse settings',
    setupDesc: 'Enter your current DPI and in-game sensitivity for accurate results',
    mouseDPI: 'Mouse DPI',
    customInput: 'Custom',
    inGameSens: 'In-Game Sens',
    level: 'Level',
    sensLevels: ['Ultra Low', 'Low', 'Low-Med', 'Medium', 'Med-High', 'High', 'Ultra High'],
    startTestBtn: 'Start Training',

    // Home – Hero
    badge: 'Aim Training Platform',
    heroLine1: 'Take your',
    heroLine2: 'aim',
    heroLine3: 'to the next level',
    heroSubtitle: 'Flicking, rotation control, and tap-shot — 3 drills to find your weaknesses and level up your aim fast.',
    freeDuration: 'Free · 3 min',

    // Home – Test cards
    testsLabel: 'Training Modules',
    testsHeading: '3 Core Aim Drills',
    test1Title: '360° Rotation Control',
    test1Desc: 'Click anywhere, rotate 360° right, and return to the same spot. Measures angular deviation and rotation consistency.',
    test1Tag: 'Rotation Control',
    test2Title: 'Corner Flicking',
    test2Desc: 'Quickly flick to targets peeking left and right. Analyzes overshoot and undershoot tendencies.',
    test2Tag: 'Flick Aim',
    test3Title: 'Static Target Tap-Shot',
    test3Desc: 'Click 20 targets within the time limit. Measures tap-shot accuracy and reaction speed simultaneously.',
    test3Tag: 'Tap-Shot Speed',

    // Home – Features section
    featuresLabel: 'Why AimForge',
    featuresHeading: 'Science-backed aim analysis',
    feat1Title: 'Precise Data Analysis',
    feat1Desc: 'Beyond just a score — get detailed metrics on overshoot, undershoot, and reaction time.',
    feat2Title: 'Instant Feedback',
    feat2Desc: 'See exactly whether your sensitivity fits your playstyle as soon as the drill ends.',
    feat3Title: 'Completely Free',
    feat3Desc: 'No install, no login. Just open your browser and start training.',

    // Home – CTA
    ctaHeading: 'Start right now',
    ctaDesc: 'All you need is your DPI and in-game sensitivity',
    ctaBtn: 'Start Aim Training',

    // Sim – shared
    testStart: 'Start Test',
    clickToLock: 'Click the screen to lock your mouse',
    lockedHint: 'Mouse locked. Aim and click the target. · Press ESC to unlock',
    unlockedHint: 'Click the screen to lock your mouse.',
    pressStartHint: 'Press the Start button.',

    // RotationSim
    rotTitle: '360° Rotation Test',
    rotDesc: 'Click anywhere, rotate 360° right, and return to the same spot. Measures angular deviation.',
    rotInst: 'Click to set your start point, rotate right one full turn, then click the same spot again.',
    rotHint1: 'Click anywhere to set your start point',
    rotHint2: 'Rotate 360° right and click the starting spot again!',
    rotEsc: 'Press ESC to unlock mouse',

    // FlickingSim
    flickTitle: 'Flicking Test',
    flickDesc: 'Measures your ability to quickly and accurately click targets around the screen.',
    flickInst: 'Hit as many targets as you can in 30 seconds.',
    flickCountdown: 'Targets appear after the 3, 2, 1 countdown.',
    recGood: 'Good',
    recGoodDetail: 'Your current sensitivity feels well-tuned.',
    recLower: 'Lower Sensitivity',
    recLowerDetail: 'You tend to overshoot. Consider lowering your sensitivity slightly.',
    recHigher: 'Raise Sensitivity',
    recHigherDetail: 'You tend to undershoot. Consider raising your sensitivity slightly.',

    // TrackingSim
    tapTitle: 'Tap-Shot Test',
    tapDesc: 'Quickly aim and click static targets as they appear.',
    tapTimeHighlight: '0.5s',
    tapTimeSuffix: 'before disappearing.',
    tapInfo: (n) => `${n} targets total · Simulates the stop-and-shoot tap-shot style.`,
    tapCountdown: 'Targets appear after the 3, 2, 1 countdown.',

    // Test pages – HUD
    currentMovement: 'Movement',
    currentStatus: 'Status',
    currentSensSettings: 'Sensitivity',
    sensLabel: 'Sens',

    // Test1 sidebar
    t1Heading: '360° Rotation Precision',
    t1Desc: 'Measures how accurately you return to origin after a 360° rotation in a 3D FPS view.',
    t1Step1: '1. Click to set your start point.',
    t1Step2: '2. Rotate 360° and face the same direction.',
    t1Step3: '3. Click — your angular deviation is recorded.',
    t1Tip: 'The more accurate your return, the lower the deviation.',

    // Test2 sidebar
    t2Heading: 'Corner Flicking',
    t2Desc: 'Quickly click targets peeking from left and right corners.',
    t2Detail1: '· Targets are head-height, alternating left and right.',
    t2Detail2: '· Overshoot/undershoot tendencies analyzed over 30 seconds.',

    // Test3 sidebar
    t3Heading: 'Tap-Shot',
    t3Desc: 'Quickly aim and click static targets that appear instantly.',
    t3Detail1: '· 20 targets total, 0.5s limit each.',
    t3Detail2: "· Measures stop-and-shoot tap-shot precision and reaction time.",

    // Result
    resultBadge: 'Training Complete',
    resultHeading: 'Results Report',
    resultDesc: 'Your three drill results combined to evaluate how well your sensitivity fits your playstyle.',
    testSensLabel: 'Test Sensitivity',
    valoSensLabel: 'In-Game Sens',
    rotMetric: 'Mouse movement per 360°',
    deviationBadge: (deg) => `Deviation ${deg}°`,
    netScore: (s, m, d) => `Hit ${s} · Miss ${m} · Net ${d}`,
    tapAccuracy: (h, total) => `Tap-shot accuracy (${h} / ${total})`,
    avgReaction: (ms) => `Avg reaction ${ms}ms`,
    flickAnalysis: 'Flicking Analysis:',
    sensRecommend: 'Sensitivity Recommendation',
    currentSensCard: 'Current',
    recommendedSensCard: 'Recommended',
    deltaGood: 'Your sensitivity is well-matched to your test results.',
    deltaLower: (d) => `Lower your sensitivity by ${d}. You tend to overshoot or have unstable control.`,
    deltaHigher: (d) => `Raise your sensitivity by ${d}. You tend to undershoot or have room to react faster.`,
    disclaimer: 'This is an estimate based on your drill data. Fine-tune over a few games.',
    restart: 'Restart from the beginning',
    levelLabels: { high: 'High', mid: 'Mid', low: 'Low' },

    // Test 2 completion overlay
    t2CompleteBadge: 'Test 2 Complete',
    t2Hits: 'hits',
    t2Accuracy: 'Accuracy',
    t2Miss: 'Miss',
    t2Next: 'Next Drill →',
  },
}
