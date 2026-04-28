# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo.exceptions import UserError, ValidationError


class PosOrderLineReservation(models.Model):
    _name = "pos.order.line.reservation"
    _description = "POS Order Line Reservation"
    _order = "reservation_datetime desc, id desc"

    name = fields.Char(string="Reference", required=True, default=lambda self: _("New"))
    pos_order_id = fields.Many2one("pos.order", string="POS Order", ondelete="set null")
    original_pos_order_line_id = fields.Many2one(
        "pos.order.line", string="Original Order Line", ondelete="set null"
    )
    pos_session_id = fields.Many2one("pos.session", string="Session", ondelete="set null")
    pos_config_id = fields.Many2one("pos.config", string="POS", ondelete="set null")
    company_id = fields.Many2one("res.company", string="Company", required=True)
    currency_id = fields.Many2one("res.currency", string="Currency", required=True)
    product_id = fields.Many2one("product.product", string="Product", required=True)
    product_name = fields.Char(string="Product Name", required=True)
    reserved_qty = fields.Float(string="Reserved Quantity", required=True)
    unit_price = fields.Float(string="Unit Price")
    reserved_amount = fields.Monetary(string="Reserved Amount", currency_field="currency_id")
    order_uuid = fields.Char(string="Order UUID")
    line_uuid = fields.Char(string="Line UUID")
    order_reference = fields.Char(string="Order Reference")
    table_id = fields.Many2one("restaurant.table", string="Table", ondelete="set null")
    table_name = fields.Char(string="Table Name")
    service_mode = fields.Selection(
        [
            ("dine_in", "Dine In"),
            ("takeaway", "Takeaway"),
            ("other", "Other"),
        ],
        string="Service Mode",
        default="other",
        required=True,
    )
    note = fields.Char(string="Kitchen Note")
    reserved_by_user_id = fields.Many2one(
        "res.users", string="Reserved By User", required=True, default=lambda self: self.env.user
    )
    reserved_by_employee_id = fields.Many2one(
        "hr.employee", string="Reserved By Employee", ondelete="set null"
    )
    reservation_datetime = fields.Datetime(
        string="Reservation Datetime", required=True, default=fields.Datetime.now
    )

    @api.constrains("reserved_qty")
    def _check_reserved_qty(self):
        for rec in self:
            if rec.reserved_qty <= 0:
                raise ValidationError(_("Reserved quantity must be greater than zero."))

    @api.model_create_multi
    def create(self, vals_list):
        sequence = self.env["ir.sequence"]
        for vals in vals_list:
            if not vals.get("name") or vals["name"] == _("New"):
                vals["name"] = sequence.next_by_code("mejoras_restaurant.pos.reservation") or _("New")
        return super().create(vals_list)

    @api.model
    def create_from_pos(self, payload):
        payload = payload or {}
        order = self.env["pos.order"].browse(payload.get("order_id"))
        if not order.exists():
            raise UserError(_("The POS order was not found."))
        if order.state not in ("draft",):
            raise UserError(_("Only draft POS orders can be reserved."))

        line_uuid = payload.get("line_uuid")
        line = order.lines.filtered(lambda l: l.uuid == line_uuid)[:1]
        if not line:
            raise UserError(_("The selected order line was not found in the order."))

        reserve_qty = float(payload.get("reserve_qty") or 0)
        if reserve_qty <= 0:
            raise UserError(_("Reserve quantity must be greater than zero."))
        if reserve_qty > line.qty:
            raise UserError(_("You cannot reserve more quantity than the order line has."))

        employee = False
        employee_id = payload.get("cashier_employee_id")
        if employee_id:
            employee = self.env["hr.employee"].browse(employee_id).exists()

        if order.table_id:
            service_mode = "dine_in"
        elif getattr(order, "takeaway", False):
            service_mode = "takeaway"
        else:
            service_mode = "other"

        reservation = self.create(
            {
                "pos_order_id": order.id,
                "original_pos_order_line_id": line.id,
                "pos_session_id": order.session_id.id,
                "pos_config_id": order.config_id.id,
                "company_id": order.company_id.id,
                "currency_id": order.currency_id.id,
                "product_id": line.product_id.id,
                "product_name": line.full_product_name or line.product_id.display_name or line.product_id.name,
                "reserved_qty": reserve_qty,
                "unit_price": line.price_unit,
                "reserved_amount": reserve_qty * line.price_unit,
                "order_uuid": order.uuid,
                "line_uuid": line.uuid,
                "order_reference": order.pos_reference or order.name,
                "table_id": order.table_id.id,
                "table_name": order.table_id.table_number if order.table_id else False,
                "service_mode": service_mode,
                "note": line.note,
                "reserved_by_user_id": self.env.user.id,
                "reserved_by_employee_id": employee.id if employee else False,
            }
        )

        return {
            "id": reservation.id,
            "name": reservation.name,
        }
