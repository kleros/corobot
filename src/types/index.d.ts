declare module 'level'
interface Level {
  get: (key: string) => string,
  put: (key: string, value: string) => void
}
