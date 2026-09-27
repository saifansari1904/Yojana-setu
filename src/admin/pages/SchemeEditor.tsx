/**
 * YOJANA SETU — ADMIN CONSOLE scheme editor.
 * Edits the structured columns AND raw_payload (the matching engine's real
 * input) in one save. Lifecycle status is intentionally NOT editable here —
 * status changes go through the review workflow on the detail page so they
 * always carry a reason and an audit entry.
 */
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  PageHeader,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  Btn,
  AlertBanner,
  useToast,
} from '../components/ui';
import { go } from '../components/router';
import { writeAudit } from '../lib/audit';
import type { SchemeAdminRow } from '../lib/adminTypes';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'scheme'
  );
}

const VERIF_OPTIONS = ['UNVERIFIED', 'NEEDS_REVIEW', 'PARTIALLY_VERIFIED', 'VERIFIED'];

export const SchemeEditor: React.FC<{ id?: string }> = ({ id }) => {
  const { client, identity } = useAdminAuth();
  const toast = useToast();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState<SchemeAdminRow | null>(null);

  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [ministry, setMinistry] = useState('');
  const [department, setDepartment] = useState('');
  const [schemeType, setSchemeType] = useState('');
  const [scope, setScope] = useState('');
  const [benefitSummary, setBenefitSummary] = useState('');
  const [description, setDescription] = useState('');
  const [fundingRange, setFundingRange] = useState('');
  const [verifStatus, setVerifStatus] = useState('UNVERIFIED');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState('');
  const [rawJson, setRawJson] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !client) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await client.from('schemes').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        if (cancelled || !data) return;
        const r = data as SchemeAdminRow;
        setOriginal(r);
        setName(r.official_name ?? '');
        setShortCode(r.short_code ?? '');
        setIdentifier(r.official_scheme_identifier ?? '');
        setMinistry(r.sponsoring_ministry ?? '');
        setDepartment(r.department ?? '');
        setSchemeType(r.scheme_type ?? '');
        setScope(r.scope ?? '');
        setBenefitSummary(r.benefit_summary ?? '');
        setDescription(r.description ?? '');
        setFundingRange(r.funding_range_text ?? '');
        setVerifStatus(r.verification_status ?? 'UNVERIFIED');
        setTags((r.metadata?.tags ?? []).join(', '));
        setCategories((r.metadata?.categories ?? []).join(', '));
        setRawJson(JSON.stringify(r.raw_payload ?? {}, null, 2));
      } catch (e) {
        toast.push('error', `Could not load scheme: ${e instanceof Error ? e.message : 'unknown error'}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, id, isNew, toast]);

  const save = async () => {
    if (!client || !identity) return;
    if (!name.trim()) {
      toast.push('error', 'Official name is required.');
      return;
    }
    let payload: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(rawJson || '{}');
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('must be a JSON object');
      }
      payload = parsed as Record<string, unknown>;
      setJsonError(null);
    } catch (e) {
      setJsonError(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
      return;
    }

    setSaving(true);
    try {
      const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
      const row = {
        official_name: name.trim(),
        short_code: shortCode.trim() || null,
        official_scheme_identifier: identifier.trim() || null,
        sponsoring_ministry: ministry.trim() || null,
        department: department.trim() || null,
        scheme_type: schemeType.trim() || null,
        scope: scope || null,
        benefit_summary: benefitSummary.trim() || null,
        description: description.trim() || null,
        funding_range_text: fundingRange.trim() || null,
        verification_status: verifStatus,
        metadata: {
          ...(original?.metadata ?? {}),
          tags: split(tags),
          categories: split(categories),
        },
        raw_payload: payload as never,
      };

      if (isNew) {
        const newId = slugify(name);
        const { data: exists } = await client.from('schemes').select('id').eq('id', newId).maybeSingle();
        if (exists) {
          toast.push('error', `A scheme with id "${newId}" already exists. Rename slightly and retry.`);
          setSaving(false);
          return;
        }
        // Minimal engine-readable payload: the admin fills eligibility via
        // the JSON editor; structured columns above override display.
        const minimal = {
          id: newId,
          name: name.trim(),
          benefitSummary: benefitSummary.trim(),
          description: description.trim(),
          applicableStates: [],
          ...payload,
        };
        const { error } = await client.from('schemes').insert({
          id: newId,
          status: 'draft',
          ...row,
          raw_payload: minimal as never,
        });
        if (error) throw error;
        await writeAudit(client, identity, {
          action: 'scheme_created',
          resourceType: 'scheme',
          resourceId: newId,
          summary: `Scheme "${name.trim()}" created as draft.`,
          newValue: { id: newId, official_name: name.trim() },
        });
        toast.push('success', 'Scheme created as draft.');
        go(`schemes/${newId}`);
      } else {
        const changed: string[] = [];
        const o = original!;
        const check = (label: string, a: unknown, b: unknown) => {
          if (JSON.stringify(a) !== JSON.stringify(b)) changed.push(label);
        };
        check('official_name', o.official_name, row.official_name);
        check('benefit_summary', o.benefit_summary, row.benefit_summary);
        check('description', o.description, row.description);
        check('ministry', o.sponsoring_ministry, row.sponsoring_ministry);
        check('verification_status', o.verification_status, row.verification_status);
        check('raw_payload', o.raw_payload, row.raw_payload);

        const { error } = await client.from('schemes').update(row).eq('id', id);
        if (error) throw error;
        await writeAudit(client, identity, {
          action: 'scheme_edited',
          resourceType: 'scheme',
          resourceId: id,
          summary: `Scheme "${name.trim()}" edited (${changed.length ? changed.join(', ') : 'no field changes'}).`,
          previousValue: {
            official_name: o.official_name,
            benefit_summary: o.benefit_summary,
            verification_status: o.verification_status,
          },
          newValue: {
            official_name: row.official_name,
            benefit_summary: row.benefit_summary,
            verification_status: row.verification_status,
          },
          metadata: { changed_fields: changed },
        });
        toast.push('success', 'Scheme saved.');
        go(`schemes/${id}`);
      }
    } catch (e) {
      toast.push('error', `Save failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Loading…" />
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-sm text-gray-400 animate-pulse">
          Fetching scheme…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => go(isNew ? 'schemes' : `schemes/${id}`)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-3"
      >
        <ArrowLeft size={13} /> {isNew ? 'Back to schemes' : 'Back to scheme'}
      </button>
      <PageHeader
        title={isNew ? 'New scheme' : 'Edit scheme'}
        description={
          isNew
            ? 'Creates a draft. It becomes visible to users only after verification and publishing.'
            : 'Edits are audit-logged with the changed fields. Status changes happen via the review workflow, not here.'
        }
        actions={
          <Btn variant="primary" onClick={() => void save()} disabled={saving}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save scheme'}
          </Btn>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 mb-4">
        <Field label="Official name *">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PM Vishwakarma" />
        </Field>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Short code">
            <TextInput value={shortCode} onChange={(e) => setShortCode(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Official identifier">
            <TextInput value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Scope">
            <SelectInput value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="">—</option>
              <option value="NATIONAL">National</option>
              <option value="STATE_SPECIFIC">State-specific</option>
            </SelectInput>
          </Field>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Sponsoring ministry">
            <TextInput value={ministry} onChange={(e) => setMinistry(e.target.value)} />
          </Field>
          <Field label="Department">
            <TextInput value={department} onChange={(e) => setDepartment(e.target.value)} />
          </Field>
          <Field label="Scheme type">
            <TextInput value={schemeType} onChange={(e) => setSchemeType(e.target.value)} />
          </Field>
        </div>
        <Field label="Benefit summary">
          <TextArea rows={2} value={benefitSummary} onChange={(e) => setBenefitSummary(e.target.value)} />
        </Field>
        <Field label="Description">
          <TextArea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Funding range (text)">
            <TextInput value={fundingRange} onChange={(e) => setFundingRange(e.target.value)} placeholder="e.g. ₹1–2 lakh" />
          </Field>
          <Field label="Verification status">
            <SelectInput value={verifStatus} onChange={(e) => setVerifStatus(e.target.value)}>
              {VERIF_OPTIONS.map((o) => (
                <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Tags (comma-separated)">
            <TextInput value={tags} onChange={(e) => setTags(e.target.value)} placeholder="msme, women, credit" />
          </Field>
          <Field label="Categories (comma-separated)">
            <TextInput value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="Credit, Skilling" />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Field
          label="raw_payload — engine input (JSON)"
          hint="This is what the deterministic matching engine reads. Structured fields above override display, but eligibility semantics live here. Invalid JSON blocks saving."
        >
          <TextArea
            rows={16}
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            spellCheck={false}
            className="font-mono text-[12px] leading-relaxed"
          />
        </Field>
        {jsonError && (
          <AlertBanner tone="red" className="mt-3">{jsonError}</AlertBanner>
        )}
      </div>

      <div className="flex justify-end mt-5">
        <Btn variant="primary" onClick={() => void save()} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving…' : 'Save scheme'}
        </Btn>
      </div>
    </div>
  );
};
