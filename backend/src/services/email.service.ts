import nodemailer from 'nodemailer'
import { config } from '../config'
import { logger } from '../utils/logger'

function escapeHtml(str: string): string {
  let escaped = ''
  for (const char of str) {
    switch (char) {
      case '&':
        escaped += '&amp;'
        break
      case '<':
        escaped += '&lt;'
        break
      case '>':
        escaped += '&gt;'
        break
      case '"':
        escaped += '&quot;'
        break
      case '\'':
        escaped += '&#39;'
        break
      default:
        escaped += char
    }
  }
  return escaped
}

function buildFrontendUrl(pathname: string, token: string): string {
  const safeToken = encodeURIComponent(token)
  return `${config.frontendUrl}${pathname}?token=${safeToken}`
}

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
    logger.debug('Email not sent - no SMTP configured', {
      to: options.to,
      subject: options.subject,
    })
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
  const verificationUrl = buildFrontendUrl('/auth/verify-email', token)

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #d9432a 0%, #b83420 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Najedise</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Welcome, ${escapeHtml(firstName)}!</h2>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #d9432a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <a href="${verificationUrl}" style="color: #d9432a;">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Najedise. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  const text = `
    Welcome to Najedise, ${firstName}!

    Please verify your email address by clicking the link below:
    ${verificationUrl}

    This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
  `

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - Najedise',
    html,
    text,
  })
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const resetUrl = buildFrontendUrl('/auth/reset-password', token)

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #d9432a 0%, #b83420 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Najedise</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #d9432a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <a href="${resetUrl}" style="color: #d9432a;">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Najedise. All rights reserved.</p>
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
    subject: 'Reset Your Password - Najedise',
    html,
    text,
  })
}

export async function sendReportEmail(
  email: string,
  subject: string,
  message: string,
  pdfBuffer: Buffer,
  filename: string
): Promise<void> {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Admin Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #d9432a 0%, #b83420 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Najedise</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Admin Report</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">${escapeHtml(subject)}</h2>
        ${message ? `<p style="color: #666;">${escapeHtml(message)}</p>` : ''}
        <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; color: #333;">
            <strong>Attached:</strong> ${escapeHtml(filename)}
          </p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
            Please find your requested report attached to this email.
          </p>
        </div>
        <p style="color: #666; font-size: 14px;">
          This report was generated on ${timestamp}.
        </p>
      </div>
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Najedise. All rights reserved.</p>
        <p style="margin-top: 5px;">This is an automated email from the Admin Panel.</p>
      </div>
    </body>
    </html>
  `

  const text = `
    Najedise Admin Report

    ${subject}

    ${message ? message + '\n\n' : ''}Attached: ${filename}

    Please find your requested report attached to this email.

    This report was generated on ${timestamp}.
  `

  if (!config.isProduction && !config.smtp.user) {
    logger.debug('Report email not sent - no SMTP configured', {
      to: email,
      subject,
      filename,
      sizeBytes: pdfBuffer.length,
    })
    return
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject,
    html,
    text,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })
}
