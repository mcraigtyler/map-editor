export class DomainError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 422, details);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, identifier?: string) {
    const message = identifier ? `${resource} not found: ${identifier}` : `${resource} not found`;
    super(message, 404);
  }
}

export class InternalServerError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 500, details);
  }
}
