/** @odoo-module **/
/**
 * ========================================================================
 * Payment Screen Extension - Card Brand
 * ========================================================================
 * Extiende la pantalla de pago del POS para solicitar marca de tarjeta.
 */

import { patch } from "@web/core/utils/patch";
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { makeAwaitable } from "@point_of_sale/app/store/make_awaitable_dialog";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { _t } from "@web/core/l10n/translation";
import { CardBrandGridPopup } from "@mejoras_restaurant/js/card_brand/card_brand_popup";
import { getCardBrandsForType, getPaymentCardType } from "@mejoras_restaurant/js/card_brand/card_brand_data";

function isCardMethod(paymentMethod) {
    if (!paymentMethod) {
        return false;
    }
    if (paymentMethod.is_card_payment) {
        return true;
    }
    const name = (paymentMethod.name || "").toLowerCase();
    return name.includes("tarjeta") || name.includes("card") || name.includes("credito") || name.includes("debito");
}

function isValidLotNumber(lotNumber) {
    return /^\d+$/.test(String(lotNumber || "").trim());
}

patch(PaymentScreen.prototype, {
    async addNewPaymentLine(paymentMethod) {
        const result = await super.addNewPaymentLine(...arguments);
        if (!result) {
            return result;
        }

        const line = this.paymentLines.at(-1);
        if (line && isCardMethod(line.payment_method_id) && !line.card_brand) {
            await this.requestCardBrand(line);
        }
        return result;
    },

    async requestCardBrand(paymentLine) {
        const paymentType = getPaymentCardType(paymentLine.payment_method_id);
        const cards = getCardBrandsForType(paymentType);
        const subtitle =
            paymentType === "debit"
                ? _t("Metodo detectado: Tarjeta Debito")
                : _t("Metodo detectado: Tarjeta de Credito");

        const payload = await makeAwaitable(this.dialog, CardBrandGridPopup, {
            title: _t("Seleccionar Marca de Tarjeta"),
            subtitle,
            cards,
        });

        if (payload?.label && payload?.lotNumber) {
            if (typeof paymentLine.setCardBrand === "function") {
                paymentLine.setCardBrand(payload.label);
            } else {
                paymentLine.update({ card_brand: payload.label });
            }
            if (typeof paymentLine.setLotNumber === "function") {
                paymentLine.setLotNumber(payload.lotNumber);
            } else {
                paymentLine.update({ lot_number: payload.lotNumber });
            }
        } else {
            this.currentOrder.remove_paymentline(paymentLine);
            this.dialog.add(AlertDialog, {
                title: _t("Pago Cancelado"),
                body: _t(
                    "Debe seleccionar marca de tarjeta y numero de lote para continuar con el pago."
                ),
            });
        }
    },

    async validateOrder(isForceValidate) {
        const paymentLines = this.paymentLines;
        const invalidPayments = paymentLines.filter(
            (payment) =>
                isCardMethod(payment.payment_method_id) &&
                (!payment.card_brand || !isValidLotNumber(payment.lot_number))
        );

        if (invalidPayments.length > 0) {
            this.dialog.add(AlertDialog, {
                title: _t("Error de Validacion"),
                body: _t(
                    "Todos los pagos con tarjeta deben tener marca y numero de lote valido.\n" +
                        "El numero de lote debe contener solo numeros."
                ),
            });
            return;
        }

        return await super.validateOrder(...arguments);
    },

    async selectPaymentLine(uuid) {
        await super.selectPaymentLine(...arguments);
        const line = this.paymentLines.find((item) => item.uuid === uuid);
        if (
            line &&
            isCardMethod(line.payment_method_id) &&
            (!line.card_brand || !isValidLotNumber(line.lot_number))
        ) {
            await this.requestCardBrand(line);
        }
    },
});

