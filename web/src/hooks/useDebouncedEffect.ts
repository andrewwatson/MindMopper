import { useEffect, useRef } from 'react'

export function useDebouncedEffect(fn: () => void, deps: unknown[], delay: number) {
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    clearTimeout(timeout.current)
    timeout.current = setTimeout(fn, delay)
    return () => clearTimeout(timeout.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay])
}
