export type Block =
  | { t: "p"; text: string }
  | { t: "h2"; text: string }
  | { t: "quote"; text: string }
  | { t: "list"; items: string[] };

export const CATEGORIES = [
  { key: "analysis", label: "Analysis" },
  { key: "method", label: "Method" },
  { key: "handling", label: "Handling" },
  { key: "release-notes", label: "Release notes" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const categoryLabel = (k: CategoryKey) =>
  CATEGORIES.find((c) => c.key === k)?.label ?? k;

export type Post = {
  slug: string;
  no: number;
  date: string;
  category: CategoryKey;
  title: string;
  standfirst: string;
  author: string;
  initials: string;
  minutes: number;
  featured?: boolean;
  body: Block[];
};

export const posts: Post[] = [
  {
    slug: "what-99-percent-purity-means",
    no: 10,
    date: "2026-09-03",
    category: "analysis",
    title: "What a 99% purity claim actually means",
    standfirst:
      "Area purity and net peptide content are different numbers. A vial can be honestly labelled 99% and still be a fifth salt and water by mass.",
    author: "Joanna Reyes",
    initials: "J.R.",
    minutes: 6,
    featured: true,
    body: [
      {
        t: "p",
        text: "Almost every peptide supplier prints one number on the certificate: purity by HPLC, usually at 214 nm. Ours says 99.47% on the current BPC-157 lot. It is a real measurement and it is worth having. It is also not the number most buyers think it is.",
      },
      {
        t: "h2",
        text: "What the detector is counting",
      },
      {
        t: "p",
        text: "At 214 nm the detector is watching the peptide bond absorb. Run the sample down a reverse-phase column, integrate the area under every peak that comes off, and report the principal peak as a fraction of the total. That fraction is area purity. It tells you how much of the UV-absorbing material in the vial is the sequence you ordered, and how much is deletion sequences, truncations and oxidation products.",
      },
      {
        t: "p",
        text: "What it cannot see is everything that does not absorb at 214 nm. Residual water from an incomplete lyophilization cycle. Counterions — trifluoroacetate, mostly, left over from purification. Inorganic salts. None of that shows up on the trace, because none of it has a peptide bond.",
      },
      {
        t: "h2",
        text: "Net peptide content",
      },
      {
        t: "p",
        text: "The second number is net peptide content: what fraction of the powder's mass is actually peptide. It comes from amino acid analysis or nitrogen determination, not from the column. For a typical TFA-salt lyophilized peptide it lands somewhere between 70% and 85%. So a vial that is honestly 99% pure by area can be 80% peptide by weight, and both statements are true at once.",
      },
      {
        t: "quote",
        text: "A 99% area purity and a 80% net peptide content describe the same vial. Neither is a lie. Only one of them tells you how much peptide you weighed out.",
      },
      {
        t: "p",
        text: "This matters the moment you calculate a concentration. If you assume the powder is pure peptide, your stock is roughly a fifth weaker than you think, and every downstream number inherits that error. It is the single most common reason two labs get different results from the same sequence.",
      },
      {
        t: "h2",
        text: "What we publish",
      },
      {
        t: "p",
        text: "Every Red Sky certificate carries area purity, the integrated trace it came from, and the salt form. Net peptide content is available on request for any lot, and is run as standard on anything above 100 mg. If a supplier will not tell you the salt form, you cannot calculate a concentration from their label, and you should ask why.",
      },
    ],
  },
  {
    slug: "reading-your-chromatogram",
    no: 7,
    date: "2026-08-27",
    category: "analysis",
    title: "Reading the chromatogram that came with your vial",
    standfirst:
      "One tall peak is the easy part. The interesting information is in the shoulders, the baseline and where the small peaks sit relative to the main one.",
    author: "Joanna Reyes",
    initials: "J.R.",
    minutes: 5,
    body: [
      {
        t: "p",
        text: "The trace in your envelope is a plot of detector response against time. The x-axis is how long each component took to come off the column; the y-axis is how strongly it absorbed. Your sequence is the tall one. Everything else is the story.",
      },
      {
        t: "h2",
        text: "Start with the baseline",
      },
      {
        t: "p",
        text: "Before you look at any peak, look at the flat parts. A clean baseline sits level and quiet. If it drifts upward across the run, the gradient is bleeding or the column is dirty. If it is noisy, the detector lamp may be near the end of its life. Neither necessarily invalidates the result, but both should make you read the integration more carefully.",
      },
      {
        t: "h2",
        text: "Then the shape of the main peak",
      },
      {
        t: "p",
        text: "A well-behaved peptide peak is close to symmetrical. Two shapes are worth catching:",
      },
      {
        t: "list",
        items: [
          "A front shoulder — a bump on the rising edge — usually means a co-eluting impurity the integration may have swallowed into the main peak area.",
          "Heavy tailing — a long lazy return to baseline — often means secondary interactions with the column, but it can also hide a closely related species.",
          "A flat top means the detector saturated. The area under a saturated peak is meaningless, and the purity calculated from it is too.",
        ],
      },
      {
        t: "h2",
        text: "Finally, where the small peaks are",
      },
      {
        t: "p",
        text: "Impurities that elute just before the main peak are frequently deletion sequences — chains missing a residue, so slightly more polar. Peaks just after are often oxidation products, particularly if the sequence carries a methionine or a tryptophan. A cluster far from the main peak is more likely to be unrelated: a reagent, a scavenger, something from the cleavage cocktail.",
      },
      {
        t: "p",
        text: "None of this requires a chromatography background. It requires the trace being in the envelope in the first place, which is the part we can control.",
      },
    ],
  },
  {
    slug: "why-we-destroy-a-lot",
    no: 6,
    date: "2026-08-20",
    category: "method",
    title: "Why we destroy a lot instead of discounting it",
    standfirst:
      "A 97% lot is not a cheaper 99% lot. It is a different material, and selling it at a discount teaches the wrong thing about what the number means.",
    author: "Marcus Bell",
    initials: "M.B.",
    minutes: 4,
    body: [
      {
        t: "p",
        text: "Twice this year a lot has come back from the column under our release floor. Both times the same conversation happened, and both times we incinerated it. Here is the reasoning, because it costs real money and the logic is not obvious from outside.",
      },
      {
        t: "h2",
        text: "The discount problem",
      },
      {
        t: "p",
        text: "The obvious move is to relabel a 97.2% lot honestly, price it lower, and let buyers decide. It seems more wasteful to destroy it. The problem is what a purity floor is for. A floor is a promise that you do not have to read the number — that anything with our name on it clears the same bar. The moment there is a discount tier, the floor stops being a floor and becomes a suggestion, and every buyer now has to check.",
      },
      {
        t: "quote",
        text: "A purity floor only does its job if there is no version of the product that sits below it.",
      },
      {
        t: "h2",
        text: "The contamination problem",
      },
      {
        t: "p",
        text: "The second reason is narrower and more practical. When a lot misses, it usually misses because of something specific — an incomplete coupling, an oxidation event, a bad cleavage. The 2.8% that is not your sequence is not inert filler. It is a mixture of species with similar chemistry and unknown behaviour, and nobody buying a research reagent has budgeted for characterising it.",
      },
      {
        t: "p",
        text: "So the lot is destroyed, the batch record notes why, and the synthesis is repeated. It is expensive and it is the entire value of the floor.",
      },
    ],
  },
  {
    slug: "cold-chain-last-mile",
    no: 5,
    date: "2026-08-13",
    category: "handling",
    title: "The cold chain is mostly the last mile",
    standfirst:
      "Freezers are reliable. Freight is reliable. The ninety minutes between a courier van and a bench is where nearly every excursion we have logged happened.",
    author: "Priya Anand",
    initials: "P.A.",
    minutes: 5,
    body: [
      {
        t: "p",
        text: "We put a temperature logger in every box, which means we have four hundred and twelve shipment traces from this year. Read together they say something slightly surprising: the long-haul leg is almost never the problem.",
      },
      {
        t: "h2",
        text: "What the traces show",
      },
      {
        t: "p",
        text: "Pack-out to the depot is flat. Depot to depot is flat — these are refrigerated networks with their own monitoring and they work. The line starts to move at the point the box leaves the last sorting facility, and it moves fastest in the window between arriving at a building and reaching cold storage.",
      },
      {
        t: "list",
        items: [
          "A box left at a loading dock in summer warms faster than most people expect — gel packs buy hours, not a day.",
          "Reception desks are the single most common place a shipment stalls, because nobody there knows the contents are temperature-controlled.",
          "Deliveries that arrive on a Friday afternoon have roughly four times the excursion rate of any other slot.",
        ],
      },
      {
        t: "h2",
        text: "What actually helps",
      },
      {
        t: "p",
        text: "Naming a recipient who is physically in the building. Marking the outer box so a receptionist can tell it is cold without opening it. Avoiding Friday delivery unless someone has agreed to be there. None of this is sophisticated, and all of it moves the number more than upgrading the packaging does.",
      },
      {
        t: "p",
        text: "The logger stays in the box either way. If the chain broke, you will see it on the readout before you break the seal, and we would rather you replace a vial than quietly inherit a bad result.",
      },
    ],
  },
  {
    slug: "what-mass-spec-can-tell-you",
    no: 4,
    date: "2026-08-06",
    category: "analysis",
    title: "What mass spectrometry can and cannot tell you",
    standfirst:
      "ESI-MS confirms a mass. It does not confirm a sequence, and the difference matters more than it sounds.",
    author: "Joanna Reyes",
    initials: "J.R.",
    minutes: 5,
    body: [
      {
        t: "p",
        text: "Every lot we release is run by electrospray mass spectrometry and the observed monoisotopic mass is compared with the theoretical. On the current BPC-157 lot that is 1419.53 against 1419.55. Two hundredths of a Dalton is a good result and it is worth having on the certificate. It also answers a narrower question than most people assume.",
      },
      {
        t: "h2",
        text: "Mass is not order",
      },
      {
        t: "p",
        text: "A peptide's mass is the sum of its residues minus the water lost forming each bond. Swap two residues and the sum does not change. Leucine and isoleucine are structural isomers with identical masses. A sequence assembled in the wrong order, or with an isobaric substitution, produces exactly the mass on the certificate and is not the molecule you ordered.",
      },
      {
        t: "quote",
        text: "Matching mass is necessary. It is not sufficient. Anything that rearranges residues without changing the sum passes.",
      },
      {
        t: "h2",
        text: "What closes the gap",
      },
      {
        t: "p",
        text: "Tandem mass spectrometry fragments the chain and reads the mass differences between fragments, which does give sequence order. Edman degradation reads residues off the N-terminus one at a time. Both are slower and more expensive than a single-stage mass check, which is why neither is standard on every commercial lot anywhere in this industry.",
      },
      {
        t: "p",
        text: "What makes single-stage MS defensible in practice is that it is paired with a synthesis record. Solid-phase synthesis builds the chain in a known order; the failure modes are deletions and truncations, and those change the mass. We run MS/MS on first production of a new sequence and on any lot where the trace looks unusual. For repeat lots of an established sequence, mass plus the chromatogram is the honest standard, and we would rather say so than imply more.",
      },
    ],
  },
  {
    slug: "lyophilization-and-the-cake",
    no: 3,
    date: "2026-07-30",
    category: "method",
    title: "Lyophilization, and why the cake matters",
    standfirst:
      "The shape of the powder in the bottom of the vial is a record of how the drying cycle went. It is the easiest quality signal a buyer can read without an instrument.",
    author: "Marcus Bell",
    initials: "M.B.",
    minutes: 4,
    body: [
      {
        t: "p",
        text: "Freeze-drying removes water by sublimation: freeze the solution solid, drop the pressure, and let the ice go straight to vapour. Done correctly it leaves a porous solid that holds the shape of the frozen volume. That solid is the cake, and it tells you things.",
      },
      {
        t: "h2",
        text: "A good cake",
      },
      {
        t: "p",
        text: "It occupies roughly the volume that was frozen. It is uniform, matte, and slightly fibrous under light. It does not rattle. When you add diluent it dissolves quickly and evenly, because the porous structure gives the solvent a route in.",
      },
      {
        t: "h2",
        text: "A cake that went wrong",
      },
      {
        t: "list",
        items: [
          "Collapse: the cake has slumped into a dense glassy disc much smaller than the original volume. The product went above its collapse temperature during primary drying, and residual moisture is usually high.",
          "Meltback: a clear, sometimes sticky layer at the bottom. Part of the product melted rather than sublimed.",
          "Powder that shifts freely when tilted: the structure never formed, which often means the fill was too shallow or the freeze was too fast.",
        ],
      },
      {
        t: "p",
        text: "None of these are automatically fatal to a research reagent, and residual moisture is measured on release rather than guessed from appearance. But a collapsed cake is a reason to check the certificate rather than assume, and a vial that arrives visibly wrong is a vial we will replace without an argument.",
      },
    ],
  },
  {
    slug: "reconstitution",
    no: 2,
    date: "2026-07-23",
    category: "handling",
    title: "Reconstitution without wrecking the peptide",
    standfirst:
      "Most losses at this step are mechanical, not chemical. Peptides do not like shear, foam, or being jetted at.",
    author: "Priya Anand",
    initials: "P.A.",
    minutes: 4,
    body: [
      {
        t: "p",
        text: "A vial survives synthesis, purification, drying and a freezer, and then loses material in the ninety seconds it takes to dissolve. This is avoidable and the rules are dull.",
      },
      {
        t: "h2",
        text: "Before the seal comes off",
      },
      {
        t: "p",
        text: "Let the vial reach room temperature while it is still sealed. A vial opened cold pulls in humid air, and the water condenses onto the cake. That is the fastest way to start hydrolysis in a material you were about to put back in the freezer.",
      },
      {
        t: "h2",
        text: "Adding the diluent",
      },
      {
        t: "list",
        items: [
          "Run the solvent slowly down the inside wall of the vial. Do not aim it at the cake — the jet shears the material and drives foaming.",
          "Swirl gently, or leave it to stand. Do not shake and do not vortex. Foam means a large air-water interface, and peptides denature and aggregate at that interface.",
          "If it has not dissolved in a few minutes, give it more time before reaching for anything more aggressive. Most of what looks insoluble is simply slow.",
        ],
      },
      {
        t: "h2",
        text: "Afterwards",
      },
      {
        t: "p",
        text: "Aliquot into single-use volumes before freezing. Repeated freeze-thaw cycles cost more material than any other routine handling step, and the loss is silent — the solution looks identical each time. Label every aliquot with the lot number, so a result can still be traced back to a certificate a year later.",
      },
    ],
  },
  {
    slug: "how-to-read-a-coa",
    no: 1,
    date: "2026-07-16",
    category: "analysis",
    title: "How to read a certificate of analysis",
    standfirst:
      "Six fields decide whether a certificate is a document or a decoration. Here is the order we read them in.",
    author: "Joanna Reyes",
    initials: "J.R.",
    minutes: 5,
    body: [
      {
        t: "p",
        text: "Certificates vary enormously between suppliers, and a surprising number contain no information at all — a letterhead, a product name, and the word 'passed'. These are the fields that make one useful.",
      },
      {
        t: "list",
        items: [
          "Lot number. If the certificate does not name a specific lot, it describes a product in general and cannot be tied to the vial in your hand.",
          "Date of analysis. A certificate dated two years before your vial shipped is describing different material.",
          "Method, stated properly. 'HPLC' is not a method. 'RP-HPLC, C18, gradient, UV 214 nm' is.",
          "The actual trace. A purity figure without the chromatogram behind it cannot be checked by anyone.",
          "Salt form and net peptide content. Without these you cannot convert a weight into a concentration.",
          "A named analyst or their initials. Someone has to be accountable for the integration.",
        ],
      },
      {
        t: "h2",
        text: "Two things worth checking against each other",
      },
      {
        t: "p",
        text: "Compare the stated purity with the trace. Integration is a judgement call at the edges, and a shoulder folded into the main peak can move the number by half a percent. You do not need to redo the integration; you need to see whether the picture is consistent with the claim.",
      },
      {
        t: "p",
        text: "Then compare the observed mass with the theoretical one printed beside it. If only the observed value appears, the comparison has been done for you and you cannot check it.",
      },
      {
        t: "p",
        text: "A certificate that survives all of this is doing its job: it lets a stranger disagree with us using our own data.",
      },
    ],
  },
  {
    slug: "release-rs-2601-b",
    no: 8,
    date: "2026-08-31",
    category: "release-notes",
    title: "Lot RS-2601-B released — BPC-157, 5 mg",
    standfirst:
      "Area purity 99.47% at 214 nm, single principal peak at 12.4 minutes, observed mass within 0.02 Da of theoretical.",
    author: "Marcus Bell",
    initials: "M.B.",
    minutes: 2,
    body: [
      {
        t: "p",
        text: "RS-2601-B is now shipping. Synthesis completed 24 August, purified by preparative RP-HPLC, assayed 28 August, released 31 August.",
      },
      {
        t: "list",
        items: [
          "Area purity: 99.47% (RP-HPLC, C18, UV 214 nm)",
          "Retention: 12.4 min, single principal peak, no front shoulder",
          "Observed mass: 1419.53 Da against theoretical 1419.55 Da (ESI-MS, positive mode)",
          "Salt form: trifluoroacetate. Net peptide content available on request",
          "Fill: 5 mg, lyophilized under nitrogen, stoppered and crimp-sealed",
        ],
      },
      {
        t: "p",
        text: "The largest impurity elutes at 11.6 minutes at 0.21% of total area, consistent with a single-residue deletion. The full trace and the integration report ship with every vial and are on the lot page.",
      },
    ],
  },
  {
    slug: "release-rs-2604-c",
    no: 11,
    date: "2026-09-04",
    category: "release-notes",
    title: "Lot RS-2604-C released — GHK-Cu, 50 mg",
    standfirst:
      "Our cleanest copper tripeptide lot to date at 99.61%. Notes on the blue colour and what it does and does not indicate.",
    author: "Priya Anand",
    initials: "P.A.",
    minutes: 3,
    body: [
      {
        t: "p",
        text: "RS-2604-C released 4 September at 99.61% area purity, retention 6.2 minutes. This is the highest we have recorded on this sequence.",
      },
      {
        t: "p",
        text: "A note, because we get the question on every GHK-Cu release: the deep blue of the lyophilized complex comes from the copper centre, and its intensity is not a purity signal. Colour varies with fill depth, cake density and how the vial is lit. A paler vial from this lot is the same material as a darker one. Read the certificate, not the glass.",
      },
      {
        t: "list",
        items: [
          "Area purity: 99.61% (RP-HPLC, UV 214 nm)",
          "Retention: 6.2 min",
          "Observed mass: 401.91 Da, consistent with the 1:1 copper complex",
          "Fill: 50 mg",
        ],
      },
    ],
  },
  {
    slug: "august-releases",
    no: 9,
    date: "2026-09-01",
    category: "release-notes",
    title: "August: eleven lots released, one destroyed",
    standfirst:
      "The month's release summary, including the Hexarelin lot that missed the floor and what the trace showed.",
    author: "Marcus Bell",
    initials: "M.B.",
    minutes: 3,
    body: [
      {
        t: "p",
        text: "Eleven lots cleared release in August across nine sequences. Mean area purity was 99.36%; the lowest to clear was 99.02% on a Sermorelin lot. All eleven certificates are on their lot pages.",
      },
      {
        t: "h2",
        text: "The one that did not clear",
      },
      {
        t: "p",
        text: "A Hexarelin batch assayed at 97.9% and was destroyed on 18 August. The trace showed a well-resolved impurity at 10.1 minutes carrying 1.6% of total area, and the mass came back sixteen Daltons above theoretical — a signature consistent with oxidation at the tryptophan. The synthesis was repeated with fresh scavenger and the replacement lot, RS-2563-B, cleared at 99.08%.",
      },
      {
        t: "p",
        text: "We publish the misses as well as the releases. A purity floor that nobody ever sees enforced is indistinguishable from no floor at all.",
      },
    ],
  },
];

export const byDate = [...posts].sort((a, b) => b.date.localeCompare(a.date));

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

export const longDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export const isoDate = (iso: string) => iso;
