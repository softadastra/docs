import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "en-US",

  title: "Softadastra Documentation",
  description:
    "Learn how to build local-first and offline-first applications with Softadastra.",

  base: "/",

  cleanUrls: true,

  lastUpdated: true,

  markdown: {
    html: true,
    lineNumbers: true,
  },

  head: [
    ["link", { rel: "icon", href: "/assets/pwa/favicon.ico" }],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/assets/pwa/favicon-16x16.png",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/assets/pwa/favicon-32x32.png",
      },
    ],
    [
      "link",
      {
        rel: "apple-touch-icon",
        href: "/assets/pwa/apple-touch-icon.png",
      },
    ],

    ["meta", { name: "theme-color", content: "#0b0e14" }],
    ["meta", { name: "mobile-web-app-capable", content: "yes" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      {
        name: "apple-mobile-web-app-title",
        content: "Softadastra Docs",
      },
    ],

    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "Softadastra Documentation" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Learn how to build local-first and offline-first applications with Softadastra.",
      },
    ],
    [
      "meta",
      { property: "og:site_name", content: "Softadastra Documentation" },
    ],

    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "Softadastra Documentation" }],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Learn how to build local-first and offline-first applications with Softadastra.",
      },
    ],
  ],

  vite: {
    optimizeDeps: {
      include: ["mark.js", "minisearch"],
    },

    ssr: {
      noExternal: ["mark.js"],
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("minisearch")) {
              return "minisearch";
            }

            if (id.includes("mark.js")) {
              return "markjs";
            }

            return "vendor";
          },
        },
      },
    },
  },

  themeConfig: {
    siteTitle: false,
    logo: false,
    nav: [],

    appearance: true,

    sidebar: [
      {
        text: "The Softadastra Book",
        collapsed: false,
        items: [
          {
            text: "Introduction",
            link: "/",
          },
          {
            text: "What is Softadastra?",
            link: "/what-is-softadastra",
          },
          {
            text: "Installation",
            link: "/installation",
          },
          {
            text: "Quick Start",
            link: "/quick-start",
          },
        ],
      },

      {
        text: "Part I. Concepts",
        collapsed: false,
        items: [
          {
            text: "Overview",
            link: "/concepts/",
          },
          {
            text: "Offline-first",
            link: "/concepts/offline-first",
          },
          {
            text: "Local-first",
            link: "/concepts/local-first",
          },
          {
            text: "Failure Model",
            link: "/concepts/failure-model",
          },
          {
            text: "Write-Ahead Log",
            link: "/concepts/wal",
          },
          {
            text: "Outbox",
            link: "/concepts/outbox",
          },
          {
            text: "Sync Engine",
            link: "/concepts/sync-engine",
          },
          {
            text: "Convergence",
            link: "/concepts/convergence",
          },
        ],
      },

      {
        text: "Part II. CLI",
        collapsed: false,
        items: [
          {
            text: "Overview",
            link: "/cli/",
          },
          {
            text: "Installation",
            link: "/cli/installation",
          },
          {
            text: "Commands",
            link: "/cli/commands",
          },
          {
            text: "Interactive Mode",
            link: "/cli/interactive-mode",
          },
          {
            text: "Node",
            link: "/cli/node",
          },
          {
            text: "Store",
            link: "/cli/store",
          },
          {
            text: "Sync",
            link: "/cli/sync",
          },
          {
            text: "Peers",
            link: "/cli/peers",
          },
          {
            text: "Reference",
            link: "/cli/reference",
          },
        ],
      },

      {
        text: "Part III. SDK C++",
        collapsed: false,
        items: [
          {
            text: "Overview",
            link: "/sdk-cpp/",
          },
          {
            text: "Installation",
            link: "/sdk-cpp/installation",
          },
          {
            text: "First App",
            link: "/sdk-cpp/first-app",
          },
          {
            text: "Client",
            link: "/sdk-cpp/client",
          },
          {
            text: "Client Options",
            link: "/sdk-cpp/client-options",
          },
          {
            text: "Local Store",
            link: "/sdk-cpp/local-store",
          },
          {
            text: "Persistent Store",
            link: "/sdk-cpp/persistent-store",
          },
          {
            text: "Sync",
            link: "/sdk-cpp/sync",
          },
          {
            text: "Transport",
            link: "/sdk-cpp/transport",
          },
          {
            text: "Discovery",
            link: "/sdk-cpp/discovery",
          },
          {
            text: "Metadata",
            link: "/sdk-cpp/metadata",
          },
          {
            text: "Errors",
            link: "/sdk-cpp/errors",
          },
          {
            text: "Examples",
            link: "/sdk-cpp/examples",
          },
        ],
      },

      {
        text: "Part IV. SDK JS",
        collapsed: false,
        items: [
          {
            text: "Overview",
            link: "/sdk-js/",
          },
          {
            text: "Installation",
            link: "/sdk-js/installation",
          },
          {
            text: "First App",
            link: "/sdk-js/first-app",
          },
          {
            text: "Client",
            link: "/sdk-js/client",
          },
          {
            text: "Client Options",
            link: "/sdk-js/client-options",
          },
          {
            text: "Local Store",
            link: "/sdk-js/local-store",
          },
          {
            text: "Persistent Store",
            link: "/sdk-js/persistent-store",
          },
          {
            text: "Sync",
            link: "/sdk-js/sync",
          },
          {
            text: "Transport",
            link: "/sdk-js/transport",
          },
          {
            text: "Discovery",
            link: "/sdk-js/discovery",
          },
          {
            text: "Metadata",
            link: "/sdk-js/metadata",
          },
          {
            text: "Errors",
            link: "/sdk-js/errors",
          },
          {
            text: "Examples",
            link: "/sdk-js/examples",
          },
        ],
      },

      {
        text: "Part V. Engine",
        collapsed: true,
        items: [
          {
            text: "Overview",
            link: "/engine/",
          },
          {
            text: "Architecture",
            link: "/engine/architecture",
          },
          {
            text: "Runtime Flow",
            link: "/engine/runtime-flow",
          },
          {
            text: "Modules",
            link: "/engine/modules",
          },
          {
            text: "Core",
            link: "/engine/core",
          },
          {
            text: "Filesystem",
            link: "/engine/fs",
          },
          {
            text: "WAL",
            link: "/engine/wal",
          },
          {
            text: "Store",
            link: "/engine/store",
          },
          {
            text: "Sync",
            link: "/engine/sync",
          },
          {
            text: "Transport",
            link: "/engine/transport",
          },
          {
            text: "Discovery",
            link: "/engine/discovery",
          },
          {
            text: "Metadata",
            link: "/engine/metadata",
          },
          {
            text: "CLI Framework",
            link: "/engine/cli",
          },
        ],
      },

      {
        text: "Part VI. Guides",
        collapsed: true,
        items: [
          {
            text: "Overview",
            link: "/guides/",
          },
          {
            text: "Build an Offline-first App",
            link: "/guides/build-offline-first-app",
          },
          {
            text: "Run a Local Node",
            link: "/guides/run-local-node",
          },
          {
            text: "Persist Data Locally",
            link: "/guides/persist-data-locally",
          },
          {
            text: "Sync Between Nodes",
            link: "/guides/sync-between-nodes",
          },
          {
            text: "Use the C++ SDK with the Engine",
            link: "/guides/use-cpp-sdk-with-engine",
          },
          {
            text: "Use the JS SDK with the Engine",
            link: "/guides/use-js-sdk-with-engine",
          },
          {
            text: "Production",
            link: "/guides/production",
          },
        ],
      },

      {
        text: "Part VII. Reference",
        collapsed: true,
        items: [
          {
            text: "Overview",
            link: "/reference/",
          },
          {
            text: "CLI Reference",
            link: "/reference/cli",
          },
          {
            text: "C++ API",
            link: "/reference/cpp-api",
          },
          {
            text: "JavaScript API",
            link: "/reference/js-api",
          },
          {
            text: "Configuration",
            link: "/reference/config",
          },
          {
            text: "Errors",
            link: "/reference/errors",
          },
        ],
      },

      {
        text: "Part VIII. Releases",
        collapsed: true,
        items: [
          {
            text: "Overview",
            link: "/releases/",
          },
          {
            text: "Changelog",
            link: "/releases/changelog",
          },
          {
            text: "Builds",
            link: "/releases/builds",
          },
        ],
      },
    ],

    search: {
      provider: "local",
      options: {
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
          },
        },
      },
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/softadastra",
      },
      {
        icon: "x",
        link: "https://x.com/",
      },
    ],

    outline: {
      level: "deep",
      label: "On this page",
    },

    returnToTopLabel: "Back to top",

    lastUpdated: {
      text: "Last updated",
      formatOptions: {
        dateStyle: "medium",
        timeStyle: "short",
      },
    },

    editLink: {
      pattern: "https://github.com/softadastra/docs/edit/main/:path",
      text: "Edit this page on GitHub",
    },

    docFooter: {
      prev: "Previous page",
      next: "Next page",
    },

    footer: {
      message: "Released under the Apache License 2.0.",
      copyright: "Copyright © 2026 Softadastra",
    },
  },
});
