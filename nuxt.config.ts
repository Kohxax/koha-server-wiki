import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  css: ['~/assets/css/tailwind.css'],
  compatibilityDate: '2025-01-01',
  vite: {
    plugins: [tailwindcss()],
  },
  modules: ['shadcn-nuxt', '@nuxt/fonts', '@nuxtjs/color-mode', 'nuxt-auth-utils'],
  runtimeConfig: {
    public: {
      devAuthBypass: !!process.env.NUXT_DEV_AUTH_BYPASS,
    },
  },
  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: 'Ui',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: '@/components/ui',
  },
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },
  fonts: {
    families: [
      { name: 'Noto Sans JP', provider: 'google', weights: [400, 500, 600, 700] },
    ],
  },
})
