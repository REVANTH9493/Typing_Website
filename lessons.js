// Typing tutor lessons database. Sourced and adapted from basics.pdf and text book.pdf.
const TYPING_LESSONS = [
  {
    level: 1,
    levelName: "Level 1: The Home Row",
    lessons: [
      {
        id: 1,
        title: "Lesson 1: The Anchors (F and J)",
        instructions: "Rest your left index finger on F (feel the bump!) and your right index finger on J (feel the bump!). Press Space with your thumb.",
        keys: ["f", "j", " "],
        text: "f j f j ff jj f f j j fj jf f j f j ff jj f j f j",
        isInitialKeyStage: true,
        fingerGuide: {
          "f": "L2", // Left index
          "j": "R2", // Right index
          " ": "RT"  // Right thumb (default space)
        }
      },
      {
        id: 2,
        title: "Lesson 2: Left Hand Home Keys (D, S, and A)",
        instructions: "Left hand fingers: pinky on A, ring on S, middle on D. Keep your index on F.",
        keys: ["a", "s", "d", "f"],
        text: "a s d f asdf fdsa dsa asf fda sda asdf asdf fdsa",
        isInitialKeyStage: true,
        fingerGuide: {
          "a": "L5", // Left pinky
          "s": "L4", // Left ring
          "d": "L3", // Left middle
          "f": "L2", // Left index
          " ": "RT"
        }
      },
      {
        id: 3,
        title: "Lesson 3: Right Hand Home Keys (K, L, and ;)",
        instructions: "Right hand fingers: middle on K, ring on L, pinky on ;. Keep your index on J.",
        keys: ["j", "k", "l", ";"],
        text: "j k l ; jkl; ;lkj kjl kl; l;k jk; jkl; jkl; ;lkj",
        isInitialKeyStage: true,
        fingerGuide: {
          "j": "R2", // Right index
          "k": "R3", // Right middle
          "l": "R4", // Right ring
          ";": "R5", // Right pinky
          " ": "RT"
        }
      },
      {
        id: 4,
        title: "Lesson 4: Reaches (G and H)",
        instructions: "Stretch your left index to reach G, and your right index to reach H. Return them to F and J after typing.",
        keys: ["g", "h"],
        text: "f g f j h j fg jh gh hg f g j h fgjh ghfg jg hf",
        isInitialKeyStage: true,
        fingerGuide: {
          "g": "L2",
          "h": "R2",
          "f": "L2",
          "j": "R2",
          " ": "RT"
        }
      },
      {
        id: 5,
        title: "Lesson 5: Home Row Drills",
        instructions: "Let's practice the complete home row sequence together.",
        keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
        text: "asdfgf ;lkjhj asdfgf ;lkjhj asdfgf ;lkjhj asdfgf ;lkjhj",
        isInitialKeyStage: false,
        fingerGuide: {
          "a": "L5", "s": "L4", "d": "L3", "f": "L2", "g": "L2",
          "h": "R2", "j": "R2", "k": "R3", "l": "R4", ";": "R5",
          " ": "RT"
        }
      },
      {
        id: 6,
        title: "Lesson 6: Simple Home Row Words",
        instructions: "Great! Now type actual words made entirely from the home row. Keep your wrists relaxed.",
        keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        text: "ask fad dad sad fall glad salad flash asks lash dash gaff adds alas",
        isInitialKeyStage: false,
        fingerGuide: {
          "a": "L5", "s": "L4", "d": "L3", "f": "L2", "g": "L2",
          "h": "R2", "j": "R2", "k": "R3", "l": "R4",
          " ": "RT"
        }
      }
    ]
  },
  {
    level: 2,
    levelName: "Level 2: The Top Row",
    lessons: [
      {
        id: 7,
        title: "Lesson 7: Top Row Index & Middle Reaches (E, I, R, and U)",
        instructions: "Reach up: Left index to R, Left middle to E. Right index to U, Right middle to I.",
        keys: ["e", "i", "r", "u"],
        text: "f r f d e d j u j k i k fr de ju ki re ui er iu",
        isInitialKeyStage: true,
        fingerGuide: {
          "f": "L2", "r": "L2", "d": "L3", "e": "L3",
          "j": "R2", "u": "R2", "k": "R3", "i": "R3",
          " ": "RT"
        }
      },
      {
        id: 8,
        title: "Lesson 8: Top Row Ring & Pinky Reaches (W, O, Q, and P)",
        instructions: "Reach up: Left ring to W, Left pinky to Q. Right ring to O, Right pinky to P.",
        keys: ["q", "w", "o", "p", "t", "y"],
        text: "a q a s w s l o l ; p ; aq sw lo ;p qw op qo wp",
        isInitialKeyStage: true,
        fingerGuide: {
          "a": "L5", "q": "L5", "s": "L4", "w": "L4",
          "l": "R4", "o": "R4", ";": "R5", "p": "R5",
          " ": "RT"
        }
      },
      {
        id: 9,
        title: "Lesson 9: Top Row Drills",
        instructions: "Reach up and back. Silently call each letter as you type.",
        keys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        text: "awerqfa ;oiupj; awerqfa ;oiupj; awerqfa ;oiupj; awerqfa ;oiupj;",
        isInitialKeyStage: false,
        fingerGuide: {
          "a": "L5", "w": "L4", "e": "L3", "r": "L2", "q": "L5", "f": "L2",
          ";": "R5", "o": "R4", "i": "R3", "u": "R2", "p": "R5", "j": "R2",
          " ": "RT"
        }
      },
      {
        id: 10,
        title: "Lesson 10: Words with Top & Home Rows",
        instructions: "Type these words. Take your time to build muscle memory.",
        keys: ["a", "d", "e", "f", "g", "h", "i", "j", "k", "l", "o", "p", "r", "s", "u", "w", "y"],
        text: "fish apple usual sales filed legal lease lakes agile isles ahead larks roses hedge forks skill rupee grass would",
        isInitialKeyStage: false,
        fingerGuide: {
          "a": "L5", "b": "L2", "c": "L3", "d": "L3", "e": "L3", "f": "L2", "g": "L2", "h": "R2",
          "i": "R3", "j": "R2", "k": "R3", "l": "R4", "m": "R2", "n": "R2", "o": "R4", "p": "R5",
          "q": "L5", "r": "L2", "s": "L4", "t": "L2", "u": "R2", "v": "L2", "w": "L4", "x": "L4",
          "y": "R2", "z": "L5", " ": "RT"
        }
      }
    ]
  },
  {
    level: 3,
    levelName: "Level 3: The Bottom Row",
    lessons: [
      {
        id: 11,
        title: "Lesson 11: Bottom Row Reaches (V, C, M, and ,)",
        instructions: "Reach down: Left index to V, Left middle to C. Right index to M, Right middle to comma (,).",
        keys: ["v", "c", "m", ","],
        text: "f v f d c d j m j k , k fvf dcd jmj k,k vc m, cv ,m",
        isInitialKeyStage: true,
        fingerGuide: {
          "f": "L2", "v": "L2", "d": "L3", "c": "L3",
          "j": "R2", "m": "R2", "k": "R3", ",": "R3",
          " ": "RT"
        }
      },
      {
        id: 12,
        title: "Lesson 12: Bottom Row Reaches (Z, X, N, . and /)",
        instructions: "Reach down: Left pinky to Z, Left ring to X. Right index to N, Right ring to period (.).",
        keys: ["z", "x", "n", ".", "/"],
        text: "a z a s x s j n j l . l az sx jn l.l zx n. xz .n",
        isInitialKeyStage: true,
        fingerGuide: {
          "a": "L5", "z": "L5", "s": "L4", "x": "L4",
          "j": "R2", "n": "R2", "l": "R4", ".": "R4",
          " ": "RT"
        }
      },
      {
        id: 13,
        title: "Lesson 13: Bottom Row Drills",
        instructions: "Let's practice standard drills connecting home and bottom row keys.",
        keys: ["a", "z", "x", "c", "v", "b", "n", "m", ",", "."],
        text: "azxcvf lkmnbj azxcvf lkmnbj azxcvf lkmnbj azxcvf lkmnbj",
        isInitialKeyStage: false,
        fingerGuide: {
          "a": "L5", "z": "L5", "x": "L4", "c": "L3", "v": "L2", "f": "L2",
          "l": "R4", "k": "R3", "m": "R2", "n": "R2", "b": "L2", "j": "R2",
          " ": "RT"
        }
      },
      {
        id: 14,
        title: "Lesson 14: Words with All Three Rows",
        instructions: "Excellent! You are now typing using all letter keys on the keyboard.",
        keys: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
        text: "cat jack boat have met wind verb move give met jack zero have enemy neither calling voted very vineyard metal",
        isInitialKeyStage: false,
        fingerGuide: {
          "a": "L5", "b": "L2", "c": "L3", "d": "L3", "e": "L3", "f": "L2", "g": "L2", "h": "R2",
          "i": "R3", "j": "R2", "k": "R3", "l": "R4", "m": "R2", "n": "R2", "o": "R4", "p": "R5",
          "q": "L5", "r": "L2", "s": "L4", "t": "L2", "u": "R2", "v": "L2", "w": "L4", "x": "L4",
          "y": "R2", "z": "L5", " ": "RT"
        }
      }
    ]
  },
  {
    level: 4,
    levelName: "Level 4: Numbers, Shift, and Punctuation",
    lessons: [
      {
        id: 15,
        title: "Lesson 15: Shift Key for Capitals",
        instructions: "Use the opposite Shift key to type capitals. For capital 'J', hold Left Shift with left pinky and press 'j'.",
        keys: ["shift", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
        text: "January February March April May June July August September October November December India America London Paris Tokyo Sydney",
        isInitialKeyStage: false,
        fingerGuide: {
          "J": "R2", "F": "L2", "M": "R2", "A": "L5", "O": "R4", "N": "R2", "D": "L3", "S": "L4",
          "I": "R3", "L": "R4", "P": "R5", "T": "L2", "S": "L4", "Y": "R2",
          "a": "L5", "b": "L2", "c": "L3", "d": "L3", "e": "L3", "f": "L2", "g": "L2", "h": "R2",
          "i": "R3", "j": "R2", "k": "R3", "l": "R4", "m": "R2", "n": "R2", "o": "R4", "p": "R5",
          "q": "L5", "r": "L2", "s": "L4", "t": "L2", "u": "R2", "v": "L2", "w": "L4", "x": "L4",
          "y": "R2", "z": "L5", " ": "RT"
        }
      },
      {
        id: 16,
        title: "Lesson 16: The Number Row",
        instructions: "Reach up to the number keys. Left hand types 1 to 5, right hand types 6 to 0.",
        keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        text: "123454 098767 123454 098767 153 4586 1298 96842 67492 97530",
        isInitialKeyStage: true,
        fingerGuide: {
          "1": "L5", "2": "L4", "3": "L3", "4": "L2", "5": "L2",
          "6": "R2", "7": "R2", "8": "R3", "9": "R4", "0": "R5",
          " ": "RT"
        }
      }
    ]
  },
  {
    level: 5,
    levelName: "Level 5: Sentence Practice",
    lessons: [
      {
        id: 17,
        title: "Lesson 17: Pangrams (All Alphabet Letters)",
        instructions: "Let's type sentences that use every letter of the alphabet. Keep a steady typing rhythm.",
        keys: [],
        text: "A quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. Five prizes were quickly distributed by the judge.",
        isInitialKeyStage: false,
        fingerGuide: {
          "A": "L5", "P": "R5", "F": "L2"
        }
      },
      {
        id: 18,
        title: "Lesson 5: Inspiring Paragraphs",
        instructions: "Let's practice typing paragraphs. This lesson is designed to test your overall speed and accuracy.",
        keys: [],
        text: "Our National Flag has three colors. Saffron stands for sacrifice. White represents peace. Green is for growth. The wheel in the center is the Ashok Chakra, which is a symbol of progress.",
        isInitialKeyStage: false,
        fingerGuide: {}
      }
    ]
  }
];
