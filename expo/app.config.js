module.exports = ({ config }) => {
  const appStoreConfig = config.extra?.appStore ?? {};
  const appStoreProducts = appStoreConfig.products ?? {};

  return {
    ...config,
    extra: {
      ...config.extra,
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST || 'https://eu.i.posthog.com',
      appStore: {
        products: {
          basic: process.env.APP_STORE_PRODUCT_ID_BASIC || appStoreProducts.basic,
          standard: process.env.APP_STORE_PRODUCT_ID_STANDARD || appStoreProducts.standard,
          pro: process.env.APP_STORE_PRODUCT_ID_PRO || appStoreProducts.pro,
        },
      },
    },
  };
};
