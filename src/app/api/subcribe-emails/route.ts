import { NextResponse } from 'next/server'

export async function GET() {
    try {
      const response = await fetch('https://seet25.sw-conf.com/subscribe-emails', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
  
      if (!response.ok) {
        throw new Error('Failed to fetch from the API')
      }
  
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Error in API route:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }