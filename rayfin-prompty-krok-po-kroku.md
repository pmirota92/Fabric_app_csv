# Prompty krok po kroku — Fabric App (Rayfin) „Airline Financial Impact”

Zestaw promptów do wklejania w agenta kodującego (Claude Code, GitHub Copilot Chat, Cursor, agent Replit). Dane masz już w `public/data`.

## Jak używać
- Wklejaj **jeden prompt na raz**, czekaj na efekt, przejrzyj zmiany, dopiero potem kolejny.
- **Prompt 0** wklej jako pierwszy — ustawia kontekst dla całej sesji. Reszta się na nim opiera.
- Placeholdery typu `<...>` podmień na swoje wartości.
- Jeśli coś nie działa, użyj **Promptu D (debug)** na końcu.

---

## Prompt 0 — Kontekst (wklej raz, na start sesji)

```text
Pracujemy nad aplikacją Microsoft Fabric App zbudowaną na frameworku Rayfin
(React + Vite + TypeScript w folderze src/, backend/CLI w folderze rayfin/).

Cel: prosty, ładny raport analityczny "Airline Financial Impact", który czyta
dane z lokalnego pliku CSV w public/data i opowiada historię w danych za pomocą
KPI, 4 wykresów i slicerów (filtrów) działających na wszystkie wizualizacje naraz.

Zasady:
- Raport jest TYLKO DO ODCZYTU — nie używamy bazy ani auth z Rayfina, dane
  czytamy bezpośrednio z CSV w przeglądarce.
- Biblioteki: papaparse (parsowanie CSV) + recharts (wykresy). Nic więcej.
- Styl: czysty, "senior analityk" — jeden kolor akcentu, dużo białej przestrzeni,
  czerwony/zielony tylko dla wartości dobra/zła.
- Kod ma być w TypeScript, czytelny, w jednym pliku src/App.tsx + src/App.css,
  chyba że poproszę inaczej.

Potwierdź, że rozumiesz kontekst, i czekaj na moje kolejne instrukcje.
Nie pisz jeszcze kodu.
```

---

## Prompt 1 — Scaffold projektu (POMIŃ, jeśli projekt już istnieje)

```text
Jeśli w bieżącym folderze nie ma jeszcze projektu Rayfin, wykonaj scaffold:

  npm create @microsoft/rayfin@latest -- airline-impact --workspace <nazwa-workspace>

Wybierz szablon React. Następnie wejdź do folderu projektu (cd airline-impact)
i pokaż mi wygenerowaną strukturę katalogów (rayfin/, src/, public/, package.json).
Jeśli projekt już istnieje, nic nie rób i tylko to potwierdź.
```

---

## Prompt 2 — Rozpoznanie danych (najważniejszy krok)

```text
Wczytaj plik CSV z public/data (jeśli jest więcej niż jeden, wymień je i zapytaj,
którego użyć). Pokaż mi:
1. Dokładną nazwę pliku i jego ścieżkę.
2. Listę WSZYSTKICH kolumn dokładnie tak, jak są zapisane w nagłówku.
3. 3 przykładowe wiersze.
4. Dla każdej kolumny: zaproponuj, czy to MIARA (liczba do sumowania, np. przychód)
   czy WYMIAR (kategoria do filtrowania/grupowania, np. linia lotnicza, region, data).
5. Zaproponuj mapowanie na role potrzebne w raporcie:
   - okres/data, linia lotnicza, region,
   - przychód, koszty operacyjne, koszt paliwa, wynik netto,
   - liczba pasażerów, load factor.
   Jeśli którejś roli brakuje (np. brak "wynik netto"), zaznacz to i zaproponuj,
   jak ją policzyć z innych kolumn.

Wypisz wynik jako tabelę. Zapamiętaj to mapowanie — będziemy go używać dalej.
Jeszcze NIE pisz kodu aplikacji.
```

---

## Prompt 3 — Konfiguracja i biblioteki

```text
Przygotuj projekt pod raport read-only:
1. W rayfin/rayfin.yml ustaw services.auth.enabled, services.data.enabled
   i services.storage.enabled na false; zostaw staticHosting.enabled na true
   (root: ., folder: dist, buildCommand: npm run build, indexDocument: index.html).
2. Zainstaluj zależności:
   npm install papaparse recharts
   npm install -D @types/papaparse
Pokaż mi finalny rayfin.yml i potwierdź instalację.
```

---

## Prompt 4 — Wczytywanie i typowanie danych

```text
W src/App.tsx zbuduj fundament aplikacji:
- Typ Row na podstawie mapowania kolumn z Promptu 2.
- Hook, który przez fetch() pobiera plik CSV z public/data, parsuje go papaparse
  (header: true, skipEmptyLines: true) i mapuje na Row[].
- W mapowaniu użyj DOKŁADNYCH nazw kolumn z mojego pliku. Liczby czyść z separatorów
  i znaków waluty. Jeśli brakuje "wynik netto", policz go jako przychód − koszty operacyjne.
- Dodaj stan loading i prosty komunikat "Wczytywanie danych…".
Na tym etapie wyrenderuj tylko nagłówek raportu i liczbę wczytanych wierszy,
żebym mógł potwierdzić, że dane się ładują. Uruchom mentalnie i wskaż,
co zobaczę po npm run dev.
```

---

## Prompt 5 — Slicery (filtry globalne)

```text
Dodaj slicery sterujące CAŁYM raportem:
- Trzy filtry: Rok (lub okres), Region, Przewoźnik — każdy jako lista rozwijana
  z opcją "Wszystkie", zbudowana z unikalnych wartości w danych.
- Stan filtrów w useState; useMemo "filtered", które filtruje Row[] wg wszystkich
  trzech naraz.
- Wydziel mały komponent Slicer (label + select).
Wszystkie kolejne wizualizacje mają liczyć się z "filtered", nie z surowych danych.
Pokaż UI slicerów nad treścią raportu.
```

---

## Prompt 6 — KPI (nagłówkowe metryki)

```text
Dodaj rząd 4 kart KPI liczonych z "filtered":
- Przychód (suma), Koszty operacyjne (suma), Wynik netto (suma), Marża netto (wynik/przychód).
- Liczby formatuj w mln (np. "210M") i procenty z jednym miejscem po przecinku.
- Wynik netto i marża: kolor zielony gdy ≥ 0, czerwony gdy < 0.
Wydziel komponent Kpi. KPI mają reagować na slicery.
```

---

## Prompt 7 — Wykres 1: nożyce przychód vs koszt (w czasie)

```text
Dodaj pierwszy wykres (recharts ComposedChart, ResponsiveContainer, wysokość ~300):
- Dane: "filtered" zagregowane po okresie/dacie (suma przychodu i kosztów),
  posortowane rosnąco po dacie.
- Przychód jako pole (Area), koszty operacyjne jako linia (Line).
- Oś Y formatowana w mln, tooltip w mln, legenda, delikatna siatka.
- Nagłówek sekcji i krótki podpis wyjaśniający, że im węższa przestrzeń między
  polem a linią, tym cieńsza marża.
Umieść w komponencie <section className="card">.
```

---

## Prompt 8 — Wykres 2: wynik netto wg przewoźnika

```text
Dodaj wykres słupkowy (BarChart) wyniku netto w podziale na przewoźnika:
- Dane: "filtered" zgrupowane po linii lotniczej (suma wyniku netto), sortowane malejąco.
- Słupek zielony gdy wartość ≥ 0, czerwony gdy < 0 (recharts Cell).
- Linia odniesienia y=0 (ReferenceLine), oś Y w mln, tooltip w mln.
- Nagłówek + podpis "zielony = zysk, czerwony = strata".
```

---

## Prompt 9 — Wykres 3: struktura kosztów (paliwo vs reszta)

```text
Dodaj wykres warstwowy skumulowany (AreaChart, stackId wspólny):
- Dane: "filtered" zagregowane po okresie; dla każdego okresu policz koszt paliwa
  oraz "pozostałe koszty" = koszty operacyjne − koszt paliwa.
- Dwie warstwy: Paliwo i Pozostałe koszty, różne kolory.
- Oś Y w mln, tooltip w mln, legenda.
- Nagłówek "Co napędza koszty: paliwo vs reszta".
Jeśli w danych nie ma kosztu paliwa, powiedz mi i zaproponuj zamiennik
zamiast zgadywać.
```

---

## Prompt 10 — Wykres 4: efektywność (load factor vs marża)

```text
Dodaj wykres punktowy (ScatterChart):
- Dla każdego przewoźnika policz: średni load factor (oś X, w %), marżę netto
  (oś Y, w %) i sumę pasażerów (rozmiar bąbla przez ZAxis).
- Każdy punkt w innym kolorze z palety, tooltip pokazujący nazwę przewoźnika.
- Nagłówek "Load factor vs marża netto" + podpis "wielkość bąbla = liczba pasażerów".
Jeśli brakuje load factor lub liczby pasażerów, zaproponuj alternatywną oś
zamiast zgadywać.
```

---

## Prompt 11 — Styl i narracja (wykończenie)

```text
Dopracuj src/App.css i teksty, tak by raport wyglądał jak praca senior analityka:
- Layout: wyśrodkowana kolumna max ~1080px, karty z subtelną ramką i zaokrągleniem,
  dużo białej przestrzeni, spójna typografia, jeden kolor akcentu (niebieski),
  czerwony/zielony tylko dla dobra/zła.
- KPI w siatce 4 kolumny (2 na wąskich ekranach).
- Narracja: nagłówek raportu z jednym zdaniem tezy, a podpisy pod wykresami
  zamień z opisowych na wnioskowe (mają mówić, CO widać, nie tylko co to za wykres).
- Kolejność sekcji ma tworzyć łuk: co się działo w czasie → kogo dotknęło →
  dlaczego (koszty) → wniosek (efektywność).
Pokaż finalny App.css i zmienione nagłówki.
```

---

## Prompt 12 — Test lokalny

```text
Uruchom npm run dev i podaj mi adres lokalny. Następnie:
- Sprawdź, czy konsola przeglądarki nie zgłasza błędów.
- Potwierdź, że slicery zmieniają WSZYSTKIE wykresy i KPI naraz.
- Jeśli któryś wykres jest pusty, zdiagnozuj przyczynę (najczęściej niezgodność
  nazw kolumn) i zaproponuj poprawkę w mapowaniu.
```

---

## Prompt 13 — Deploy do Microsoft Fabric (gdy masz dostęp)

```text
Przygotuj deploy aplikacji jako Fabric App:
1. Upewnij się, że jestem zalogowany: npx rayfin login
2. Pokaż podgląd bez zmian: npx rayfin up --dry-run
3. Po mojej akceptacji wykonaj deploy: npx rayfin up
4. Pokaż status i wynikowy URL aplikacji oraz link do portalu Fabric:
   npx rayfin up status
NIE uruchamiaj samego "rayfin up" zanim nie zatwierdzę wyniku dry-run.
```

---

## Prompt D — Debug (gdy coś nie działa)

```text
Coś nie działa. Zdiagnozuj problem:
- Pokaż mi błędy z terminala i z konsoli przeglądarki.
- Wypisz nazwy kolumn realnie odczytane z CSV i porównaj je z nazwami użytymi
  w mapowaniu w App.tsx — wskaż rozbieżności.
- Zaproponuj minimalną poprawkę i wyjaśnij, dlaczego to naprawi problem.
Nie przebudowuj całej aplikacji — zmień tylko to, co konieczne.
```

---

## Prompt R — Iteracja / dodatkowe wykresy (opcjonalnie)

```text
Chcę dodać/zmienić wizualizację: <opisz, np. "wykres przychodu na pasażera
w czasie" albo "tabela TOP 5 najbardziej stratnych tras">.
Zaproponuj najpierw, jak to policzyć z dostępnych kolumn i jaki typ wykresu
będzie najlepszy, a po mojej akceptacji dodaj to spójnie ze stylem reszty raportu.
```
