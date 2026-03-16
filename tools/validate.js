#!/usr/bin/env node
/**
 * @cssm/validator — Reference manifest validator
 * Usage: node validate.js <path-to-manifest.json>
 *
 * In production this would validate the full .cssm ZIP bundle.
 * This script validates manifest.json directly for development.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

// ─── Load schema ─────────────────────────────────────────────────────────────

const schemaPath = resolve('./schema/1.0.0/manifest.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

// ─── Set up AJV ──────────────────────────────────────────────────────────────

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  allowUnionTypes: true,
});
addFormats(ajv);

// Remove the $id so AJV doesn't try to fetch it remotely
const { $id, ...schemaWithoutId } = schema;
const validate = ajv.compile(schemaWithoutId);

// ─── Business-logic checks (beyond JSON Schema) ───────────────────────────────

function runBusinessRules(manifest) {
  const errors = [];
  const warnings = [];

  // Rule 1: requiresJS must be false
  if (manifest.technical?.requiresJS === true) {
    errors.push({
      field: 'technical.requiresJS',
      message: 'requiresJS MUST be false. A .cssm animation must not depend on JavaScript.',
    });
  }

  // Rule 2: if reducedMotionBehavior is "none", autoplayNote is required
  if (
    manifest.accessibility?.reducedMotionBehavior === 'none' &&
    !manifest.accessibility?.autoplayNote
  ) {
    errors.push({
      field: 'accessibility.autoplayNote',
      message:
        'autoplayNote is required when reducedMotionBehavior is "none". Explain why this animation is essential.',
    });
  }

  // Rule 3: if reducedMotionBehavior is "reduced", reducedMotionFile must be set
  if (
    manifest.accessibility?.reducedMotionBehavior === 'reduced' &&
    !manifest.accessibility?.reducedMotionFile
  ) {
    errors.push({
      field: 'accessibility.reducedMotionFile',
      message:
        'reducedMotionFile must be set when reducedMotionBehavior is "reduced".',
    });
  }

  // Rule 4: all token names must start with --cssm-
  const tokens = manifest.theming?.tokens || [];
  for (const token of tokens) {
    if (!token.name.startsWith('--cssm-')) {
      errors.push({
        field: `theming.tokens[${token.name}].name`,
        message: `Token name "${token.name}" must start with "--cssm-" to prevent collisions with host page variables.`,
      });
    }
  }

  // Rule 5: scroll-driven flag consistency
  if (
    manifest.technical?.scrollDriven === true &&
    !manifest.technical?.cssFeatures?.includes('animation-timeline')
  ) {
    warnings.push({
      field: 'technical.cssFeatures',
      message:
        'scrollDriven is true but "animation-timeline" is not listed in cssFeatures. Add it so the player can check browser support.',
    });
  }

  // Rule 6: if seizureRisk is true, wcagLevel should not be AA or AAA
  if (
    manifest.accessibility?.seizureRisk === true &&
    ['AA', 'AAA'].includes(manifest.accessibility?.wcagLevel)
  ) {
    warnings.push({
      field: 'accessibility.wcagLevel',
      message:
        'seizureRisk is true but wcagLevel is set to AA/AAA. An animation with seizure risk cannot be WCAG AA compliant.',
    });
  }

  // Rule 7: duration should be 0 for scroll-driven animations
  if (
    manifest.playback?.triggers?.scroll === true &&
    manifest.playback?.duration > 0
  ) {
    warnings.push({
      field: 'playback.duration',
      message:
        'Scroll-driven animations (triggers.scroll = true) typically have duration: 0. The animation progress is driven by scroll position, not time.',
    });
  }

  return { errors, warnings };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const manifestPath = process.argv[2];

if (!manifestPath) {
  console.error('Usage: node validate.js <path-to-manifest.json>');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(resolve(manifestPath), 'utf-8'));
} catch (e) {
  console.error(`❌ Could not read or parse manifest: ${e.message}`);
  process.exit(1);
}

// JSON Schema validation
const valid = validate(manifest);
const schemaErrors = validate.errors || [];

// Business rule validation
const { errors: businessErrors, warnings } = runBusinessRules(manifest);

// ─── Output ───────────────────────────────────────────────────────────────────

const totalErrors = schemaErrors.length + businessErrors.length;

if (totalErrors === 0 && warnings.length === 0) {
  console.log(`\n✅ manifest.json is valid (specVersion: ${manifest.specVersion})\n`);
  process.exit(0);
}

if (schemaErrors.length > 0) {
  console.log(`\n❌ Schema validation errors (${schemaErrors.length}):\n`);
  for (const err of schemaErrors) {
    const field = err.instancePath || '(root)';
    console.log(`  • ${field}: ${err.message}`);
    if (err.params?.allowedValues) {
      console.log(`    Allowed values: ${err.params.allowedValues.join(', ')}`);
    }
  }
}

if (businessErrors.length > 0) {
  console.log(`\n❌ Business rule errors (${businessErrors.length}):\n`);
  for (const err of businessErrors) {
    console.log(`  • ${err.field}: ${err.message}`);
  }
}

if (warnings.length > 0) {
  console.log(`\n⚠️  Warnings (${warnings.length}):\n`);
  for (const w of warnings) {
    console.log(`  • ${w.field}: ${w.message}`);
  }
}

if (totalErrors > 0) {
  console.log(`\n❌ Validation failed with ${totalErrors} error(s).\n`);
  process.exit(1);
} else {
  console.log(`\n✅ Valid with ${warnings.length} warning(s).\n`);
  process.exit(0);
}
