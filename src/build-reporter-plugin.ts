import type { Plugin } from 'vite'

export function BugsnagBuildReporterPlugin(): Plugin {
  return {
    name: 'vite-plugin-bugsnag-build-reporter'
  }
}