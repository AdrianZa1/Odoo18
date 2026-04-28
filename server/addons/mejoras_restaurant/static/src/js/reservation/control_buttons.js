import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { NumberPopup } from "@point_of_sale/app/utils/input_popups/number_popup";
import { makeAwaitable } from "@point_of_sale/app/store/make_awaitable_dialog";
import { ControlButtons } from "@point_of_sale/app/screens/product_screen/control_buttons/control_buttons";

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

patch(ControlButtons.prototype, {
    get selectedOrderlineForReservation() {
        return this.currentOrder?.get_selected_orderline();
    },

    get canReserveSelectedLine() {
        const line = this.selectedOrderlineForReservation;
        return Boolean(line && toNumber(line.get_quantity?.() ?? line.qty, 0) > 0);
    },

    async _ensureOrderSyncedForReservation(order, lineUuid) {
        if (typeof order?.id === "number") {
            return { order, line: order.lines.find((item) => item.uuid === lineUuid) };
        }

        this.pos.addPendingOrder?.([order.id]);
        await this.pos.syncAllOrders({ orders: [order] });

        const syncedOrder = this.pos.models["pos.order"].getBy("uuid", order.uuid) || this.pos.get_order();
        if (syncedOrder) {
            this.pos.set_order(syncedOrder);
        }

        return {
            order: syncedOrder,
            line: syncedOrder?.lines.find((item) => item.uuid === lineUuid),
        };
    },

    async _askReserveQuantity(maxQty) {
        if (maxQty <= 1) {
            return maxQty;
        }

        const payload = await makeAwaitable(this.dialog, NumberPopup, {
            title: _t("Reservar cantidad"),
            subtitle: _t("Ingrese cuántas unidades desea reservar."),
            startingValue: String(maxQty),
            confirmButtonLabel: _t("Reservar"),
            isValid: (buffer) => {
                const qty = Number(buffer);
                return Number.isInteger(qty) && qty > 0 && qty <= maxQty;
            },
            getPayload: (buffer) => buffer,
        });

        if (payload === undefined || payload === null || payload === "") {
            return null;
        }

        const qty = Number(payload);
        return Number.isInteger(qty) && qty > 0 && qty <= maxQty ? qty : null;
    },

    async clickReserveLine() {
        const initialOrder = this.currentOrder;
        const initialLine = this.selectedOrderlineForReservation;

        if (!initialOrder || !initialLine) {
            this.dialog.add(AlertDialog, {
                title: _t("Sin línea seleccionada"),
                body: _t("Seleccione una línea antes de reservar."),
            });
            return;
        }

        if (initialLine.combo_parent_id || initialLine.combo_line_ids?.length) {
            this.dialog.add(AlertDialog, {
                title: _t("Reserva no disponible"),
                body: _t("Por ahora la reserva no está disponible para líneas de combo."),
            });
            return;
        }

        const lineUuid = initialLine.uuid;
        const synced = await this._ensureOrderSyncedForReservation(initialOrder, lineUuid);
        const order = synced.order;
        const line = synced.line;

        if (!order || !line) {
            this.dialog.add(AlertDialog, {
                title: _t("Línea no encontrada"),
                body: _t("No se pudo localizar la línea seleccionada después de sincronizar."),
            });
            return;
        }

        const currentQty = toNumber(line.get_quantity?.() ?? line.qty, 0);
        if (currentQty <= 0) {
            this.dialog.add(AlertDialog, {
                title: _t("Cantidad inválida"),
                body: _t("La línea seleccionada ya no tiene cantidad disponible para reservar."),
            });
            return;
        }

        const reserveQty = await this._askReserveQuantity(currentQty);
        if (!reserveQty) {
            return;
        }

        const cashier = this.pos.get_cashier?.();

        await this.pos.data.call(
            "pos.order.line.reservation",
            "create_from_pos",
            [
                {
                    order_id: order.id,
                    line_uuid: line.uuid,
                    reserve_qty: reserveQty,
                    cashier_employee_id: cashier?.id || false,
                },
            ],
            {},
            true
        );

        if (reserveQty >= currentQty) {
            line.delete();
        } else {
            line.set_quantity(currentQty - reserveQty);
            if (typeof line.setKitchenState === "function" && line.getKitchenState() === "served") {
                line.setKitchenState("ordered");
            }
        }

        order.recomputeOrderData?.();
        order.updateKitchenServiceProgress?.();

        this.pos.addPendingOrder?.([order.id]);
        await this.pos.syncAllOrders({ orders: [order] });

        this.notification.add(_t("Reserva registrada y orden actualizada."), {
            type: "success",
        });
        this.props.close?.();
    },
});
