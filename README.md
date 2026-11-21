# ANTON KNACK 2

**Online-Browser optimiert für das Schul-iPad (Safari / Touch)**

Ein moderner, dunkler Browser-Interface, der komplett im Browser läuft – keine Installation nötig.

## Live-Demo

Nach Aktivierung von GitHub Pages:

**https://jsg1049294-png.github.io/anton-knack-2/**

> Hinweis: Das Repository wurde unter dem aktuell verbundenen GitHub-Account erstellt.  
> Dein gewünschter Account war `alessiozocker69420-bot`. Siehe Abschnitt „GitHub-Account“ weiter unten.

## Features

- Adressleiste + Google-Suche
- Zurück / Vor / Neu laden / Startseite
- Mehrere Tabs
- Vollbildmodus (soweit vom Gerät unterstützt)
- Spezielle Behandlung für **anton.app** und andere X-Frame-blockierte Seiten → großer „In neuem Tab öffnen“-Button
- Responsive & Touch-optimiert für iPad
- Developer Tools Panel (Console, Elements, Network, Info)
- Dunkles Design: Dunkelblau / Schwarz / Neon-Türkis

## Einschränkungen (ehrlich)

| Funktion | Status | Bemerkung |
|----------|--------|-----------|
| Startseite laden | ✅ | Funktioniert |
| Navigation (Back/Forward/Reload) | ✅ | Funktioniert |
| Google öffnen | ✅ | Funktioniert |
| Tabs | ✅ | Funktioniert |
| iPad / Safari Darstellung | ✅ | Optimiert |
| Buttons | ✅ | Getestet |
| anton.app einbetten | ❌ → Fallback | Viele Schulplattformen setzen `X-Frame-Options: DENY` → großer Button „In neuem Tab öffnen“ |
| Echte DevTools für fremde Seiten | ⚠️ Limitiert | Client-seitig unmöglich wegen Same-Origin-Policy. Console funktioniert für die eigene App. Für echte Inspektion bräuchte man einen Remote-Chromium (Playwright/Puppeteer) auf einem Server. |
| GitHub Pages | ✅ nach Aktivierung | Siehe unten |

## GitHub Pages aktivieren

1. Gehe zu https://github.com/jsg1049294-png/anton-knack-2/settings/pages
2. Unter **Source** wähle **Deploy from a branch**
3. Branch: `main` / Folder: `/ (root)`
4. Speichern
5. Nach 1–2 Minuten ist die Seite unter  
   `https://jsg1049294-png.github.io/anton-knack-2/` erreichbar.

## GitHub-Account Hinweis

Die verfügbare GitHub-Verbindung ist mit dem Account **jsg1049294-png** verknüpft.

Dein gewünschter Account war:

```
alessiozocker69420-bot
```

**Was du tun kannst:**

1. **Empfohlen:** In den Grok-/xAI-Einstellungen den GitHub-Account `alessiozocker69420-bot` verbinden (oder neu autorisieren).
2. Danach kann das Repository erneut unter deinem Account erstellt werden.
3. Alternativ: Dieses Repository forken oder die Dateien manuell in dein eigenes Repo kopieren.

## Sicherheit

- Keine Passwörter werden gespeichert oder abgefangen
- Keine Cookies / Tokens fremder Seiten ausgelesen
- Keine Umgehung von Sicherheitsmechanismen von anton.app
- Keine automatische Lösung von Schulaufgaben

## Lokale Nutzung

Einfach `index.html` in Safari auf dem iPad öffnen (über Dateien-App oder AirDrop) oder über GitHub Pages.

## Dateien

```
index.html    – Hauptstruktur
styles.css    – Design (Dunkel + Neon-Türkis)
app.js        – Gesamte Logik (Tabs, Navigation, DevTools)
README.md     – Diese Datei
```

---

Erstellt für die Nutzung auf dem Schul-iPad.
