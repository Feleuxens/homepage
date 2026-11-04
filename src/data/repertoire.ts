// The repertoire on /music. The homepage excerpt and the piano highlights on /about pick
// from it by title, so a renamed piece can't drift apart between pages.
interface Piece {
  composer: string;
  piece: string;
  /** Used where there is less room */
  shortComposer?: string;
  shortPiece?: string;
}

export const repertoire: { part: string; pieces: Piece[] }[] = [
  {
    part: "Classical",
    pieces: [
      { composer: "Chopin", piece: "Nocturne No. 20 in C♯ minor" },
      { composer: "Rachmaninoff", piece: "Prelude in C♯ minor" },
      { composer: "Rachmaninoff", piece: "Prelude in G♯ minor" },
      { composer: "Schubert", piece: "Impromptu Op. 90 No. 2 in E♭ major", shortPiece: "Impromptu Op. 90 No. 2" },
    ],
  },
  {
    part: "Wedding Favourites",
    pieces: [
      { composer: "Pachelbel", piece: "Canon in D" },
      { composer: "Bart Howard", piece: "Fly Me to the Moon (arr. D. Steinhauer)" },
      { composer: "Elton John", piece: "Can You Feel the Love Tonight" },
    ],
  },
  {
    part: "Contemporary",
    pieces: [
      { composer: "Consuelo Velázquez", piece: "Bésame mucho" },
      { composer: "Ludovico Einaudi", piece: "Nuvole bianche", shortComposer: "Einaudi" },
      { composer: "Ludovico Einaudi", piece: "Fuori dalla notte", shortComposer: "Einaudi" },
      { composer: "Yiruma", piece: "River Flows in You" },
      { composer: "Eric Clapton", piece: "Tears in Heaven" },
    ],
  },
  {
    part: "Soundtracks",
    pieces: [
      { composer: "How to Train Your Dragon", piece: "Romantic Flight" },
      { composer: "Gladiator", piece: "Now We Are Free" },
      { composer: "Pearl Harbor", piece: "Tennessee" },
      { composer: "James Bond", piece: "No Time to Die" },
    ],
  },
];

function find(title: string): Piece {
  const found = repertoire.flatMap(part => part.pieces).find(p => p.piece === title);
  if (!found) throw new Error(`Repertoire: no piece called "${title}"`);
  return found;
}

/** Homepage preview */
export const programmeExcerpt = ["Canon in D", "Nuvole bianche", "Prelude in C♯ minor", "River Flows in You", "Now We Are Free"]
  .map(find)
  .map(p => ({ composer: p.shortComposer ?? p.composer, piece: p.piece }));

/** About page, instrument list */
export const pianoHighlights = ["Prelude in C♯ minor", "Prelude in G♯ minor", "Impromptu Op. 90 No. 2 in E♭ major"]
  .map(find)
  .map(p => `${p.shortComposer ?? p.composer} · ${p.shortPiece ?? p.piece}`);
