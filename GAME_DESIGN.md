# Dolphin Jump — Game Design Document

A browser-based kids' board game built by a dad with his 7- and 4-year-old kids.
Roll a die, swim your dolphin along a 100-spot board, and be first to reach the finish.

This document combines the original concept (`IDEA.md`) with the design decisions
made during a question-by-question design interview. The guiding principle behind
every choice: **keep a 4-year-old genuinely engaged and rarely in tears, while still
feeling like a "real board game" the 7-year-old takes seriously.**

---

## 1. Overview

- **Genre:** roll-and-move race game (Chutes & Ladders / Candy Land lineage).
- **Platform:** web browser. Touch-friendly (works on a laptop or a tablet).
- **Goal:** be the first dolphin to reach the finish (spot 100).
- **Players:** 2–4, hot-seat on one device.
- **Session length:** a full-length, "classic board game" pace — comparable to real
  Chutes & Ladders.
- **Reading required:** none. The 4-year-old can play independently (see §6).

---

## 2. Players & setup

### Dolphin tokens
- Each player controls a dolphin of a distinct color: **purple, pink, blue, green**.

### Starting screen
- Shows the four colored dolphins.
- To the right of each dolphin is an **age entry** field.
- **A dolphin with no age entered is omitted** from the game.
- This supports any 2–4 player combination (e.g. ages `4`, `7`, `38`, and one left
  blank to sit out).

### Player count
- **2–4 players.**

---

## 3. Turn order

- **Youngest player goes first**, then play proceeds **youngest → oldest**.
- After the oldest goes, the order restarts from the youngest.
- Age (entered on the start screen) is used **only** to determine this order — it gives
  no other in-game advantage (see §8, Fairness).
- Tie in age: ordered by position on the start screen (top to bottom).

---

## 4. The board

- **100 spots**, laid out sequentially (snake/winding path, Chutes & Ladders style).
- The **start** and **finish** spots have their own distinct designs.
- **Most spots are plain.** A small number are **special** (see §5).
- Special spots carry extra decoration and communicate their action via **iconography
  + numbers** (e.g. an arrow with "+5").
- **Two or more dolphins may occupy the same spot** at the same time.

### Special-spot count (density)
- **Light: ~10–12 special spots** out of 100. Mostly plain board with occasional
  surprises — keeps a long game readable and calm for the 4-year-old.

### Mix / balance
- **Balanced** — roughly as many helpful spots as setbacks. A representative,
  tunable distribution for ~12 specials:

  | Type          | Count | Notes |
  |---------------|:-----:|-------|
  | Jump forward  | ~4    | small-to-medium advances |
  | Jump back     | ~4    | **mostly gentle (back 2–4); 1–2 bigger "dramatic" slides** |
  | Switch        | ~2    | the wild card (see §5) |
  | Roll again    | ~2    | bonus roll |

### Board-construction rules (invariants the layout MUST satisfy)
These constraints make several edge cases simply *impossible*, so the runtime never
has to handle them:

1. **No chaining.** Every **jump-forward and jump-back target is a plain spot** — a
   jump can never deposit a dolphin onto another special spot. (Combined with the
   resolution rule in §5, no special action can ever trigger another.)
2. **No backward underflow.** **Jump-back spots are placed far enough from the start
   that the largest back-jump can never go before spot 1.** A dolphin can never be
   pushed off the start of the board.
3. **Protected start & finish.** No special spots in roughly the **first ~10–15 spots**
   or the **final stretch**, so games begin gently and the finish-line moment is never
   ruined by a last-second setback.

---

## 5. Special spots

When a dolphin lands on a special spot **by rolling** (including a bonus roll from
"roll again"), its action happens **automatically** — see §6.

### The four special spots

- **Jump forward X** — advance the dolphin forward X spots.
- **Jump back X** — move the dolphin back X spots. Mostly gentle (2–4); a couple of
  bigger dramatic slides exist for excitement, but never near the finish.
- **Switch spots** — swap board positions with the **nearest other dolphin**.
  - "Nearest" = the other dolphin the **fewest spots away** (absolute distance, ahead
    or behind).
  - **Tie-break:** if one dolphin is equally near ahead and another behind, swap with
    the one **ahead**.
  - In a 2-player game this is simply the other dolphin.
  - If the nearest dolphin is sharing your exact spot, it's a no-op for that pair —
    use the next-nearest dolphin; if there is none, nothing happens.
  - **This is the game's wild card:** depending on who's nearby, a switch can rocket
    you forward *or* knock you back. It's a gamble, not a guaranteed catch-up.
- **Roll again** — immediately roll the die again and advance by that new roll.

### Resolution rule — "you only trigger what you ROLL onto"

> A special spot's action fires **only when a dolphin lands on it by rolling the die**
> (a normal roll or a bonus roll from "roll again"). A dolphin that arrives somewhere
> by being **displaced** — via a jump or a switch — does **not** trigger that
> destination's action.

Consequences:
- **Jump forward / jump back:** moves the dolphin once; the destination (a plain spot
  by board design, §4) does nothing further. Turn-effect resolved.
- **Switch:** both dolphins are repositioned; neither new spot triggers an action,
  even if it happens to be special.
- **Roll again:** the bonus roll is a *real roll*, so **whatever you land on does
  activate**. A "roll again" can therefore lead into:
  - another "roll again" → you roll a third time (delightful, and self-limiting by
    luck), or
  - a jump → which fires once and (by board design) lands you on a plain spot, ending
    the cascade cleanly.

The net effect: **no special action ever chains into another special action**, exactly
as intended — guaranteed jointly by the board-construction rules (§4) and this
resolution rule.

---

## 6. Rolling, moving & automatic actions

### The die
- A standard **6-sided die** (random 1–6), shown on screen.
- **Click/tap the die to roll.** The die plays a rolling/spinning animation in place.

### A turn, step by step
1. On the active player's turn, they tap the die to roll (1–6).
2. The dolphin advances that many spots along the board.
3. If it lands on a special spot, **the computer performs the action automatically** —
   it animates the dolphin doing it, with a clear icon and a fun sound (whoosh forward,
   bubble-pop back, swap shuffle, die rattle for roll-again).
   - A "roll again" hands control back for the bonus roll, then resolves its landing
     per §5.
4. The turn ends; play passes to the next player (§3).

### Why automatic
The 4-year-old can't read "Jump back 3," so the game never asks her to. She just taps
the die and watches her dolphin do the right thing — full independence, no getting
stuck, no adult needed every turn.

---

## 7. Winning & end of game

### Reaching the finish
- **Overshoot wins.** A dolphin wins by **reaching *or passing* spot 100** on a roll
  (or bonus roll). No exact count is required — nobody ever gets "stuck" a few spots
  from the end needing a perfect number.

### When the first dolphin finishes
- The winner gets an immediate **"You Win!"** celebration: the winning dolphin shown
  large, with a **firework-like effect with stars**.
- **Then everyone keeps swimming.** The remaining dolphins continue toward the finish,
  and each gets its own happy **"You made it!"** moment and a **place ribbon**
  (2nd, 3rd, 4th) as it crosses.
- This celebrates the winner *and* lets every kid finish their dolphin — so a 4-year-old
  in last place still gets a triumphant ending rather than just watching someone else win.

---

## 8. Fairness

- **Pure luck, perfectly fair.** Every player has identical odds; the die plays no
  favorites and no one gets a secret boost.
- This is exactly why roll-and-move games suit mixed ages: the 4-year-old wins about as
  often as anyone, on her own merit, and the 7-year-old can never cry "no fair!"
- Going first (youngest) is the only — and tiny — edge, and it falls to the youngest.

---

## 9. Edge cases & invariants (quick reference)

| Situation | Outcome |
|-----------|---------|
| Roll/bonus-roll reaches or passes spot 100 | **Win** (overshoot allowed) |
| Jump lands on another special spot | **Cannot happen** — jump targets are always plain (§4) |
| Jump back would go before the start | **Cannot happen** — back-jumps placed so they never underflow (§4) |
| Special action triggers another special action | **Never** — see resolution rule (§5) |
| Two dolphins on the same spot | **Allowed** |
| "Roll again" → "roll again" | Roll a third time; bounded by luck |
| Switch with nearest, nearest is on your own spot | Use next-nearest; if none, no-op |
| First dolphin finishes | Winner celebration, then others finish for 2nd/3rd/4th (§7) |

---

## 10. Art direction

Overall style: **Deep-Sea Adventure** — an immersive underwater quest. Deep-blue water,
light rays, rising bubbles, coral & seaweed, glossy dolphins, and a treasure-chest
finish. Exciting for the 7-year-old, with a hard rule running through every art choice:
**keep the dolphins and the special spots bright and high-contrast so the 4-year-old can
always read the board** (deep blue water + a blue dolphin must never blur together).

### Dolphins (the four tokens & the win-screen heroes)
- **Cute glossy mascots:** big sparkly eyes, friendly smiles, slightly chibi/rounded
  bodies, wet glossy shine.
- Each wears its player color **plus a bright outline/glow rim** so all four — especially
  blue — pop off the deep-blue water and stay distinct when two share a spot.
- **Motion:** gentle idle bob; a happy flip when landing on a good spot.

### Board layout
- **Whole board visible at once**, as a winding **S-path snake** (Chutes & Ladders style):
  **start at the bottom**, **treasure-chest finish at the top**.
- Everyone always sees every dolphin and how close the race is — important for the
  4-year-old's sense of the game.
- Spots get small at 100-on-screen, so: **numbers stay big**, and **dolphin tokens float
  slightly above the path** so they never cover the spot number.

### The deep-sea world (scenery)
- **Depth journey — sunlight → treasure** (selected by recommendation; default):
  - **Bottom (start):** bright **sunlit shallows** with coral and little fish.
  - Climbing the board, the water **deepens** through reef, kelp, and a shipwreck…
  - **Top (finish):** mysterious **deep blue** with a **glowing treasure chest**.
  - The deepening water doubles as a **progress cue** — the 4-year-old can see she's
    "going deeper" toward the prize — while every band stays bright enough to read tokens.

### Special-spot icons (must read instantly for a non-reader)
**Themed ocean icons, color-coded** — each carries its number (e.g. "5") but the picture
carries the meaning:

| Action | Icon | Color |
|--------|------|-------|
| Jump forward | bubble-current / water-jet whooshing ahead | **green** (good) |
| Jump back | grabby **octopus** (or anchor) pulling back | **red** (setback) |
| Switch | **whirlpool** / two swirling swap arrows | **blue** |
| Roll again | sparkly **die** (starfish accent) | **gold** |

Color reinforces good-vs-setback at a glance; the four shapes are deliberately distinct.

### Start screen
- **Four dolphins bobbing at the sunlit surface** under a big treasure-map **"Dolphin
  Jump"** title.
- **Tap a dolphin to join** — it perks up / glows. A friendly age control sits beside each;
  **leave it blank to sit that dolphin out** (§2).
- **Age entry uses tap-friendly +/− steppers (no keyboard needed)** so the 4-year-old can
  set her own age — woven into the surface scene.
- A big **"Dive in!"** button starts the race.

### Win / celebration screen
- **Treasure-chest party:** the winning dolphin bursts up and **leaps over an open glowing
  treasure chest**, **"You Win!"** in big bouncy letters, with **fireworks + stars +
  bubbles** and a happy cheer.
- Then a tidy **ribbons panel** fills in **2nd / 3rd / 4th** as each remaining dolphin
  finishes (per the end-of-game flow, §7), each with a little "You made it!" moment.

### Typography
- **Title:** chunky, bubbly **rounded display font** — playful, fits the splashy mood.
- **Board numbers:** clean, **heavy rounded sans**, kept **razor-sharp and high-contrast**
  even on small tiles over dark water (the 7-year-old reads these to count toward 100).

---

## 11. Still open (future rounds)

- **Audio & "juice"** — sound effects (whoosh forward, bubble-pop back, swap shuffle, die
  rattle, victory cheer), music, animation feel, celebration polish.
- **Technical build** — framework/stack, project structure, how the board layout and the
  ~10–12 special-spot positions/values are defined in code, and deployment.

---

## Appendix: decision log

| # | Decision | Choice |
|---|----------|--------|
| 1 | Game length / board size | Full **100 spots**, classic pace |
| 2 | Finish rule | **Overshoot wins** (reach or pass 100) |
| 3 | Setback severity | **Mostly gentle (2–4), 1–2 dramatic** slides |
| 4 | Switch-spot rule | **Switch with the nearest dolphin** (kept) |
| 5 | Chaining | **Prevented by board design** (jump targets are plain) |
| 6 | "Roll again" landing | **Activates** (bonus roll is a real roll) |
| 7 | Special-spot density | **Light, ~10–12** |
| 8 | Good vs. bad balance | **Balanced** |
| 9 | Who performs special actions | **Computer, automatically** (no reading) |
| 10 | End of game | **Winner party, then everyone finishes** for places |
| 11 | Fairness | **Pure luck**; age used only for turn order |
| 12 | Back-past-start | **Prevented by board design** |
| 13 | Overall art style | **Deep-Sea Adventure** (immersive underwater quest) |
| 14 | Dolphin design | **Cute glossy mascots** + bright glow rim, idle bob / happy flip |
| 15 | Board layout | **Whole board visible**, winding S-snake, start bottom → chest top |
| 16 | Sea world | **Depth journey**: sunlit shallows → deep blue treasure (progress cue) |
| 17 | Special-spot icons | **Themed ocean icons**, color-coded (green/red/blue/gold) |
| 18 | Start screen | **Four dolphins at the surface**, tap-to-join, +/− age steppers, "Dive in!" |
| 19 | Win screen | **Treasure-chest party** + fireworks, then ribbons fill 2nd/3rd/4th |
| 20 | Typography | **Bouncy rounded title**, crisp heavy-rounded board numbers |
