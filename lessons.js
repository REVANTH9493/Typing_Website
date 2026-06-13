// Typing tutor lessons database. Sourced and adapted from basics.pdf and text book.pdf.
const TYPING_LESSONS = [
  {
    level: 1,
    levelName: "Level 1: The Home Row Anchors",
    lessons: [
      {
        id: 1,
        title: "Lesson 1: The Home Row Anchors",
        instructions: "Place your fingers on the Home Row: Left hand on A S D F, Right hand on J K L ;. Type only asdf and ;lkj.",
        keys: ["a", "s", "d", "f", "j", "k", "l", ";", " "],
        text: "asdf ;lkj asdf ;lkj asdf ;lkj asdf ;lkj asdf ;lkj",
        isInitialKeyStage: true,
        fingerGuide: {
          "a": "L5",
          "s": "L4",
          "d": "L3",
          "f": "L2",
          "j": "R2",
          "k": "R3",
          "l": "R4",
          ";": "R5",
          " ": "RT"
        }
      }
    ]
  },
  {
    level: 2,
    levelName: "Level 2: Extending the Home Row",
    lessons: [
      {
        id: 2,
        title: "Lesson 2: Extending the Home Row (G and H)",
        instructions: "Type asdfg and ;lkjh. Reach your left index finger to G and right index finger to H.",
        keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", " "],
        text: "asdfg ;lkjh asdfg ;lkjh asdfg ;lkjh asdfg ;lkjh asdfg ;lkjh",
        isInitialKeyStage: true,
        fingerGuide: {
          "a": "L5",
          "s": "L4",
          "d": "L3",
          "f": "L2",
          "g": "L2",
          "j": "R2",
          "k": "R3",
          "l": "R4",
          ";": "R5",
          "h": "R2",
          " ": "RT"
        }
      }
    ]
  },
  {
    level: 3,
    levelName: "Level 3: Jumbled Home Row Practice",
    lessons: [
      {
        id: 3,
        title: "Lesson 3: Jumbled Home Row Practice",
        instructions: "Practice typing jumbled words and letter combinations using only the keys: asdfg;lkjh",
        keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", " "],
        text: "asdfg ;lkjh fdasg hjkl; gasdf hlkj; ask fad dad sad glad salad flash lash dash gaff adds half shall flag",
        isInitialKeyStage: true,
        fingerGuide: {
          "a": "L5",
          "s": "L4",
          "d": "L3",
          "f": "L2",
          "g": "L2",
          "j": "R2",
          "k": "R3",
          "l": "R4",
          ";": "R5",
          "h": "R2",
          " ": "RT"
        }
      }
    ]
  },
  {
    level: 4,
    levelName: "Level 4: Top Row Anchors",
    lessons: [
      {
        id: 4,
        title: "Lesson 4: Top Row Anchors (QWER POIU)",
        instructions: "Place your fingers on the Home Row, and reach up to type: q w e r with left hand, and p o i u with right hand.",
        keys: ["q", "w", "e", "r", "u", "i", "o", "p", " "],
        text: "qwer poiu qwer poiu qwer poiu qwer poiu qwer poiu",
        isInitialKeyStage: true,
        fingerGuide: {
          "q": "L5", "w": "L4", "e": "L3", "r": "L2",
          "u": "R2", "i": "R3", "o": "R4", "p": "R5",
          " ": "RT"
        }
      }
    ]
  },
  {
    level: 5,
    levelName: "Level 5: Extending the Top Row",
    lessons: [
      {
        id: 5,
        title: "Lesson 5: Extending the Top Row (QWERT POIUY)",
        instructions: "Reach your left index finger to T, and right index finger to Y. Type qwert and poiuy.",
        keys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", " "],
        text: "qwert poiuy qwert poiuy qwert poiuy qwert poiuy qwert poiuy",
        isInitialKeyStage: true,
        fingerGuide: {
          "q": "L5", "w": "L4", "e": "L3", "r": "L2", "t": "L2",
          "y": "R2", "u": "R2", "i": "R3", "o": "R4", "p": "R5",
          " ": "RT"
        }
      }
    ]
  },
  {
    level: 6,
    levelName: "Level 6: Jumbled Top Row Practice",
    lessons: [
      {
        id: 6,
        title: "Lesson 6: Jumbled Top Row Practice",
        instructions: "Practice typing jumbled words and letter combinations using only the keys: qwertpoiuy",
        keys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", " "],
        text: "qwert poiuy reqw yuiop qewr tyuio power tower write route prior proper quiet query poetry writer torque output report",
        isInitialKeyStage: true,
        fingerGuide: {
          "q": "L5", "w": "L4", "e": "L3", "r": "L2", "t": "L2",
          "y": "R2", "u": "R2", "i": "R3", "o": "R4", "p": "R5",
          " ": "RT"
        }
      }
    ]
  },
  {
    level: 7,
    levelName: "Level 7: Home & Top Row Mix",
    lessons: [
      {
        id: 7,
        title: "Lesson 7: Home & Top Row Mix",
        instructions: "Let's practice typing a mix of all home row and top row letters and words.",
        keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", " "],
        text: "they are here to help you read write easy words to show your skill play glad house top row drills like type write work high row",
        isInitialKeyStage: false,
        fingerGuide: {
          "a": "L5", "s": "L4", "d": "L3", "f": "L2", "g": "L2",
          "h": "R2", "j": "R2", "k": "R3", "l": "R4", ";": "R5",
          "q": "L5", "w": "L4", "e": "L3", "r": "L2", "t": "L2",
          "y": "R2", "u": "R2", "i": "R3", "o": "R4", "p": "R5",
          " ": "RT"
        }
      }
    ]
  },
  {
    level: 8,
    levelName: "Level 8: Bottom Row Anchors",
    lessons: [
      {
        id: 8,
        title: "Lesson 8: Bottom Row Anchors (ZXC ,MN)",
        instructions: "Place your fingers on the Home Row, and reach down to type: z x c with left hand, and , m n with right hand.",
        keys: ["z", "x", "c", ",", "m", "n", " "],
        text: "zxc ,mn zxc ,mn zxc ,mn zxc ,mn zxc ,mn",
        isInitialKeyStage: true,
        fingerGuide: {
          "z": "L5", "x": "L4", "c": "L3",
          "m": "R2", "n": "R2", ",": "R3",
          " ": "RT"
        }
      }
    ]
  },
  {
    level: 9,
    levelName: "Level 9: Extending the Bottom Row",
    lessons: [
      {
        id: 9,
        title: "Lesson 9: Extending the Bottom Row (ZXCV ,MNB)",
        instructions: "Reach your left index finger down to V, and right index finger down to B. Type zxcv and ,mnb.",
        keys: ["z", "x", "c", "v", ",", "m", "n", "b", " "],
        text: "zxcv ,mnb zxcv ,mnb zxcv ,mnb zxcv ,mnb zxcv ,mnb",
        isInitialKeyStage: true,
        fingerGuide: {
          "z": "L5", "x": "L4", "c": "L3", "v": "L2",
          "b": "L2", "n": "R2", "m": "R2", ",": "R3",
          " ": "RT"
        }
      }
    ]
  },
  {
    level: 10,
    levelName: "Level 10: Jumbled & Words Mix (All Three Rows)",
    lessons: [
      {
        id: 10,
        title: "Lesson 10: Jumbled & Words Mix (All Three Rows)",
        instructions: "Practice typing words and letter combinations using all letters across all three rows.",
        keys: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", ",", "."],
        text: "cat jack boat have met wind verb move give met jack zero have enemy neither calling voted very vineyard metal",
        isInitialKeyStage: false,
        fingerGuide: {
          "a": "L5", "b": "L2", "c": "L3", "d": "L3", "e": "L3", "f": "L2", "g": "L2", "h": "R2",
          "i": "R3", "j": "R2", "k": "R3", "l": "R4", "m": "R2", "n": "R2", "o": "R4", "p": "R5",
          "q": "L5", "r": "L2", "s": "L4", "t": "L2", "u": "R2", "v": "L2", "w": "L4", "x": "L4",
          "y": "R2", "z": "L5", ",": "R3", ".": "R4", " ": "RT"
        }
      }
    ]
  },
  {
    level: 11,
    levelName: "Level 11: Numbers, Shift, and Punctuation",
    lessons: [
      {
        id: 11,
        title: "Lesson 11: Shift Key for Capitals",
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
        id: 12,
        title: "Lesson 12: The Number Row",
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
    level: 12,
    levelName: "Level 12: Sentence Practice",
    lessons: [
      {
        id: 13,
        title: "Lesson 13: Pangrams (All Alphabet Letters)",
        instructions: "Let's type sentences that use every letter of the alphabet. Keep a steady typing rhythm.",
        keys: [],
        text: "A quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. Five prizes were quickly distributed by the judge.",
        isInitialKeyStage: false,
        fingerGuide: {
          "A": "L5", "P": "R5", "F": "L2"
        }
      },
      {
        id: 14,
        title: "Lesson 14: Inspiring Paragraphs",
        instructions: "Let's practice typing paragraphs. This lesson is designed to test your overall speed and accuracy.",
        keys: [],
        text: "Our National Flag has three colors. Saffron stands for sacrifice. White represents peace. Green is for growth. The wheel in the center is the Ashok Chakra, which is a symbol of progress.",
        isInitialKeyStage: false,
        fingerGuide: {}
      }
    ]
  }
];
