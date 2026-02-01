module.exports = {
  plugins: ['@eslint-react/eslint-plugin'],
  rules: {
    '@eslint-react/no-raw-html-elements': 'off', // We'll use a simpler approach
  },
  overrides: [
    {
      files: ['*.tsx', '*.jsx'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: 'JSXElement[openingElement.name.name="button"]:not([openingElement.name.name="Button"])',
            message: 'Use <Button> from @workspace/ui instead of raw <button> elements',
          },
          {
            selector: 'JSXElement[openingElement.name.name="input"]',
            message: 'Use <Input> from @workspace/ui instead of raw <input> elements',
          },
          {
            selector: 'JSXElement[openingElement.name.name="select"]',
            message: 'Use <Select> from @workspace/ui instead of raw <select> elements',
          },
          {
            selector: 'JSXElement[openingElement.name.name="textarea"]',
            message: 'Use <Textarea> from @workspace/ui instead of raw <textarea> elements',
          },
        ],
      },
    },
  ],
};
