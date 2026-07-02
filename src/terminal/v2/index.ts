/**
 * Rewritten SCP Foundation terminal — public entry point.
 *
 * Phase 0: layer contracts + empty skeletons. No implementation yet;
 * the legacy terminal (bootstrap.ts, shell.ts, storage.ts, commands/,
 * filesystem/) remains untouched and in use until phase 5 swaps over.
 *
 * Layering (top → bottom):
 *   render/        xterm headless + DOM painter + input controller
 *   shell/         reactive state, prompt, history, completion
 *   commands/      registry + ~60 builtin commands (async-capable)
 *   fs/            virtual filesystem (pure data, no state)
 *   persistence/   OPFS/IndexedDB storage + debounced save
 *
 * Dependency flow: render → shell → commands → fs
 *                                 shell ↘ persistence
 */

export * from './types'
export * from './fs'
export * from './commands'
export * from './shell'
export * from './render'
export * from './persistence'
