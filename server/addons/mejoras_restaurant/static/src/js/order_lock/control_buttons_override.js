/* global Sha1 */

import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { NumberPopup } from "@point_of_sale/app/utils/input_popups/number_popup";
import { makeAwaitable } from "@point_of_sale/app/store/make_awaitable_dialog";
import { PosStore } from "@point_of_sale/app/store/pos_store";

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function hasOrderBeenSentToKitchen(order) {
    if (!order?.lines?.length) {
        return false;
    }
    return order.lines.some((line) => toNumber(line?.saved_quantity, 0) > 0);
}

patch(PosStore.prototype, {
    async onDeleteOrderWithKitchenCheck(order) {
        console.log("[KITCHEN_CHECK] Order delete requested");
        
        if (!order) {
            return false;
        }

        // Check if order was sent to kitchen
        if (hasOrderBeenSentToKitchen(order)) {
            console.log("[KITCHEN_CHECK] Order sent to kitchen - requesting PIN");
            
            const approved = await this._requestKitchenOrderPin();
            if (!approved) {
                console.log("[KITCHEN_CHECK] PIN denied");
                return false;
            }
        }

        // Call standard delete
        return await this.onDeleteOrder(order);
    },

    async _requestKitchenOrderPin() {
        if (!this.config.module_pos_hr) {
            await this.dialog.add(AlertDialog, {
                title: _t("Error"),
                body: _t("POS HR required"),
            });
            return false;
        }

        const managers = (this.models["hr.employee"] || []).filter(
            (e) => e._role === "manager" && e._pin
        );

        if (!managers.length) {
            await this.dialog.add(AlertDialog, {
                title: _t("Error"),
                body: _t("No supervisors"),
            });
            return false;
        }

        const pin = await makeAwaitable(this.dialog, NumberPopup, {
            title: _t("PIN Requerido"),
            subtitle: _t("Orden en cocina. PIN supervisor:"),
            formatDisplayedValue: (x) => x.replace(/./g, "*"),
        });

        if (!pin) {
            this.notification.add(_t("Cancelado"), { type: "warning" });
            return false;
        }

        const hash = Sha1.hash(String(pin));
        const valid = managers.some((e) => e._pin === hash);

        if (!valid) {
            await this.dialog.add(AlertDialog, {
                title: _t("Error"),
                body: _t("PIN incorrecto"),
            });
            return false;
        }

        this.notification.add(_t("Autorizado"), { type: "success" });
        return true;
    },
});


