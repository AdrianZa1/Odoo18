/** @odoo-module **/
/**
 * ========================================================================
 * POS Models Extension - Card Brand
 * ========================================================================
 * Extiende los modelos del POS para incluir el campo card_brand.
 */

import { patch } from "@web/core/utils/patch";
import { PosPayment } from "@point_of_sale/app/models/pos_payment";

/**
 * Extensión del modelo PosPayment para agregar card_brand
 */
patch(PosPayment.prototype, {
    /**
    * Setup del modelo PosPayment
    * Agrega el campo card_brand con valor por defecto
     */
    setup(vals) {
        super.setup(...arguments);
        this.card_brand = vals.card_brand || false;
        this.lot_number = vals.lot_number || false;
    },

    /**
     * Cargar campos personalizados desde JSON del backend
     * para mantener consistencia al restaurar ordenes.
     */
    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        this.card_brand = json.card_brand || false;
        this.lot_number = json.lot_number || false;
    },

    /**
     * Exportar campos personalizados al backend pos.payment.
     */
    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        json.card_brand = this.card_brand || false;
        json.lot_number = this.lot_number || false;
        return json;
    },

    /**
     * Exporta el texto de pago para el recibo POS.
     * Aqui se construye el nombre que se imprime en el ticket.
     */
    export_for_printing() {
        const data = super.export_for_printing(...arguments);
        data.name = this.get_payment_method_name();
        data.lot_number = this.lot_number || false;
        return data;
    },

    /**
     * Obtener el nombre completo del método de pago
     * Incluye la marca de tarjeta si existe
     * Ejemplo: "Tarjeta de Crédito - Visa"
     */
    get_payment_method_name() {
        let name = this.payment_method_id?.name || "";

        // Agregar marca cuando exista, incluso si el metodo no trae el flag cargado.
        if (this.card_brand) {
            name = `${name} - ${this.card_brand}`;
        }

        if (this.lot_number) {
            name = `${name} | Lote: ${this.lot_number}`;
        }

        return name;
    },

    /**
     * Establecer la marca de tarjeta
    * @param {string} brand - Nombre de la marca
     */
    setCardBrand(brand) {
        this.update({ card_brand: brand });
    },

    /**
     * Establecer numero de lote de voucher.
     * @param {string} lotNumber - Numero de lote ingresado por cajero.
     */
    setLotNumber(lotNumber) {
        this.update({ lot_number: lotNumber });
    },

    /**
     * Verificar si requiere marca de tarjeta
     * @returns {boolean} true si es pago con tarjeta y no tiene marca
     */
    requiresCardBrand() {
        return this.payment_method_id?.is_card_payment && !this.card_brand;
    },

    /**
     * Verificar si requiere numero de lote.
     * @returns {boolean} true si es pago con tarjeta y no tiene lote.
     */
    requiresLotNumber() {
        return this.payment_method_id?.is_card_payment && !this.lot_number;
    },
});
