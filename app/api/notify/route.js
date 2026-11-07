/* ============================================================
   POST /api/notify
   ------------------------------------------------------------
   Reçoit le récapitulatif d'une réservation et prévient l'équipe
   par e-mail. Aucun paquet supplémentaire : appel direct à l'API
   Resend quand les variables d'environnement sont présentes.

   À configurer sur Vercel (Settings → Environment Variables) :
     RESEND_API_KEY   clé obtenue sur resend.com (offre gratuite)
     NOTIFY_EMAIL     adresse de l'équipe qui reçoit les demandes
     NOTIFY_FROM      expéditeur, ex. "OCD Live <onboarding@resend.dev>"

   Sans ces variables, la route répond simplement « non configuré » :
   la réservation reste enregistrée et visible dans /admin.
   ============================================================ */

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { subject, message, to } = payload || {};
  if (!message) {
    return Response.json({ ok: false, error: 'Message manquant' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.NOTIFY_EMAIL || to;
  const from = process.env.NOTIFY_FROM || 'OCD Live <onboarding@resend.dev>';

  if (!apiKey || !recipient) {
    console.info('[OCD Live] Notification non envoyée (service e-mail non configuré) :\n' + message);
    return Response.json({ ok: true, sent: false, reason: 'service e-mail non configuré' });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: subject || 'OCD Live — nouvelle réservation',
        text: message
      })
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('[OCD Live] Échec de l’envoi e-mail :', res.status, detail);
      return Response.json({ ok: false, sent: false, status: res.status }, { status: 502 });
    }

    return Response.json({ ok: true, sent: true });
  } catch (error) {
    console.error('[OCD Live] Erreur réseau lors de l’envoi e-mail :', error);
    return Response.json({ ok: false, sent: false, error: 'réseau' }, { status: 502 });
  }
}
