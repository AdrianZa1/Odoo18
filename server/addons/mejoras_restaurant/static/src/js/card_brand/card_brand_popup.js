/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { Dialog } from "@web/core/dialog/dialog";
import { _t } from "@web/core/l10n/translation";

export class CardBrandGridPopup extends Component {
    static template = "mejoras_restaurant.CardBrandGridPopup";
    static components = { Dialog };
    static props = {
        title: { type: String, optional: true },
        subtitle: { type: String, optional: true },
        cards: { type: Array, optional: true },
        getPayload: Function,
        close: Function,
    };
    static defaultProps = {
        title: _t("Seleccionar Marca de Tarjeta"),
        subtitle: _t("Seleccione la marca correspondiente"),
        cards: [],
    };

    setup() {
        this.state = useState({
            selectedKey: null,
            lotNumber: "",
        });
    }

    selectCard(card) {
        this.state.selectedKey = card.key;
    }

    onLotNumberInput(ev) {
        this.state.lotNumber = this.sanitizeLotNumber(ev.target.value || "");
    }

    sanitizeLotNumber(rawValue) {
        // Mantiene solo digitos para evitar letras/simbolos.
        return String(rawValue).replace(/\D/g, "").slice(0, 12);
    }

    appendLotDigit(digit) {
        const nextValue = `${this.state.lotNumber}${digit}`;
        this.state.lotNumber = this.sanitizeLotNumber(nextValue);
    }

    backspaceLotNumber() {
        this.state.lotNumber = this.state.lotNumber.slice(0, -1);
    }

    clearLotNumber() {
        this.state.lotNumber = "";
    }

    canConfirm() {
        return Boolean(this.state.selectedKey && this.state.lotNumber && /^\d+$/.test(this.state.lotNumber));
    }

    confirm() {
        if (!this.canConfirm()) {
            return;
        }
        const selected = this.props.cards.find((card) => card.key === this.state.selectedKey);
        this.props.getPayload(
            selected
                ? {
                      ...selected,
                      lotNumber: this.state.lotNumber,
                  }
                : null
        );
        this.props.close();
    }

    cancel() {
        this.props.getPayload(null);
        this.props.close();
    }
}
