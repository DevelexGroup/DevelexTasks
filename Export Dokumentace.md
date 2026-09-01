# Develex Export

Export obsahuje pět tabulek: *gazeSamples*, *fixationData*, *sessionScores*, *dyslexVissDiffClicks* a *rawGazeData*.

**Společné poznámky:**

- Časové údaje jsou exportovány ve formátu ISO 8601 v UTC.
  - `Session ID`: `YYYY-MM-DDTHH:MM:SSZ` (příklad: `2026-01-13T12:17:18Z`)
  - `Timestamp`: `YYYY-MM-DDTHH:MM:SS.mmmZ` s přesností na milisekundy (příklad: `2026-01-13T12:17:23.894Z`)

  > **Upozornění:** Tabulkové editory (Excel, LibreOffice, Google Sheets) často při výchozím nastavení skryjí milisekundy.

- Sloupce obsahující seznam hodnot jsou oddělené svislicí `|`.

### Tabulka *gazeSamples*

Vzorky logované s frekvencí 120 Hz po dobu běhu úlohy.

- `ID`: číslo – identifikační číslo vzorku v celkové tabulce DB.

- `Child ID`: text – identifikační jméno/text uživatele, který task prováděl.

- `Session ID`: datum – datum, kdy byl task započat.

- `Task`: text – název tasku, jeho úroveň a případně režim, oddělené pomlčkou.

  - Formát: `{jméno tasku}-{level tasku}` v základním režimu *reeducation* (příklad: `cibule-3a`)
  - V ostatních režimech se přidává přípona režimu: `{jméno tasku}-{level tasku}-{režim}` (příklad: `cibule-3a-evaluation`). Režimy: `evaluation`, `intervention`.

- `Slide Index`: číslo – uvádí pořadí daného slidu.

- `Stimulus ID`: text – uvádí, který konkrétní stimulus z dat byl náhodně vybrán pro daný slide. Pokud není stimulus přiřazen, obsahuje hodnotu `null`.

- `Timestamp`: datum (s milisekundami) – uvádí konkrétní čas události daného vzorku.

- `Device Timestamp`: text – časová značka posledního přijatého vzorku přímo ze zařízení eyetrackeru.

- `Eye X`: číslo – uvádí X-ovou souřadnici v pixelech dat z eyetrackeru, kam se uživatel dívá. Pixely jsou relativní k oknu aplikace v prohlížeči.

- `Eye Y`: číslo – uvádí Y-ovou souřadnici v pixelech dat z eyetrackeru, kam se uživatel dívá. Pixely jsou relativní k oknu aplikace v prohlížeči.

- `AOI`: seznam textů, oddělený svislicí `|` – obsahuje ID AOI, na které se uživatel aktuálně dívá.

  - Seznam standardních AOI:
    - `slide-{index}_initial` – počáteční dwell oko levelu, kde `{index}` uvádí aktuální pořadí slidu (od 1).
    - `slide-{index}_end` – pokračovací dwell šipka, kde `{index}` uvádí aktuální pořadí slidu (od 1).
    - `hint` – vzorový stimul.
    - `track` – pole s target a background písmenky.
    - `group-{id}` – výplňová (background) písmenka, slabiky, slova či symboly. `{id}` je číslo, udávající pořadí celé skupiny symbolů ve stimulu, zleva doprava a shora dolů.
    - `target-group-{id}` – hledaný vzorek. `{id}` je číslo, udávající pořadí celé skupiny symbolů ve stimulu, zleva doprava a shora dolů.

- `Mouse X` : číslo – uvádí X-ovou souřadnici v pixelech kurzoru myši. Pixely jsou relativní k oknu aplikace v prohlížeči.

- `Mouse Y` : číslo – uvádí Y-ovou souřadnici v pixelech kurzoru myši. Pixely jsou relativní k oknu aplikace v prohlížeči.

- `Event`: seznam textů, oddělený svislicí `|` – obsahuje seznam událostí, které se staly od předchozího vzorku.

  - Seznam standardních Eventů:
    - `dwell-start_{id}` – počátek dwellování na element s ID `{id}` (typicky např. dwell oko).
    - `dwell-cancel_{id}` – přerušení dwellování na element s ID `{id}`.
    - `dwell-finish_{id}` – dokončení dwellování na element s ID `{id}`.
    - `mouse_click` – kliknutí myší, ne nutně na interaktivní prvek.
    - `select_{group}` – typicky doprovázeno `mouse_click`, které udává, že bylo kliknuto na skupinu symbolů `{group}` (`{group}` by tím pádem mělo být i v AOI).
    - `complete-slide-{index}` – značí úspěšné dokončení úkolu na slidu s pořadím `{index}`.
    - `key_{code}` – stisk klávesy na klávesnici s kódem `{code}`.
    - `visdiff-click-{item}` – kliknutí na položku `{item}` v úloze visdiff (dyslex).
    - `pause_logging` – pozastavení logování (např. pauza úlohy).
    - `resume_logging` – obnovení logování.

- `Sound`: seznam textů, oddělený svislicí `|` – uvádí aktuálně přehrávané zvuky. Obsahuje pouze název souboru bez cesty a přípony (příklad: `kos`).

- `Mistake Type`: seznam textů, oddělený svislicí `|` – uvádí typ chyby, kterou uživatel udělal od předchozího vzorku.

  - Seznam standardních chyb:
    - `unfinished` – chyba, která nastane, když se uživatel pokusí pokračovat na další slide, bez úplného dokončení aktuální úlohy.
    - `misclick` – chyba, která nastane, když uživatel klikne na nesprávné (background) písmenko.
    - `skipped` – chyba, která nastane, když uživatel klikne na hledaný vzorek, ale neklikl na jiný hledaný vzorek před ním.
    - `wrong-order` – chyba, která nastane, když uživatel klikne na vzorek více vlevo, než byl předchozí vzorek.
    - `wrong-focus` – chyba, která nastane, když se uživatel před kliknutím nepodíval na vzorové písmeno/slabiku.

- `Result`: text – způsob dokončení úrovně. Vyplněno pouze v posledním vzorku session.

  - Seznam způsobů dokončení:
    - `natural` – uživatel úspěšně dokončí všechny slidy.
    - `escape` – uživatel vyvolá pomocí tlačítka *escape* konec úrovně.
    - `mistake` – uživatel udělal příliš mnoho chyb a bylo mu nabídnuto ukončit úroveň.
    - `terminate` – úroveň byla přerušena vnějším vlivem.
    - `timeout` – úroveň skončila vypršením časového limitu.



### Tabulka *fixationData*

Fixace detekované eyetrackerem (přes develex-js-sdk).

- `ID`: číslo – identifikační číslo vzorku v celkové tabulce DB.

- `Child ID`: text – identifikační jméno/text uživatele, který task prováděl.

- `Session ID`: datum – datum, kdy byl task započat.

- `Task`: text – task, level a případně režim oddělený pomlčkou, který byl vykonáván (formát viz *gazeSamples*).

- `Slide Index`: číslo – uvádí pořadí daného slidu.

- `Stimulus ID`: text – uvádí, který konkrétní stimulus z dat byl náhodně vybrán pro daný slide. Pokud není stimulus přiřazen, obsahuje hodnotu `null`.

- `Timestamp`: datum (s milisekundami) – uvádí čas, kdy byla fixace detekována (její začátek). Záznam je do DB uložen až po skončení fixace, ale časová značka odpovídá jejímu začátku.

- `Eye X`: číslo – uvádí X-ovou souřadnici v pixelech dat z eyetrackeru, kde se daná fixace stala. Pixely jsou relativní k oknu aplikace v prohlížeči.

- `Eye Y`: číslo – uvádí Y-ovou souřadnici v pixelech dat z eyetrackeru, kde se daná fixace stala. Pixely jsou relativní k oknu aplikace v prohlížeči.

- `Duration`: číslo – uvádí délku fixace v milisekundách.

- `AOI`: seznam textů, oddělený svislicí `|` – obsahuje ID AOI, na kterých se fixace stala. Seznam standardních AOI viz tabulka *gazeSamples*.

- `Fixation Index`: číslo – pořadové číslo fixace přidělené knihovnou develex-js-sdk (čítač fixací GazeManageru, inkrementuje se od připojení eyetrackeru).



### Tabulka *sessionScores*

Souhrnné metriky vypočítané pro každý dokončený slide. Časové okno slidu je od dokončení dwellu na počáteční oko (`dwell-finish_slide-{index}_initial`) do události `complete-slide-{index}`.

- `ID`: číslo – identifikační číslo vzorku v celkové tabulce DB.

- `Child ID`: text – identifikační jméno/text uživatele, který task prováděl.

- `Session ID`: datum – datum, kdy byl task započat.

- `Task`: text – task, level a případně režim oddělený pomlčkou, který byl vykonáván (formát viz *gazeSamples*).

- `Slide Index`: číslo – uvádí pořadí daného slidu.

- `Stimulus ID`: text – uvádí, který konkrétní stimulus z dat byl náhodně vybrán pro daný slide. Pokud není stimulus přiřazen, obsahuje hodnotu `null`.

- `Timestamp`: datum (s milisekundami) – uvádí konkrétní čas, kdy byl slide dokončen.

- `Fluency Score`: číslo – skóre plynulosti vypočítané vyhodnocovací funkcí dané úlohy z metrik slidu.

- `Error Rate`: číslo – uvádí počet chyb typu `misclick`, `skipped` a `wrong-order` udělaný v daném slidu (chyby `unfinished` a `wrong-focus` se nepočítají).

- `Response Time`: číslo – uvádí délku v milisekundách od začátku tasku (dokončení dwellu na počáteční fixoko) do dokončení slidu (kliknutí na poslední hledané písmenko).

- `Mean Fixation Duration`: číslo – uvádí průměrnou délku fixací v milisekundách pro daný slide.

- `Fixation Count`: číslo – uvádí počet fixací v daném slidu.

- `AOI Target Fixations`: číslo – uvádí počet fixací na `hint` AOI (vzorový stimul).

- `AOI Field Fixations`: číslo – uvádí počet fixací na `track` AOI (pole s target a background písmeny).

- `Regression Count`: číslo – počet dvojic po sobě jdoucích fixací, jejichž vzdálenost je alespoň 50 px a směr posunu se odchyluje o více než ±40° od směru doprava (zahrnuje tedy zpětné i výrazně svislé sakády).



### Tabulka *dyslexVissDiffClicks*

Kliknutí v úloze visdiff (dyslex) – hledání vizuálních rozdílů.

- `ID`: číslo – identifikační číslo vzorku v celkové tabulce DB.

- `Child ID`: text – identifikační jméno/text uživatele, který task prováděl.

- `Session ID`: datum – datum, kdy byl task započat.

- `Task`: text – task a level oddělený pomlčkou, který byl vykonáván.

- `Slide Index`: číslo – uvádí pořadí daného slidu.

- `Stimulus ID`: text – uvádí, který konkrétní stimulus z dat byl vybrán pro daný slide. Pokud není stimulus přiřazen, obsahuje hodnotu `null`.

- `Timestamp`: datum (s milisekundami) – uvádí čas kliknutí.

- `Is Correct`: boolean (`true`/`false`) – uvádí, zda bylo kliknutí správné.

- `AOI`: text – ID AOI, na které bylo kliknuto (jedna hodnota, ne seznam).



### Tabulka *rawGazeData*

Surová data z eyetrackeru, logovaná pro každý příchozí vzorek zařízení (bez převzorkování na 120 Hz). Tabulka neobsahuje sloupec `Stimulus ID`.

- `ID`: číslo – identifikační číslo vzorku v celkové tabulce DB.

- `Child ID`: text – identifikační jméno/text uživatele, který task prováděl.

- `Session ID`: datum – datum, kdy byl task započat.

- `Task`: text – task, level a případně režim oddělený pomlčkou, který byl vykonáván (formát viz *gazeSamples*).

- `Slide Index`: číslo – uvádí pořadí daného slidu.

- `Timestamp`: datum (s milisekundami) – čas přijetí vzorku v aplikaci.

- `Bridge Timestamp`: text – časová značka vzorku z bridge (develex-js-sdk).

- `Device Timestamp`: text – časová značka vzorku přímo ze zařízení eyetrackeru.

- `X`: číslo – kombinovaná X-ová souřadnice pohledu v pixelech, relativní k oknu aplikace v prohlížeči.

- `Y`: číslo – kombinovaná Y-ová souřadnice pohledu v pixelech, relativní k oknu aplikace v prohlížeči.

- `Left X`: číslo – X-ová souřadnice pohledu levého oka.

- `Left Y`: číslo – Y-ová souřadnice pohledu levého oka.

- `Left Validity`: boolean (`true`/`false`) – validita vzorku levého oka.

- `Left Pupil Diameter`: číslo – průměr zornice levého oka.

- `Right X`: číslo – X-ová souřadnice pohledu pravého oka.

- `Right Y`: číslo – Y-ová souřadnice pohledu pravého oka.

- `Right Validity`: boolean (`true`/`false`) – validita vzorku pravého oka.

- `Right Pupil Diameter`: číslo – průměr zornice pravého oka.

### Soubor *aoiGeometry_slide{N}.json*

Geometrie AOI zaznamenaná při sběru, jeden JSON na slide vedle CSV tabulek. Umožňuje spolehlivý přepočet AOI zásahů v postprocessingu (simulace sezení, serverové I2MC) včetně dynamických AOI (dwell oko/šipka, dwell-symbols).

- `version`: číslo – verze formátu (aktuálně 1).

- `slideIndex`: číslo – pořadí slidu.

- `stimulusId`: text nebo `null` – stimulus slidu (viz *gazeSamples*).

- `viewport`: objekt `{ width, height }` – rozměry okna prohlížeče v pixelech při nahrávání; souřadnice AOI platí jen pro tento viewport.

- `aois`: seznam objektů, jeden na interval registrace AOI v SDK:

  - `id`: text – ID AOI (viz seznam standardních AOI u *gazeSamples*).
  - `left`, `top`, `right`, `bottom`: číslo – obdélník AOI v pixelech, relativní k oknu aplikace.
  - `bufferSize`: číslo – rozšíření obdélníku v pixelech na všech stranách při vyhodnocení zásahu.
  - `fromTs`: číslo – epoch ms začátku platnosti (registrace AOI); stejná časová osa jako `Timestamp` v tabulkách.
  - `toTs`: číslo – epoch ms konce platnosti (odregistrace); chybí, pokud AOI zůstalo aktivní do konce slidu.

  Stejné `id` se může opakovat s různými intervaly (např. dwell oko po přerušení dwellování, měnící se cíle v dwell-symbols).
