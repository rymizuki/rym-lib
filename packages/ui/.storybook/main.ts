import tsconfigPaths from 'vite-tsconfig-paths'

import { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: (config) => {
    config.plugins = [...(config.plugins ?? []), tsconfigPaths()]
    return config
  },
}
export default config
