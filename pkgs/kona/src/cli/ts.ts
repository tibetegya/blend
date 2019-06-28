import { CommandModule } from 'yargs'
import { getAbsFilePaths } from '../utils/fs'
import { root } from '../root'
import { config, logDefault } from '../config'
import mm from 'micromatch'
import { resolve, relative } from 'path'
import Bluebird from 'bluebird'
import { getMaxCpus } from '../utils/getMaxCpus'
import { forceExit } from '../utils/forceExit'
import { spawn } from 'child_process'
import { BIN_DIR } from '../constants'

export const tsCmd: CommandModule = {
    command: 'ts',
    describe: 'Run type checking only',
    handler: async () => {
        const cwd = process.cwd()
        let { tsConfigs } = config
        let absConfigBlobs: string[]
        if (tsConfigs.length) {
            absConfigBlobs = tsConfigs.map(path => root(path))
        } else {
            tsConfigs = [resolve(cwd, 'tsconfig.json')]
            absConfigBlobs = tsConfigs
            logDefault('tsConfigs', tsConfigs)
        }
        const configPaths = getAbsFilePaths(root(), {
            filterPaths: [cwd],
        }).filter(path => mm.any(path, absConfigBlobs))

        if (!configPaths.length) {
            return console.log(
                `No tsconfig files found matching "${tsConfigs}" in "${relative(root(), cwd)}"`
            )
        }

        const exitCodes = await Bluebird.map(configPaths, typeCheck, {
            concurrency: getMaxCpus(),
        })
        const errorCodes = exitCodes.filter(code => code > 0)
        if (errorCodes.length) forceExit(`total errors: ${errorCodes.length}`)
    },
}

function typeCheck(tsConfig: string) {
    return new Promise<number>(success => {
        console.log(`Type checking ${tsConfig}...`)
        const child = spawn(resolve(BIN_DIR, 'tsc'), ['--project', tsConfig, '--noEmit'], {
            shell: true,
            stdio: 'inherit',
        })
        child.on('exit', (code, abortSignal) => {
            if (abortSignal === 'SIGABRT') code = 1
            success(Number(code))
        })
    })
}
