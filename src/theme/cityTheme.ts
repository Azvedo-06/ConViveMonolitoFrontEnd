export type CityTheme = 'campo-mourao' | 'mambore';

export type CityConfig = {
  id: CityTheme;
  label: string;
  theme: CityTheme;
  accentClassName: string;
  imageUrl: string;
  imageFallbackUrl: string;
  description: string;
  tags: string[];
  spotlight: string;
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
  },
];

export function applyCityTheme(theme: CityTheme) {
  document.documentElement.setAttribute('data-city-theme', theme);
}
