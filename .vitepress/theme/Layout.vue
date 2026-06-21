<script setup>
import DefaultTheme from "vitepress/theme";
import SoftNavBar from "./SoftNavBar.vue";

const { Layout } = DefaultTheme;

const links = [
  { text: "Guides", href: "/guides/" },
  { text: "CLI", href: "/cli/" },
  { text: "SDK C++", href: "/sdk-cpp/" },
  { text: "SDK JS", href: "/sdk-js/" },
  { text: "Engine", href: "/engine/" },
];

const social = [
  {
    label: "GitHub",
    href: "https://github.com/softadastra",
    icon: `<path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.39 6.84 9.75.5.1.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.9-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0 1 12 7.07c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.93-2.34 4.79-4.57 5.05.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .27.18.59.69.48A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"/>`,
  },
  {
    label: "X / Twitter",
    href: "https://x.com/softadastra",
    icon: `<path d="M18.9 2H22l-6.8 7.8L23 22h-6.7l-5.2-6.8L5.3 22H2l7.3-8.4L1.7 2h6.9l4.7 6.1L18.9 2Zm-1.2 18h1.7L7.7 3.9H5.9L17.7 20Z"/>`,
  },
];
</script>

<template>
  <SoftNavBar />

  <Layout>
    <template #layout-bottom>
      <footer class="sfb" role="contentinfo">
        <div class="sfb-inner">
          <a class="sfb-brand" href="/" aria-label="Softadastra Documentation">
            <span class="sfb-name">Softadastra Engine</span>
          </a>

          <nav class="sfb-nav" aria-label="Footer navigation">
            <a
              v-for="link in links"
              :key="link.text"
              class="sfb-link"
              :href="link.href"
            >
              {{ link.text }}
            </a>
          </nav>

          <div class="sfb-social" aria-label="Social links">
            <a
              v-for="item in social"
              :key="item.label"
              class="sfb-icon"
              :href="item.href"
              target="_blank"
              rel="noreferrer"
              :aria-label="item.label"
            >
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="currentColor"
                aria-hidden="true"
              >
                <path v-html="item.icon"></path>
              </svg>
            </a>
          </div>
        </div>

        <div class="sfb-copy">
          <span>Released under the Apache License 2.0.</span>
          <span>Copyright © 2026 Softadastra.</span>
        </div>
      </footer>
    </template>
  </Layout>
</template>
<style>
.sfb {
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.075);
  background: #11181b;
}

.sfb-inner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 18px 40px;
}

.sfb-brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: rgba(255, 255, 255, 0.93);
  text-decoration: none;
}

.sfb-logo {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 8px;
  object-fit: contain;
}

.sfb-name {
  color: rgba(255, 255, 255, 0.93);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.sfb-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  flex-wrap: wrap;
}

.sfb-link {
  color: rgba(190, 220, 242, 0.62);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.13s ease;
}

.sfb-link:hover {
  color: rgba(255, 255, 255, 0.93);
}

.sfb-social {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.sfb-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: rgba(190, 220, 242, 0.62);
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 7px;
  transition:
    color 0.13s ease,
    border-color 0.13s ease,
    background 0.13s ease;
}

.sfb-icon:hover {
  color: rgba(255, 255, 255, 0.93);
  border-color: rgba(255, 255, 255, 0.075);
  background: #172025;
}

.sfb-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  padding: 10px 40px 14px;
  color: rgba(190, 220, 242, 0.55);
  border-top: 1px solid rgba(255, 255, 255, 0.075);
  font-size: 11.5px;
  font-weight: 600;
  background: #11181b;
}

.VPFooter {
  display: none !important;
}

@media (max-width: 820px) {
  .sfb-inner {
    grid-template-columns: 1fr 1fr;
  }

  .sfb-nav {
    display: none;
  }
}

@media (max-width: 480px) {
  .sfb-inner {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 14px 20px;
  }

  .sfb-social {
    justify-content: flex-start;
  }

  .sfb-copy {
    flex-direction: column;
    gap: 8px;
    padding: 10px 20px 14px;
    text-align: center;
  }
}
@media (max-width: 820px) {
  .sfb-inner {
    grid-template-columns: 1fr auto;
    gap: 14px;
    padding: 16px 20px;
  }

  .sfb-nav {
    display: none;
  }

  .sfb-social {
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .sfb-inner {
    display: none !important;
  }

  .sfb-copy {
    flex-direction: column;
    gap: 8px;
    padding: 12px 18px;
    text-align: center;
  }
}
</style>
