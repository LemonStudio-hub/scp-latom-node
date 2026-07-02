/**
 * Text processing commands: wc, sort, uniq, diff, rev, nl, tr, cut,
 * fmt, fold, strings, yes, tee, seq.
 *
 * Migrated from legacy commands/text-tools.ts.
 */

import type { FSNode } from '../../types'
import type { CommandRegistry } from '../registry'
import { resolve } from '../../fs'

function rp(root: FSNode, cwd: string, target: string, env: Record<string, string>) {
  return resolve(root, cwd, target, env.HOME)
}

export function registerTextCommands(registry: CommandRegistry): void {
  // ── wc ──
  registry.register({
    name: 'wc',
    description: 'Count lines, words, and characters in a file',
    usage: 'wc [file]',
    handler: (ctx) => {
      let content: string
      let label: string
      if (ctx.args.length > 0) {
        const target = ctx.args[0]
        const node = rp(ctx.root, ctx.cwd, target, ctx.env)
        if (!node) return [`wc: ${target}: No such file or directory`]
        if (node.type === 'dir') return [`wc: ${target}: Is a directory`]
        content = node.content || ''
        label = target
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        content = ctx.stdin.join('\n')
        label = ''
      } else {
        return ['wc: missing operand']
      }
      const lines = content.split('\n').length
      const words = content.split(/\s+/).filter(Boolean).length
      const chars = content.length
      return [`  ${lines}  ${words}  ${chars} ${label}`]
    },
  })

  // ── sort ──
  registry.register({
    name: 'sort',
    description: 'Sort lines of a file',
    usage: 'sort [-r] [file]',
    handler: (ctx) => {
      let reverse = false
      let fileArg = ''
      for (const arg of ctx.args) {
        if (arg === '-r') reverse = true
        else if (!arg.startsWith('-') && !fileArg) fileArg = arg
      }
      let lines: string[]
      if (fileArg) {
        const node = rp(ctx.root, ctx.cwd, fileArg, ctx.env)
        if (!node) return [`sort: ${fileArg}: No such file or directory`]
        if (node.type === 'dir') return [`sort: ${fileArg}: Is a directory`]
        lines = (node.content || '').split('\n')
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        lines = ctx.stdin
      } else {
        return ['sort: missing operand']
      }
      const sorted = [...lines].sort((a, b) => a.localeCompare(b))
      if (reverse) sorted.reverse()
      return sorted
    },
  })

  // ── uniq ──
  registry.register({
    name: 'uniq',
    description: 'Filter duplicate lines',
    usage: 'uniq [-c] [file]',
    handler: (ctx) => {
      let countMode = false
      let fileArg = ''
      for (const arg of ctx.args) {
        if (arg === '-c') countMode = true
        else if (!arg.startsWith('-') && !fileArg) fileArg = arg
      }
      let lines: string[]
      if (fileArg) {
        const node = rp(ctx.root, ctx.cwd, fileArg, ctx.env)
        if (!node) return [`uniq: ${fileArg}: No such file or directory`]
        if (node.type === 'dir') return [`uniq: ${fileArg}: Is a directory`]
        lines = (node.content || '').split('\n')
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        lines = ctx.stdin
      } else {
        return ['uniq: missing operand']
      }
      if (lines.length === 0) return []
      const result: string[] = []
      let prev = lines[0]
      let count = 1
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === prev) {
          count++
        } else {
          result.push(countMode ? `  ${String(count).padStart(4)}  ${prev}` : prev)
          prev = lines[i]
          count = 1
        }
      }
      result.push(countMode ? `  ${String(count).padStart(4)}  ${prev}` : prev)
      return result
    },
  })

  // ── diff ──
  registry.register({
    name: 'diff',
    description: 'Compare two files',
    usage: 'diff <file1> <file2>',
    handler: (ctx) => {
      if (ctx.args.length < 2) return ['diff: missing operand']
      const node1 = rp(ctx.root, ctx.cwd, ctx.args[0], ctx.env)
      if (!node1) return [`diff: ${ctx.args[0]}: No such file or directory`]
      if (node1.type === 'dir') return [`diff: ${ctx.args[0]}: Is a directory`]
      const node2 = rp(ctx.root, ctx.cwd, ctx.args[1], ctx.env)
      if (!node2) return [`diff: ${ctx.args[1]}: No such file or directory`]
      if (node2.type === 'dir') return [`diff: ${ctx.args[1]}: Is a directory`]
      const lines1 = (node1.content || '').split('\n')
      const lines2 = (node2.content || '').split('\n')
      const result: string[] = []
      const maxLen = Math.max(lines1.length, lines2.length)
      for (let i = 0; i < maxLen; i++) {
        const a = lines1[i] ?? ''
        const b = lines2[i] ?? ''
        if (a !== b) {
          result.push(`${i + 1}c${i + 1}`)
          result.push(`< ${a}`)
          result.push('---')
          result.push(`> ${b}`)
        }
      }
      return result.length > 0 ? result : ['(files are identical)']
    },
  })

  // ── rev ──
  registry.register({
    name: 'rev',
    description: 'Reverse lines of a file',
    usage: 'rev [file]',
    handler: (ctx) => {
      let lines: string[]
      if (ctx.args.length > 0) {
        const node = rp(ctx.root, ctx.cwd, ctx.args[0], ctx.env)
        if (!node) return [`rev: ${ctx.args[0]}: No such file or directory`]
        if (node.type === 'dir') return [`rev: ${ctx.args[0]}: Is a directory`]
        lines = (node.content || '').split('\n')
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        lines = ctx.stdin
      } else {
        return ['rev: missing operand']
      }
      return lines.map((line) => line.split('').reverse().join(''))
    },
  })

  // ── nl ──
  registry.register({
    name: 'nl',
    description: 'Number lines of a file',
    usage: 'nl [file]',
    handler: (ctx) => {
      let lines: string[]
      if (ctx.args.length > 0) {
        const node = rp(ctx.root, ctx.cwd, ctx.args[0], ctx.env)
        if (!node) return [`nl: ${ctx.args[0]}: No such file or directory`]
        if (node.type === 'dir') return [`nl: ${ctx.args[0]}: Is a directory`]
        lines = (node.content || '').split('\n')
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        lines = ctx.stdin
      } else {
        return ['nl: missing operand']
      }
      return lines.map((line, i) => `  ${String(i + 1).padStart(4)}  ${line}`)
    },
  })

  // ── tr ──
  registry.register({
    name: 'tr',
    description: 'Translate or squeeze characters',
    usage: 'tr <from> <to> [text] | cmd | tr <from> <to>',
    handler: (ctx) => {
      if (ctx.args.length < 2) return ['Usage: tr <from> <to> [text]']
      const from = ctx.args[0]
      const to = ctx.args[1]
      let lines: string[]
      const text = ctx.args.slice(2).join(' ')
      if (text) {
        lines = [text]
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        lines = ctx.stdin
      } else {
        return ['tr: missing input text']
      }
      return lines.map((line) => {
        let result = ''
        for (const ch of line) {
          const idx = from.indexOf(ch)
          result += idx >= 0 ? (to[idx] ?? '') : ch
        }
        return result
      })
    },
  })

  // ── cut ──
  registry.register({
    name: 'cut',
    description: 'Extract fields from lines',
    usage: 'cut -d <delim> -f <field> [file]',
    handler: (ctx) => {
      let delim = '\t'
      let field = 1
      let fileArg = ''
      for (let i = 0; i < ctx.args.length; i++) {
        if (ctx.args[i] === '-d' && i + 1 < ctx.args.length) {
          delim = ctx.args[i + 1]
          i++
        } else if (ctx.args[i] === '-f' && i + 1 < ctx.args.length) {
          field = parseInt(ctx.args[i + 1], 10) || 1
          i++
        } else if (!ctx.args[i].startsWith('-') && !fileArg) fileArg = ctx.args[i]
      }
      let lines: string[]
      if (fileArg) {
        const node = rp(ctx.root, ctx.cwd, fileArg, ctx.env)
        if (!node) return [`cut: ${fileArg}: No such file or directory`]
        if (node.type === 'dir') return [`cut: ${fileArg}: Is a directory`]
        lines = (node.content || '').split('\n')
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        lines = ctx.stdin
      } else {
        return ['cut: missing operand']
      }
      return lines.map((line) => {
        const fields = line.split(delim)
        return fields[field - 1] ?? ''
      })
    },
  })

  // ── fmt ──
  registry.register({
    name: 'fmt',
    description: 'Format text to specified width',
    usage: 'fmt [-w WIDTH] [file]',
    handler: (ctx) => {
      let width = 75
      let fileArg = ''
      for (let i = 0; i < ctx.args.length; i++) {
        if (ctx.args[i] === '-w' && i + 1 < ctx.args.length) {
          width = parseInt(ctx.args[i + 1], 10) || 75
          i++
        } else if (!ctx.args[i].startsWith('-') && !fileArg) fileArg = ctx.args[i]
      }
      let content: string
      if (fileArg) {
        const node = rp(ctx.root, ctx.cwd, fileArg, ctx.env)
        if (!node) return [`fmt: ${fileArg}: No such file or directory`]
        if (node.type === 'dir') return [`fmt: ${fileArg}: Is a directory`]
        content = node.content || ''
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        content = ctx.stdin.join('\n')
      } else {
        return ['fmt: missing operand']
      }
      const paragraphs = content.split(/\n\n+/)
      const result: string[] = []
      for (const para of paragraphs) {
        const words = para.split(/\s+/).filter(Boolean)
        let line = ''
        for (const word of words) {
          if (line.length + word.length + 1 > width && line.length > 0) {
            result.push(line)
            line = word
          } else {
            line = line ? `${line} ${word}` : word
          }
        }
        if (line) result.push(line)
        result.push('')
      }
      return result
    },
  })

  // ── seq ──
  registry.register({
    name: 'seq',
    description: 'Generate a sequence of numbers',
    usage: 'seq <last> | <first> <last> | <first> <step> <last>',
    handler: (ctx) => {
      if (ctx.args.length === 0) return ['seq: missing operand']
      let start = 1,
        step = 1,
        end: number
      if (ctx.args.length === 1) {
        end = parseInt(ctx.args[0], 10)
        if (isNaN(end)) return ['seq: invalid number']
      } else if (ctx.args.length === 2) {
        start = parseInt(ctx.args[0], 10)
        end = parseInt(ctx.args[1], 10)
        if (isNaN(start) || isNaN(end)) return ['seq: invalid number']
      } else {
        start = parseInt(ctx.args[0], 10)
        step = parseInt(ctx.args[1], 10)
        end = parseInt(ctx.args[2], 10)
        if (isNaN(start) || isNaN(step) || isNaN(end)) return ['seq: invalid number']
      }
      if (step === 0) return ['seq: step must not be zero']
      const result: string[] = []
      if (step > 0) {
        for (let i = start; i <= end; i += step) result.push(String(i))
      } else {
        for (let i = start; i >= end; i += step) result.push(String(i))
      }
      return result
    },
  })

  // ── yes ──
  registry.register({
    name: 'yes',
    description: 'Repeatedly output a string (limited)',
    usage: 'yes [text]',
    handler: (ctx) => {
      const text = ctx.args.length > 0 ? ctx.args.join(' ') : 'y'
      return Array(20).fill(text)
    },
  })

  // ── tee ──
  registry.register({
    name: 'tee',
    description: 'Pass stdin through while displaying it',
    usage: 'tee [text]',
    handler: (ctx) => {
      if (ctx.stdin && ctx.stdin.length > 0) return ctx.stdin
      if (ctx.args.length > 0) return [ctx.args.join(' ')]
      return ['tee: missing operand']
    },
  })

  // ── strings ──
  registry.register({
    name: 'strings',
    description: 'Print printable strings from a file',
    usage: 'strings [file]',
    handler: (ctx) => {
      let content: string
      if (ctx.args.length > 0) {
        const node = rp(ctx.root, ctx.cwd, ctx.args[0], ctx.env)
        if (!node) return [`strings: ${ctx.args[0]}: No such file or directory`]
        if (node.type === 'dir') return [`strings: ${ctx.args[0]}: Is a directory`]
        content = node.content || ''
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        content = ctx.stdin.join('\n')
      } else {
        return ['strings: missing operand']
      }
      const strings = content.match(/[\x20-\x7E]{4,}/g)
      return strings || ['(no printable strings found)']
    },
  })

  // ── fold ──
  registry.register({
    name: 'fold',
    description: 'Wrap lines to specified width',
    usage: 'fold [-w WIDTH] [file]',
    handler: (ctx) => {
      let width = 80
      let fileArg = ''
      for (let i = 0; i < ctx.args.length; i++) {
        if (ctx.args[i] === '-w' && i + 1 < ctx.args.length) {
          width = parseInt(ctx.args[i + 1], 10) || 80
          i++
        } else if (!ctx.args[i].startsWith('-') && !fileArg) fileArg = ctx.args[i]
      }
      let inputLines: string[]
      if (fileArg) {
        const node = rp(ctx.root, ctx.cwd, fileArg, ctx.env)
        if (!node) return [`fold: ${fileArg}: No such file or directory`]
        if (node.type === 'dir') return [`fold: ${fileArg}: Is a directory`]
        inputLines = (node.content || '').split('\n')
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        inputLines = ctx.stdin
      } else {
        return ['fold: missing operand']
      }
      const result: string[] = []
      for (const line of inputLines) {
        if (line.length <= width) {
          result.push(line)
        } else {
          for (let i = 0; i < line.length; i += width) {
            result.push(line.slice(i, i + width))
          }
        }
      }
      return result
    },
  })
}
