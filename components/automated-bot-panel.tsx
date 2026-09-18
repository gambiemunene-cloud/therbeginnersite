'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, Bot, Pause, Play, ShieldCheck, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ContractMode, DigitStats } from '@/lib/types';
import type { ProposalInfo } from '@deriv/core';

type BotStatus = 'stopped' | 'scanning' | 'armed' | 'blocked';

interface AutomatedBotPanelProps {
  isConnected: boolean;
  isAuthenticated: boolean;
  lastDigit: number | null;
  digitStats: DigitStats;
  selectedDigit: number;
  setSelectedDigit: (digit: number) => void;
  setContractMode: (mode: ContractMode) => void;
  setStake: (value: string) => void;
  buyContract: () => Promise<void>;
  proposal: ProposalInfo | null;
  isBuying: boolean;
  activeSymbolName?: string;
}

const DEFAULT_WINDOW = 100;
const MIN_SAMPLE = 30;
const DEFAULT_COOLDOWN = 3;

export function AutomatedBotPanel({
  isConnected,
  isAuthenticated,
  lastDigit,
  digitStats,
  selectedDigit,
  setSelectedDigit,
  setContractMode,
  setStake,
  buyContract,
  proposal,
  isBuying,
  activeSymbolName,
}: AutomatedBotPanelProps) {
  const [windowSize, setWindowSize] = useState(String(DEFAULT_WINDOW));
  const [threshold, setThreshold] = useState('10');
  const [stake, setStakeValue] = useState('1');
  const [cooldown, setCooldown] = useState(String(DEFAULT_COOLDOWN));
  const [status, setStatus] = useState<BotStatus>('stopped');
  const [liveArmed, setLiveArmed] = useState(false);
  const [killSwitch, setKillSwitch] = useState(false);
  const [lastTradeDigit, setLastTradeDigit] = useState<number | null>(null);
  const [pendingEntry, setPendingEntry] = useState(false);
  const ticksSinceTrade = useRef(DEFAULT_COOLDOWN);

  const sampleReady = digitStats.totalTicks >= MIN_SAMPLE;
  const zeroOneUnderThreshold = digitStats.percentages[0] < Number(threshold) && digitStats.percentages[1] < Number(threshold);
  const leastDigit = useMemo(() => {
    if (!digitStats.totalTicks) return null;
    return digitStats.counts.reduce((least, count, digit) => count < digitStats.counts[least] ? digit : least, 0);
  }, [digitStats]);
  const scanProgress = Math.min(100, (digitStats.totalTicks / Number(windowSize || DEFAULT_WINDOW)) * 100);
  const canTrade = isConnected && isAuthenticated && sampleReady && zeroOneUnderThreshold && !killSwitch && liveArmed;

  useEffect(() => {
    if (status === 'stopped' || killSwitch) return;
    ticksSinceTrade.current += 1;
    if (!sampleReady) {
      setStatus('scanning');
      return;
    }
    setStatus(canTrade ? 'armed' : 'blocked');

    if (!canTrade || lastDigit === null || leastDigit === null || ticksSinceTrade.current < Number(cooldown || DEFAULT_COOLDOWN) || isBuying || pendingEntry) return;
    if (lastDigit !== leastDigit || lastTradeDigit === lastDigit) return;

    // Update the trade controls first. The proposal is recreated asynchronously,
    // so buying in this same render would submit the previous contract.
    setContractMode('DIGITDIFF');
    setSelectedDigit(leastDigit);
    setStake(stake);
    setPendingEntry(true);
  }, [canTrade, cooldown, isBuying, lastDigit, lastTradeDigit, leastDigit, liveArmed, pendingEntry, sampleReady, setContractMode, setSelectedDigit, setStake, stake, status, killSwitch]);

  useEffect(() => {
    if (!pendingEntry || isBuying || !canTrade || lastDigit === null || !proposal || !/differs/i.test(proposal.longcode)) return;
    setPendingEntry(false);
    setLastTradeDigit(lastDigit);
    ticksSinceTrade.current = 0;
    void buyContract();
  }, [buyContract, canTrade, isBuying, lastDigit, pendingEntry]);

  const startBot = () => {
    if (!isConnected || !isAuthenticated) return;
    setKillSwitch(false);
    setStatus('scanning');
  };
  const stopBot = () => {
    setStatus('stopped');
    setLiveArmed(false);
  };

  return (
    <Card className="border-primary/20 bg-card/80">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4 text-primary" /> Automated digit bot</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Rolling scan for {activeSymbolName ?? 'the selected market'}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${status === 'armed' ? 'bg-emerald-500/15 text-emerald-500' : status === 'blocked' ? 'bg-amber-500/15 text-amber-500' : 'bg-muted text-muted-foreground'}`}>{status}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div><Label htmlFor="bot-window" className="text-[11px]">Window</Label><Input id="bot-window" type="number" min="30" max="1000" value={windowSize} onChange={(event) => setWindowSize(event.target.value)} /></div>
          <div><Label htmlFor="bot-threshold" className="text-[11px]">0/1 max %</Label><Input id="bot-threshold" type="number" min="1" max="50" value={threshold} onChange={(event) => setThreshold(event.target.value)} /></div>
          <div><Label htmlFor="bot-stake" className="text-[11px]">Stake (USD)</Label><Input id="bot-stake" type="number" min="0.35" step="0.01" value={stake} onChange={(event) => setStakeValue(event.target.value)} /></div>
          <div><Label htmlFor="bot-cooldown" className="text-[11px]">Cooldown ticks</Label><Input id="bot-cooldown" type="number" min="1" max="100" value={cooldown} onChange={(event) => setCooldown(event.target.value)} /></div>
        </div>
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-xs"><span>Rolling sample</span><span className="font-mono">{digitStats.totalTicks} / {windowSize}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${scanProgress}%` }} /></div>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground"><span>Least: <strong className="text-foreground">{leastDigit ?? '—'}</strong></span><span>0: <strong className="text-foreground">{(digitStats.percentages[0] ?? 0).toFixed(1)}%</strong></span><span>1: <strong className="text-foreground">{(digitStats.percentages[1] ?? 0).toFixed(1)}%</strong></span></div>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>Signals are statistical conditions, not a profit guarantee. The bot enters <strong>Differs</strong> only when the least digit appears and 0 and 1 are both below the threshold.</span></div>
        <div className="flex flex-wrap items-center gap-2">
          {status === 'stopped' ? <Button size="sm" onClick={startBot} disabled={!isConnected || !isAuthenticated}><Play className="mr-1.5 h-3.5 w-3.5" />Start scan</Button> : <Button size="sm" variant="outline" onClick={stopBot}><Pause className="mr-1.5 h-3.5 w-3.5" />Pause</Button>}
          <Button size="sm" variant={liveArmed ? 'default' : 'outline'} onClick={() => setLiveArmed((armed) => !armed)} disabled={status === 'stopped' || !sampleReady}><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />{liveArmed ? 'Live armed' : 'Arm live trades'}</Button>
          <Button size="sm" variant={killSwitch ? 'destructive' : 'outline'} onClick={() => { setKillSwitch((enabled) => !enabled); setLiveArmed(false); }}><Square className="mr-1.5 h-3.5 w-3.5" />{killSwitch ? 'Kill switch on' : 'Kill switch'}</Button>
          <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground"><Activity className="h-3 w-3" />{canTrade ? 'Monitoring entries' : 'No trades'}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export { MIN_SAMPLE };
