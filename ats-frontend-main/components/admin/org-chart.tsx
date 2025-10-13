"use client"
import type { User } from "../../lib/auth-utils"
import { Card, CardContent } from "./card"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Badge } from "./badge"

interface OrgChartProps {
  users: User[]
  onSelectUser: (userId: string) => void
}

interface UserNode extends User {
  children: UserNode[]
}

const UserCard = ({ user, onSelectUser }: { user: UserNode; onSelectUser: (userId: string) => void }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "recruiter":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card
      className="w-64 text-center p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onSelectUser(user.id)}
    >
      <CardContent className="flex flex-col items-center space-y-2">
        <Avatar className="w-16 h-16">
          <AvatarImage src={user.profileImage || "/placeholder.svg"} alt={`${user.firstName} ${user.lastName}`} />
          <AvatarFallback>
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-semibold">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-gray-500">{user.position || "N/A"}</p>
        </div>
        <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
      </CardContent>
    </Card>
  )
}

const OrgChartNode = ({ node, onSelectUser }: { node: UserNode; onSelectUser: (userId: string) => void }) => {
  return (
    <div className="flex flex-col items-center">
      <UserCard user={node} onSelectUser={onSelectUser} />
      {node.children && node.children.length > 0 && (
        <>
          <div className="w-px h-8 bg-gray-300" />
          <div className="flex justify-center space-x-8">
            {node.children.map((child) => (
              <OrgChartNode key={child.id} node={child} onSelectUser={onSelectUser} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function OrgChart({ users, onSelectUser }: OrgChartProps) {
  const buildTree = (users: User[]): UserNode[] => {
    const userMap = new Map<string, UserNode>()
    users.forEach((user) => {
      userMap.set(user.id, { ...user, children: [] })
    })

    const tree: UserNode[] = []
    userMap.forEach((node) => {
      if (node.managerId && userMap.has(node.managerId)) {
        const manager = userMap.get(node.managerId)
        if (manager) {
          manager.children.push(node)
        }
      } else {
        tree.push(node) // root node
      }
    })

    return tree
  }

  const userTree = buildTree(users)

  return (
    <div className="p-4 overflow-x-auto">
      <div className="flex justify-center">
        <div className="flex space-x-8">
          {userTree.map((rootNode) => (
            <OrgChartNode key={rootNode.id} node={rootNode} onSelectUser={onSelectUser} />
          ))}
        </div>
      </div>
    </div>
  )
}
