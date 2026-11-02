/**
 * Start every new session on a chosen permission preset.
 *
 * A permission preset such as Auto review cannot be a deployment default: it
 * exists only while its integration is live and is intentionally absent from the
 * `permission` settings schema. This plugin applies it per session instead, at
 * creation, and only to genuinely new sessions — a restored, forked, or already
 * configured session is never rewritten.
 *
 * @module @samuelncui/dsh-permission-default
 */
import z from '@deepseek-ai/schemastery'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'permission-default'

/** Host services required before the plugin can switch a new session. */
export const inject = ['permissionPresets', 'sessions']

/** Runtime configuration schema. */
export const Config = z.object({
  preset: z.string().default('auto'),
  subagents: z.boolean().default(false),
})

/**
 * Events that mean a session already carries permission decisions.
 *
 * `permission-presets` pins a fresh session by appending exactly these events, so
 * their presence is its own definition of "not a new session": a restored log or
 * an inherited fork prefix always has at least one.
 */
const PERMISSION_FACTS = ['permission/preset', 'sandbox/mode', 'approval/policy', 'session/end-seed']

/**
 * Start new sessions on the configured preset.
 *
 * The listener prepends the `session/created` waterfall so it observes the log
 * before the permission service pins the deployment default; the switch itself
 * then records an explicit preset, which pinning keeps.
 *
 * @param ctx - the plugin context.
 * @param config - validated plugin configuration.
 */
export function apply(ctx, config) {
  ctx.on(
    'session/created',
    (session) => {
      if (!config.subagents && session.header.origin === 'subagent') return
      if (session.snapshotEvents().some((event) => PERMISSION_FACTS.includes(event.type))) return
      try {
        const available = ctx.permissionPresets.catalog().options.some((option) => option.value === config.preset)
        if (!available) return
        ctx.permissionPresets.set(session, config.preset)
      } catch (error) {
        ctx.logger.warn(
          `permission-default: cannot start a new session on "${config.preset}": ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    },
    { prepend: true },
  )
}
