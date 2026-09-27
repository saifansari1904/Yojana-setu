/**
 * YOJANA SETU — ADMIN CONSOLE verification queue.
 * UNVERIFIED → UNDER REVIEW → VERIFIED → PUBLISHED (with REJECTED branch).
 * Nothing is verified blindly: each card shows data-quality warnings first.
 */
import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Eye, ShieldAlert } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  Tabs,
  Badge,
  Btn,
  VerificationBadge,
  ConfirmDialog,
  useToast,
  EmptyState,
  AlertBanner,
} from '../components/ui';
import { go } from '../components/router';
import { can } from '../lib/permissions';
import { writeAudit } from '../lib/audit';
import { timeAgo, truncate } from '../lib/format';
import type { SchemeAdminRow } from '../lib/adminTypes';

interface ReviewItem extends SchemeAdminRow {
  sourceCount: number;
  docCount: number;
  ruleCount: number;
  warnings: string[];
}

function computeWarnings(
  r: SchemeAdminRow,
  sourceCount: number,
  docCount: number,
  ruleCount: number,
): string[] {
  const w: string[] = [];
  if (!r.benefit_summary) w.push('Missing benefit summary');
  if (!r.description) w.push('Missing description');
  if (!r.sponsoring_ministry) w.push('Missing ministry');
  if (sourceCount === 0) w.push('No recorded sources');
  if (docCount === 0) w.push('No document requirements');
  const rp = (r.raw_payload ?? {}) as Record<string, unknown>;
  const hasCriteria =
    (Array.isArray(rp.mandatoryCriteria) && rp.mandatoryCriteria.length > 0) ||
    rp.minAge != null ||
    rp.maxAge != null ||
    (Array.isArray(rp.otherMandatoryCriteria) && rp.otherMandatoryCriteria.length > 0);
  if (!hasCriteria) w.push('No eligibility criteria in engine input');
  if (ruleCount === 0) w.push('No normalized rules (reference)');
  return w;
}

export const Reviews: React.FC = () => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const [tab, setTab] = useState('queue');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<null | { item: ReviewItem; to: string; label: string; verif?: string }>(null);
  const [busy, setBusy] = useState(false);

  const role = identity?.role ?? null;
  const canVerify = can(role, 'verify_schemes');
  const canPublish = can(role, 'publish_schemes');

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const statuses = tab === 'queue' ? ['under_review'] : ['rejected', 'verified'];
        const { data, error } = await client
          .from('schemes')
          .select('*')
          .in('status', statuses)
          .order('updated_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        const rows = (data ?? []) as SchemeAdminRow[];
        const ids = rows.map((r) => r.id);
        let srcMap = new Map<string, number>();
        let docMap = new Map<string, number>();
        let ruleMap = new Map<string, number>();
        if (ids.length > 0) {
          const [srcR, docR, ruleR] = await Promise.all([
            client.from('scheme_sources').select('scheme_id').in('scheme_id', ids),
            client.from('scheme_document_requirements').select('scheme_id').in('scheme_id', ids),
            client.from('scheme_eligibility_rules').select('scheme_id').in('scheme_id', ids),
          ]);
          const tally = (arr: Array<{ scheme_id: string }> | null) => {
            const m = new Map<string, number>();
            for (const r of arr ?? []) m.set(r.scheme_id, (m.get(r.scheme_id) ?? 0) + 1);
            return m;
          };
          if (!srcR.error) srcMap = tally(srcR.data as Array<{ scheme_id: string }>);
          if (!docR.error) docMap = tally(docR.data as Array<{ scheme_id: string }>);
          if (!ruleR.error) ruleMap = tally(ruleR.data as Array<{ scheme_id: string }>);
        }
        if (!cancelled) {
          setItems(
            rows.map((r) => {
              const sc = srcMap.get(r.id) ?? 0;
              const dc = docMap.get(r.id) ?? 0;
              const rc = ruleMap.get(r.id) ?? 0;
              return { ...r, sourceCount: sc, docCount: dc, ruleCount: rc, warnings: computeWarnings(r, sc, dc, rc) };
            }),
          );
        }
      } catch (e) {
        toast.push('error', `Could not load review queue: ${e instanceof Error ? e.message : 'unknown error'}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, tab, toast]);

  const runAction = async (reason?: string) => {
    if (!client || !identity || !action) return;
    setBusy(true);
    try {
      const patch: Record<string, unknown> = { status: action.to };
      if (action.verif) patch.verification_status = action.verif;
      const { error } = await client.from('schemes').update(patch).eq('id', action.item.id);
      if (error) throw error;
      await writeAudit(client, identity, {
        action: `scheme_${action.to}`,
        resourceType: 'scheme',
        resourceId: action.item.id,
        summary: `Scheme "${action.item.official_name ?? action.item.id}" ${action.label.toLowerCase()}${action.item.warnings.length ? ` with ${action.item.warnings.length} open warning(s)` : ''}. Reason: ${reason ?? '—'}`,
        previousValue: { status: action.item.status, verification_status: action.item.verification_status },
        newValue: patch,
        metadata: { reason: reason ?? null, warnings: action.item.warnings },
      });
      toast.push('success', `Scheme ${action.to}.`);
      setAction(null);
      setItems((prev) => prev.filter((i) => i.id !== action.item.id));
    } catch (e) {
      toast.push('error', `Action failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Verification reviews"
        description="Imported or drafted schemes wait here. Verify means: the data matches an authoritative government source."
      />
      <Tabs
        tabs={[
          { key: 'queue', label: 'Awaiting review', count: tab === 'queue' ? items.length : undefined },
          { key: 'decided', label: 'Verified / Rejected' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-sm text-gray-400 animate-pulse">
          Loading queue…
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={tab === 'queue' ? 'Queue is empty' : 'Nothing here'}
          hint={tab === 'queue' ? 'No schemes are waiting for review right now.' : 'No verified or rejected schemes yet.'}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => go(`schemes/${item.id}`)}
                    className="font-bold text-[15px] hover:text-[#0F6B4C] hover:underline text-left"
                  >
                    {item.official_name ?? item.id}
                  </button>
                  <div className="text-xs text-gray-500 mt-1">
                    {truncate(item.benefit_summary, 120)}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <VerificationBadge value={item.verification_status} />
                    <Badge tone="gray">{item.sourceCount} sources</Badge>
                    <Badge tone="gray">{item.docCount} documents</Badge>
                    <Badge tone="gray">{item.ruleCount} rules</Badge>
                    <span className="text-[11px] text-gray-400">updated {timeAgo(item.updated_at)}</span>
                  </div>
                  {item.warnings.length > 0 && (
                    <div className="mt-2.5 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                      <span>
                        <b>Data warnings:</b> {item.warnings.join(' · ')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Btn variant="ghost" onClick={() => go(`schemes/${item.id}`)}>
                    <Eye size={14} /> Inspect
                  </Btn>
                  {tab === 'queue' && canVerify && (
                    <>
                      <Btn
                        variant="primary"
                        onClick={() => setAction({ item, to: 'verified', label: 'Verified', verif: 'VERIFIED' })}
                      >
                        <CheckCircle2 size={14} /> Verify
                      </Btn>
                      <Btn
                        variant="danger"
                        onClick={() => setAction({ item, to: 'rejected', label: 'Rejected' })}
                      >
                        <XCircle size={14} /> Reject
                      </Btn>
                    </>
                  )}
                  {tab === 'decided' && item.status === 'verified' && canPublish && (
                    <Btn
                      variant="primary"
                      onClick={() => setAction({ item, to: 'published', label: 'Published' })}
                    >
                      <CheckCircle2 size={14} /> Publish
                    </Btn>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'queue' && items.length > 0 && (
        <AlertBanner tone="gray" className="mt-4">
          Verifying a scheme with open warnings is allowed but recorded — the warnings travel into
          the audit entry. Prefer fixing the data first.
        </AlertBanner>
      )}

      <ConfirmDialog
        open={action != null}
        title={`${action?.label} this scheme?`}
        body={
          <span>
            <b>{truncate(action?.item.official_name, 60)}</b> will be marked{' '}
            <Badge tone="blue">{action?.to}</Badge>.
            {(action?.item.warnings.length ?? 0) > 0 && (
              <span className="block mt-2 text-amber-700">
                Open warnings: {action?.item.warnings.join(' · ')}
              </span>
            )}
          </span>
        }
        confirmLabel={action?.label ?? 'Confirm'}
        danger={action?.to === 'rejected'}
        busy={busy}
        requireReason
        onConfirm={(reason) => void runAction(reason)}
        onCancel={() => setAction(null)}
      />
    </div>
  );
};
