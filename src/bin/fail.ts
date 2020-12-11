export default function fail(message: string | null, error: Error): void {
  if (message) {
    console.error(message);
  }
  if (error) {
    console.error(error);
  }
  process.exit(1);
}
