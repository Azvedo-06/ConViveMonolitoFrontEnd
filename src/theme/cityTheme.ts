export type CityTheme = string;

export type CityConfig = {
  id: CityTheme;
  label: string;
  theme: CityTheme;
  accentClassName?: string;
  imageUrl: string;
  imageFallbackUrl: string;
  description: string;
  tags: string[];
  spotlight: string;
  colorPrimary?: string;
  colorSecondary?: string;
  latitude?: number;
  longitude?: number;
  state?: string;
};

export const cityOptions: CityConfig[] = [
  {
    id: 'campo-mourao',
    label: 'Campo Mourão',
    theme: 'campo-mourao',
    accentClassName: 'bg-city-campoMourao text-white',
    imageUrl: '/images/campo-mourao2.jpg',
    imageFallbackUrl:
      'https://images.unsplash.com/photo-1505765050516-f72dcac9c60d?auto=format&fit=crop&w=900&q=80',
    description: 'Feiras, cursos rápidos e eventos com forte circulação urbana e público diversificado.',
    tags: ['cultura', 'cursos', 'eventos gratuitos'],
    spotlight: 'Boa para quem quer alcance maior e variedade de público.',
    colorPrimary: '46 125 50',
    colorSecondary: '102 187 106',
    latitude: -24.0439,
    longitude: -52.3781,
    state: 'PR',
  },
  {
    id: 'mambore',
    label: 'Mamborê',
    theme: 'mambore',
    accentClassName: 'bg-city-mambore text-white',
    imageUrl: '/images/mambore2.jpg',
    imageFallbackUrl:
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=900&q=80',
    description: 'Programação comunitária, cursos e atividades mais próximas da rotina local.',
    tags: ['comunidade', 'atividades', 'agenda local'],
    spotlight: 'Boa para quem quer conversa mais próxima e comunicação local.',
    colorPrimary: '216 67 21',
    colorSecondary: '255 138 101',
    latitude: -24.3197,
    longitude: -52.7303,
    state: 'PR',
  },
];

export function applyCityTheme(themeOrCity: string | CityConfig) {
  let primaryRgb = '46 125 50';
  let secondaryRgb = '102 187 106';

  if (typeof themeOrCity === 'string') {
    document.documentElement.setAttribute('data-city-theme', themeOrCity);
    if (themeOrCity === 'campo-mourao') {
      primaryRgb = '46 125 50';
      secondaryRgb = '102 187 106';
    } else if (themeOrCity === 'mambore') {
      primaryRgb = '216 67 21';
      secondaryRgb = '255 138 101';
    }
  } else {
    document.documentElement.setAttribute('data-city-theme', themeOrCity.theme);
    primaryRgb = themeOrCity.colorPrimary || '46 125 50';
    secondaryRgb = themeOrCity.colorSecondary || '102 187 106';
  }

  // Parse RGB values to check relative luminance (WCAG Standard)
  const rgbParts = primaryRgb.split(/\s+/).map(Number);
  let contrastColor = '255 255 255'; // Default white contrast

  if (rgbParts.length === 3 && !rgbParts.some(isNaN)) {
    const [r, g, b] = rgbParts;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (luminance > 0.65) {
      contrastColor = '30 30 30'; // Dark text for bright backgrounds (e.g. yellow)
    }
  }

  document.documentElement.style.setProperty('--color-primary', primaryRgb);
  document.documentElement.style.setProperty('--color-secondary', secondaryRgb);
  document.documentElement.style.setProperty('--color-primary-contrast', contrastColor);
}
