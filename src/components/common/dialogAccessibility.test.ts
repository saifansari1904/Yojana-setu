/**
 * YOJANA SETU — PHASE 2E.2 DIALOG ACCESSIBILITY REGRESSION TESTS
 * -----------------------------------------------------------------
 * Guards the dialog accessibility hardening (no DOM runner in this repo,
 * so these are source-level guards over the patched dialogs + hook):
 *
 *   A1. Patched dialogs use the shared useAccessibleDialog hook
 *       (Escape, focus-in, focus trap, focus return).
 *   A2. Dialog containers carry role="dialog" + aria-modal="true" +
 *       an accessible name (aria-labelledby pointing at a real id).
 *   A3. Icon-only close buttons carry an aria-label.
 *   A4. The hook source implements Escape handling, a Tab focus trap,
 *       focus return on close, and the data-accessible-dialog marker.
 *   A5. The global reduced-motion rule targets accessible dialogs.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean): void {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAIL: ${name}`);
  }
}

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(SRC, rel), 'utf-8');
}

const PATCHED_DIALOGS = [
  'components/profile/ProfileEditModal.tsx',
  'components/application/CitizenConfirmationModal.tsx',
  'components/profile/ProfilePhotoModal.tsx',
];

async function run(): Promise<void> {
  const hook = read('components/common/useAccessibleDialog.ts');

  /* A1. Hook adoption */
  for (const file of PATCHED_DIALOGS) {
    const src = read(file);
    assert(
      `A1. ${file} uses useAccessibleDialog`,
      src.includes('useAccessibleDialog({ isOpen, onClose })') ||
        src.includes('useAccessibleDialog({'),
    );
    assert(`A1. ${file} imports the hook`, src.includes("from '../common/useAccessibleDialog'"));
    assert(`A1. ${file} attaches dialogRef`, src.includes('ref={dialogRef}'));
  }

  /* A2. Dialog semantics */
  for (const file of PATCHED_DIALOGS) {
    const src = read(file);
    assert(`A2. ${file} has role="dialog"`, src.includes('role="dialog"'));
    assert(`A2. ${file} has aria-modal`, src.includes('aria-modal="true"'));
    const labelledBy = src.match(/aria-labelledby="([^"]+)"/);
    assert(`A2. ${file} has aria-labelledby`, labelledBy !== null);
    if (labelledBy) {
      assert(
        `A2. ${file} labelledby target id exists`,
        src.includes(`id="${labelledBy[1]}"`),
      );
    }
  }

  /* A3. Close buttons labelled */
  assert(
    'A3. ProfileEditModal close button has aria-label',
    /aria-label=\{strings\.cancel\}/.test(read('components/profile/ProfileEditModal.tsx')),
  );
  assert(
    'A3. CitizenConfirmationModal close button has aria-label',
    /aria-label=\{t\('workspace\.cancelBtn'\)\}/.test(
      read('components/application/CitizenConfirmationModal.tsx'),
    ),
  );
  assert(
    'A3. ProfilePhotoModal close button has aria-label',
    /aria-label=\{strings\.cancel\}/.test(read('components/profile/ProfilePhotoModal.tsx')),
  );

  /* A4. Hook implements the required behaviors */
  assert('A4. hook handles Escape', hook.includes("e.key === 'Escape'"));
  assert('A4. hook traps Tab', hook.includes("e.key !== 'Tab'"));
  assert('A4. hook handles Shift+Tab wrap', hook.includes('e.shiftKey'));
  assert('A4. hook returns focus on close', hook.includes('previouslyFocusedRef'));
  assert('A4. hook focuses into the dialog on open', hook.includes('requestAnimationFrame'));
  assert('A4. hook marks data-accessible-dialog', hook.includes('data-accessible-dialog'));

  /* A5. Reduced-motion rule */
  const css = read('index.css');
  assert(
    'A5. reduced-motion rule targets accessible dialogs',
    css.includes('[data-accessible-dialog]') && css.includes('prefers-reduced-motion: reduce'),
  );

  console.log(`\n--- DIALOG ACCESSIBILITY: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('❌ FAIL: dialog a11y suite crashed', err);
  process.exitCode = 1;
});
