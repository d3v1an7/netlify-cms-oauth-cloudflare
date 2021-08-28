# netlify-cms-oauth-cloudflare

This project will spin a CloudFlare worker to handle GitHub Oauth for your Netlify CMS.

At the moment, it has a few hardcoded variables referencing my own domain, but at some point I'd like to make this instantly reusable.

## Installation

### Getting started

Fork and clone this project, and install the CloudFlare CLI tool, `wrangler`:

```
npm i @cloudflare/wrangler -g
```

Then authenticate `wrangler` to link the CLI with your CloudFlare account:

```
wrangler login
```

### 1. Update `wrangler.toml`

I'm using my own domain instead of the worker dev URLs, so I needed to fill in `zone_id` and `routes`.
The `zone_id` value can be found on the landing page for your domain in Cloudflare in the right panel, under the heading API.

If you're wondering where the routes end up, check your domain again after publishing and click on **Workers** in the nav.

If you'd prefer to just use the worker dev URL (something like `your-project-name.your-worker-subdomain.workers.dev`), switch `workers_dev` to `true`, and remove `account_id`, `zone_id` and `routes`.

### 2. Create an Oauth app in GitHub

Log into GitHub, and set up a new Oauth app: https://github.com/settings/developers

- **Application name**  
When the user logs in, the GitHub popup will display "Sign in to GitHub to continue to `Application Name`" and once they have logged in, the next window wll show "Authorize `Application Name`". So to avoid confusion, the name should ideally include something about the Netlify CMS.
- **Homepage URL**  
Although this is required, it does not seem to be used. You can use the same URL as `Authorization callback URL`.
- **Authorization callback URL**  
This is the important one. If you're setting this up against your domain, the it's just the domain name. (i.e. `https://your-domiain.com`).  
If you're planning on using the dev worker URL, you won't have that yet. That's okay! Just add `http://localhost` or something temp for now. At this point, we really just need the `CLIENT_ID` and `CLIENT_SECRET`. You should come back and update this URL after the `wrangler publish` step that will generate a worker URL for you.

### 3. Add the GitHub secrets to the worker

Grab your Client ID, and generate a new client secret.

Be careful when copying the values, and triple check there isn't extra whitespace at the start or end of the secret.

```
wrangler secret put CLIENT_ID
wrangler secret put CLIENT_SECRET
```

### 4. Publish the worker

```
wrangler publish
```

### 5. Update your Netlify CMS config

Your config should look something like this:

```
backend:
  name: github
  repo: your-github-username/your-project-name
  branch: main
  base_url: https://your-domain.com
```

Replace `base_url` with your own domain (where the routes are set up), or the worker dev URL.

### 6. Confirm you can log in

Visit the `/admin/` of your Netlify CMS, and you should see a **Login with GitHub** button.

When you click on that, a popup will open asking you to log into GitHub. Once you've logged in, the popup will close, and you should be redirected to the Netlify CMS admin interface.

You can also confirm your Oauth app appears in your GitHub Authorized Oauth Apps here: https://github.com/settings/applications

If not, start over from the top and confirm you've followed all steps -- being especially careful with the copy/paste of `CLIENT_ID` and `CLIENT_SECRET`.

## Credits

Heavily inspired by https://github.com/gr2m/cloudflare-worker-github-oauth-login and https://github.com/ublabs/netlify-cms-oauth.