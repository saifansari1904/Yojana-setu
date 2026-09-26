import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Lock,
  ArrowRight,
} from 'lucide-react';
import type { DocumentDashboardSummary } from '../../types/commandCenter';
import { AnimatedCounter } from '../../animations/AnimatedCounter';

interface DocumentOverviewProps {
  summary: DocumentDashboardSummary;
  onOpenChecklist?: () => void;
  isHi?: boolean;
}

export const DocumentOverview: React.FC<DocumentOverviewProps> = ({
  summary,
  onOpenChecklist,
  isHi = false,
}) => {
  return (
    <section
      id="document-overview"
      className="bg-white dark:bg-[var(--bg-raised)] border border-[#E3ECE7] dark:border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#EAF5EF] dark:bg-[var(--bg-subtle)] text-[#0F6B4C] dark:text-[var(--accent-green)]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {isHi ? 'वैधानिक दस्तावेज तत्परता' : 'Statutory Document Readiness'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isHi
                ? 'पात्र योजनाओं के लिए आवश्यक सरकारी प्रमाणपत्रों की समग्र स्थिति'
                : 'Aggregate readiness of certificates mandated across matched schemes'}
            </p>
          </div>
        </div>

        {onOpenChecklist && (
          <button
            id="view-doc-checklist-btn"
            onClick={onOpenChecklist}
            className="text-xs font-semibold text-[#0F6B4C] dark:text-[var(--accent-green)] hover:underline px-2 py-1 min-h-[44px] flex items-center gap-1"
          >
            <span>{isHi ? 'चेकलिस्ट देखें' : 'View Checklist'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-[#FAFBF9] dark:bg-[var(--bg-raised)] border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isHi ? 'अद्वितीय वैधानिक' : 'Unique Mandated'}
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            <AnimatedCounter value={summary.totalUniqueMandatory} />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#FAFBF9] dark:bg-[var(--bg-raised)] border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isHi ? 'तैयार चिह्नित' : 'Marked Prepared'}
          </div>
          <div className="text-xl font-bold text-[#0F6B4C] dark:text-[var(--accent-green)] mt-1">
            <AnimatedCounter value={summary.preparedCount} />
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#FAFBF9] dark:bg-[var(--bg-raised)] border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isHi ? 'लंबित तैयारी' : 'Pending Prep'}
          </div>
          <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">
            <AnimatedCounter value={summary.pendingCount} />
          </div>
        </div>
      </div>

      {/* Document Types Tag Clouds */}
      {summary.verifiedDocumentTypes.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {isHi ? 'पहचाने गए मुख्य वैधानिक प्रमाणपत्र' : 'Identified Statutory Certificates'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {summary.verifiedDocumentTypes.map((doc, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700"
              >
                {doc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sensitive Identifier Protection Callout */}
      <div className="p-3 rounded-lg bg-[#F3F9F5] dark:bg-[var(--bg-raised)] border border-[#D5EADB] dark:border-[#1C3A2D] text-xs flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-[#0F6B4C] dark:text-[var(--accent-green)] mt-0.5 shrink-0" />
        <div className="leading-relaxed text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">
            {isHi ? 'संवेदनशील पहचानकर्ता संरक्षण:' : 'Sensitive Identifier Protection:'}{' '}
          </span>
          {isHi
            ? 'योजना सेतु एक परामर्शी तैयारी कार्यक्षेत्र है। योजना सेतु कभी पहचान संख्या, पासवर्ड या बैंक विवरण नहीं मांगता है, और संग्रहण से पूर्व नाम फ़ील्ड स्वच्छ करता है।'
            : 'Yojana Setu functions as an advisory readiness workspace. Yojana Setu never asks for identity numbers, passwords, or bank credentials, and sanitizes name fields before persistence.'}
        </div>
      </div>
    </section>
  );
};
