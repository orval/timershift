export type ThemeName = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'timershift:theme'
export const DEFAULT_THEME: ThemeName = 'dark'

const resolveTheme = (value: string | null): ThemeName => (
  value === 'light' || value === 'dark' ? value : DEFAULT_THEME
)

export const getInitialTheme = (): ThemeName => {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    return resolveTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_THEME
  }
}

export const applyTheme = (theme: ThemeName): void => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}
