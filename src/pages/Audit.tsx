import { formatDateTime } from '@/lib/date'
import { Title } from '@/components/_layout/title'
import { Badge } from '@/components/_ui/badge'
import { Card } from '@/components/_ui/card'
import { auditStore } from '@/stores/audit'
import { ClipboardList } from 'lucide-react'
import type { ComponentProps, UIEvent } from 'react'
import { useMemo, useState } from 'react'

const ITEM_HEIGHT = 96
const INITIAL_BATCH = 40
const BATCH_SIZE = 40
const OVERSCAN = 6
const ESTIMATED_VIEWPORT_HEIGHT = 720

interface ActionConfig extends ComponentProps<typeof Badge> {
  label: string
}

const ACTION_LABELS: Record<string, ActionConfig> = {
  login: { label: 'Login', variant: 'accent' },
  logout: { label: 'Logout', variant: 'secondary' },
  user_registered: { label: 'Cadastro', variant: 'accent' },
  sale_created: { label: 'Venda', variant: 'success' },
  sale_edited: { label: 'Edição Venda', variant: 'warning' },
  sale_deleted: { label: 'Exclusão Venda', variant: 'error' },
  sale_updated: { label: 'Atualização Venda', variant: 'warning' },
  payment_created: { label: 'Diária', variant: 'accent' },
  payment_deleted: { label: 'Exclusão Diária', variant: 'error' },
  employee_created: { label: 'Func. Cadastrado', variant: 'accent' },
  employee_deleted: { label: 'Func. Excluído', variant: 'error' },
  product_created: { label: 'Produto Criado', variant: 'accent' },
  custom_product_created: { label: 'Produto Custom Criado', variant: 'accent' },
}

export function Component() {
  const entries = auditStore.useStore((state) => state)
  const [scrollTop, setScrollTop] = useState(0)
  const [limit, setLimit] = useState(INITIAL_BATCH)

  const visibleEntriesLimit = Math.min(limit, entries.length)
  const loadedEntries = entries.slice(0, visibleEntriesLimit)
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
  const endIndex = Math.min(
    loadedEntries.length,
    Math.ceil((scrollTop + ESTIMATED_VIEWPORT_HEIGHT) / ITEM_HEIGHT) + OVERSCAN,
  )
  const topSpacer = startIndex * ITEM_HEIGHT
  const bottomSpacer = Math.max(0, (loadedEntries.length - endIndex) * ITEM_HEIGHT)
  const visibleEntries = useMemo(() => loadedEntries.slice(startIndex, endIndex), [endIndex, loadedEntries, startIndex])

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { clientHeight, scrollHeight, scrollTop: currentScrollTop } = e.currentTarget

    setScrollTop(currentScrollTop)

    if (currentScrollTop + clientHeight >= scrollHeight - ITEM_HEIGHT * 8) {
      setLimit((current) => Math.min(entries.length, current + BATCH_SIZE))
    }
  }

  return (
    <>
      <Title title='Auditoria' subtitle='Registro de todas as ações do sistema' />

      {entries.length === 0 ? (
        <Card className='p-8 text-center text-base-content/60'>
          <ClipboardList size={32} className='mx-auto mb-3 opacity-40' />
          <p className='text-sm'>Nenhum registro de auditoria</p>
        </Card>
      ) : (
        <div className={Card.getStyle('overflow-hidden p-0')}>
          <div data-swipe-ignore className='h-[min(80dvh,42rem)] overflow-y-auto ' onScroll={handleScroll}>
            <div style={{ height: topSpacer }} />

            <div role='list' className='divide-y divide-base-300'>
              {visibleEntries.map((entry) => {
                const config = ACTION_LABELS[entry.action] ?? {
                  label: entry.action,
                  variant: 'outline' as const,
                }

                return (
                  <div
                    key={entry.id}
                    role='listitem'
                    className='px-4 py-3 flex flex-col items-start gap-3'
                    style={{ height: ITEM_HEIGHT }}
                  >
                    <Badge variant={config.variant} className='text-xs'>
                      {config.label}
                    </Badge>

                    <div className='min-w-0 max-w-full overflow-x-auto overflow-y-hidden'>
                      <p className='text-sm whitespace-nowrap'>{entry.details}</p>
                      <p className='text-xs text-base-content/60 mt-0.5'>
                        {entry.userName} • {formatDateTime(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ height: bottomSpacer }} />

            {visibleEntriesLimit < entries.length && (
              <div className='py-4 text-center text-xs text-base-content/50'>Carregando registros...</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
