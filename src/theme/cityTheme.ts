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
  },
];

export function applyCityTheme(themeOrCity: string | CityConfig) {
  if (typeof themeOrCity === 'string') {
    document.documentElement.setAttribute('data-city-theme', themeOrCity);
    if (themeOrCity === 'campo-mourao') {
      document.documentElement.style.setProperty('--color-primary', '46 125 50');
      document.documentElement.style.setProperty('--color-secondary', '102 187 106');
    } else if (themeOrCity === 'mambore') {
      document.documentElement.style.setProperty('--color-primary', '216 67 21');
      document.documentElement.style.setProperty('--color-secondary', '255 138 101');
    }
  } else {
    document.documentElement.setAttribute('data-city-theme', themeOrCity.theme);
    document.documentElement.style.setProperty('--color-primary', themeOrCity.colorPrimary || '46 125 50');
    document.documentElement.style.setProperty('--color-secondary', themeOrCity.colorSecondary || '102 187 106');
  }
}
