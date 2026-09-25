import type { AppUser } from '@/hooks/useAuth'
import { authStore } from '@/hooks/useAuth'
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation'
import type { Theme } from '@/hooks/useTheme'
import { themeStore } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import {
  CalendarDays,
  ClipboardList,
  Info,
  LayoutDashboard,
  LogOut,
  Package,
  Palette,
  Search,
  ReceiptText,
  Wallet,
  Users,
} from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { useRef } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Button } from '../_ui/button'
import { Modal } from '../_ui/modal'
import { Brand } from './brand'
import { AutoHideOnScroll } from '@/hooks/AutoHideOnScroll'

interface MobileProps {
  theme: Theme
  user: AppUser | null
}

const dockerItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/historico', icon: CalendarDays, label: 'Histórico' },
  { to: '/comandas', icon: ReceiptText, label: 'Comandas' },
  { to: '/pagamentos', icon: Users, label: 'Diárias' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
]

export function Mobile({ user, theme }: PropsWithChildren<MobileProps>) {
  const mainRef = useRef<HTMLElement>(null)

  const toggleTitleStyles = (titleRef: HTMLElement | null) => {
    if (!titleRef) {
      return
    }

    const sentinel = document.createElement('div')
    sentinel.classList.add('sr-only')
    titleRef.parentElement?.insertBefore(sentinel, titleRef)

    const observer = new IntersectionObserver(
      ([{ isIntersecting }]) =>
        isIntersecting ? titleRef.classList.remove('daisy-glass') : titleRef.classList.add('daisy-glass'),
      { threshold: [0, 1] },
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
      sentinel.remove()
    }
  }

  useSwipeNavigation(
    mainRef,
    dockerItems.map((i) => i.to),
  )

  return (
    <>
      <AutoHideOnScroll threshold={12}>
        <nav className='daisy-navbar daisy-glass px-4 w-full flex justify-between'>
          <Brand />

          <div className='flex items-center gap-2'>
            <Link
              to='/buscar'
              className={Button.getStyle(undefined, {
                modifier: 'circle',
                appearance: 'ghost',
              })}
            >
              <Search size={18} />
            </Link>

            <div className='daisy-dropdown daisy-dropdown-end'>
              <div
                role='button'
                tabIndex={0}
                className={Button.getStyle(undefined, {
                  modifier: 'circle',
                  variant: 'primary',
                })}
              >
                {user?.initials}
              </div>

              <ul
                tabIndex={-1}
                className='daisy-dropdown-content daisy-menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-xl'
              >
                <li className='daisy-menu-title'>
                  <span className='truncate'>{user?.name}</span>
                  <span className='text-xs opacity-60 truncate'>{user?.email}</span>
                </li>

                <li>
                  <Link to='/gastos'>
                    <Wallet size={14} /> Gastos
                  </Link>
                </li>

                <li>
                  <Link to='/auditoria'>
                    <ClipboardList size={14} /> Auditoria
                  </Link>
                </li>

                <li>
                  <Modal className='pb-0'>
                    <Modal.Trigger as='button' type='button' title='Selecionar o tema do sistema'>
                      <Palette size={14} /> Tema
                    </Modal.Trigger>

                    <Modal.Title
                      ref={toggleTitleStyles}
                      className='flex items-center justify-start sticky daisy-glass -top-6 h-14 px-6 m-0 -mx-6 z-10'
                    >
                      <Palette size={20} />
                      <h3 className='font-bold text-lg'>Escolha o tema</h3>
                    </Modal.Title>

                    <Modal.Content as='ul' className='w-full max-h-1/2'>
                      {themeStore.action.list().map((t) => (
                        <li key={t}>
                          <input
                            type='radio'
                            aria-label={t}
                            defaultChecked={theme === t}
                            name='theme-dropdown'
                            onChange={() => themeStore.action.set(t)}
                            className='daisy-theme-controller daisy-btn daisy-btn-md daisy-btn-block daisy-btn-ghost w-full justify-start'
                          />
                        </li>
                      ))}
                    </Modal.Content>

                    <Modal.Actions className='m-0 sticky bottom-0 py-2 pb-4 bg-base-100 border-t border-base-content/10'>
                      {({ close }) => (
                        <Button onClick={close} appearance='outline'>
                          Fechar
                        </Button>
                      )}
                    </Modal.Actions>
                  </Modal>
                </li>

                <li>
                  <Link to='/sobre'>
                    <Info size={14} /> Sobre
                  </Link>
                </li>

                <li className='border-t border-black/15 pt-1 mt-1'>
                  <Button
                    size='sm'
                    variant='error'
                    appearance='link'
                    className='justify-start'
                    onClick={() => authStore.action.logout()}
                  >
                    <LogOut size={14} /> Sair
                  </Button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </AutoHideOnScroll>

      <main ref={mainRef} className='main-content min-h-screen p-4 pb-20 max-w-2xl mx-auto space-y-8'>
        <Outlet />
      </main>

      <div className='daisy-dock daisy-dock-md border-t border-base-content/10 bg-base-100'>
        {dockerItems.map((item) => (
          <NavLink
            to={item.to}
            key={item.label}
            className={({ isActive }) =>
              cn('after:duration-300 hover:opacity-100', isActive && 'daisy-dock-active after:bg-primary text-primary')
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  className={cn(
                    'transition-all origin-center duration-700',
                    isActive && 'fill-primary/20 animate-scale-up',
                  )}
                />
                <span className='daisy-dock-label'>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </>
  )
}
