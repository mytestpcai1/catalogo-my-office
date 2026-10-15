# 🛡️ My Office — Archivio Verificato & Fact-Checked

Web App interattiva (accessibile da PC e Smartphone tramite GitHub Pages) che raccoglie **esclusivamente i contenuti verificati** salvati nel gruppo WhatsApp personale `My Office`.

## ✨ Funzionalità principali
- **Solo Contenuti Verificati (Protocollo Nexus)**: Le bufale (es. guadagni irrealistici da 100–208€/giorno con micro-task, misticismo quantistico) e i post rimossi vengono filtrati a monte.
- **Compatibilità Software & Siti**: Ogni tool, repository o web app indica chiaramente:
  - **Modalità**: `🌐 Solo Online (Cloud/Web)` vs `⚙️ Locale / Installabile` vs `🔄 Ibrido`.
  - **Dispositivi**: `💻 PC (Windows/macOS/Linux)` e/o `📱 Smartphone (Android/iOS/Browser Mobile)`.
- **Link Diretti Sbloccati**: Tutti i repository GitHub, Gist e siti web nascosti dietro *"Commenta X e ti mando il link"* sono già estratti e apribili con un clic.
- **Sezione Separata Intrattenimento**: Tab dedicato a film, anime e spunti di riflessione.

## 🔄 Ciclo di Aggiornamento Automatico
1. **Scansione Nuovi Post (Ogni Lunedì ore 09:00 `Europe/Rome`)**: Scansiona i nuovi messaggi nel gruppo WhatsApp `My Office` dall'ultimo ID registrato in `data/catalog.json`, verifica i post secondo il protocollo Nexus, aggiunge quelli validi a `data/catalog.json` ed esegue commit/push su GitHub.
2. **Audit Globale Mensile (Ogni 1° del Mese ore 09:00 `Europe/Rome`)**: Verifica tutti i link, i repository GitHub e i siti presenti in `data/catalog.json` per controllare che siano ancora attivi, non obsoleti e aggiornare eventuali novità o cambi di licenza/versione.
