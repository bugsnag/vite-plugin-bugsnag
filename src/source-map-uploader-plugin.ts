import Bugsnag from '@bugsnag/cli'
import type { BugsnagUploadJsOptions } from '@bugsnag/cli'
import type { Plugin } from 'vite'

const LOG_PREFIX = '[BugsnagSourceMapUploaderPlugin]'

interface Logger {
  debug: (message: string) => void
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}
export interface ConfigOptions {
  apiKey: string
  appVersion: string
  endpoint?: string
  bundleUrl?: string
  bundle?: string
  codeBundleId?: string
  releaseStage?: string
  logger?: Logger
}

export function BugsnagSourceMapUploaderPlugin (configOptions: ConfigOptions): Plugin {
  if (typeof configOptions.apiKey !== 'string' || configOptions.apiKey.length < 1) {
    throw new Error(`${LOG_PREFIX} "apiKey" is required`)
  }

  const enableSourcemapUploads = configOptions.releaseStage === 'production' || process.env.NODE_ENV === 'release'

  return {
    name: 'vite-plugin-bugsnag-source-map-uploader',
    async writeBundle (options) {
      const logger = configOptions.logger || this.environment.logger
      const baseUrl = options.dir || process.cwd()

      if (enableSourcemapUploads) {
        logger.info(`${LOG_PREFIX}uploading sourcemaps using the bugsnag-cli`)

        const uploadOptions = getUploadOptions(configOptions, baseUrl)
        Bugsnag.Upload.Js(uploadOptions, process.cwd())
          .then((output) => {
            output.split('\n').forEach((line) => {
              logger.info(LOG_PREFIX + line)
            })
          })
          .catch((err) => {
            err.toString().split('\n').forEach((line: string) => {
              logger.error(LOG_PREFIX + line)
            })
          })
      }
    }
  }
}

function getUploadOptions (configOptions: ConfigOptions, baseUrl: string): BugsnagUploadJsOptions {
  const uploadOptions: BugsnagUploadJsOptions = {
    apiKey: configOptions.apiKey,
    baseUrl,
    projectRoot: process.cwd(),
    versionName: configOptions.appVersion,
    codeBundleId: configOptions.codeBundleId,
    uploadApiRootUrl: configOptions.endpoint,
    bundle: configOptions.bundle,
    bundleUrl: configOptions.bundleUrl
  }

  for (const [key, value] of Object.entries(uploadOptions)) {
      if (value === undefined) {
        delete uploadOptions[key as keyof BugsnagUploadJsOptions]
      }
    }

  return uploadOptions
}
