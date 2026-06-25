import React from 'react';
import { type CityConfig } from '../../../theme/cityTheme';

type CityListItemProps = {
  city: CityConfig;
  isActive: boolean;
  userCoords: { latitude: number; longitude: number } | null;
  onMouseEnter: () => void;
  onClick: () => void;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function CityListItem({
  city,
  isActive,
  userCoords,
  onMouseEnter,
  onClick,
  isAdmin,
  onEdit,
  onDelete,
}: CityListItemProps) {
  const hasCoordinates = city.latitude !== undefined && city.longitude !== undefined;

  return (
    <div
      className={`group relative w-full rounded-xl border border-brand-primary/20 bg-white transition duration-300 ${
        isActive
          ? 'border-brand-primary/30 bg-brand-primary/5 shadow-[0_10px_30px_rgba(0,0,0,0.1)]'
          : 'hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
      }`}
    >
      <button
        type="button"
        onMouseEnter={onMouseEnter}
        onFocus={onMouseEnter}
        onTouchStart={onMouseEnter}
        onClick={onClick}
        data-testid={`city-onboarding-card-${city.id}`}
        className="w-full text-left px-6 py-4 focus:outline-none rounded-xl"
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: `rgb(${city.colorPrimary || '46 125 50'})` }}
          >
            {city.label.slice(0, 1)}
          </div>

          <div className="min-w-0 flex-1 pr-24">
            <h2 className="font-display text-2xl font-semibold text-text md:text-3xl">
              {city.label}
            </h2>
            {userCoords && hasCoordinates && (
              <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-brand-primary/80">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {(() => {
                  const d = getDistance(userCoords.latitude, userCoords.longitude, city.latitude!, city.longitude!);
                  return d < 1 ? `${Math.round(d * 1000)} m de você` : `${d.toFixed(1)} km de você`;
                })()}
              </span>
            )}
          </div>
        </div>

        <span
          className="mt-4 flex w-full items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white lg:hidden"
          style={{ backgroundColor: `rgb(${city.colorPrimary || '46 125 50'})` }}
        >
          Abrir {city.label}
        </span>
      </button>

      {isAdmin && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition hover:bg-brand-primary hover:text-white shadow-sm"
            title="Editar Cidade"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white shadow-sm"
            title="Excluir Cidade"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
