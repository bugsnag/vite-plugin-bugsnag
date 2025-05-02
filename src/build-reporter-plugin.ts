import Bugsnag from '@bugsnag/cli'
import type { BugsnagCreateBuildOptions } from '@bugsnag/cli'
import type { Plugin } from 'vite'

const LOG_PREFIX = '[BugsnagBuildReporterPlugin]'

export function BugsnagBuildReporterPlugin (configOptions: BugsnagBuildReporterPluginOptions): Plugin {
  const buildOptions = getBuildOptions(configOptions)

  return {
    name: 'vite-plugin-bugsnag-build-reporter',
    buildEnd (error) {
      const logger = configOptions.logger || this.environment.logger

      if (error) {
        logger.error(`${LOG_PREFIX}build failed with error: ${error}`)
        return
      }

      logger.info(`${LOG_PREFIX}creating build for version "${buildOptions.versionName}" using the bugsnag-cli`)

      Bugsnag.CreateBuild(buildOptions, process.cwd())
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

function getBuildOptions (configOptions: BugsnagBuildReporterPluginOptions) {
  const buildOptions: BugsnagCreateBuildOptions = {
    apiKey: configOptions.apiKey,
    versionName: configOptions.appVersion,
    autoAssignRelease: configOptions.autoAssignRelease,
    builderName: configOptions.builderName,
    metadata: configOptions.metadata,
    releaseStage: configOptions.releaseStage,
    provider: configOptions.sourceControl?.provider,
    repository: configOptions.sourceControl?.repository,
    revision: configOptions.sourceControl?.revision,
    buildApiRootUrl: configOptions.endpoint,
    logLevel: configOptions.logLevel
  }

  for (const [key, value] of Object.entries(buildOptions)) {
    if (value === undefined) {
      delete buildOptions[key as keyof BugsnagCreateBuildOptions]
    }
  }

  return buildOptions
}

export interface BugsnagBuildReporterPluginOptions {
  apiKey: string
  appVersion: string // versionName
  endpoint?: string // buildApiRootUrl
  autoAssignRelease?: boolean
  builderName?: string
  metadata?: object
  releaseStage?: string
  sourceControl?: {
    provider?: string
    repository?: string
    revision?: string
  }
  logLevel?: string
  logger?: {
    debug: (message: string) => void
    info: (message: string) => void
    warn: (message: string) => void
    error: (message: string) => void
  }
}
