#!/usr/bin/env node
// Checks the parts of ~/Perso/CLAUDE.md that ESLint and tsc cannot see:
// forbidden visual primitives, hardcoded colours, unlocalized copy, and the
// accessibility rules a regex can actually see.
// Run from a project root. Add `norm-ok` in a comment on a line to allow it.
//
//   node norm-check.mjs              every violation blocks
//   node norm-check.mjs <file...>    only those files block, the rest is debt
//
// The second form is the one the skills use: you cannot add a violation to
// what you just wrote, and the backlog of an older project never blocks you.
//
// Not checked here on purpose:
// - file length, console, any, ts-comment, em dash -> eslint.config.mjs
// - fr.ts completeness -> `fr: Messages` already makes tsc fail on a gap
// - contrast ratios, hit areas, heading order, the spacing scale -> a regex
//   would either miss them or cry wolf on every file. They are read by eye,
//   during the review pass of /dev-feature.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SCANNED = ['src', 'convex']
const SKIPPED = /(^|\/)(node_modules|_generated|dist|routeTree\.gen\.ts)/
const SCANNED_EXT = /\.(tsx?|css)$/

const RULES = [
  {
    id: 'rounded',
    // "Square corners. No rounded-* beyond what a form control strictly needs."
    re: /\brounded(-\w+)*\b/,
    msg: 'square corners only (mark the line norm-ok if it is a form control)',
  },
  {
    id: 'shadow',
    re: /\b(shadow-(?!none)\w+|drop-shadow)\b/,
    msg: 'separate with a hairline, not a shadow',
  },
  {
    id: 'blur',
    re: /\b(backdrop-)?blur(-\w+)?\b/,
    msg: 'no blur in this design language',
  },
  {
    id: 'gradient',
    re: /\bbg-(gradient|linear|radial|conic)-/,
    msg: 'no gradients in this design language',
  },
  {
    id: 'hover-motion',
    re: /\bhover:(scale|translate)-/,
    msg: 'state changes go through colour and hairlines, not motion',
  },
  {
    id: 'theme-toggle',
    re: /\bdark:/,
    msg: 'one fixed theme per project, no dark: variant',
  },
  {
    id: 'hardcoded-colour',
    re: /(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\()/,
    msg: 'use the theme tokens from app.css',
    // Colours living in backend data (scene presets, seeds) are not styling.
    only: /\.tsx$/,
    // <meta name="theme-color"> takes a literal, a CSS token cannot reach it.
    unless: /theme-color/,
  },
  {
    id: 'unlocalized',
    // Visible copy that never went through useMessages(). The `(?<!=)` keeps
    // TypeScript signatures out of it: in `=> Promise<void>` the arrow's `>`
    // followed by `<void>` reads exactly like a JSX text node.
    re: /(?<!=)> ?[A-Za-zÀ-ÿ][^<>{}\n]{2,}<|(?:placeholder|aria-label|alt|title)="[A-Za-zÀ-ÿ][^"]{2,}"/,
    msg: 'user-facing copy must come from src/i18n',
    only: /\.tsx$/,
  },
  {
    id: 'focus-hidden',
    // "Focus stays visible." A ring of the project's own is fine — say so with
    // norm-ok on the line that removes the default one.
    re: /outline:\s*none|\boutline-none\b|\boutline-hidden\b/,
    msg: 'keyboard focus must stay visible (norm-ok if a :focus-visible ring replaces it)',
  },
]

// Rules that need more than one line of context. Each match reports the line it
// starts on; a `norm-ok` on that line clears it.
const FILE_RULES = [
  {
    id: 'img-no-alt',
    // JSX splits an <img> over several lines, so the whole tag is matched.
    re: /<img\b[^>]*?\/?>/gs,
    keep: (tag) => !/\salt\s*=/.test(tag),
    msg: 'every image needs an alt (alt="" when decorative)',
    only: /\.tsx$/,
  },
  {
    id: 'clickable-div',
    re: /<(?:div|span|li|p)\b[^>]*?\bonClick\s*=/gs,
    msg: 'an action is a <button>, a destination is an <a href>',
    only: /\.tsx$/,
  },
]

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (SKIPPED.test(path)) continue
    if (statSync(path).isDirectory()) walk(path, out)
    else if (SCANNED_EXT.test(path)) out.push(path)
  }
  return out
}

const violations = []

for (const dir of SCANNED) {
  let files
  try {
    files = walk(join(ROOT, dir))
  } catch {
    continue // project without this directory
  }

  for (const file of files) {
    const short = relative(ROOT, file)
    const source = readFileSync(file, 'utf8')
    const lines = source.split('\n')

    // A `norm-ok` comment covers its own line, and the block under it up to the
    // next blank line — so one marker can justify a whole named constant.
    let covered = 0
    let inBlockComment = false
    lines.forEach((line, i) => {
      if (line.includes('norm-ok')) {
        covered = 10
        return
      }
      if (line.trim() === '') covered = 0
      if (covered > 0) {
        covered--
        return
      }
      // A comment describes the code, it is not the code: a line reading
      // "the identity rejects blur" must not be reported as a blur. Tracks
      // block comments too, whose continuation lines carry no marker.
      const opens = line.lastIndexOf('/*')
      const closes = line.lastIndexOf('*/')
      const wasInBlock = inBlockComment
      if (opens > closes) inBlockComment = true
      else if (closes > opens) inBlockComment = false
      if (wasInBlock || inBlockComment || /^\s*(\/\/|\*)/.test(line)) return
      for (const rule of RULES) {
        if (rule.only && !rule.only.test(file)) continue
        if (rule.unless && rule.unless.test(line)) continue
        if (rule.re.test(line))
          violations.push({ file: short, line: i + 1, rule })
      }
    })

    for (const rule of FILE_RULES) {
      if (rule.only && !rule.only.test(file)) continue
      for (const match of source.matchAll(rule.re)) {
        if (rule.keep && !rule.keep(match[0])) continue
        const line = source.slice(0, match.index).split('\n').length
        if (lines[line - 1].includes('norm-ok')) continue
        violations.push({ file: short, line, rule })
      }
    }
  }
}

const scope = process.argv.slice(2).map((f) => f.replace(/^\.\//, ''))
const inScope = (v) => scope.length === 0 || scope.includes(v.file)

const blocking = violations.filter(inScope)
const debt = violations.filter((v) => !inScope(v))

const print = (list) => {
  for (const v of list)
    console.log(`  ${v.file}:${v.line}  ${v.rule.id}  ${v.rule.msg}`)
}

if (blocking.length > 0) {
  console.log(`norm-check: ${blocking.length} violation(s) to fix`)
  print(blocking)
}
if (debt.length > 0) {
  console.log(`\nnorm-check: ${debt.length} pre-existing, not blocking`)
  print(debt)
}
if (blocking.length === 0 && debt.length === 0) console.log('norm-check: clean')

process.exit(blocking.length > 0 ? 1 : 0)
