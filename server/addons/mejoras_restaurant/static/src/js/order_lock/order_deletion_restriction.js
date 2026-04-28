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
    /**
     * Verifica si una orden fue enviada a cocina
     * Una orden se considera enviada a cocina si tiene al menos una línea
     * con saved_quantity > 0 (mandada a cocina previamente)
     */
    if (!order?.lines?.length) {
        return false;
    }
    
    return order.lines.some((line) => toNumber(line?.saved_quantity, 0) > 0);
}

patch(PosStore.prototype, {
    async _onBeforeDeleteOrder(order) {
        console.log("[ORDER_DELETION_RESTRICTION] _onBeforeDeleteOrder called for order:", order?.name);
        
        // Primero ejecutar el hook de la clase padre
        const parentApproved = await super._onBeforeDeleteOrder(order);
        console.log("[ORDER_DELETION_RESTRICTION] Parent approved:", parentApproved);
        
        if (!parentApproved) {
            return false;
        }

        // Verificar si la orden fue enviada a cocina
        const isSentToKitchen = hasOrderBeenSentToKitchen(order);
        console.log("[ORDER_DELETION_RESTRICTION] Order sent to kitchen:", isSentToKitchen);
        
        if (isSentToKitchen) {
            // Si fue enviada a cocina, requiere PIN de supervisor
            console.log("[ORDER_DELETION_RESTRICTION] Requesting supervisor authorization");
            const approved = await this._requestSupervisorAuthorizationForOrderDeletion();
            console.log("[ORDER_DELETION_RESTRICTION] Supervisor authorization result:", approved);
            return approved;
        }

        // Órdenes no enviadas a cocina se pueden eliminar normalmente
        console.log("[ORDER_DELETION_RESTRICTION] Order not sent to kitchen, allowing deletion");
        return true;
    },

    async _requestSupervisorAuthorizationForOrderDeletion() {
        console.log("[ORDER_DELETION_RESTRICTION] Checking POS HR module");
        
        if (!this.config.module_pos_hr) {
            console.log("[ORDER_DELETION_RESTRICTION] POS HR not enabled");
            await this.dialog.add(AlertDialog, {
                title: _t("Autorización de Supervisor Requerida"),
                body: _t("POS HR debe estar habilitado para validar el PIN de supervisor."),
            });
            return false;
        }

        const managers = (this.models["hr.employee"] || []).filter(
            (employee) => employee._role === "manager" && employee._pin
        );

        console.log("[ORDER_DELETION_RESTRICTION] Managers found:", managers.length);
        
        if (!managers.length) {
            console.log("[ORDER_DELETION_RESTRICTION] No managers with PIN found");
            await this.dialog.add(AlertDialog, {
                title: _t("Supervisor No Encontrado"),
                body: _t("No se encontró ningún supervisor con PIN en esta sesión de POS."),
            });
            return false;
        }

        console.log("[ORDER_DELETION_RESTRICTION] Requesting PIN from user");
        
        const pin = await makeAwaitable(this.dialog, NumberPopup, {
            title: _t("PIN de Supervisor Requerido"),
            subtitle: _t(
                "Esta orden fue enviada a la cocina. Ingrese el PIN de supervisor para permitir la eliminación."
            ),
            formatDisplayedValue: (x) => x.replace(/./g, "*"),
        });

        if (!pin) {
            console.log("[ORDER_DELETION_RESTRICTION] User cancelled PIN entry");
            this.notification.add(_t("Eliminación cancelada."), {
                type: "warning",
            });
            return false;
        }

        const hashedPin = Sha1.hash(String(pin));
        const approved = managers.some((employee) => employee._pin === hashedPin);

        console.log("[ORDER_DELETION_RESTRICTION] PIN validation result:", approved);

        if (!approved) {
            await this.dialog.add(AlertDialog, {
                title: _t("Acceso Denegado"),
                body: _t("PIN de supervisor incorrecto."),
            });
            this.notification.add(_t("PIN incorrecto."), {
                type: "danger",
            });
            return false;
        }

        this.notification.add(_t("PIN correcto. Eliminación autorizada."), {
            type: "success",
        });

        return true;
    },
});
