export = function fail(message: string | null, error: Error | null): void {
  if (message) {
    console.error(message);
  }
  if (error) {
    console.error(error);
  }
  process.exit(1);
}
