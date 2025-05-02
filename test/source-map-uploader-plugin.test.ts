import fs from 'fs'
import { resolve } from 'path'
import { build } from 'vite'
import { describe, expect, test, vi } from 'vitest'
import { BugsnagSourceMapUploaderPlugin } from '../src/source-map-uploader-plugin'
import Bugsnag from '@bugsnag/cli'

vi.mock('@bugsnag/cli', () => ({
    default: {
        Upload: {
            Js: vi.fn(() => Promise.resolve('Sourcemaps uploaded successfully'))
        }
    }
}))

const cleanBuildDir = (dir: string) => {
    const outputDir = resolve(dir, 'dist')
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true })
    }
}

describe('BugsnagSourceMapUploaderPlugin', () => {
    test('should return a valid plugin object', () => {
        const plugin = BugsnagSourceMapUploaderPlugin({
            apiKey: 'test-api',
            appVersion: '1.0.0'
        })

        expect(plugin.name).toBe('vite-plugin-bugsnag-source-map-uploader')
    })

    test('should upload sourcemaps during build process', async () => {
        const mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn()
        }

        const plugin = BugsnagSourceMapUploaderPlugin({
            logger: mockLogger,
            apiKey: 'test-api',
            appVersion: '1.0.0',
            releaseStage: 'production'
        })

        const fixturesPath = resolve(__dirname, '..', 'test/fixtures/vite/build-reporter/successful-upload')
        const viteConfig = {
            root: fixturesPath,
            plugins: [plugin],
            build: { sourcemap: true } 
        }

        cleanBuildDir(fixturesPath)

        await build(viteConfig)

        const originalCreateBuild = vi.mocked(Bugsnag.Upload.Js)
        
        const outputDir = resolve(fixturesPath, 'dist')
        const projectRoot = process.cwd()

        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin]uploading sourcemaps using the bugsnag-cli')
        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin]Sourcemaps uploaded successfully')
        expect(originalCreateBuild).toHaveBeenCalledWith({
            apiKey: 'test-api',
            versionName: '1.0.0',
            baseUrl: outputDir,
            projectRoot
        }, projectRoot)
    })
})
