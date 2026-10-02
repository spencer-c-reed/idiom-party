// Original clues inspired by the synonym-and-circumlocution mechanic of Idiom Addict.
// Each clue avoids answer content words and stays grammatical when read aloud.
const synonymTwists = [
  ["A snack-sized splinter perched beside your neck", "A chip on your shoulder", "M"],
  ["The instant someone releases their head covering", "At the drop of a hat", "M"],
  ["Every passenger sharing one floating conveyance", "All in the same boat", "M"],
  ["One reaching appendage plus one walking appendage", "An arm and a leg", "E"],
  ["Yapping toward a completely unrelated piece of lumber", "Barking up the wrong tree", "M"],
  ["Striking everything surrounding the shrubbery", "Beat around the bush", "M"],
  ["The finest development following pre-portioned toast material", "Best thing since sliced bread", "H"],
  ["Sink your teeth into the ammunition", "Bite the bullet", "M"],
  ["Fracture one of your walking supports", "Break a leg", "E"],
  ["Set fire to the fuel reserved for twelve at night", "Burn the midnight oil", "H"],
  ["Escaping by the outermost coating of your chewing equipment", "By the skin of your teeth", "H"],
  ["Declare the remaining hours officially finished", "Call it a day", "M"],
  ["Discovered with freshly crimson gripping tools", "Caught red-handed", "M"],
  ["Priced at one reaching limb and one walking limb", "Cost an arm and a leg", "M"],
  ["Slice straight to the pursuit", "Cut to the chase", "M"],
  ["One small silver coin buys twelve of them", "Dime a dozen", "H"],
  ["Waste no tears on dairy already covering the floor", "Don't cry over spilled milk", "H"],
  ["Approaching the final strand of metal", "Down to the wire", "M"],
  ["Sketch the boundary nobody may cross", "Draw the line", "M"],
  ["Tumbling at the survival rate of winged pests", "Dropping like flies", "M"],
  ["Effortlessly performs the deed", "Easy does it", "H"],
  ["Every gloomy mass of vapor hides a precious-metal border", "Every cloud has a silver lining", "H"],
  ["Turn toward the melody and accept the consequences", "Face the music", "M"],
  ["As healthy as a small bowed instrument", "Fit as a fiddle", "M"],
  ["Escape from the grasp", "Get out of hand", "H"],
  ["Gather your entire performance into one place", "Get your act together", "M"],
  ["Award uncertainty the favorable assumption", "Give the benefit of the doubt", "H"],
  ["Return to the first box on the board", "Go back to square one", "M"],
  ["Travel beyond the required distance", "Go the extra mile", "M"],
  ["Remain suspended at your present location", "Hang in there", "H"],
  ["Strike the fastener precisely on its crown", "Hit the nail on the head", "M"],
  ["Punch the cloth container used at bedtime", "Hit the sack", "M"],
  ["Submerged in liquid that is uncomfortably warm", "In hot water", "M"],
  ["This dance requires exactly a pair", "It takes two to tango", "H"],
  ["Leap aboard the vehicle carrying the musicians", "Jump on the bandwagon", "M"],
  ["Maintain your jaw in an elevated position", "Keep your chin up", "M"],
  ["Deliver a boot to the handled container", "Kick the bucket", "M"],
  ["Release the whiskered animal from its cloth container", "Let the cat out of the bag", "M"],
  ["Arrive too late to board the departing vessel", "Miss the boat", "M"],
  ["Absent agony, absent advancement", "No pain, no gain", "M"],
  ["Positioned directly atop the sporting sphere", "On the ball", "H"],
  ["Standing above dangerously fragile frozen water", "On thin ice", "M"],
  ["A single occurrence beneath a strangely colored lunar body", "Once in a blue moon", "H"],
  ["Arriving unexpectedly from the sky’s color", "Out of the blue", "H"],
  ["One serving of frosted baked dessert", "Piece of cake", "M"],
  ["Drag your scattered self back into one unit", "Pull yourself together", "H"],
  ["Cause precipitation over someone’s festive procession", "Rain on your parade", "M"],
  ["Interpret what was never printed in the spaces between rows", "Read between the lines", "H"],
  ["Mention the evil one and watch who appears", "Speak of the devil", "M"],
  ["Scatter the legumes and expose the secret", "Spill the beans", "M"],
  ["Swallow that claim with one tiny crystal of seasoning", "Take it with a grain of salt", "H"],
  ["The sporting sphere now occupies your side of the playing area", "The ball is in your court", "M"],
  ["The finest parts of two separate realities", "The best of both worlds", "H"],
  ["Toss your drying cloth into the contest", "Throw in the towel", "M"],
  ["The clock grows wings whenever you are enjoying yourself", "Time flies when you're having fun", "M"],
  ["Only the peak of the floating frozen mountain is visible", "Tip of the iceberg", "M"],
  ["Feeling poorly beneath the atmospheric conditions", "Under the weather", "H"],
  ["Suspended overhead with no decision attached", "Up in the air", "H"],
  ["Encircle a difficult idea using your skull", "Wrap your head around it", "H"],
  ["Your estimate is no worse than the one I could offer", "Your guess is as good as mine", "H"],
  ["A fortunate event wearing an unrecognizable costume", "A blessing in disguise", "H"],
  ["One copper coin in exchange for whatever occupies your mind", "A penny for your thoughts", "H"],
  ["A single image carries the value of ten hundred terms", "A picture is worth a thousand words", "H"],
  ["Pour more combustible material onto the flames", "Add fuel to the fire", "M"],
  ["Return to the plank where plans are illustrated", "Back to the drawing board", "H"],
  ["Fold your body in the least convenient direction", "Bend over backwards", "M"],
  ["Remove a mouthful larger than your jaw can process", "Bite off more than you can chew", "M"],
  ["Discharge your excess heated vapor", "Blow off steam", "M"],
  ["Fracture the frozen surface between strangers", "Break the ice", "M"],
  ["Rupture the delicate sphere around someone’s optimism", "Burst your bubble", "H"],
  ["Wait to traverse that crossing until you actually reach it", "Cross that bridge when we come to it", "H"],
  ["Excessive inquisitiveness proved fatal to the household feline", "Curiosity killed the cat", "M"],
  ["Receive a sample of the treatment you normally prescribe", "Get a taste of your own medicine", "H"],
  ["Venture onto the unsupported end of a tree branch", "Go out on a limb", "M"],
  ["Make contact with the earth while already sprinting", "Hit the ground running", "M"],
  ["Inside the very last notch available on the clock", "In the nick of time", "H"],
  ["Reduce an extended tale to its briefest form", "Make a long story short", "M"],
  ["Tug another person’s walking appendage", "Pull someone's leg", "M"],
  ["Place every future bird inside a single woven container", "Put all your eggs in one basket", "H"],
  ["Take credit for someone else’s loud weather event", "Steal someone's thunder", "H"],
  ["The enormous gray mammal everyone is ignoring indoors", "The elephant in the room", "M"],
  ["Remaining loyal through both dense and narrow conditions", "Through thick and thin", "H"],
  ["Yesterday’s liquid has already passed beneath the crossing", "Water under the bridge", "H"]
];

const mixedMessages = [
["Treating a minor issue as though it were a major disaster","Make a mountain out of a molehill","M"],
["From torn-up cloth remnants all the way to great wealth","From rags to riches","M"],
["The reminder to understand another person’s experience before criticizing","Walk a mile in someone's shoes","M"],
["Why one certain opportunity beats several possibilities you cannot secure","A bird in the hand is worth two in the bush","H"],
["When everyone recognizes the major problem but nobody will mention it","The elephant in the room","M"],
["A plan to delay solving a possible problem until it actually occurs","Cross that bridge when we come to it","H"],
["How to describe two people who cannot agree on an issue","They don't see eye to eye","M"],
["Doing an unpleasant or frightening task instead of avoiding it","Bite the bullet","M"],
["A request to skip the unnecessary details and reach the important part","Cut to the chase","M"],
["The first friendly move that makes an awkward group comfortable","Break the ice","H"],
["When a person suffers the same unpleasant treatment they gave everyone else","Get a taste of your own medicine","H"],
["Avoiding the real point by discussing every nearby subject instead","Beat around the bush","H"],
["The hopeful idea that one lost opportunity creates room for another","When one door closes, another opens","M"],
["Why someone else’s situation often looks better from a distance","The grass is always greener on the other side","H"],
["Concealed in a location so obvious that nobody thinks to search there","Hiding in plain sight","M"],
["The claim that behavior provides stronger proof than promises do","Actions speak louder than words","M"],
["A warning that appearance alone cannot reveal content or quality","Don't judge a book by its cover","M"],
["Enjoying the advantages of two normally separate choices at once","The best of both worlds","H"],
["Arriving at the final possible moment before failure","In the nick of time","H"],
["The rule that meaningful improvement usually requires discomfort","No pain, no gain","M"]
];

const cards = [
  ...synonymTwists.map(card => [...card, "SYNONYM TWIST"]),
  ...mixedMessages.map(card => [...card, "MIXED MESSAGE"])
];

// Dinner-table edition: all 120 source cards, including their categories and notes.
const dinnerCards = [
  {
    "id": "ea-1",
    "deck": "Easy classics",
    "idiom": "break the ice",
    "answer": "start a friendly conversation",
    "variants": [
      "begin"
    ],
    "explanation": "No one has confirmed a literal ice-breaking event."
  },
  {
    "id": "ea-2",
    "deck": "Easy classics",
    "idiom": "spill the beans",
    "answer": "reveal a secret",
    "variants": [
      "let the beans out"
    ],
    "explanation": "A secret is disclosed."
  },
  {
    "id": "ea-3",
    "deck": "Easy classics",
    "idiom": "piece of cake",
    "answer": "something easy",
    "variants": [
      "a breeze"
    ],
    "explanation": "An easy task."
  },
  {
    "id": "ea-4",
    "deck": "Easy classics",
    "idiom": "hit the nail on the head",
    "answer": "be exactly right",
    "variants": [
      "call it perfectly"
    ],
    "explanation": "A correct observation."
  },
  {
    "id": "ea-5",
    "deck": "Easy classics",
    "idiom": "under the weather",
    "answer": "feeling ill",
    "variants": [
      "not at full strength"
    ],
    "explanation": "Feeling unwell."
  },
  {
    "id": "ea-6",
    "deck": "Easy classics",
    "idiom": "once in a blue moon",
    "answer": "very rarely",
    "variants": [
      "hardly ever"
    ],
    "explanation": "An uncommon event."
  },
  {
    "id": "ea-7",
    "deck": "Easy classics",
    "idiom": "cost an arm and a leg",
    "answer": "be very expensive",
    "variants": [
      "cost a fortune"
    ],
    "explanation": "A high price."
  },
  {
    "id": "ea-8",
    "deck": "Easy classics",
    "idiom": "bite the bullet",
    "answer": "face something difficult",
    "variants": [
      "do the hard thing"
    ],
    "explanation": "Accept a difficult situation."
  },
  {
    "id": "ea-9",
    "deck": "Easy classics",
    "idiom": "burn the midnight oil",
    "answer": "work late",
    "variants": [
      "stay up working"
    ],
    "explanation": "Work late into the night."
  },
  {
    "id": "ea-10",
    "deck": "Easy classics",
    "idiom": "the ball is in your court",
    "answer": "it is your turn to act",
    "variants": [
      "your move"
    ],
    "explanation": "Responsibility passes to someone."
  },
  {
    "id": "ea-11",
    "deck": "Easy classics",
    "idiom": "go the extra mile",
    "answer": "make extra effort",
    "variants": [
      "do more than expected"
    ],
    "explanation": "Additional effort."
  },
  {
    "id": "ea-12",
    "deck": "Easy classics",
    "idiom": "a blessing in disguise",
    "answer": "a good thing that seemed bad",
    "variants": [
      "hidden good"
    ],
    "explanation": "A benefit discovered later."
  },
  {
    "id": "ea-13",
    "deck": "Easy classics",
    "idiom": "add fuel to the fire",
    "answer": "make a problem worse",
    "variants": [
      "fan the flames"
    ],
    "explanation": "Increase conflict."
  },
  {
    "id": "ea-14",
    "deck": "Easy classics",
    "idiom": "see eye to eye",
    "answer": "agree",
    "variants": [
      "be on the same page"
    ],
    "explanation": "Share an opinion."
  },
  {
    "id": "ea-15",
    "deck": "Easy classics",
    "idiom": "miss the boat",
    "answer": "miss an opportunity",
    "variants": [
      "arrive too late"
    ],
    "explanation": "Fail to take a chance."
  },
  {
    "id": "ea-16",
    "deck": "Easy classics",
    "idiom": "pull someone’s leg",
    "answer": "tease",
    "variants": [
      "joke with someone"
    ],
    "explanation": "Playfully trick someone."
  },
  {
    "id": "ea-17",
    "deck": "Easy classics",
    "idiom": "keep an eye on",
    "answer": "watch",
    "variants": [
      "look after"
    ],
    "explanation": "Monitor something."
  },
  {
    "id": "ea-18",
    "deck": "Easy classics",
    "idiom": "make ends meet",
    "answer": "manage financially",
    "variants": [
      "balance the budget"
    ],
    "explanation": "Have enough money."
  },
  {
    "id": "ea-19",
    "deck": "Easy classics",
    "idiom": "on the same page",
    "answer": "share understanding",
    "variants": [
      "understand together"
    ],
    "explanation": "Have common expectations."
  },
  {
    "id": "ea-20",
    "deck": "Easy classics",
    "idiom": "go cold turkey",
    "answer": "stop abruptly",
    "variants": [
      "quit suddenly"
    ],
    "explanation": "Stop a habit at once."
  },
  {
    "id": "ea-21",
    "deck": "Easy classics",
    "idiom": "read between the lines",
    "answer": "find hidden meaning",
    "variants": [
      "notice what is unsaid"
    ],
    "explanation": "Interpret implied meaning."
  },
  {
    "id": "ea-22",
    "deck": "Easy classics",
    "idiom": "throw in the towel",
    "answer": "give up",
    "variants": [
      "stop trying"
    ],
    "explanation": "Quit a struggle."
  },
  {
    "id": "ea-23",
    "deck": "Easy classics",
    "idiom": "hit the road",
    "answer": "leave",
    "variants": [
      "head out"
    ],
    "explanation": "Depart."
  },
  {
    "id": "ea-24",
    "deck": "Easy classics",
    "idiom": "let the cat out of the bag",
    "answer": "reveal a secret",
    "variants": [
      "give it away"
    ],
    "explanation": "Reveal information."
  },
  {
    "id": "ea-25",
    "deck": "Easy classics",
    "idiom": "not my cup of tea",
    "answer": "not something I like",
    "variants": [
      "not for me"
    ],
    "explanation": "A preference mismatch."
  },
  {
    "id": "ea-26",
    "deck": "Easy classics",
    "idiom": "a storm in a teacup",
    "answer": "small issue treated as big",
    "variants": [
      "tiny drama"
    ],
    "explanation": "An exaggerated problem."
  },
  {
    "id": "ea-27",
    "deck": "Easy classics",
    "idiom": "take with a grain of salt",
    "answer": "be skeptical",
    "variants": [
      "question it"
    ],
    "explanation": "Do not accept fully."
  },
  {
    "id": "ea-28",
    "deck": "Easy classics",
    "idiom": "back to square one",
    "answer": "start again",
    "variants": [
      "return to the beginning"
    ],
    "explanation": "Lose progress."
  },
  {
    "id": "ea-29",
    "deck": "Easy classics",
    "idiom": "jump on the bandwagon",
    "answer": "follow a trend",
    "variants": [
      "join the crowd"
    ],
    "explanation": "Adopt a popular idea."
  },
  {
    "id": "ea-30",
    "deck": "Easy classics",
    "idiom": "through thick and thin",
    "answer": "in good and bad times",
    "variants": [
      "always there"
    ],
    "explanation": "Persistent support."
  },
  {
    "id": "ea-31",
    "deck": "Easy classics",
    "idiom": "break a leg",
    "answer": "wish good luck",
    "variants": [
      "good luck"
    ],
    "explanation": "Traditional performance phrase."
  },
  {
    "id": "ea-32",
    "deck": "Easy classics",
    "idiom": "raining cats and dogs",
    "answer": "raining heavily",
    "variants": [
      "pouring"
    ],
    "explanation": "Heavy rain."
  },
  {
    "id": "ea-33",
    "deck": "Easy classics",
    "idiom": "head over heels",
    "answer": "deeply in love",
    "variants": [
      "wildly smitten"
    ],
    "explanation": "Strong romantic feeling."
  },
  {
    "id": "ea-34",
    "deck": "Easy classics",
    "idiom": "out of the blue",
    "answer": "unexpectedly",
    "variants": [
      "from nowhere"
    ],
    "explanation": "Without warning."
  },
  {
    "id": "ea-35",
    "deck": "Easy classics",
    "idiom": "a dime a dozen",
    "answer": "common",
    "variants": [
      "easy to find"
    ],
    "explanation": "Not rare."
  },
  {
    "id": "ea-36",
    "deck": "Easy classics",
    "idiom": "the last straw",
    "answer": "final problem",
    "variants": [
      "breaking point"
    ],
    "explanation": "Final annoyance."
  },
  {
    "id": "ea-37",
    "deck": "Easy classics",
    "idiom": "piece together",
    "answer": "assemble clues",
    "variants": [
      "figure it out"
    ],
    "explanation": "Combine parts."
  },
  {
    "id": "ea-38",
    "deck": "Easy classics",
    "idiom": "wrap your head around",
    "answer": "understand",
    "variants": [
      "grasp"
    ],
    "explanation": "Comprehend something complex."
  },
  {
    "id": "ea-39",
    "deck": "Easy classics",
    "idiom": "on thin ice",
    "answer": "in a risky position",
    "variants": [
      "in trouble"
    ],
    "explanation": "A precarious situation."
  },
  {
    "id": "ea-40",
    "deck": "Easy classics",
    "idiom": "keep your chin up",
    "answer": "stay positive",
    "variants": [
      "stay hopeful"
    ],
    "explanation": "Remain cheerful."
  },
  {
    "id": "fo-1",
    "deck": "Food & life",
    "idiom": "break the ice",
    "answer": "start a friendly conversation",
    "variants": [
      "begin"
    ],
    "explanation": "No one has confirmed a literal ice-breaking event."
  },
  {
    "id": "fo-2",
    "deck": "Food & life",
    "idiom": "spill the beans",
    "answer": "reveal a secret",
    "variants": [
      "let the beans out"
    ],
    "explanation": "A secret is disclosed."
  },
  {
    "id": "fo-3",
    "deck": "Food & life",
    "idiom": "piece of cake",
    "answer": "something easy",
    "variants": [
      "a breeze"
    ],
    "explanation": "An easy task."
  },
  {
    "id": "fo-4",
    "deck": "Food & life",
    "idiom": "hit the nail on the head",
    "answer": "be exactly right",
    "variants": [
      "call it perfectly"
    ],
    "explanation": "A correct observation."
  },
  {
    "id": "fo-5",
    "deck": "Food & life",
    "idiom": "under the weather",
    "answer": "feeling ill",
    "variants": [
      "not at full strength"
    ],
    "explanation": "Feeling unwell."
  },
  {
    "id": "fo-6",
    "deck": "Food & life",
    "idiom": "once in a blue moon",
    "answer": "very rarely",
    "variants": [
      "hardly ever"
    ],
    "explanation": "An uncommon event."
  },
  {
    "id": "fo-7",
    "deck": "Food & life",
    "idiom": "cost an arm and a leg",
    "answer": "be very expensive",
    "variants": [
      "cost a fortune"
    ],
    "explanation": "A high price."
  },
  {
    "id": "fo-8",
    "deck": "Food & life",
    "idiom": "bite the bullet",
    "answer": "face something difficult",
    "variants": [
      "do the hard thing"
    ],
    "explanation": "Accept a difficult situation."
  },
  {
    "id": "fo-9",
    "deck": "Food & life",
    "idiom": "burn the midnight oil",
    "answer": "work late",
    "variants": [
      "stay up working"
    ],
    "explanation": "Work late into the night."
  },
  {
    "id": "fo-10",
    "deck": "Food & life",
    "idiom": "the ball is in your court",
    "answer": "it is your turn to act",
    "variants": [
      "your move"
    ],
    "explanation": "Responsibility passes to someone."
  },
  {
    "id": "fo-11",
    "deck": "Food & life",
    "idiom": "go the extra mile",
    "answer": "make extra effort",
    "variants": [
      "do more than expected"
    ],
    "explanation": "Additional effort."
  },
  {
    "id": "fo-12",
    "deck": "Food & life",
    "idiom": "a blessing in disguise",
    "answer": "a good thing that seemed bad",
    "variants": [
      "hidden good"
    ],
    "explanation": "A benefit discovered later."
  },
  {
    "id": "fo-13",
    "deck": "Food & life",
    "idiom": "add fuel to the fire",
    "answer": "make a problem worse",
    "variants": [
      "fan the flames"
    ],
    "explanation": "Increase conflict."
  },
  {
    "id": "fo-14",
    "deck": "Food & life",
    "idiom": "see eye to eye",
    "answer": "agree",
    "variants": [
      "be on the same page"
    ],
    "explanation": "Share an opinion."
  },
  {
    "id": "fo-15",
    "deck": "Food & life",
    "idiom": "miss the boat",
    "answer": "miss an opportunity",
    "variants": [
      "arrive too late"
    ],
    "explanation": "Fail to take a chance."
  },
  {
    "id": "fo-16",
    "deck": "Food & life",
    "idiom": "pull someone’s leg",
    "answer": "tease",
    "variants": [
      "joke with someone"
    ],
    "explanation": "Playfully trick someone."
  },
  {
    "id": "fo-17",
    "deck": "Food & life",
    "idiom": "keep an eye on",
    "answer": "watch",
    "variants": [
      "look after"
    ],
    "explanation": "Monitor something."
  },
  {
    "id": "fo-18",
    "deck": "Food & life",
    "idiom": "make ends meet",
    "answer": "manage financially",
    "variants": [
      "balance the budget"
    ],
    "explanation": "Have enough money."
  },
  {
    "id": "fo-19",
    "deck": "Food & life",
    "idiom": "on the same page",
    "answer": "share understanding",
    "variants": [
      "understand together"
    ],
    "explanation": "Have common expectations."
  },
  {
    "id": "fo-20",
    "deck": "Food & life",
    "idiom": "go cold turkey",
    "answer": "stop abruptly",
    "variants": [
      "quit suddenly"
    ],
    "explanation": "Stop a habit at once."
  },
  {
    "id": "fo-21",
    "deck": "Food & life",
    "idiom": "read between the lines",
    "answer": "find hidden meaning",
    "variants": [
      "notice what is unsaid"
    ],
    "explanation": "Interpret implied meaning."
  },
  {
    "id": "fo-22",
    "deck": "Food & life",
    "idiom": "throw in the towel",
    "answer": "give up",
    "variants": [
      "stop trying"
    ],
    "explanation": "Quit a struggle."
  },
  {
    "id": "fo-23",
    "deck": "Food & life",
    "idiom": "hit the road",
    "answer": "leave",
    "variants": [
      "head out"
    ],
    "explanation": "Depart."
  },
  {
    "id": "fo-24",
    "deck": "Food & life",
    "idiom": "let the cat out of the bag",
    "answer": "reveal a secret",
    "variants": [
      "give it away"
    ],
    "explanation": "Reveal information."
  },
  {
    "id": "fo-25",
    "deck": "Food & life",
    "idiom": "not my cup of tea",
    "answer": "not something I like",
    "variants": [
      "not for me"
    ],
    "explanation": "A preference mismatch."
  },
  {
    "id": "fo-26",
    "deck": "Food & life",
    "idiom": "a storm in a teacup",
    "answer": "small issue treated as big",
    "variants": [
      "tiny drama"
    ],
    "explanation": "An exaggerated problem."
  },
  {
    "id": "fo-27",
    "deck": "Food & life",
    "idiom": "take with a grain of salt",
    "answer": "be skeptical",
    "variants": [
      "question it"
    ],
    "explanation": "Do not accept fully."
  },
  {
    "id": "fo-28",
    "deck": "Food & life",
    "idiom": "back to square one",
    "answer": "start again",
    "variants": [
      "return to the beginning"
    ],
    "explanation": "Lose progress."
  },
  {
    "id": "fo-29",
    "deck": "Food & life",
    "idiom": "jump on the bandwagon",
    "answer": "follow a trend",
    "variants": [
      "join the crowd"
    ],
    "explanation": "Adopt a popular idea."
  },
  {
    "id": "fo-30",
    "deck": "Food & life",
    "idiom": "through thick and thin",
    "answer": "in good and bad times",
    "variants": [
      "always there"
    ],
    "explanation": "Persistent support."
  },
  {
    "id": "fo-31",
    "deck": "Food & life",
    "idiom": "break a leg",
    "answer": "wish good luck",
    "variants": [
      "good luck"
    ],
    "explanation": "Traditional performance phrase."
  },
  {
    "id": "fo-32",
    "deck": "Food & life",
    "idiom": "raining cats and dogs",
    "answer": "raining heavily",
    "variants": [
      "pouring"
    ],
    "explanation": "Heavy rain."
  },
  {
    "id": "fo-33",
    "deck": "Food & life",
    "idiom": "head over heels",
    "answer": "deeply in love",
    "variants": [
      "wildly smitten"
    ],
    "explanation": "Strong romantic feeling."
  },
  {
    "id": "fo-34",
    "deck": "Food & life",
    "idiom": "out of the blue",
    "answer": "unexpectedly",
    "variants": [
      "from nowhere"
    ],
    "explanation": "Without warning."
  },
  {
    "id": "fo-35",
    "deck": "Food & life",
    "idiom": "a dime a dozen",
    "answer": "common",
    "variants": [
      "easy to find"
    ],
    "explanation": "Not rare."
  },
  {
    "id": "fo-36",
    "deck": "Food & life",
    "idiom": "the last straw",
    "answer": "final problem",
    "variants": [
      "breaking point"
    ],
    "explanation": "Final annoyance."
  },
  {
    "id": "fo-37",
    "deck": "Food & life",
    "idiom": "piece together",
    "answer": "assemble clues",
    "variants": [
      "figure it out"
    ],
    "explanation": "Combine parts."
  },
  {
    "id": "fo-38",
    "deck": "Food & life",
    "idiom": "wrap your head around",
    "answer": "understand",
    "variants": [
      "grasp"
    ],
    "explanation": "Comprehend something complex."
  },
  {
    "id": "fo-39",
    "deck": "Food & life",
    "idiom": "on thin ice",
    "answer": "in a risky position",
    "variants": [
      "in trouble"
    ],
    "explanation": "A precarious situation."
  },
  {
    "id": "fo-40",
    "deck": "Food & life",
    "idiom": "keep your chin up",
    "answer": "stay positive",
    "variants": [
      "stay hopeful"
    ],
    "explanation": "Remain cheerful."
  },
  {
    "id": "di-1",
    "deck": "Difficult delightful",
    "idiom": "break the ice",
    "answer": "start a friendly conversation",
    "variants": [
      "begin"
    ],
    "explanation": "No one has confirmed a literal ice-breaking event."
  },
  {
    "id": "di-2",
    "deck": "Difficult delightful",
    "idiom": "spill the beans",
    "answer": "reveal a secret",
    "variants": [
      "let the beans out"
    ],
    "explanation": "A secret is disclosed."
  },
  {
    "id": "di-3",
    "deck": "Difficult delightful",
    "idiom": "piece of cake",
    "answer": "something easy",
    "variants": [
      "a breeze"
    ],
    "explanation": "An easy task."
  },
  {
    "id": "di-4",
    "deck": "Difficult delightful",
    "idiom": "hit the nail on the head",
    "answer": "be exactly right",
    "variants": [
      "call it perfectly"
    ],
    "explanation": "A correct observation."
  },
  {
    "id": "di-5",
    "deck": "Difficult delightful",
    "idiom": "under the weather",
    "answer": "feeling ill",
    "variants": [
      "not at full strength"
    ],
    "explanation": "Feeling unwell."
  },
  {
    "id": "di-6",
    "deck": "Difficult delightful",
    "idiom": "once in a blue moon",
    "answer": "very rarely",
    "variants": [
      "hardly ever"
    ],
    "explanation": "An uncommon event."
  },
  {
    "id": "di-7",
    "deck": "Difficult delightful",
    "idiom": "cost an arm and a leg",
    "answer": "be very expensive",
    "variants": [
      "cost a fortune"
    ],
    "explanation": "A high price."
  },
  {
    "id": "di-8",
    "deck": "Difficult delightful",
    "idiom": "bite the bullet",
    "answer": "face something difficult",
    "variants": [
      "do the hard thing"
    ],
    "explanation": "Accept a difficult situation."
  },
  {
    "id": "di-9",
    "deck": "Difficult delightful",
    "idiom": "burn the midnight oil",
    "answer": "work late",
    "variants": [
      "stay up working"
    ],
    "explanation": "Work late into the night."
  },
  {
    "id": "di-10",
    "deck": "Difficult delightful",
    "idiom": "the ball is in your court",
    "answer": "it is your turn to act",
    "variants": [
      "your move"
    ],
    "explanation": "Responsibility passes to someone."
  },
  {
    "id": "di-11",
    "deck": "Difficult delightful",
    "idiom": "go the extra mile",
    "answer": "make extra effort",
    "variants": [
      "do more than expected"
    ],
    "explanation": "Additional effort."
  },
  {
    "id": "di-12",
    "deck": "Difficult delightful",
    "idiom": "a blessing in disguise",
    "answer": "a good thing that seemed bad",
    "variants": [
      "hidden good"
    ],
    "explanation": "A benefit discovered later."
  },
  {
    "id": "di-13",
    "deck": "Difficult delightful",
    "idiom": "add fuel to the fire",
    "answer": "make a problem worse",
    "variants": [
      "fan the flames"
    ],
    "explanation": "Increase conflict."
  },
  {
    "id": "di-14",
    "deck": "Difficult delightful",
    "idiom": "see eye to eye",
    "answer": "agree",
    "variants": [
      "be on the same page"
    ],
    "explanation": "Share an opinion."
  },
  {
    "id": "di-15",
    "deck": "Difficult delightful",
    "idiom": "miss the boat",
    "answer": "miss an opportunity",
    "variants": [
      "arrive too late"
    ],
    "explanation": "Fail to take a chance."
  },
  {
    "id": "di-16",
    "deck": "Difficult delightful",
    "idiom": "pull someone’s leg",
    "answer": "tease",
    "variants": [
      "joke with someone"
    ],
    "explanation": "Playfully trick someone."
  },
  {
    "id": "di-17",
    "deck": "Difficult delightful",
    "idiom": "keep an eye on",
    "answer": "watch",
    "variants": [
      "look after"
    ],
    "explanation": "Monitor something."
  },
  {
    "id": "di-18",
    "deck": "Difficult delightful",
    "idiom": "make ends meet",
    "answer": "manage financially",
    "variants": [
      "balance the budget"
    ],
    "explanation": "Have enough money."
  },
  {
    "id": "di-19",
    "deck": "Difficult delightful",
    "idiom": "on the same page",
    "answer": "share understanding",
    "variants": [
      "understand together"
    ],
    "explanation": "Have common expectations."
  },
  {
    "id": "di-20",
    "deck": "Difficult delightful",
    "idiom": "go cold turkey",
    "answer": "stop abruptly",
    "variants": [
      "quit suddenly"
    ],
    "explanation": "Stop a habit at once."
  },
  {
    "id": "di-21",
    "deck": "Difficult delightful",
    "idiom": "read between the lines",
    "answer": "find hidden meaning",
    "variants": [
      "notice what is unsaid"
    ],
    "explanation": "Interpret implied meaning."
  },
  {
    "id": "di-22",
    "deck": "Difficult delightful",
    "idiom": "throw in the towel",
    "answer": "give up",
    "variants": [
      "stop trying"
    ],
    "explanation": "Quit a struggle."
  },
  {
    "id": "di-23",
    "deck": "Difficult delightful",
    "idiom": "hit the road",
    "answer": "leave",
    "variants": [
      "head out"
    ],
    "explanation": "Depart."
  },
  {
    "id": "di-24",
    "deck": "Difficult delightful",
    "idiom": "let the cat out of the bag",
    "answer": "reveal a secret",
    "variants": [
      "give it away"
    ],
    "explanation": "Reveal information."
  },
  {
    "id": "di-25",
    "deck": "Difficult delightful",
    "idiom": "not my cup of tea",
    "answer": "not something I like",
    "variants": [
      "not for me"
    ],
    "explanation": "A preference mismatch."
  },
  {
    "id": "di-26",
    "deck": "Difficult delightful",
    "idiom": "a storm in a teacup",
    "answer": "small issue treated as big",
    "variants": [
      "tiny drama"
    ],
    "explanation": "An exaggerated problem."
  },
  {
    "id": "di-27",
    "deck": "Difficult delightful",
    "idiom": "take with a grain of salt",
    "answer": "be skeptical",
    "variants": [
      "question it"
    ],
    "explanation": "Do not accept fully."
  },
  {
    "id": "di-28",
    "deck": "Difficult delightful",
    "idiom": "back to square one",
    "answer": "start again",
    "variants": [
      "return to the beginning"
    ],
    "explanation": "Lose progress."
  },
  {
    "id": "di-29",
    "deck": "Difficult delightful",
    "idiom": "jump on the bandwagon",
    "answer": "follow a trend",
    "variants": [
      "join the crowd"
    ],
    "explanation": "Adopt a popular idea."
  },
  {
    "id": "di-30",
    "deck": "Difficult delightful",
    "idiom": "through thick and thin",
    "answer": "in good and bad times",
    "variants": [
      "always there"
    ],
    "explanation": "Persistent support."
  },
  {
    "id": "di-31",
    "deck": "Difficult delightful",
    "idiom": "break a leg",
    "answer": "wish good luck",
    "variants": [
      "good luck"
    ],
    "explanation": "Traditional performance phrase."
  },
  {
    "id": "di-32",
    "deck": "Difficult delightful",
    "idiom": "raining cats and dogs",
    "answer": "raining heavily",
    "variants": [
      "pouring"
    ],
    "explanation": "Heavy rain."
  },
  {
    "id": "di-33",
    "deck": "Difficult delightful",
    "idiom": "head over heels",
    "answer": "deeply in love",
    "variants": [
      "wildly smitten"
    ],
    "explanation": "Strong romantic feeling."
  },
  {
    "id": "di-34",
    "deck": "Difficult delightful",
    "idiom": "out of the blue",
    "answer": "unexpectedly",
    "variants": [
      "from nowhere"
    ],
    "explanation": "Without warning."
  },
  {
    "id": "di-35",
    "deck": "Difficult delightful",
    "idiom": "a dime a dozen",
    "answer": "common",
    "variants": [
      "easy to find"
    ],
    "explanation": "Not rare."
  },
  {
    "id": "di-36",
    "deck": "Difficult delightful",
    "idiom": "the last straw",
    "answer": "final problem",
    "variants": [
      "breaking point"
    ],
    "explanation": "Final annoyance."
  },
  {
    "id": "di-37",
    "deck": "Difficult delightful",
    "idiom": "piece together",
    "answer": "assemble clues",
    "variants": [
      "figure it out"
    ],
    "explanation": "Combine parts."
  },
  {
    "id": "di-38",
    "deck": "Difficult delightful",
    "idiom": "wrap your head around",
    "answer": "understand",
    "variants": [
      "grasp"
    ],
    "explanation": "Comprehend something complex."
  },
  {
    "id": "di-39",
    "deck": "Difficult delightful",
    "idiom": "on thin ice",
    "answer": "in a risky position",
    "variants": [
      "in trouble"
    ],
    "explanation": "A precarious situation."
  },
  {
    "id": "di-40",
    "deck": "Difficult delightful",
    "idiom": "keep your chin up",
    "answer": "stay positive",
    "variants": [
      "stay hopeful"
    ],
    "explanation": "Remain cheerful."
  }
];
