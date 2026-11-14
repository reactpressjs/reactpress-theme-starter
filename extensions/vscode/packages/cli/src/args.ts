import * as fs from 'fs/promises'

export type Flags = Record<string, string | boolean>

export function parseArgs(argv: string[]): {
  command: string
  positionals: string[]
  flags: Flags
} {
  const cleaned = argv[0] === '--' ? argv.slice(1) : argv
  const [command = 'help', ...rest] = cleaned
  const positionals: string[] = []
  const flags: Flags = {}

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = rest[i + 1]
      if (!next || next.startsWith('--')) {
        flags[key] = true
      } else {
        flags[key] = next
        i += 1
      }
    } else {
      positionals.push(arg)
    }
  }

  return { command, positionals, flags }
}

export function flagString(flags: Flags, key: string, fallback?: string): string | undefined {
  const value = flags[key]
  if (typeof value === 'string') return value
  return fallback
}

export async function readTokenFile(tokenPath?: string): Promise<string | undefined> {
  if (!tokenPath) return undefined
  try {
    return (await fs.readFile(tokenPath, 'utf8')).trim()
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      throw new Error(`Token file not found: ${tokenPath}`)
    }
    throw error
  }
}
