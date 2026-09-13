'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MousePointer2 } from 'lucide-react';
import { Localize } from '@deriv-com/translations';
import { useDigitsTrading } from '@/hooks/use-digits-trading';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { Footer } from '@/components/custom/footer';
import { SymbolSelector } from '@/components/custom/symbol-selector';
import { TradeTypeChips } from '@/components/custom/trade-type-chips';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrentTickDisplay } from '@/components/current-tick-display';
import { DigitCircleBoard } from '@/components/digit-circle-board';
import { TradeControls } from '@/components/trade-controls';
import type { TradeType } from '@/lib/types';

export default function DTraderPage() {
  const router = useRouter();
  const logoSrc = useLogoSrc();
  const { localize } = useAppTranslations();
  const { ws, isConnected, isExhausted, auth } = useDerivWSContext();
  const { authState, accounts, activeAccount, login, signUp, logout, switchAccount } = auth;
  const trading = useDigitsTrading({
    ws,
    isConnected,
    isExhausted,
    isAuthenticated: !!auth.wsUrl,
    onAuthWSFailed: logout,
  });

  useEffect(() => {
    if (authState === 'unauthenticated' || authState === 'error') router.replace('/');
  }, [authState, router]);

  const tradeTypeOptions = useMemo<{ value: TradeType; label: string }[]>(
    () => [
      { value: 'matches-differs', label: localize('Matches/Differs') },
      { value: 'over-under', label: localize('Over/Under') },
      { value: 'even-odd', label: localize('Even/Odd') },
    ],
    [localize]
  );

  if (authState !== 'authenticated') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background pb-12">
      <Header
        authState={authState}
        accounts={accounts}
        activeAccount={activeAccount}
        onLogin={login}
        onSignUp={signUp}
        onLogout={logout}
        onSwitchAccount={switchAccount}
        logoSrc={logoSrc}
        actions={<ThemeToggle />}
      />
      <div className="h-[76px]" />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-3 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft data-icon="inline-start" />
              <Localize i18n_default_text="Back to trading" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <MousePointer2 data-icon="inline-start" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  <Localize i18n_default_text="D Trader" />
                </h2>
                <p className="text-sm text-muted-foreground">
                  <Localize i18n_default_text="Digit board with a live cursor and quick trade controls" />
                </p>
              </div>
            </div>
          </div>
          <Badge variant={trading.isConnected ? 'default' : 'secondary'} className="gap-2 px-3 py-1.5">
            <span className={trading.isConnected ? 'size-2 rounded-full bg-emerald-300' : 'size-2 rounded-full bg-muted-foreground'} />
            {trading.isConnected ? <Localize i18n_default_text="Live feed" /> : <Localize i18n_default_text="Waiting for feed" />}
          </Badge>
        </div>

        {trading.isLoading ? (
          <Skeleton className="h-[440px] w-full rounded-xl" />
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-5 pt-6">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <SymbolSelector
                  symbols={trading.symbols}
                  activeSymbol={trading.activeSymbol}
                  onSymbolChange={trading.selectSymbol}
                />
                <CurrentTickDisplay
                  tick={trading.currentTick}
                  lastDigit={trading.lastDigit}
                  activeSymbol={trading.activeSymbol}
                  pipSize={trading.pipSize}
                />
              </div>

              <div className="shrink-0 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <TradeTypeChips value={trading.tradeType} options={tradeTypeOptions} onValueChange={trading.setTradeType} />
              </div>

              <div className="rounded-xl border bg-muted/20 p-4 sm:p-6">
                <DigitCircleBoard
                  digitStats={trading.digitStats}
                  lastDigit={trading.lastDigit}
                  tickKey={trading.currentTick?.epoch}
                  selectedDigit={trading.selectedDigit}
                  onDigitSelect={trading.setSelectedDigit}
                  selectable={trading.tradeType !== 'even-odd'}
                />
              </div>

              <div className="border-t pt-5">
                <TradeControls
                  tradeType={trading.tradeType}
                  contractMode={trading.contractMode}
                  onContractModeChange={trading.setContractMode}
                  selectedDigit={trading.selectedDigit}
                  isConnected={trading.isConnected}
                  stake={trading.stake}
                  onStakeChange={trading.setStake}
                  duration={trading.duration}
                  onDurationChange={trading.setDuration}
                  durationLimits={trading.durationLimits}
                  proposal={trading.proposal}
                  isProposalLoading={trading.isProposalLoading}
                  onBuy={trading.buyContract}
                  isBuying={trading.isBuying}
                  buyResult={trading.buyResult}
                  buyError={trading.buyError}
                  onClearBuyResult={trading.clearBuyResult}
                  isAuthenticated={authState === 'authenticated'}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 py-2 text-center backdrop-blur-sm">
        <Footer />
      </div>
    </main>
  );
}
