/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    mount: {
        "src/": '/'
    },
    plugins: [
      '@prefresh/snowpack',
      ['@snowpack/plugin-typescript', '--project tsconfig.web.json'],
    ],
    packageOptions: {
        installTypes: true,
        polyfillNode: true,
    },
    buildOptions: {
        out: 'public'
    },
  };
  