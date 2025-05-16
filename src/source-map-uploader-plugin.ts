import Bugsnag from '@bugsnag/cli'
import { join, resolve } from 'path'
import isValidUrl from './is-valid-url'

import type { Plugin } from 'vite'
import type { SourceMapUploaderConfig } from './config'

const LOG_PREFIX = '[BugsnagSourceMapUploaderPlugin]'

export function BugsnagSourceMapUploaderPlugin (configOptions: SourceMapUploaderConfig): Plugin {
  if (typeof configOptions.apiKey !== 'string' || configOptions.apiKey.length < 1) {
    throw new Error(`${LOG_PREFIX} "apiKey" is required`)
  }

  return {
    name: 'vite-plugin-bugsnag-source-map-uploader',
    async writeBundle (options, bundle) {
      const logger = configOptions.logger || this.environment.logger
      const projectRoot = configOptions.projectRoot || this.environment.config.root
      const outputDir = options.dir || projectRoot
      const baseUrl = configOptions.base || this.environment.config.base
      const versionName = configOptions.appVersion || process.env.npm_package_version || 'unknown'
      const validBaseUrl = isValidUrl(baseUrl)
      const target = configOptions.path || outputDir

      const uploads = []
      for (const [, value] of Object.entries(bundle)) {
        if (value.type === 'chunk' && !!value.sourcemapFileName) {
          const bundle = resolve(outputDir, value.fileName)
          const bundleUrl = validBaseUrl ? new URL(value.fileName, baseUrl).toString() : join(baseUrl, value.fileName)
          const sourceMap = value.sourcemapFileName ? join(outputDir, value.sourcemapFileName) : undefined
          const uploadOptions = getUploadOptions(bundle, bundleUrl, sourceMap, projectRoot, versionName, configOptions)
          uploads.push(uploadOptions)
        }
      }

      logger.info(`${LOG_PREFIX} uploading sourcemaps using the bugsnag-cli`)

      const tasks = uploads.map((uploadOptions) => {
        return Bugsnag.Upload.Js(uploadOptions, target)
          .then((output) => {
            output.split('\n').forEach((line) => {
              logger.info(`${LOG_PREFIX} ${line}`)
            })
          })
          .catch((err) => {
            err.toString().split('\n').forEach((line: string) => {
              logger.error(`${LOG_PREFIX} ${line}`)
            })
          })
      })

      await Promise.all(tasks)
    }
  }
}

function getUploadOptions (bundle: string, bundleUrl: string, sourceMap: string | undefined, projectRoot: string, versionName: string, configOptions: SourceMapUploaderConfig) {
  const uploadOptions = {
    apiKey: configOptions.apiKey, // The BugSnag API key for the application.
    bundle, // Path to the minified JavaScript file that the source map relates to.
    bundleUrl, // For single file uploads, the URL of the minified JavaScript file that the source map relates to. 
    codeBundleId: configOptions.codeBundleId, // A unique identifier for the JavaScript bundle.
    projectRoot, // The path to strip from the beginning of source file names referenced in stacktraces on the BugSnag dashboard.
    sourceMap, // Path to the source map file. This usually has the .min.js extension.
    uploadApiRootUrl: configOptions.endpoint, // The upload server hostname, optionally containing port number.
    versionName, // The version of the app that the source map applies to.
    overwrite: configOptions.overwrite, // Whether to ignore and overwrite existing uploads with same identifier, rather than failing if a matching file exists.
    logLevel: configOptions.logLevel // Sets the level of logging to debug, info, warn or fatal.
  }

  for (const [key, value] of Object.entries(uploadOptions)) {
    if (value === undefined) {
      delete uploadOptions[key as keyof typeof uploadOptions]
    }
  }

  return uploadOptions
}
