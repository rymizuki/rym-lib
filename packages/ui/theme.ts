import { Config } from '@pandacss/dev'

const theme: Config['theme'] = {
  extend: {
    tokens: {
      colors: {},
    },
    semanticTokens: {
      sizes: {
        container: {
          width: { value: '1185px' },
        },
      },
      colors: {
        brand: {
          bg: {
            value: '{colors.sky.900}',
          },
          font: {
            value: '{colors.white}',
          },
        },
        text: {
          default: {
            value: '{colors.black}',
          },
          primary: {
            value: '{colors.blue.600}',
          },
          danger: {
            value: '{colors.red.500}',
          },
          inactive: {
            value: '{colors.gray.600}',
          },
        },
      },
    },
    keyframes: {
      progress: {
        '0%': { width: 0 },
        '100%': { width: '100%' },
      },
    },
  },
}

export default theme
