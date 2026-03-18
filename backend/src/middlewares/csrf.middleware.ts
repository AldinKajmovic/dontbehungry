import { doubleCsrf } from 'csrf-csrf'
import { config } from '../config'

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => config.jwt.secret as string,
  getSessionIdentifier: (req) => req.cookies?.accessToken ?? '',
  cookieName: '_csrfSecret',
  cookieOptions: {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/',
  },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
})

export { doubleCsrfProtection, generateCsrfToken }
