import { Config } from '@jest/types'
import { config } from './config'
import { root } from './root'

/**
 * Jest base config with sensible defaults and CI setup
 *
 * ```js
 *  module.exports = {
 *    ...require('@percolate/kona').jest,
 *    // your project's config
 *  }
 * ```
 * */
export const jest: Partial<Config.InitialOptions> = {
    clearMocks: true,
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
    coverageDirectory: root(config.coverageDir),
    coverageReporters: ['text-summary', 'lcov', 'html'],
    globals: {
        TEST: true,
        'ts-jest': {
            // disable type checking by default so we can test code that isn't perfectly typed
            isolatedModules: true,
        },
    },
    reporters: process.env['CI']
        ? [
              'default',
              [
                  'jest-junit',
                  { output: root(config.coverageDir, 'junit.xml'), suiteNameTemplate: '{filepath}' },
              ],
          ]
        : undefined,
    resetMocks: true,
    testMatch: ['**/*.spec.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tmp/'],
    watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
}
