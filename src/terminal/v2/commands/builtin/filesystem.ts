/**
 * Filesystem commands: ls, cd, cat, tree, head, tail, mkdir, rm, touch,
 * cp, mv, write, append, grep, find.
 *
 * Migrated from legacy commands/filesystem.ts. Path resolution uses the
 * new fs/paths helpers; mutations go through ctx.fs (FsOperations).
 */

import type { FSNode } from '../../types'
import type { CommandRegistry } from '../registry'
import { resolve, resolveAbsolute } from '../../fs'

/** Resolve a node against ctx. */
function rp(root: FSNode, cwd: string, target: string, env: Record<string, string>) {
  return resolve(root, cwd, target, env.HOME)
}

/** Resolve an absolute path string against ctx. */
function rps(cwd: string, target: string, env: Record<string, string>) {
  return resolveAbsolute(cwd, target, env.HOME)
}

export function registerFilesystemCommands(registry: CommandRegistry): void {
  // ── ls ──
  registry.register({
    name: 'ls',
    description: 'List directory contents',
    usage: 'ls [-la] [path]',
    handler: (ctx) => {
      let flags = ''
      let target = '.'
      for (const arg of ctx.args) {
        if (arg.startsWith('-') && arg.length > 1) flags += arg.slice(1)
        else target = arg
      }
      const showAll = flags.includes('a')
      const longFormat = flags.includes('l')
      const node = rp(ctx.root, ctx.cwd, target, ctx.env)
      if (!node) return [`ls: cannot access '${target}': No such file or directory`]
      if (node.type === 'file') {
        if (longFormat) {
          const size = (node.content || '').length
          return [`-rw-r--r--  1 researcher  researcher  ${String(size).padStart(6)}  ${node.name}`]
        }
        return [node.name]
      }
      if (!node.children || node.children.size === 0) return showAll ? ['.', '..'] : ['(empty)']
      let entries = [...node.children.values()]
      if (!showAll) entries = entries.filter((c) => !c.name.startsWith('.'))
      if (entries.length === 0 && !showAll) return ['(empty)']
      if (longFormat) {
        const lines: string[] = []
        if (showAll) {
          lines.push('drwxr-xr-x  2 researcher  researcher  4096  .')
          lines.push('drwxr-xr-x  2 researcher  researcher  4096  ..')
        }
        for (const child of entries) {
          if (child.type === 'dir') {
            lines.push(`drwxr-xr-x  2 researcher  researcher  4096  ${child.name}/`)
          } else {
            const size = (child.content || '').length
            lines.push(
              `-rw-r--r--  1 researcher  researcher  ${String(size).padStart(6)}  ${child.name}`,
            )
          }
        }
        return lines
      }
      const names = entries.map((c) => c.name + (c.type === 'dir' ? '/' : ''))
      if (showAll) names.unshift('.', '..')
      return [names.join('  ')]
    },
  })

  // ── cd ──
  registry.register({
    name: 'cd',
    description: 'Change the current directory',
    usage: 'cd [path|-]',
    handler: (ctx) => {
      const homeDir = ctx.env.HOME || '/home/researcher'
      if (ctx.args.length === 0) {
        ctx.setcwd(homeDir)
        return
      }
      const target = ctx.args[0]
      if (target === '-') {
        const prev = ctx.env.OLDPWD || homeDir
        const node = rp(ctx.root, '/', prev, ctx.env)
        if (!node || node.type !== 'dir') return [`cd: ${prev}: No such file or directory`]
        ctx.setcwd(prev)
        return [prev]
      }
      const node = rp(ctx.root, ctx.cwd, target, ctx.env)
      if (!node) return [`cd: ${target}: No such file or directory`]
      if (node.type !== 'dir') return [`cd: ${target}: Not a directory`]
      const newPath = rps(ctx.cwd, target, ctx.env)
      ctx.setenv('OLDPWD', ctx.cwd)
      ctx.setcwd(newPath)
    },
  })

  // ── cat ──
  registry.register({
    name: 'cat',
    description: 'Display file contents',
    usage: 'cat [file...]',
    handler: (ctx) => {
      if (ctx.args.length === 0) {
        if (ctx.stdin && ctx.stdin.length > 0) return ctx.stdin
        return ['cat: missing operand']
      }
      const lines: string[] = []
      for (const arg of ctx.args) {
        const node = rp(ctx.root, ctx.cwd, arg, ctx.env)
        if (!node) return [`cat: ${arg}: No such file or directory`]
        if (node.type === 'dir') return [`cat: ${arg}: Is a directory`]
        lines.push(...(node.content || '').split('\n'))
      }
      if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
      return lines
    },
  })

  // ── tree ──
  registry.register({
    name: 'tree',
    description: 'Display directory tree structure',
    usage: 'tree [path]',
    handler: (ctx) => {
      const target = ctx.args[0] || '.'
      const node = rp(ctx.root, ctx.cwd, target, ctx.env)
      if (!node) return [`tree: '${target}': No such file or directory`]
      if (node.type !== 'dir') return [node.name]

      const lines: string[] = []
      const dirName = target === '.' ? ctx.cwd : target
      lines.push(dirName)

      function walk(n: FSNode, prefix: string) {
        if (!n.children) return
        const entries = [...n.children.values()]
        entries.forEach((child, i) => {
          const isLast = i === entries.length - 1
          const connector = isLast ? '└── ' : '├── '
          const suffix = child.type === 'dir' ? '/' : ''
          lines.push(prefix + connector + child.name + suffix)
          if (child.type === 'dir') {
            walk(child, prefix + (isLast ? '    ' : '│   '))
          }
        })
      }

      walk(node, '')
      return lines
    },
  })

  // ── grep ──
  registry.register({
    name: 'grep',
    description: 'Search for a pattern in a file',
    usage: 'grep <pattern> [file]',
    handler: (ctx) => {
      if (ctx.args.length < 1) return ['Usage: grep <pattern> [file]']
      const pattern = ctx.args[0]
      let lines: string[]
      if (ctx.args.length >= 2) {
        const target = ctx.args[1]
        const node = rp(ctx.root, ctx.cwd, target, ctx.env)
        if (!node) return [`grep: ${target}: No such file or directory`]
        if (node.type === 'dir') return [`grep: ${target}: Is a directory`]
        lines = (node.content || '').split('\n')
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        lines = ctx.stdin
      } else {
        return ['Usage: grep <pattern> [file]']
      }
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const matches = lines.filter((line) => line.toLowerCase().includes(pattern.toLowerCase()))
      if (matches.length === 0) return [`(no matches for '${pattern}')`]
      return matches.map((line) =>
        line.replace(new RegExp(`(${escaped})`, 'gi'), `\x1b[1;31m$1\x1b[0m`),
      )
    },
  })

  // ── head ──
  registry.register({
    name: 'head',
    description: 'Display the first lines of a file',
    usage: 'head [-n N] [file]',
    handler: (ctx) => {
      let count = 10
      let fileArg: string | undefined
      for (let i = 0; i < ctx.args.length; i++) {
        if (ctx.args[i] === '-n' && i + 1 < ctx.args.length) {
          count = parseInt(ctx.args[i + 1], 10) || 10
          i++
        } else if (!ctx.args[i].startsWith('-')) {
          fileArg = ctx.args[i]
        }
      }
      let lines: string[]
      if (fileArg) {
        const node = rp(ctx.root, ctx.cwd, fileArg, ctx.env)
        if (!node) return [`head: ${fileArg}: No such file or directory`]
        if (node.type === 'dir') return [`head: ${fileArg}: Is a directory`]
        lines = (node.content || '').split('\n')
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        lines = ctx.stdin
      } else {
        return ['head: missing operand']
      }
      return lines.slice(0, count)
    },
  })

  // ── tail ──
  registry.register({
    name: 'tail',
    description: 'Display the last lines of a file',
    usage: 'tail [-n N] [file]',
    handler: (ctx) => {
      let count = 10
      let fileArg: string | undefined
      for (let i = 0; i < ctx.args.length; i++) {
        if (ctx.args[i] === '-n' && i + 1 < ctx.args.length) {
          count = parseInt(ctx.args[i + 1], 10) || 10
          i++
        } else if (!ctx.args[i].startsWith('-')) {
          fileArg = ctx.args[i]
        }
      }
      let lines: string[]
      if (fileArg) {
        const node = rp(ctx.root, ctx.cwd, fileArg, ctx.env)
        if (!node) return [`tail: ${fileArg}: No such file or directory`]
        if (node.type === 'dir') return [`tail: ${fileArg}: Is a directory`]
        lines = (node.content || '').split('\n')
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        lines = ctx.stdin
      } else {
        return ['tail: missing operand']
      }
      return lines.slice(-count)
    },
  })

  // ── mkdir ──
  registry.register({
    name: 'mkdir',
    description: 'Create a new directory',
    usage: 'mkdir [-p] <name>',
    handler: (ctx) => {
      let parents = false
      const targets: string[] = []
      for (const arg of ctx.args) {
        if (arg === '-p') parents = true
        else targets.push(arg)
      }
      if (targets.length === 0) return ['mkdir: missing operand']
      const errors: string[] = []
      for (const target of targets) {
        if (parents) {
          const parts = target.split('/').filter(Boolean)
          let current = target.startsWith('/') ? '' : '.'
          for (const part of parts) {
            current = current ? `${current}/${part}` : part
            const error = ctx.fs.mkdir(current)
            if (error && !error.includes('File exists')) {
              errors.push(error)
              break
            }
          }
        } else {
          const error = ctx.fs.mkdir(target)
          if (error) errors.push(error)
        }
      }
      if (errors.length > 0) return errors
      ctx.onMutate()
      return []
    },
  })

  // ── rm ──
  registry.register({
    name: 'rm',
    description: 'Remove a file or directory',
    usage: 'rm [-rf] <file>',
    handler: (ctx) => {
      let recursive = false
      const targets: string[] = []
      for (const arg of ctx.args) {
        if (arg.startsWith('-')) {
          if (arg.includes('r')) recursive = true
        } else {
          targets.push(arg)
        }
      }
      if (targets.length === 0) return ['rm: missing operand']
      const errors: string[] = []
      for (const target of targets) {
        const error = recursive ? ctx.fs.rmrf(target) : ctx.fs.rm(target)
        if (error) errors.push(error)
      }
      if (errors.length > 0) return errors
      ctx.onMutate()
      return []
    },
  })

  // ── touch ──
  registry.register({
    name: 'touch',
    description: 'Create an empty file',
    usage: 'touch <file>',
    handler: (ctx) => {
      if (ctx.args.length === 0) return ['touch: missing operand']
      const target = ctx.args[0]
      const error = ctx.fs.touch(target)
      if (error) return [error]
      ctx.onMutate()
      return []
    },
  })

  // ── cp ──
  registry.register({
    name: 'cp',
    description: 'Copy a file or directory',
    usage: 'cp <source> <dest>',
    handler: (ctx) => {
      if (ctx.args.length < 2) return ['cp: missing operand', 'Usage: cp <source> <dest>']
      const error = ctx.fs.copy(ctx.args[0], ctx.args[1])
      if (error) return [error]
      ctx.onMutate()
      return []
    },
  })

  // ── mv ──
  registry.register({
    name: 'mv',
    description: 'Move or rename a file or directory',
    usage: 'mv <source> <dest>',
    handler: (ctx) => {
      if (ctx.args.length < 2) return ['mv: missing operand', 'Usage: mv <source> <dest>']
      const error = ctx.fs.move(ctx.args[0], ctx.args[1])
      if (error) return [error]
      ctx.onMutate()
      return []
    },
  })

  // ── write ──
  registry.register({
    name: 'write',
    description: 'Write content to a file (create or overwrite)',
    usage: 'write <file> <content>',
    handler: (ctx) => {
      if (ctx.args.length < 1) return ['write: missing operand', 'Usage: write <file> <content>']
      const file = ctx.args[0]
      let content: string
      if (ctx.args.length > 1) {
        content = ctx.args.slice(1).join(' ')
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        content = ctx.stdin.join('\n')
      } else {
        return ['write: missing content']
      }
      const error = ctx.fs.writeFile(file, content + '\n')
      if (error) return [error]
      ctx.onMutate()
      return []
    },
  })

  // ── append ──
  registry.register({
    name: 'append',
    description: 'Append content to a file',
    usage: 'append <file> <content>',
    handler: (ctx) => {
      if (ctx.args.length < 1) return ['append: missing operand', 'Usage: append <file> <content>']
      const file = ctx.args[0]
      let content: string
      if (ctx.args.length > 1) {
        content = ctx.args.slice(1).join(' ')
      } else if (ctx.stdin && ctx.stdin.length > 0) {
        content = ctx.stdin.join('\n')
      } else {
        return ['append: missing content']
      }
      const error = ctx.fs.appendFile(file, content + '\n')
      if (error) return [error]
      ctx.onMutate()
      return []
    },
  })

  // ── find ──
  registry.register({
    name: 'find',
    description: 'Find files by name pattern',
    usage: 'find [path] -name <pattern>',
    handler: (ctx) => {
      let searchPath = '.'
      let pattern = ''
      for (let i = 0; i < ctx.args.length; i++) {
        if (ctx.args[i] === '-name' && i + 1 < ctx.args.length) {
          pattern = ctx.args[i + 1]
          i++
        } else if (!ctx.args[i].startsWith('-')) {
          searchPath = ctx.args[i]
        }
      }
      if (!pattern) return ['find: missing -name pattern']
      const node = rp(ctx.root, ctx.cwd, searchPath, ctx.env)
      if (!node) return [`find: '${searchPath}': No such file or directory`]
      if (node.type !== 'dir') return [searchPath]
      const results: string[] = []
      const globRegex = new RegExp(
        '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
      )
      function walk(n: FSNode, path: string) {
        if (!n.children) return
        for (const [name, child] of n.children) {
          const childPath = path === '/' ? `/${name}` : `${path}/${name}`
          if (globRegex.test(name)) results.push(childPath)
          if (child.type === 'dir') walk(child, childPath)
        }
      }
      walk(node, searchPath === '.' ? '' : searchPath)
      return results.length > 0 ? results : ['(no matches)']
    },
  })
}
