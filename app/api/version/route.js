import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    // Read package.json from the root directory
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    
    return Response.json({
      version: packageJson.version,
      name: packageJson.name,
      success: true
    })
  } catch (error) {
    console.error('Error reading package.json:', error)
    return Response.json({
      error: 'Unable to read version information',
      success: false
    }, { status: 500 })
  }
}
