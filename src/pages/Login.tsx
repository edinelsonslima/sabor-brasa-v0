import { Button } from '@/components/_ui/button'
import { Label } from '@/components/_ui/label'
import { toast } from '@/components/_ui/toast'
import logo from '@/assets/sabor-brasa-logo.png'
import { authStore } from '@/hooks/useAuth'
import { m } from 'framer-motion'
import type { FormEvent } from 'react'
import { useState } from 'react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Component() {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isRegister) {
      if (!name.trim() || name.trim().length < 2) {
        return toast.error('Nome deve ter ao menos 2 caracteres')
      }

      if (!EMAIL_REGEX.test(email.trim())) {
        return toast.error('Informe um e-mail válido')
      }

      if (password.length < 4) {
        return toast.error('Senha deve ter ao menos 4 caracteres')
      }

      const err = authStore.action.register(name.trim(), email.trim().toLowerCase(), password)

      return err ? toast.error(err) : toast.success('Conta criada com sucesso!')
    }

    if (!email.trim() || !password) {
      return toast.error('Preencha todos os campos')
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return toast.error('Informe um e-mail válido')
    }

    const err = authStore.action.login(email.trim().toLowerCase(), password)

    return err ? toast.error(err) : toast.success('Bem-vindo de volta!')
  }

  return (
    <div className='min-h-dvh flex items-center justify-center bg-base-100 px-4'>
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='w-full max-w-sm space-y-6'>
        <div className='text-center'>
          <img src={logo} alt='Sabor & Brasa — Restaurante & Bar' className='mx-auto h-28 w-auto max-w-full object-contain' />
          <p className='text-sm text-base-content/60 mt-1'>{isRegister ? 'Crie sua conta' : 'Acesse sua conta'}</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4 rounded-xl border border-base-300 bg-base-100 p-6'>
          {isRegister && (
            <div className='space-y-2'>
              <Label>Nome</Label>
              <label aria-label='Nome' className='daisy-input daisy-validator'>
                <svg className='h-[1em] opacity-50' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
                  <g strokeLinejoin='round' strokeLinecap='round' strokeWidth='2.5' fill='none' stroke='currentColor'>
                    <path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'></path>
                    <circle cx='12' cy='7' r='4'></circle>
                  </g>
                </svg>
                <input
                  required
                  type='text'
                  placeholder='Seu nome'
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  maxLength={100}
                  minLength={2}
                />
              </label>
            </div>
          )}

          <div className='space-y-2'>
            <Label>E-mail</Label>
            <label aria-label='E-mail' className='daisy-input daisy-validator'>
              <svg className='h-[1em] opacity-50' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
                <g strokeLinejoin='round' strokeLinecap='round' strokeWidth='2.5' fill='none' stroke='currentColor'>
                  <rect width='20' height='16' x='2' y='4' rx='2'></rect>
                  <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'></path>
                </g>
              </svg>
              <input
                type='email'
                required
                value={email}
                placeholder='seu@email.com'
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </label>
          </div>

          <div className='space-y-2'>
            <Label>Senha</Label>
            <label aria-label='Senha' className='daisy-input daisy-validator'>
              <svg className='h-[1em] opacity-50' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
                <g strokeLinejoin='round' strokeLinecap='round' strokeWidth='2.5' fill='none' stroke='currentColor'>
                  <path d='M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z'></path>
                  <circle cx='16.5' cy='7.5' r='.5' fill='currentColor'></circle>
                </g>
              </svg>
              <input
                type='password'
                required
                // pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                title='A senha deve conter ao menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='••••••'
                maxLength={100}
                minLength={4}
              />
            </label>
          </div>

          <Button type='submit' variant='primary' modifier='block'>
            {isRegister ? 'Criar Conta' : 'Entrar'}
          </Button>
        </form>

        <p className='text-center text-sm text-base-content/60'>
          {isRegister ? 'Já tem conta?' : 'Não tem conta?'}{' '}
          <Button type='button' appearance='link' onClick={() => setIsRegister((prev) => !prev)}>
            {isRegister ? 'Entrar' : 'Criar conta'}
          </Button>
        </p>
      </m.div>
    </div>
  )
}
