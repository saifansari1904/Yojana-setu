/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Building2,
  IndianRupee,
  FileText,
  Save,
  Check,
  AlertCircle,
  Camera,
  Trash2,
} from 'lucide-react';
import { UserProfile, SocialCategory, BusinessType } from '../../types/user';
import {
  SupportNeedType,
  BusinessStageKey,
  BusinessEntityType,
} from '../../types/business';
import { useTranslation, PROFILE_I18N, SUPPORTED_LANGUAGES } from '../../i18n';
import { CitizenAvatarInsignia } from '../common/CitizenAvatarInsignia';
import {
  deriveBusinessProfile,
  deriveBusinessNeedProfile,
  calculateFundingGap,
} from '../../lib/business';

export type ProfileEditTab = 'personal' | 'business' | 'financial' | 'registration';

interface ProfileEditModalProps {
  isOpen: boolean;
  initialTab?: ProfileEditTab;
  profile: UserProfile;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Andaman and Nicobar Islands', 'Lakshadweep'
];

const CATEGORIES: { id: SocialCategory; label: string }[] = [
  { id: 'General', label: 'General / Open Category' },
  { id: 'OBC', label: 'Other Backward Classes (OBC)' },
  { id: 'SC', label: 'Scheduled Caste (SC)' },
  { id: 'ST', label: 'Scheduled Tribe (ST)' },
  { id: 'Minority', label: 'Religious Minority' },
  { id: 'Woman', label: 'Woman Entrepreneur' },
];

const BUSINESS_TYPES: { id: BusinessType; label: string }[] = [
  { id: 'manufacturing', label: 'Manufacturing / Production' },
  { id: 'services', label: 'Services / Repair / Agency' },
  { id: 'trading', label: 'Retail / Wholesale Trading' },
  { id: 'food', label: 'Food Processing & Agri-Value' },
  { id: 'handicraft', label: 'Handicrafts & Traditional Artisans' },
  { id: 'tech', label: 'IT / Digital / CleanTech' },
  { id: 'agri', label: 'Agri-Allied & Dairy' },
];

const BUSINESS_STAGES: { id: BusinessStageKey; label: string }[] = [
  { id: 'IDEA', label: 'Idea Stage (Conceptual planning)' },
  { id: 'PRE_LAUNCH', label: 'Pre-Launch & Setup (Within 12 months)' },
  { id: 'NEW_BUSINESS', label: 'New Business (< 1 Year operations)' },
  { id: 'EARLY_OPERATION', label: 'Early Operation (1–3 Years)' },
  { id: 'GROWTH', label: 'Growth & Scaling' },
  { id: 'EXPANSION', label: 'Expansion & Diversification' },
];

const ENTITY_TYPES: { id: BusinessEntityType; label: string }[] = [
  { id: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
  { id: 'PARTNERSHIP', label: 'Partnership Firm' },
  { id: 'LLP', label: 'Limited Liability Partnership (LLP)' },
  { id: 'PRIVATE_LIMITED', label: 'Private Limited Company' },
  { id: 'SELF_HELP_GROUP', label: 'Self Help Group (SHG)' },
  { id: 'COOPERATIVE', label: 'Cooperative Society' },
  { id: 'INDIVIDUAL', label: 'Individual Artisan / Vendor' },
  { id: 'INFORMAL_BUSINESS', label: 'Informal / Unregistered Enterprise' },
  { id: 'NOT_REGISTERED', label: 'Not Yet Registered' },
];

const SUPPORT_NEEDS: { id: SupportNeedType; label: string }[] = [
  { id: 'CAPITAL', label: 'Capital / Startup Investment' },
  { id: 'WORKING_CAPITAL', label: 'Working Capital / Stock & Inventory' },
  { id: 'EQUIPMENT', label: 'Equipment / Machinery' },
  { id: 'SUBSIDY', label: 'Capital Subsidy / Margin Money Grant' },
  { id: 'CREDIT', label: 'Credit / Loan Access' },
  { id: 'SKILL_DEVELOPMENT', label: 'Skill Development & Entrepreneurship Training' },
  { id: 'MARKET_ACCESS', label: 'Marketing & Exhibitions' },
  { id: 'BUSINESS_REGISTRATION', label: 'Business Registration & Formalization' },
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  initialTab = 'personal',
  profile,
  onClose,
  onSave,
}) => {
  const { lang, formatCurrency } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const [activeTab, setActiveTab] = useState<ProfileEditTab>(initialTab);
  const [formState, setFormState] = useState<UserProfile>({ ...profile });
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if initialTab changes on open
  React.useEffect(() => {
    if (isOpen) {
      setFormState({ ...profile });
      setActiveTab(initialTab);
      setError(null);
      setPhotoError(null);
    }
  }, [isOpen, initialTab, profile]);

  if (!isOpen) return null;

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError(strings.photoTypeError);
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoError(strings.photoSizeError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleChange('photoUrl', dataUrl);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formState.applicantName || !formState.applicantName.trim()) {
      setError('Please provide an applicant or entrepreneur name.');
      setActiveTab('personal');
      return;
    }
    if (formState.age < 18 || formState.age > 85) {
      setError('Age must be between 18 and 85 years for statutory enterprise credit eligibility.');
      setActiveTab('personal');
      return;
    }

    const totalCost = formState.totalProjectCost || formState.fundingRequired || 500000;
    const ownMargin = formState.existingInvestment || formState.investmentAmount || 0;
    const gap = calculateFundingGap(totalCost, ownMargin);

    const isRegistered =
      formState.registrationStatus === 'REGISTERED' ||
      formState.businessRegistration === 'udyam' ||
      formState.businessRegistration === 'gst' ||
      formState.businessRegistration === 'local_trade' ||
      formState.isRegistered === true;

    const updated: UserProfile = {
      ...formState,
      fundingRequired: totalCost,
      investmentAmount: ownMargin,
      totalProjectCost: totalCost,
      existingInvestment: ownMargin,
      fundingGap: gap,
      businessState: formState.businessState || formState.state,
      residenceState: formState.residenceState || formState.state,
      isInterstate: formState.businessState ? formState.businessState !== formState.state : false,
      isRegistered,
    };

    // Re-derive business profile and needs
    updated.businessProfile = deriveBusinessProfile(updated);
    updated.businessNeedProfile = deriveBusinessNeedProfile(updated);

    onSave(updated);
    onClose();
  };

  return (
    <div
      id="profile-edit-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--overlay)] backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="profile-edit-modal-card"
        className="bg-white dark:bg-[var(--bg-card)] border border-[#DEE7E2] dark:border-[var(--border-subtle)] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-auto transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8EFEA] dark:border-[var(--border-subtle)] bg-[#F8FAF9] dark:bg-[var(--bg-card)]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#14453D] dark:text-[var(--accent-green)]" />
            <h3 className="text-base sm:text-lg font-bold text-[#1F2421] dark:text-[var(--text-main)]">
              {strings.editModalTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#516A5F] hover:bg-[#E8EFEA] dark:hover:bg-[var(--bg-raised)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#E8EFEA] dark:border-[var(--border-subtle)] bg-[#F4F7F5] dark:bg-[var(--bg-card)] px-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'personal'
                ? 'border-[#14453D] dark:border-[var(--accent-green)] text-[#14453D] dark:text-[var(--accent-green)]'
                : 'border-transparent text-[#516A5F] dark:text-[var(--text-secondary)] hover:text-[#1F2421]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{strings.tabPersonal}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'business'
                ? 'border-[#14453D] dark:border-[var(--accent-green)] text-[#14453D] dark:text-[var(--accent-green)]'
                : 'border-transparent text-[#516A5F] dark:text-[var(--text-secondary)] hover:text-[#1F2421]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{strings.tabBusiness}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'financial'
                ? 'border-[#14453D] dark:border-[var(--accent-green)] text-[#14453D] dark:text-[var(--accent-green)]'
                : 'border-transparent text-[#516A5F] dark:text-[var(--text-secondary)] hover:text-[#1F2421]'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            <span>{strings.tabFinancial}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('registration')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'registration'
                ? 'border-[#14453D] dark:border-[var(--accent-green)] text-[#14453D] dark:text-[var(--accent-green)]'
                : 'border-transparent text-[#516A5F] dark:text-[var(--text-secondary)] hover:text-[#1F2421]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{strings.tabRegistration}</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* PERSONAL TAB */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                {/* Profile Photo & Avatar Card */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#F8FAF9] dark:bg-[var(--bg-card)] border border-[#DEE7E2] dark:border-[var(--border-subtle)]">
                  <div className="relative shrink-0">
                    <CitizenAvatarInsignia
                      size="lg"
                      displayName={formState.applicantName}
                      photoUrl={formState.photoUrl}
                      isVerified={true}
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#14453D] dark:text-[var(--accent-green)]">
                      {strings.uploadPhotoTitle}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {strings.uploadPhotoDesc}
                    </p>
                    {photoError && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {photoError}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="modal-profile-photo-input"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14453D] text-white hover:bg-[#0F352E] dark:bg-[#1B574C] dark:hover:bg-[var(--brand-deep)] transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{formState.photoUrl ? strings.changePhotoPrompt : strings.choosePhotoBtn}</span>
                      </button>
                      {formState.photoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            handleChange('photoUrl', undefined);
                            setPhotoError(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{strings.removePhotoBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                    {strings.applicantName} *
                  </label>
                  <input
                    type="text"
                    value={formState.applicantName || ''}
                    onChange={(e) => handleChange('applicantName', e.target.value)}
                    placeholder="Enter full name of applicant"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.category} *
                    </label>
                    <select
                      value={formState.category}
                      onChange={(e) => handleChange('category', e.target.value as SocialCategory)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.age} (18–85) *
                    </label>
                    <input
                      type="number"
                      min={18}
                      max={85}
                      value={formState.age || 28}
                      onChange={(e) => handleChange('age', parseInt(e.target.value) || 18)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.gender}
                    </label>
                    <select
                      value={formState.gender || 'male'}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="transgender">Transgender</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.annualIncome} (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={formState.annualIncome || 250000}
                      onChange={(e) => handleChange('annualIncome', parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.state} *
                    </label>
                    <select
                      value={formState.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.district}
                    </label>
                    <input
                      type="text"
                      value={formState.district || ''}
                      onChange={(e) => handleChange('district', e.target.value)}
                      placeholder="e.g. Pune, Jaipur, Madurai"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.ruralUrban}
                    </label>
                    <select
                      value={formState.ruralUrban || 'rural'}
                      onChange={(e) => handleChange('ruralUrban', e.target.value as 'rural' | 'urban')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    >
                      <option value="rural">Rural (Eligible for higher subsidy)</option>
                      <option value="urban">Urban</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* BUSINESS TAB */}
            {activeTab === 'business' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                    {strings.businessName}
                  </label>
                  <input
                    type="text"
                    value={formState.businessName || ''}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    placeholder="e.g. Shiv Shakti Agro Processing / Priya Boutique"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                    {strings.businessIdea}
                  </label>
                  <textarea
                    rows={2}
                    value={formState.businessIdea || ''}
                    onChange={(e) => handleChange('businessIdea', e.target.value)}
                    placeholder="Brief description of enterprise activity, product, or services..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.sector} *
                    </label>
                    <select
                      value={formState.businessType}
                      onChange={(e) => handleChange('businessType', e.target.value as BusinessType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    >
                      {BUSINESS_TYPES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.subSector}
                    </label>
                    <input
                      type="text"
                      value={formState.subSector || ''}
                      onChange={(e) => handleChange('subSector', e.target.value)}
                      placeholder="e.g. Mustard Oil Milling, Tailoring, Dairy"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.businessStage}
                    </label>
                    <select
                      value={formState.businessStageKey || 'NEW_PRE_LAUNCH'}
                      onChange={(e) => handleChange('businessStageKey', e.target.value as BusinessStageKey)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    >
                      {BUSINESS_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.entityType}
                    </label>
                    <select
                      value={formState.businessEntityType || 'SOLE_PROPRIETORSHIP'}
                      onChange={(e) => handleChange('businessEntityType', e.target.value as BusinessEntityType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    >
                      {ENTITY_TYPES.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.businessLocation} (Operating State)
                    </label>
                    <select
                      value={formState.businessState || formState.state}
                      onChange={(e) => handleChange('businessState', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.experienceYears} (Years)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={formState.entrepreneurExperienceYears ?? 2}
                      onChange={(e) => handleChange('entrepreneurExperienceYears', parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* FINANCIAL TAB */}
            {activeTab === 'financial' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.totalProjectCost} (₹) *
                    </label>
                    <input
                      type="number"
                      min={10000}
                      step={50000}
                      value={formState.totalProjectCost || formState.fundingRequired || 500000}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 50000;
                        handleChange('totalProjectCost', val);
                        handleChange('fundingRequired', val);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.ownInvestment} / Promoter Margin (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={formState.existingInvestment ?? formState.investmentAmount ?? 50000}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleChange('existingInvestment', val);
                        handleChange('investmentAmount', val);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.primaryNeed} *
                    </label>
                    <select
                      value={formState.primarySupportNeed || 'WORKING_CAPITAL'}
                      onChange={(e) => handleChange('primarySupportNeed', e.target.value as SupportNeedType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    >
                      {SUPPORT_NEEDS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-1">
                      {strings.turnover} (Annual ₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={formState.existingTurnover ?? 0}
                      onChange={(e) => handleChange('existingTurnover', parseInt(e.target.value) || 0)}
                      placeholder="0 for new enterprises"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9E8DF] dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card)] text-sm text-[#1F2421] dark:text-[var(--text-main)] focus:ring-2 focus:ring-[#14453D] outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* REGISTRATION TAB — formalization only; individual records live in the section */}
            {activeTab === 'registration' && (
              <div className="space-y-4">
                <p className="text-[11px] text-[#516A5F] dark:text-[var(--text-secondary)]">
                  {strings.regTabNote}
                </p>
                <fieldset>
                  <legend className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)] block mb-2">
                    {strings.regFormalization}
                  </legend>
                  <div className="space-y-2">
                    {(
                      [
                        ['FORMALIZED', strings.regFormFormalized],
                        ['PARTIALLY_FORMALIZED', strings.regFormPartial],
                        ['INFORMAL', strings.regFormInformal],
                        ['UNKNOWN', strings.regFormUnknown],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[#E8EFEA] dark:border-[var(--border-subtle)] bg-[#F9FAF9] dark:bg-[var(--bg-card)] cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="businessFormalization"
                          value={value}
                          checked={(formState.businessFormalization || 'UNKNOWN') === value}
                          onChange={() => handleChange('businessFormalization', value)}
                          className="w-4 h-4 text-[#14453D] focus:ring-[#14453D]"
                        />
                        <span className="text-xs font-bold text-[#1F2421] dark:text-[var(--text-main)]">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8EFEA] dark:border-[var(--border-subtle)] bg-[#F8FAF9] dark:bg-[var(--bg-card)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#516A5F] hover:bg-[#E8EFEA] dark:hover:bg-[var(--bg-raised)] rounded-xl transition-colors cursor-pointer"
            >
              {strings.cancel}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#14453D] hover:bg-[#0F352E] dark:bg-[#1E6A50] dark:hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{strings.saveChanges}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
