import nodemailer from 'nodemailer'
import { config } from '../config'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: config.smtp.user ? {
    user: config.smtp.user,
    pass: config.smtp.pass,
  } : undefined,
  connectionTimeout: 5000, 
  greetingTimeout: 5000,   
  socketTimeout: 10000,    
})

async function sendEmail(options: EmailOptions): Promise<void> {

  if (!config.isProduction && !config.smtp.user) {
    console.log('=== Email (not sent - no SMTP configured) ===')
    console.log(`To: ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    console.log(`Body: ${options.text || options.html}`)
    console.log('==============================================')
    return
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const verificationUrl = `${config.frontendUrl}/auth/verify-email?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #00A082 0%, #00C49A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Glovo Clone</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Welcome, ${firstName}!</h2>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #00A082; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <a href="${verificationUrl}" style="color: #00A082;">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Glovo Clone. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  const text = `
    Welcome to Glovo Clone, ${firstName}!

    Please verify your email address by clicking the link below:
    ${verificationUrl}

    This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
  `

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - Glovo Clone',
    html,
    text,
  })
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #00A082 0%, #00C49A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Glovo Clone</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #00A082; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <a href="${resetUrl}" style="color: #00A082;">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Glovo Clone. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  const text = `
    Password Reset Request

    Hi ${firstName},

    We received a request to reset your password. Click the link below to create a new password:
    ${resetUrl}

    This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
  `

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - Glovo Clone',
    html,
    text,
  })
}
