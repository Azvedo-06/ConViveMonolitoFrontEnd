import { useState } from 'react';
import { type CityFeedItem } from '../cityFeedData';
import { backendFetch } from '../../../services/backendRoutes';

type PaymentModalProps = {
  paymentEvent: CityFeedItem;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaymentModal({ paymentEvent, onClose, onSuccess }: PaymentModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handleStartStripeCheckout = async () => {
    setIsRedirecting(true);
    setPaymentError('');

    try {
      // Chama o backend para criar a sessão de Checkout do Stripe
      const response = await backendFetch<{ url: string }>('/payments/checkout-session', {
        method: 'POST',
        body: JSON.stringify({ eventId: Number(paymentEvent.id) }),
      });

      if (response && response.url) {
        // Redireciona o usuário para a página de checkout seguro do Stripe
        window.location.href = response.url;
      } else {
        throw new Error('Não foi possível gerar a sessão de pagamento.');
      }
    } catch (err: any) {
      setIsRedirecting(false);
      setPaymentError(err.message || 'Ocorreu um erro ao conectar com a Stripe. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-brand-primary/10 bg-white shadow-cityCard overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
        
        {/* Cabeçalho */}
        <header className="relative bg-brand-primary text-white px-6 py-6 flex flex-col">
          <button
            type="button"
            disabled={isRedirecting}
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Fechar checkout"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70">
            Checkout Seguro
          </span>
          <h3 className="mt-1 font-display text-lg font-bold truncate pr-8">
            {paymentEvent.title}
          </h3>
          <div className="mt-3 flex justify-between items-end border-t border-white/10 pt-3">
            <div>
              <span className="block text-[10px] text-white/60">Data</span>
              <span className="text-xs font-medium">{paymentEvent.date}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-white/60">Valor do Ingresso</span>
              <span className="text-lg font-bold">{paymentEvent.ticketPrice ?? 'Pago'}</span>
            </div>
          </div>
        </header>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            
            {/* Stripe Logo / Ícone de Pagamento */}
            <div className="w-16 h-16 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.975 1.5c-2.428 0-4.125 1.135-4.125 3.328 0 3.235 4.43 2.71 4.43 4.1 0 .438-.363.668-.992.668-.89 0-2.318-.403-3.235-.872l-.76 3.013c1.037.498 2.663.855 3.963.855 2.502 0 4.22-.128 4.22-3.413 0-3.328-4.43-2.73-4.43-4.11 0-.395.347-.645 1.012-.645.748 0 1.968.27 2.76.677l.798-2.923c-.933-.42-2.348-.682-3.642-.682zm-8.835.347L2.14 15.343h3.407L8.547 1.847H5.14zm13.155 3.65h3.42l-.588 2.378h-3.422l.59-2.378zm.59 2.378l-2.072 8.32h3.405l2.075-8.32h-3.408zm-7.618 1.085l-1.802 7.235h3.407l1.805-7.235h-3.41zm-6.26 1.48L5.663 15.343H9.07l.568-2.285H6.232z"/>
              </svg>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-neutral-800">
                Pagamento processado pela Stripe
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
                Ao clicar no botão abaixo, você será redirecionado para a plataforma de pagamento seguro da Stripe para finalizar sua compra.
              </p>
              <p className="text-[10px] text-brand-primary font-semibold bg-brand-primary/5 rounded-lg py-1.5 px-3 inline-block">
                Aceita Cartão de Crédito e Pix (Ambiente de Testes)
              </p>
            </div>
          </div>

          {paymentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-xs font-semibold text-red-600">{paymentError}</p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleStartStripeCheckout}
              disabled={isRedirecting}
              className="w-full py-3.5 rounded-xl bg-brand-primary text-white font-semibold text-xs tracking-wide shadow-sm hover:brightness-115 active:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isRedirecting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Redirecionando...</span>
                </>
              ) : (
                <>
                  <span>Ir para o Pagamento Seguro</span>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={isRedirecting}
              className="w-full py-3 rounded-xl border border-neutral-200 text-neutral-600 font-semibold text-xs hover:bg-neutral-50 active:bg-neutral-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
