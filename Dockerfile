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
CMD ["bash", "-lc", "export DB_HOST=${DB_HOST:-localhost}; export DB_PORT=${DB_PORT:-5432}; export DB_USER=${DB_USER:-odoo}; export DB_PASSWORD=${DB_PASSWORD:-odoo}; export DB_NAME=${DB_NAME:-odoo}; export ADMIN_PASSWD=${ADMIN_PASSWD:-admin}; envsubst < /etc/odoo/odoo.conf.template > /etc/odoo/odoo.conf && exec odoo"]
