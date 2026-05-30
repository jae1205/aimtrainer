let test1Promise = null
let skeetTrackingPromise = null

export function preloadTest1() {
  if (!test1Promise) {
    test1Promise = import('../pages/Test1')
  }

  return test1Promise
}

export function preloadSkeetTracking() {
  if (!skeetTrackingPromise) {
    skeetTrackingPromise = import('../components/SkeetTrackingSim')
  }

  return skeetTrackingPromise
}
