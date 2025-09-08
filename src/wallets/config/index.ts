import * as gaia from './gaia'
import * as noble from './noble'
import * as osmo from './osmo'
import * as thor from './thor'

export const main = [gaia.main, thor.main, osmo.main]
export const stage = [gaia.stage, thor.stage, osmo.stage]
export const dev = [gaia.dev, noble.dev, thor.dev, osmo.dev]
