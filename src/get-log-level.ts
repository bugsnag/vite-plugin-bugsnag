// re-map the log level option to match the bugsnag-cli log level
const getLogLevel = (logLevel: string | undefined) => {
  if (logLevel === 'error') {
    return 'fatal'
  }
  return logLevel
}

export default getLogLevel