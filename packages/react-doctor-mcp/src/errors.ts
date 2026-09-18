export class ReactDoctorMcpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReactDoctorMcpError";
  }
}

export class InvalidArgumentsError extends ReactDoctorMcpError {
  constructor(detail: string) {
    super(`Invalid arguments: ${detail}`);
    this.name = "InvalidArgumentsError";
  }
}
