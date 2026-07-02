/**
 * Builtin command behavior tests — mirrors legacy shell.test.ts coverage.
 */

import { describe, it, expect, vi } from 'vitest'
import { CommandRegistry } from '../commands/registry'
import { registerAllBuiltin } from '../commands/builtin'
import {
  createDefaultTree,
  resolve,
  resolveAbsolute,
  mkdir,
  mkfile,
  remove,
  write,
  deepClone,
  isProtected,
} from '../fs'
import type { CommandContext } from '../commands/types'
import type { FsOperations, FSNode } from '../types'

function readonlyFs(): FsOperations {
  const d = 'Permission denied (read-only filesystem)'
  return {
    mkdir: vi.fn(() => d),
    rm: vi.fn(() => d),
    touch: vi.fn(() => d),
    copy: vi.fn(() => d),
    move: vi.fn(() => d),
    rmrf: vi.fn(() => d),
    writeFile: vi.fn(() => d),
    appendFile: vi.fn(() => d),
  }
}

function workingFs(root: FSNode, cwd: string, env: Record<string, string>): FsOperations {
  function rfm(target: string) {
    const abs = resolveAbsolute(cwd, target, env.HOME)
    const ls = abs.lastIndexOf('/')
    const parent = ls <= 0 ? '/' : abs.slice(0, ls)
    const name = abs.slice(ls + 1)
    return { abs, name, parentNode: resolve(root, '/', parent, env.HOME) }
  }
  const denied = (n: string, op: string) =>
    `${op}: cannot ${op} '${n}': Permission denied (protected system path)`
  return {
    mkdir(t) {
      const { abs, name, parentNode } = rfm(t)
      if (isProtected(abs))
        return `mkdir: cannot create directory '${name}': Permission denied (protected system path)`
      if (!parentNode || parentNode.type !== 'dir')
        return `mkdir: cannot create directory '${t}': No such file or directory`
      if (parentNode.children?.has(name))
        return `mkdir: cannot create directory '${name}': File exists`
      return mkdir(parentNode, name)
        ? null
        : `mkdir: cannot create directory '${name}': Operation failed`
    },
    rm(t) {
      const { abs, name, parentNode } = rfm(t)
      if (isProtected(abs))
        return `rm: cannot remove '${name}': Permission denied (protected system path)`
      if (!parentNode || parentNode.type !== 'dir')
        return `rm: cannot remove '${t}': No such file or directory`
      const node = parentNode.children?.get(name)
      if (!node) return `rm: cannot remove '${t}': No such file or directory`
      if (node.type === 'dir' && node.children && node.children.size > 0)
        return `rm: cannot remove '${name}': Directory not empty`
      remove(parentNode, name)
      return null
    },
    touch(t) {
      const { abs, name, parentNode } = rfm(t)
      if (isProtected(abs))
        return `touch: cannot create '${name}': Permission denied (protected system path)`
      if (!parentNode || parentNode.type !== 'dir')
        return `touch: cannot create '${t}': No such file or directory`
      if (parentNode.children?.has(name)) return null
      return mkfile(parentNode, name) ? null : `touch: cannot create '${name}': Operation failed`
    },
    copy(s, d2) {
      const sp = resolveAbsolute(cwd, s, env.HOME)
      const sn = resolve(root, '/', sp, env.HOME)
      if (!sn) return `cp: cannot stat '${s}': No such file or directory`
      const dp = resolveAbsolute(cwd, d2, env.HOME)
      const dn = resolve(root, '/', dp, env.HOME)
      if (dn && dn.type === 'dir') {
        if (dn.children?.has(sn.name))
          return `cp: cannot copy '${s}': '${d2}/${sn.name}' already exists`
        dn.children!.set(sn.name, deepClone(sn))
        return null
      }
      const ls = dp.lastIndexOf('/')
      const p = ls <= 0 ? '/' : dp.slice(0, ls)
      const n = dp.slice(ls + 1)
      const pn = resolve(root, '/', p, env.HOME)
      if (!pn || pn.type !== 'dir') return `cp: cannot create '${d2}': No such file or directory`
      if (isProtected(dp))
        return `cp: cannot create '${n}': Permission denied (protected system path)`
      const c = deepClone(sn)
      c.name = n
      pn.children!.set(n, c)
      return null
    },
    move(s, d2) {
      const sp = resolveAbsolute(cwd, s, env.HOME)
      const ls = sp.lastIndexOf('/')
      const sp2 = ls <= 0 ? '/' : sp.slice(0, ls)
      const sn2 = sp.slice(ls + 1)
      const spn = resolve(root, '/', sp2, env.HOME)
      if (!spn || spn.type !== 'dir') return `mv: cannot stat '${s}': No such file or directory`
      const sn = spn.children?.get(sn2)
      if (!sn) return `mv: cannot stat '${s}': No such file or directory`
      if (isProtected(sp))
        return `mv: cannot move '${sn2}': Permission denied (protected system path)`
      const dp = resolveAbsolute(cwd, d2, env.HOME)
      const dn = resolve(root, '/', dp, env.HOME)
      if (dn && dn.type === 'dir') {
        if (dn.children?.has(sn2)) return `mv: cannot move '${s}': '${d2}/${sn2}' already exists`
        spn.children!.delete(sn2)
        dn.children!.set(sn2, sn)
        return null
      }
      const dls = dp.lastIndexOf('/')
      const dp2 = dls <= 0 ? '/' : dp.slice(0, dls)
      const dn2 = dp.slice(dls + 1)
      const dpn = resolve(root, '/', dp2, env.HOME)
      if (!dpn || dpn.type !== 'dir') return `mv: cannot move to '${d2}': No such file or directory`
      if (isProtected(dp))
        return `mv: cannot move to '${dn2}': Permission denied (protected system path)`
      spn.children!.delete(sn2)
      sn.name = dn2
      dpn.children!.set(dn2, sn)
      return null
    },
    rmrf(t) {
      const { abs, name, parentNode } = rfm(t)
      if (isProtected(abs))
        return `rm: cannot remove '${name}': Permission denied (protected system path)`
      if (!parentNode || parentNode.type !== 'dir')
        return `rm: cannot remove '${t}': No such file or directory`
      if (!parentNode.children?.get(name))
        return `rm: cannot remove '${t}': No such file or directory`
      remove(parentNode, name)
      return null
    },
    writeFile(t, content) {
      const { abs, name, parentNode } = rfm(t)
      if (isProtected(abs))
        return `write: cannot write '${name}': Permission denied (protected system path)`
      const ex = resolve(root, '/', abs, env.HOME)
      if (ex && ex.type === 'file') {
        write(ex, content)
        return null
      }
      if (!parentNode || parentNode.type !== 'dir')
        return `write: cannot create '${t}': No such file or directory`
      return mkfile(parentNode, name, content)
        ? null
        : `write: cannot create '${name}': Operation failed`
    },
    appendFile(t, content) {
      const abs = resolveAbsolute(cwd, t, env.HOME)
      if (isProtected(abs))
        return `append: cannot write '${t}': Permission denied (protected system path)`
      const n = resolve(root, '/', abs, env.HOME)
      if (n && n.type === 'file') {
        write(n, (n.content || '') + content)
        return null
      }
      const { name, parentNode } = rfm(t)
      if (!parentNode || parentNode.type !== 'dir')
        return `append: cannot create '${t}': No such file or directory`
      return mkfile(parentNode, name, content)
        ? null
        : `append: cannot create '${name}': Operation failed`
    },
  }
}

function makeRegistry(): CommandRegistry {
  const r = new CommandRegistry()
  registerAllBuiltin(r)
  return r
}

function makeCtx(o?: Partial<Omit<CommandContext, 'args'>>): Omit<CommandContext, 'args'> {
  return {
    cwd: '/home/researcher',
    root: createDefaultTree(),
    history: [],
    env: { USER: 'researcher', HOME: '/home/researcher', HOSTNAME: 'LATOM-7' },
    fs: readonlyFs(),
    setcwd: vi.fn(),
    setenv: vi.fn(),
    clear: vi.fn(),
    onMutate: vi.fn(),
    ...o,
  }
}

function makeWorkingCtx(o?: Partial<Omit<CommandContext, 'args'>>): Omit<CommandContext, 'args'> {
  const root = createDefaultTree()
  const cwd = o?.cwd ?? '/home/researcher'
  const env = o?.env ?? { USER: 'researcher', HOME: '/home/researcher', HOSTNAME: 'LATOM-7' }
  return {
    cwd,
    root,
    history: [],
    env,
    fs: workingFs(root, cwd, env),
    setcwd: vi.fn(),
    setenv: vi.fn(),
    clear: vi.fn(),
    onMutate: vi.fn(),
    ...o,
  }
}

const R = makeRegistry
const C = makeCtx
const WC = makeWorkingCtx

// ── core ──
describe('help', () => {
  it('lists all', async () => {
    expect((await R().execute('help', C())).join('\n')).toContain('SCP FOUNDATION TERMINAL')
  })
  it('help <cmd>', async () => {
    expect((await R().execute('help ls', C())).join('\n')).toContain('List directory contents')
  })
  it('unknown cmd', async () => {
    expect((await R().execute('help foobar', C())).join('\n')).toContain('no help found')
  })
})
describe('pwd', () => {
  it('ok', async () => {
    expect(await R().execute('pwd', C())).toEqual(['/home/researcher'])
  })
})
describe('whoami', () => {
  it('ok', async () => {
    expect(await R().execute('whoami', C())).toEqual(['researcher'])
  })
})
describe('hostname', () => {
  it('ok', async () => {
    expect(await R().execute('hostname', C())).toEqual(['LATOM-7'])
  })
})
describe('echo', () => {
  it('args', async () => {
    expect(await R().execute('echo hello world', C())).toEqual(['hello world'])
  })
  it('empty', async () => {
    expect(await R().execute('echo', C())).toEqual([''])
  })
})
describe('uname', () => {
  it('default', async () => {
    expect(await R().execute('uname', C())).toEqual(['SCF-Linux'])
  })
  it('-a', async () => {
    const o = await R().execute('uname -a', C())
    expect(o[0]).toContain('SCF-Linux')
    expect(o[0]).toContain('LATOM-7')
  })
})
describe('history', () => {
  it('empty', async () => {
    expect(await R().execute('history', C())).toEqual(['(no history)'])
  })
  it('has items', async () => {
    const o = await R().execute('history', C({ history: ['ls', 'pwd'] }))
    expect(o).toHaveLength(2)
  })
})
describe('env', () => {
  it('ok', async () => {
    expect((await R().execute('env', C())).join('\n')).toContain('USER=researcher')
  })
})

// ── filesystem ──
describe('ls', () => {
  it('root', async () => {
    const o = await R().execute('ls /', C({ cwd: '/' }))
    expect(o[0]).toContain('etc/')
    expect(o[0]).toContain('scp/')
  })
  it('cwd', async () => {
    expect((await R().execute('ls', C({ cwd: '/scp' })))[0]).toContain('scp-173.txt')
  })
  it('path', async () => {
    expect((await R().execute('ls /documents', C()))[0]).toContain('protocol-omega.txt')
  })
  it('missing', async () => {
    expect((await R().execute('ls /nope', C()))[0]).toContain('No such file or directory')
  })
})
describe('cd', () => {
  it('changes', async () => {
    const s = vi.fn()
    await R().execute('cd /scp', C({ setcwd: s }))
    expect(s).toHaveBeenCalledWith('/scp')
  })
  it('home', async () => {
    const s = vi.fn()
    await R().execute('cd', C({ setcwd: s }))
    expect(s).toHaveBeenCalledWith('/home/researcher')
  })
  it('missing', async () => {
    expect((await R().execute('cd /nope', C()))[0]).toContain('No such file or directory')
  })
  it('file', async () => {
    expect((await R().execute('cd /etc/hostname', C()))[0]).toContain('Not a directory')
  })
})
describe('cat', () => {
  it('ok', async () => {
    expect((await R().execute('cat /etc/hostname', C())).join('\n')).toContain('LATOM-7')
  })
  it('missing', async () => {
    expect((await R().execute('cat /nope', C()))[0]).toContain('No such file or directory')
  })
  it('dir', async () => {
    expect((await R().execute('cat /etc', C()))[0]).toContain('Is a directory')
  })
  it('no operand', async () => {
    expect((await R().execute('cat', C()))[0]).toContain('missing operand')
  })
})
describe('scp cmd', () => {
  it('lookup', async () => {
    const o = await R().execute('scp 173', C())
    expect(o.join('\n')).toContain('SCP-173')
    expect(o.join('\n')).toContain('Euclid')
  })
  it('pad', async () => {
    expect((await R().execute('scp 49', C())).join('\n')).toContain('SCP-049')
  })
  it('missing', async () => {
    expect((await R().execute('scp 9999', C())).join('\n')).toContain('FILE NOT FOUND')
  })
  it('usage', async () => {
    expect((await R().execute('scp', C())).join('\n')).toContain('Usage')
  })
})
describe('tree', () => {
  it('ok', async () => {
    const o = await R().execute('tree /etc', C())
    expect(o.join('\n')).toContain('hostname')
    expect(o.join('\n')).toContain('motd')
  })
  it('missing', async () => {
    expect((await R().execute('tree /nope', C()))[0]).toContain('No such file or directory')
  })
})
describe('wc', () => {
  it('ok', async () => {
    expect((await R().execute('wc /etc/hostname', C()))[0]).toContain('/etc/hostname')
  })
})
describe('head', () => {
  it('default', async () => {
    const o = await R().execute('head /logs/access.log', C())
    expect(o.length).toBeLessThanOrEqual(10)
    expect(o[0]).toContain('LOGIN')
  })
  it('-n', async () => {
    expect(await R().execute('head -n 2 /logs/access.log', C())).toHaveLength(2)
  })
})
describe('tail', () => {
  it('ok', async () => {
    expect((await R().execute('tail /logs/access.log', C())).length).toBeLessThanOrEqual(10)
  })
})
describe('neofetch', () => {
  it('ok', async () => {
    const o = await R().execute('neofetch', C())
    expect(o.join('\n')).toContain('LATOM-7')
    expect(o.join('\n')).toContain('Secure. Contain. Protect.')
  })
})
describe('about', () => {
  it('ok', async () => {
    expect((await R().execute('about', C())).join('\n')).toContain('SCP FOUNDATION')
  })
})

describe('read-only fs', () => {
  it('mkdir denied', async () => {
    expect((await R().execute('mkdir test', C()))[0]).toContain('Permission denied')
  })
  it('rm denied', async () => {
    expect((await R().execute('rm test', C()))[0]).toContain('Permission denied')
  })
  it('touch denied', async () => {
    expect((await R().execute('touch test', C()))[0]).toContain('Permission denied')
  })
})
describe('find', () => {
  it('ok', async () => {
    expect((await R().execute('find /etc -name hostname', C()))[0]).toContain('hostname')
  })
  it('no pattern', async () => {
    expect((await R().execute('find /etc', C()))[0]).toContain('missing -name pattern')
  })
  it('no matches', async () => {
    expect((await R().execute('find / -name nope', C()))[0]).toContain('no matches')
  })
  it('bad path', async () => {
    expect((await R().execute('find /nope -name t', C()))[0]).toContain('No such file or directory')
  })
})
describe('sort', () => {
  it('ok', async () => {
    expect((await R().execute('sort /etc/hostname', C())).length).toBeGreaterThan(0)
  })
  it('missing', async () => {
    expect((await R().execute('sort', C()))[0]).toContain('missing operand')
  })
  it('bad file', async () => {
    expect((await R().execute('sort /nope', C()))[0]).toContain('No such file or directory')
  })
})
describe('uniq', () => {
  it('ok', async () => {
    expect((await R().execute('uniq /etc/hostname', C())).length).toBeGreaterThan(0)
  })
  it('missing', async () => {
    expect((await R().execute('uniq', C()))[0]).toContain('missing operand')
  })
})
describe('diff', () => {
  it('identical', async () => {
    expect((await R().execute('diff /etc/hostname /etc/hostname', C()))[0]).toContain('identical')
  })
  it('differ', async () => {
    expect((await R().execute('diff /etc/hostname /etc/passwd', C())).length).toBeGreaterThan(0)
  })
  it('missing', async () => {
    expect((await R().execute('diff /etc/hostname', C()))[0]).toContain('missing operand')
  })
})
describe('nl', () => {
  it('ok', async () => {
    const o = await R().execute('nl /etc/hostname', C())
    expect(o[0]).toContain('1')
    expect(o[0]).toContain('LATOM-7')
  })
})
describe('tr', () => {
  it('ok', async () => {
    expect(await R().execute('tr abc xyz hello', C())).toEqual(['hello'])
  })
  it('usage', async () => {
    expect((await R().execute('tr', C()))[0]).toContain('Usage')
  })
})
describe('cut', () => {
  it('ok', async () => {
    expect((await R().execute('cut -d : -f 1 /etc/passwd', C()))[0]).toBe('root')
  })
})
describe('fmt', () => {
  it('ok', async () => {
    expect(
      (await R().execute('fmt -w 40 /documents/site-directive.txt', C())).length,
    ).toBeGreaterThan(0)
  })
})
describe('seq', () => {
  it('1 arg', async () => {
    expect(await R().execute('seq 5', C())).toEqual(['1', '2', '3', '4', '5'])
  })
  it('2 args', async () => {
    expect(await R().execute('seq 3 5', C())).toEqual(['3', '4', '5'])
  })
  it('3 args', async () => {
    expect(await R().execute('seq 0 2 10', C())).toEqual(['0', '2', '4', '6', '8', '10'])
  })
  it('missing', async () => {
    expect((await R().execute('seq', C()))[0]).toContain('missing operand')
  })
  it('invalid', async () => {
    expect((await R().execute('seq abc', C()))[0]).toContain('invalid number')
  })
})
describe('uptime', () => {
  it('ok', async () => {
    const o = await R().execute('uptime', C())
    expect(o[0]).toContain('up')
    expect(o[0]).toContain('user')
  })
})
describe('id', () => {
  it('researcher', async () => {
    const o = await R().execute('id researcher', C())
    expect(o[0]).toContain('uid=1000')
    expect(o[0]).toContain('researcher')
  })
  it('unknown', async () => {
    expect((await R().execute('id nope', C()))[0]).toContain('no such user')
  })
})
describe('ps', () => {
  it('ok', async () => {
    expect((await R().execute('ps', C()))[0]).toContain('PID')
  })
})
describe('free', () => {
  it('default', async () => {
    expect((await R().execute('free', C()))[0]).toContain('total')
  })
  it('-h', async () => {
    expect((await R().execute('free -h', C()))[1]).toContain('Mi')
  })
})
describe('df', () => {
  it('ok', async () => {
    expect((await R().execute('df', C()))[0]).toContain('Filesystem')
  })
})
describe('stat', () => {
  it('ok', async () => {
    const o = await R().execute('stat /etc/hostname', C())
    expect(o[0]).toContain('File:')
    expect(o[1]).toContain('Size:')
  })
})
describe('file', () => {
  it('file type', async () => {
    expect((await R().execute('file /etc/hostname', C()))[0]).toContain('ASCII text')
  })
  it('dir', async () => {
    expect((await R().execute('file /etc', C()))[0]).toContain('directory')
  })
})
describe('which', () => {
  it('builtin', async () => {
    expect((await R().execute('which ls', C()))[0]).toContain('shell built-in')
  })
  it('not found', async () => {
    expect((await R().execute('which nope', C()))[0]).toContain('not found')
  })
})
describe('man', () => {
  it('ok', async () => {
    const o = await R().execute('man ls', C())
    expect(o[0]).toContain('LS(1)')
    expect(o.join('\n')).toContain('List directory contents')
  })
  it('unknown', async () => {
    expect((await R().execute('man nope', C()))[0]).toContain('No manual entry')
  })
})
describe('classify', () => {
  it('cwd', async () => {
    expect((await R().execute('classify', C({ cwd: '/scp' })))[0]).toContain('CONFIDENTIAL')
  })
  it('path', async () => {
    expect((await R().execute('classify /documents', C()))[0]).toContain('RESTRICTED')
  })
})
describe('clearance', () => {
  it('researcher', async () => {
    expect((await R().execute('clearance researcher', C())).join('\n')).toContain('Level 4')
  })
  it('unknown', async () => {
    expect((await R().execute('clearance nope', C()))[0]).toContain('unknown user')
  })
})
describe('incident', () => {
  it('index', async () => {
    expect((await R().execute('incident', C())).join('\n')).toContain('INCIDENT REPORT INDEX')
  })
  it('specific', async () => {
    expect((await R().execute('incident IR-2024-0312', C())).join('\n')).toContain(
      'INCIDENT REPORT',
    )
  })
})
describe('protocol', () => {
  it('index', async () => {
    expect((await R().execute('protocol', C())).join('\n')).toContain('FOUNDATION PROTOCOLS')
  })
  it('specific', async () => {
    expect((await R().execute('protocol OMEGA-7', C())).join('\n')).toContain('PROTOCOL OMEGA-7')
  })
})
describe('status', () => {
  it('ok', async () => {
    const o = await R().execute('status', C())
    expect(o.join('\n')).toContain('LATOM-7 SYSTEM STATUS')
    expect(o.join('\n')).toContain('ONLINE')
  })
})
describe('audit', () => {
  it('ok', async () => {
    expect((await R().execute('audit', C())).join('\n')).toContain('AUDIT LOG')
  })
})
describe('alert', () => {
  it('ok', async () => {
    expect((await R().execute('alert', C())).join('\n')).toContain('ACTIVE ALERTS')
  })
})
describe('staff', () => {
  it('dir', async () => {
    expect((await R().execute('staff', C())).join('\n')).toContain('STAFF DIRECTORY')
  })
  it('specific', async () => {
    expect((await R().execute('staff researcher', C())).join('\n')).toContain('Dr. Researcher')
  })
})
describe('strings', () => {
  it('ok', async () => {
    expect((await R().execute('strings /etc/hostname', C())).length).toBeGreaterThan(0)
  })
})
describe('fold', () => {
  it('ok', async () => {
    expect(
      (await R().execute('fold -w 40 /documents/site-directive.txt', C())).length,
    ).toBeGreaterThan(0)
  })
})

// ── pipes ──
describe('pipes', () => {
  it('cat | cut', async () => {
    expect((await R().execute('cat /etc/passwd | cut -d : -f 1', C()))[0]).toBe('root')
  })
  it('cat | head', async () => {
    expect(await R().execute('cat /logs/access.log | head -n 2', C())).toHaveLength(2)
  })
})

// ── completion ──
describe('completion', () => {
  it('commands', () => {
    const c = R().complete('he', '/home/researcher', createDefaultTree())
    expect(c).toContain('help')
    expect(c).toContain('head')
  })
  it('paths', () => {
    expect(
      R().complete('cat /etc/hos', '/home/researcher', createDefaultTree(), '/home/researcher'),
    ).toContain('/etc/hostname')
  })
})

// ── mutations ──
describe('mutations', () => {
  it('mkdir', async () => {
    const ctx = WC()
    await R().execute('mkdir mydir', ctx)
    const r = ctx.root.children?.get('home')?.children?.get('researcher')
    expect(r?.children?.has('mydir')).toBe(true)
  })
  it('touch', async () => {
    const ctx = WC()
    await R().execute('touch f.txt', ctx)
    expect(
      ctx.root.children?.get('home')?.children?.get('researcher')?.children?.has('f.txt'),
    ).toBe(true)
  })
  it('rm', async () => {
    const ctx = WC()
    await R().execute('touch t.txt', ctx)
    await R().execute('rm t.txt', ctx)
    expect(
      ctx.root.children?.get('home')?.children?.get('researcher')?.children?.has('t.txt'),
    ).toBe(false)
  })
  it('protected mkdir', async () => {
    expect((await R().execute('mkdir /etc/x', WC()))[0]).toContain('Permission denied')
  })
  it('protected rm', async () => {
    expect((await R().execute('rm /etc/hostname', WC()))[0]).toContain('Permission denied')
  })
  it('non-empty dir', async () => {
    const ctx = WC()
    await R().execute('mkdir d', ctx)
    await R().execute('touch d/f.txt', ctx)
    expect((await R().execute('rm d', ctx))[0]).toContain('Directory not empty')
  })
  it('cd into user dir', async () => {
    const ctx = WC()
    await R().execute('mkdir p', ctx)
    await R().execute('cd p', ctx)
    expect(ctx.setcwd).toHaveBeenCalledWith('/home/researcher/p')
  })
})
