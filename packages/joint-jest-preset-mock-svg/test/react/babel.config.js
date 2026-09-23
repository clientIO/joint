// Only here to let Jest read the TSX of this suite; it is not part of the
// preset, and a consumer brings whatever transform they already use.
module.exports = {
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' }}],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
    ],
};
