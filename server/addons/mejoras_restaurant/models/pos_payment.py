# -*- coding: utf-8 -*-
"""
Extensión del modelo pos.payment
=================================
Extiende funcionalidad del campo card_brand existente en Odoo 18.
"""

from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class PosPayment(models.Model):
    """
    Extiende pos.payment para validar marca de tarjeta.
    NOTA: El campo card_brand ya existe en Odoo 18 como Char,
    solo agregamos validaciones adicionales.
    """
    _inherit = 'pos.payment'

    lot_number = fields.Char(
        string='Numero de lote',
        help='Numero de lote proveniente del datafono o Datafast',
    )

    @api.constrains('lot_number')
    def _check_lot_number_digits(self):
        """Asegura que el lote contenga solo digitos cuando exista valor."""
        for payment in self:
            lot_number = (payment.lot_number or '').strip()
            if lot_number and not lot_number.isdigit():
                raise ValidationError(
                    _('El numero de lote debe contener solo numeros.')
                )

    @api.model
    def _payment_fields(self, order, ui_paymentline):
        """
        Sobrescribe para importar el campo card_brand desde el frontend POS.
        Cuando el POS envía los datos del pago, este método procesa card_brand.
        """
        fields = super()._payment_fields(order, ui_paymentline)
        
        # Agregar card_brand si viene en los datos del frontend
        if 'card_brand' in ui_paymentline:
            fields['card_brand'] = ui_paymentline['card_brand']

        # Agregar lot_number si viene en los datos del frontend
        if 'lot_number' in ui_paymentline:
            fields['lot_number'] = ui_paymentline['lot_number']
        
        return fields
