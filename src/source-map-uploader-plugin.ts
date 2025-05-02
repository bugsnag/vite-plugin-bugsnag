import type { Plugin } from 'vite'

export function BugsnagSourceMapUploaderPlugin(): Plugin {
  return {
    name: 'vite-plugin-bugsnag-source-map-uploader'
  }
}