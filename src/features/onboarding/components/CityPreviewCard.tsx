import React from 'react';
import { type CityConfig } from '../../../theme/cityTheme';
import { getImageUrl } from '../../../services/backendRoutes';

type CityPreviewCardProps = {
  previewCity: CityConfig | null;
  onSelect: (cityId: string) => void;
};

export function CityPreviewCard({ previewCity, onSelect }: CityPreviewCardProps) {
  if (!previewCity) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-primary/20 bg-white shadow-cityCard">
      <div className="relative h-[320px]">
        <img
          src={getImageUrl(previewCity.imageUrl)}
          alt={`Prévia visual da cidade de ${previewCity.label}`}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = getImageUrl(previewCity.imageFallbackUrl);
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-20"
          style={{ backgroundColor: `rgb(${previewCity.colorPrimary || '46 125 50'})` }}
        />

        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <h3 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
            {previewCity.label}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/95 md:text-base">
            {previewCity.spotlight}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <button
          type="button"
          onClick={() => onSelect(previewCity.id)}
          className="w-full rounded-md px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:brightness-110"
          style={{ backgroundColor: `rgb(${previewCity.colorPrimary || '46 125 50'})` }}
          data-testid={`city-onboarding-open-${previewCity.id}`}
        >
          Abrir {previewCity.label}
        </button>
      </div>
    </div>
  );
}
