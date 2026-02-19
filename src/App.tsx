import { useState, useMemo, useCallback } from 'react'

interface MatchResult {
  fullMatch: string
  index: number
  groups: string[]
}

const FLAGS = ['g', 'i', 'm', 's', 'u'] as const
type Flag = typeof FLAGS[number]

const FLAG_LABELS: Record<Flag, string> = {
  g: 'global',
  i: 'case-insensitive',
  m: 'multiline',
  s: 'dotAll',
  u: 'unicode',
}

const CHEAT_SHEET = [
  { cat: 'Characters', items: ['.', '\\d', '\\w', '\\s', '\\b', '[abc]', '[^abc]', '[a-z]'] },
  { cat: 'Quantifiers', items: ['*', '+', '?', '{n}', '{n,}', '{n,m}'] },
  { cat: 'Groups', items: ['(abc)', '(?:abc)', '(?<name>abc)', '\\1', '(?=abc)', '(?!abc)', '(?<=abc)', '(?<!abc)'] },
  { cat: 'Anchors', items: ['^', '$', '\\b', '\\B'] },
  { cat: 'Escape', items: ['\\', '\\.', '\\*', '\\+', '\\?', '\\(', '\\)'] },
]

const DESCRIPTIONS: Record<string, string> = {
  '.': 'Any character (except newline)',
  '\\d': 'Digit [0-9]',
  '\\w': 'Word char [a-zA-Z0-9_]',
  '\\s': 'Whitespace',
  '\\b': 'Word boundary',
  '[abc]': 'Any of a, b, or c',
  '[^abc]': 'Not a, b, or c',
  '[a-z]': 'Character range',
  '*': '0 or more',
  '+': '1 or more',
  '?': '0 or 1',
  '{n}': 'Exactly n',
  '{n,}': 'n or more',
  '{n,m}': 'Between n and m',
  '(abc)': 'Capture group',
  '(?:abc)': 'Non-capturing group',
  '(?<name>abc)': 'Named capture group',
  '\\1': 'Back-reference',
  '(?=abc)': 'Positive lookahead',
  '(?!abc)': 'Negative lookahead',
  '(?<=abc)': 'Positive lookbehind',
  '(?<!abc)': 'Negative lookbehind',
  '^': 'Start of string/line',
  '$': 'End of string/line',
  '\\B': 'Not a word boundary',
  '\\': 'Escape next char',
  '\\.': 'Literal dot',
  '\\*': 'Literal asterisk',
  '\\+': 'Literal plus',
  '\\?': 'Literal question mark',
  '\\(': 'Literal open paren',
  '\\)': 'Literal close paren',
}

const MATCH_COLORS = [
  'bg-yellow-500/30 border-yellow-500/50',
  'bg-cyan-500/30 border-cyan-500/50',
  'bg-pink-500/30 border-pink-500/50',
  'bg-green-500/30 border-green-500/50',
  'bg-purple-500/30 border-purple-500/50',
  'bg-orange-500/30 border-orange-500/50',
]

export default function App() {
  const [pattern, setPattern] = useState('(\\w+)@(\\w+\\.\\w+)')
  const [text, setText] = useState('Contact us at hello@example.com or support@test.org for help.')
  const [flags, setFlags] = useState<Set<Flag>>(new Set(['g']))
  const [error, setError] = useState<string | null>(null)
  const [showCheatSheet, setShowCheatSheet] = useState(false)

  const toggleFlag = useCallback((f: Flag) => {
    setFlags(prev => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }, [])

  const flagStr = useMemo(() => Array.from(flags).sort().join(''), [flags])

  const matches: MatchResult[] = useMemo(() => {
    setError(null)
    if (!pattern) return []
    try {
      const re = new RegExp(pattern, flagStr.includes('g') ? flagStr : flagStr + 'g')
      const results: MatchResult[] = []
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        results.push({
          fullMatch: m[0],
          index: m.index,
          groups: m.slice(1),
        })
        if (!m[0]) re.lastIndex++
      }
      return results
    } catch (e) {
      setError((e as Error).message)
      return []
    }
  }, [pattern, text, flagStr])

  const highlightedParts = useMemo(() => {
    if (!matches.length) return [{ text, highlight: false, colorIdx: 0 }]
    const parts: { text: string; highlight: boolean; colorIdx: number }[] = []
    let lastEnd = 0
    matches.forEach((m, i) => {
      if (m.index > lastEnd) {
        parts.push({ text: text.slice(lastEnd, m.index), highlight: false, colorIdx: 0 })
      }
      parts.push({ text: m.fullMatch, highlight: true, colorIdx: i % MATCH_COLORS.length })
      lastEnd = m.index + m.fullMatch.length
    })
    if (lastEnd < text.length) {
      parts.push({ text: text.slice(lastEnd), highlight: false, colorIdx: 0 })
    }
    return parts
  }, [matches, text])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔍</span>
          <h1 className="text-xl font-bold tracking-tight">Regex Tester</h1>
        </div>
        <button
          onClick={() => setShowCheatSheet(v => !v)}
          className="px-3 py-1.5 text-sm rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700"
        >
          {showCheatSheet ? 'Hide' : 'Show'} Cheat Sheet
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main panel */}
        <main className="flex-1 p-6 flex flex-col gap-5 min-w-0">
          {/* Pattern input */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Pattern</label>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-lg">/</span>
              <input
                type="text"
                value={pattern}
                onChange={e => setPattern(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                placeholder="Enter regex pattern..."
                spellCheck={false}
              />
              <span className="text-zinc-500 text-lg">/{flagStr}</span>
            </div>
            {error && <p className="mt-1.5 text-red-400 text-xs font-mono">{error}</p>}
          </div>

          {/* Flags */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Flags</label>
            <div className="flex gap-2 flex-wrap">
              {FLAGS.map(f => (
                <button
                  key={f}
                  onClick={() => toggleFlag(f)}
                  className={`px-3 py-1 rounded-md text-sm font-mono border transition-colors ${
                    flags.has(f)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                  title={FLAG_LABELS[f]}
                >
                  {f}
                  <span className="ml-1.5 text-xs opacity-60 font-sans">{FLAG_LABELS[f]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Test string with highlighting */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-400">Test String</label>
              <span className="text-xs text-zinc-500">
                {matches.length} match{matches.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <div className="flex-1 relative min-h-[200px]">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                className="absolute inset-0 w-full h-full bg-transparent border border-zinc-700 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-none text-transparent caret-zinc-100 z-10"
                spellCheck={false}
              />
              <div className="absolute inset-0 w-full h-full border border-transparent rounded-md px-3 py-2 text-sm font-mono whitespace-pre-wrap break-words overflow-auto pointer-events-none bg-zinc-900">
                {highlightedParts.map((p, i) =>
                  p.highlight ? (
                    <mark key={i} className={`${MATCH_COLORS[p.colorIdx]} border rounded-sm px-px -mx-px`}>
                      {p.text}
                    </mark>
                  ) : (
                    <span key={i}>{p.text}</span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Matches */}
          {matches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Matches ({matches.length})
              </label>
              <div className="bg-zinc-900 border border-zinc-700 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="px-3 py-2 text-left font-medium">#</th>
                      <th className="px-3 py-2 text-left font-medium">Match</th>
                      <th className="px-3 py-2 text-left font-medium">Index</th>
                      <th className="px-3 py-2 text-left font-medium">Groups</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 last:border-0">
                        <td className="px-3 py-2 text-zinc-500 font-mono">{i + 1}</td>
                        <td className="px-3 py-2 font-mono">
                          <span className={`${MATCH_COLORS[i % MATCH_COLORS.length]} border rounded-sm px-1`}>
                            {m.fullMatch}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-zinc-400 font-mono">{m.index}</td>
                        <td className="px-3 py-2 font-mono">
                          {m.groups.length > 0 ? (
                            <div className="flex gap-1.5 flex-wrap">
                              {m.groups.map((g, j) => (
                                <span key={j} className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-xs">
                                  ${j + 1}: {g}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* Cheat Sheet sidebar */}
        {showCheatSheet && (
          <aside className="lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 p-6 overflow-auto bg-zinc-900/50">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Quick Reference</h2>
            <div className="space-y-4">
              {CHEAT_SHEET.map(section => (
                <div key={section.cat}>
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">{section.cat}</h3>
                  <div className="space-y-1">
                    {section.items.map(item => (
                      <button
                        key={item}
                        onClick={() => setPattern(p => p + item.replace(/\\/g, '\\'))}
                        className="w-full flex items-center gap-3 px-2 py-1 rounded hover:bg-zinc-800 transition-colors text-left group"
                      >
                        <code className="text-xs font-mono text-indigo-400 w-20 shrink-0">{item}</code>
                        <span className="text-xs text-zinc-500 group-hover:text-zinc-400">{DESCRIPTIONS[item] ?? ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      <footer className="border-t border-zinc-800 px-6 py-3 text-center text-xs text-zinc-600">
        Built with React + Tailwind CSS •{' '}
        <a href="https://github.com/obrera/nightshift-006-regex" className="hover:text-zinc-400 transition-colors">
          Source
        </a>
      </footer>
    </div>
  )
}
