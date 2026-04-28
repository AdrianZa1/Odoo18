FROM odoo:18.0

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends gettext-base \
    && rm -rf /var/lib/apt/lists/*

# Copia tu módulo personalizado al contenedor
COPY server/addons/mejoras_restaurant /mnt/extra-addons/mejoras_restaurant

# Copia la plantilla de configuración
COPY config/odoo.conf.template /etc/odoo/odoo.conf.template
RUN chown -R odoo:odoo /mnt/extra-addons /etc/odoo

USER odoo
ENV ODOO_RC=/etc/odoo/odoo.conf
CMD ["bash", "-lc", "if [ -z \"$ADMIN_PASSWD\" ]; then export ADMIN_PASSWD=admin; fi; envsubst < /etc/odoo/odoo.conf.template > /etc/odoo/odoo.conf && exec odoo"]
