import { useState, useEffect } from 'react';
import { type CityFeedItem } from '../cityFeedData';
import { backendFetch, backendRoutes } from '../../../services/backendRoutes';

type PaymentModalProps = {
  paymentEvent: CityFeedItem;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaymentModal({ paymentEvent, onClose, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFocus, setCardFocus] = useState<'number' | 'name' | 'expiry' | 'cvv' | ''>('');
  const [paymentError, setPaymentError] = useState('');
  const [pixTimer, setPixTimer] = useState(300);
  const [pixKeyCopied, setPixKeyCopied] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Countdown Timer do Pix
  useEffect(() => {
    if (paymentMethod !== 'pix' || paymentStep !== 'select' || pixTimer <= 0) {
      return;
    }
    const interval = setInterval(() => {
      setPixTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentMethod, paymentStep, pixTimer]);

  const formatPixTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getCardType = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    if (cleanNum.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(cleanNum)) return 'MASTERCARD';
    if (/^3[47]/.test(cleanNum)) return 'AMEX';
    if (/^(6011|65|64[4-9])/.test(cleanNum)) return 'DISCOVER';
    return 'CRÉDITO';
  };

  const formatCardNumberPreview = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += cleanNum[i] || '•';
    }
    return formatted;
  };

  const handleCardNumberChange = (value: string) => {
    const cleanNum = value.replace(/\D/g, '').slice(0, 16);
    let formatted = '';
    for (let i = 0; i < cleanNum.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += cleanNum[i];
    }
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (value: string) => {
    const cleanNum = value.replace(/\D/g, '').slice(0, 4);
    if (cleanNum.length > 2) {
      setCardExpiry(`${cleanNum.slice(0, 2)}/${cleanNum.slice(2)}`);
    } else {
      setCardExpiry(cleanNum);
    }
  };

  const handleCardCvvChange = (value: string) => {
    const cleanNum = value.replace(/\D/g, '').slice(0, 4);
    setCardCvv(cleanNum);
  };

  const handleCopyPixKey = () => {
    const pixKey = `00020101021226830014br.gov.bcb.pix25610014convive.pagar2534${paymentEvent.id}5204000053039865405${paymentEvent.price?.toFixed(2) || '0.00'}5802BR5915ConVive Pagamentos6009CM-Mambore62070503***6304`;
    navigator.clipboard.writeText(pixKey);
    setPixKeyCopied(true);
    setTimeout(() => setPixKeyCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    setPaymentError('');
    
    // Validations for Credit Card
    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (cleanCard.length < 16) {
        setPaymentError('O número do cartão deve ter 16 dígitos.');
        return;
      }
      if (!cardName.trim()) {
        setPaymentError('Insira o nome impresso no cartão.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setPaymentError('A data de validade deve estar no formato MM/AA.');
        return;
      }
      const [expMonth, expYear] = cardExpiry.split('/').map(Number);
      if (expMonth < 1 || expMonth > 12) {
        setPaymentError('Mês de validade inválido.');
        return;
      }
      if (cardCvv.replace(/\D/g, '').length < 3) {
        setPaymentError('O CVV deve ter pelo menos 3 dígitos.');
        return;
      }
    }

    setPaymentStep('processing');
    
    // Simulate steps of transaction
    const steps = [
      'Conectando com o gateway de pagamento...',
      paymentMethod === 'pix' ? 'Validando transação Pix no Banco Central...' : 'Validando dados do cartão e limites...',
      paymentMethod === 'pix' ? 'Aguardando liquidação imediata...' : 'Processando transação com a operadora...',
      'Autorizando sua inscrição no evento...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingStatus(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, i === 0 ? 1000 : 800));
    }

    setPaymentStep('success');
    
    // After success, join event and trigger callback
    setTimeout(async () => {
      try {
        await backendFetch(backendRoutes.joinEvent(paymentEvent.id), { method: 'POST' });
        onSuccess();
      } catch (err: any) {
        // If join failed, show error back in checkout select step
        setPaymentStep('select');
        setPaymentError(err.message || 'Erro ao realizar inscrição pós-pagamento.');
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-brand-primary/15 bg-white shadow-cityCard overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
        <header className="relative bg-brand-primary text-white px-5 py-5 flex flex-col">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition focus:outline-none"
            aria-label="Fechar checkout"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/75">
            Checkout de Pagamento
          </span>
          <h3 className="mt-1 font-display text-lg font-bold truncate pr-8">
            {paymentEvent.title}
          </h3>
          <div className="mt-3 flex justify-between items-end border-t border-white/10 pt-3">
            <div>
              <span className="block text-[10px] text-white/60">Data do Evento</span>
              <span className="text-xs font-medium">{paymentEvent.date}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-white/60">Valor do Ingresso</span>
              <span className="text-lg font-bold">{paymentEvent.ticketPrice ?? 'Pago'}</span>
            </div>
          </div>
        </header>

        {paymentStep === 'select' && (
          <div className="p-5">
            {/* Payment Method Tabs */}
            <div className="flex bg-neutral-100 p-1 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition ${
                  paymentMethod === 'pix'
                    ? 'bg-white text-brand-primary shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                PIX (Imediato)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition ${
                  paymentMethod === 'card'
                    ? 'bg-white text-brand-primary shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Cartão de Crédito
              </button>
            </div>

            {paymentMethod === 'pix' ? (
              <div className="space-y-4 text-center">
                {/* Simulated Pix QR Code */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 inline-block mx-auto">
                  <svg className="w-36 h-36 mx-auto text-neutral-800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" rx="12" fill="white"/>
                    <path d="M10 10h20v20H10V10zm5 5v10h10V15H15zm55-5h20v20H70V10zm5 5v10h10V15H75zM10 70h20v20H10V70zm5 5v10h10V75H15z" fill="currentColor"/>
                    <path d="M40 10h5v10h-5zm10 0h5v5h-5zm10 5h5v5h-5zm-20 10h10v5H40zm15 0h10v5H55zm-15 10h5v10h-5zm10 5h15v5H50zm-10 10h10v5H40zm25-10h5v5h-5zm5 5h10v5H70zm10 5h10v5H80zm-70 15h5v5H10zm15 5h15v5H25zm10 10h5v5H35zm20-15h15v5H55zm5 10h10v5H60zm10 5h20v5H70zm10-10h5v5H80zm5-10h5v5H85zm-45-15h5v5H40zm15 5h5v10H55z" fill="currentColor"/>
                    <rect x="36" y="36" width="28" height="28" rx="8" fill="#32bcad"/>
                    <path d="M44 50l6-6 6 6-6 6-6-6zm2 0l4-4 4 4-4 4-4-4z" fill="white"/>
                    <circle cx="50" cy="50" r="1.5" fill="white"/>
                  </svg>
                </div>

                <div className="text-xs text-neutral-500 flex flex-col gap-0.5">
                  <span>Escaneie o QR Code acima ou use a chave copia e cola</span>
                  <span className="font-semibold text-brand-primary">
                    Código expira em: {formatPixTimer(pixTimer)}
                  </span>
                </div>

                {/* Copia e Cola box */}
                <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl p-2.5">
                  <div className="flex-1 text-left text-[10px] font-mono truncate select-all text-neutral-600">
                    {`00020101021226830014br.gov.bcb.pix25610014convive.pagar2534${paymentEvent.id}5204000053039865405${paymentEvent.price?.toFixed(2) || '0.00'}5802BR5915ConVive Pagamentos6009CM-Mambore62070503***6304`}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPixKey}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                      pixKeyCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
                    }`}
                  >
                    {pixKeyCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>

                {paymentError && (
                  <p className="text-xs font-medium text-red-600">{paymentError}</p>
                )}

                <div className="pt-2 border-t border-neutral-100 flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 text-xs font-semibold rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="flex-1 py-3 text-xs font-semibold rounded-xl bg-brand-primary text-white transition hover:brightness-110"
                  >
                    Confirmar Pagamento
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Interactive 3D Card Preview */}
                <div className="relative mx-auto w-full max-w-[300px] h-44 [perspective:1000px] mb-5 select-none font-mono text-white">
                  <div className={`relative w-full h-full duration-700 [transform-style:preserve-3d] ${cardFocus === 'cvv' ? '[transform:rotateY(180deg)]' : ''}`}>
                    {/* Front of Card */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl p-4 bg-gradient-to-br from-neutral-800 to-neutral-950 border border-white/10 [backface-visibility:hidden] flex flex-col justify-between shadow-md">
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-6 bg-amber-400/80 rounded border border-amber-300/30 flex items-center justify-center overflow-hidden">
                          <div className="grid grid-cols-3 gap-0.5 w-full h-full p-1 opacity-55">
                            {[...Array(9)].map((_, i) => (
                              <div key={i} className="border border-neutral-900/40 rounded-sm" />
                            ))}
                          </div>
                        </div>
                        <div className="text-right text-[10px] font-bold tracking-widest italic opacity-90">
                          {getCardType(cardNumber)}
                        </div>
                      </div>
                      <div className="text-base tracking-[0.15em] font-semibold text-center my-2 min-h-[24px]">
                        {formatCardNumberPreview(cardNumber)}
                      </div>
                      <div className="flex justify-between items-end text-[9px] uppercase tracking-wider">
                        <div className="max-w-[70%]">
                          <span className="block text-[7px] opacity-65">Titular</span>
                          <span className="block font-medium truncate min-h-[14px]">{cardName || 'NOME DO TITULAR'}</span>
                        </div>
                        <div>
                          <span className="block text-[7px] opacity-65">Validade</span>
                          <span className="block font-medium">{cardExpiry || 'MM/AA'}</span>
                        </div>
                      </div>
                    </div>
                    {/* Back of Card */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-950 border border-white/10 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between py-4 shadow-md">
                      <div className="w-full h-8 bg-neutral-950 mt-1" />
                      <div className="px-4 flex items-center justify-between gap-3">
                        <div className="flex-1 h-7 bg-neutral-200 rounded-sm" />
                        <div className="w-12 h-7 bg-white text-neutral-900 rounded-sm flex items-center justify-center font-bold text-xs">
                          {cardCvv || 'CVV'}
                        </div>
                      </div>
                      <div className="px-4 text-[7px] opacity-55 text-center leading-normal">
                        Apenas para simulação e teste de pagamento na plataforma.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Número do Cartão</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      onFocus={() => setCardFocus('number')}
                      onBlur={() => setCardFocus('')}
                      placeholder="0000 0000 0000 0000"
                      className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm text-neutral-800 outline-none focus:border-brand-primary/50 transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Nome Impresso no Cartão</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      onFocus={() => setCardFocus('name')}
                      onBlur={() => setCardFocus('')}
                      placeholder="EX: JOÃO S SILVA"
                      className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm text-neutral-800 outline-none focus:border-brand-primary/50 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Validade</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => handleCardExpiryChange(e.target.value)}
                        onFocus={() => setCardFocus('expiry')}
                        onBlur={() => setCardFocus('')}
                        placeholder="MM/AA"
                        className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm text-neutral-800 outline-none focus:border-brand-primary/50 transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Código CVV</label>
                      <input
                        type="text"
                        required
                        value={cardCvv}
                        onChange={(e) => handleCardCvvChange(e.target.value)}
                        onFocus={() => setCardFocus('cvv')}
                        onBlur={() => setCardFocus('')}
                        placeholder="123"
                        className="w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm text-neutral-800 outline-none focus:border-brand-primary/50 transition font-mono"
                      />
                    </div>
                  </div>
                </div>

                {paymentError && (
                  <p className="text-xs font-medium text-red-600">{paymentError}</p>
                )}

                <div className="pt-2 border-t border-neutral-100 flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 text-xs font-semibold rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="flex-1 py-3 text-xs font-semibold rounded-xl bg-brand-primary text-white transition hover:brightness-110"
                  >
                    Pagar {paymentEvent.ticketPrice}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {paymentStep === 'processing' && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
            <div className="w-12 h-12 rounded-full border-4 border-neutral-200 border-t-brand-primary animate-spin" />
            <h4 className="font-semibold text-sm text-neutral-800">Processando Pagamento...</h4>
            <p className="text-xs text-neutral-500 italic max-w-xs">{processingStatus}</p>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 scale-100 animate-bounce">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="font-display text-lg font-bold text-emerald-600">Pagamento Aprovado!</h4>
            <p className="text-xs text-neutral-500">Sua inscrição foi confirmada com sucesso.</p>
            <p className="text-[10px] text-neutral-400">Redirecionando para o chat do evento...</p>
          </div>
        )}
      </div>
    </div>
  );
}
