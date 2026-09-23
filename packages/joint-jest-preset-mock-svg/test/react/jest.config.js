// The preset under test. Everything the mocks need - the jsdom environment and
// the `setupFiles` entry that installs them - comes from it, which is the point
// this suite is making: a consumer adds one line and nothing else.
module.exports = {
    preset: '@joint/jest-preset-mock-svg',
};
