import { defineConfig } from "vitepress";

const softadastraCodeTheme = {
  name: "softadastra-code",
  type: "dark",
  colors: {
    "editor.background": "#0f151b",
    "editor.foreground": "#d7e2ee",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: {
        foreground: "#6a9955",
        fontStyle: "italic",
      },
    },
    {
      scope: ["string"],
      settings: {
        foreground: "#ce9178",
      },
    },
    {
      scope: ["constant.numeric", "constant.language"],
      settings: {
        foreground: "#b5cea8",
      },
    },
    {
      scope: ["keyword.control"],
      settings: {
        foreground: "#c586c0",
        fontStyle: "",
      },
    },
    {
      scope: ["keyword", "storage.type", "storage.modifier"],
      settings: {
        foreground: "#569cd6",
        fontStyle: "",
      },
    },
    {
      scope: ["entity.name.function", "support.function"],
      settings: {
        foreground: "#dcdcaa",
      },
    },
    {
      scope: ["entity.name.type", "support.type", "support.class"],
      settings: {
        foreground: "#4ec9b0",
      },
    },
    {
      scope: ["entity.name.namespace", "support.namespace"],
      settings: {
        foreground: "#4fc1ff",
      },
    },
    {
      scope: ["variable.other.member", "variable.parameter"],
      settings: {
        foreground: "#9cdcfe",
      },
    },
    {
      scope: ["keyword.operator", "punctuation"],
      settings: {
        foreground: "#8b949e",
      },
    },
    {
      scope: ["variable", "identifier"],
      settings: {
        foreground: "#d7e2ee",
      },
    },
  ],
};

export default defineConfig({
  lang: "en-US",

  title: "Softadastra Documentation",
  description:
    "Learn how to build reliable local-first applications with Softadastra.",

  base: "/",

  cleanUrls: true,

  lastUpdated: true,

  markdown: {
    html: true,
    lineNumbers: true,
    theme: {
      light: softadastraCodeTheme,
      dark: softadastraCodeTheme,
    },
  },

  head: [
    ["link", { rel: "icon", href: "/pwa/favicon.ico" }],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/pwa/favicon-16x16.png",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/pwa/favicon-32x32.png",
      },
    ],
    [
      "link",
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/pwa/apple-touch-icon.png",
      },
    ],
    ["link", { rel: "manifest", href: "/pwa/site.webmanifest" }],

    ["meta", { name: "theme-color", content: "#11181b" }],
    ["meta", { name: "color-scheme", content: "dark light" }],
    ["meta", { name: "mobile-web-app-capable", content: "yes" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      {
        name: "apple-mobile-web-app-title",
        content: "Softadastra Docs",
      },
    ],
    ["meta", { name: "application-name", content: "Softadastra Docs" }],

    [
      "meta",
      {
        name: "description",
        content:
          "Softadastra documentation for installing and using the Softadastra CLI, C++ SDK, and JavaScript SDK to build reliable local-first applications.",
      },
    ],
    [
      "meta",
      {
        name: "keywords",
        content:
          "Softadastra, Softadastra CLI, Softadastra SDK, C++ SDK, JavaScript SDK, local-first, offline-first, sync, WAL, local storage, reliable applications",
      },
    ],
    ["meta", { name: "author", content: "Softadastra" }],
    ["meta", { name: "robots", content: "index, follow" }],

    ["link", { rel: "canonical", href: "https://docs.softadastra.com/" }],

    ["meta", { property: "og:type", content: "website" }],
    [
      "meta",
      {
        property: "og:site_name",
        content: "Softadastra Documentation",
      },
    ],
    ["meta", { property: "og:title", content: "Softadastra Documentation" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Install the Softadastra CLI and SDKs, then build reliable local-first applications.",
      },
    ],
    ["meta", { property: "og:url", content: "https://docs.softadastra.com/" }],
    [
      "meta",
      {
        property: "og:image",
        content: "https://docs.softadastra.com/pwa/icon-512.png",
      },
    ],
    ["meta", { property: "og:image:width", content: "512" }],
    ["meta", { property: "og:image:height", content: "512" }],
    [
      "meta",
      {
        property: "og:image:alt",
        content: "Softadastra Documentation",
      },
    ],

    ["meta", { name: "twitter:card", content: "summary" }],
    ["meta", { name: "twitter:title", content: "Softadastra Documentation" }],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Install the Softadastra CLI and SDKs, then build reliable local-first applications.",
      },
    ],
    [
      "meta",
      {
        name: "twitter:image",
        content: "https://docs.softadastra.com/pwa/icon-512.png",
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
        text: "Start",
        collapsed: false,
        items: [
          {
            text: "Welcome",
            link: "/welcome",
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
        text: "CLI",
        collapsed: false,
        items: [
          {
            text: "Overview",
            link: "/cli/",
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
        text: "C++ SDK",
        collapsed: false,
        items: [
          {
            text: "Overview",
            link: "/sdk-cpp/",
          },
          {
            text: "Install",
            link: "/sdk-cpp/installation",
          },
          {
            text: "First App",
            link: "/sdk-cpp/quick-start",
          },
          {
            text: "Client",
            link: "/sdk-cpp/client",
          },
          {
            text: "Options",
            link: "/sdk-cpp/client-options",
          },
          {
            text: "Store",
            link: "/sdk-cpp/local-store",
          },
          {
            text: "Persistence",
            link: "/sdk-cpp/persistent-store",
          },
          {
            text: "Recovery",
            link: "/sdk-cpp/restart-recovery",
          },
          {
            text: "Sync",
            link: "/sdk-cpp/sync-state",
          },
          {
            text: "Tick",
            link: "/sdk-cpp/tick",
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
            link: "/sdk-cpp/results-and-errors",
          },
          {
            text: "Examples",
            link: "/sdk-cpp/examples",
          },
        ],
      },

      {
        text: "JavaScript SDK",
        collapsed: false,
        items: [
          {
            text: "Overview",
            link: "/sdk-js/",
          },
          {
            text: "Install",
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
            text: "Options",
            link: "/sdk-js/client-options",
          },
          {
            text: "Store",
            link: "/sdk-js/local-store",
          },
          {
            text: "Persistence",
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
        text: "Guides",
        collapsed: true,
        items: [
          {
            text: "Overview",
            link: "/guides/",
          },
          {
            text: "Build an App",
            link: "/guides/build-offline-first-app",
          },
          {
            text: "Run a Node",
            link: "/guides/run-local-node",
          },
          {
            text: "Persist Data",
            link: "/guides/persist-data-locally",
          },
          {
            text: "Sync Nodes",
            link: "/guides/sync-between-nodes",
          },
          {
            text: "Production",
            link: "/guides/production",
          },
        ],
      },

      {
        text: "Reference",
        collapsed: true,
        items: [
          {
            text: "Overview",
            link: "/reference/",
          },
          {
            text: "CLI",
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
        text: "Releases",
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

      {
        text: "Internal Architecture",
        collapsed: true,
        items: [
          {
            text: "Engine",
            link: "/engine/",
          },
          {
            text: "Architecture",
            link: "/engine/architecture",
          },
          {
            text: "Runtime",
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
        link: "https://x.com/softadastra",
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
