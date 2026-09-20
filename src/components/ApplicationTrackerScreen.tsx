import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  NotebookPen,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { ApplicationStatus, MatchResult, TrackedApplication } from '../types';
import {
  getDocReadiness,
  getNextStatus,
  getStatusMeta,
  summariseByStatus,
} from '../lib/tracker/applicationTracker';
import {
  evaluateFollowUp,
  evaluateSchemeFreshness,
  followUpUrgencyRank,
  getLocalizedFreshness,
  getLocalizedFollowUp,
  getLocalizedJourneyEvent,
  getLocalizedPathwaySnapshot,
} from '../lib/tracker/schemeFreshness';
import { EmptyState } from './common/EmptyState';
import { AnimatedCounter } from '../animations/AnimatedCounter';
import { staggerContainer, staggerItem } from '../animations/variants';
import { useTranslation } from '../i18n';

interface ApplicationTrackerScreenProps {
  applications: TrackedApplication[];
  matchResults: MatchResult[];
  onUpdateStatus: (schemeId: string, status: ApplicationStatus) => void;
  onUpdateNote: (schemeId: string, note: string) => void;
  onUpdateAppliedOn: (schemeId: string, appliedOn: string) => void;
  onRemove: (schemeId: string) => void;
  /** Phase 4.3 — the citizen's own follow-up date (never a government deadline). */
  onSetFollowUp?: (schemeId: string, dueOn: string | null) => void;
  onCompleteFollowUp?: (schemeId: string) => void;
  onSelectScheme: (match: MatchResult) => void;
  onBackToResults: () => void;
  /** Phase 5 — open preparation workspace for this tracked scheme. */
  onOpenWorkspace?: (match: MatchResult) => void;
}

/** Display order: active work first, terminal outcomes last. */
const DISPLAY_ORDER: ApplicationStatus[] = [
  'interested',
  'docs-ready',
  'applied',
  'approved',
  'rejected',
];

export const ApplicationTrackerScreen: React.FC<ApplicationTrackerScreenProps> = ({
  applications,
  matchResults,
  onUpdateStatus,
  onUpdateNote,
  onUpdateAppliedOn,
  onRemove,
  onSetFollowUp,
  onCompleteFollowUp,
  onSelectScheme,
  onBackToResults,
  onOpenWorkspace,
}) => {
  const { lang, t, getLocalizedScheme } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null);

  const summary = useMemo(() => summariseByStatus(applications), [applications]);

  /**
   * Phase 4.3: overdue follow-ups float to the top of the active group so the
   * tracker surfaces work that has gone quiet. Purely deterministic sorting.
   */
  const sorted = useMemo(
    () =>
      [...applications].sort((a, b) => {
        const orderDiff = DISPLAY_ORDER.indexOf(a.status) - DISPLAY_ORDER.indexOf(b.status);
        if (orderDiff !== 0) return orderDiff;

        const urgencyDiff =
          followUpUrgencyRank(evaluateFollowUp(a.followUp)) -
          followUpUrgencyRank(evaluateFollowUp(b.followUp));
        if (urgencyDiff !== 0) return urgencyDiff;

        return b.updatedAt.localeCompare(a.updatedAt);
      }),
    [applications],
  );

  const activeCount = summary.interested + summary['docs-ready'] + summary.applied;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <ClipboardList className="w-5 h-5 text-[#16A34A] dark:text-[#4ADE80]" />
          <h1 className="yj-h2 text-[#0B5D4B] dark:text-[#E8EFEA]">
            {t('tracker.title')}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#516A5F] dark:text-[#9EB0A7] max-w-2xl">
          {t('tracker.subtitle')}
        </p>
        <p className="text-[11px] text-[#6F7A73] dark:text-[#8E9F97] mt-1.5">
          {t('tracker.privacyNote')}
        </p>
      </div>

      {applications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
          {DISPLAY_ORDER.map((status) => {
            const meta = getStatusMeta(status, lang);
            return (
              <div
                key={status}
                id={`tracker-summary-${status}`}
                className="yj-card px-3 py-2.5"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#6F7A73] dark:text-[#8E9F97]">
                    {meta.label}
                  </span>
                </div>
                <div className="text-lg font-bold text-[#14453D] dark:text-[#E8EFEA] leading-none">
                  <AnimatedCounter value={summary[status]} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {applications.length === 0 ? (
        <EmptyState
          type="no-data"
          title={t('tracker.emptyTitle')}
          description={t('tracker.emptyDesc')}
          actionLabel={t('tracker.emptyAction')}
          onAction={onBackToResults}
        />
      ) : (
        <>
          {activeCount > 0 && (
            <p className="text-xs font-semibold text-[#3F4943] dark:text-[#C5D5CC] mb-3">
              {activeCount} {t('tracker.inProgress')}
            </p>
          )}

          <motion.div
            variants={shouldReduceMotion ? undefined : staggerContainer}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            className="space-y-3 pb-10"
          >
            {sorted.map((app) => {
              const match = matchResults.find((m) => m.scheme.id === app.schemeId);
              const scheme = match ? getLocalizedScheme(match.scheme) : null;
              const schemeName = scheme?.name || app.schemeName;
              const meta = getStatusMeta(app.status, lang);
              const nextStatus = getNextStatus(app.status);
              const nextMeta = nextStatus ? getStatusMeta(nextStatus, lang) : null;
              const docs = getDocReadiness(
                app.schemeId,
                match?.scheme.requiredDocuments?.length || 0,
              );
              const isNoteOpen = openNoteFor === app.schemeId;

              // Phase 4.3 — verification freshness + the citizen's own follow-up date
              const freshness = match ? evaluateSchemeFreshness(match.scheme) : null;
              const followUp = evaluateFollowUp(app.followUp);
              const followUpTone =
                followUp.state === 'OVERDUE'
                  ? 'border-[#FFCCBD] dark:border-[#5A2B20] bg-[#FFDAD6]/50 dark:bg-[#3D1A14]/50 text-[#8C3A22] dark:text-[#FFB4A4]'
                  : followUp.state === 'DUE_TODAY'
                    ? 'border-[#FCD34D] dark:border-[#5B4718] bg-[#FEF3C7]/70 dark:bg-[#3B2F14]/60 text-[#92610A] dark:text-[#FCD34D]'
                    : 'border-[#E2E2E0] dark:border-[#2A3C34] bg-[#F4F6F5] dark:bg-[#1B2720] text-[#3F4943] dark:text-[#C5D5CC]';

              return (
                <motion.div
                  key={app.schemeId}
                  id={`tracked-application-${app.schemeId}`}
                  variants={shouldReduceMotion ? undefined : staggerItem}
                  className="yj-card yj-hoverable p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h2 className="yj-h3 text-[#0F1512] dark:text-[#E8EFEA] leading-snug">
                        {schemeName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.pillClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                          {meta.label}
                        </span>
                        {match && (
                          <span className="text-[10px] font-semibold text-[#516A5F] dark:text-[#9EB0A7]">
                            {match.matchPercentage}% {t('tracker.matchSuffix')}
                          </span>
                        )}
                        {docs.total > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#516A5F] dark:text-[#9EB0A7]">
                            <FileText className="w-3 h-3" />
                            {docs.ready}/{docs.total} {t('tracker.docsSuffix')}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      id={`tracker-remove-${app.schemeId}`}
                      type="button"
                      onClick={() => onRemove(app.schemeId)}
                      className="shrink-0 p-1.5 text-[#6F7A73] dark:text-[#8E9F97] hover:text-[#C2603F] dark:hover:text-[#F87171] hover:bg-[#FFDAD6]/40 dark:hover:bg-[#3D1A14]/40 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                      title={t('tracker.remove')}
                      aria-label={`${t('tracker.remove')}: ${schemeName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {app.status === 'interested' && docs.allReady && (
                    <div className="mb-3 flex items-start gap-2 bg-[#D4EFE1]/60 dark:bg-[#1A382D]/50 border border-[#C1E2D0] dark:border-[#22503E] rounded px-3 py-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-[#14453D] dark:text-[#C5D5CC]">
                        {t('tracker.docsCompleteNote')}
                      </p>
                    </div>
                  )}

                  {app.status === 'applied' && (
                    <div className="mb-3">
                      <label
                        htmlFor={`tracker-applied-on-${app.schemeId}`}
                        className="block text-[10px] font-bold uppercase tracking-wide text-[#6F7A73] dark:text-[#8E9F97] mb-1"
                      >
                        {t('tracker.appliedOn')}
                      </label>
                      <input
                        id={`tracker-applied-on-${app.schemeId}`}
                        type="date"
                        value={app.appliedOn || ''}
                        onChange={(e) => onUpdateAppliedOn(app.schemeId, e.target.value)}
                        className="bg-[#FAFAF9] dark:bg-[#1B2720] border border-[#E2E2E0] dark:border-[#2A3C34] rounded px-2.5 py-1.5 text-xs text-[#1A1C1B] dark:text-[#F0F4F2] focus-visible:ring-2 focus-visible:ring-[#16A34A] outline-none"
                      />
                    </div>
                  )}

                  {isNoteOpen ? (
                    <div className="mb-3">
                      <label
                        htmlFor={`tracker-note-${app.schemeId}`}
                        className="block text-[10px] font-bold uppercase tracking-wide text-[#6F7A73] dark:text-[#8E9F97] mb-1"
                      >
                        {t('tracker.note')}
                      </label>
                      <textarea
                        id={`tracker-note-${app.schemeId}`}
                        rows={3}
                        value={app.note || ''}
                        onChange={(e) => onUpdateNote(app.schemeId, e.target.value)}
                        placeholder={t('tracker.notePlaceholder')}
                        className="w-full bg-[#FAFAF9] dark:bg-[#1B2720] border border-[#E2E2E0] dark:border-[#2A3C34] rounded px-2.5 py-2 text-xs text-[#1A1C1B] dark:text-[#F0F4F2] placeholder:text-[#9EB0A7] focus-visible:ring-2 focus-visible:ring-[#16A34A] outline-none resize-y"
                      />
                    </div>
                  ) : (
                    app.note && (
                      <p className="mb-3 text-[11px] text-[#3F4943] dark:text-[#C5D5CC] bg-[#F4F6F5] dark:bg-[#1B2720] border border-[#EAECEB] dark:border-[#24342D] rounded px-3 py-2 whitespace-pre-wrap">
                        {app.note}
                      </p>
                    )
                  )}

                  {/* Phase 4.3 — data freshness (never a claim about scheme validity) */}
                  {freshness && freshness.shouldRecheckOfficialSource && (() => {
                    const locFreshness = getLocalizedFreshness(freshness, lang);
                    return (
                      <div className="mb-3 flex items-start gap-2 rounded border border-[#FCD34D] dark:border-[#5B4718] bg-[#FEF3C7]/70 dark:bg-[#3B2F14]/60 px-3 py-2">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#92610A] dark:text-[#FCD34D]" />
                        <p className="text-[11px] text-[#92610A] dark:text-[#FCD34D]">
                          <span className="font-bold">
                            {locFreshness.label}
                          </span>
                          {' — '}
                          {locFreshness.advice}
                        </p>
                      </div>
                    );
                  })()}
                  {freshness && !freshness.shouldRecheckOfficialSource && freshness.lastVerifiedDate && (
                    <p className="mb-3 text-[10px] font-semibold text-[#6F7A73] dark:text-[#8E9F97]">
                      {t('tracker.verified')}: {freshness.lastVerifiedDate}
                      {' · '}
                      {getLocalizedFreshness(freshness, lang).label}
                    </p>
                  )}

                  {/* Phase 4.3 — self-set follow-up reminder */}
                  {onSetFollowUp && app.status !== 'approved' && app.status !== 'rejected' && (
                    <div className={`mb-3 rounded border px-3 py-2 ${followUpTone}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor={`tracker-followup-${app.schemeId}`}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide"
                        >
                          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('tracker.followUpLabel')}
                        </label>
                        <input
                          id={`tracker-followup-${app.schemeId}`}
                          type="date"
                          value={app.followUp?.dueOn || ''}
                          onChange={(e) =>
                            onSetFollowUp(app.schemeId, e.target.value ? e.target.value : null)
                          }
                          className="min-h-[44px] rounded border border-[#E2E2E0] bg-white px-2.5 py-1.5 text-xs text-[#1A1C1B] outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:border-[#2A3C34] dark:bg-[#1B2720] dark:text-[#F0F4F2]"
                        />
                        {app.followUp?.dueOn && (
                          <span className="text-[11px] font-semibold">
                            {getLocalizedFollowUp(followUp, lang)}
                          </span>
                        )}
                        {app.followUp?.dueOn && !app.followUp.completedOn && onCompleteFollowUp && (
                          <button
                            type="button"
                            onClick={() => onCompleteFollowUp(app.schemeId)}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded px-2 text-[11px] font-bold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('tracker.markDone')}
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] opacity-80">
                        {t('tracker.followUpNote')}
                      </p>
                    </div>
                  )}

                  {/* Phase 4.3 — journey timeline captured from the support pathway */}
                  {app.journey && app.journey.length > 0 && (
                    <details className="mb-3 rounded border border-[#E2E2E0] dark:border-[#24342D] bg-[#F4F6F5] dark:bg-[#1B2720] px-3 py-2">
                      <summary className="cursor-pointer text-[11px] font-bold text-[#14453D] dark:text-[#C5D5CC]">
                        {t('tracker.journeyTitle')} ({app.journey.length})
                      </summary>
                      <ol className="mt-2 space-y-1">
                        {app.journey.map((event) => (
                          <li
                            key={event.id}
                            className="text-[11px] text-[#3F4943] dark:text-[#C5D5CC]"
                          >
                            <span className="font-semibold">{event.at.slice(0, 10)}</span>{' '}
                            {getLocalizedJourneyEvent(event, lang)}
                          </li>
                        ))}
                      </ol>
                      {app.pathwaySnapshot && (() => {
                        const snapshot = getLocalizedPathwaySnapshot(app.pathwaySnapshot, lang);
                        return (
                          <p className="mt-2 text-[10px] text-[#6F7A73] dark:text-[#8E9F97]">
                            {t('tracker.pathwayStage')}:{' '}
                            {snapshot.stageLabel}{' '}
                            ·{' '}
                            {snapshot.readinessLabel}
                          </p>
                        );
                      })()}
                    </details>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {nextMeta && (
                      <motion.button
                        id={`tracker-advance-${app.schemeId}`}
                        type="button"
                        whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                        onClick={() => onUpdateStatus(app.schemeId, nextMeta.status)}
                        className="inline-flex items-center gap-1.5 bg-[#14453D] hover:bg-[#0B302B] dark:bg-[#1C5045] dark:hover:bg-[#14453D] text-white px-3 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                      >
                        <span>
                          {t('tracker.markAs')}
                          {nextMeta.label}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                      </motion.button>
                    )}

                    {match && (
                      <button
                        id={`tracker-open-scheme-${app.schemeId}`}
                        type="button"
                        onClick={() => onSelectScheme(match)}
                        className="inline-flex items-center gap-1.5 bg-[#F3F4F3] dark:bg-[#1E2723] hover:bg-[#EEEEED] dark:hover:bg-[#26352E] border border-[#E2E2E0] dark:border-[#2A3C34] text-[#14453D] dark:text-[#C5D5CC] px-3 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{t('tracker.openScheme')}</span>
                      </button>
                    )}

                    {match && onOpenWorkspace && (
                      <button
                        id={`tracker-open-workspace-${app.schemeId}`}
                        type="button"
                        onClick={() => onOpenWorkspace(match)}
                        className="inline-flex items-center gap-1.5 bg-[#0F6B4C]/10 hover:bg-[#0F6B4C]/20 dark:bg-[#4ADE80]/15 dark:hover:bg-[#4ADE80]/25 text-[#0F6B4C] dark:text-[#4ADE80] border border-[#0F6B4C]/30 dark:border-[#4ADE80]/30 px-3 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                      >
                        <span>{t('workspace.badge') || 'Workspace'}</span>
                      </button>
                    )}

                    <button
                      id={`tracker-toggle-note-${app.schemeId}`}
                      type="button"
                      onClick={() => setOpenNoteFor(isNoteOpen ? null : app.schemeId)}
                      className="inline-flex items-center gap-1.5 text-[#516A5F] dark:text-[#9EB0A7] hover:text-[#14453D] dark:hover:text-[#F0F4F2] px-2 py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                      aria-expanded={isNoteOpen}
                    >
                      <NotebookPen className="w-3 h-3" />
                      <span>
                        {isNoteOpen
                          ? t('tracker.doneEditing')
                          : app.note
                            ? t('tracker.editNote')
                            : t('tracker.addNote')}
                      </span>
                    </button>

                    {app.status !== 'rejected' && app.status !== 'approved' && (
                      <button
                        id={`tracker-reject-${app.schemeId}`}
                        type="button"
                        onClick={() => onUpdateStatus(app.schemeId, 'rejected')}
                        className="inline-flex items-center gap-1.5 text-[#6F7A73] dark:text-[#8E9F97] hover:text-[#C2603F] dark:hover:text-[#F87171] px-2 py-1.5 rounded text-[11px] font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>{t('tracker.markRejected')}</span>
                      </button>
                    )}

                    {(app.status === 'approved' || app.status === 'rejected') && (
                      <button
                        id={`tracker-reopen-${app.schemeId}`}
                        type="button"
                        onClick={() => onUpdateStatus(app.schemeId, 'applied')}
                        className="text-[11px] font-semibold text-[#516A5F] dark:text-[#9EB0A7] hover:text-[#14453D] dark:hover:text-[#F0F4F2] px-2 py-1.5 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                      >
                        {t('tracker.reopen')}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
};
