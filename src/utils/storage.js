/**
 * LocalStorage utilities for Intervention Planner
 * Handles autosave, import/export, and undo functionality
 */

const STORAGE_KEY = "tbc_intervention_plan";
const HISTORY_KEY = "tbc_intervention_history";
const MAX_HISTORY_SIZE = 20;

/**
 * Generate unique ID for intervention pins
 * @returns {string} Unique ID
 */
export function generateId() {
  return `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new empty plan
 * @returns {Object} Empty plan object
 */
export function createEmptyPlan() {
  return {
    version: "1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: "Rencana Intervensi TBC",
    description: "",
    pins: [],
    settings: {
      defaultRadiusKm: 1.0,
      defaultType: "Screening",
    },
  };
}

/**
 * Save plan to localStorage
 * @param {Object} plan - Plan object to save
 * @returns {boolean} Success status
 */
export function savePlan(plan) {
  try {
    const planToSave = {
      ...plan,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(planToSave));
    return true;
  } catch (error) {
    console.error("Failed to save plan:", error);
    return false;
  }
}

/**
 * Load plan from localStorage
 * @returns {Object|null} Plan object or null if not found
 */
export function loadPlan() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const plan = JSON.parse(stored);

    // Validate plan structure
    if (!plan.pins || !Array.isArray(plan.pins)) {
      return null;
    }

    return plan;
  } catch (error) {
    console.error("Failed to load plan:", error);
    return null;
  }
}

/**
 * Clear plan from localStorage
 * @returns {boolean} Success status
 */
export function clearPlan() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (error) {
    console.error("Failed to clear plan:", error);
    return false;
  }
}

/**
 * Export plan to JSON file
 * @param {Object} plan - Plan to export
 * @returns {string} JSON string
 */
export function exportPlanToJSON(plan) {
  const exportData = {
    ...plan,
    exportedAt: new Date().toISOString(),
    exportVersion: "1.0",
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Download plan as JSON file
 * @param {Object} plan - Plan to download
 * @param {string} filename - Optional filename
 */
export function downloadPlan(plan, filename = "intervention-plan.json") {
  const json = exportPlanToJSON(plan);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Import plan from JSON string
 * @param {string} jsonString - JSON string to parse
 * @returns {Object|null} Parsed plan or null if invalid
 */
export function importPlanFromJSON(jsonString) {
  try {
    const plan = JSON.parse(jsonString);

    // Validate required fields
    if (!plan.pins || !Array.isArray(plan.pins)) {
      throw new Error("Invalid plan format: missing pins array");
    }

    // Normalize imported plan
    return {
      version: plan.version || "1.0",
      createdAt: plan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: plan.name || "Imported Plan",
      description: plan.description || "",
      pins: plan.pins.map((pin) => ({
        id: pin.id || generateId(),
        type: pin.type || "Screening",
        position: pin.position || [0, 0],
        radiusKm: pin.radiusKm || 1.0,
        travelTimeMinutes: pin.travelTimeMinutes || null,
        notes: pin.notes || "",
        createdAt: pin.createdAt || new Date().toISOString(),
      })),
      settings: {
        defaultRadiusKm: plan.settings?.defaultRadiusKm || 1.0,
        defaultType: plan.settings?.defaultType || "Screening",
      },
    };
  } catch (error) {
    console.error("Failed to import plan:", error);
    return null;
  }
}

/**
 * Read file and import plan
 * @param {File} file - File to read
 * @returns {Promise<Object|null>} Parsed plan or null
 */
export function importPlanFromFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const plan = importPlanFromJSON(event.target.result);
        resolve(plan);
      } catch (error) {
        console.error("Failed to read file:", error);
        resolve(null);
      }
    };

    reader.onerror = () => {
      resolve(null);
    };

    reader.readAsText(file);
  });
}

/**
 * Save plan state to history for undo functionality
 * @param {Object} plan - Current plan state
 */
export function saveToHistory(plan) {
  try {
    const history = getHistory();
    const historyEntry = {
      timestamp: Date.now(),
      plan: JSON.parse(JSON.stringify(plan)), // Deep clone
    };

    // Add to beginning of history
    history.unshift(historyEntry);

    // Limit history size
    if (history.length > MAX_HISTORY_SIZE) {
      history.pop();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save history:", error);
  }
}

/**
 * Get history from localStorage
 * @returns {Array} History array
 */
export function getHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Undo last change
 * @returns {Object|null} Previous plan state or null
 */
export function undo() {
  const history = getHistory();

  if (history.length < 2) {
    return null; // Nothing to undo to
  }

  // Remove current state
  history.shift();

  // Get previous state
  const previousState = history[0]?.plan || null;

  // Save updated history
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  return previousState;
}

/**
 * Check if undo is available
 * @returns {boolean}
 */
export function canUndo() {
  const history = getHistory();
  return history.length >= 2;
}

/**
 * Create a new intervention pin
 * @param {Array} position - [lat, lng]
 * @param {Object} options - Pin options
 * @returns {Object} New pin object
 */
export function createPin(position, options = {}) {
  return {
    id: generateId(),
    type: options.type || "Screening",
    position: [...position],
    radiusKm: options.radiusKm || 1.0,
    travelTimeMinutes: options.travelTimeMinutes || null,
    notes: options.notes || "",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validate plan data
 * @param {Object} plan - Plan to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export function validatePlan(plan) {
  const errors = [];

  if (!plan) {
    return { valid: false, errors: ["Plan is null or undefined"] };
  }

  if (!Array.isArray(plan.pins)) {
    errors.push("Pins must be an array");
  } else {
    plan.pins.forEach((pin, index) => {
      if (!pin.id) errors.push(`Pin ${index} missing id`);
      if (!pin.position || !Array.isArray(pin.position) || pin.position.length !== 2) {
        errors.push(`Pin ${index} has invalid position`);
      }
      if (!["Screening", "Edukasi", "Tracing"].includes(pin.type)) {
        errors.push(`Pin ${index} has invalid type: ${pin.type}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get storage usage statistics
 * @returns {Object} Storage stats
 */
export function getStorageStats() {
  try {
    const plan = localStorage.getItem(STORAGE_KEY);
    const history = localStorage.getItem(HISTORY_KEY);

    return {
      planSize: plan ? new Blob([plan]).size : 0,
      historySize: history ? new Blob([history]).size : 0,
      totalSize: (plan ? new Blob([plan]).size : 0) + (history ? new Blob([history]).size : 0),
      hasPlan: !!plan,
      historyEntries: history ? JSON.parse(history).length : 0,
    };
  } catch (error) {
    return {
      planSize: 0,
      historySize: 0,
      totalSize: 0,
      hasPlan: false,
      historyEntries: 0,
    };
  }
}
