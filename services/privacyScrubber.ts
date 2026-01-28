
const SENSITIVE_PATTERNS = {
  apiKeys: /(sk-[a-zA-Z0-9]{20,})|(AIza[0-9A-Za-z-_]{35})/g,
  secrets: /(password|secret|api_key|token|auth_token)\s*[:=]\s*["'][^"']+["']/gi,
  emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  paths: /([a-zA-Z]:\\(?:[^\\\/:*?"<>|\r\n]+\\)*[^\\\/:*?"<>|\r\n]*)|(\/(?:[\w.-]+\/)+[\w.-]+)/g
};

export function scrubPrivacy(code: string): string {
  let scrubbedCode = code;

  // 1. Replace API Keys with Environment Variables
  scrubbedCode = scrubbedCode.replace(SENSITIVE_PATTERNS.apiKeys, (match) => {
    return `process.env.VITE_AI_API_KEY /* REDACTED FOR PRIVACY */`;
  });

  // 2. Replace hardcoded secrets
  scrubbedCode = scrubbedCode.replace(SENSITIVE_PATTERNS.secrets, (match, key) => {
    const varName = key.toUpperCase().replace(/\s/g, '_');
    return `${key}: process.env.VITE_${varName}`;
  });

  // 3. Redact Emails
  scrubbedCode = scrubbedCode.replace(SENSITIVE_PATTERNS.emails, "[REDACTED_EMAIL]");

  return scrubbedCode;
}
