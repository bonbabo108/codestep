'use client'

import type { ReactNode } from 'react'
import Header from '@/components/Header'
import { AuthProvider } from '@/components/AuthProvider'

export default function ApplicationShell({ children }: { children: ReactNode }) {
  return <AuthProvider><Header />{children}</AuthProvider>
}
