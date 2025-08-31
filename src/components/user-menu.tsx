'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-context'
import { User, LogOut, History, Zap } from 'lucide-react'

interface UserMenuProps {
  onShowHistory?: () => void
}

export const UserMenu: React.FC<UserMenuProps> = ({ onShowHistory }) => {
  const { user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [userCredits, setUserCredits] = useState<{ dailyGenerations: number; remainingCredits: number; isAdmin: boolean } | null>(null)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  // Load user credits on component mount
  useEffect(() => {
    const loadUserCredits = async () => {
      const userId = localStorage.getItem('user_id')
      if (userId) {
        try {
          const { DatabaseService } = await import('@/lib/database')
          const { canGenerate, remainingCredits, credits, isAdmin } = await DatabaseService.checkCreditLimit(userId)
          setUserCredits({
            dailyGenerations: credits.dailyGenerations,
            remainingCredits,
            isAdmin
          })
        } catch (error) {
          console.error('Error loading user credits in menu:', error)
        }
      }
    }

    if (user) {
      loadUserCredits()
    }
  }, [user])

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(user.email || 'U')}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {userCredits && (
              <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-muted/20">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className="text-xs">
                  {userCredits.isAdmin ? (
                    <span className="text-purple-600 font-medium">Admin: Unlimited</span>
                  ) : (
                    <span className="text-muted-foreground">
                      {userCredits.remainingCredits} generations left
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onShowHistory}>
          <History className="mr-2 h-4 w-4" />
          <span>Edit History</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
