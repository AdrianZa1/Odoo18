/* global Sha1 */

import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { NumberPopup } from "@point_of_sale/app/utils/input_popups/number_popup";
import { makeAwaitable } from "@point_of_sale/app/store/make_awaitable_dialog";
import { OrderSummary } from "@point_of_sale/app/screens/product_screen/order_summary/order_summary";
import { PosOrder } from "@point_of_sale/app/models/pos_order";

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function getOrderServiceProgress(order) {
    if (!order?.lines?.length) {
        return 0;
    }

    const lines = order.lines.filter((line) => toNumber(line.get_quantity?.() ?? line.qty, 0) > 0);
    if (!lines.length) {
        return 0;
    }

    const servedLines = lines.filter(
        (line) =>
            (typeof line?.getKitchenState === "function" && line.getKitchenState() === "served") ||
            line?.kitchen_state === "served"
    ).length;
    const percentage = Math.round((servedLines / lines.length) * 100);
    return Math.max(0, Math.min(100, percentage));
}

patch(PosOrder.prototype, {
    setup(vals) {
        super.setup(...arguments);
        this.uiState = {
            ...(this.uiState || {}),
            kitchenServiceProgressPct: toNumber(this.uiState?.kitchenServiceProgressPct, 0),
        };
        this.kitchen_service_progress_pct = toNumber(this.kitchen_service_progress_pct, 0);
    },

    updateKitchenServiceProgress() {
        const percentage = getOrderServiceProgress(this);

        this.uiState = {
            ...(this.uiState || {}),
            kitchenServiceProgressPct: percentage,
        };

        // Extra mirror value to simplify consumption from other modules.
        this.kitchen_service_progress_pct = percentage;
        return percentage;
    },

    getKitchenServiceProgress() {
        return toNumber(this.uiState?.kitchenServiceProgressPct, 0);
    },

    getKitchenWaitingTime() {
        // Use date_order which is automatically saved in backend
        if (!this.date_order) {
            return 0;
        }
        
        // Odoo stores dates in UTC format. Need to parse as UTC by adding 'Z'
        // Example: "2026-03-07 20:28:56" → "2026-03-07T20:28:56Z"
        const utcDateString = this.date_order.replace(' ', 'T') + 'Z';
        const orderDate = new Date(utcDateString);
        const now = new Date();
        const diffMs = now - orderDate;
        const seconds = Math.floor(diffMs / 1000);
        
        return Math.max(0, seconds);
    },
});

patch(OrderSummary.prototype, {
    _isServedLocked(line) {
        return (
            (typeof line?.getKitchenState === "function" && line.getKitchenState() === "served") ||
            line?.kitchen_state === "served"
        );
    },

    async _showServedLockedMessage() {
        await this.dialog.add(AlertDialog, {
            title: _t("Linea Servida"),
            body: _t("Esta linea ya esta marcada como servida y no se puede eliminar ni reducir."),
        });
    },

    _lineHasKitchenQty(line) {
        return this.pos?.config?.module_pos_restaurant && toNumber(line?.saved_quantity, 0) > 0;
    },

    _resolveTargetQty(val, line) {
        if (!line) {
            return null;
        }
        const currentQty = toNumber(line.get_quantity(), 0);
        if (val === "") {
            // In this UI path, '-' can arrive as an empty buffer value.
            return currentQty - 1;
        }
        const parsed = Number(val);
        return Number.isFinite(parsed) ? parsed : null;
    },

    async _requestSupervisorAuthorization() {
        if (!this.pos?.config?.module_pos_hr) {
            await this.dialog.add(AlertDialog, {
                title: _t("Autorización de Supervisor Requerida"),
                body: _t("POS HR debe estar habilitado para validar el PIN de supervisor."),
            });
            return false;
        }

        const managers = (this.pos.models["hr.employee"] || []).filter(
            (employee) => employee._role === "manager" && employee._pin
        );

        if (!managers.length) {
            await this.dialog.add(AlertDialog, {
                title: _t("Supervisor No Encontrado"),
                body: _t("No se encontró ningún supervisor con PIN en esta sesión de POS."),
            });
            return false;
        }

        const pin = await makeAwaitable(this.dialog, NumberPopup, {
            title: _t("PIN de Supervisor Requerido"),
            subtitle: _t(
                "Ingrese el PIN de supervisor para autorizar este cambio en la orden."
            ),
            formatDisplayedValue: (x) => x.replace(/./g, "*"),
        });

        if (!pin) {
            this.pos?.notification?.add(_t("Autorización cancelada."), {
                type: "warning",
            });
            return false;
        }

        const hashedPin = Sha1.hash(String(pin));
        const approved = managers.some((employee) => employee._pin === hashedPin);

        if (!approved) {
            await this.dialog.add(AlertDialog, {
                title: _t("Acceso Denegado"),
                body: _t("PIN de supervisor incorrecto."),
            });
            this.pos?.notification?.add(_t("PIN incorrecto."), {
                type: "danger",
            });
            return false;
        }

        this.pos?.notification?.add(_t("PIN correcto. Acción autorizada."), {
            type: "success",
        });

        return true;
    },

    async updateSelectedOrderline(payload) {
        const line = this.currentOrder?.get_selected_orderline();
        const { buffer } = payload || {};
        let nextPayload = payload;
        const order = this.currentOrder;

        if (order?.updateKitchenServiceProgress) {
            order.updateKitchenServiceProgress();
        }

        if (line && this.pos?.numpadMode === "quantity" && (this._lineHasKitchenQty(line) || this._isServedLocked(line))) {
            const savedQty = toNumber(line.saved_quantity, 0);
            const currentQty = toNumber(line.get_quantity(), 0);
            const isServed = this._isServedLocked(line);
            
            let requiresAuth = false;
            
            // Si buffer es null significa eliminar (botón X o Backspace)
            if (buffer === null) {
                // Si hay platos agregados despues de cocina, X solo descuenta 1 (no borra toda la linea)
                if (currentQty > savedQty && !isServed) {
                    nextPayload = { ...payload, buffer: String(currentQty - 1) };
                } else {
                    requiresAuth = true;
                }
            } 
            // Si buffer está vacío significa botón "-" (reducir en 1)
            else if (buffer === "") {
                const targetQty = currentQty - 1;
                if (targetQty < savedQty || (isServed && targetQty < currentQty)) {
                    requiresAuth = true;
                }
            }
            // Si buffer tiene un número, verificar si es menor que saved o si está servida
            else {
                const targetQty = toNumber(buffer, currentQty);
                if (targetQty < savedQty || (isServed && targetQty < currentQty)) {
                    requiresAuth = true;
                }
            }

            if (requiresAuth) {
                const approved = await this._requestSupervisorAuthorization();
                if (!approved) {
                    this.numberBuffer.reset();
                    return;
                }
            }
        }

        const result = await super.updateSelectedOrderline(nextPayload);

        if (order?.updateKitchenServiceProgress) {
            order.updateKitchenServiceProgress();
        }

        return result;
    },

    async clickLine(ev, orderline) {
        if (ev?.detail === 2 && orderline && this._lineHasKitchenQty(orderline)) {
            ev.stopPropagation();
            clearTimeout(this.singleClick);
            if (typeof orderline.setKitchenState === "function") {
                orderline.setKitchenState("served");
            } else {
                orderline.update({ kitchen_state: "served" });
            }
            this.currentOrder?.updateKitchenServiceProgress?.();
            this.pos?.notification?.add(_t("Servido"), {
                type: "success",
            });
            return;
        }

        return super.clickLine(...arguments);
    },

    async updateQuantityNumber(newQuantity) {
        const line = this.currentOrder?.get_selected_orderline();
        if (line && this._isServedLocked(line)) {
            const currentQty = toNumber(line.get_quantity(), 0);
            const targetQty = toNumber(newQuantity, currentQty);
            if (targetQty < currentQty) {
                await this._showServedLockedMessage();
                return false;
            }
        }

        if (line && this._lineHasKitchenQty(line)) {
            const savedQty = toNumber(line.saved_quantity, 0);
            const targetQty = toNumber(newQuantity, savedQty);
            if (targetQty < savedQty) {
                const approved = await this._requestSupervisorAuthorization();
                if (!approved) {
                    return false;
                }
            }
            // Si la cantidad baja por debajo de enviada a cocina, deja de estar "servido"
            if (this._isServedLocked(line) && targetQty < savedQty) {
                if (typeof line.setKitchenState === "function") {
                    line.setKitchenState(targetQty > 0 ? "ordered" : "waiting");
                } else {
                    line.update({ kitchen_state: targetQty > 0 ? "ordered" : "waiting" });
                }
            }
        }
        const result = await super.updateQuantityNumber(...arguments);
        if (this.currentOrder?.updateKitchenServiceProgress) {
            this.currentOrder.updateKitchenServiceProgress();
        }
        return result;
    },

    _setValue(val) {
        const result = super._setValue(...arguments);
        if (this.currentOrder?.updateKitchenServiceProgress) {
            this.currentOrder.updateKitchenServiceProgress();
        }
        return result;
    },
});
