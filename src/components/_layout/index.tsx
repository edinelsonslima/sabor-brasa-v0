import { authStore } from '@/stores/auth'
import { useMatchMedia } from '@/hooks/useMatchMedia'
import { themeStore } from '@/hooks/useTheme'
import type { PropsWithChildren } from 'react'
import { Desktop } from './desktop'
import { Mobile } from './mobile'

export default function AppLayout({ children }: PropsWithChildren) {
  const isNotMobile = useMatchMedia('md')

  const user = authStore.useStore((state) => state.user)
  const theme = themeStore.useStore((state) => state.theme)

  return (
    <>
      {!isNotMobile && (
        <Mobile user={user} theme={theme}>
          {children}
        </Mobile>
      )}

      {isNotMobile && <Desktop>{children}</Desktop>}
    </>
  )
}
