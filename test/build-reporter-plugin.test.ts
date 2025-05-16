import BugsnagCLI from '@bugsnag/cli'
import { resolve } from 'path'
import { build } from 'vite'
import { describe, expect, test, vi } from 'vitest'
import { BugsnagBuildReporterPlugin } from '../src/build-reporter-plugin'
import cleanBuildDir from './lib/clean-build-dir'

vi.mock('@bugsnag/cli', () => ({
    default: {
        CreateBuild: vi.fn(() => Promise.resolve('Build reported successfully'))
    }
}))

describe('BugsnagBuildReporterPlugin', () => {
    test('should report a successful build', async () => {
        const mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn()
        }

        const plugin = BugsnagBuildReporterPlugin({
            logger: mockLogger,
            apiKey: 'test-api-key',
            appVersion: '1.2.3',
            builderName: 'test-builder',
            releaseStage: 'production',
            sourceControl: {
                provider: 'github',
                repository: 'test-repo',
                revision: 'test-revision'
            }
        })

        const fixturesPath = resolve(__dirname, 'fixtures/basic')
        const viteConfig = {
            root: fixturesPath,
            plugins: [plugin]
        }

        cleanBuildDir(fixturesPath)

        await build(viteConfig)

        expect(mockLogger.info).toHaveBeenCalledTimes(2)
        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagBuildReporterPlugin] creating build for version "1.2.3" using the bugsnag-cli')
        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagBuildReporterPlugin] Build reported successfully')
    })

    test('should not report a failed build', async () => {
        const mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn()
        }

        const plugin = BugsnagBuildReporterPlugin({
            apiKey: 'test-api-key',
            appVersion: '1.2.3',
            logger: mockLogger
        })

        const fixturesPath = resolve(__dirname, 'fixtures/error')
        const viteConfig = {
            root: fixturesPath,
            plugins: [plugin]
        }

        cleanBuildDir(fixturesPath)

        await build(viteConfig).catch(() => {
            // Ignore the error
        })

        expect(mockLogger.info).not.toHaveBeenCalled()
        expect(mockLogger.error).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('[BugsnagBuildReporterPlugin] build failed with error:'))
    })

    test('should log errors encountered when reporting build', async () => {
        const mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn()
        }

        const plugin = BugsnagBuildReporterPlugin({
            logger: mockLogger,
            apiKey: 'test-api-key',
            appVersion: '1.2.3',
            builderName: 'test-builder',
            releaseStage: 'production',
            sourceControl: {
                provider: 'github',
                repository: 'test-repo',
                revision: 'test-revision'
            }
        })

        const fixturesPath = resolve(__dirname, 'fixtures/basic')
        const viteConfig = {
            root: fixturesPath,
            plugins: [plugin]
        }

        cleanBuildDir(fixturesPath)
        
        // Update the BugsnagCLI mock to throw an error
        const originalCreateBuild = vi.mocked(BugsnagCLI.CreateBuild)
        originalCreateBuild.mockImplementationOnce(() => Promise.reject(new Error('Bugsnag CLI error')))

        await build(viteConfig)

        expect(mockLogger.info).toHaveBeenCalledWith('[BugsnagBuildReporterPlugin] creating build for version "1.2.3" using the bugsnag-cli')
        expect(mockLogger.info).not.toHaveBeenCalledWith('[BugsnagBuildReporterPlugin] Build reported successfully')
        expect(mockLogger.error).toHaveBeenCalledWith('[BugsnagBuildReporterPlugin] Error: Bugsnag CLI error')
    })
})