/**
 * Utilities to handle hydration issues in production builds
 */

/**
 * Check if we're running on the client side
 */
export const isClient = typeof window !== 'undefined'

/**
 * Check if we're running on the server side
 */
export const isServer = typeof window === 'undefined'

/**
 * Get a stable random value that's consistent between server and client
 * This prevents hydration mismatches in production
 */
export function getStableRandom(seed: number, min: number = 0, max: number = 1): number {
  // Use a simple hash function to generate consistent values
  const x = Math.sin(seed) * 10000
  const normalized = x - Math.floor(x)
  return Math.floor(normalized * (max - min + 1)) + min
}

/**
 * Generate a stable date that's consistent between server and client
 * This prevents hydration mismatches with date rendering
 */
export function getStableDate(seed: number, daysOffset: number = 0): string {
  const baseDate = new Date('2024-01-01')
  const stableOffset = getStableRandom(seed, 0, daysOffset)
  const date = new Date(baseDate.getTime() + stableOffset * 24 * 60 * 60 * 1000)
  return date.toISOString()
}

/**
 * Safe localStorage access that works in both server and client
 */
export function safeLocalStorage() {
  if (isServer) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }
  }
  
  return {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => localStorage.setItem(key, value),
    removeItem: (key: string) => localStorage.removeItem(key),
  }
}

/**
 * Safe window access that works in both server and client
 */
export function safeWindow() {
  if (isServer) {
    return null
  }
  
  return window
}

/**
 * Delay function to ensure proper hydration timing in production
 */
export function hydrationDelay(): Promise<void> {
  return new Promise(resolve => {
    if (isServer) {
      resolve()
    } else {
      requestAnimationFrame(() => {
        setTimeout(resolve, 0)
      })
    }
  })
}
