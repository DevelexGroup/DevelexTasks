# Simulace sezení (`/admin/session-sim`)

Admin nástroj pro offline přepočet nahraných sezení: načte surová data pohledu
(`rawGazeData`), aplikuje prostorovou korekci (posun + měřítko) a okamžitě znovu
spočítá fixace, AOI zásahy a skóre nad zaznamenanou časovou osou. Nic se
nepřehrává v reálném čase – zaznamenané event markery (`dwell-finish_slide-N_initial`
→ `complete-slide-N`) zůstávají autoritativním zdrojem časových oken slidů.

## Zdroje dat

Nástroj pracuje s **více sezeními najednou**. Dialog Načíst sezení má dvě
záložky, které lze kombinovat:

- **Vzdálený server** – dvoupanelový výběr: vlevo uživatelé s vyhledáváním
  (jméno / username) a počtem sezení, vpravo sezení vybraného uživatele
  seskupená po dnech se zaškrtávátky; výběr může zahrnovat více uživatelů
  a zobrazuje se jako štítky pod seznamem. Data sezení se stahují až při
  prvním otevření (nebo při exportu), stažená zůstávají v paměti.
- **Soubory** – přetažení volných CSV/JSON nebo ZIPů. Vstup se rozdělí na
  sezení podle složek serverového exportu
  (`<uživatel>/<yyyy-MM-dd_HH-mm-ss>_<úloha>/part_N/…`, `meta/…`); ploché
  ZIPy, lokální exporty i volné soubory se dělí podle `child_id` +
  `session_id` v řádcích. `aoiGeometry`/`meta.json` se přiřadí jen tam, kde
  složka obsahuje jediné sezení.

Načtená sezení se přepínají v kartě Sezení (výběr + šipky). Prostorová
korekce, viewport a přepsání slidů jsou **per sezení** (tlačítko „Použít na
všechna sezení“ zkopíruje korekci ostatním); parametry detekce, pravidla
přepočtu a I2MC parametry jsou společné. Volba „Opravit časy vzorků
(bridge)“ má režim *Automaticky* – řídí se tím, zda je nahrávka
razítkovaná bridge časem.

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
   (deviceTimestamp), proto běží okamžitě. Pozor: SDK detektor je klouzavé
   okno a min. délka je zároveň prahem ukončení – fixace končí, až když okno
   vzorků v toleranci disperze klesne pod min. délku. Snížení (např. na 10 ms)
   proto fixace nepřidá, ale slučuje je přes pomalé sakády a zkracuje hlášené
   délky (délka = aktuální okno, ne čas od začátku). Architektura počítá s budoucími
   post-processing kroky (např. slučování fixací) – viz `FixationPostProcessor`
   v `src/lib/utils/sessionSim/types.ts`.
3. **AOI geometrie** – přednostně se načte geometrie zaznamenaná při sběru
   (`aoiGeometry_slide{N}.json`): skutečné obdélníky, buffery a intervaly
   platnosti všech AOI registrovaných v SDK (včetně dwell oka/šipky a
   dwell-symbols), plus rozlišení okna při nahrávání. U starších sezení bez
   těchto souborů se stimul každého slidu vykreslí ve screenshot režimu podle
   zaznamenaného `stimulus_id` (nikdy se znovu nespouští výběrová/náhodná
   logika) a přečtou se obdélníky `GazeArea` elementů; rozlišení se pak vezme
   z `meta.json` (viewport při nahrávání), a teprve bez něj se zadává ručně.
   Zaznamenaná geometrie sdílí pixelový prostor s gaze daty, takže přežívá
   i ruční změnu viewportu (ta zahodí jen DOM re-capture). Z `meta.json` se
   dále předvyplní frekvence pro serverové I2MC (naměřená frekvence
   zaokrouhlená na běžnou vzorkovací frekvenci) a porovnají se počty raw
   vzorků na slide se zaznamenanými – při ztrátě dat se zobrazí varování.
   Duplicitní řádky z překrývajících se souborů se při načtení odstraní
   s varováním.
4. **Výstupy** – překreslené fixace/AOI/gaze nad stimulem (před/po) – náhled
   ukazuje vše se `slide_index` slidu, fixace mimo efektivní okno (a tedy mimo
   skóre) čárkovaně, tabulka
   skóre se rozdíly a export opravených CSV. ZIP má **strukturu serverového
   exportu** (`<uživatel>/<yyyy-MM-dd_HH-mm-ss>_<úloha>/part_N/<tabulka>_slideN.csv`,
   `meta/meta.json`) s původními názvy souborů, takže ho čte cokoli, co čte
   serverový export; použité parametry jsou v `meta/corrections.json` a
   zaznamenaná AOI geometrie a `meta.json` se přibalí beze změny. Exportují
   se všechna vybraná sezení – neotevřená se při exportu stáhnou, chybějící
   geometrie se dorenderuje mimo obrazovku a přepočítají se se společnými
   pravidly bez korekce. Export lze zpětně načíst přes záložku Soubory.

## Parita s živým záznamem

Detektor i jeho výchozí parametry jsou shodné s živým sběrem, rozdíly v počtu a
délce fixací dělá vstupní stream a okamžik, kdy se živě počítá skóre. Karta
**Parita s živým záznamem** to řídí; výchozí hodnoty kopírují živé chování, takže
při nulové korekci vycházejí stejná čísla jako zaznamenaná. Přepnutím dostanete
správnější výsledek, který se ale se zaznamenaným neshodne.

- **Zahodit nedokončenou fixaci** (zapnuto) – fixace běžící na konci streamu se
  živě nikdy neuloží.
- **Počítat fixace přesahující konec slidu** (vypnuto) – živě se skóre slidu
  počítá v ticku, který slide dokončí, a čte `db.fixationData`. Fixace, která v tu
  chvíli ještě běží, se uloží až později a nezapočítá se do žádného slidu (do CSV
  slidu se navíc nedostane vůbec, ten je nahrán dřív). Zapnutím se započítá tam,
  kde začala – typicky +1 fixace na slide a posun průměrné délky.
- **Reset detektoru při mezeře** (200 ms, 0 = vypnuto) – chybějící vzorky (pauza
  úlohy, ztráta na přechodu slidu) živý detektor viděl, v záznamu nejsou. Bez
  resetu měří IDT okno přes celou mezeru a slepí obě strany do jedné dlouhé
  fixace. Mezery a pauzy nástroj hlásí ve varováních.
- **Zahodit úvodní fixaci streamu** (vypnuto) – živý detektor běží v bridge
  workeru nepřetržitě, záznam začíná až s `startLogging()`. Fixaci, která v tu
  chvíli už běžela, živě zahodí (`fixation end for unknown index`), nástroj ji
  detekuje znovu. Leží před oknem prvního slidu, do skóre se tedy obvykle
  nepromítne; zapnutím zmizí i ze seznamu fixací. Při načtení dat jediného slidu
  volbu nezapínejte – uřízla by platnou fixaci.
- **Opravit časy vzorků (bridge)** (automaticky podle nahrávky) – u nahrávek
  s bridge razítky (od 2026-08, detekuje se z dat) je zapnutí paritou: živý
  záznam už razítkuje vzorky bridge časem a fixace časem skutečného začátku,
  přerazítkování je no-op a fixace dostanou stejné časy jako živě; nástroj ho
  proto zapne sám. U starších nahrávek (razítka hlavního vlákna, pozdě
  a v dávkách) zapnutí vzorky přerazítkuje spojitým bridge časem (posunutým
  o klidový offset, zůstávají ve stejném rámci jako event markery) a fixace
  dostanou čas skutečného začátku – časy se pak neshodují se zaznamenanými
  řádky, ale odpovídají realitě; fixace se mohou přesunout mimo okno slidu,
  do kterého je živě zapsalo pozdní razítko.

## Další očekávané odchylky

- **`fixation_index`** začíná vždy od 1; živě je monotónní přes celé připojení
  bridge (může pokračovat z předchozí úlohy). Porovnávejte podle pořadí/času.
- **Timestampy v CSV** jsou zaokrouhlené dolů na celé ms, takže na hranici okna
  může fixace vypadnout/přibýt.
- **Timestamp fixace** byl v záznamech do 2026-08 čas hlavního vlákna při
  zpracování události fixationStart – nejméně o minimální délku fixace (100 ms)
  později než skutečný začátek, při zácpě hlavního vlákna (přechod slidu) i
  ~300 ms; vzorky se pak vylily v dávce a razítka fixací se nakupila k sobě.
  Event markery (dwell-start apod.) jedou na řádcích vzorků s worker časem,
  takže sedí – časy fixací z těchto záznamů s nimi proto nelze přímo srovnávat;
  narovná je volba **Opravit časy vzorků**. Novější záznamy razítkují vzorky
  bridge časem a fixace časem skutečného začátku přímo při sběru.
- Následující odchylky platí jen pro sezení bez zaznamenané geometrie
  (`aoiGeometry_slide{N}.json`); s ní se používají skutečné obdélníky
  a intervaly platnosti:
  - **AOI `slide-N_initial` a `slide-N_end`** se syntetizují staticky (obojí
    volitelné, 125×75 px, buffer 50). Živě je každý namontovaný jen po část
    slidu (oko před dwell-finish, šipka po něm); replay je drží po celé okno.
  - **AOI obdélníky** se čtou čerstvě z layoutu; živě jsou kešované přes rAF,
    takže se mohou lišit o subpixely.
  - Souhlas AOI závisí na správně zadaném rozlišení nahrávky (a 100% zoomu
    prohlížeče při nahrávání).

## Omezení

- **dwell-symbols** – layout je za běhu náhodný a `stimulus_id` je konstantní,
  geometrii nelze rekonstruovat z DOM. Se zaznamenanou geometrií
  (`aoiGeometry_slide{N}.json`) se přepočet povede; u starších sezení se slide
  přepočítá bez AOI (zachová se zaznamenané `aoi`).
- **paired-reading** – zatím není v registru stimulů (`stimulusExport/registry.ts`);
  po doplnění bude fungovat automaticky.
- Fluency skóre se přepočítává jen pro úlohy, které ho definují (cibule,
  slabiky); ostatní mají 0 jako živě.
