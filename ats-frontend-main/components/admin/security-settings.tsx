"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Switch } from "../ui/switch"
import { Separator } from "../ui/separator"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Users,
  Activity,
} from "lucide-react"

export default function SecuritySettings() {
  const [settings, setSettings] = useState({
    // Password Policy
    minPasswordLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiration: 90,
    preventPasswordReuse: 5,

    // Account Security
    enableTwoFactor: true,
    requireTwoFactorForAdmins: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,

    // Access Control
    enableIPWhitelist: false,
    allowedIPs: "",
    enableGeoBlocking: false,
    blockedCountries: [] as string[],

    // Audit & Monitoring
    enableAuditLogging: true,
    logRetentionDays: 365,
    enableSecurityAlerts: true,
    alertThreshold: "medium",

    // Data Protection
    enableDataEncryption: true,
    backupEncryption: true,
    enableDataMasking: true,
    gdprCompliance: true,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus("idle")

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const getPasswordStrength = () => {
    let strength = 0
    if (settings.minPasswordLength >= 8) strength += 20
    if (settings.requireUppercase) strength += 20
    if (settings.requireLowercase) strength += 20
    if (settings.requireNumbers) strength += 20
    if (settings.requireSpecialChars) strength += 20
    return strength
  }

  const getSecurityScore = () => {
    let score = 0
    if (settings.enableTwoFactor) score += 15
    if (settings.requireTwoFactorForAdmins) score += 10
    if (settings.sessionTimeout <= 60) score += 10
    if (settings.maxLoginAttempts <= 5) score += 10
    if (settings.enableAuditLogging) score += 15
    if (settings.enableDataEncryption) score += 20
    if (settings.enableIPWhitelist) score += 10
    if (settings.enableGeoBlocking) score += 10
    return Math.min(score, 100)
  }

  const securityScore = getSecurityScore()
  const passwordStrength = getPasswordStrength()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Security Settings</h2>
          <p className="text-gray-600">Configure security policies and access controls</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showAdvanced ? "Hide Advanced" : "Show Advanced"}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : saveStatus === "success" ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "Saving..." : saveStatus === "success" ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {saveStatus === "success" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Security settings updated successfully!</span>
          </div>
        </div>
      )}

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Security Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{securityScore}%</span>
                <Badge
                  className={
                    securityScore >= 80
                      ? "bg-green-100 text-green-800"
                      : securityScore >= 60
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {securityScore >= 80 ? "Excellent" : securityScore >= 60 ? "Good" : "Needs Improvement"}
                </Badge>
              </div>
              <Progress value={securityScore} className="w-full" />
              <p className="text-sm text-gray-600">
                Your current security configuration provides{" "}
                {securityScore >= 80 ? "excellent" : securityScore >= 60 ? "good" : "basic"} protection.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Password Strength</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{passwordStrength}%</span>
                <Badge
                  className={
                    passwordStrength >= 80
                      ? "bg-green-100 text-green-800"
                      : passwordStrength >= 60
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {passwordStrength >= 80 ? "Strong" : passwordStrength >= 60 ? "Medium" : "Weak"}
                </Badge>
              </div>
              <Progress value={passwordStrength} className="w-full" />
              <p className="text-sm text-gray-600">
                Current password policy enforces{" "}
                {passwordStrength >= 80 ? "strong" : passwordStrength >= 60 ? "medium" : "weak"} passwords.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Password Policy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
              <Select
                value={settings.minPasswordLength.toString()}
                onValueChange={(value: string) => setSettings({ ...settings, minPasswordLength: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 characters</SelectItem>
                  <SelectItem value="8">8 characters</SelectItem>
                  <SelectItem value="10">10 characters</SelectItem>
                  <SelectItem value="12">12 characters</SelectItem>
                  <SelectItem value="16">16 characters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="requireUppercase">Require Uppercase Letters</Label>
                <Switch
                  id="requireUppercase"
                  checked={settings.requireUppercase}
                  onCheckedChange={(checked: boolean) => setSettings({ ...settings, requireUppercase: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="requireLowercase">Require Lowercase Letters</Label>
                <Switch
                  id="requireLowercase"
                  checked={settings.requireLowercase}
                  onCheckedChange={(checked: boolean) => setSettings({ ...settings, requireLowercase: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="requireNumbers">Require Numbers</Label>
                <Switch
                  id="requireNumbers"
                  checked={settings.requireNumbers}
                  onCheckedChange={(checked: boolean) => setSettings({ ...settings, requireNumbers: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
                <Switch
                  id="requireSpecialChars"
                  checked={settings.requireSpecialChars}
                  onCheckedChange={(checked: boolean) => setSettings({ ...settings, requireSpecialChars: checked })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passwordExpiration">Password Expiration (days)</Label>
                <Select
                  value={settings.passwordExpiration.toString()}
                  onValueChange={(value: string) => setSettings({ ...settings, passwordExpiration: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="0">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preventPasswordReuse">Prevent Reuse (last N passwords)</Label>
                <Select
                  value={settings.preventPasswordReuse.toString()}
                  onValueChange={(value: string) => setSettings({ ...settings, preventPasswordReuse: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Disabled</SelectItem>
                    <SelectItem value="3">Last 3</SelectItem>
                    <SelectItem value="5">Last 5</SelectItem>
                    <SelectItem value="10">Last 10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Account Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableTwoFactor">Enable Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Require 2FA for all users</p>
              </div>
              <Switch
                id="enableTwoFactor"
                checked={settings.enableTwoFactor}
                onCheckedChange={(checked: boolean) => setSettings({ ...settings, enableTwoFactor: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="requireTwoFactorForAdmins">Mandatory 2FA for Admins</Label>
                <p className="text-sm text-gray-500">Force 2FA for administrator accounts</p>
              </div>
              <Switch
                id="requireTwoFactorForAdmins"
                checked={settings.requireTwoFactorForAdmins}
                onCheckedChange={(checked: boolean) => setSettings({ ...settings, requireTwoFactorForAdmins: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Select
                value={settings.sessionTimeout.toString()}
                onValueChange={(value: string) => setSettings({ ...settings, sessionTimeout: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                  <SelectItem value="0">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Select
                  value={settings.maxLoginAttempts.toString()}
                  onValueChange={(value: string) => setSettings({ ...settings, maxLoginAttempts: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 attempts</SelectItem>
                    <SelectItem value="5">5 attempts</SelectItem>
                    <SelectItem value="10">10 attempts</SelectItem>
                    <SelectItem value="0">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                <Select
                  value={settings.lockoutDuration.toString()}
                  onValueChange={(value: string) => setSettings({ ...settings, lockoutDuration: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Security (shown when showAdvanced is true) */}
        {showAdvanced && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Access Control</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="enableIPWhitelist">IP Whitelist</Label>
                    <p className="text-sm text-gray-500">Restrict access to specific IP addresses</p>
                  </div>
                  <Switch
                    id="enableIPWhitelist"
                    checked={settings.enableIPWhitelist}
                    onCheckedChange={(checked: boolean) => setSettings({ ...settings, enableIPWhitelist: checked })}
                  />
                </div>

                {settings.enableIPWhitelist && (
                  <div className="space-y-2">
                    <Label htmlFor="allowedIPs">Allowed IP Addresses</Label>
                    <Input
                      id="allowedIPs"
                      value={settings.allowedIPs}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, allowedIPs: e.target.value })}
                      placeholder="192.168.1.1, 10.0.0.0/24"
                    />
                    <p className="text-xs text-gray-500">Separate multiple IPs with commas</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="enableGeoBlocking">Geographic Blocking</Label>
                    <p className="text-sm text-gray-500">Block access from specific countries</p>
                  </div>
                  <Switch
                    id="enableGeoBlocking"
                    checked={settings.enableGeoBlocking}
                    onCheckedChange={(checked: boolean) => setSettings({ ...settings, enableGeoBlocking: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Audit & Monitoring</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="enableAuditLogging">Audit Logging</Label>
                    <p className="text-sm text-gray-500">Log all user activities and system events</p>
                  </div>
                  <Switch
                    id="enableAuditLogging"
                    checked={settings.enableAuditLogging}
                    onCheckedChange={(checked: boolean) => setSettings({ ...settings, enableAuditLogging: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logRetentionDays">Log Retention (days)</Label>
                  <Select
                    value={settings.logRetentionDays.toString()}
                    onValueChange={(value: string) => setSettings({ ...settings, logRetentionDays: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="1095">3 years</SelectItem>
                      <SelectItem value="2555">7 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="enableSecurityAlerts">Security Alerts</Label>
                    <p className="text-sm text-gray-500">Send alerts for security events</p>
                  </div>
                  <Switch
                    id="enableSecurityAlerts"
                    checked={settings.enableSecurityAlerts}
                    onCheckedChange={(checked: boolean) => setSettings({ ...settings, enableSecurityAlerts: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alertThreshold">Alert Threshold</Label>
                  <Select
                    value={settings.alertThreshold}
                    onValueChange={(value: string) => setSettings({ ...settings, alertThreshold: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - All events</SelectItem>
                      <SelectItem value="medium">Medium - Important events</SelectItem>
                      <SelectItem value="high">High - Critical events only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Data Protection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="enableDataEncryption">Data Encryption</Label>
                        <p className="text-sm text-gray-500">Encrypt sensitive data at rest</p>
                      </div>
                      <Switch
                        id="enableDataEncryption"
                        checked={settings.enableDataEncryption}
                        onCheckedChange={(checked: boolean) => setSettings({ ...settings, enableDataEncryption: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="backupEncryption">Backup Encryption</Label>
                        <p className="text-sm text-gray-500">Encrypt backup files</p>
                      </div>
                      <Switch
                        id="backupEncryption"
                        checked={settings.backupEncryption}
                        onCheckedChange={(checked: boolean) => setSettings({ ...settings, backupEncryption: checked })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="enableDataMasking">Data Masking</Label>
                        <p className="text-sm text-gray-500">Mask sensitive data in logs</p>
                      </div>
                      <Switch
                        id="enableDataMasking"
                        checked={settings.enableDataMasking}
                        onCheckedChange={(checked: boolean) => setSettings({ ...settings, enableDataMasking: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="gdprCompliance">GDPR Compliance</Label>
                        <p className="text-sm text-gray-500">Enable GDPR compliance features</p>
                      </div>
                      <Switch
                        id="gdprCompliance"
                        checked={settings.gdprCompliance}
                        onCheckedChange={(checked: boolean) => setSettings({ ...settings, gdprCompliance: checked })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
