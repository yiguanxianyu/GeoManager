# Linux Docker 部署说明

本文档说明如何用 Docker 部署“中亚胡杨林生态系统保护数据共享平台”。后端容器启动时执行数据库迁移和 `collectstatic`，由 Gunicorn 提供 WSGI 服务；管理后台由前端 `/admin/` SPA 承载。

## 容器路径

- 程序目录：`/opt/app`
- 后端目录：`/opt/app/backend`
- 默认输入配置：`/config/app.toml`
- 默认业务数据根目录：`/data/app`
- 默认科研数据根目录：`/data/research`

业务数据和科研数据必须通过宿主机目录挂载进入容器，不能打包进镜像。业务数据根目录需要可读写。

## TOML 配置

部署只使用一个 TOML 配置文件，不再使用 `.env` 文件传递应用配置。配置分两类：

- `[runtime]`：程序内部运行变量，例如 `debug`、`allowed_hosts`、Gunicorn 监听地址和 worker 数。
- `[application.*]`：用户可配置变量，例如系统名、注册开关、数据目录、地图和查询限制。

`django_secret_key` 不需要写入配置文件。后端会自动生成并持久化到业务数据目录的 `database/.secret_key`。

示例 `/srv/data-platform/app.toml`：

```toml
[runtime]
debug = false
allowed_hosts = ["localhost", "127.0.0.1", "your.domain.com"]
csrf_trusted_origins = ["https://your.domain.com"]
gunicorn_bind = "0.0.0.0:8000"
gunicorn_workers = 3
http_port = 80
disable_catalog_startup_scan = false
disable_raster_startup_scan = false

[application.system]
name = "中亚胡杨林生态系统保护数据共享平台"
allow_registration = true

[application.storage]
app_data = "/data/app"
research_data_root = "/data/research"

[application.map]
default_center = [80.0, 41.5]
default_zoom = 4.5
default_basemap = "osm"
mapbox_access_token = ""

[application.limits]
upload_max_mb = 512
query_result_limit = 30000

[application.raster]
symbolizer_timeout_seconds = 120
```

`auto_create_directories` 已固定为开启，不再配置。`default_symbolizer_script` 为程序内部实现细节，不再暴露为配置项。

## 运行配置副本

首次执行数据库迁移时，Django migration 会把传入的源配置复制到业务数据目录：

```text
/data/app/config/app.toml
```

之后新版后台“系统设置”页面只修改这份 appdata 下的运行配置副本，不会修改最初传入的源配置文件。这样可以保留部署输入文件作为初始模板，同时让运行期设置变更持久化在业务数据目录中。

## 启动

构建镜像：

```bash
docker build -t data-platform-django:latest .
```

启动容器示例：

```bash
docker run -d --name data-platform \
  -p 80:8000 \
  -v /srv/data-platform/app.toml:/config/app.toml:ro \
  -v /srv/data-platform/appdata:/data/app \
  -v /srv/data-platform/research:/data/research \
  data-platform-django:latest serve /config/app.toml
```

仓库提供部署脚本时，可直接传入 TOML 配置路径：

```bash
scripts/deploy.sh /srv/data-platform/app.toml
```

脚本会复制输入配置到 `.deploy/app.toml`，读取 `[runtime].http_port` 作为对外端口变量，并执行构建与启动流程。

部署脚本使用 `tomlkit` 解析 TOML 配置，执行脚本的 Python 环境需要已安装项目后端依赖。

## 初始化管理员

首次部署默认可开放自助注册。第一个通过登录页注册的用户会自动成为系统管理员。之后可通过 `/admin/` 访问管理后台。

## 数据目录约定

业务数据根目录下使用固定子目录：

```text
database/
media/
uploads/
exports/
logs/
static/
config/
```

科研数据根目录下使用固定子目录：

```text
vector/
raster/
  original/
  preprocessed/
  metadata/
    source/
    preprocessed/
gene/
table/
```

GeoPackage 矢量数据放入 `/data/research/vector`，原始栅格数据放入 `/data/research/raster/original`，基因数据放入 `/data/research/gene`，表格数据放入 `/data/research/table`。栅格符号化在后端完成，前端只加载后端生成的 PNG 或瓦片结果。

## 常用命令

执行 Django 管理命令：

```bash
docker exec data-platform app-entrypoint manage check
docker exec data-platform app-entrypoint manage migrate
```

健康检查：

```bash
curl http://服务器IP/api/health/
```

日志文件写入业务数据根目录的 `logs/` 子目录，包括 Django、应用、安全和 Gunicorn 日志。
