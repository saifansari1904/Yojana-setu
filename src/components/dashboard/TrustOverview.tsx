import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Lock,
  ExternalLink,
  Scale,
} from 'lucide-react';
import type { TrustDashboardSummary } from '../../types/commandCenter';
import { AnimatedCounter } from '../../animations/AnimatedCounter';

interface TrustOverviewProps {
  summary: TrustDashboardSummary;
  isHi?: boolean;
}

export const TrustOverview: React.FC<TrustOverviewProps> = ({
  summary,
  isHi = false,
}) => {
  return (
    <section
      id="trust-overview"
      className="bg-white dark:bg-[var(--bg-raised)] border border-[#E3ECE7] dark:border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-[#EAF5EF] dark:bg-[var(--bg-subtle)] text-[#0F6B4C] dark:text-[var(--accent-green)]">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {isHi ? 'विश्वास एवं स्रोत प्रामाणिकता' : 'Trust & Source Provenance'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isHi
              ? 'आधिकारिक सरकारी राजपत्र एवं मंत्रालय सत्यापन मानकों पर आधारित'
              : 'Verifiable governance metrics derived from sovereign gazette standards'}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-[#FAFBF9] dark:bg-[var(--bg-raised)] border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isHi ? 'सत्यापित पोर्टल' : 'Verified Portals'}
          </div>
          <div className="text-xl font-bold text-[#0F6B4C] dark:text-[var(--accent-green)] mt-1">
            <AnimatedCounter value={summary.verifiedOfficialPortalsCount} />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#FAFBF9] dark:bg-[var(--bg-raised)] border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isHi ? 'उच्च प्रामाणिकता' : 'High Provenance'}
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            <AnimatedCounter value={summary.highProvenanceCount} />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#FAFBF9] dark:bg-[var(--bg-raised)] border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isHi ? 'मूल्यांकित योजनाएं' : 'Evaluated Schemes'}
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            <AnimatedCounter value={summary.totalMatchesConsidered} />
          </div>
        </div>
      </div>

      {/* Trust Commitments */}
      <div className="pt-2 border-t border-slate-100 dark:border-[var(--border-subtle)] space-y-2 text-xs">
        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
          <Scale className="w-4 h-4 text-[#0F6B4C] dark:text-[var(--accent-green)] mt-0.5 shrink-0" />
          <span>
            <strong className="text-slate-900 dark:text-white">
              {isHi ? 'नियम-आधारित मूल्यांकन:' : 'Deterministic Matching:'}{' '}
            </strong>
            {isHi
              ? 'पात्रता की गणना केवल अधिसूचित वैधानिक मानदंडों से होती है; कोई कृत्रिम अनुमान नहीं।'
              : 'Evaluations strictly execute published gazette rules with zero synthetic guesswork.'}
          </span>
        </div>

        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
          <Lock className="w-4 h-4 text-[#0F6B4C] dark:text-[var(--accent-green)] mt-0.5 shrink-0" />
          <span>
            <strong className="text-slate-900 dark:text-white">
              {isHi ? 'स्थानीय गोपनीयता:' : 'Zero PII Retention:'}{' '}
            </strong>
            {isHi
              ? 'पहचान संख्या या वित्तीय क्रेडेंशियल सर्वर पर संग्रहीत नहीं किए जाते हैं।'
              : 'No identity credentials or banking numbers are captured or transmitted.'}
          </span>
        </div>

        {summary.lastAuditedDate && (
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] pt-1">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isHi ? 'अंतिम स्रोत ऑडिट:' : 'Latest Source Audit:'} {summary.lastAuditedDate}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
