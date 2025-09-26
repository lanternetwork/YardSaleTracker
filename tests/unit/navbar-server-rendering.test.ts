import { describe, it, expect } from 'vitest'

// Mock session types
interface MockSession {
  user: {
    id: string
    email: string
  }
}

// Test navbar rendering logic
function getNavbarContent(session: MockSession | null) {
  if (!session) {
    return {
      showSignIn: true,
      showAccount: false,
      userEmail: null
    }
  }

  return {
    showSignIn: false,
    showAccount: true,
    userEmail: session.user.email
  }
}

describe('Navbar Server Rendering', () => {
  it('should show only Sign In when no session', () => {
    const content = getNavbarContent(null)
    
    expect(content.showSignIn).toBe(true)
    expect(content.showAccount).toBe(false)
    expect(content.userEmail).toBeNull()
  })

  it('should show only Account when session exists', () => {
    const session: MockSession = {
      user: {
        id: 'test-user',
        email: 'test@example.com'
      }
    }
    
    const content = getNavbarContent(session)
    
    expect(content.showSignIn).toBe(false)
    expect(content.showAccount).toBe(true)
    expect(content.userEmail).toBe('test@example.com')
  })

  it('should ensure mutual exclusivity', () => {
    const session: MockSession = {
      user: {
        id: 'test-user',
        email: 'test@example.com'
      }
    }
    
    const noSessionContent = getNavbarContent(null)
    const withSessionContent = getNavbarContent(session)
    
    // No session: only Sign In
    expect(noSessionContent.showSignIn && noSessionContent.showAccount).toBe(false)
    expect(noSessionContent.showSignIn).toBe(true)
    
    // With session: only Account
    expect(withSessionContent.showSignIn && withSessionContent.showAccount).toBe(false)
    expect(withSessionContent.showAccount).toBe(true)
  })

  it('should handle different user emails', () => {
    const sessions = [
      { user: { id: '1', email: 'user1@example.com' } },
      { user: { id: '2', email: 'user2@example.com' } },
      { user: { id: '3', email: 'admin@example.com' } }
    ]
    
    sessions.forEach(session => {
      const content = getNavbarContent(session)
      expect(content.showAccount).toBe(true)
      expect(content.showSignIn).toBe(false)
      expect(content.userEmail).toBe(session.user.email)
    })
  })
})
