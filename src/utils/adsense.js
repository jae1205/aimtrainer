const ADSENSE_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8198152103528082'

let scheduled = false

export function scheduleAdsenseLoad() {
  if (scheduled || typeof window === 'undefined') return
  scheduled = true

  const loadScript = () => {
    if (window.location.pathname !== '/') return
    if (document.querySelector(`script[src="${ADSENSE_SRC}"]`)) return

    const script = document.createElement('script')
    script.async = true
    script.crossOrigin = 'anonymous'
    script.src = ADSENSE_SRC
    document.head.appendChild(script)
  }

  const loadWhenIdle = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadScript, { timeout: 10000 })
      return
    }

    window.setTimeout(loadScript, 1)
  }

  window.setTimeout(loadWhenIdle, 15000)
}
