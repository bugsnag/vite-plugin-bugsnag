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
    test('should return a valid plugin object', async () => {
        const plugin = BugsnagSourceMapUploaderPlugin({
            apiKey: 'test-api',
            appVersion: '1.0.0'
        })

        expect(plugin.name).toBe('vite-plugin-bugsnag-source-map-uploader')
    })

    test('throws an error if apiKey is not provided', async () => {
        const createPlugin = () => BugsnagSourceMapUploaderPlugin({
            apiKey: undefined as unknown as string,
            appVersion: '1.0.0',
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
            mode: 'production',
            baseUrl: 'https://example.com'
        })

        const fixturesPath = resolve(__dirname, '..', 'test/fixtures/basic')
        const viteConfig = {
            root: fixturesPath,
            plugins: [plugin],
            build: { sourcemap: true } 
        }

        cleanBuildDir(fixturesPath)

        await build(viteConfig)

        const sourcemapUpload = vi.mocked(Bugsnag.Upload.Js)
        const projectRoot = process.cwd()
        const outputDir = resolve(fixturesPath, 'dist')

        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] uploading sourcemaps using the bugsnag-cli')
        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] Sourcemaps uploaded successfully')
        expect(sourcemapUpload).toHaveBeenCalledExactlyOnceWith({
                apiKey: 'test-api',
                bundleUrl: 'https://example.com/assets/index-BeYSa9L1.js',
                bundle: 'assets/index-BeYSa9L1.js',
                projectRoot,
                sourceMap: 'assets/index-BeYSa9L1.js.map',
                versionName: '1.0.0'
            },
            outputDir
        )
        
        sourcemapUpload.mockClear()
    })

    test('should use the outputDir to construct urls if baseUrl is not provided', async () => {
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

        const fixturesPath = resolve(__dirname, '..', 'test/fixtures/basic')
        const viteConfig = {
            root: fixturesPath,
            plugins: [plugin],
            build: { sourcemap: true } 
        }

        cleanBuildDir(fixturesPath)

        await build(viteConfig)

        const sourcemapUpload = vi.mocked(Bugsnag.Upload.Js)

        const projectRoot = process.cwd()
        const outputDir = resolve(fixturesPath, 'dist')
        const bundleUrl = resolve(outputDir, 'assets/index-BeYSa9L1.js')

        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] uploading sourcemaps using the bugsnag-cli')
        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] Sourcemaps uploaded successfully')
        expect(sourcemapUpload).toHaveBeenCalledExactlyOnceWith({
                apiKey: 'test-api',
                bundleUrl,
                bundle: 'assets/index-BeYSa9L1.js',
                projectRoot,
                sourceMap: 'assets/index-BeYSa9L1.js.map',
                versionName: '1.0.0'
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

        const fixturesPath = resolve(__dirname, '..', 'test/fixtures/basic')
        const viteConfig = {
            root: fixturesPath,
            plugins: [plugin],
            build: { sourcemap: true } 
        }

        cleanBuildDir(fixturesPath)

        const sourcemapUpload = vi.mocked(Bugsnag.Upload.Js)
        sourcemapUpload.mockImplementationOnce(() => Promise.reject(new Error('Upload failed')))

        await build(viteConfig)

        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] uploading sourcemaps using the bugsnag-cli')
        expect(mockLogger.error).toHaveBeenCalledWith('[BugsnagSourceMapUploaderPlugin] Error: Upload failed')

        sourcemapUpload.mockClear()
    })
})
