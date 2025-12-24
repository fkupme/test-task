// Генерация аватаров с буквами
interface AvatarOptions {
  size?: number;
  fontSize?: number;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  borderRadius?: number;
}
const DEFAULT_AVATAR_OPTIONS: Required<AvatarOptions> = {
  size: 40,
  fontSize: 16,
  backgroundColor: '#6366f1',
  textColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
  borderRadius: 50,
};
export function useAvatarGenerator() {
  // Безопасное преобразование SVG с unicode (кириллица и т.п.) в data: URL
  function svgToDataUrl(svg: string): string {
    try {
      // UTF‑8 -> base64 вручную, иначе btoa падает на символах вне Latin1
      const utf8 = new TextEncoder().encode(svg);
      let binary = '';
      for (let i = 0; i < utf8.length; i++) binary += String.fromCharCode(utf8[i]);
      const base64 = btoa(binary);
      return `data:image/svg+xml;base64,${base64}`;
    } catch {
      // Fallback: percent-encoding (работает во всех браузерах)
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
  }

  function getAvatarUrl(name: string, options: Partial<AvatarOptions> = {}): string {
    const opts = { ...DEFAULT_AVATAR_OPTIONS, ...options };
    const firstLetter = (name || '?').trim()[0] || '?';
    const initials = firstLetter.toUpperCase();
    const svg = `<svg width="${opts.size}" height="${opts.size}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" rx="${opts.borderRadius}" fill="${opts.backgroundColor}"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="${opts.fontFamily}" font-size="${opts.fontSize}" font-weight="500" fill="${opts.textColor}">${initials}</text></svg>`;
    return svgToDataUrl(svg);
  }
  return { getAvatarUrl };
}
