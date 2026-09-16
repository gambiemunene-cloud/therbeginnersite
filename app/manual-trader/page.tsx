'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Crosshair, MousePointer2, Sparkles, Target } from 'lucide-react';
import { Localize } from '@deriv-com/translations';
import { useDigitsTrading } from '@/hooks/use-digits-trading';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { Footer } from '@/components/custom/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const digits = Array.from({ length: 10 }, (_, index) => index);

export default function ManualTraderPage() {
  const router = useRouter();
  const logoSrc = useLogoSrc();
  const { localize } = useAppTranslations();
  const { ws, isConnected, isExhausted, auth } = useDerivWSContext();
  const { authState, accounts, activeAccount, login, signUp, logout, switchAccount } = auth;
  const trading = useDigitsTrading({ ws, isConnected, isExhausted, isAuthenticated: !!auth.wsUrl, onAuthWSFailed: logout });
  const [cursorDigit, setCursorDigit] = useState(0);
  const [selectedDigit, setSelectedDigit] = useState(trading.selectedDigit);

  useEffect(() => {
    if (authState === 'error') router.replace('/');
  }, [authState, router]);

  useEffect(() => {
    const timer = window.setInterval(() => setCursorDigit((current) => (current + 1) % 10), 900);
    return () => window.clearInterval(timer);
  }, []);

  const ranked = useMemo(() => [...digits].sort((a, b) => (trading.digitStats.percentages[a] ?? 0) - (trading.digitStats.percentages[b] ?? 0)), [trading.digitStats]);
  const signalDigit = ranked[0] ?? 0;
  const cursorPosition = `${(cursorDigit % 5) * 20 + 10}%`;
  const cursorRow = cursorDigit > 4 ? 'translateY(128px)' : 'translateY(0)';

  if (authState !== 'authenticated') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-primary/15 text-center">
          <CardHeader>
            <CardTitle>Manual trader</CardTitle>
            <CardDescription>Sign in to open the live manual trading board.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full rounded-full" onClick={() => void login()}>
              Sign in to continue
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background pb-12">
      <Header authState={authState} accounts={accounts} activeAccount={activeAccount} onLogin={login} onSignUp={signUp} onLogout={logout} onSwitchAccount={switchAccount} logoSrc={logoSrc} actions={<ThemeToggle />} />
      <div className="h-[76px]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><Link href="/" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft data-icon="inline-start" /><Localize i18n_default_text="Back to trading" /></Link><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Crosshair data-icon="inline-start" /></div><div><h2 className="text-2xl font-semibold tracking-tight">Manual trader</h2><p className="text-sm text-muted-foreground">Aim, select a digit, and place a trade with confidence.</p></div></div></div>
          <Badge variant={trading.isConnected ? 'default' : 'secondary'} className="gap-2 px-3 py-1.5"><span className={cn('size-2 rounded-full', trading.isConnected ? 'bg-emerald-300' : 'bg-muted-foreground')} />{trading.isConnected ? 'Live feed' : 'Waiting for feed'}</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card"><CardHeader><CardTitle className="flex items-center gap-2"><MousePointer2 data-icon="inline-start" />Digit target board</CardTitle><CardDescription>The cursor tracks the incoming stream. Click any digit to make it your manual target.</CardDescription></CardHeader><CardContent><div className="relative rounded-2xl border border-primary/15 bg-background/55 px-3 py-8 sm:px-8"><div className="pointer-events-none absolute inset-x-8 top-5 h-1 rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" /><div className="relative grid grid-cols-5 gap-x-2 gap-y-20 sm:gap-x-5 sm:gap-y-24">{digits.map((digit) => { const isLive = digit === trading.lastDigit; const isSelected = digit === selectedDigit; return <Button key={digit} variant="outline" onClick={() => { setSelectedDigit(digit); trading.setSelectedDigit(digit); }} className={cn('relative mx-auto size-12 rounded-full border-2 p-0 text-lg font-semibold transition-all sm:size-16 sm:text-2xl', isSelected && 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25', isLive && !isSelected && 'border-emerald-400 text-emerald-400 ring-4 ring-emerald-400/15')}>{digit}{isLive && <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-emerald-400">LIVE</span>}</Button>; })}<div className="pointer-events-none absolute left-0 top-0 transition-transform duration-500 ease-out" style={{ left: cursorPosition, transform: cursorRow }}><MousePointer2 className="size-7 -rotate-12 fill-primary text-primary drop-shadow-lg sm:size-9" /><span className="absolute left-5 top-6 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">scanning</span></div></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-full bg-emerald-400" />Live digit: <strong className="text-foreground">{trading.lastDigit ?? '—'}</strong></span><span className="flex items-center gap-2 text-muted-foreground"><Target className="size-4" />Selected target: <strong className="text-primary">{selectedDigit}</strong></span></div></CardContent></Card>

          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles data-icon="inline-start" />Quick trade</CardTitle><CardDescription>Selected digit {selectedDigit} is ready for a manual contract.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="rounded-xl border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Least appearing signal</p><p className="mt-1 text-3xl font-semibold">Digit {signalDigit}</p><p className="mt-1 text-xs text-muted-foreground">{(trading.digitStats.percentages[signalDigit] ?? 0).toFixed(2)}% in the rolling window</p></div><Button className="w-full rounded-full" onClick={() => { trading.setSelectedDigit(selectedDigit); trading.setContractMode('DIGITDIFF'); }} disabled={!trading.isConnected}><Crosshair data-icon="inline-start" />Prepare differs on {selectedDigit}</Button><p className="text-center text-xs text-muted-foreground">Use the main trade controls below the live board to review payout and confirm purchase.</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Manual workflow</CardTitle><CardDescription>Watch the cursor, choose the target, then review the contract before buying.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border bg-muted/20 p-4"><p className="font-medium">1. Observe</p><p className="mt-1 text-xs text-muted-foreground">Wait for the live cursor and tick signal to settle.</p></div><div className="rounded-lg border bg-muted/20 p-4"><p className="font-medium">2. Aim</p><p className="mt-1 text-xs text-muted-foreground">Select a circular digit target on the board.</p></div><div className="rounded-lg border bg-muted/20 p-4"><p className="font-medium">3. Confirm</p><p className="mt-1 text-xs text-muted-foreground">Review stake, duration, and payout before purchase.</p></div></CardContent></Card>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 py-2 text-center backdrop-blur-sm"><Footer /></div>
    </main>
  );
}

