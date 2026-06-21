export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T | null;

  constructor(message: string, data: T | null = null, success = true) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static ok<T>(message: string, data: T | null = null) {
    return new ApiResponse<T>(message, data, true);
  }

  static fail(message: string, data: null = null) {
    return new ApiResponse<null>(message, data, false);
  }
}
