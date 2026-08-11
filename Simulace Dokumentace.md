# Simulace sezení (`/admin/session-sim`)

Admin nástroj pro offline přepočet nahraných sezení: načte surová data pohledu
(`rawGazeData`), aplikuje prostorovou korekci (posun + měřítko) a okamžitě znovu
spočítá fixace, AOI zásahy a skóre nad zaznamenanou časovou osou. Nic se
nepřehrává v reálném čase – zaznamenané event markery (`dwell-finish_slide-N_initial`
→ `complete-slide-N`) zůstávají autoritativním zdrojem časových oken slidů.

## Zdroje dat

- **Vzdálený server** – stáhne všechny CSV soubory test-session (včetně
  `rawGazeData_slideN.csv`, které heatmapa ignoruje).
- **Soubory** – přetažení volných CSV nebo celého ZIPu sezení.

Bez `gazeSamples` nelze určit časová okna, bez `rawGazeData` není z čeho
přepočítávat – nástroj na obojí upozorní.

## Jak přepočet funguje

1. **Korekce** – posun X/Y a měřítko kolem středu viewportu; společná pro celé
   sezení, volitelně přepsatelná pro jednotlivé slidy. Tažením myší po stimulu
   se posouvá pohled. Vzorky s oběma nevalidníma očima se netransformují
   (jejich souřadnice jsou artefakt kalibrace, ne pohled).
2. **Fixace** – přesně stejný IDT detektor jako při živém sběru
   (`GazeFixationDetectorIDT` z develex-js-sdk), ale s nastavitelnými parametry
   (min. délka, disperze, vzdálenost, DPI). Detektor je čistě datový
   (deviceTimestamp), proto běží okamžitě. Architektura počítá s budoucími
   post-processing kroky (např. slučování fixací) – viz `FixationPostProcessor`
   v `src/lib/utils/sessionSim/types.ts`.
3. **AOI geometrie** – stimul každého slidu se vykreslí ve screenshot režimu
   podle zaznamenaného `stimulus_id` (nikdy se znovu nespouští výběrová/náhodná
   logika) a přečtou se obdélníky `GazeArea` elementů. Rozlišení okna při
   nahrávání se neukládá, proto se zadává ručně.
4. **Výstupy** – překreslené fixace/AOI/gaze nad stimulem (před/po), tabulka
   skóre se rozdíly a export opravených CSV ve formátu `DatabaseExporter`
   (`*_corrected.csv` + `corrections.json` s použitými parametry). Export lze
   zpětně načíst přes záložku Soubory.

## Očekávané odchylky proti živému záznamu

Při nulové korekci a stejných parametrech se výsledky blíží zaznamenaným, ale
nejsou bit-přesné:

- **Nedokončená fixace** na konci streamu se živě nikdy neuloží; v nástroji ji
  lze volitelně ponechat.
- **`fixation_index`** začíná vždy od 1; živě je monotónní přes celé připojení
  bridge (může pokračovat z předchozí úlohy). Porovnávejte podle pořadí/času.
- **Timestamp fixace** je čas vzorku, který ji spustil; živě přichází o jeden
  worker-hop později (jednotky ms).
- **AOI `slide-N_initial`** se nesyntetizuje – během efektivního okna slidu už
  není namontovaný. Šipka `slide-N_end` se syntetizuje staticky (volitelné).
- **AOI obdélníky** se čtou čerstvě z layoutu; živě jsou kešované přes rAF,
  takže se mohou lišit o subpixely.
- Souhlas AOI závisí na správně zadaném rozlišení nahrávky (a 100% zoomu
  prohlížeče při nahrávání).

## Omezení

- **dwell-symbols** – layout je za běhu náhodný a `stimulus_id` je konstantní,
  geometrii nelze rekonstruovat; slide se přepočítá bez AOI (zachová se
  zaznamenané `aoi`).
- **paired-reading** – zatím není v registru stimulů (`stimulusExport/registry.ts`);
  po doplnění bude fungovat automaticky.
- Fluency skóre se přepočítává jen pro úlohy, které ho definují (cibule,
  slabiky); ostatní mají 0 jako živě.
