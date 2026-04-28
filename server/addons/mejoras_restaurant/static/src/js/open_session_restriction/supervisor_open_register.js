/* global Sha1 */

import { patch } from "@web/core/utils/patch";
import { LoginScreen } from "@point_of_sale/app/screens/login_screen/login_screen";
import { useService } from "@web/core/utils/hooks";
import { makeAwaitable } from "@point_of_sale/app/store/make_awaitable_dialog";
import { NumberPopup } from "@point_of_sale/app/utils/input_popups/number_popup";
import { _t } from "@web/core/l10n/translation";

patch(LoginScreen.prototype, {
    setup() {
        super.setup(...arguments);
        this.notification = useService("notification");
    },

    openRegister() {
        if (!this.pos.config.module_pos_hr) {
            super.openRegister();
            return;
        }
        this._askPinAndOpen();
    },

    async _askPinAndOpen() {
        const pinInput = await makeAwaitable(this.dialog, NumberPopup, {
            formatDisplayedValue: (x) => x.replace(/./g, "•"),
            title: _t("¿Contraseña?"),
        });

        if (!pinInput) {
            return;
        }

        const matchingEmployees = this.pos.models["hr.employee"].filter(
            (emp) => emp._pin && emp._pin === Sha1.hash(pinInput)
        );

        if (!matchingEmployees.length) {
            this.notification.add(_t("PIN incorrecto. El empleado no fue encontrado."), {
                type: "warning",
                title: _t("Acceso denegado"),
            });
            return;
        }

        const employee = matchingEmployees[0];
        const sessionIsOpen = this.pos.session.state === "opened";
        const isRestaurant = this.pos.config.module_pos_restaurant;

        const selectedScreen =
            this.pos.previousScreen && this.pos.previousScreen !== "LoginScreen"
                ? this.pos.previousScreen
                : isRestaurant
                ? "FloorScreen"
                : "ProductScreen";

        if (!sessionIsOpen) {
            if (!this._employeeIsSupervisor(employee)) {
                this.notification.add(
                    _t(
                        "El supervisor no ha abierto caja. " +
                            "Solicite al supervisor que abra caja para poder tomar pedidos."
                    ),
                    {
                        type: "danger",
                        title: _t("Caja no abierta"),
                        sticky: true,
                    }
                );
                return;
            }

            this.pos.set_cashier(employee);
            this.pos.hasLoggedIn = true;
            this.pos.showScreen(isRestaurant ? "FloorScreen" : "ProductScreen");
        } else {
            this.pos.set_cashier(employee);
            this.pos.hasLoggedIn = true;
            this.pos.showScreen(selectedScreen);
        }
    },

    _employeeIsSupervisor(employee) {
        if (employee._role === "manager" || employee._user_role === "admin") {
            return true;
        }

        let jobName = "";
        if (Array.isArray(employee.job_id)) {
            jobName = (employee.job_id[1] || "").toLowerCase();
        } else if (typeof employee.job_id === "object" && employee.job_id) {
            jobName = (employee.job_id.name || "").toLowerCase();
        } else if (typeof employee.job_id === "string") {
            jobName = employee.job_id.toLowerCase();
        }

        const jobTitle = (employee.job_title || "").toLowerCase();
        const categoryNames = Array.isArray(employee.category_ids)
            ? employee.category_ids
                  .map((cat) => {
                      if (Array.isArray(cat)) {
                          return String(cat[1] || "").toLowerCase();
                      }
                      if (typeof cat === "object" && cat) {
                          return String(cat.name || "").toLowerCase();
                      }
                      return "";
                  })
                  .filter(Boolean)
            : [];

        return (
            jobName.includes("supervisor") ||
            jobTitle.includes("supervisor") ||
            categoryNames.some((name) => name.includes("supervisor"))
        );
    },
});
