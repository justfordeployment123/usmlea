const STORAGE_KEY = 'ng_roadmap_tests_done'

export function getRoadmapTestsDone(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function markRoadmapTestDone(key: string) {
  const done = getRoadmapTestsDone()
  done[key] = true
  localStorage.setItem(STORAGE_KEY, JSON.stringify(done))
}

export function isTodaysTestDone(todayKey: string | null): boolean {
  if (!todayKey) return false
  return (getRoadmapTestsDone()[todayKey] ?? false)
}
