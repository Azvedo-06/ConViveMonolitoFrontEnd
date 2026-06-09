import type { CityTheme } from '../../theme/cityTheme';

export type FeedCategory = 'eventos' | 'cursos' | 'atividades';

export type EventAccess = 'gratuito' | 'pago';

export type CityFeedItem = {
  id: string;
  city: CityTheme;
  category: FeedCategory;
  access?: EventAccess;
  ticketPrice?: string;
  capacity?: number;
  reservedSeats?: number;
  ctaLabel?: string;
  organizerType?: string;
  title: string;
  summary: string;
  details: string;
  date: string;
  location: string;
  organizer: string;
  contact: string;
  tags: string[];
  createdBy?: number;
  rawDate?: string;
  price?: number;
  type?: 'COMMUNITY' | 'PRIVATE';
  linkedin?: string;
  instagram?: string;
  youtube?: string;
};

export const cityFeedData: CityFeedItem[] = [];