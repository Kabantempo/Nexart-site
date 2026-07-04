type MailOptions = {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendMail(opts: MailOptions): Promise<void> {
  if (!process.env.SMTP_PASS) return

  // Import dynamique pour éviter que nodemailer soit résolu au démarrage
  const nodemailer = (await import('nodemailer')).default

  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: 'contact@nexart.fr',
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  })

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await transporter.sendMail({
        from: '"Nexart" <contact@nexart.fr>',
        ...opts,
      })
      return
    } catch (err) {
      if (attempt === 3) throw err
      await new Promise(r => setTimeout(r, attempt * 1000))
    }
  }
}
