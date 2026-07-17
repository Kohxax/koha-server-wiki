export default defineEventHandler((event) => {
  setHeader(event, "X-Content-Type-Options", "nosniff")
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin")
  setHeader(event, "X-Frame-Options", "SAMEORIGIN")
})
