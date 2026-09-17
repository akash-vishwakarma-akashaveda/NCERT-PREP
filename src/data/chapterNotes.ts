export interface ChapterNote {
  chapter_id: string;
  subject: string;
  summary: string;
  key_formulas_or_points: string[];
  exam_tips: string[];
}

// Demo-mode seed only (Class 10 Science & Mathematics); live notes are managed in the admin dashboard.
export const CHAPTER_NOTES_DATA: Record<string, ChapterNote> = {
  'CH-01': {
    chapter_id: 'CH-01',
    subject: 'Science',
    summary: 'Chemical reactions involve the breaking and making of bonds between atoms to produce new substances. Observed through change in state, color, evolution of gas, or temperature change.',
    key_formulas_or_points: [
      'Combination: A + B → AB (e.g. CaO + H₂O → Ca(OH)₂)',
      'Decomposition: AB → A + B (Thermal, Electrolytic, Photolytic)',
      'Displacement: Fe + CuSO₄ → FeSO₄ + Cu',
      'Double Displacement: Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl',
      'Redox: Oxidation = Loss of electrons / Gain of O; Reduction = Gain of electrons / Loss of O',
    ],
    exam_tips: [
      'Always write state symbols: (s), (l), (g), (aq).',
      'Remember BaSO₄ forms a white precipitate.',
      'Corrosion and Rancidity are everyday oxidation examples.',
    ],
  },
  'CH-02': {
    chapter_id: 'CH-02',
    subject: 'Science',
    summary: 'Acids generate H⁺(aq) ions in water, turn blue litmus red. Bases yield OH⁻(aq) ions, turn red litmus blue. Salts are products of neutralization reactions.',
    key_formulas_or_points: [
      'Acid + Metal → Salt + H₂ gas (Pop sound test)',
      'Acid + Base → Salt + Water (Neutralisation)',
      'pH scale: 0 (strongly acidic) to 14 (strongly alkaline); 7 is neutral',
      'Bleaching powder: CaOCl₂; Baking soda: NaHCO₃; Washing soda: Na₂CO₃·10H₂O',
      'Plaster of Paris: CaSO₄·½H₂O (forms Gypsum CaSO₄·2H₂O on hydration)',
    ],
    exam_tips: [
      'Acid rain occurs when rainwater pH falls below 5.6.',
      'Antacids like Milk of Magnesia Mg(OH)₂ neutralize excess stomach acid.',
    ],
  },
  'CH-05': {
    chapter_id: 'CH-05',
    subject: 'Science',
    summary: 'Basic life-sustaining mechanisms: Nutrition, Respiration, Transport of materials, and Excretion in plants and human beings.',
    key_formulas_or_points: [
      'Photosynthesis: 6CO₂ + 12H₂O + Chlorophyll/Light → C₆H₁₂O₆ + 6O₂ + 6H₂O',
      'Aerobic Respiration: Glucose → Pyruvate (Cytoplasm) → CO₂ + H₂O + 38 ATP (Mitochondria)',
      'Anaerobic Respiration: Muscle cells produce Lactic Acid + Energy causing cramps',
      'Heart: 4 chambers prevent mixing of oxygenated and deoxygenated blood',
      'Excretion unit: Nephron (Glomerulus, Bowman\'s capsule, Tubule)',
    ],
    exam_tips: [
      'Diagram of human heart and nephron are frequent 5-mark questions.',
      'Transpiration pull aids ascent of water in xylem.',
    ],
  },
  'M-01': {
    chapter_id: 'M-01',
    subject: 'Mathematics',
    summary: 'Fundamental theorem of arithmetic states every composite number can be uniquely factorized into primes. Proving irrationality of √2, √3, √5.',
    key_formulas_or_points: [
      'HCF(a, b) × LCM(a, b) = a × b (Only valid for two numbers)',
      'Proof by Contradiction for irrationality: Assume p/q where p, q are co-prime integers.',
      'Theorem: If prime p divides a², then p divides a.',
    ],
    exam_tips: [
      'Do not skip writing "where p and q are co-prime" in the irrationality proof.',
      'Check prime factor tree steps carefully.',
    ],
  },
  'M-04': {
    chapter_id: 'M-04',
    subject: 'Mathematics',
    summary: 'A quadratic equation in variable x is of the form ax² + bx + c = 0, where a ≠ 0. Solved via factorisation or quadratic formula.',
    key_formulas_or_points: [
      'Discriminant: D = b² - 4ac',
      'D > 0: Two distinct real roots x = (-b ± √D) / 2a',
      'D = 0: Two equal real roots x = -b / 2a',
      'D < 0: No real roots',
    ],
    exam_tips: [
      'Check for extraneous roots when solving distance-speed word problems (speed cannot be negative).',
    ],
  },
};
