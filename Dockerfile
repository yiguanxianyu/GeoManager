FROM mambaorg/micromamba:latest

ENV DEBIAN_FRONTEND=noninteractive \
    MAMBA_ROOT_PREFIX=/opt/conda \
    PATH=/opt/conda/bin:$PATH \
    DJANGO_SETTINGS_MODULE=data_sharing_platform.settings

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        tini \
    && rm -rf /var/lib/apt/lists/*

RUN micromamba install -y -n base -c conda-forge \
        python=3.14 \
        "django>=6.0,<7.0" \
        pillow \
        gdal \
        rasterio \
        tomlkit \
        geopandas \
        gunicorn \
    && micromamba clean -a -y

WORKDIR /opt/app

COPY backend ./backend
COPY config ./config
COPY docs/desgin-docs.md README.md AGENTS.md ./
COPY docker/entrypoint.sh /usr/local/bin/app-entrypoint

RUN chmod +x /usr/local/bin/app-entrypoint \
    && mkdir -p /data/app /data/research /config

EXPOSE 8000

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/app-entrypoint"]
CMD ["serve", "/config/app.toml"]
