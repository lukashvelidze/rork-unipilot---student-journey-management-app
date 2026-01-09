module.exports = ({ config }) => {
  const appStoreConfig = config.extra?.appStore ?? {};
  const appStoreProducts = appStoreConfig.products ?? {};

  return {
    ...config,
    extra: {
      ...config.extra,
      appStore: {
        sharedSecret:
          process.env.APP_STORE_CONNECT_SHARED_SECRET || appStoreConfig.sharedSecret,
        products: {
          basic: process.env.APP_STORE_PRODUCT_ID_BASIC || appStoreProducts.basic,
          standard: process.env.APP_STORE_PRODUCT_ID_STANDARD || appStoreProducts.standard,
          pro: process.env.APP_STORE_PRODUCT_ID_PRO || appStoreProducts.pro,
        },
      },
    },
  };
};
