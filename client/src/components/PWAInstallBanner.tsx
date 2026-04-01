import React, { useState } from 'react'
import { usePWA } from '../hooks/usePWA'

const PWAInstallBanner: React.FC = () => {
  const { isInstallable, promptInstall } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  if (!isInstallable || dismissed) return null

  const handleInstall = async () => {
    const installed = await promptInstall()
    if (installed) {
      setDismissed(true)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  return (
    <div className="pwa-install-banner">
      <div>
        <strong>Install Omni</strong>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>
          Add to home screen for quick access
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="dismiss" onClick={handleDismiss}>
          Not now
        </button>
        <button onClick={handleInstall}>Install</button>
      </div>
    </div>
  )
}

export default PWAInstallBanner
