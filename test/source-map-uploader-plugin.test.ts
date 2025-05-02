import { describe, expect, test } from 'vitest'
import { BugsnagSourceMapUploaderPlugin } from '../src/source-map-uploader-plugin'

describe('BugsnagSourceMapUploaderPlugin', () => {
    test('should return a valid plugin object', () => {
        const plugin = BugsnagSourceMapUploaderPlugin()
        expect(plugin.name).toBe('vite-plugin-bugsnag-source-map-uploader')
    })
})
