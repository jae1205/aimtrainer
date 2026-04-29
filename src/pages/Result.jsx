import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useLanguage } from '../contexts/LanguageContext'

function Result() {
  const navigate = useNavigate()
  const [allData, setAllData] = useState({ test1: null, test2: null, test3: null })
  const [recommendedSens, setRecommendedSens] = useState(null)

  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system'
  })

  const resolveTheme = (mode) => {
    if (mode === 'system') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
      return 'light'
    }
    return mode
  }

  const theme = resolveTheme(themeMode)
  const dark = theme === 'dark'

  const userSetup = JSON.parse(
    localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}'
  )

  useEffect(() => {
    const test1Data = localStorage.getItem('test1Data')
    const test2Data = localStorage.getItem('test2Data')
    const test3Data = localStorage.getItem('test3Data')

    if (test1Data && test2Data && test3Data) {
      const data = {
        test1: JSON.parse(test1Data),
        test2: JSON.parse(test2Data),
        test3: JSON.parse(test3Data),
      }
      setAllData(data)
      calculateSensitivity(data)
    }
  }, [])

  useEffect(() => {
    const handleThemeChange = (e) => setThemeMode(e.detail)
    window.addEventListener('theme-change', handleThemeChange)
    return () => window.removeEventListener('theme-change', handleThemeChange)
  }, [])

  const calculateSensitivity = (data) => {
    const currentValorantSens = userSetup.valorantSens || 0.5
    const userDPI = userSetup.dpi || 800

    const deviationDeg = data.test1?.deviationDeg || 0
    const flickAccuracy = data.test2?.accuracy || 50
    const flickRecommendation = data.test2?.recommendation
    const tappingAccuracy = data.test3?.tappingAccuracy || 50
    const avgReactionTime = data.test3?.avgReactionTime || 600

    let adjustedSens = currentValorantSens

    if (deviationDeg > 30) adjustedSens *= 0.92
    if (flickRecommendation === 'lower') adjustedSens *= 0.90
    else if (flickRecommendation === 'higher') adjustedSens *= 1.10
    if (flickAccuracy > 80) adjustedSens *= 1.02
    else if (flickAccuracy < 50) adjustedSens *= 0.95
    if (tappingAccuracy > 75 && avgReactionTime < 500) adjustedSens *= 1.03
    else if (tappingAccuracy < 50) adjustedSens *= 0.95

    const recommendedValorantSens = Math.max(0.1, Math.min(10, adjustedSens))
    const recommendedEDPI = Math.round(recommendedValorantSens * userDPI)
    const delta = recommendedValorantSens - currentValorantSens

    setRecommendedSens({
      valorantSens: recommendedValorantSens.toFixed(2),
      dpi: userDPI,
      eDPI: recommendedEDPI,
      currentSens: currentValorantSens,
      currentEDPI: userSetup.eDPI,
      delta: delta.toFixed(2),
    })
  }

  const test2Score = allData.test2?.score ?? 0
  const test2Misses = allData.test2?.misses ?? 0
  const test2DiffRaw = test2Score - test2Misses
  const test2Diff = Math.max(0, Math.min(100, test2DiffRaw))

  const handleRestart = () => {
    localStorage.removeItem('test1Data')
    localStorage.removeItem('test2Data')
    localStorage.removeItem('test3Data')
    localStorage.removeItem('userSetup')
    localStorage.removeItem('userSensitivity')
    navigate('/')
  }

  const { t } = useLanguage()

  const recDisplay = (key) =>
    key === 'lower' ? t.recLower : key === 'higher' ? t.recHigher : t.recGood
  const recDetailDisplay = (key) =>
    key === 'lower' ? t.recLowerDetail : key === 'higher' ? t.recHigherDetail : t.recGoodDetail

  const test2Level =
    test2Diff >= 60 ? t.levelLabels.high :
    test2Diff >= 30 ? t.levelLabels.mid  : t.levelLabels.low

  const card = dark
    ? 'bg-[#1B2E3D] border-[#2A3D4F]'
    : 'bg-white border-[#DDD8D2]'
  const muted = dark ? 'text-[#768079]' : 'text-[#7A7E85]'
  const text = dark ? 'text-[#ECE8E1]' : 'text-[#1A1F2E]'

  return (
    <Layout isTestPage={true}>
      <div className={`w-full min-h-[calc(100vh-56px-48px)] py-12 px-4 ${dark ? 'bg-[#0F1923]' : 'bg-[#F5F0EA]'}`}>
        <div className="w-full max-w-3xl mx-auto">

          {/* 헤더 */}
          <div className="text-center mb-10">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4 border text-xs font-semibold`}
              style={dark
                ? { background: 'rgba(255,70,85,0.1)', borderColor: 'rgba(255,70,85,0.3)', color: '#FF4655' }
                : { background: 'rgba(255,70,85,0.08)', borderColor: 'rgba(255,70,85,0.25)', color: '#BD3944' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4655]" />
              {t.resultBadge}
            </div>
            <h1 className={`text-3xl md:text-4xl font-black mb-2 ${text}`}>
              {t.resultHeading}
            </h1>
            <p className={`text-sm ${muted}`}>
              {t.resultDesc}
            </p>
          </div>

          {/* 현재 감도 배너 */}
          <div className={`rounded-2xl border px-6 py-4 mb-6 flex items-center justify-between flex-wrap gap-4 ${card}`}>
            <span className={`text-xs font-semibold uppercase tracking-widest ${muted}`}>{t.testSensLabel}</span>
            <div className="flex gap-6">
              <div className="text-center">
                <p className={`text-xs mb-0.5 ${muted}`}>DPI</p>
                <p className={`text-lg font-black ${text}`}>{userSetup.dpi}</p>
              </div>
              <div className="text-center">
                <p className={`text-xs mb-0.5 ${muted}`}>{t.valoSensLabel}</p>
                <p className={`text-lg font-black ${text}`}>{userSetup.valorantSens}</p>
              </div>
              <div className="text-center">
                <p className={`text-xs mb-0.5 ${muted}`}>eDPI</p>
                <p className="text-lg font-black text-[#FF4655]">{userSetup.eDPI}</p>
              </div>
            </div>
          </div>

          {/* 테스트 결과 3개 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

            {/* Test 1 */}
            <div className={`rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${card}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${muted}`}>
                Test 1 · Rotation
              </p>
              <p className={`text-4xl font-black mb-1 ${text}`}>
                {allData.test1?.avgMovement?.toFixed(0) || 0}
                <span className={`text-sm font-normal ml-1 ${muted}`}>px</span>
              </p>
              <p className={`text-xs mb-2 ${muted}`}>{t.rotMetric}</p>
              {allData.test1?.deviationDeg !== undefined && (
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                  allData.test1.deviationDeg <= 10
                    ? 'bg-green-500/15 text-green-500'
                    : allData.test1.deviationDeg <= 25
                    ? 'bg-yellow-500/15 text-yellow-500'
                    : 'bg-[#FF4655]/15 text-[#FF4655]'
                }`}>
                  {t.deviationBadge(allData.test1.deviationDeg)}
                </span>
              )}
            </div>

            {/* Test 2 */}
            <div className={`rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${card}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${muted}`}>
                Test 2 · Flicking
              </p>
              <p className={`text-4xl font-black mb-1 ${text}`}>{test2Level}</p>
              <p className={`text-xs mb-2 ${muted}`}>
                {t.netScore(test2Score, test2Misses, test2Diff)}
              </p>
              {allData.test2?.recommendation && (
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                  allData.test2.recommendation === 'lower'
                    ? 'bg-blue-500/15 text-blue-400'
                    : allData.test2.recommendation === 'higher'
                    ? 'bg-[#FF4655]/15 text-[#FF4655]'
                    : 'bg-green-500/15 text-green-500'
                }`}>
                  {recDisplay(allData.test2.recommendation)}
                </span>
              )}
            </div>

            {/* Test 3 */}
            <div className={`rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${card}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${muted}`}>
                Test 3 · Tapping
              </p>
              <p className={`text-4xl font-black mb-1 ${text}`}>
                {allData.test3?.tappingAccuracy || 0}
                <span className={`text-sm font-normal ml-1 ${muted}`}>%</span>
              </p>
              <p className={`text-xs mb-2 ${muted}`}>
                {t.tapAccuracy(allData.test3?.hits || 0, allData.test3?.total || 20)}
              </p>
              {allData.test3?.avgReactionTime > 0 && (
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                  allData.test3.avgReactionTime < 400
                    ? 'bg-green-500/15 text-green-500'
                    : allData.test3.avgReactionTime < 700
                    ? 'bg-yellow-500/15 text-yellow-500'
                    : 'bg-[#FF4655]/15 text-[#FF4655]'
                }`}>
                  {t.avgReaction(allData.test3.avgReactionTime)}
                </span>
              )}
            </div>
          </div>

          {/* 플릭킹 분석 디테일 */}
          {allData.test2?.recommendation && (
            <div className={`rounded-2xl border px-5 py-4 mb-6 text-sm ${card}`}>
              <span className={`font-bold mr-2 ${text}`}>{t.flickAnalysis}</span>
              <span className={muted}>{recDetailDisplay(allData.test2.recommendation)}</span>
            </div>
          )}

          {/* 감도 추천 */}
          {recommendedSens && (
            <div className={`rounded-3xl border p-8 ${card}`}>
              <h2 className={`text-xl font-bold mb-6 text-center ${text}`}>
                {t.sensRecommend}
              </h2>

              {/* 현재 vs 추천 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* 현재 */}
                <div className={`rounded-2xl p-5 ${dark ? 'bg-[#0F1923]' : 'bg-[#F5F0EA]'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${muted}`}>
                    {t.currentSensCard}
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>DPI</span>
                      <span className={`font-bold ${text}`}>{recommendedSens.dpi}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>{t.sensLabel}</span>
                      <span className={`font-bold text-lg ${text}`}>{recommendedSens.currentSens}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>eDPI</span>
                      <span className={`font-bold text-lg ${muted}`}>{recommendedSens.currentEDPI}</span>
                    </div>
                  </div>
                </div>

                {/* 추천 */}
                <div className="rounded-2xl p-5 border-2 border-[#FF4655] relative" style={dark ? { background: 'rgba(255,70,85,0.05)' } : { background: 'rgba(255,70,85,0.04)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-[#FF4655]">
                    {t.recommendedSensCard}
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>DPI</span>
                      <span className={`font-bold ${text}`}>{recommendedSens.dpi}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>{t.sensLabel}</span>
                      <span className="font-black text-2xl text-[#FF4655]">{recommendedSens.valorantSens}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${muted}`}>eDPI</span>
                      <span className="font-bold text-lg text-[#FF4655]">{recommendedSens.eDPI}</span>
                    </div>
                  </div>
                  {parseFloat(recommendedSens.delta) !== 0 && (
                    <div className={`absolute -top-3 -right-3 px-2.5 py-1 rounded-full text-xs font-black text-white ${
                      parseFloat(recommendedSens.delta) < 0 ? 'bg-blue-500' : 'bg-[#FF4655]'
                    }`}>
                      {parseFloat(recommendedSens.delta) > 0 ? '+' : ''}{recommendedSens.delta}
                    </div>
                  )}
                </div>
              </div>

              {/* 변화 설명 */}
              <div className={`rounded-2xl px-5 py-3.5 text-sm text-center mb-6 ${
                parseFloat(recommendedSens.delta) === 0
                  ? dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'
                  : parseFloat(recommendedSens.delta) < 0
                  ? dark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'
                  : dark ? 'bg-[#FF4655]/10 text-[#FF4655]' : 'bg-red-50 text-red-700'
              }`}>
                {parseFloat(recommendedSens.delta) === 0
                  ? t.deltaGood
                  : parseFloat(recommendedSens.delta) < 0
                  ? t.deltaLower(Math.abs(parseFloat(recommendedSens.delta)).toFixed(2))
                  : t.deltaHigher(parseFloat(recommendedSens.delta).toFixed(2))
                }
              </div>

              <p className={`text-xs text-center mb-6 ${muted}`}>
                {t.disclaimer}
              </p>

              <div className={`pt-6 border-t flex justify-center ${dark ? 'border-[#2A3D4F]' : 'border-[#DDD8D2]'}`}>
                <button
                  onClick={handleRestart}
                  className={`px-7 py-3 rounded-2xl font-semibold text-sm transition-all hover:-translate-y-0.5 ${
                    dark
                      ? 'bg-[#2A3D4F] text-[#ECE8E1] hover:bg-[#2A3D4F]/80'
                      : 'bg-[#1A1F2E] text-white hover:bg-[#1A1F2E]/90'
                  }`}
                >
                  {t.restart}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}

export default Result
