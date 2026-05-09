<script setup>
import { onMounted, ref } from "vue";

const showBanner = ref(true);
const isDark = ref(true);

const links = [
  {
    text: "Guides",
    href: "/guides/",
  },
  {
    text: "Engine",
    href: "/engine/",
  },
  {
    text: "SDKs",
    href: "/sdk-cpp/",
  },
];

const socials = [
  {
    label: "GitHub",
    href: "https://github.com/softadastra",
    icon: `<path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.39 6.84 9.75.5.1.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.9-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0 1 12 7.07c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.93-2.34 4.79-4.57 5.05.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .27.18.59.69.48A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"/>`,
  },
  {
    label: "X",
    href: "https://x.com/softadastra",
    icon: `<path d="M18.9 2H22l-6.8 7.8L23 22h-6.7l-5.2-6.8L5.3 22H2l7.3-8.4L1.7 2h6.9l4.7 6.1L18.9 2Zm-1.2 18h1.7L7.7 3.9H5.9L17.7 20Z"/>`,
  },
];

const openSearch = () => {
  const searchButton = document.querySelector(
    ".DocSearch-Button, .VPNavBarSearchButton, .VPLocalSearchBox button"
  );

  if (searchButton instanceof HTMLElement) {
    searchButton.click();
  }
};

const applyTheme = (dark) => {
  isDark.value = dark;

  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("vitepress-theme-appearance", dark ? "dark" : "light");
};

const toggleTheme = () => {
  applyTheme(!isDark.value);
};

onMounted(() => {
  const savedTheme = localStorage.getItem("vitepress-theme-appearance");

  if (savedTheme === "dark") {
    applyTheme(true);
    return;
  }

  if (savedTheme === "light") {
    applyTheme(false);
    return;
  }

  isDark.value = document.documentElement.classList.contains("dark");
});
</script>

<template>
  <header class="soft-nav">
  <div v-if="showBanner" class="soft-nav__banner">
    <span class="soft-nav__banner-mark" aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="soft-banner-vix-left" x1="5" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#d4fcd4" />
            <stop offset="55%" stop-color="#4ade80" />
            <stop offset="100%" stop-color="#22c55e" />
          </linearGradient>

          <linearGradient id="soft-banner-vix-right" x1="31" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#22c55e" />
            <stop offset="100%" stop-color="#15803d" />
          </linearGradient>
        </defs>

        <polygon points="5,6 12,6 18,28 14,28" fill="url(#soft-banner-vix-left)" />
        <polygon points="31,6 24,6 18,28 22,28" fill="url(#soft-banner-vix-right)" />
        <line
          x1="9"
          y1="16"
          x2="13.5"
          y2="29"
          stroke="#bbf7d0"
          stroke-width="1.1"
          stroke-linecap="round"
          opacity="0.7"
        />
      </svg>
    </span>

    <span>Vix.cpp docs moved to</span>
    <a href="https://vixcpp.com" target="_blank" rel="noreferrer">
      vixcpp.com
    </a>

    <button
      class="soft-nav__banner-close"
      type="button"
      aria-label="Close announcement"
      @click="showBanner = false"
    >
      <span aria-hidden="true">×</span>
    </button>
  </div>

    <div class="soft-nav__bar">
      <div class="soft-nav__inner">
        <a class="soft-nav__brand" href="/" aria-label="Softadastra Documentation">
          <span class="soft-nav__brand-name">Softadastra</span>
          <span class="soft-nav__slash">/</span>
          <span class="soft-nav__docs">Docs</span>
        </a>

        <nav class="soft-nav__links" aria-label="Main navigation">
          <a
            v-for="link in links"
            :key="link.text"
            class="soft-nav__link"
            :href="link.href"
          >
            {{ link.text }}
          </a>
        </nav>

        <div class="soft-nav__right">
          <button
            class="soft-nav__theme"
            type="button"
            :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
            @click="toggleTheme"
          >
            <svg v-if="isDark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 4V2" />
              <path d="M12 22v-2" />
              <path d="m4.93 4.93-1.41-1.41" />
              <path d="m20.48 20.48-1.41-1.41" />
              <path d="M4 12H2" />
              <path d="M22 12h-2" />
              <path d="m4.93 19.07-1.41 1.41" />
              <path d="m20.48 3.52-1.41 1.41" />
              <circle cx="12" cy="12" r="4" />
            </svg>

            <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8Z" />
            </svg>
          </button>

          <a
            v-for="item in socials"
            :key="item.label"
            class="soft-nav__icon"
            :href="item.href"
            target="_blank"
            rel="noreferrer"
            :aria-label="item.label"
          >
            <svg
              class="soft-nav__social-svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
              v-html="item.icon"
            ></svg>
          </a>

          <button class="soft-nav__search" type="button" aria-label="Search" @click="openSearch">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>

            <span>Search Docs</span>
            <kbd>Ctrl K</kbd>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.soft-nav {
  position: relative;
  z-index: 100;
  width: 100%;
  color: var(--soft-text-1, rgba(255, 255, 255, 0.94));
  background: var(--soft-bg, #11181b);
}

.soft-nav__banner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 46px;
  padding: 0 56px;
  color: rgba(255, 255, 255, 0.94);
  background: #202b43;
  border-bottom: 1px solid rgba(255, 255, 255, 0.075);
  font-size: 14px;
  font-weight: 650;
  line-height: 1;
}

.soft-nav__banner a {
  color: #ffffff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.soft-nav__banner-close {
  position: absolute;
  top: 50%;
  right: 18px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: rgba(255, 255, 255, 0.62);
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  transform: translateY(-50%);
}

.soft-nav__banner-close:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.soft-nav__banner-close span {
  font-size: 26px;
  line-height: 1;
}

.soft-nav__bar {
  height: 72px;
  background: var(--soft-bg, #11181b);
  border-bottom: 1px solid var(--soft-border, rgba(255, 255, 255, 0.075));
}

.soft-nav__inner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 34px;
  height: 100%;
  width: 100%;
  margin: 0 auto;
  padding: 0 18px;
}

.soft-nav__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: var(--soft-text-1, rgba(255, 255, 255, 0.94));
  text-decoration: none;
  white-space: nowrap;
}

.soft-nav__brand-name {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.04em;
}

.soft-nav__slash {
  color: var(--soft-text-2, rgba(190, 220, 242, 0.55));
  font-size: 21px;
  font-weight: 500;
}

.soft-nav__docs {
  color: var(--soft-text-1, #ffffff);
  font-size: 20px;
  font-weight: 720;
  letter-spacing: -0.03em;
}

.soft-nav__links {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 26px;
  min-width: 0;
}

.soft-nav__link {
  display: inline-flex;
  align-items: center;
  color: var(--soft-text-2, rgba(210, 229, 244, 0.88));
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.14s ease;
}

.soft-nav__link:hover {
  color: var(--soft-text-1, #ffffff);
}

.soft-nav__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
}

.soft-nav__theme,
.soft-nav__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: var(--soft-text-1, #ffffff) !important;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  opacity: 1 !important;
  transition:
    background 0.14s ease,
    border-color 0.14s ease,
    transform 0.14s ease;
}

.soft-nav__theme {
  border-radius: 999px;
}

.soft-nav__theme:hover,
.soft-nav__icon:hover {
  background: rgba(174, 185, 255, 0.16);
  border-color: rgba(174, 185, 255, 0.35);
  transform: translateY(-1px);
}

.soft-nav__theme svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.soft-nav__social-svg {
  display: block;
  width: 18px;
  height: 18px;
  color: currentColor !important;
  fill: currentColor !important;
}

.soft-nav__social-svg :deep(path) {
  fill: currentColor !important;
}

.soft-nav__search {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 14px;
  color: var(--soft-text-1, rgba(255, 255, 255, 0.94));
  background: var(--soft-bg-soft, #1c252c);
  border: 1px solid var(--soft-border, rgba(255, 255, 255, 0.08));
  border-radius: 0;
  cursor: pointer;
}

.soft-nav__search svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.soft-nav__search span {
  font-size: 14px;
  font-weight: 650;
}

.soft-nav__search kbd {
  color: var(--soft-text-2, rgba(190, 220, 242, 0.6));
  background: transparent;
  border: 0;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

@media (max-width: 1180px) {
  .soft-nav__inner {
    gap: 24px;
  }

  .soft-nav__links {
    gap: 18px;
  }

  .soft-nav__link {
    font-size: 14px;
  }

  .soft-nav__search span {
    display: none;
  }
}

@media (max-width: 960px) {
  .soft-nav__banner {
    height: 40px;
    justify-content: flex-start;
    padding: 0 48px 0 16px;
    font-size: 12px;
  }

  .soft-nav__bar {
    height: 58px;
  }

  .soft-nav__inner {
    grid-template-columns: auto 1fr auto;
    gap: 16px;
    padding: 0 16px;
  }

  .soft-nav__brand-name {
    font-size: 16px;
    font-weight: 750;
  }

  .soft-nav__slash,
  .soft-nav__docs,
  .soft-nav__links,
  .soft-nav__search {
    display: none;
  }

  .soft-nav__right {
    gap: 8px;
  }

  .soft-nav__theme,
  .soft-nav__icon {
    width: 30px;
    height: 30px;
  }
}

@media (max-width: 520px) {
  .soft-nav__banner a {
    display: none;
  }
}
.soft-nav {
  position: relative;
  z-index: 10000;
  width: 100%;
  color: var(--soft-text-1, rgba(255, 255, 255, 0.94));
  background: var(--soft-bg, #11181b);
}

.soft-nav__bar {
  background: var(--soft-bg, #11181b);
  border-bottom: 1px solid var(--soft-border, rgba(255, 255, 255, 0.075));
}

.soft-nav__brand,
.soft-nav__docs,
.soft-nav__link:hover {
  color: var(--soft-text-1, rgba(255, 255, 255, 0.94));
}

.soft-nav__link {
  color: var(--soft-text-2, rgba(210, 229, 244, 0.88));
}

.soft-nav__icon,
.soft-nav__theme {
  color: var(--soft-text-1, #ffffff) !important;
}
.soft-nav__banner-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-right: 4px;
  flex-shrink: 0;
}

.soft-nav__banner-mark svg {
  display: block;
  width: 22px;
  height: 22px;
}
@media (max-width: 520px) {
  .soft-nav__banner {
    gap: 4px;
    padding: 0 42px 0 12px;
    font-size: 11.5px;
  }

  .soft-nav__banner a {
    display: inline-flex;
    color: #ffffff;
    font-weight: 750;
    text-decoration: underline;
    text-underline-offset: 3px;
    white-space: nowrap;
  }
}


</style>
