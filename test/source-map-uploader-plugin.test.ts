import Bugsnag from '@bugsnag/cli'
import { resolve } from 'path'
import { build } from 'vite'
import { describe, expect, test, vi } from 'vitest'
import { BugsnagSourceMapUploaderPlugin } from '../src/source-map-uploader-plugin'
import cleanBuildDir from './lib/clean-build-dir'

import { version } from '../package.json'

vi.mock('@bugsnag/cli', () => ({
    default: {
        Upload: {
            Js: vi.fn(() => Promise.resolve('Sourcemaps uploaded successfully'))
        }
    }
}))

describe('BugsnagSourceMapUploaderPlugin', () => {
    test('should return a valid plugin object', async () => {
        const plugin = BugsnagSourceMapUploaderPlugin({
            apiKey: 'test-api',
            appVersion: '1.0.0',
            base: 'https://bugsnag.com'
        })

        expect(plugin.name).toBe('vite-plugin-bugsnag-source-map-uploader')
    })

    test('throws an error if apiKey is not provided', async () => {
        const createPlugin = () => BugsnagSourceMapUploaderPlugin({
            apiKey: undefined as unknown as string,
            appVersion: '1.0.0'
        })

        expect(createPlugin).toThrowError('[BugsnagSourceMapUploaderPlugin] "apiKey" is required')
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
            mode: 'production'
        })

        const fixturesPath = resolve(__dirname, 'fixtures/basic')
        const viteConfig = {
            base: 'https://bugsnag.com',
            root: fixturesPath,
            plugins: [plugin],
            build: { sourcemap: true } 
        }

        cleanBuildDir(fixturesPath)

        await build(viteConfig)

        const sourcemapUpload = vi.mocked(Bugsnag.Upload.Js)
        const outputDir = resolve(fixturesPath, 'dist')
        const bundlePath = resolve(outputDir, 'assets/index-DTHX3LI9.js')
        const sourceMapPath = resolve(outputDir, 'assets/index-DTHX3LI9.js.map')

        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] uploading sourcemaps using the bugsnag-cli')
        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] Sourcemaps uploaded successfully')
        expect(sourcemapUpload).toHaveBeenCalledExactlyOnceWith({
                apiKey: 'test-api',
                bundleUrl: 'https://bugsnag.com/assets/index-DTHX3LI9.js',
                bundle: bundlePath,
                projectRoot: fixturesPath,
                sourceMap: sourceMapPath,
                versionName: '1.0.0'
            },
            outputDir
        )
        
        sourcemapUpload.mockClear()
    })

    test('should use the relative filepath for bundleUrl if base is not provided in config', async () => {
        const mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn()
        }

        const plugin = BugsnagSourceMapUploaderPlugin({
            logger: mockLogger,
            apiKey: 'test-api',
            mode: 'production'
        })

        const fixturePath = resolve(__dirname, 'fixtures/basic')
        const viteConfig = {
            root: fixturePath,
            plugins: [plugin],
            build: { sourcemap: true } 
        }

        cleanBuildDir(fixturePath)

        await build(viteConfig)

        const sourcemapUpload = vi.mocked(Bugsnag.Upload.Js)
        const outputDir = resolve(fixturePath, 'dist')
        const bundlePath = resolve(outputDir, 'assets/index-DTHX3LI9.js')
        const sourceMapPath = resolve(outputDir, 'assets/index-DTHX3LI9.js.map')

        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] uploading sourcemaps using the bugsnag-cli')
        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] Sourcemaps uploaded successfully')
        expect(sourcemapUpload).toHaveBeenCalledExactlyOnceWith({
                apiKey: 'test-api',
                bundleUrl: '/assets/index-DTHX3LI9.js',
                bundle: bundlePath,
                projectRoot: fixturePath,
                sourceMap: sourceMapPath,
                versionName: version
            },
            outputDir
        )

        sourcemapUpload.mockClear()
    })

    test('logs an error if the upload fails', async () => {
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
            mode: 'production'
        })

        const fixturePath = resolve(__dirname, 'fixtures/basic')
        const viteConfig = {
            base: 'https://bugsnag.com',
            root: fixturePath,
            plugins: [plugin],
            build: { sourcemap: true } 
        }

        cleanBuildDir(fixturePath)

        const sourcemapUpload = vi.mocked(Bugsnag.Upload.Js)
        sourcemapUpload.mockImplementationOnce(() => Promise.reject(new Error('Upload failed')))

        await build(viteConfig)

        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] uploading sourcemaps using the bugsnag-cli')
        expect(mockLogger.error).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] Error: Upload failed')
        expect(mockLogger.info).not.toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] Sourcemaps uploaded successfully')

        sourcemapUpload.mockClear()
    })
})
