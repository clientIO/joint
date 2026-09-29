module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/src/setup.ts'],
    moduleNameMapper: {
        '^@joint/mock-svg$': '<rootDir>/../../src/index.ts',
    },
    transformIgnorePatterns: ['node_modules/(?!@joint/)'],
};
