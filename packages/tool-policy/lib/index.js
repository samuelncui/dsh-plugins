/**
 * Deterministic allow/deny rules for tool calls.
 *
 * The rule table is evaluated on the `tools/pre-execute` waterfall before every
 * other listener. A matching `allow` short-circuits the pipeline — later policy,
 * including model-based review, never runs for that call. A matching `deny`
 * fails the call with a model-visible reason. A call no rule covers is delegated
 * to the rest of the pipeline unchanged.
 *
 * @module @samuelncui/dsh-tool-policy
 */
import z from '@deepseek-ai/schemastery'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'tool-policy'

/** Host services required before the rules can be installed. */
export const inject = ['tools']

/** Runtime configuration schema for the rule table. */
export const Config = z.object({
  rules: z
    .array(
      z.object({
        action: z.union(['allow', 'deny']).default('deny'),
        tools: z.array(z.string()).default([]),
        commandPrefixes: z.array(z.string()).default([]),
        commandPatterns: z.array(z.string()).default([]),
        reason: z.string().default(''),
      }),
    )
    .default([]),
})

/**
 * Resolve one configured rule into its matching form.
 *
 * Regular expressions are compiled once at mount so a malformed pattern fails
 * the plugin instead of a live tool call.
 *
 * @param rule - one configured rule.
 * @param index - position of the rule in the table, for diagnostics.
 * @returns the compiled rule.
 */
function compile(rule, index) {
  return {
    ...rule,
    index,
    patterns: rule.commandPatterns.map((source, at) => {
      try {
        return new RegExp(source)
      } catch (error) {
        throw new Error(
          `tool-policy: rules[${index}].commandPatterns[${at}] is not a valid regular expression: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }),
  }
}

/**
 * Read the single string command a shell call carries.
 *
 * @param exec - the pending tool execution.
 * @returns the command text, or `undefined` when this call has none.
 */
function commandOf(exec) {
  const args = exec.arguments
  if (typeof args !== 'object' || args === null) return undefined
  return typeof args.command === 'string' ? args.command : undefined
}

/**
 * Whether one compiled rule covers this call.
 *
 * A rule with no `tools` entry matches every call. Command matchers only apply
 * to calls that carry a string `command`, so a shell-only rule never matches a
 * file tool by accident.
 *
 * @param rule - the compiled rule.
 * @param exec - the pending tool execution.
 * @returns whether the rule decides this call.
 */
function covers(rule, exec) {
  if (rule.tools.length > 0 && !rule.tools.includes(exec.name)) return false
  const needsCommand = rule.commandPrefixes.length > 0 || rule.patterns.length > 0
  if (!needsCommand) return true
  const command = commandOf(exec)
  if (command === undefined) return false
  if (rule.commandPrefixes.length > 0 && !rule.commandPrefixes.some((prefix) => command.startsWith(prefix))) return false
  if (rule.patterns.length > 0 && !rule.patterns.some((pattern) => pattern.test(command))) return false
  return true
}

/**
 * Install the rule table on the pre-execute waterfall.
 *
 * @param ctx - the plugin context.
 * @param config - validated plugin configuration.
 */
export function apply(ctx, config) {
  const rules = config.rules.map(compile)
  if (rules.length === 0) return
  ctx.on(
    'tools/pre-execute',
    async (exec, next) => {
      for (const rule of rules) {
        if (!covers(rule, exec)) continue
        if (rule.action === 'allow') return { kind: 'allow' }
        return {
          kind: 'deny',
          reason: rule.reason === '' ? `tool-policy: "${exec.name}" is blocked by rules[${rule.index}]` : rule.reason,
        }
      }
      return next()
    },
    { prepend: true },
  )
}
