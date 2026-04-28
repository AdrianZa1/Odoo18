/** @odoo-module */

import { FloorScreen } from "@pos_restaurant/app/floor_screen/floor_screen";
import { patch } from "@web/core/utils/patch";
import { onMounted, onWillUnmount, useState } from "@odoo/owl";

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Read service progress from the active order without recalculating it.
 * Priority:
 * 1) order.getKitchenServiceProgress()
 * 2) order.uiState.kitchenServiceProgressPct
 * 3) order.kitchen_service_progress_pct
 * Fallback: 0
 */
function getCurrentOrderServiceProgress(order) {
    if (!order) {
        return 0;
    }

    if (typeof order.getKitchenServiceProgress === "function") {
        return Math.max(0, Math.min(100, toNumber(order.getKitchenServiceProgress(), 0)));
    }

    const fromUiState = order.uiState?.kitchenServiceProgressPct;
    if (fromUiState !== undefined && fromUiState !== null) {
        return Math.max(0, Math.min(100, toNumber(fromUiState, 0)));
    }

    const fromMirror = order.kitchen_service_progress_pct;
    return Math.max(0, Math.min(100, toNumber(fromMirror, 0)));
}

/**
 * Extend FloorScreen to display waiter name on tables
 *
 * IMPORTANT:
 * We must not rely on @web/core/user in POS because it may resolve to the
 * backend user (often Administrator) instead of the actual cashier/waiter.
 */
patch(FloorScreen.prototype, {
    setup() {
        super.setup(...arguments);
        this.waitingTimeState = useState({ tick: 0 });
        
        onMounted(() => {
            // Update waiting times every 10 seconds for real-time display
            this._waitingTimeInterval = setInterval(() => {
                this.waitingTimeState.tick++;
            }, 10000); // 10 seconds
        });

        onWillUnmount(() => {
            if (this._waitingTimeInterval) {
                clearInterval(this._waitingTimeInterval);
            }
        });
    },

    _getActiveTableOrder(table) {
        if (!table || !this.pos) {
            return null;
        }

        // Prefer restaurant-aware active orders; fallback to table.getOrder.
        const tableOrders = this.pos.getActiveOrdersOnTable
            ? this.pos.getActiveOrdersOnTable(table)
            : [];

        if (tableOrders && tableOrders.length) {
            // Pick the most recent active order to avoid stale waiter values.
            return tableOrders.reduce((latest, current) => {
                const latestTs = Date.parse(latest?.date_order || "") || 0;
                const currentTs = Date.parse(current?.date_order || "") || 0;
                if (currentTs > latestTs) {
                    return current;
                }
                if (currentTs < latestTs) {
                    return latest;
                }
                return (current?.id || 0) > (latest?.id || 0) ? current : latest;
            }, tableOrders[0]);
        }

        return table.getOrder ? table.getOrder() : null;
    },

    /**
     * Exposes the service progress value for future waiter-panel logic.
     * Not rendered in UI for now.
     */
    getTableServiceProgress(table) {
        const order = this._getActiveTableOrder(table);
        return getCurrentOrderServiceProgress(order);
    },

    /**
     * Check if a table has an active order
     * @param {RestaurantTable} table - The table object
     * @returns {boolean} - True if table has an order
     */
    getTableHasOrder(table) {
        const order = this._getActiveTableOrder(table);
        return !!order;
    },

    /**
     * Get waiting time since first kitchen order was sent
     * @param {RestaurantTable} table - The table object
     * @returns {string} - Formatted waiting time (e.g., "5m", "1h 12m")
     */
    getTableWaitingTime(table) {
        // Force reactivity with tick counter
        this.waitingTimeState.tick;
        
        const order = this._getActiveTableOrder(table);
        
        if (!order) {
            return "";
        }

        // Show time for any order (not just those sent to kitchen)
        const seconds = typeof order.getKitchenWaitingTime === "function" 
            ? order.getKitchenWaitingTime() 
            : 0;

        if (seconds <= 0) {
            return "";
        }

        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours > 0) {
            return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
        }
        return `${minutes}m`;
    },

    /**
     * Get the waiter name for a given table
     * Only shows waiter if table has an active order.
     * @param {RestaurantTable} table - The table object
     * @returns {string|null} - Waiter name or null if no order
     */
    getTableWaiter(table) {
        if (!table) {
            return null;
        }

        const order = this._getActiveTableOrder(table);

        // Only show waiter if there's an actual order
        if (order?.employee_id?.name) {
            return order.employee_id.name;
        }
        if (order?.user_id?.name) {
            return order.user_id.name;
        }

        return null;
    },

    /**
     * Get a unique color for the waiter badge based on user ID
     * Uses golden angle to distribute colors evenly across hue spectrum
     * @param {RestaurantTable} table - The table object
     * @returns {string|null} - HSL color string or null
     */
    getTableWaiterColor(table) {
        if (!table) {
            return null;
        }

        const order = this._getActiveTableOrder(table);
        const waiterRef = order?.employee_id || order?.user_id;

        if (waiterRef?.id) {
            // Generate a unique hue for each waiter using golden angle
            const hue = (waiterRef.id * 137.508) % 360;
            return `hsl(${hue}, 65%, 50%)`;
        }

        return null;
    },

    /**
     * Get waiter initials for compact display
     * @param {RestaurantTable} table - The table object
     * @returns {string|null} - Initials or null
     */
    getTableWaiterInitials(table) {
        const waiterName = this.getTableWaiter(table);

        if (!waiterName) {
            return null;
        }

        // Split name and get initials
        const parts = waiterName.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }

        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
});
