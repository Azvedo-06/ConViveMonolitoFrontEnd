import { useState, useEffect } from 'react';
import { type CityConfig } from '../../../theme/cityTheme';
import { type UserResponseDto } from '../../../services/backendRoutes';

type CityHeaderProps = {
  selectedCity: CityConfig;
  user: UserResponseDto | null;
  onLogout: () => void;
  onBack: () => void;
  onLogin: () => void;
  onSignup?: () => void;
  onOpenProfile: () => void;
};

export function CityHeader({
  selectedCity,
  user,
  onLogout,
  onBack,
  onLogin,
  onSignup,
  onOpenProfile,
}: CityHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function handleMobileBack() {
    closeMobileMenu();
    onBack();
  }

  function handleMobileLogin() {
    closeMobileMenu();
    onLogin();
  }

  function handleMobileSignup() {
    closeMobileMenu();
    onSignup?.();
  }

  return (
    <header className="relative z-20 bg-brand-primary text-brand-contrast">
      <div className="flex items-center justify-between px-4 py-4 md:px-8 md:py-5">
        <button
          type="button"
          onClick={onBack}
          className="hidden items-center gap-2 transition-opacity hover:opacity-80 md:flex"
          data-testid="city-brand-button"
        >
          <span className="font-display text-lg font-bold tracking-wide">CONVIVE</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-contrast/85 md:text-[11px]">
            {selectedCity.label}
          </span>
        </button>

        <div className="flex items-center gap-2 md:hidden" data-testid="city-brand-label">
          <span className="font-display text-lg font-bold tracking-wide">CONVIVE</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-contrast/85">
            {selectedCity.label}
          </span>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-contrast/15 text-brand-contrast transition hover:bg-brand-contrast/25 focus:outline-none focus:ring-2 focus:ring-brand-contrast/50"
              title={user.name}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-brand-contrast/10"
            aria-expanded={mobileMenuOpen}
            aria-controls="city-mobile-menu"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            data-testid="city-mobile-menu-button"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>

        <nav className="hidden items-center gap-3 text-xs font-medium md:flex md:gap-6 md:text-sm">
          {user ? (
            <>
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-contrast/15 text-brand-contrast transition hover:bg-brand-contrast/25 focus:outline-none focus:ring-2 focus:ring-brand-contrast/50"
                title={user.name}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="rounded px-3 py-1.5 transition hover:bg-brand-contrast/10"
                data-testid="city-logout-button-desktop"
              >
                SAIR
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="rounded px-3 py-1.5 transition hover:bg-brand-contrast/10"
              data-testid="city-login-button-desktop"
            >
              LOGIN
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="rounded px-3 py-1.5 transition hover:bg-brand-contrast/10"
            data-testid="city-switch-button"
          >
            TROCAR CIDADE
          </button>
        </nav>
      </div>

      {mobileMenuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 bg-black/30 md:hidden"
            aria-label="Fechar menu"
            onClick={closeMobileMenu}
            data-testid="city-mobile-menu-backdrop"
          />
          <nav
            id="city-mobile-menu"
            className="relative z-20 border-t border-brand-contrast/20 px-4 py-3 md:hidden"
            data-testid="city-mobile-menu"
          >
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={handleMobileBack}
                  className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold transition hover:bg-brand-contrast/10"
                  data-testid="city-switch-button-mobile"
                >
                  TROCAR CIDADE
                </button>
              </li>
              {user ? (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onLogout();
                    }}
                    className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold transition hover:bg-brand-contrast/10"
                    data-testid="city-logout-button-mobile"
                  >
                    SAIR
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={handleMobileLogin}
                      className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold transition hover:bg-brand-contrast/10"
                      data-testid="city-login-button-mobile"
                    >
                      LOGIN
                    </button>
                  </li>
                  {onSignup ? (
                    <li>
                      <button
                        type="button"
                        onClick={handleMobileSignup}
                        className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold transition hover:bg-brand-contrast/10"
                        data-testid="city-signup-button-mobile"
                      >
                        CADASTRO
                      </button>
                    </li>
                  ) : null}
                </>
              )}
            </ul>
          </nav>
        </>
      ) : null}
    </header>
  );
}
