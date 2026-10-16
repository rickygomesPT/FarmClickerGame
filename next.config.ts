
import type {NextConfig} from 'next';

// GitHub Pages só serve ficheiros estáticos: `output: 'export'` gera a
// pasta `out/` (em vez de um servidor Node) e `images.unoptimized: true`
// desliga a otimização de imagens (que precisa de servidor).
//
// `NEXT_BASE_PATH`: caminho do site no Pages.
//   - Site de projeto  (user.github.io/REPO)  → '/REPO' (ver workflow)
//   - Site de utilizador (user.github.io)     → '' (vazio)
// O `next/image` trata do prefixo sozinho; não usar `/images/...` à mão.
const basePath = process.env.NEXT_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath || undefined,
  /* config options here */
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
