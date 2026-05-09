import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const backendURL = env.VITE_BACKEND_URL || 'http://localhost:5000';

    return {
        base: '/',
        plugins: [react()],
        server: {
            port: 3000,
            proxy: {
                '/api': {
                    target: backendURL,
                    changeOrigin: true
                }
            }
        }
    };
})
