'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowLeft, BarChart3, Gauge, Radar, RefreshCw, ShieldCheck, TrendingDown } from 'lucide-react';
import { Localize } from '@deriv-com/translations';
import { useDigitsTrading } from '@/hooks/use-digits-trading';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { Footer } from '@/components/custom/footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const digits = Array.from({ length: 10 }, (_, index) => index);

export default function AnalysisPage() {
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

  const rankedDigits = useMemo(
    () => digits.map((digit) => ({ digit, percentage: trading.digitStats.percentages[digit] ?? 0, count: trading.digitStats.counts[digit] ?? 0 }))
      .sort((left, right) => left.percentage - right.percentage),
    [trading.digitStats]
  );
  const leastDigit = rankedDigits[0];
  const zeroOneAverage = ((trading.digitStats.percentages[0] ?? 0) + (trading.digitStats.percentages[1] ?? 0)) / 2;
  const thresholdReady = (trading.digitStats.percentages[0] ?? 100) < 10 && (trading.digitStats.percentages[1] ?? 100) < 10;
  const maxPercentage = Math.max(...trading.digitStats.percentages, 1);

  if (authState !== 'authenticated') {
    return <main className="flex min-h-dvh items-center justify-center bg-background"><div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></main>;
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft data-icon="inline-start" /><Localize i18n_default_text="Back to trading" /></Link>
            <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Radar data-icon="inline-start" /></div><div><h2 className="text-2xl font-semibold tracking-tight">Market analysis</h2><p className="text-sm text-muted-foreground">Rolling tick intelligence for digit strategies</p></div></div>
          </div>
          <Badge variant={trading.isConnected ? 'default' : 'secondary'} className="gap-2 px-3 py-1.5"><span className={trading.isConnected ? 'size-2 rounded-full bg-emerald-300' : 'size-2 rounded-full bg-muted-foreground'} />{trading.isConnected ? 'Live feed' : 'Waiting for feed'}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardDescription>Ticks analyzed</CardDescription><Activity className="text-muted-foreground" /></CardHeader><CardContent><p className="text-3xl font-semibold">{trading.digitStats.totalTicks}</p><p className="mt-1 text-xs text-muted-foreground">Rolling window</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardDescription>Least appearing</CardDescription><TrendingDown className="text-muted-foreground" /></CardHeader><CardContent><p className="text-3xl font-semibold">{leastDigit?.digit ?? '—'}</p><p className="mt-1 text-xs text-muted-foreground">{leastDigit ? `${leastDigit.percentage.toFixed(2)}% frequency` : 'Collecting ticks'}</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardDescription>0 and 1 average</CardDescription><Gauge className="text-muted-foreground" /></CardHeader><CardContent><p className="text-3xl font-semibold">{zeroOneAverage.toFixed(2)}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(zeroOneAverage * 10, 100)}%` }} /></div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardDescription>Over 1 signal</CardDescription><ShieldCheck className="text-muted-foreground" /></CardHeader><CardContent><p className="text-3xl font-semibold">{thresholdReady ? 'Ready' : 'Stand by'}</p><p className="mt-1 text-xs text-muted-foreground">Both digits below 10%</p></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 data-icon="inline-start" />Digit distribution</CardTitle><CardDescription>Frequency by digit in the active rolling window</CardDescription></CardHeader><CardContent className="space-y-4">{rankedDigits.map(({ digit, percentage, count }) => <div key={digit} className="grid grid-cols-[28px_1fr_64px] items-center gap-3"><span className="font-mono text-sm font-semibold">{digit}</span><div className="h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${digit === leastDigit?.digit ? 'bg-primary' : 'bg-primary/45'}`} style={{ width: `${Math.max((percentage / maxPercentage) * 100, percentage > 0 ? 3 : 0)}%` }} /></div><span className="text-right text-xs text-muted-foreground">{percentage.toFixed(1)}% <span className="hidden sm:inline">({count})</span></span></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Signal interpretation</CardTitle><CardDescription>What the scanner sees right now</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="rounded-lg border bg-muted/30 p-4"><p className="text-sm font-medium">Differs candidate</p><p className="mt-1 text-2xl font-semibold">Digit {leastDigit?.digit ?? '—'}</p><p className="mt-1 text-xs text-muted-foreground">The least frequent digit is the current differs focus.</p></div><div className="rounded-lg border bg-muted/30 p-4"><p className="text-sm font-medium">Over 1 filter</p><p className="mt-1 text-2xl font-semibold">{thresholdReady ? 'Conditions met' : 'Conditions not met'}</p><p className="mt-1 text-xs text-muted-foreground">Digit 0: {(trading.digitStats.percentages[0] ?? 0).toFixed(1)}% · Digit 1: {(trading.digitStats.percentages[1] ?? 0).toFixed(1)}%</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><RefreshCw className="size-3.5" />Updates automatically with each tick</div></CardContent></Card>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 py-2 text-center backdrop-blur-sm"><Footer /></div>
    </main>
  );
}
