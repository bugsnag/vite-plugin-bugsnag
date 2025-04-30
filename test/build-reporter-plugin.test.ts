import fs from 'fs'
import { resolve } from 'path'
import { build } from 'vite'
import { describe, expect, test, vi } from 'vitest'
import { BugsnagBuildReporterPlugin } from '../src/build-reporter-plugin'

vi.mock('@bugsnag/cli', () => ({
    default: {
        CreateBuild: vi.fn(() => Promise.resolve('Build reported successfully'))
    }
}))

describe('BugsnagBuildReporterPlugin', () => {
    test('should report the build successfully', async () => {
        const mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn()
        }

        const plugin = BugsnagBuildReporterPlugin({
            apiKey: 'test-api-key',
            appVersion: '1.2.3',
            builderName: 'test-builder',
            releaseStage: 'production',
            sourceControl: {
                provider: 'github',
                repository: 'test-repo',
                revision: 'test-revision'
            },
            logger: mockLogger
        })

        const fixturesPath = resolve(__dirname, '../test/fixtures/vite/build-reporter/successful-upload')
        const viteConfig = {
            root: fixturesPath,
            plugins: [plugin]
        }

        // Ensure the output directory is clean
        const outputDir = resolve(fixturesPath, 'dist')
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true, force: true })
        }

        await build(viteConfig)

        expect(mockLogger.info).toHaveBeenCalledWith(
            '[BugsnagBuildReporterPlugin]creating build for version "1.2.3" using the bugsnag-cli'
        )
    })
})