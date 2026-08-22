// Fires on every verified (non-spam) Netlify Forms submission.
// Its only job is to leave an independent, timestamped record in the function log,
// so a quote request can still be recovered if the notification email never lands.
export default async (req: Request) => {
  let payload: Record<string, any> = {}

  try {
    const body = (await req.json()) as { payload?: Record<string, any> }
    payload = body?.payload ?? {}
  } catch {
    console.error('[quote-request] could not parse submission payload')
    return new Response('Bad payload', { status: 400 })
  }

  const data = (payload.data ?? {}) as Record<string, string>

  console.log(
    '[quote-request] verified submission',
    JSON.stringify({
      form: payload.form_name,
      submissionId: payload.id,
      receivedAt: payload.created_at,
      name: data.name,
      phone: data.phone,
      email: data.email,
      zip: data.zip,
      service: data.service,
      notes: data.notes,
    }),
  )

  return new Response('Logged')
}
