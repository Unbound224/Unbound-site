# Try it

The hosted services run on free Render instances and a free Vercel project. They sleep when idle, so the first request after a pause can take 50 seconds or more.

| Service | URL |
|---|---|
| Landing page and consoles | `https://unbound-web1.vercel.app` |
| Core API | `https://unbound-core.onrender.com` |
| Stellar gateway | `https://unbound-gateway.onrender.com` (needs a service token; not public) |

{% hint style="info" %}
The hosted core is a **development entrypoint** (`APP_ENV=development`). It refuses to start in any other mode because no hardened production mode exists yet. Its data resets on every redeploy.
{% endhint %}

## Read the public endpoints

These calls need no account. They were run against the hosted core when this page was written.

```bash
curl https://unbound-core.onrender.com/healthz
```

```json
{ "status": "ok", "paused": false }
```

`paused` turns `true` when a reconciliation discrepancy has paused sensitive actions.

```bash
curl https://unbound-core.onrender.com/v1/assets
curl https://unbound-core.onrender.com/v1/targets
```

```json
{ "assets": [] }
{ "targets": [] }
```

Both lists are empty on the hosted instance because nobody has registered a program there since its last restart. To see populated responses, run the stack locally and seed it. The [local setup](../developers/local-setup.md) page shows how, and the [API reference](../api/overview.md) shows every response with real data.

## Try the landing page and consoles

- `https://unbound-web1.vercel.app` is the public landing page.
- `/merchant` is the merchant console (sign in, redemption queue, escrow signing).
- `/merchant/apply` is the merchant application form.
- `/admin` is the reviewer console (merchant review queue, disputes, job status).

The consoles talk to core through a same-origin proxy at `/core/*`. That is why the browser never needs a CORS rule for core.

## Run it all locally

The full walkthrough, with the exact commands and environment variables for core, the gateway, the site and synthetic seed data, is in [Local setup](../developers/local-setup.md).
