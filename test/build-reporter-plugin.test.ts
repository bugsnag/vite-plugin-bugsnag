import { BugsnagBuildReporterPlugin } from '../'

describe('BugsnagBuildReporterPlugin', () => {
    it('should return a valid plugin object', () => {
        const plugin = BugsnagBuildReporterPlugin()
        expect(plugin.name).toBe('vite-plugin-bugsnag-build-reporter')
    })
})
