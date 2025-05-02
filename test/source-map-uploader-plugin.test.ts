import { BugsnagSourceMapUploaderPlugin } from '../'

describe('BugsnagSourceMapUploaderPlugin', () => {
    it('should return a valid plugin object', () => {
        const plugin = BugsnagSourceMapUploaderPlugin()
        expect(plugin.name).toBe('vite-plugin-bugsnag-source-map-uploader')
    })
})
