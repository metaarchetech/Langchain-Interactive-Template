import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 自定义插件：移除 CSP header
    {
      name: 'remove-csp',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.removeHeader('Content-Security-Policy')
          res.removeHeader('X-Content-Security-Policy')
          next()
        })
      }
    }
  ]
})
