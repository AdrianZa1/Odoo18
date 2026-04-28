import { patch } from "@web/core/utils/patch";
import { PosOrderline } from "@point_of_sale/app/models/pos_order_line";

function getKitchenStateStorageKey(line) {
    const lineRef = line?.uuid || line?.id || "no_line";
    return `mr_kitchen_state_${lineRef}`;
}

function readStoredKitchenState(line) {
    const key = getKitchenStateStorageKey(line);
    return window.localStorage.getItem(key);
}

function writeStoredKitchenState(line, state) {
    const key = getKitchenStateStorageKey(line);
    if (state) {
        window.localStorage.setItem(key, state);
    } else {
        window.localStorage.removeItem(key);
    }
}

function normalizeKitchenState(line, state) {
    const savedQuantity = Number(line?.saved_quantity || 0);
    const persistedState = readStoredKitchenState(line);
    const sourceState = state || line?.kitchen_state || persistedState;

    if (sourceState === "served") {
        return "served";
    }
    if (sourceState === "prepared") {
        return "prepared";
    }
    if (sourceState === "ordered") {
        return "ordered";
    }
    return savedQuantity > 0 ? "ordered" : "waiting";
}

patch(PosOrderline.prototype, {
    setup(vals) {
        super.setup(...arguments);
        this.kitchen_state = normalizeKitchenState(this, vals.kitchen_state);
        this.kitchenServed = this.kitchen_state === "served";
        this.isReserved = false;
    },

    setKitchenState(state) {
        const normalizedState = normalizeKitchenState(this, state);
        this.kitchen_state = normalizedState;
        this.kitchenServed = normalizedState === "served";
        this.isReserved = false;
        writeStoredKitchenState(this, normalizedState === "waiting" ? "" : normalizedState);
        this.update({ kitchen_state: normalizedState });
        this.setDirty();
        return normalizedState;
    },

    getDisplayClasses() {
        const kitchenState = normalizeKitchenState(this, this.kitchen_state);

        return {
            ...super.getDisplayClasses(...arguments),
            "kitchen-pending-line": kitchenState === "waiting",
            "kitchen-sent-line": kitchenState === "ordered" || kitchenState === "prepared",
            "kitchen-served-line": kitchenState === "served",
            "kitchen-reserved-line": false,
        };
    },

    setKitchenServed(served = true) {
        return this.setKitchenState(served ? "served" : "ordered");
    },

    restoreKitchenServedState() {
        this.kitchen_state = normalizeKitchenState(this, this.kitchen_state);
        this.kitchenServed = this.kitchen_state === "served";
    },

    getKitchenState() {
        return normalizeKitchenState(this, this.kitchen_state);
    },
});
