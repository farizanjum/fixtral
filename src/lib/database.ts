import { supabase, Database } from './supabase'

// Database service layer that maintains localStorage compatibility

export interface UserCredits {
  dailyGenerations: number;
  lastResetDate: string;
  totalGenerations: number;
}
export class DatabaseService {
  // Check if Supabase is configured
  private static isSupabaseConfigured(): boolean {
    const configured = !!(supabase &&
              process.env.NEXT_PUBLIC_SUPABASE_URL &&
              process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co' &&
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key-here')

    if (!configured) {
      console.log('Supabase not configured:', {
        hasSupabase: !!supabase,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        urlValid: process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co',
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        keyValid: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key-here'
      })
    }

    return configured
  }

  // Reddit Posts
  static async saveRedditPost(post: Database['public']['Tables']['reddit_posts']['Insert']) {
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reddit_posts')
          .upsert(post, { onConflict: 'post_id' })
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.warn('Supabase save failed, falling back to localStorage:', error)
      }
    }

    // Fallback: Store in localStorage
    const posts = this.getLocalRedditPosts()
    const existingIndex = posts.findIndex((p: Database['public']['Tables']['reddit_posts']['Row']) => p.post_id === post.post_id)

    if (existingIndex >= 0) {
      posts[existingIndex] = { ...posts[existingIndex], ...post }
    } else {
      posts.push(post)
    }

    localStorage.setItem('reddit_posts', JSON.stringify(posts))
    return post
  }

  static async getRedditPosts(limit = 50) {
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reddit_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error
        return data || []
      } catch (error) {
        console.warn('Supabase fetch failed, falling back to localStorage:', error)
      }
    }

    // Fallback: Get from localStorage
    return this.getLocalRedditPosts()
  }

  private static getLocalRedditPosts() {
    try {
      const posts = localStorage.getItem('reddit_posts')
      return posts ? JSON.parse(posts) : []
    } catch {
      return []
    }
  }

  // Edit History
  static async saveEditHistory(edit: Database['public']['Tables']['edit_history']['Insert'], userId?: string) {
    console.log('DatabaseService.saveEditHistory called:', { userId, hasSupabase: this.isSupabaseConfigured() })

    if (this.isSupabaseConfigured() && userId) {
      try {
        const editWithUser = { ...edit, user_id: userId }
        console.log('Attempting to save to Supabase:', editWithUser)

        const { data, error } = await supabase
          .from('edit_history')
          .insert(editWithUser)
          .select()
          .single()

        if (error) {
          console.error('Supabase insert error:', error)
          throw error
        }

        console.log('Successfully saved to Supabase:', data)
        return data
      } catch (error: any) {
        console.warn('Supabase save failed, falling back to localStorage:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
      }
    } else {
      console.log('Supabase not configured or no userId, using localStorage only')
    }

    // Fallback: Store in localStorage (existing implementation)
    const history = this.getLocalEditHistory()
    const newEdit = { ...edit, id: edit.id || `history_${Date.now()}` }
    history.unshift(newEdit)

    // Keep only last 50 items to prevent storage issues
    const limitedHistory = history.slice(0, 50)
    localStorage.setItem('editHistory', JSON.stringify(limitedHistory))
    return newEdit
  }

  static async getEditHistory(userId?: string, limit = 50) {
    if (this.isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await supabase
          .from('edit_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error
        return data || []
      } catch (error) {
        console.warn('Supabase fetch failed, falling back to localStorage:', error)
      }
    }

    // Fallback: Get from localStorage
    return this.getLocalEditHistory()
  }

  private static getLocalEditHistory() {
    try {
      const history = localStorage.getItem('editHistory')
      return history ? JSON.parse(history) : []
    } catch {
      return []
    }
  }

  // User Management (placeholder for future auth)
  static async createUser(user: Database['public']['Tables']['users']['Insert']) {
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert(user)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.warn('Supabase user creation failed:', error)
        throw error
      }
    }

    // For now, just return the user object (no persistence without Supabase)
    return user
  }

  // Clear all data (useful for development/testing)
  static async clearAllData() {
    if (this.isSupabaseConfigured()) {
      try {
        // Note: Be careful with this in production!
        await supabase.from('edit_history').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('reddit_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      } catch (error) {
        console.warn('Supabase clear failed:', error)
      }
    }

    // Clear localStorage
    localStorage.removeItem('editHistory')
    localStorage.removeItem('reddit_posts')
    localStorage.removeItem('pendingEditorItem')
  }

  // Credit Management
  static async getUserCredits(userId: string): Promise<UserCredits> {
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .rpc('get_or_create_user_credits', { user_uuid: userId })

        if (error) throw error

        if (data && data.length > 0) {
          return {
            dailyGenerations: data[0].daily_generations,
            lastResetDate: data[0].last_reset_date,
            totalGenerations: data[0].total_generations
          }
        }
      } catch (error: any) {
        // Only log if it's not the expected "function not found" error
        if (!error?.message?.includes('Could not find the function')) {
          console.warn('Supabase credit fetch failed:', error)
        } else {
          console.log('Using localStorage fallback (database functions not yet created)')
        }
      }
    }

    // Fallback to localStorage
    const credits = JSON.parse(localStorage.getItem(`user_credits_${userId}`) || 'null')
    if (credits) {
      // Check if we need to reset daily credits
      const lastReset = new Date(credits.lastResetDate)
      const today = new Date()
      if (lastReset.toDateString() !== today.toDateString()) {
        credits.dailyGenerations = 0
        credits.lastResetDate = today.toISOString().split('T')[0]
        localStorage.setItem(`user_credits_${userId}`, JSON.stringify(credits))
      }
      return credits
    }

    // Create new credits
    const newCredits: UserCredits = {
      dailyGenerations: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      totalGenerations: 0
    }
    localStorage.setItem(`user_credits_${userId}`, JSON.stringify(newCredits))
    return newCredits
  }

  static async incrementUserCredits(userId: string): Promise<UserCredits> {
    const currentCredits = await this.getUserCredits(userId)

    // Check if user is admin (unlimited credits)
    const isAdmin = await this.checkAdminStatus(userId)
    if (!isAdmin) {
      // Check daily limit (2 generations per day) for regular users
      if (currentCredits.dailyGenerations >= 2) {
        throw new Error('Daily generation limit reached (2 per day)')
      }
    }

    const updatedCredits: UserCredits = {
      dailyGenerations: currentCredits.dailyGenerations + 1,
      lastResetDate: currentCredits.lastResetDate,
      totalGenerations: currentCredits.totalGenerations + 1
    }

    if (this.isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('user_credits')
          .upsert({
            user_id: userId,
            daily_generations: updatedCredits.dailyGenerations,
            last_reset_date: updatedCredits.lastResetDate,
            total_generations: updatedCredits.totalGenerations
          }, { onConflict: 'user_id' })

        if (error) throw error
      } catch (error) {
        console.warn('Supabase credit update failed, falling back to localStorage:', error)
        // Continue with localStorage fallback
      }
    }

    // Update localStorage
    localStorage.setItem(`user_credits_${userId}`, JSON.stringify(updatedCredits))
    return updatedCredits
  }

  static async checkAdminStatus(userId: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .rpc('is_user_admin', { user_uuid: userId })

        if (error) throw error
        return !!data
      } catch (error: any) {
        // Only log if it's not the expected "function not found" error
        if (!error?.message?.includes('Could not find the function')) {
          console.warn('Supabase admin check failed:', error)
        } else {
          console.log('Using localStorage fallback for admin check (database functions not yet created)')
        }
      }
    }

    // Fallback to localStorage (store admin status locally)
    const adminStatus = localStorage.getItem(`user_admin_${userId}`)

    // Auto-set admin for the specified admin email and/or UID from env variables
    const adminEmail = process.env.ADMIN_ID
    const adminUID = process.env.ADMIN_UID
    const userEmail = localStorage.getItem('user_email')

    // Check both email and UID for admin access (only if env vars are set)
    const isAdminByEmail = adminEmail && userEmail === adminEmail
    const isAdminByUID = adminUID && userId === adminUID

    if ((isAdminByEmail || isAdminByUID) && !adminStatus) {
      localStorage.setItem(`user_admin_${userId}`, 'true')
      console.log('Admin access granted via environment variable verification')
      return true
    }

    return adminStatus === 'true'
  }

  static async checkCreditLimit(userId: string): Promise<{ canGenerate: boolean; remainingCredits: number; credits: UserCredits; isAdmin: boolean }> {
    const credits = await this.getUserCredits(userId)
    const isAdmin = await this.checkAdminStatus(userId)

    let canGenerate: boolean
    let remainingCredits: number

    if (isAdmin) {
      // Admin users have unlimited credits
      canGenerate = true
      remainingCredits = 999 // Show high number for unlimited
    } else {
      // Regular users have daily limits
      remainingCredits = Math.max(0, 2 - credits.dailyGenerations)
      canGenerate = credits.dailyGenerations < 2
    }

    return { canGenerate, remainingCredits, credits, isAdmin }
  }
}
