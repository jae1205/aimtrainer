import { lazy, Suspense, useCallback } from 'react'
import Layout from '../components/Layout'
import { preloadSkeetTracking } from '../routes/preloaders'
import './Test1.css'

const SkeetTrackingSim = lazy(preloadSkeetTracking)

function TrainingLoading() {
  return (
    <div className="af-training-loading">
      <div className="af-training-loading-card">
        <span className="af-training-spinner" />
        <p>사격장 불러오는 중</p>
      </div>
    </div>
  )
}

function Test1() {
  const userSetup = JSON.parse(localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}')
  const sensitivityMultiplier = userSetup.valorantSens
  const trainingMode = localStorage.getItem('selectedTraining') || 'skeet'

  const handleComplete = useCallback((data) => {
    localStorage.setItem('test1Data', JSON.stringify({ ...data, sensitivity: sensitivityMultiplier, trainingMode }))
  }, [sensitivityMultiplier, trainingMode])

  return (
    <Layout isTestPage={true} isLobby={true}>
      <div className="af-game-page">
        <Suspense fallback={<TrainingLoading />}>
          <SkeetTrackingSim
            onComplete={handleComplete}
            sensitivity={sensitivityMultiplier}
            theme="dark"
            trainingMode={trainingMode}
          />
        </Suspense>
      </div>
    </Layout>
  )
}

export default Test1
