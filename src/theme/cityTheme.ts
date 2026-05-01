export type CityTheme = 'campo-mourao' | 'mambore';

export type CityConfig = {
  id: CityTheme;
  label: string;
  theme: CityTheme;
  accentClassName: string;
  imageUrl: string;
  imageFallbackUrl: string;
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
  },
  {
    id: 'mambore',
    label: 'Mamborê',
    theme: 'mambore',
    accentClassName: 'bg-city-mambore text-white',
    imageUrl: '/images/mambore2.jpg',
    imageFallbackUrl:
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=900&q=80',
  },
];

export function applyCityTheme(theme: CityTheme) {
  document.documentElement.setAttribute('data-city-theme', theme);
}
