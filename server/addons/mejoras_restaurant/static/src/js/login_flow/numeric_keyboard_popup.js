import { Component, useEffect, useState } from "@odoo/owl";

export class NumericKeyboardPopup extends Component {
    static template = "mejoras_restaurant.NumericKeyboardPopup";
    static props = {
        title: { type: String, optional: true },
        close: { type: Function },
    };

    setup() {
        this.state = useState({ pin: "" });

        useEffect(() => {
            const onKeydown = (event) => {
                if (/^[0-9]$/.test(event.key)) {
                    event.preventDefault();
                    this.pressKey(Number(event.key));
                } else if (event.key === "Backspace" || event.key === "Delete") {
                    event.preventDefault();
                    this.deletePin();
                } else if (event.key === "Enter") {
                    event.preventDefault();
                    this.confirm();
                } else if (event.key === "Escape") {
                    event.preventDefault();
                    this.cancel();
                }
            };

            window.addEventListener("keydown", onKeydown);
            return () => window.removeEventListener("keydown", onKeydown);
        });
    }

    getDisplayValue() {
        return this.state.pin ? this.state.pin.replace(/./g, "*") : "-";
    }

    pressKey(num) {
        if (this.state.pin.length < 8) {
            this.state.pin += String(num);
        }
    }

    deletePin() {
        this.state.pin = this.state.pin.slice(0, -1);
    }

    confirm() {
        if (!this.state.pin) {
            return;
        }
        this.props.close(this.state.pin);
    }

    cancel() {
        this.props.close(null);
    }
}
