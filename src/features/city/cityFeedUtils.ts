import type { CityTheme } from '../../theme/cityTheme';
import type { CityFeedItem, FeedCategory } from './cityFeedData';

export const cityCategoryOptions: Array<{ id: FeedCategory; label: string }> = [
  { id: 'eventos', label: 'EVENTOS' },
  { id: 'cursos', label: 'CURSOS' },
  { id: 'atividades', label: 'ATIVIDADES' },
  { id: 'informativos', label: 'INFORMATIVOS' },
];

export function filterCityFeed(
  items: CityFeedItem[],
  city: CityTheme,
  category: FeedCategory,
  searchTerm: string,
): CityFeedItem[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return items
    .filter((item) => item.city === city && item.category === category)
    .filter((item) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = `${item.title} ${item.summary} ${item.location} ${item.organizer}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
}