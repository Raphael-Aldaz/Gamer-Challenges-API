export class HttpClientError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public field?: string
  ) {
    super(message)
    this.name = "HttpClientError"
    Object.setPrototypeOf(this, HttpClientError.prototype)
  }
}

// Classes spécifiques
export class BadRequestError extends HttpClientError {
  constructor(message: string, field?: string) {
    super(400, message, "BAD_REQUEST", field)
  }
}

export class UnauthorizedError extends HttpClientError {
  constructor(message: string, code = "UNAUTHORIZED") {
    super(401, message, code)
  }
}

export class ForbiddenError extends HttpClientError {
  constructor(message: string, code = "FORBIDDEN") {
    super(403, message, code)
  }
}

export class NotFoundError extends HttpClientError {
  constructor(message: string, code = "NOT_FOUND") {
    super(404, message, code)
  }
}

export class ConflictError extends HttpClientError {
  constructor(message: string, code = "CONFLICT", field?: string) {
    super(409, message, code, field)
  }
}
