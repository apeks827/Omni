/* eslint-disable no-undef */
interface NetworkInformation {
  type?: string
  effectiveType?: string
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation
  mozConnection?: NetworkInformation
  webkitConnection?: NetworkInformation
}

export interface DeviceContext {
  type: 'desktop' | 'mobile' | 'tablet'
  screenWidth: number
  screenHeight: number
  userAgent: string
}

export interface TimeContext {
  hour: number
  dayOfWeek: number
  isWeekend: boolean
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}

export interface LocationContext {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export interface NetworkContext {
  type: 'wifi' | 'cellular' | 'offline' | 'unknown'
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g'
}

export interface Context {
  device: DeviceContext
  time: TimeContext
  location: LocationContext | null
  network: NetworkContext
}

export type ContextType = 'device' | 'time' | 'location' | 'network'

export interface ContextPermissions {
  location: boolean
}

class ContextDetectionService {
  private listeners: Set<(ctx: Context) => void> = new Set()
  private currentContext: Context | null = null
  private locationWatchId: number | null = null
  private permissions: ContextPermissions = { location: false }

  constructor() {
    this.updateContext()
    this.setupListeners()
  }

  private detectDevice(): DeviceContext {
    const ua = navigator.userAgent.toLowerCase()
    const width = window.innerWidth
    const height = window.innerHeight

    let type: 'desktop' | 'mobile' | 'tablet' = 'desktop'

    const isMobileUA =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
    const isTabletUA = /ipad|tablet|playbook|silk/i.test(ua)

    if (isMobileUA || (width < 768 && isMobileUA)) {
      type = 'mobile'
    } else if (isTabletUA || (width < 1024 && width >= 768)) {
      type = 'tablet'
    }

    if (type === 'desktop' && width < 1024) {
      type = width < 768 ? 'mobile' : 'tablet'
    }

    return {
      type,
      screenWidth: width,
      screenHeight: height,
      userAgent: navigator.userAgent,
    }
  }

  private detectTime(): TimeContext {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()

    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    if (hour >= 5 && hour < 12) timeOfDay = 'morning'
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening'
    else timeOfDay = 'night'

    return {
      hour,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      timeOfDay,
    }
  }

  private detectNetwork(): NetworkContext {
    const nav = navigator as NavigatorWithConnection
    if (!nav.connection && !nav.mozConnection && !nav.webkitConnection) {
      return { type: 'unknown' }
    }

    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection
    const type = connection?.type || 'unknown'
    const rawEffectiveType = connection?.effectiveType
    const effectiveType = rawEffectiveType as NetworkContext['effectiveType']

    return {
      type:
        type === 'wifi' || type === 'ethernet'
          ? 'wifi'
          : type === 'cellular'
            ? 'cellular'
            : 'unknown',
      effectiveType,
    }
  }

  private updateContext() {
    this.currentContext = {
      device: this.detectDevice(),
      time: this.detectTime(),
      location: null,
      network: this.detectNetwork(),
    }
    this.notifyListeners()
  }

  private setupListeners() {
    window.addEventListener('resize', () => this.updateContext())
    setInterval(() => this.updateContext(), 60000)
  }

  private notifyListeners() {
    if (this.currentContext) {
      this.listeners.forEach(listener => listener(this.currentContext!))
    }
  }

  getContext(): Context | null {
    return this.currentContext
  }

  subscribe(callback: (ctx: Context) => void): () => void {
    this.listeners.add(callback)
    if (this.currentContext) {
      callback(this.currentContext)
    }
    return () => this.listeners.delete(callback)
  }

  async requestPermission(type: ContextType): Promise<boolean> {
    if (type === 'location') {
      try {
        const result = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        })
        if (result.state === 'granted') {
          this.permissions.location = true
          return true
        }
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              maximumAge: 0,
            })
          }
        )
        this.permissions.location = true
        this.updateLocationContextFromRaw(position)
        return true
      } catch (error) {
        console.error('Geolocation permission denied or error:', error)
        this.permissions.location = false
        return false
      }
    }
    return false
  }

  private updateLocationContextFromRaw(position: GeolocationPosition) {
    if (this.currentContext) {
      this.currentContext.location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      }
      this.notifyListeners()
    }
  }

  watchLocation(callback: (loc: LocationContext) => void): number | null {
    if (!this.permissions.location) return null

    const watchId = navigator.geolocation.watchPosition(
      position => {
        const loc: LocationContext = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }
        this.updateLocationContextFromRaw(position)
        callback(loc)
      },
      error => {
        console.error('Geolocation watch error:', error)
      },
      { enableHighAccuracy: false, maximumAge: 300000 }
    )

    this.locationWatchId = watchId
    return watchId
  }

  clearWatch(handle: number) {
    navigator.geolocation.clearWatch(handle)
    if (this.locationWatchId === handle) {
      this.locationWatchId = null
    }
  }

  revokePermission(type: ContextType) {
    if (type === 'location') {
      this.permissions.location = false
      if (this.locationWatchId !== null) {
        this.clearWatch(this.locationWatchId)
      }
      if (this.currentContext) {
        this.currentContext.location = null
        this.notifyListeners()
      }
    }
  }

  getPermissions(): ContextPermissions {
    return { ...this.permissions }
  }
}

export const contextService = new ContextDetectionService()
