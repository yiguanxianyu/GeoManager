# Linux Docker Compose 部署说明

本文档说明如何用 Docker Compose 部署“中亚胡杨林生态系统保护数据共享平台”。部署方式为两个容器：

- `django`：Django 后端，启动时执行数据库迁移和 `collectstatic`，由 Gunicorn 提供 WSGI 服务。
- `nginx`：服务 Docker 构建阶段生成的前端静态文件，并把 `/api/`、`/admin/` 反向代理到 `django:8000`。

前端构建在 Docker 多阶段构建中完成。Node.js、pnpm 和 `node_modules` 只存在于临时构建阶段，最终 Nginx 镜像只保留 `frontend/dist` 产物。

## 1. 容器内路径

- 程序目录：`/opt/app`
- 后端目录：`/opt/app/backend`
- 前端静态目录：`/usr/share/nginx/html`
- 默认配置路径：`/config/app.toml`
- 默认业务数据根目录：`/data/business`
- 默认地理数据根目录：`/data/geographic`

业务数据和地理数据通过宿主机目录挂载进入容器，不能打包进镜像。容器内程序目录使用通用路径，不包含项目名。

## 2. 准备配置文件

准备一个 TOML 配置文件，例如 `/srv/data-platform/app.toml`：

```toml
[system]
name = "中亚胡杨林生态系统保护数据共享平台"
mode = "production"
allow_registration = false

[storage]
business_data_root = "/srv/data-platform/business-data"
geographic_data_root = "/srv/data-platform/geographic-data"
auto_create_directories = true

[map]
default_center = [80.0, 41.5]
default_zoom = 4.5
default_basemap = "osm"
mapbox_access_token = "pk.your-mapbox-public-token"

[limits]
upload_max_mb = 512
query_result_limit = 30000

[raster]
symbolizer_timeout_seconds = 120
default_symbolizer_script = "scripts/raster_symbolizers/basic_gradient.py"
```

部署脚本会读取配置文件中的 `storage.business_data_root` 和 `storage.geographic_data_root` 作为宿主机数据目录，并生成 `.deploy/app.toml` 作为容器运行时配置。生成后的运行时配置会把这两个目录改写为容器内路径：

```toml
business_data_root = "/data/business"
geographic_data_root = "/data/geographic"
```

这样配置文件可以按宿主机实际目录编写，容器内仍保持固定路径约定。

## 3. 配置环境变量

可在项目根目录创建 `.env`，覆盖默认部署参数：

```bash
APP_SOURCE_CONFIG_FILE=/srv/data-platform/app.toml
APP_HTTP_PORT=80
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,your.domain.com,your.server.ip
GUNICORN_WORKERS=3
```

如需固定密钥，可额外设置：

```bash
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
```

未设置 `DJANGO_SECRET_KEY` 时，后端会自动生成并持久化到业务数据目录的 `database/.secret_key`。

## 4. 构建并启动

在项目根目录执行：

```bash
scripts/deploy.sh /srv/data-platform/app.toml
```

部署脚本会先根据传入配置生成容器运行时配置，再调用 Docker Compose 构建并启动服务。

Compose 会构建两个镜像：

- `data-platform-django:latest`
- `data-platform-nginx:latest`

公网访问端口默认为宿主机 `80`：

```text
http://服务器IP/
```

## 5. 一键更新脚本

仓库提供 `scripts/deploy.sh`，用于在服务器本地仓库中拉取最新代码并重建部署：

```bash
scripts/deploy.sh /srv/data-platform/app.toml
```

也可以通过环境变量传入配置文件：

```bash
APP_SOURCE_CONFIG_FILE=/srv/data-platform/app.toml scripts/deploy.sh
```

脚本流程：

1. 读取传入的 TOML 配置文件。
2. 从 `[storage]` 中取得宿主机业务数据目录和地理数据目录，并创建目录。
3. 生成 `.deploy/app.toml`，把数据目录改写为容器内 `/data/business` 和 `/data/geographic`。
4. 执行 `git pull --ff-only`。
5. 执行 `docker compose build`。
6. 执行 `docker compose up -d --remove-orphans`。

## 6. 初始化管理员

```bash
docker compose exec django app-entrypoint manage createsuperuser
```

创建后可通过登录后的后台入口或 `http://服务器IP/admin/` 访问 Django admin。

## 7. 数据目录约定

业务数据根目录下使用固定子目录：

```text
database/
media/
uploads/
exports/
logs/
static/
```

地理数据根目录下使用固定子目录：

```text
vector/
raster/
  original/
  preprocessed/
  metadata/
    source/
    preprocessed/
```

GeoPackage 矢量数据放入 `/data/geographic/vector`，原始栅格数据放入 `/data/geographic/raster/original`。栅格符号化在后端完成，前端只加载后端生成的 PNG 或瓦片结果。

## 8. 常用运维命令

查看日志：

```bash
docker compose logs -f
docker compose logs -f django
docker compose logs -f nginx
```

执行 Django 管理命令：

```bash
docker compose exec django app-entrypoint manage check
docker compose exec django app-entrypoint manage migrate
docker compose exec django app-entrypoint manage seed_demo
```

进入后端容器：

```bash
docker compose exec django app-entrypoint shell
```

健康检查：

```bash
curl http://服务器IP/api/health/
```

## 9. 生产部署注意事项

- `DJANGO_ALLOWED_HOSTS` 必须包含实际访问域名或服务器 IP。
- 对外 HTTPS 建议在宿主机或上游网关终止 TLS，再反代到本机 `80`。
- 配置文件可以只读挂载，业务数据和地理数据目录必须可读写。
- Nginx 容器只读挂载业务数据目录，用于服务 Django 收集后的 `/static/` 和上传后的 `/media/`。
- 如不希望启动时自动扫描栅格源文件，可设置 `APP_DISABLE_RASTER_STARTUP_SCAN=1`。
