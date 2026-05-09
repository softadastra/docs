import DefaultTheme from "vitepress/theme";
import "./custom.css";

import Layout from "./Layout.vue";
import DocsHomeHero from "./DocsHomeHero.vue";
import CodeTabs from "./CodeTabs.vue";

export default {
  ...DefaultTheme,
  Layout,

  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx);

    const { app } = ctx;

    app.component("DocsHomeHero", DocsHomeHero);
    app.component("CodeTabs", CodeTabs);

    if (typeof window === "undefined") {
      return;
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.addEventListener("load", () => {
      window.scrollTo(0, 0);
    });
  },
};
