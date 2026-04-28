/* global Sha1 */

import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { NumberPopup } from "@point_of_sale/app/utils/input_popups/number_popup";
import { makeAwaitable } from "@point_of_sale/app/store/make_awaitable_dialog";
import { PosOrder } from "@point_of_sale/app/models/pos_order";

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

patch(PosOrder.prototype, {
    async removeOrderline(line) {
        console.log("[ORDERLINE_DELETE] removeOrderline called for line:", line?.product_id?.name);
        
        if (!line) {
            return super.removeOrderline(line);
        }

        // Verificar si la línea fue enviada a cocina (saved_quantity > 0)
        const sentToKitchen = toNumber(line.saved_quantity, 0) > 0;
        const isServed =
            (typeof line?.getKitchenState === "function" && line.getKitchenState() === "served") ||
            line?.kitchen_state === "served";

        if (sentToKitchen || isServed) {
            console.log("[ORDERLINE_DELETE] Line was sent to kitchen or is served - requesting authorization");
            
            // Pedir autorización del supervisor
            const approved = await this._requestSupervisorAuthorizationForLineDelete();
            if (!approved) {
                console.log("[ORDERLINE_DELETE] Authorization denied");
                return;
            }
            
            console.log("[ORDERLINE_DELETE] Authorization approved");
        }

        // Proceder con la eliminación normal
        return super.removeOrderline(line);
    },

    async _requestSupervisorAuthorizationForLineDelete() {
        // Acceder a través de this.pos (que es una referencia a PosStore)
        const pos = this.pos;
        
        if (!pos?.config?.module_pos_hr) {
            await pos?.dialog?.add(AlertDialog, {
                title: _t("Error"),
                body: _t("POS HR required"),
            });
            return false;
        }

        const managers = (pos.models["hr.employee"] || []).filter(
            (emp) => emp._role === "manager" && emp._pin
        );

        if (!managers.length) {
            await pos?.dialog?.add(AlertDialog, {
                title: _t("Error"),
                body: _t("No supervisors"),
            });
            return false;
        }

        const pin = await makeAwaitable(pos?.dialog, NumberPopup, {
            title: _t("PIN Required"),
            subtitle: _t("Line was prepared. Enter supervisor PIN."),
            formatDisplayedValue: (x) => x.replace(/./g, "*"),
        });

        if (!pin) {
            pos?.notification?.add(_t("Cancelled"), { type: "warning" });
            return false;
        }

        const hash = Sha1.hash(String(pin));
        const valid = managers.some((emp) => emp._pin === hash);

        if (!valid) {
            await pos?.dialog?.add(AlertDialog, {
                title: _t("Invalid"),
                body: _t("Wrong PIN"),
            });
            return false;
        }

        pos?.notification?.add(_t("Authorized"), { type: "success" });
        return true;
    },
});
