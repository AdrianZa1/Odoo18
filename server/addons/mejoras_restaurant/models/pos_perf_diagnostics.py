# -*- coding: utf-8 -*-
"""Diagnostic instrumentation for POS invoicing performance.

This module only adds timing logs and does not alter business behavior.
"""

import logging
import time
import uuid

from odoo import api, models


_logger = logging.getLogger(__name__)


def _ms(start):
    return (time.perf_counter() - start) * 1000.0


class PosOrder(models.Model):
    _inherit = "pos.order"

    def _perf_token(self):
        return self.env.context.get("pos_perf_token", "-")

    @api.model
    def sync_from_ui(self, orders):
        token = uuid.uuid4().hex[:8]
        t0 = time.perf_counter()
        to_invoice_count = sum(1 for order in orders if order.get("to_invoice"))
        _logger.info(
            "[POS_PERF][%s] sync_from_ui.start orders=%s to_invoice=%s",
            token,
            len(orders),
            to_invoice_count,
        )
        try:
            return super(PosOrder, self.with_context(pos_perf_token=token)).sync_from_ui(orders)
        finally:
            _logger.info(
                "[POS_PERF][%s] sync_from_ui.end elapsed_ms=%.2f",
                token,
                _ms(t0),
            )

    @api.model
    def _process_order(self, order, existing_order):
        t0 = time.perf_counter()
        token = self._perf_token()
        mode = "update" if existing_order else "create"
        order_ref = order.get("name") or order.get("uuid") or "-"
        _logger.info(
            "[POS_PERF][%s][%s] process_order.start mode=%s to_invoice=%s lines=%s payments=%s",
            token,
            order_ref,
            mode,
            bool(order.get("to_invoice")),
            len(order.get("lines") or []),
            len(order.get("payment_ids") or []),
        )
        try:
            return super()._process_order(order, existing_order)
        finally:
            _logger.info(
                "[POS_PERF][%s][%s] process_order.end elapsed_ms=%.2f",
                token,
                order_ref,
                _ms(t0),
            )

    def _process_saved_order(self, draft):
        t0 = time.perf_counter()
        token = self._perf_token()
        self.ensure_one()
        _logger.info(
            "[POS_PERF][%s][%s] process_saved_order.start draft=%s to_invoice=%s state=%s",
            token,
            self.name or self.id,
            bool(draft),
            bool(self.to_invoice),
            self.state,
        )
        try:
            return super()._process_saved_order(draft)
        finally:
            _logger.info(
                "[POS_PERF][%s][%s] process_saved_order.end elapsed_ms=%.2f state=%s",
                token,
                self.name or self.id,
                _ms(t0),
                self.state,
            )

    def _process_payment_lines(self, pos_order, order, pos_session, draft):
        t0 = time.perf_counter()
        token = self._perf_token()
        order_ref = order.name or order.id
        _logger.info(
            "[POS_PERF][%s][%s] payment_lines.start draft=%s ui_payment_lines=%s",
            token,
            order_ref,
            bool(draft),
            len(pos_order.get("payment_ids") or []),
        )
        try:
            return super()._process_payment_lines(pos_order, order, pos_session, draft)
        finally:
            _logger.info(
                "[POS_PERF][%s][%s] payment_lines.end elapsed_ms=%.2f",
                token,
                order_ref,
                _ms(t0),
            )

    def action_pos_order_paid(self):
        t0 = time.perf_counter()
        token = self._perf_token()
        self.ensure_one()
        _logger.info("[POS_PERF][%s][%s] action_pos_order_paid.start", token, self.name or self.id)
        try:
            return super().action_pos_order_paid()
        finally:
            _logger.info(
                "[POS_PERF][%s][%s] action_pos_order_paid.end elapsed_ms=%.2f",
                token,
                self.name or self.id,
                _ms(t0),
            )

    def _create_order_picking(self):
        t0 = time.perf_counter()
        token = self._perf_token()
        self.ensure_one()
        _logger.info("[POS_PERF][%s][%s] create_order_picking.start", token, self.name or self.id)
        try:
            return super()._create_order_picking()
        finally:
            _logger.info(
                "[POS_PERF][%s][%s] create_order_picking.end elapsed_ms=%.2f",
                token,
                self.name or self.id,
                _ms(t0),
            )

    def _generate_pos_order_invoice(self):
        t0 = time.perf_counter()
        token = self._perf_token()
        _logger.info(
            "[POS_PERF][%s] generate_pos_order_invoice.start order_count=%s",
            token,
            len(self),
        )
        try:
            return super()._generate_pos_order_invoice()
        finally:
            _logger.info(
                "[POS_PERF][%s] generate_pos_order_invoice.end elapsed_ms=%.2f",
                token,
                _ms(t0),
            )

    def _prepare_tax_base_line_values(self):
        t0 = time.perf_counter()
        token = self._perf_token()
        self.ensure_one()
        try:
            return super()._prepare_tax_base_line_values()
        finally:
            _logger.info(
                "[POS_PERF][%s][%s] prepare_tax_base_lines.elapsed_ms=%.2f",
                token,
                self.name or self.id,
                _ms(t0),
            )

    def _prepare_invoice_vals(self):
        t0 = time.perf_counter()
        token = self._perf_token()
        self.ensure_one()
        _logger.info("[POS_PERF][%s][%s] prepare_invoice_vals.start", token, self.name or self.id)
        try:
            vals = super()._prepare_invoice_vals()
            _logger.info(
                "[POS_PERF][%s][%s] prepare_invoice_vals.end elapsed_ms=%.2f invoice_lines=%s",
                token,
                self.name or self.id,
                _ms(t0),
                len(vals.get("invoice_line_ids") or []),
            )
            return vals
        except Exception:
            _logger.exception("[POS_PERF][%s][%s] prepare_invoice_vals.error", token, self.name or self.id)
            raise

    def _create_invoice(self, move_vals):
        t0 = time.perf_counter()
        token = self._perf_token()
        self.ensure_one()
        _logger.info("[POS_PERF][%s][%s] create_invoice.start", token, self.name or self.id)
        try:
            invoice = super()._create_invoice(move_vals)
            _logger.info(
                "[POS_PERF][%s][%s] create_invoice.end elapsed_ms=%.2f account_move_id=%s",
                token,
                self.name or self.id,
                _ms(t0),
                invoice.id,
            )
            return invoice
        except Exception:
            _logger.exception("[POS_PERF][%s][%s] create_invoice.error", token, self.name or self.id)
            raise

    def _apply_invoice_payments(self, is_reverse=False):
        t0 = time.perf_counter()
        token = self._perf_token()
        self.ensure_one()
        _logger.info(
            "[POS_PERF][%s][%s] apply_invoice_payments.start is_reverse=%s",
            token,
            self.name or self.id,
            bool(is_reverse),
        )
        try:
            return super()._apply_invoice_payments(is_reverse=is_reverse)
        finally:
            _logger.info(
                "[POS_PERF][%s][%s] apply_invoice_payments.end elapsed_ms=%.2f",
                token,
                self.name or self.id,
                _ms(t0),
            )


class AccountMove(models.Model):
    _inherit = "account.move"

    def _post(self, soft=True):
        t0 = time.perf_counter()
        token = self.env.context.get("pos_perf_token", "-")
        pos_moves_before = self.filtered(lambda move: move.pos_order_ids)
        try:
            return super()._post(soft=soft)
        finally:
            if pos_moves_before:
                _logger.info(
                    "[POS_PERF][%s] account_move_post.end elapsed_ms=%.2f moves=%s soft=%s",
                    token,
                    _ms(t0),
                    pos_moves_before.ids,
                    bool(soft),
                )

    def _generate_and_send(self, force_synchronous=True, allow_fallback_pdf=True, **custom_settings):
        t0 = time.perf_counter()
        token = self.env.context.get("pos_perf_token", "-")
        pos_moves = self.filtered(lambda move: move.pos_order_ids)
        try:
            return super()._generate_and_send(
                force_synchronous=force_synchronous,
                allow_fallback_pdf=allow_fallback_pdf,
                **custom_settings,
            )
        finally:
            if pos_moves:
                _logger.info(
                    "[POS_PERF][%s] account_move_generate_and_send.end elapsed_ms=%.2f moves=%s",
                    token,
                    _ms(t0),
                    pos_moves.ids,
                )
