import { CommandModule } from 'yargs'
import { execSync, git, cleanExit } from '@percolate/cli-utils'
import { basename, resolve } from 'path'
import { getHash, getBranch, getRepoName } from '../defaults'

interface IReleaseOpts {
    branch: string
    repo: string
    version: string
}

const SENTRY_CLI = resolve(__dirname, '../../node_modules/.bin/sentry-cli')

export const releaseCmd: CommandModule<{}, IReleaseOpts> = {
    command: 'release',
    describe: 'Create and finalize a Sentry release',
    builder: argv => {
        return argv
            .version(false)
            .option('branch', {
                default: getBranch(),
                desc: 'Git branch',
                require: true,
            })
            .option('version', {
                default: getHash(),
                desc: 'Release version',
                require: true,
            })
            .option('repo', {
                default: getRepoName(),
                desc: 'Repository name',
                require: true,
            })
    },
    handler: argv => {
        const { branch, repo, version } = argv

        if (!git.isMaster(branch)) return cleanExit('releases only run on master')

        const project = basename(repo)
        execSync(`${SENTRY_CLI} releases --project ${project} set-commits "${version}" --auto`, {
            verbose: true,
        })
        execSync(`${SENTRY_CLI} releases --project ${project} finalize "${version}"`, {
            verbose: true,
        })
    },
}
