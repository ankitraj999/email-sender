import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { from, to, subject, body } = await request.json()

  try {
    const data = await resend.emails.send({
      from: from,
      to: [to],
      subject: subject,
      text: body,
    })
    console.log(NextResponse.json(data))
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error })
  }
}