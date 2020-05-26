# Volunteer Sync

Skript pro synchronizaci informací o dobrovolnících ze [Slacku Česko.Digital](https://cesko-digital.slack.com) do [AirTable](https://airtable.com), kterou používáme jako jednoduché CRM, a do [Ecomailu](https://ecomail.cz), který používáme pro rozesílání newsletteru.

```bash
$ yarn install
$ AIRTABLE_API_TOKEN=… SLACK_API_TOKEN=… ECOMAIL_API_TOKEN=… yarn dev
```

Po spuštění skript projde Slack workspace, posbírá zajímavé informace o dobrovolnících, nahraje je do AirTable a případně přidá nové příjemce do Ecomailu. Záznamy v AirTable se párují podle Slack ID, takže pokud už uživatel existuje, informace o něm se aktualizují.

Potřebné autentizační tokeny jsou nastavené na GitHubu, skript se automaticky spustí po každém pushnutí do větve `master` a zároveň každý den v 2.05 UTC.

![](https://github.com/cesko-digital/volunteer-sync/workflows/Sync/badge.svg)
