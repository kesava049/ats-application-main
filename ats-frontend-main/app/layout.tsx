import React from 'react'
import type { Metadata } from 'next'
import { ThemeProvider } from '../components/theme-provider'
import { CompanyProvider } from '../lib/company-context'
import { CandidateProvider } from './contexts/candidate-context'
import ConditionalLayout from './components/conditional-layout'
import './globals.css'

export const metadata: Metadata = {
  title: 'APPIT ATS - Recruitment Platform',
  description: 'Advanced Talent Acquisition and Recruitment Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark') {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {
                document.documentElement.classList.remove('dark')
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <CompanyProvider>
          <CandidateProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </ThemeProvider>
          </CandidateProvider>
        </CompanyProvider>
      </body>
    </html>
  )
}