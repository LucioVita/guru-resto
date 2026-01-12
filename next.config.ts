import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
```

Guardá (`Ctrl + O`, `Enter`, `Ctrl + X`).

Ahora también necesitamos configurar tus páginas del dashboard. Escribí:
```
find src -name "page.tsx" | grep dashboard
