export type Severity = 'off' | 'info' | 'warning' | 'error';

export type RuleSettingObject =
  | { severity: Severity; options?: Record<string, unknown> }
  | { severity?: Severity; options: Record<string, unknown> };

export type RuleSetting = Severity | RuleSettingObject;
