/** Questions that actually come in on each entry. */

export type Faq = { q: string; a: string };

export const faqs: Record<string, Faq[]> = {
  "what-99-percent-purity-means": [
    {
      q: "Is 99% area purity the same as 99% peptide by weight?",
      a: "No. Area purity counts UV-absorbing material at 214 nm and reports the principal peak as a fraction of the total. Water, counterions and inorganic salts do not absorb there, so they are invisible to it. A lot that is honestly 99% pure by area is commonly 70 to 85% peptide by mass.",
    },
    {
      q: "How do I get the net peptide content for a lot?",
      a: "Ask for it by lot number and we will send the figure. It is run as standard on any fill above 100 mg and on request for everything else. It comes from amino acid analysis or nitrogen determination, not from the column.",
    },
    {
      q: "Does the salt form change how I calculate a concentration?",
      a: "Yes, and it is the usual source of the error. A trifluoroacetate salt carries counterion mass that is not peptide. If you weigh out powder and assume it is all sequence, your stock is weaker than your arithmetic says. Every Red Sky certificate states the salt form for this reason.",
    },
    {
      q: "If area purity is incomplete, why report it at all?",
      a: "Because it catches the failures that matter chemically: deletion sequences, truncations and oxidation products. It answers a narrow question well. It is simply not the same question as how much peptide is in the vial.",
    },
  ],

  "reading-your-chromatogram": [
    {
      q: "What does a shoulder on the main peak mean?",
      a: "Usually a closely related species eluting at almost the same time, often a deletion sequence. It matters because the integration may have counted that material inside the main peak, which flatters the purity figure.",
    },
    {
      q: "Is a drifting baseline a reason to reject a lot?",
      a: "Not on its own. Drift usually points at the gradient or the column rather than the sample. It is a reason to read the integration more carefully, and to ask whether the run should be repeated before release.",
    },
    {
      q: "My retention time does not match the certificate. Is something wrong?",
      a: "Almost certainly not. Retention depends on the column, the gradient, the flow rate and the instrument. It is reproducible within one lab and rarely transfers between two. Compare peak shape and relative impurity positions instead.",
    },
  ],

  "why-we-destroy-a-lot": [
    {
      q: "Do you sell off-spec material at a discount anywhere?",
      a: "No. There is no second tier, no clearance line and no unbranded channel. A purity floor only means something if no version of the product sits below it.",
    },
    {
      q: "What happens to my order if a lot fails release?",
      a: "You are told the same day, with the reason and the trace. You can wait for the repeat synthesis, usually ten to fifteen business days, or cancel for a full refund. We do not substitute a different lot without asking.",
    },
    {
      q: "How often does a lot miss?",
      a: "Twice this year across the whole catalogue. Both were published in the monthly release notes with the trace and the cause.",
    },
  ],

  "cold-chain-last-mile": [
    {
      q: "The logger in my box shows an excursion. What now?",
      a: "Do not open the vial. Photograph the readout, send it with the lot number, and we ship a replacement the same day. The excursion is our problem, and we would rather replace a vial than argue about whether it still assays.",
    },
    {
      q: "Can I ask for a specific delivery day?",
      a: "Yes, and it is worth doing. Name a day when someone is physically in the building to receive it. Friday afternoon deliveries have roughly four times the excursion rate of any other slot.",
    },
    {
      q: "How long do the gel packs actually hold?",
      a: "The design target is 72 hours below minus 10 degrees Celsius in a sealed box at room temperature. A box left in sunlight or on a hot loading dock is a different question, which is why the logger goes in regardless.",
    },
  ],

  "what-mass-spec-can-tell-you": [
    {
      q: "Does a matching mass prove the sequence is correct?",
      a: "No. Mass is a sum, and a sum does not encode order. Two residues swapped, or an isobaric substitution such as leucine for isoleucine, produces exactly the expected mass. Matching mass is necessary but not sufficient.",
    },
    {
      q: "When do you run tandem MS?",
      a: "On first production of any new sequence, and on any repeat lot where the chromatogram looks unusual. For routine repeat lots of an established sequence, single-stage mass plus the trace is the standard, and we say so rather than implying more.",
    },
    {
      q: "What does the mass difference on the certificate mean?",
      a: "It is the observed monoisotopic mass minus the theoretical one. A hundredth or two of a Dalton is normal instrument variance. A difference of 16 Da usually means oxidation; 18 Da can mean hydrolysis.",
    },
  ],

  "lyophilization-and-the-cake": [
    {
      q: "My cake looks collapsed. Is the vial unusable?",
      a: "Not necessarily. Collapse points at the drying cycle and often correlates with higher residual moisture, but moisture is measured on release rather than inferred from appearance. Check the water content on the certificate, and tell us if it looks wrong for what you received.",
    },
    {
      q: "There seems to be almost nothing in the vial. Is the fill short?",
      a: "A 5 mg lyophilized cake is genuinely small, and a porous one can look like a smear on the glass. Weigh it if you need certainty. Fill weight is verified at vialing and recorded against the lot.",
    },
    {
      q: "Does appearance tell me anything about potency?",
      a: "Very little on its own. It tells you about the drying cycle. Purity comes from the column and identity from the mass spectrometer; the cake tells you whether the last step went to plan.",
    },
  ],

  reconstitution: [
    {
      q: "What diluent should I use?",
      a: "That depends on the sequence and on what you are doing with it, which is a question for your own protocol rather than for us. What we can say is mechanical: add it slowly down the wall, and do not aim it at the cake.",
    },
    {
      q: "It will not dissolve. Can I vortex it?",
      a: "Give it more time first, because most of what looks insoluble is simply slow. Vortexing drives foaming, and the air-water interface is where peptides denature and aggregate. Gentle swirling costs you less material.",
    },
    {
      q: "How long can I keep a reconstituted stock?",
      a: "Aliquot into single-use volumes and freeze them. Repeated freeze-thaw cycles cost more material than any other routine handling step, and the loss is invisible: the solution looks the same every time.",
    },
  ],

  "how-to-read-a-coa": [
    {
      q: "The certificate has no lot number. Does that matter?",
      a: "Yes. Without a lot number the document describes a product in general rather than the vial in your hand, and it cannot be checked against anything.",
    },
    {
      q: "Should the chromatogram itself be on the certificate?",
      a: "It should. A purity figure without the trace behind it cannot be verified by anyone, and integration at the edges of a peak is a judgement call that moves the number.",
    },
    {
      q: "Can I get the raw instrument data rather than a PDF?",
      a: "Yes. Ask by lot number and we will send the integration report and the raw chromatogram file.",
    },
  ],

  "release-rs-2601-b": [
    {
      q: "What was the largest impurity in this lot?",
      a: "0.21% of total area, eluting at 11.6 minutes, consistent with a single-residue deletion sequence. It is marked on the released trace.",
    },
    {
      q: "Is net peptide content available for RS-2601-B?",
      a: "Yes, on request. This lot is a trifluoroacetate salt, so the figure sits meaningfully below the area purity. Ask by lot number.",
    },
    {
      q: "How long will this lot be shipping?",
      a: "Until it is exhausted, then the next lot is released with its own certificate. The lot number on the vial always matches the certificate in the envelope.",
    },
  ],

  "release-rs-2604-c": [
    {
      q: "Why is GHK-Cu blue?",
      a: "The colour comes from the copper centre in the complex. It is a property of the chemistry, not a grade marker.",
    },
    {
      q: "My vial looks paler than the photograph. Is it lower purity?",
      a: "No. Apparent colour varies with fill depth, cake density and the light you are looking at it under. Two vials from the same lot can look different. Read the certificate rather than the glass.",
    },
    {
      q: "What salt form is this lot?",
      a: "Acetate, as a one-to-one copper complex. It is stated on the certificate, as it is for every lot.",
    },
  ],

  "august-releases": [
    {
      q: "What happened to the Hexarelin lot that failed?",
      a: "It assayed at 97.9% against a 99% floor and was destroyed on 18 August. The trace showed a resolved impurity at 10.1 minutes carrying 1.6% of area, and the mass came back 16 Da high, consistent with oxidation at the tryptophan.",
    },
    {
      q: "Do you publish failed lots as a matter of course?",
      a: "Yes, in the monthly release notes, with the cause. A purity floor nobody ever sees enforced is indistinguishable from no floor at all.",
    },
    {
      q: "Where do I find the certificate for a specific lot?",
      a: "On the sequence page in the catalogue, or by sending the lot number through the contact page.",
    },
  ],
};

export const faqsFor = (slug: string): Faq[] => faqs[slug] ?? [];

/** Stable ids for the h2s, so the sidebar can link into the body. */
export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
