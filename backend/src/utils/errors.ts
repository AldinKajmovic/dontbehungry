export class AppError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    public details: string
  ) {
    super(details);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  constructor(error: string, details: string) {
    super(400, error, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(error: string = 'Unauthorized', details: string = 'Authentication required') {
    super(401, error, details);
  }
}

export class NotFoundError extends AppError {
  constructor(error: string, details: string) {
    super(404, error, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(error: string = 'Forbidden', details: string = 'You do not have permission to access this resource') {
    super(403, error, details)
  }
}

export class ConflictError extends AppError {
  constructor(error: string, details: string) {
    super(409, error, details)
  }
}

export class TooManyRequestsError extends AppError {
  constructor(error: string = 'Too Many Requests', details: string = 'Please try again later') {
    super(429, error, details)
  }
}
