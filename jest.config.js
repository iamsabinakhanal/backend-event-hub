module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    maxWorkers: 1,
    roots: ['<rootDir>/src'],
    testMatch: ['**/_test_/**/*_test.ts', '**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/_test_/**',
    ],
    testTimeout: 30000,
    setupFilesAfterEnv: ['<rootDir>/src/_test_/setup.ts'],
    globals: {
        'ts-jest': {
            tsconfig: {
                isolatedModules: true,
            },
        },
    },
};
