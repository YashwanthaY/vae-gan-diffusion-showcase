/**
 * Global constants — single source of truth for layout and API settings.
 * No metric values live here; those come from public/data/json/*.json.
 */

/** 4×4 grid layout — 16 images per model. */
export const GRID = { rows: 4, cols: 4, n: 16 };

/** Native CIFAR-10 tile size in pixels. */
export const TILE = 32;

/** API call timeout in ms before automatic cached-fallback. */
export const API_TIMEOUT_MS = 60_000;

/** Default slider values for the Live Studio. */
export const DEFAULTS = { steps: 50, cfg: 1.5 };

/** Hugging Face Space identifier. */
export const SPACE_ID = "Yashwantha123/vae-gan-diffusion-demo";

/** CIFAR-10 class list (index = class label). */
export const CIFAR10_CLASSES = [
  { id: 0, name: "airplane",    label: "Airplane"    },
  { id: 1, name: "automobile",  label: "Automobile"  },
  { id: 2, name: "bird",        label: "Bird"        },
  { id: 3, name: "cat",         label: "Cat"         },
  { id: 4, name: "deer",        label: "Deer"        },
  { id: 5, name: "dog",         label: "Dog"         },
  { id: 6, name: "frog",        label: "Frog"        },
  { id: 7, name: "horse",       label: "Horse"       },
  { id: 8, name: "ship",        label: "Ship"        },
  { id: 9, name: "truck",       label: "Truck"       },
];

/**
 * Keyword → CIFAR-10 class mapping for the prompt box.
 * The DDPM is conditioned on the class label (10 classes);
 * the prompt box only does keyword-to-class matching.
 */
export const KEYWORD_CLASS_MAP = {
  plane: 0, aircraft: 0, jet: 0, airplane: 0, aeroplane: 0,
  car: 1, auto: 1, automobile: 1, vehicle: 1,
  bird: 2, sparrow: 2, eagle: 2, crow: 2,
  cat: 3, kitten: 3, feline: 3,
  deer: 4, stag: 4, doe: 4,
  dog: 5, puppy: 5, canine: 5, retriever: 5, labrador: 5, fluffy: 5,
  frog: 6, toad: 6, amphibian: 6,
  horse: 7, pony: 7, stallion: 7, equine: 7,
  ship: 8, boat: 8, vessel: 8, sailboat: 8, ocean: 8,
  truck: 9, lorry: 9, pickup: 9,
};

/** Resolve a free-text prompt to a CIFAR-10 class index (or null). */
export function resolvePromptToClass(prompt) {
  if (!prompt?.trim()) return null;
  const lower = prompt.toLowerCase();
  for (const [kw, idx] of Object.entries(KEYWORD_CLASS_MAP)) {
    if (lower.includes(kw)) return idx;
  }
  return null;
}
