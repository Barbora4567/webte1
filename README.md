# WEBTE1 — Zadanie č. 3: Môj TODO List

* **Meno a priezvisko:** Barbora Moncoľová
* **Odkaz na web:** [odkaz na školský server](https://webte1.fei.stuba.sk/~xmoncolova/zadanie3/)

## Stručný opis aplikácie
**Môj TODO List** je responzívna webová aplikácia určená na správu a časové plánovanie osobných úloh. Aplikácia umožňuje vytvárať, upravovať, filtrovať, vyhľadávať a odstraňovať úlohy, označovať ich ako dokončené alebo znovu otvorené a prehľadne ich zobrazovať v integrovanom kalendári (mesačný, týždenný a denný pohľad). Všetky zmeny sa v reálnom čase synchronizujú s externým REST API serverom (`https://wt1zadanie.iolab.sk`).

## Použité technológie
* **Frontend framework:** Vue 3 (Composition API, `<script setup>`)
* **Kalendárová knižnica:** FullCalendar v6
* **Komunikácia s REST API:** Axios
* **Štýlovanie a ikony:** Bootstrap 5, Bootstrap Icons

## Použitie AI nástrojov
AI nástroje boli použité na konzultačné a edukatívne účely.

## Postup inštalácie závislostí
1. Otvor terminál v koreňovom priečinku projektu (tam, kde sa nachádza súbor `package.json`).
2. Nainštaluj všetky potrebné balíčky a závislosti príkazom:
   ```sh
   npm install