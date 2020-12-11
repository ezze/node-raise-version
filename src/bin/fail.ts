export default function fail(message: string | null, error: any): void {
  if (message) {
    console.error(message);
  }
  if (error) {
    console.error(error);
  }
  process.exit(1);
}
