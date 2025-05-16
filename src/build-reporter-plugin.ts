import Bugsnag from '@bugsnag/cli'
import type { Plugin } from 'vite'
import type { BuildReporterConfig } from './config'

const LOG_PREFIX = '[BugsnagBuildReporterPlugin]'

export function BugsnagBuildReporterPlugin (configOptions: BuildReporterConfig): Plugin {
  const buildOptions = getBuildOptions(configOptions)
  const target = configOptions.path || process.cwd()

  return {
    name: 'vite-plugin-bugsnag-build-reporter',
    buildEnd (error) {
      const logger = configOptions.logger || this.environment.logger

      if (error) {
        logger.error(`${LOG_PREFIX} build failed with error: ${error}`)
        return
      }

      logger.info(`${LOG_PREFIX} creating build for version "${buildOptions.versionName}" using the bugsnag-cli`)

      Bugsnag.CreateBuild(buildOptions, target)
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
    }
  }
}

function getBuildOptions (configOptions: BuildReporterConfig) {
  const buildOptions = {
    apiKey: configOptions.apiKey,
    versionName: configOptions.appVersion || process.env.npm_package_version,
    autoAssignRelease: configOptions.autoAssignRelease,
    builderName: configOptions.builderName,
    metadata: configOptions.metadata,
    releaseStage: configOptions.releaseStage,
    provider: configOptions.sourceControl?.provider,
    repository: configOptions.sourceControl?.repository,
    revision: configOptions.sourceControl?.revision,
    buildApiRootUrl: configOptions?.endpoint,
    logLevel: configOptions?.logLevel
  }

  for (const [key, value] of Object.entries(buildOptions)) {
    if (value === undefined) {
      delete buildOptions[key as keyof typeof buildOptions]
    }
  }

  return buildOptions
}
