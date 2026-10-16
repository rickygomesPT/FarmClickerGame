// Loader de imagens para export estático no GitHub Pages.
// Com `output: 'export'` não há otimização no servidor, e o loader padrão
// ignora o `basePath` quando `unoptimized` (daí os 404 em `/images/...`).
// Este loader só prefixa o caminho base; os ficheiros saem como estão.
import type { ImageLoaderProps } from 'next/image';

export default function imageLoader({ src }: ImageLoaderProps): string {
  if (src.startsWith('http')) return src;
  const basePath = process.env.NEXT_BASE_PATH ?? '';
  return `${basePath}${src}`;
}
