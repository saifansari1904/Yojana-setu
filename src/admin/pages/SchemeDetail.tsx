/**
 * YOJANA SETU — ADMIN CONSOLE scheme detail.
 * One screen for everything about a scheme: data, eligibility, documents,
 * sources, application info, verification state and full audit history.
 * Lifecycle transitions are explicit, reasoned and audit-logged — never silent.
 */
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Pencil, CheckCircle2, XCircle, Send, Archive, RotateCcw } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  Tabs,
  Badge,
  Btn,
  SchemeStatusBadge,
  VerificationBadge,
  ConfirmDialog,
  useToast,
  AlertBanner,
  EmptyState,
} from '../components/ui';
import { go } from '../components/router';
import { can } from '../lib/permissions';
import { writeAudit } from '../lib/audit';
import { timeAgo, formatDate, formatINR, truncate } from '../lib/format';
import type {
  SchemeAdminRow,
  SourceAdminRow,
  RuleAdminRow,
  DocReqRow,
  FundingAdminRow,
  AppInfoAdminRow,
  AuditLogRow,
} from '../lib/adminTypes';

function fmtVal(v: unknown): string {
  if (v == null) return '—';
  if (Array.isArray(v)) return v.map((x) => fmtVal(x)).join(', ') || '—';
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return Object.entries(o)
      .map(([k, val]) => `${k}: ${fmtVal(val)}`)
      .join('; ');
  }
  return String(v);
}

const KV: React.FC<{ label: string; value: unknown; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="py-2.5 border-b border-gray-100 last:border-0">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
    <div className={`text-sm text-gray-800 mt-0.5 ${mono ? 'font-mono text-[13px]' : ''}`}>
      {fmtVal(value) || '—'}
    </div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">{title}</h3>
    {children}
  </div>
);

/** Eligibility-relevant keys rendered from raw_payload (the engine's real input). */
const ELIGIBILITY_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'minAge', label: 'Minimum age' },
  { key: 'maxAge', label: 'Maximum age' },
  { key: 'applicableStates', label: 'Applicable states' },
  { key: 'districtApplicability', label: 'District applicability' },
  { key: 'otherMandatoryCriteria', label: 'Other mandatory criteria' },
  { key: 'nonMandatoryCriteria', label: 'Non-mandatory criteria' },
  { key: 'targetBusinessStages', label: 'Target business stages' },
  { key: 'genderTargeting', label: 'Gender targeting' },
  { key: 'enterpriseSize', label: 'Enterprise size' },
  { key: 'turnoverLimit', label: 'Turnover limit' },
  { key: 'investmentLimit', label: 'Investment limit' },
  { key: 'employmentRequirement', label: 'Employment requirement' },
  { key: 'incomeLimit', label: 'Income limit' },
  { key: 'targetGroups', label: 'Target groups' },
  { key: 'socialCategory', label: 'Social category' },
  { key: 'isWomenSpecific', label: 'Women-specific' },
  { key: 'isMinoritySpecific', label: 'Minority-specific' },
  { key: 'isScStSpecific', label: 'SC/ST-specific' },
];

interface Transition {
  to: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  needs: 'edit_schemes' | 'verify_schemes' | 'publish_schemes';
  verifStatus?: string;
}

function transitionsFor(status: string): Transition[] {
  const s = (status ?? 'draft').toLowerCase();
  const T: Transition[] = [];
  if (s === 'draft' || s === 'rejected') {
    T.push({ to: 'under_review', label: 'Submit for review', icon: <Send size={14} />, needs: 'edit_schemes' });
  }
  if (s === 'under_review') {
    T.push({ to: 'verified', label: 'Verify', icon: <CheckCircle2 size={14} />, needs: 'verify_schemes', verifStatus: 'VERIFIED' });
    T.push({ to: 'rejected', label: 'Reject', icon: <XCircle size={14} />, needs: 'verify_schemes', danger: true });
  }
  if (s === 'verified') {
    T.push({ to: 'published', label: 'Publish', icon: <CheckCircle2 size={14} />, needs: 'publish_schemes' });
    T.push({ to: 'under_review', label: 'Send back to review', icon: <RotateCcw size={14} />, needs: 'verify_schemes' });
  }
  if (s === 'published') {
    T.push({ to: 'verified', label: 'Unpublish', icon: <RotateCcw size={14} />, needs: 'publish_schemes', danger: true });
  }
  if (s !== 'archived') {
    T.push({ to: 'archived', label: 'Archive', icon: <Archive size={14} />, needs: 'edit_schemes', danger: true });
  }
  return T;
}

export const SchemeDetail: React.FC<{ id: string }> = ({ id }) => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [scheme, setScheme] = useState<SchemeAdminRow | null>(null);
  const [sources, setSources] = useState<SourceAdminRow[]>([]);
  const [rules, setRules] = useState<RuleAdminRow[]>([]);
  const [docs, setDocs] = useState<DocReqRow[]>([]);
  const [funding, setFunding] = useState<FundingAdminRow | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfoAdminRow | null>(null);
  const [audit, setAudit] = useState<AuditLogRow[]>([]);
  const [pending, setPending] = useState<Transition | null>(null);
  const [busy, setBusy] = useState(false);

  const role = identity?.role ?? null;
  const canEdit = can(role, 'edit_schemes');

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: sRow, error: sErr } = await client.from('schemes').select('*').eq('id', id).maybeSingle();
        if (sErr) throw sErr;
        if (!sRow) {
          if (!cancelled) setScheme(null);
          return;
        }
        const [srcR, rulesR, docsR, fundR, appR, audR] = await Promise.all([
          client.from('scheme_sources').select('*').eq('scheme_id', id),
          client.from('scheme_eligibility_rules').select('scheme_id, criterion_key, operator, value, is_mandatory').eq('scheme_id', id),
          client.from('scheme_document_requirements').select('scheme_id, document_label').eq('scheme_id', id),
          client.from('scheme_funding').select('scheme_id, min_amount, max_amount').eq('scheme_id', id).maybeSingle(),
          client.from('scheme_application_info').select('scheme_id, application_mode, official_portal_url').eq('scheme_id', id).maybeSingle(),
          client.from('ys_admin_audit_logs').select('*').eq('resource_type', 'scheme').eq('resource_id', id).order('created_at', { ascending: false }).limit(50),
        ]);
        if (cancelled) return;
        setScheme(sRow as SchemeAdminRow);
        if (!srcR.error) setSources((srcR.data ?? []) as SourceAdminRow[]);
        if (!rulesR.error) setRules((rulesR.data ?? []) as RuleAdminRow[]);
        if (!docsR.error) setDocs((docsR.data ?? []) as DocReqRow[]);
        if (!fundR.error && fundR.data) setFunding(fundR.data as FundingAdminRow);
        if (!appR.error && appR.data) setAppInfo(appR.data as AppInfoAdminRow);
        if (!audR.error) setAudit((audR.data ?? []) as AuditLogRow[]);
      } catch (e) {
        toast.push('error', `Could not load scheme: ${e instanceof Error ? e.message : 'unknown error'}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, id, toast]);

  const runTransition = async (reason?: string) => {
    if (!client || !identity || !pending || !scheme) return;
    setBusy(true);
    try {
      const prev = { status: scheme.status, verification_status: scheme.verification_status };
      const patch: Record<string, unknown> = { status: pending.to };
      if (pending.verifStatus) patch.verification_status = pending.verifStatus;
      const { error } = await client.from('schemes').update(patch).eq('id', id);
      if (error) throw error;
      await writeAudit(client, identity, {
        action: `scheme_${pending.to}`,
        resourceType: 'scheme',
        resourceId: id,
        summary: `Scheme "${scheme.official_name ?? id}" → ${pending.to}. Reason: ${reason ?? '—'}`,
        previousValue: prev,
        newValue: patch,
        metadata: { reason: reason ?? null },
      });
      toast.push('success', `Scheme moved to ${pending.to}.`);
      setPending(null);
      window.location.reload();
    } catch (e) {
      toast.push('error', `Transition failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Loading scheme…" />
        <div className="bg-white rounded-xl border border-gray-200 p-8 animate-pulse text-sm text-gray-400">
          Fetching scheme record…
        </div>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div>
        <PageHeader title="Scheme not found" />
        <EmptyState title="No scheme with this id" hint="It may have been removed, or the id is wrong." />
      </div>
    );
  }

  const rp = (scheme.raw_payload ?? {}) as Record<string, unknown>;
  const transitions = transitionsFor(scheme.status ?? 'draft').filter((t) => can(role, t.needs));

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'eligibility', label: 'Eligibility', count: rules.length || undefined },
    { key: 'benefits', label: 'Benefits' },
    { key: 'documents', label: 'Documents', count: docs.length || undefined },
    { key: 'sources', label: 'Sources', count: sources.length || undefined },
    { key: 'application', label: 'Application' },
    { key: 'verification', label: 'Verification' },
    { key: 'audit', label: 'Audit history', count: audit.length || undefined },
  ];

  return (
    <div>
      <button onClick={() => go('schemes')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-3">
        <ArrowLeft size={13} /> Back to schemes
      </button>
      <PageHeader
        title={scheme.official_name ?? scheme.id}
        description={scheme.benefit_summary ?? undefined}
        actions={
          <>
            <SchemeStatusBadge status={scheme.status} />
            <VerificationBadge value={scheme.verification_status} />
            {canEdit && (
              <Btn variant="primary" onClick={() => go(`schemes/${id}/edit`)}>
                <Pencil size={14} /> Edit
              </Btn>
            )}
          </>
        }
      />

      {transitions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {transitions.map((t) => (
            <Btn
              key={t.to + t.label}
              variant={t.danger ? 'danger' : 'secondary'}
              onClick={() => setPending(t)}
            >
              {t.icon} {t.label}
            </Btn>
          ))}
        </div>
      )}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <>
          <Section title="Identity">
            <div className="grid md:grid-cols-2 gap-x-8">
              <KV label="Scheme id" value={scheme.id} mono />
              <KV label="Official name" value={scheme.official_name} />
              <KV label="Short code" value={scheme.short_code} mono />
              <KV label="Official identifier" value={scheme.official_scheme_identifier} mono />
              <KV label="Sponsoring ministry" value={scheme.sponsoring_ministry} />
              <KV label="Department" value={scheme.department} />
              <KV label="Scheme type" value={scheme.scheme_type} />
              <KV label="Scope" value={scheme.scope} />
            </div>
          </Section>
          <Section title="Description">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {fmtVal(scheme.description)}
            </p>
          </Section>
          <Section title="Classification">
            <div className="flex flex-wrap gap-1.5">
              {(scheme.metadata?.categories ?? (rp.categories as string[] | undefined) ?? []).map((c) => (
                <Badge key={c} tone="blue">{c}</Badge>
              ))}
              {(scheme.metadata?.tags ?? (rp.tags as string[] | undefined) ?? []).map((t) => (
                <Badge key={t} tone="gray">{t}</Badge>
              ))}
              {(scheme.metadata?.categories ?? []).length === 0 && (rp.categories as string[] | undefined)?.length === 0 && (
                <span className="text-sm text-gray-400">No categories or tags recorded.</span>
              )}
            </div>
          </Section>
        </>
      )}

      {tab === 'eligibility' && (
        <>
          <AlertBanner tone="blue" className="mb-4">
            Eligibility is evaluated by the deterministic matching engine from{' '}
            <code className="font-mono">raw_payload</code> — the single source of truth. The
            normalized rules below are a seeded reference and are <b>not</b> consumed by the engine.
          </AlertBanner>
          <Section title="Eligibility criteria (from raw_payload)">
            <div className="grid md:grid-cols-2 gap-x-8">
              <KV label="Mandatory factors" value={(rp.mandatoryCriteria as string[] | undefined)?.join(', ')} />
              {ELIGIBILITY_FIELDS.map((f) =>
                rp[f.key] != null && rp[f.key] !== '' ? (
                  <KV key={f.key} label={f.label} value={rp[f.key]} />
                ) : null,
              )}
            </div>
          </Section>
          <Section title="Normalized rules (seeded reference, read-only)">
            {rules.length === 0 ? (
              <p className="text-sm text-gray-400">No normalized rules recorded for this scheme.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                      <th className="py-2 pr-4">Criterion</th>
                      <th className="py-2 pr-4">Operator</th>
                      <th className="py-2 pr-4">Value</th>
                      <th className="py-2">Mandatory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rules.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 font-mono text-[13px]">{r.criterion_key}</td>
                        <td className="py-2 pr-4 font-mono text-[13px]">{r.operator}</td>
                        <td className="py-2 pr-4 text-[13px]">{fmtVal(r.value)}</td>
                        <td className="py-2">{r.is_mandatory ? <Badge tone="amber">mandatory</Badge> : <Badge>optional</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}

      {tab === 'benefits' && (
        <Section title="Benefits & funding">
          <div className="grid md:grid-cols-2 gap-x-8">
            <KV label="Benefit summary" value={scheme.benefit_summary} />
            <KV label="Funding range" value={scheme.funding_range_text} />
            <KV label="Min amount" value={funding?.min_amount != null ? formatINR(funding.min_amount) : null} />
            <KV label="Max amount" value={funding?.max_amount != null ? formatINR(funding.max_amount) : null} />
            <KV label="Subsidy" value={rp.subsidyPercentage != null ? `${fmtVal(rp.subsidyPercentage)}%${rp.subsidyCap != null ? ` (cap ${formatINR(Number(rp.subsidyCap))})` : ''}` : null} />
            <KV label="Grant amount" value={rp.grantAmount != null ? formatINR(Number(rp.grantAmount)) : null} />
            <KV label="Other financial benefits" value={rp.otherFinancialBenefits} />
            <KV label="Purpose" value={(rp.purpose as string | undefined) ?? (rp.fundingPurpose as string | undefined)} />
          </div>
        </Section>
      )}

      {tab === 'documents' && (
        <Section title="Required documents">
          {docs.length === 0 && !(rp.requiredDocuments as string[] | undefined)?.length ? (
            <p className="text-sm text-gray-400">No document requirements recorded — this is a data gap.</p>
          ) : (
            <ul className="space-y-2">
              {docs.map((d, i) => (
                <li key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium">{d.document_label ?? '—'}</span>
                  <Badge tone="gray">catalog</Badge>
                </li>
              ))}
              {((rp.requiredDocuments as string[] | undefined) ?? []).map((d, i) => (
                <li key={`rp-${i}`} className="flex items-center gap-2 text-sm bg-emerald-50/60 rounded-lg px-3 py-2">
                  <span className="font-medium">{d}</span>
                  <Badge tone="green">engine input</Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {tab === 'sources' && (
        <Section title="Authoritative sources">
          {sources.length === 0 ? (
            <p className="text-sm text-gray-400">No sources recorded — this is a data gap.</p>
          ) : (
            <div className="space-y-3">
              {sources.map((s2, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{s2.source_name ?? 'Unnamed source'}</span>
                    {s2.is_official_government_source && <Badge tone="green">official</Badge>}
                    <VerificationBadge value={s2.verification_status} />
                  </div>
                  {s2.official_source_url && (
                    <a href={s2.official_source_url} target="_blank" rel="noreferrer" className="text-xs text-[#0F6B4C] hover:underline font-mono break-all">
                      {truncate(s2.official_source_url, 90)}
                    </a>
                  )}
                  <div className="text-xs text-gray-500 mt-1.5">
                    Type: {s2.source_type ?? '—'} · Last verified: {formatDate(s2.last_verified_at)} ({timeAgo(s2.last_verified_at)})
                  </div>
                  {s2.source_notes && <div className="text-xs text-gray-600 mt-1">{s2.source_notes}</div>}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {tab === 'application' && (
        <Section title="Application">
          <div className="grid md:grid-cols-2 gap-x-8">
            <KV label="Application mode" value={appInfo?.application_mode} />
            <KV label="Official portal" value={appInfo?.official_portal_url} mono />
            <KV label="Application process" value={rp.applicationProcess} />
            <KV label="Nodal agency" value={rp.nodalAgency} />
            <KV label="Bank channel" value={rp.bankChannelInformation} />
            <KV label="Helpline" value={rp.helplineInformation} />
          </div>
          <AlertBanner tone="gray" className="mt-4">
            Yojana Setu tracks applications and redirects users to official portals — it does not
            submit applications to ministries and does not know the government-side status.
          </AlertBanner>
        </Section>
      )}

      {tab === 'verification' && (
        <Section title="Verification state">
          <div className="grid md:grid-cols-2 gap-x-8">
            <KV label="Lifecycle status" value={(scheme.status ?? 'draft').replace(/_/g, ' ')} />
            <KV label="Verification status" value={scheme.verification_status} />
            <KV
              label="Verified by / at"
              value={(() => {
                const v = audit.find((a) => a.action === 'scheme_verified');
                return v ? `${v.actor_role ?? 'admin'} · ${formatDate(v.created_at)}` : 'Not yet verified in this console';
              })()}
            />
            <KV label="Record updated" value={`${formatDate(scheme.updated_at)} (${timeAgo(scheme.updated_at)})`} />
          </div>
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Lifecycle</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['draft', 'under_review', 'verified', 'published'].map((st, i) => {
                const cur = (scheme.status ?? 'draft').toLowerCase();
                const order = ['draft', 'under_review', 'verified', 'published'];
                const reached = order.indexOf(cur) >= i || (cur === 'published' && i <= 3);
                return (
                  <React.Fragment key={st}>
                    <Badge tone={reached ? 'green' : 'gray'}>{st.replace(/_/g, ' ')}</Badge>
                    {i < 3 && <span className="text-gray-300">→</span>}
                  </React.Fragment>
                );
              })}
              {(scheme.status === 'rejected' || scheme.status === 'archived') && (
                <Badge tone="red">{scheme.status}</Badge>
              )}
            </div>
          </div>
        </Section>
      )}

      {tab === 'audit' && (
        <Section title="Audit history">
          {audit.length === 0 ? (
            <p className="text-sm text-gray-400">
              No admin actions recorded for this scheme yet. Changes made before the Admin Console
              existed are not tracked.
            </p>
          ) : (
            <div className="space-y-3">
              {audit.map((a) => (
                <div key={a.id} className="border border-gray-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={a.outcome === 'success' ? 'green' : 'red'}>{a.action}</Badge>
                    <span className="text-xs text-gray-400">
                      {a.actor_role ?? 'admin'} · {timeAgo(a.created_at)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mt-1.5">{a.summary}</div>
                  {(a.previous_value != null || a.new_value != null) && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-gray-500 font-semibold">Value diff</summary>
                      <div className="grid md:grid-cols-2 gap-2 mt-2">
                        <pre className="bg-red-50/60 border border-red-100 rounded-lg p-2.5 overflow-x-auto text-[11px]">
                          {JSON.stringify(a.previous_value, null, 2)}
                        </pre>
                        <pre className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-2.5 overflow-x-auto text-[11px]">
                          {JSON.stringify(a.new_value, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                  {(a.metadata as { reason?: string } | null)?.reason && (
                    <div className="text-xs text-gray-500 mt-2 italic">
                      Reason: {(a.metadata as { reason: string }).reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      <ConfirmDialog
        open={pending != null}
        title={`${pending?.label} this scheme?`}
        body={
          <span>
            <b>{truncate(scheme.official_name, 60)}</b> will move to{' '}
            <Badge tone="blue">{pending?.to}</Badge>.
            {pending?.to === 'published' && ' It will become visible to all users.'}
            {pending?.to === 'archived' && ' It will be hidden from users but kept in history.'}
            {' '}This is recorded in the audit log and cannot be done silently.
          </span>
        }
        confirmLabel={pending?.label ?? 'Confirm'}
        danger={pending?.danger}
        busy={busy}
        requireReason
        onConfirm={(reason) => void runTransition(reason)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
};
