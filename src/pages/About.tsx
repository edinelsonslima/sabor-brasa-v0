import { Title } from '@/components/_layout/title'
import { Card } from '@/components/_ui/card'
import logo from '@/assets/sabor-brasa-logo.png'
import { m } from 'framer-motion'
import { Code, FileText, Heart, Info } from 'lucide-react'

const APP_VERSION = '1.0.0'

const team = [{ name: 'Sabor & Brasa', role: 'Desenvolvimento & Manutenção' }]

export function Component() {
  return (
    <>
      <Title title='Sobre' subtitle='Informações do sistema' />

      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className='space-y-4'>
        <Card>
          <div className='flex items-center gap-3 mb-4'>
            <div className='p-3 rounded-xl bg-primary/10'>
              <Info size={22} className='text-primary' />
            </div>
            <div>
              <img src={logo} alt='Sabor & Brasa' className='h-14 w-auto max-w-52 object-contain' />
              <p className='text-xs text-base-content/60'>Sistema de Gestão de Vendas</p>
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between py-2 border-b border-base-300'>
              <span className='text-sm text-base-content/60'>Versão</span>
              <span className='text-sm font-mono font-bold'>v{APP_VERSION}</span>
            </div>

            <div className='flex items-center justify-between py-2 border-b border-base-300'>
              <span className='text-sm text-base-content/60'>Plataforma</span>
              <span className='text-sm font-semibold'>Web (PWA)</span>
            </div>

            <div className='flex items-center justify-between py-2'>
              <span className='text-sm text-base-content/60'>Tecnologias</span>
              <span className='text-sm font-semibold'>React + TypeScript + DaisyUI</span>
            </div>
          </div>
        </Card>

        <Card>
          <Card.Title>
            <FileText size={14} className='inline mr-1' />
            LICENÇA
          </Card.Title>
          <p className='text-sm text-base-content/70 mt-2'>
            Este software é de uso exclusivo e proprietário. Todos os direitos reservados. A reprodução, distribuição ou
            modificação sem autorização prévia é proibida.
          </p>
        </Card>

        <Card>
          <Card.Title>
            <Code size={14} className='inline mr-1' />
            TIME
          </Card.Title>
          <div className='mt-3 space-y-3'>
            {team.map((member) => (
              <div key={member.name} className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary'>
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className='text-sm font-semibold'>{member.name}</p>
                  <p className='text-xs text-base-content/60'>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className='text-center py-4'>
          <p className='text-xs text-base-content/40 flex items-center justify-center gap-1'>
            Feito com <Heart size={12} className='text-error' /> no Brasil
          </p>
        </div>
      </m.div>
    </>
  )
}
