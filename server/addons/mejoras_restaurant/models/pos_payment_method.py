# -*- coding: utf-8 -*-
"""
Extensión del modelo pos.payment.method
========================================
Agrega el campo is_card_payment para identificar métodos de pago con tarjeta.
"""

from odoo import models, fields, api


class PosPaymentMethod(models.Model):
    """
    Extiende pos.payment.method para agregar configuración de pago con tarjeta.
    """
    _inherit = 'pos.payment.method'

    is_card_payment = fields.Boolean(
        string='Es pago con tarjeta',
        default=False,
        help='Marque esta opción si este método de pago es con tarjeta. '
             'Al usar este método en el POS, se solicitará automáticamente '
             'la marca de la tarjeta (Visa, MasterCard, etc.)'
    )

    @api.model
    def _load_pos_data_fields(self, config_id):
        """
        Sobrescribe el método para cargar el campo is_card_payment en el POS.
        Este campo se necesita en el frontend para detectar si debe mostrar
        el popup de selección de marca.
        """
        result = super()._load_pos_data_fields(config_id)
        result.append('is_card_payment')
        return result
