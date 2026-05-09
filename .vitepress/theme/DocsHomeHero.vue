<script setup>
const cards = [
  {
    icon: "cpp",
    title: "C++ SDK",
    desc: "Build native local-first applications with durable WAL, persistent store, and sync primitives.",
    href: "/sdk-cpp/",
  },
  {
    icon: "js",
    title: "JavaScript SDK",
    desc: "Use the same Softadastra model from Node.js or browser apps with a friendly async API.",
    href: "/sdk-js/",
  },
  {
    icon: "terminal",
    title: "CLI",
    desc: "Inspect nodes, read and write local data, trigger sync, and debug runtime state from the terminal.",
    href: "/cli/",
  },
  {
    icon: "engine",
    title: "Engine internals",
    desc: "Understand WAL, store, sync, transport, discovery, metadata, and the full runtime flow.",
    href: "/engine/",
  },
  {
    icon: "guide",
    title: "Guides",
    desc: "Build offline-first apps, persist data locally, run local nodes, and sync between peers.",
    href: "/guides/",
  },
  {
    icon: "reference",
    title: "Reference",
    desc: "Compact technical reference for the CLI, C++ API, JavaScript API, config, and errors.",
    href: "/reference/",
  },
];

const engineLayers = [
  {
    name: "WAL",
    href: "/engine/wal",
    desc: "Every accepted write is persisted before sync.",
    icon: "wal",
  },
  {
    name: "Store",
    href: "/engine/store",
    desc: "Local state remains available without network.",
    icon: "store",
  },
  {
    name: "Sync",
    href: "/engine/sync",
    desc: "Outbox, retry, delivery, acknowledgement.",
    icon: "sync",
  },
  {
    name: "Transport",
    href: "/engine/transport",
    desc: "Peer and network delivery layer.",
    icon: "transport",
  },
];
</script>

<template>
  <section class="sd-docs-home">
    <div class="sd-hero">
      <div class="sd-hero__copy">
        <h1>Softadastra Documentation</h1>

        <p>
          Softadastra is a local-first and offline-first foundation for
          applications that must keep working when the network becomes slow,
          unstable, or unavailable.
        </p>

        <p>
          Write locally, persist every operation to a WAL, then sync when the
          network allows it. The system is designed to protect correctness
          before convenience.
        </p>

        <div class="sd-hero__actions">
          <a class="sd-button sd-button--primary" href="/quick-start">
            Get started
            <span aria-hidden="true">→</span>
          </a>

          <a class="sd-button sd-button--link" href="/engine/">
            Explore the engine
          </a>
        </div>
      </div>

     <div class="sd-hero__system" aria-label="Softadastra engine layers">
  <a
    v-for="(layer, index) in engineLayers"
    :key="layer.name"
    :href="layer.href"
    class="sd-system-row"
  >
    <span
      class="sd-system-plate"
      :class="`sd-system-plate--${index + 1}`"
      aria-hidden="true"
    ></span>

    <span class="sd-system-copy">
      <span class="sd-layer__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <template v-if="layer.icon === 'wal'">
            <path d="M12 3 20 7.5 12 12 4 7.5 12 3Z" />
            <path d="M20 12 12 16.5 4 12" />
            <path d="M20 16.5 12 21 4 16.5" />
          </template>

          <template v-else-if="layer.icon === 'store'">
            <rect x="4" y="5" width="16" height="14" rx="2" />
            <path d="M4 9h16" />
            <path d="M8 13h4" />
          </template>

          <template v-else-if="layer.icon === 'sync'">
            <path d="M17 3 21 7 17 11" />
            <path d="M3 7h18" />
            <path d="M7 21 3 17 7 13" />
            <path d="M21 17H3" />
          </template>

          <template v-else>
            <path d="M12 4v4" />
            <path d="M12 16v4" />
            <path d="M4 12h4" />
            <path d="M16 12h4" />
            <circle cx="12" cy="12" r="4" />
          </template>
        </svg>
      </span>

      <span class="sd-layer__body">
        <strong>{{ layer.name }}</strong>
        <small>{{ layer.desc }}</small>
      </span>
    </span>
  </a>
</div>
    </div>

    <div class="sd-card-grid">
      <a
        v-for="card in cards"
        :key="card.title"
        :href="card.href"
        class="sd-card"
      >
        <span class="sd-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <template v-if="card.icon === 'cpp'">
              <path d="M12 3 20 7.5V16.5L12 21 4 16.5V7.5L12 3Z" />
              <path d="M9.5 9.5A3.5 3.5 0 1 0 9.5 14.5" />
              <path d="M14 10V14" />
              <path d="M16 10V14" />
            </template>

            <template v-else-if="card.icon === 'js'">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M9 16.5c1.4 0 2-.7 2-2V10" />
              <path d="M15.5 10H14a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-1.8" />
            </template>

            <template v-else-if="card.icon === 'terminal'">
              <path d="M4 6h16v12H4z" />
              <path d="M7 10l2 2-2 2" />
              <path d="M11 15h4" />
            </template>

            <template v-else-if="card.icon === 'engine'">
              <rect x="7" y="7" width="10" height="10" rx="2" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <path d="M4.9 4.9 7 7M17 17l2.1 2.1" />
              <path d="M19.1 4.9 17 7M7 17l-2.1 2.1" />
            </template>

            <template v-else-if="card.icon === 'guide'">
              <path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4-4V4Z" />
              <path d="M9 8h6M9 12h6" />
            </template>

            <template v-else>
              <path d="M5 6h14M5 12h10M5 18h12" />
              <path d="M3 6h.01M3 12h.01M3 18h.01" />
            </template>
          </svg>
        </span>

        <strong>{{ card.title }}</strong>
        <span>{{ card.desc }}</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.sd-docs-home {
  --sd-bg: #11181b;
  --sd-card: #11181b;
  --sd-card-hover: #172025;
  --sd-border-soft: rgba(255, 255, 255, 0.075);
  --sd-text: rgba(255, 255, 255, 0.93);
  --sd-muted: rgba(190, 220, 242, 0.78);
  --sd-dim: rgba(190, 220, 242, 0.55);
  --sd-icon: rgba(190, 220, 242, 0.48);
  --sd-accent: #aeb9ff;

  width: 100vw;
  min-height: calc(100vh - 64px);
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  padding: 96px 0 80px;
  color: var(--sd-text);
  background: var(--sd-bg);
}

/* =========================
   Hero
   ========================= */

.sd-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(520px, 560px);
  gap: clamp(56px, 7vw, 118px);
  align-items: center;
  width: 100%;
  max-width:1280px ;
  margin: 0 auto;
  padding: 0 20px;
}

.sd-hero__copy h1 {
  max-width: 680px;
  margin: 0 0 28px;
  color: var(--sd-text);
  font-size: clamp(42px, 4.6vw, 58px);
  line-height: 1.02;
  letter-spacing: -0.055em;
  font-weight: 740;
}

.sd-hero__copy p {
  max-width: 650px;
  margin: 0;
  color: var(--sd-muted);
  font-size: 18px;
  line-height: 1.64;
}

.sd-hero__copy p + p {
  margin-top: 22px;
}

.sd-hero__actions {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 34px;
}

/* =========================
   Buttons
   ========================= */

.sd-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  border-radius: 2px;
  font-size: 15px;
  font-weight: 680;
  text-decoration: none;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.sd-button--primary {
  padding: 0 24px;
  color: #071018;
  background: var(--sd-accent);
}

.sd-button--primary:hover {
  background: #c5ccff;
  transform: translateY(-1px);
}

.sd-button--link {
  color: var(--sd-muted);
}

.sd-button--link:hover {
  color: var(--sd-text);
}

/* =========================
   Right visual, Modular-like
   ========================= */

.sd-hero__system {
  display: grid;
  grid-template-columns: 230px 260px;
  grid-template-rows: repeat(4, 72px);
  column-gap: 34px;
  row-gap: 14px;
  align-items: center;
  justify-content: end;
  width: 100%;
  max-width: 560px;
  justify-self: end;
}

.sd-system-row {
  display: contents;
  color: inherit;
  text-decoration: none;
}

.sd-system-plate {
  position: relative;
  display: block;
  justify-self: center;
  align-self: center;
  width: 150px;
  height: 150px;
  border-radius: 8px;
  transform:
    rotateX(62deg)
    rotateZ(45deg)
    scaleY(0.52);
  transform-origin: center;
  box-shadow:
    0 16px 22px rgba(0, 0, 0, 0.24),
    inset 0 -13px 0 rgba(0, 0, 0, 0.16);
}

.sd-system-plate::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -10px;
  height: 10px;
  border-radius: 0 0 8px 8px;
  background: rgba(0, 0, 0, 0.16);
}

.sd-system-plate--1 {
  grid-column: 1;
  grid-row: 1;
  background: #b8c4ff;
}

.sd-system-plate--2 {
  grid-column: 1;
  grid-row: 2;
  background: #8d9ded;
}

.sd-system-plate--3 {
  grid-column: 1;
  grid-row: 3;
  background: #6576d0;
}

.sd-system-plate--4 {
  grid-column: 1;
  grid-row: 4;
  background: #4252ad;
}

.sd-system-copy {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 12px;
  align-items: start;
  align-self: center;
}

.sd-system-row:nth-child(1) .sd-system-copy {
  grid-column: 2;
  grid-row: 1;
}

.sd-system-row:nth-child(2) .sd-system-copy {
  grid-column: 2;
  grid-row: 2;
}

.sd-system-row:nth-child(3) .sd-system-copy {
  grid-column: 2;
  grid-row: 3;
}

.sd-system-row:nth-child(4) .sd-system-copy {
  grid-column: 2;
  grid-row: 4;
}

.sd-layer__icon {
  display: inline-flex;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  color: var(--sd-icon);
}

.sd-layer__icon svg {
  width: 22px;
  height: 22px;
  stroke: currentColor;
  stroke-width: 1.65;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sd-layer__body {
  display: block;
}

.sd-layer__body strong {
  display: block;
  margin-bottom: 5px;
  color: var(--sd-text);
  font-size: 17px;
  font-weight: 720;
  line-height: 1.2;
}

.sd-layer__body small {
  display: block;
  max-width: 230px;
  color: var(--sd-dim);
  font-size: 14px;
  line-height: 1.42;
}

.sd-system-row:hover .sd-layer__body strong,
.sd-system-row:hover .sd-layer__icon {
  color: var(--sd-accent);
}

/* =========================
   Cards
   ========================= */

.sd-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  max-width: 1280px;
  margin: 72px auto 0;
  padding: 0 20px;
}

.sd-card {
  min-height: 184px;
  padding: 30px 28px;
  color: inherit;
  text-decoration: none;
  background: var(--sd-card);
  border: 1px solid var(--sd-border-soft);
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease;
}

.sd-card:hover {
  background: var(--sd-card-hover);
  border-color: rgba(174, 185, 255, 0.28);
  transform: translateY(-2px);
}

.sd-card__icon {
  display: inline-flex;
  margin-bottom: 34px;
  color: var(--sd-icon);
}

.sd-card__icon svg {
  width: 26px;
  height: 26px;
  stroke: currentColor;
  stroke-width: 1.55;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sd-card strong {
  display: block;
  margin-bottom: 12px;
  color: var(--sd-text);
  font-size: 19px;
  line-height: 1.25;
}

.sd-card span:last-child {
  display: block;
  color: var(--sd-dim);
  font-size: 15px;
  line-height: 1.55;
}

/* =========================
   Tablet
   ========================= */

@media (max-width: 1100px) {
  .sd-hero {
    grid-template-columns: 1fr;
  }

  .sd-hero__system {
    justify-self: start;
  }

  .sd-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* =========================
   Mobile
   ========================= */

@media (max-width: 720px) {
  .sd-docs-home {
    padding: 56px 0 56px;
  }

  .sd-hero,
  .sd-card-grid {
    padding: 0 20px;
  }

 .sd-hero__copy h1 {
  font-size: 36px;
  line-height: 1.04;
}

  .sd-hero__copy p {
    font-size: 16px;
  }

  .sd-hero__system {
    grid-template-columns: 130px 1fr;
    grid-template-rows: repeat(4, 62px);
    column-gap: 20px;
    row-gap: 12px;
    justify-self: start;
  }

  .sd-system-plate {
    width: 105px;
    height: 105px;
    transform:
      rotateX(62deg)
      rotateZ(45deg)
      scaleY(0.52);
  }

  .sd-card-grid {
    grid-template-columns: 1fr;
    margin-top: 48px;
  }

  .sd-card {
    min-height: auto;
    padding: 24px 22px;
  }

  .sd-card__icon {
    margin-bottom: 24px;
  }
}
</style>
