
import { scrubPrivacy } from './privacyScrubber';
import * as Diff from 'diff';
import { DiffPart } from '../types';

export interface MergedResult {
  code: string;
  diff: DiffPart[];
}

/**
 * Enhanced Hybrid Merger: Structural Analysis & Security Prioritization
 * 
 * 1. Security-First Protocol: Local sanitization always overrides cloud placeholders.
 * 2. Segment Analysis: Pseudo-AST approach to separate imports, hooks, components, and exports.
 * 3. Synthesis: Wraps local logic within cloud-defined error boundaries and type safe skeletons.
 */
export function synthesizeHybridCode(cloudCode: string, localCode: string): MergedResult {
  // RULE 0: Privacy Scrubber Firewall (Immediate Sanitation)
  const safeCloud = scrubPrivacy(cloudCode || "");
  const safeLocal = scrubPrivacy(localCode || "");

  // Helper to extract segments (Pseudo-AST)
  const segments = {
    imports: (code: string): string[] => code.match(/^import.*;$/gm) || [],
    exports: (code: string): string[] => code.match(/^export.*;$/gm) || [],
    hooks: (code: string): string[] => code.match(/const\s+\[.*\]\s*=\s*useState\(.*\);/g) || [],
    // Extract everything between the first '{' and last '}' of a default export component
    body: (code: string): string => {
      const match = code.match(/export\s+default\s+function\s+\w+\s*\(.*\)\s*\{([\s\S]*)\}/);
      return match ? match[1].trim() : code.replace(/^import.*;$/gm, '').replace(/^export.*;$/gm, '').trim();
    }
  };

  const cloudParts = {
    imports: segments.imports(safeCloud),
    exports: segments.exports(safeCloud),
    body: segments.body(safeCloud)
  };

  const localParts = {
    imports: segments.imports(safeLocal),
    body: segments.body(safeLocal)
  };

  // RULE 1: Import Union (Deduplicated)
  const finalImports = Array.from(new Set([...cloudParts.imports, ...localParts.imports]));

  // RULE 2: Security Override & Structural Synthesis
  let mergedBody = cloudParts.body;

  // Pattern A: Error Boundary Wrapping
  // If cloud provided a try-catch block, inject local implementation into the core
  const hasTryCatch = /try\s*\{([\s\S]*?)\}\s*catch/.test(mergedBody);
  
  if (hasTryCatch && localParts.body.length > 10) {
     mergedBody = mergedBody.replace(
       /try\s*\{([\s\S]*?)\}\s*catch/,
       (match, cloudInterior) => {
         // Fix: Ensure localParts.body is treated as a string to avoid 'never' type inference
         const localBodyText: string = localParts.body;
         const isLocalSecured = localBodyText.includes('process.env') || localBodyText.includes('[REDACTED]');
         const interior = isLocalSecured ? `\n    // SECURITY-PRIORITIZED LOCAL LOGIC\n    ${localBodyText}\n  ` : cloudInterior;
         return `try {${interior}} catch`;
       }
     );
  } else if (localParts.body.includes('process.env') || localParts.body.includes('[REDACTED]')) {
    // RULE 3: Local Override for Security Patterns
    // If the local model produced heavily sanitized or performance-optimized code, swap it
    mergedBody = `// SECURITY OVERRIDE: Local sanitization prioritized\n${localParts.body}`;
  }

  // Final code reconstruction
  const finalCode = `${finalImports.join('\n')}\n\nexport default function App() {\n  ${mergedBody}\n}\n\n${cloudParts.exports.filter(e => !e.includes('default')).join('\n')}`;

  // Generate Visual Diff highlighting the Cloud's "Plan" vs the Hybrid "Reality"
  const diffData = Diff.diffLines(safeCloud, finalCode).map(part => ({
    value: part.value,
    added: part.added,
    removed: part.removed,
    origin: part.added ? ('local' as const) : (part.removed ? 'cloud' as const : 'merged' as const)
  }));

  return { 
    code: finalCode, 
    diff: diffData 
  };
}