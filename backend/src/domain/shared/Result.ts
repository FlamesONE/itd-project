export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  isSuccess(): boolean {
    return this._isSuccess;
  }

  isFailure(): boolean {
    return !this._isSuccess;
  }

  getValue(): T {
    if (!this._isSuccess) {
      throw new Error("Cannot get value of a failed result. Use getError instead.");
    }
    return this._value as T;
  }

  getError(): E {
    if (this._isSuccess) {
      throw new Error("Cannot get error of a successful result. Use getValue instead.");
    }
    return this._error as E;
  }

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  static combine<T>(results: Result<T>[]): Result<T[]> {
    const values: T[] = [];
    for (const result of results) {
      if (result.isFailure()) {
        return Result.fail(result.getError());
      }
      values.push(result.getValue());
    }
    return Result.ok(values);
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure()) {
      return Result.fail(this._error as E);
    }
    return Result.ok(fn(this._value as T));
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure()) {
      return Result.fail(this._error as E);
    }
    return fn(this._value as T);
  }

  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.isSuccess()) {
      return Result.ok(this._value as T);
    }
    return Result.fail(fn(this._error as E));
  }

  getOrElse(defaultValue: T): T {
    return this.isSuccess() ? (this._value as T) : defaultValue;
  }

  getOrThrow(): T {
    if (this.isFailure()) {
      if (this._error instanceof Error) {
        throw this._error;
      }
      throw new Error(String(this._error));
    }
    return this._value as T;
  }
}

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string = "DOMAIN_ERROR"
  ) {
    super(message);
    this.name = "DomainError";
  }
}
