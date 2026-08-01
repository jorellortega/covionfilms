import { NextResponse } from 'next/server'

export async function GET() {
  const configured = Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_STREAM_API_TOKEN
  )

  return NextResponse.json({ configured })
}
