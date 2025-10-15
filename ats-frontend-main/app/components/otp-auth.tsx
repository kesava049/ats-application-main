"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { Label } from "../../components/ui/label"
import { Alert } from "../../components/ui/alert"
import { toast } from "../../components/ui/use-toast"
import { CheckCircle } from "lucide-react"
import BASE_API_URL from '../../BaseUrlApi';
// import { useCompany } from '../../lib/company-context';



export default function OTPAuth() {
  // const { login } = useCompany();
  const [step, setStep] = useState<"send" | "verify">("send")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [timer, setTimer] = useState(120) // 2 minutes
  const [otpExpired, setOtpExpired] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (step === "verify" && timer > 0 && !otpExpired) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000)
    } else if (timer === 0) {
      setOtpExpired(true)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [step, timer, otpExpired])

  const handleResendOtp = async () => {
    setTimer(120)
    setOtpExpired(false)
    setStep("send")
    setOtp("")
    setSuccess("")
    setError("")
  }

  // Helper function to check if the server is running
  const checkServerHealth = async (): Promise<boolean> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      // Try to check server health using a simple GET request to the base URL
      const response = await fetch(`${BASE_API_URL}/auth/send-otp`, {
        method: "OPTIONS",
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return true // If we can reach the endpoint, server is running
    } catch (error) {
      console.log("Server health check failed:", error)
      return false
    }
  }

  // Helper function to handle API responses with timeout and retry
  const handleApiResponse = async (response: Response) => {
    const contentType = response.headers.get("content-type")
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      
      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } else {
          // Handle HTML responses (server errors)
          const errorText = await response.text()
          if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
            errorMessage = `Server error (${response.status}). Please try again later.`
          } else {
            errorMessage = errorText || errorMessage
          }
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError)
        errorMessage = `Server error (${response.status}). Please try again later.`
      }
      
      throw new Error(errorMessage)
    }
    
    // Handle successful responses
    if (contentType && contentType.includes("application/json")) {
      return await response.json()
    } else {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        throw new Error("Invalid JSON response from server")
      }
    }
  }

  // Helper function to make API requests with timeout and retry
  const makeApiRequest = async (url: string, options: RequestInit, retryCount = 0): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    try {
      console.log(`Making API request to: ${url}`, { options, retryCount })
      
      // Add CORS headers
      const requestOptions = {
        ...options,
        signal: controller.signal,
        mode: 'cors' as RequestMode,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      }
      
      const response = await fetch(url, requestOptions)
      
      clearTimeout(timeoutId)
      console.log(`API response status: ${response.status}`, { url })
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      console.error(`API request failed (attempt ${retryCount + 1}):`, error)
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection.')
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the server. Please check if the backend server is running on http://147.93.155.233:5000')
      }
      
      if (retryCount < 2) {
        console.log(`Retrying request (${retryCount + 1}/2) after 3 seconds...`)
        // Retry after 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000))
        return makeApiRequest(url, options, retryCount + 1)
      }
      
      throw error
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      console.log("Sending OTP request for email:", email)
      console.log("API URL:", `${BASE_API_URL}/auth/send-otp`)
      
      const res = await makeApiRequest(`${BASE_API_URL}/auth/send-otp`, {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      
      const data = await handleApiResponse(res)
      localStorage.setItem("auth_email", email) // Save email in localStorage
      setStep("verify")
      setSuccess("OTP sent to your email.")
      toast({ title: "OTP Sent", description: "Check your email for the OTP." })
    } catch (err: any) {
      console.error("Send OTP error:", err)
      setError(err.message || "Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpExpired) {
      setError("OTP expired. Please resend OTP.")
      return
    }
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const storedEmail = localStorage.getItem("auth_email") || email
      console.log("Verifying OTP for email:", storedEmail, "OTP:", otp)
      
      const requestBody = { email: storedEmail, otp }
      console.log("Request body:", requestBody)
      
      const res = await makeApiRequest(`${BASE_API_URL}/auth/verify-otp`, {
        method: "POST",
        body: JSON.stringify(requestBody),
      })
      
      const data = await handleApiResponse(res)
      console.log("OTP verification successful:", data)
      setSuccess("OTP verified! Redirecting to dashboard...")
      
      // Save user data to localStorage
      localStorage.setItem("authenticated", "true")
      localStorage.setItem("ats_user", JSON.stringify({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        userType: data.user.userType,
        companyId: data.user.companyId,
        company: data.user.company,
        token: data.token
      }))
      
      toast({ title: "Login Successful", description: "You are now logged in." })
      setTimeout(() => {
        window.location.href = "/"
      }, 1500)
    } catch (err: any) {
      console.error("Verify OTP error:", err)
      
      // Provide more specific error messages based on the error type
      let errorMessage = err.message || "Invalid OTP. Please try again."
      
      if (err.message.includes("500")) {
        errorMessage = "Server is currently experiencing issues. Please try again in a few minutes or contact support."
      } else if (err.message.includes("400")) {
        errorMessage = "Invalid OTP or email. Please check your input and try again."
      } else if (err.message.includes("timeout")) {
        errorMessage = "Request timed out. Please check your internet connection and try again."
      } else if (err.message.includes("Failed to fetch")) {
        errorMessage = "Unable to connect to the server. Please check your internet connection and try again."
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl shadow-2xl border-0 rounded-2xl bg-white/90">
        <CardHeader className="flex flex-col items-center">
          <CheckCircle className="w-12 h-12 text-blue-500 mb-2" />
          <CardTitle className="text-3xl font-extrabold text-center text-blue-700 mb-1">
            {step === "send" ? "Sign In with OTP" : "Verify OTP"}
          </CardTitle>
          <p className="text-gray-500 text-center text-sm font-medium">
            Welcome to Appit ATS! Please enter your email to receive a one-time password.
          </p>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
          {success && <Alert variant="default" className="mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" />{success}</Alert>}
          {step === "send" ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="mt-2"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-2" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Enter the OTP sent to your email"
                  required
                  className="mt-2 tracking-widest text-lg text-center"
                  maxLength={6}
                  disabled={otpExpired}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${otpExpired ? "text-red-500" : "text-blue-600"}`}>
                  {otpExpired ? "OTP expired" : `Expires in ${Math.floor(timer/60)}:${(timer%60).toString().padStart(2,"0")}`}
                </span>
                <Button type="button" variant="ghost" className="text-blue-600 hover:underline px-0" onClick={handleResendOtp} disabled={!otpExpired}>
                  Resend OTP
                </Button>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-2" disabled={loading || otpExpired}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-blue-600 hover:underline"
                onClick={() => { setStep("send"); setOtp(""); setTimer(120); setOtpExpired(false); setError(""); setSuccess(""); }}
                disabled={loading}
              >
                Change Email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 