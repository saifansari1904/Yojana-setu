/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CitizenAvatarInsignia, getFirstLetterOfFirstName } from '../common/CitizenAvatarInsignia';
import { useTranslation } from '../../i18n';
import { PROFILE_I18N } from '../../i18n/profileI18n';

export interface ProfilePhotoModalProps {
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

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="profile-photo-modal-card"
        className="relative w-full max-w-md sm:max-w-lg my-auto bg-white dark:bg-[#151D18] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#22352B] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-[#22352B] bg-[#F7FAF8] dark:bg-[#1A2520]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14453D] text-white flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="photo-modal-title" className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                {strings.uploadPhotoTitle}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {strings.uploadPhotoDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.cancel}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#22352B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[calc(85vh-130px)] overflow-y-auto">
          {/* Avatar Live Preview Showcase */}
          <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-gray-50 dark:bg-[#19221C] border border-gray-200 dark:border-[#243329]">
            <div className="relative shrink-0">
              <CitizenAvatarInsignia
                displayName={displayName}
                photoUrl={previewUrl}
                size="lg"
                isVerified={true}
                className="shadow-sm"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {hasPhotoInPreview ? strings.photoPreviewAlt : `${displayName || 'Citizen'} (Default Initial: ${initialLetter || 'User'})`}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {hasPhotoInPreview
                  ? (fileDetails ? `${fileDetails.name} • ${fileDetails.size}` : 'Current custom photograph')
                  : 'Circular avatar automatically derived from first name'}
              </p>
              {hasPhotoInPreview ? (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Ready to preview across header & profile</span>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span>Upload a photo below to replace initial avatar</span>
                </div>
              )}
            </div>

            {hasPhotoInPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="shrink-0 p-2 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900 transition-colors cursor-pointer"
                title={strings.removePhotoBtn}
                aria-label={strings.removePhotoBtn}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
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
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Upload photo drop area"
            className={`cursor-pointer group border-2 border-dashed rounded-xl p-5 sm:p-6 text-center transition-all flex flex-col items-center justify-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#14453D] ${
              isDragging
                ? 'border-[#14453D] bg-emerald-50/70 dark:bg-[#14453D]/25 ring-2 ring-[#14453D]/30'
                : 'border-gray-300 dark:border-gray-700 hover:border-[#14453D] dark:hover:border-[#4ADE80] hover:bg-gray-50/80 dark:hover:bg-[#1A2520]/50 bg-white dark:bg-[#151D18]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={handleFileInputChange}
              className="sr-only"
              id="photo-file-upload-input"
              tabIndex={-1}
            />

            <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-[#14453D]/40 text-[#14453D] dark:text-[#5EEAD4] flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                Click to upload or drag & drop photo here
              </p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                Supports JPG, PNG, or WEBP up to 3MB
              </p>
            </div>

            <div className="pt-1 flex flex-wrap gap-2 justify-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#14453D] text-white group-hover:bg-[#0F352E] dark:bg-[#1B574C] dark:group-hover:bg-[#14453D] transition-colors shadow-xs pointer-events-none">
                <Camera className="w-3.5 h-3.5" />
                <span>{hasPhotoInPreview ? 'Change Photo' : strings.choosePhotoBtn}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-gray-100 dark:border-[#22352B] bg-[#F7FAF8] dark:bg-[#1A2520]">
          <div>
            {currentPhotoUrl && !previewUrl && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Photo will be removed on save
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2A3B31] rounded-lg transition-colors cursor-pointer"
            >
              {strings.cancelPhotoBtn}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isChanged && !previewUrl}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
                isChanged
                  ? 'bg-[#14453D] text-white hover:bg-[#0F352E] dark:bg-[#1B574C] dark:hover:bg-[#14453D]'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{strings.confirmPhotoBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
