# ReactPress Theme Starter

<div align="center">

<a href="https://reactpress.cc/">
  <img src="./public/logo.png" alt="ReactPress" width="480" />
</a>

<br />

**Ship the public site. Leave the CMS to ReactPress.**

<br />

<a href="https://reactpress-theme-starter.vercel.app">
  <img src="./public/home-dark.png" alt="ReactPress Theme Starter preview" width="100%" />
</a>

<br />

[Docs](https://reactpress.cc/) ·
[Live Demo](https://reactpress-theme-starter.vercel.app) ·
[ReactPress](https://github.com/reactpressjs/reactpress) ·
[简体中文](./README_zh.md)

<br />

<img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="MIT License" />
<a href="https://github.com/reactpressjs/reactpress-theme-starter/stargazers">
  <img src="https://img.shields.io/github/stars/reactpressjs/reactpress-theme-starter?style=flat-square&logo=github" alt="GitHub stars" />
</a>

</div>

---

The official public-facing site for [ReactPress](https://github.com/reactpressjs/reactpress) — ready-made blog, pages, and knowledge base your readers see, while you manage content in the ReactPress console.

---

## Why this theme

- **Publish with confidence** — articles, archives, search, pages, knowledge base, and comments out of the box
- **Look like your brand** — colors, logo, and navigation controlled from the ReactPress admin
- **Dark & light** — comfortable reading day or night
- **Discoverable** — RSS, sitemap, and share-friendly previews
- **Try before you commit** — preview with sample content; no CMS install required
- **Fast by default** — Lighthouse **95 / 100 / 100 / 100**

---

## See it live

[Open the live demo →](https://reactpress-theme-starter.vercel.app)

Or deploy your own copy in one click (sample content, no setup):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Freactpressjs%2Freactpress-theme-starter&project-name=reactpress-theme&repository-name=reactpress-theme&demo-title=ReactPress%20Theme%20Starter&demo-description=Headless%20blog%20with%20mock%20mode%20%E2%80%94%20no%20backend%20required&demo-url=https%3A%2F%2Freactpress-theme-starter.vercel.app&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2Freactpressjs%2Freactpress-theme-starter%2Fmaster%2Fpublic%2Fhome-dark.png)

---

## Try it locally (about a minute)

```bash
npx create-next-app@latest reactpress-theme-starter \
  --example "https://github.com/reactpressjs/reactpress-theme-starter" \
  --use-pnpm
cd reactpress-theme-starter
pnpm dev:mock
```

Open **http://localhost:3001** — you’ll get a full site with sample posts so you can explore the design right away.

Prefer cloning?

```bash
git clone https://github.com/reactpressjs/reactpress-theme-starter.git
cd reactpress-theme-starter
pnpm install
pnpm dev:mock
```

---

## Run the full product

Want the public site **plus** admin and content API? Install ReactPress once:

```bash
npm install -g reactpressjs
mkdir my-site && cd my-site
reactpress init
```

| What you’ll open | Address                      |
| :--------------- | :--------------------------- |
| Your site        | http://localhost:3001        |
| Admin console    | http://localhost:3001/admin/ |

Default login: `admin` / `admin` — change it before going live. Need a health check? Run `reactpress doctor`.

More in the [docs](https://reactpress.cc/).

<div align="center">

<img src="./public/cli.png" alt="ReactPress setup menu" width="100%" />

</div>

---

## Performance

Built for readers first — quick first paint, accessible layout, solid SEO.

<div align="center">

<img src="./public/lighthouse.png" alt="Lighthouse: Performance 95, Accessibility 100, Best Practices 100, SEO 100" width="720" />

</div>

| Category       | Score   |
| :------------- | :------ |
| Performance    | **95**  |
| Accessibility  | **100** |
| Best Practices | **100** |
| SEO            | **100** |

---

## FAQ

<details>
<summary><strong>Do I need ReactPress just to look around?</strong></summary>

No. Use `pnpm dev:mock` or the [live demo](https://reactpress-theme-starter.vercel.app). Install ReactPress when you’re ready to write real content and use the admin.

```bash
npm install -g reactpressjs
```

</details>

<details>
<summary><strong>Can I change the look and layout?</strong></summary>

Yes. The theme is MIT-licensed — restyle it, rearrange pages, or keep the defaults and brand it from the ReactPress console (colors, logo, nav).

</details>

<details>
<summary><strong>How do I go from demo to production?</strong></summary>

1. Run ReactPress (`npm install -g reactpressjs` → `reactpress init`)
2. Point this theme at your live content
3. Deploy the site (e.g. Vercel) and keep the CMS where you host ReactPress

Step-by-step guides: [reactpress.cc](https://reactpress.cc/).

</details>

<details>
<summary><strong>Where should I ask questions or report issues?</strong></summary>

Theme & this repo → [GitHub Issues](https://github.com/reactpressjs/reactpress-theme-starter/issues).  
ReactPress product (CMS, admin, CLI) → [reactpressjs/reactpress](https://github.com/reactpressjs/reactpress/issues).

</details>

---

## Explore more

|                                                      |                                      |
| :--------------------------------------------------- | :----------------------------------- |
| [ReactPress](https://github.com/reactpressjs/reactpress) | CMS, admin, CLI, plugins & desktop |
| [Documentation](https://reactpress.cc/)              | Guides and product overview          |
| [`reactpressjs` on npm](https://www.npmjs.com/package/reactpressjs) | `npm install -g reactpressjs` |

---

## Contributing

Ideas and PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) · [中文](./CONTRIBUTING_zh.md) · [Code of Conduct](./CODE_OF_CONDUCT.md) · [Security](./SECURITY.md).

## License

[MIT](./LICENSE) © reactpressjs
