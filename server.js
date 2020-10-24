require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const next = require('next');
const Router = require('koa-router');
const session = require('koa-session');

const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const { default: graphQLProxy } = require('@shopify/koa-shopify-graphql-proxy');
const { ApiVersion } = require('@shopify/koa-shopify-graphql-proxy');
const { receiveWebhook, registerWebhook } = require('@shopify/koa-shopify-webhooks');

const getSubscriptionUrl = require('./server/getSubscriptionUrl');

dotenv.config();

const {
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_API_KEY,
  PORT,
  NODE_ENV,
  HOST,
  PRODUCT_TITLE,
  PRODUCT_DESCRIPTION,
  PRODUCT_PRICE,
  PRODUCT_CAMPAREATPRICE
} = process.env;

console.log(PRODUCT_TITLE, PRODUCT_CAMPAREATPRICE, PRODUCT_DESCRIPTION, PRODUCT_PRICE);
const port = parseInt(PORT, 10) || 4040;
const dev = NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();


app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();
  server.use(session({ secure: true, sameSite: 'none' }, server));
  server.keys = [SHOPIFY_API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: ['read_products', 'write_products'],
      async afterAuth(ctx) {
        const { shop, accessToken } = ctx.session;
        ctx.cookies.set('shopOrigin', shop, {
          httpOnly: false,
          secure: true,
          sameSite: 'none'
        });

        const registration = await registerWebhook({
          address: `${HOST}/webhooks/products/create`,
          topic: 'PRODUCTS_CREATE',
          accessToken,
          shop,
          apiVersion: ApiVersion.October19
        });

        if (registration.success) {
          console.log('Successfully registered webhook!');
        } else {
          console.log('Failed to register webhook', registration.result);
        }
        await getSubscriptionUrl(ctx, accessToken, shop);
      }
    })
  );

  const webhook = receiveWebhook({ secret: SHOPIFY_API_SECRET_KEY });

  router.post('/webhooks/products/create', webhook, (ctx) => {
    console.log('received webhook: ', ctx.state.webhook);
  });

  server.use(graphQLProxy({ version: ApiVersion.January20 }));
  router.get('*', verifyRequest(), async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });
  server.use(router.allowedMethods());
  server.use(router.routes());

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  });
});