/**
 * Core shell commands: help, clear, pwd, whoami, hostname, date, echo,
 * uname, history, env, export, exit.
 *
 * Migrated from legacy commands/core.ts. The handler signatures are
 * unchanged except for the FsOperations surface moving under ctx.fs.
 */

import type { CommandRegistry } from '../registry'

export function registerCoreCommands(registry: CommandRegistry): void {
  // ── help ──
  registry.register({
    name: 'help',
    description: 'Display available commands or help for a specific command',
    usage: 'help [command]',
    handler: (ctx) => {
      if (ctx.args.length > 0) {
        const cmd = registry.get(ctx.args[0])
        if (!cmd) return [`help: no help found for '${ctx.args[0]}'`]
        return [`${ctx.args[0]} — ${cmd.description}`, `Usage: ${cmd.usage}`]
      }
      const lines = [
        '╔══════════════════════════════════════════════════════════╗',
        '║          SCP FOUNDATION TERMINAL — COMMANDS             ║',
        '╠══════════════════════════════════════════════════════════╣',
      ]
      const sorted = [...registry.names()].sort((a, b) => a.localeCompare(b))
      for (const name of sorted) {
        const cmd = registry.get(name)!
        lines.push(`║  ${name.padEnd(14)} ${cmd.description.slice(0, 40).padEnd(40)} ║`)
      }
      lines.push('╠══════════════════════════════════════════════════════════╣')
      lines.push('║  Type "help <command>" for detailed usage.              ║')
      lines.push('╚══════════════════════════════════════════════════════════╝')
      return lines
    },
  })

  // ── clear ──
  registry.register({
    name: 'clear',
    description: 'Clear the terminal screen',
    usage: 'clear',
    handler: (ctx) => {
      ctx.clear()
    },
  })

  // ── pwd ──
  registry.register({
    name: 'pwd',
    description: 'Print the current working directory',
    usage: 'pwd',
    handler: (ctx) => [ctx.cwd],
  })

  // ── whoami ──
  registry.register({
    name: 'whoami',
    description: 'Display the current user',
    usage: 'whoami',
    handler: () => ['researcher'],
  })

  // ── hostname ──
  registry.register({
    name: 'hostname',
    description: 'Display the system hostname',
    usage: 'hostname',
    handler: () => ['LATOM-7'],
  })

  // ── date ──
  registry.register({
    name: 'date',
    description: 'Display the current date and time',
    usage: 'date',
    handler: () => [new Date().toString()],
  })

  // ── echo ──
  registry.register({
    name: 'echo',
    description: 'Display text to the terminal',
    usage: 'echo [text...]',
    handler: (ctx) => {
      if (ctx.args.length === 0 && ctx.stdin && ctx.stdin.length > 0) return ctx.stdin
      return [ctx.args.join(' ')]
    },
  })

  // ── uname ──
  registry.register({
    name: 'uname',
    description: 'Print system information',
    usage: 'uname [-a]',
    handler: (ctx) => {
      if (ctx.args.includes('-a')) {
        return ['SCF-Linux LATOM-7 6.1.0-scf #1 SMP Foundation x86_64 GNU/Linux']
      }
      return ['SCF-Linux']
    },
  })

  // ── history ──
  registry.register({
    name: 'history',
    description: 'Display command history',
    usage: 'history',
    handler: (ctx) => {
      if (ctx.history.length === 0) return ['(no history)']
      return ctx.history.map((cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`)
    },
  })

  // ── env ──
  registry.register({
    name: 'env',
    description: 'Display environment variables',
    usage: 'env',
    handler: (ctx) => Object.entries(ctx.env).map(([k, v]) => `${k}=${v}`),
  })

  // ── export ──
  registry.register({
    name: 'export',
    description: 'Set an environment variable',
    usage: 'export KEY=VALUE',
    handler: (ctx) => {
      if (ctx.args.length === 0) {
        return Object.entries(ctx.env).map(([k, v]) => `declare -x ${k}="${v}"`)
      }
      const arg = ctx.args.join(' ')
      const eqIndex = arg.indexOf('=')
      if (eqIndex === -1) return [`export: invalid format. Usage: export KEY=VALUE`]
      const key = arg.slice(0, eqIndex)
      const value = arg.slice(eqIndex + 1)
      ctx.setenv(key, value)
    },
  })

  // ── exit ──
  registry.register({
    name: 'exit',
    description: 'Exit the terminal (navigates to home)',
    usage: 'exit',
    handler: () => ['logout', 'Session terminated. Secure. Contain. Protect.'],
  })
}
