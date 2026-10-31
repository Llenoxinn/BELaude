import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { clearState, initialState, loadState, saveState, type AppState } from './state'

interface StoreValue {
  state: AppState
  update: (fn: (s: AppState) => AppState) => void
  replace: (s: AppState) => void
  reset: () => void
  /** Increments after each successful autosave, for the "Saved on this device" note. */
  savedTick: number
  storageOk: boolean
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState() ?? initialState)
  const [savedTick, setSavedTick] = useState(0)
  const [storageOk, setStorageOk] = useState(true)
  const first = useRef(true)

  // Autosave to this device only, debounced so typing doesn’t write on every key.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => {
      const ok = saveState(state)
      setStorageOk(ok)
      if (ok) setSavedTick((n) => n + 1)
    }, 500)
    return () => clearTimeout(t)
  }, [state])

  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), [])
  const replace = useCallback((s: AppState) => setState(s), [])
  const reset = useCallback(() => {
    clearState()
    setState(initialState)
  }, [])

  return (
    <StoreContext.Provider value={{ state, update, replace, reset, savedTick, storageOk }}>{children}</StoreContext.Provider>
  )
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside StoreProvider')
  return value
}
