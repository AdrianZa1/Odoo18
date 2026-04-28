# -*- coding: utf-8 -*-
"""
Extiende account.move para mostrar datos de pago POS en factura.
"""

from odoo import models


class AccountMove(models.Model):
    _inherit = "account.move"

    def _compute_payments_widget_reconciled_info(self):
        """Compone etiqueta de pago con marca y lote para factura impresa."""
        super()._compute_payments_widget_reconciled_info()
        for move in self:
            widget = move.invoice_payments_widget
            if not widget:
                continue

            content = widget.get("content") or []
            if not content:
                continue

            reconciled_partials = move._get_all_reconciled_invoice_partials()
            for idx, reconciled_partial in enumerate(reconciled_partials):
                if idx >= len(content):
                    break

                counterpart_line = reconciled_partial.get("aml")
                if not counterpart_line:
                    continue

                pos_payment = counterpart_line.move_id.sudo().pos_payment_ids[:1]
                if not pos_payment:
                    continue

                payment_label = pos_payment.payment_method_id.name or ""
                if pos_payment.card_brand:
                    payment_label = f"{payment_label} - {pos_payment.card_brand}"
                if pos_payment.lot_number:
                    payment_label = f"{payment_label} | Lote: {pos_payment.lot_number}"

                content[idx].update({
                    "pos_payment_name": payment_label,
                })

            move.invoice_payments_widget = widget
