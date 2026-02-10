'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Icon } from '@/components/icons'
import { ThemeButton } from '@/components/theme-button'

export const ThemeSwitchButton = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ThemeButton
      variant="circleSmall"
      onClick={() => {
        setTheme(theme === 'light' ? 'dark' : 'light')
      }}
    >
      {theme === 'light' ? <Icon name="light-mode" /> : <Icon name="dark-mode" />}
    </ThemeButton>
  )
}
