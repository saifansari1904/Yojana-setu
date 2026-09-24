/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, Trash2, X, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { CitizenAvatarInsignia, getFirstLetterOfFirstName } from '../common/CitizenAvatarInsignia';
import { useTranslation } from '../../i18n';
import { PROFILE_I18N } from '../../i18n/profileI18n';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  currentPhotoUrl?: string;
  displayName?: string;
  onClose: () => void;
  onSavePhoto: (newPhotoUrl?: string) => void;
}

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  isOpen,
  currentPhotoUrl,
  displayName,
  onClose,
  onSavePhoto,
}) => {
  const { lang } = useTranslation();
  const strings = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentPhotoUrl);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentPhotoUrl);
      setFileDetails(null);
      setError(null);
      setIsDragging(false);
    }
  }, [isOpen, currentPhotoUrl]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFile = (file: File) => {
    setError(null);

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError(strings.photoTypeError);
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(strings.photoSizeError);
      return;
    }

    // Read as Data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPreviewUrl(result);
        setFileDetails({
          name: file.name,
          size: formatFileSize(file.size),
        });
      }
    };
    reader.onerror = () => {
      setError(strings.photoTypeError);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input value so re-selecting the same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(undefined);
    setFileDetails(null);
    setError(null);
  };

  const handleConfirm = () => {
    onSavePhoto(previewUrl);
    onClose();
  };

  const initialLetter = getFirstLetterOfFirstName(displayName);
  const hasPhotoInPreview = Boolean(previewUrl);
  const isChanged = previewUrl !== currentPhotoUrl;

  // Render via portal to document.body so the fixed overlay is always
  // positioned relative to the viewport. Ancestors with backdrop-filter,
  // filter, or transform (e.g. the sticky blurred app header) otherwise
  // become the containing block for `fixed` descendants, which pushes the
  // dialog half off-screen.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[var(--overlay)] backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-gray-200 dark:border-[var(--border-subtle)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 dark:border-[var(--border-subtle)] bg-[#F7FAF8] dark:bg-[var(--bg-raised)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14453D] text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="photo-modal-title" className="text-base font-bold text-gray-900 dark:text-gray-100">
                {strings.uploadPhotoTitle}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {strings.uploadPhotoDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={strings.cancel}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#22352B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Avatar Live Preview Showcase */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-gray-50 dark:bg-[var(--bg-raised)] border border-gray-200 dark:border-[#243329]">
            <div className="relative">
              <CitizenAvatarInsignia
                displayName={displayName}
                photoUrl={previewUrl}
                size="xl"
                isVerified={true}
                className="shadow-md"
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {hasPhotoInPreview ? strings.photoPreviewAlt : `${displayName || 'Citizen'} (Default Initial: ${initialLetter || 'User'})`}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {hasPhotoInPreview
                  ? (fileDetails ? `${fileDetails.name} • ${fileDetails.size}` : 'Current custom photograph')
                  : 'Circular single-letter avatar automatically derived from first name'}
              </p>
              {hasPhotoInPreview && (
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready to preview across header & profile</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop / Upload Target */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-[#14453D] bg-emerald-50/50 dark:bg-[#14453D]/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-[var(--bg-card)]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={handleFileInputChange}
              className="hidden"
              id="photo-file-upload-input"
            />

            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-[#14453D]/40 text-[#14453D] dark:text-[#5EEAD4] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Drag and drop your photo here, or browse
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supports JPG, JPEG, or PNG up to 3MB
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#14453D] text-white hover:bg-[#0F352E] dark:bg-[#1B574C] dark:hover:bg-[var(--brand-deep)] transition-colors shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{strings.choosePhotoBtn}</span>
              </button>

              {hasPhotoInPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{strings.removePhotoBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-[var(--border-subtle)] bg-[#F7FAF8] dark:bg-[var(--bg-raised)]">
          <div>
            {currentPhotoUrl && !previewUrl && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Photo will be removed on save
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2A3B31] rounded-lg transition-colors"
            >
              {strings.cancelPhotoBtn}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isChanged && !previewUrl}
              className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
                isChanged
                  ? 'bg-[#14453D] text-white hover:bg-[#0F352E] dark:bg-[#1B574C] dark:hover:bg-[var(--brand-deep)]'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{strings.confirmPhotoBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
