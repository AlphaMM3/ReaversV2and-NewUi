// Theme Manager supporting Classic (IOM Royal), Rose Blossom (Women Staff/Teachers Friendly),
// Cartoon Oasis (Playful Kids/Guardian Gamified), and Midnight Emerald.

export type AppTheme = 'classic' | 'rose' | 'cartoon' | 'midnight'

export interface ThemeOption {
  id: AppTheme
  label: string
  subtitle: string
  icon: string
  previewColors: string[]
  badge?: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'classic',
    label: 'IOM Royal Classic',
    subtitle: 'রয়্যাল ব্লু ও টিল - প্রাতিষ্ঠানিক ও গম্ভীর রূপ',
    icon: '🏛️',
    previewColors: ['#1d4ed8', '#0d9488', '#ffffff', '#f8fafc'],
    badge: 'ডিফল্ট',
  },
  {
    id: 'rose',
    label: 'Rose & Violet Elegance',
    subtitle: 'নরম গোলাপী ও ল্যাভেন্ডার - মহিলা শিক্ষক ও স্টাফদের বিশেষ পছন্দ',
    icon: '🌸',
    previewColors: ['#be185d', '#9d174d', '#fdf2f8', '#ffffff'],
    badge: 'Women Staff Favorite',
  },
  {
    id: 'cartoon',
    label: 'Kids Cartoon Oasis',
    subtitle: 'কার্টুনিশ ও গ্যামিফাইড - কোমল অ্যাম্বার, গোল্ড ও শিশুদের আনন্দ',
    icon: '🎈',
    previewColors: ['#f59e0b', '#0284c7', '#ecfdf5', '#ffffff'],
    badge: 'Kids Friendly',
  },
  {
    id: 'midnight',
    label: 'Midnight Emerald',
    subtitle: 'ডার্ক এমারেল্ড ও গোল্ডেন গ্লো - গভীর রাতের আরামদায়ক মুড',
    icon: '🌙',
    previewColors: ['#047857', '#0f172a', '#1e293b', '#34d399'],
  },
]

const THEME_STORAGE_KEY = 'iom_active_theme_v1'

export function getInitialTheme(): AppTheme {
  if (typeof window === 'undefined') return 'classic'
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null
    if (saved && ['classic', 'rose', 'cartoon', 'midnight'].includes(saved)) {
      return saved
    }
  } catch {
    // fallback
  }
  return 'classic'
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore
  }
}

