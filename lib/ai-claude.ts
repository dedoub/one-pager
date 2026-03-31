import { spawn } from 'child_process'

export async function callClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', ['-p', '--model', 'claude-opus-4-6'], {
      env: { ...process.env, PATH: process.env.PATH },
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => { stdout += data.toString() })
    proc.stderr.on('data', (data) => { stderr += data.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`))
      } else {
        resolve(stdout.trim())
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn claude: ${err.message}`))
    })

    proc.stdin.write(prompt)
    proc.stdin.end()

    // 5 minute timeout
    setTimeout(() => {
      proc.kill()
      reject(new Error('Claude CLI timed out after 5 minutes'))
    }, 5 * 60 * 1000)
  })
}
