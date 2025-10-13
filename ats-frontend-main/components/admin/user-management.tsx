"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Checkbox } from "../ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  UserCheck,
  UserX,
  Activity,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { formatDate } from "../../lib/date-utils"
import BASE_API_URL from "../../BaseUrlApi.js"

// Define the User interface based on the API response
interface ApiUser {
  id: number
  name: string
  email: string
  number: string
  userType: 'ADMIN' | 'MANAGER' | 'USER'
}

interface LoginHistory {
  id: number
  loggedAt: string
  user: {
    name: string
    email: string
    userType: 'ADMIN' | 'MANAGER' | 'USER'
  }
}

interface ApiResponse {
  users: ApiUser[]
}

interface LoginHistoryResponse {
  logins: LoginHistory[]
}

export default function UserManagement() {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState<"ALL" | "ADMIN" | "MANAGER" | "USER">("ALL")
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    number: "",
    userType: "USER" as 'ADMIN' | 'MANAGER' | 'USER',
  })

  // Character limits for form fields - Professional standards
  const characterLimits = {
    name: 100,        // Names should be reasonable length
    email: 150,       // Email addresses can be long
    number: 12        // Phone numbers should be concise (max 12 digits)
  }

  // Minimum character requirements for fields - Professional standards
  const minimumCharacters = {
    name: 2,          // Names should be at least 2 characters
    email: 8,         // Email should be at least 8 characters (e.g., "a@b.com")
    number: 10        // Phone numbers should be at least 10 digits (e.g., "1234567890")
  }

  // Helper function to get character count and limit
  const getCharacterCount = (value: string, field: keyof typeof characterLimits) => {
    const limit = characterLimits[field]
    const count = value.length
    const remaining = limit - count
    return { count, limit, remaining }
  }

  // Helper function to render character count message with color coding
  const renderCharacterCount = (value: string, field: keyof typeof characterLimits) => {
    const { count, limit, remaining } = getCharacterCount(value, field)
    const minRequired = minimumCharacters[field]
    const isOverLimit = count > limit
    const isTooShort = count > 0 && count < minRequired
    const isGoodLength = count >= minRequired && count <= limit
    const isNearLimit = count >= minRequired && count > limit * 0.8 && count <= limit

    let messageColor = 'text-gray-500'
    let messageText = `${count}/${limit} characters`

    if (count === 0) {
      messageColor = 'text-gray-400'
      messageText = `${count}/${limit} characters`
    } else if (isOverLimit) {
      messageColor = 'text-red-500'
      messageText = `${count}/${limit} characters (${Math.abs(remaining)} over limit)`
    } else if (isTooShort) {
      messageColor = 'text-red-500'
      messageText = `${count}/${limit} characters (minimum ${minRequired} characters required)`
    } else if (isGoodLength && !isNearLimit) {
      messageColor = 'text-green-500'
      messageText = `${count}/${limit} characters (good length)`
    } else if (isNearLimit) {
      messageColor = 'text-yellow-500'
      messageText = `${count}/${limit} characters (${remaining} remaining)`
    }

    return (
      <div className={`text-xs ${messageColor}`}>
        {messageText}
      </div>
    )
  }

  // Helper function to handle input changes with character limit validation
  const handleInputChange = (field: keyof typeof characterLimits, value: string, setter: (value: string) => void) => {
    const limit = characterLimits[field]
    if (value.length <= limit) {
      setter(value)
    }
  }

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching users from:', `${BASE_API_URL}/auth/all-users`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${BASE_API_URL}/auth/all-users`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: ApiResponse = await response.json()
      console.log('Fetched data:', data)
      setUsers(data.users)
    } catch (err) {
      let errorMessage = 'Failed to fetch users'
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check if the backend server is running.'
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check if the backend server is running on http://localhost:5000'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch login history from API
  const fetchLoginHistory = async () => {
    try {
      setHistoryLoading(true)
      setHistoryError(null)
      console.log('Fetching login history from:', `${BASE_API_URL}/auth/all-login-history`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${BASE_API_URL}/auth/all-login-history`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      console.log('Login history response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: LoginHistoryResponse = await response.json()
      console.log('Fetched login history:', data)
      setLoginHistory(data.logins)
    } catch (err) {
      let errorMessage = 'Failed to fetch login history'
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check if the backend server is running.'
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check if the backend server is running on http://localhost:5000'
        } else {
          errorMessage = err.message
        }
      }
      
      setHistoryError(errorMessage)
      console.error('Error fetching login history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchLoginHistory()
  }, [])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.number.includes(searchTerm) ||
      user.userType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTypeFilter = userTypeFilter === "ALL" || user.userType === userTypeFilter
    
    return matchesSearch && matchesTypeFilter
  })

  const filteredLoginHistory = loginHistory.filter((login) => {
    const matchesSearch =
      login.user.name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      login.user.email.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      login.loggedAt.toLowerCase().includes(historySearchTerm.toLowerCase())
    
    return matchesSearch
  })

  const handleAddUser = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('User created:', result)

      // Refresh the users list
      await fetchUsers()
      
      // Reset form
      setNewUser({
        name: "",
        email: "",
        number: "",
        userType: "USER" as 'ADMIN' | 'MANAGER' | 'USER',
      })
      setIsAddUserDialogOpen(false)
    } catch (err) {
      console.error('Error adding user:', err)
      alert('Failed to create user. Please try again.')
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`${BASE_API_URL}/auth/update-user/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          number: editingUser.number,
          userType: editingUser.userType
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('User updated:', result)

      // Refresh the users list
      await fetchUsers()
      
      setIsEditUserDialogOpen(false)
      setEditingUser(null)
    } catch (err) {
      console.error('Error updating user:', err)
      alert('Failed to update user. Please try again.')
    }
  }

  const handleDeleteUser = async (user: ApiUser) => {
    try {
      const response = await fetch(`${BASE_API_URL}/auth/delete-user/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('User deleted:', result)

      // Refresh the users list
      await fetchUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Failed to delete user. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <h3 className="text-lg font-semibold">Loading Users</h3>
            <p className="text-gray-600 text-center">Please wait while we fetch user data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h3 className="text-lg font-semibold">Error Loading Users</h3>
            <p className="text-gray-600 text-center">{error}</p>
            <div className="space-y-2">
              <Button onClick={fetchUsers} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button 
                onClick={() => {
                  // Fallback to mock data for testing
                  setUsers([
                    {
                      id: 1,
                      name: "Faiz",
                      email: "faiz@appitsoftware.com",
                      number: "9876543210",
                      userType: "ADMIN"
                    },
                    {
                      id: 2,
                      name: "Aravind",
                      email: "aravind.gajjela@appitsoftware.com",
                      number: "9876543210",
                      userType: "MANAGER"
                    }
                  ])
                  setError(null)
                }} 
                variant="outline"
              >
                Use Demo Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts and login history</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => { fetchUsers(); fetchLoginHistory(); }} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => handleInputChange('name', e.target.value, (val) => setNewUser({ ...newUser, name: val }))}
                    placeholder="Enter full name"
                    maxLength={characterLimits.name}
                  />
                  {renderCharacterCount(newUser.name, 'name')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleInputChange('email', e.target.value, (val) => setNewUser({ ...newUser, email: val }))}
                    placeholder="Enter email address"
                    maxLength={characterLimits.email}
                  />
                  {renderCharacterCount(newUser.email, 'email')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Phone Number *</Label>
                  <Input
                    id="number"
                    type="tel"
                    value={newUser.number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '') // Only allow numbers
                      handleInputChange('number', value, (val) => setNewUser({ ...newUser, number: val }))
                    }}
                    placeholder="Enter phone number (numbers only)"
                    maxLength={characterLimits.number}
                  />
                  {renderCharacterCount(newUser.number, 'number')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userType">User Type *</Label>
                  <Select
                    value={newUser.userType}
                    onValueChange={(value: 'ADMIN' | 'MANAGER' | 'USER') => 
                      setNewUser({ ...newUser, userType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Regular User</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!newUser.name || !newUser.email || !newUser.number}
                >
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{users.length}</div>
            <p className="text-xs text-gray-600">Active users in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{users.filter(u => u.userType === 'ADMIN').length}</div>
            <p className="text-xs text-gray-600">Administrator accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.userType === 'MANAGER').length}</div>
            <p className="text-xs text-gray-600">Manager accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{users.filter(u => u.userType === 'USER').length}</div>
            <p className="text-xs text-gray-600">Standard user accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Login Sessions</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{loginHistory.length}</div>
            <p className="text-xs text-gray-600">Total login sessions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="history">Login History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle>User Accounts</CardTitle>
                  <p className="text-sm text-gray-600">Manage and view all system users</p>
                </div>
                <div className="flex gap-2 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={userTypeFilter} onValueChange={(value: "ALL" | "ADMIN" | "MANAGER" | "USER") => setUserTypeFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Roles</SelectItem>
                      <SelectItem value="ADMIN">Admins</SelectItem>
                      <SelectItem value="MANAGER">Managers</SelectItem>
                      <SelectItem value="USER">Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                  <span>Loading users...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={fetchUsers} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-lg">{user.name}</div>
                              <div className="text-sm text-gray-500">ID: {user.id}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{user.email}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{user.number}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.userType === 'ADMIN' ? 'destructive' : user.userType === 'MANAGER' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {user.userType.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(user)
                                  setIsEditUserDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {user.name}'s account? This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                      <p className="text-gray-600">
                        {searchTerm ? "Try adjusting your search terms" : "No users have been added yet"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle>Login History</CardTitle>
                  <p className="text-sm text-gray-600">Track user login sessions and activity</p>
                </div>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search login history..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                  <span>Loading login history...</span>
                </div>
              ) : historyError ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading History</h3>
                  <p className="text-gray-600 mb-4">{historyError}</p>
                  <Button onClick={fetchLoginHistory} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Login Time</TableHead>
                        <TableHead>Session ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoginHistory.map((login) => (
                        <TableRow key={login.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-lg">{login.user.name}</div>
                              <div className="text-sm text-gray-500">{login.user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={login.user.userType === 'ADMIN' ? 'destructive' : login.user.userType === 'MANAGER' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {login.user.userType.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {new Date(login.loggedAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(login.loggedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              #{login.id}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredLoginHistory.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No login history found</h3>
                      <p className="text-gray-600">
                        {historySearchTerm ? "Try adjusting your search terms" : "No login sessions recorded yet"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Account</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => handleInputChange('name', e.target.value, (val) => setEditingUser({ ...editingUser, name: val }))}
                  maxLength={characterLimits.name}
                />
                {renderCharacterCount(editingUser.name, 'name')}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => handleInputChange('email', e.target.value, (val) => setEditingUser({ ...editingUser, email: val }))}
                  maxLength={characterLimits.email}
                />
                {renderCharacterCount(editingUser.email, 'email')}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-number">Phone Number</Label>
                <Input
                  id="edit-number"
                  type="tel"
                  value={editingUser.number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '') // Only allow numbers
                    handleInputChange('number', value, (val) => setEditingUser({ ...editingUser, number: val }))
                  }}
                  maxLength={characterLimits.number}
                />
                {renderCharacterCount(editingUser.number, 'number')}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-userType">User Type</Label>
                <Select
                  value={editingUser.userType}
                  onValueChange={(value: 'ADMIN' | 'MANAGER' | 'USER') => 
                    setEditingUser({ ...editingUser, userType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Regular User</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} className="bg-purple-600 hover:bg-purple-700">
              Update User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
