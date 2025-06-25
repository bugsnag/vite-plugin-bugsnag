interface Logger {
  debug: (message: string) => void
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

export interface BaseConfig {
  apiKey: string
  appVersion?: string
  path?: string
  endpoint?: string
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  logger?: Logger
}

export interface BuildReporterConfig extends BaseConfig {
  autoAssignRelease?: boolean
  builderName?: string
  metadata?: object
  releaseStage?: string
  sourceControl?: {
    provider?: string
    repository?: string
    revision?: string
  }
}

export interface SourceMapUploaderConfig extends BaseConfig {
  base?: string // baseURL
  codeBundleId?: string
  projectRoot?: string
  overwrite?: boolean
}
