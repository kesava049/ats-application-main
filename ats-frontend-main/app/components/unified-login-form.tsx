"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Loader2, Mail, Shield, Users } from 'lucide-react'
import LoginTypeSelector from './login-type-selector'

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface UnifiedLoginFormProps {
  onUserLogin: (userData: any) => void
  onAdminLogin: (adminData: any) => void
}

export default function UnifiedLoginForm({ onUserLogin, onAdminLogin }: UnifiedLoginFormProps) {
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')

  // OTP Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [otpTimer])

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Send OTP
  const sendOtp = async () => {
    if (!email) {
      setError('Please enter email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${BASE_API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
        setOtpTimer(120) // 2 minutes
        setStep('otp')
        setError('')
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const verifyOtp = async () => {
    if (!otp) {
      setError('Please enter OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      let response
      let data

      if (loginType === 'user') {
        // User login
        response = await fetch(`${BASE_API_URL}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        })
        data = await response.json()

        if (response.ok) {
          // Save user session
          if (typeof window !== 'undefined') {
            localStorage.setItem('authenticated', 'true')
            localStorage.setItem('ats_user', JSON.stringify({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              userType: data.user.userType,
              companyId: data.user.companyId,
              company: data.user.company,
              token: data.token
            }))
          }
          onUserLogin(data.user)
        } else {
          setError(data.error || 'Invalid OTP')
        }
      } else {
        // Admin login
        response = await fetch(`${BASE_API_URL}/auth/superadmin-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        })
        data = await response.json()

        if (response.ok) {
          // Save admin session
          if (typeof window !== 'undefined') {
            localStorage.setItem('admin_token', data.token)
            localStorage.setItem('admin_superadmin', JSON.stringify(data.superadmin))
            localStorage.setItem('admin_authenticated', 'true')
          }
          onAdminLogin(data.superadmin)
        } else {
          setError(data.error || 'Invalid OTP')
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setEmail('')
    setOtp('')
    setOtpSent(false)
    setOtpTimer(0)
    setError('')
    setStep('email')
  }

  // Handle login type change
  const handleLoginTypeChange = (type: 'user' | 'admin') => {
    setLoginType(type)
    resetForm()
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              {loginType === 'user' ? (
                <Users className="h-8 w-8 text-white" />
              ) : (
                <Shield className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {loginType === 'user' ? 'User Login' : 'Admin Login'}
          </CardTitle>
          <CardDescription>
            {loginType === 'user' 
              ? 'Access your company dashboard'
              : 'Access admin panel'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Login Type Selector */}
          <LoginTypeSelector 
            loginType={loginType} 
            onLoginTypeChange={handleLoginTypeChange} 
          />

          {/* Email Step */}
          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && sendOtp()}
                  />
                </div>
              </div>
              
              <Button 
                onClick={sendOtp} 
                disabled={loading || !email}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send OTP
              </Button>
            </div>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  We've sent a 6-digit OTP to
                </p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>
              
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  onKeyPress={(e) => e.key === 'Enter' && verifyOtp()}
                />
                {otpTimer > 0 && (
                  <p className="text-sm text-red-600 mt-1 text-center">
                    OTP expires in: {formatTime(otpTimer)}
                  </p>
                )}
              </div>
              
              <Button 
                onClick={verifyOtp} 
                disabled={loading || otp.length !== 6 || otpTimer === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify OTP & Login
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setOtpSent(false)
                  setOtp('')
                  setOtpTimer(0)
                  setStep('email')
                }}
                className="w-full"
              >
                Back to Email
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
