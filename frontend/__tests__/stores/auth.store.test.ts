import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/store/auth.store'

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().logout()
    jest.clearAllMocks()
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useAuthStore())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
    }

    const mockResponse = {
      success: true,
      data: {
        user: mockUser,
        tokens: { accessToken: 'mock-token' },
      },
    }

    const { apiClient } = require('@/lib/api')
    apiClient.post.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles login failure', async () => {
    const mockError = {
      response: {
        data: { message: 'Invalid credentials' },
      },
    }

    const { apiClient } = require('@/lib/api')
    apiClient.post.mockRejectedValue(mockError)

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword')
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Invalid credentials')
  })

  it('handles successful registration', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
    }

    const mockResponse = {
      success: true,
      data: {
        user: mockUser,
        tokens: { accessToken: 'mock-token' },
      },
    }

    const { apiClient } = require('@/lib/api')
    apiClient.post.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.register({
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        password: 'password123',
      })
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('handles logout correctly', () => {
    const { result } = renderHook(() => useAuthStore())

    // Set initial authenticated state
    act(() => {
      result.current.setUser({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)

    // Logout
    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('clears error when clearError is called', () => {
    const { result } = renderHook(() => useAuthStore())

    // Set error
    act(() => {
      result.current.setError('Test error')
    })

    expect(result.current.error).toBe('Test error')

    // Clear error
    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('sets loading state correctly during async operations', async () => {
    const { apiClient } = require('@/lib/api')
    
    // Mock a delayed response
    apiClient.post.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
    )

    const { result } = renderHook(() => useAuthStore())

    // Start login
    act(() => {
      result.current.login('test@example.com', 'password')
    })

    expect(result.current.isLoading).toBe(true)

    // Wait for completion
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    expect(result.current.isLoading).toBe(false)
  })
})