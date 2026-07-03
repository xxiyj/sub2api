# Sub2API 模板分支与服务器更新流程

本文档记录本仓库作为 Sub2API 定制模板使用时的长期维护逻辑：既跟随官方更新，又保留自己的模板、页面、配置和功能改动。

## 文档位置

这类内容建议放在 `docs/` 目录，而不是项目根目录。

原因：

- 它是项目维护和部署规范，不是用户首页说明。
- 根目录已有 `README.md`、`README_CN.md`、`DEV_GUIDE.md` 等高频文件。
- 后续还可以继续补充部署、回滚、冲突处理、模板改动清单等文档。

## 当前 Git 架构

本仓库有两个远端：

```bash
origin    git@github.com:xxiyj/sub2api.git
upstream  https://github.com/Wei-Shaw/sub2api.git
```

建议固定使用下面的分支职责：

| 分支 | 职责 |
| --- | --- |
| `main` | 只跟随官方 `upstream/main`，不放个人模板改动 |
| `my-template` | 长期保存自己的模板改动、页面改动、配置改动和功能改动 |

核心原则：

- `main` 是干净的官方同步线。
- `my-template` 是自己的生产模板线。
- 官方更新先进 `main`，再由 `my-template` 合并 `main`。
- 冲突只在 `my-template` 上解决，不污染 `main`。

## 官方更新后的本地同步流程

先获取官方最新代码：

```bash
git fetch upstream
```

同步本地 `main`：

```bash
git checkout main
git merge upstream/main
git push origin main
```

把官方更新合并到自己的模板分支：

```bash
git checkout my-template
git merge main
```

如果出现冲突，在本地解决冲突后：

```bash
git status
git add <resolved-files>
git commit
```

然后推送自己的模板分支：

```bash
git push origin my-template
```

Windows 本地也可以直接运行脚本：

```bat
scripts\sync-upstream.bat
```

这个脚本会自动执行：

1. 检查当前工作区是否干净。
2. `git fetch upstream`。
3. 切到 `main`。
4. 用 `git merge --ff-only upstream/main` 同步官方更新。
5. 推送 `main` 到 `origin/main`。
6. 切到 `my-template`。
7. 把 `main` 合并进 `my-template`。
8. 询问是否立刻推送 `my-template` 到 `origin/my-template`。

如果发生冲突，脚本会停在 `my-template`，需要手动解决冲突后再提交。

## 为什么推荐 merge，不推荐 rebase

本仓库适合使用 `merge`：

- 操作更直观，适合长期维护模板分支。
- 不需要改写 `my-template` 的公开历史。
- 服务器、备份、排查问题时更容易对应某次合并。
- 冲突解决结果会被 Git 记录，下次遇到相似冲突更容易处理。

`rebase` 历史更线性，但每次官方更新都可能重放大量个人提交，且容易误推、误覆盖，不适合作为默认流程。

## 本地测试流程

合并官方更新后，先在本地测试，再考虑更新服务器。

后端测试：

```bash
cd backend
go test -tags=unit ./...
```

如本地 PostgreSQL、Redis、Docker 环境可用，再跑集成测试：

```bash
cd backend
go test -tags=integration ./...
```

前端测试和类型检查：

```bash
cd frontend
pnpm install
pnpm run lint:check
pnpm run typecheck
pnpm run test:run
```

如果只改模板页面或前端 UI，至少要执行：

```bash
cd frontend
pnpm run build
```

## 生产构建逻辑

如果服务器使用官方 `install.sh` 安装，而不是 Docker，那么生产环境运行的是单个二进制文件：

```bash
/opt/sub2api/sub2api
```

systemd 服务文件中的启动命令是：

```bash
ExecStart=/opt/sub2api/sub2api
```

因此，自己的模板版更新不能直接执行官方升级命令。官方升级命令会下载官方 Release，覆盖自己的定制版。

不要用于模板版生产更新：

```bash
curl -sSL https://raw.githubusercontent.com/Wei-Shaw/sub2api/main/deploy/install.sh | sudo bash -s -- upgrade
```

推荐流程是：

1. 本地同步官方更新。
2. 本地 `my-template` 解决冲突。
3. 本地完成测试。
4. 本地构建 Linux 服务器可运行的二进制。
5. 本地编译 `amd64` 和 `arm64` 两个 Linux 二进制。
6. 上传两个二进制到服务器同一个目录。
7. 在服务器执行一键更新脚本，脚本自动判断服务器架构。
8. 脚本备份旧二进制、替换 `/opt/sub2api/sub2api`。
9. 脚本重启 `sub2api` 服务并检查健康状态。

注意：数据库备份不在脚本内执行，需要在生产更新前自行完成。

## 构建自己的模板版二进制

前端生产构建会输出到后端嵌入目录：

```bash
cd frontend
pnpm install
pnpm run build
```

`frontend/vite.config.ts` 的 `outDir` 是：

```text
../backend/internal/web/dist
```

也就是说，前端模板、页面、样式变更必须先执行 `pnpm run build`，让最新前端产物进入 `backend/internal/web/dist`。

然后编译带前端嵌入的后端二进制：

```bash
cd backend
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -tags embed \
  -ldflags="-s -w" \
  -trimpath \
  -o bin/sub2api \
  ./cmd/server
```

如果服务器是 ARM64，把 `GOARCH` 改为：

```bash
GOARCH=arm64
```

如果在 Windows PowerShell 直接构建，可以使用：

```powershell
cd frontend
pnpm install
pnpm run build

cd ..\backend
$env:CGO_ENABLED="0"
$env:GOOS="linux"
$env:GOARCH="amd64"
go build -tags embed -ldflags="-s -w" -trimpath -o bin/sub2api ./cmd/server
```

构建完成后，产物在：

```text
backend/bin/sub2api
```

## 推荐流程：GitHub Releases 一条命令更新

以下步骤适用于官方 `install.sh` 安装的非 Docker 部署。

日常推荐方式：给 `my-template` 打一个 `custom-v*` tag，由 GitHub Actions 自动编译两个 Linux 版本并上传到你自己 fork 仓库的 GitHub Releases。服务器使用一条 `curl` 命令运行更新脚本，脚本根据 `uname -m` 自动下载对应架构的二进制。

发布自定义 Release：

```bash
git checkout my-template
git pull origin my-template
git tag custom-v0.1.143-1
git push origin custom-v0.1.143-1
```

GitHub Actions 会运行：

```text
.github/workflows/custom-release.yml
```

它会自动生成并上传三个 Release assets：

```text
sub2api-linux-amd64
sub2api-linux-arm64
checksums.txt
```

如果需要重新上传同一个 tag 的 assets，可以在 GitHub Actions 页面手动运行 `Custom Template Release` workflow，并填写同一个 tag；workflow 会覆盖同名 assets。

### 本地手动构建 Release Assets

如果不想用 GitHub Actions，也可以在本地构建同名 assets 后手动上传到 GitHub Releases。

本地一键构建：

```powershell
cd D:\Cloud\code\AI\sub2api模板\sub2api
powershell -ExecutionPolicy Bypass -File .\tools\build-custom-release.ps1
```

默认输出目录：

```text
dist-custom/sub2api-linux-amd64
dist-custom/sub2api-linux-arm64
dist-custom/checksums.txt
```

本地构建会输出：

```text
sub2api-linux-amd64
sub2api-linux-arm64
checksums.txt
```

服务器更新只需要一条命令：

```bash
curl -fsSL https://raw.githubusercontent.com/xxiyj/sub2api/my-template/deploy/update-custom-binary.sh | sudo GITHUB_REPO=xxiyj/sub2api bash
```

如果要指定某个 Release tag，而不是 latest：

```bash
curl -fsSL https://raw.githubusercontent.com/xxiyj/sub2api/my-template/deploy/update-custom-binary.sh | sudo GITHUB_REPO=xxiyj/sub2api SUB2API_RELEASE=v你的版本号 bash
```

如果你的 fork 或 Release 是私有的，需要提供 GitHub token：

```bash
curl -fsSL https://raw.githubusercontent.com/xxiyj/sub2api/my-template/deploy/update-custom-binary.sh | sudo GITHUB_REPO=xxiyj/sub2api GITHUB_TOKEN=你的token bash
```

脚本会自动完成：

- 用 `uname -m` 判断服务器架构。
- `x86_64` 或 `amd64` 下载 `sub2api-linux-amd64`。
- `aarch64` 或 `arm64` 下载 `sub2api-linux-arm64`。
- 如果 Release 中有 `checksums.txt`，自动校验 SHA256。
- 备份旧二进制到 `/opt/sub2api/backups/bin/`。
- 替换 `/opt/sub2api/sub2api`。
- 重启 `sub2api`。
- 检查 systemd 状态和 `/health`。
- 如果新二进制启动或健康检查失败，自动回滚旧二进制。

如果服务器健康检查地址不是 `http://127.0.0.1:8080/health`，使用：

```bash
curl -fsSL https://raw.githubusercontent.com/xxiyj/sub2api/my-template/deploy/update-custom-binary.sh | sudo GITHUB_REPO=xxiyj/sub2api SUB2API_HEALTH_URL=http://127.0.0.1:你的端口/health bash
```

## 备选流程：本地上传双架构二进制

如果暂时不想使用 GitHub Releases，也可以本地编译后上传两个二进制到服务器目录。

上传到服务器：

```powershell
ssh root@your-server "mkdir -p /tmp/sub2api-release"
scp D:\Cloud\code\AI\sub2api模板\sub2api\dist-custom\sub2api-linux-* root@your-server:/tmp/sub2api-release/
```

服务器执行：

```bash
curl -fsSL https://raw.githubusercontent.com/xxiyj/sub2api/my-template/deploy/update-custom-binary.sh | sudo bash -s -- --binary-dir /tmp/sub2api-release
```

## 备选流程：服务器拉代码并编译

如果你希望服务器自己拉 `my-template` 并编译，也可以使用 `--build-from-git`：

```bash
curl -fsSL https://raw.githubusercontent.com/xxiyj/sub2api/my-template/deploy/update-custom-binary.sh | sudo SUB2API_REPO_URL=git@github.com:xxiyj/sub2api.git SUB2API_BRANCH=my-template bash -s -- --build-from-git
```

这种方式要求服务器有：

- `git`
- `node`
- `pnpm`
- `go`
- 能访问 `git@github.com:xxiyj/sub2api.git` 的 SSH key，或把 `SUB2API_REPO_URL` 改成 HTTPS 地址。

## 备选流程：只上传单个二进制

如果你已经明确服务器架构，也可以只上传一个二进制并使用 `--binary` 模式：

```bash
scp backend/bin/sub2api root@your-server:/tmp/sub2api
sudo bash /opt/sub2api/scripts/update-custom-binary.sh --binary /tmp/sub2api
```

## 一键更新脚本前置条件

推荐的 Release 模式只要求服务器有：

- `bash`
- `systemctl`
- `install`
- `curl`
- `sha256sum`，可选，用于校验 `checksums.txt`

服务器不需要安装 Node、pnpm、Go。

## 手动服务器更新流程

如果不使用一键脚本，可以按下面的手动流程更新。

先上传本地构建好的二进制到服务器，例如：

```bash
scp backend/bin/sub2api root@your-server:/tmp/sub2api
```

在服务器上检查当前服务状态：

```bash
sudo systemctl status sub2api
```

更新前先备份旧二进制：

```bash
sudo cp /opt/sub2api/sub2api /opt/sub2api/sub2api.backup.$(date +%Y%m%d%H%M%S)
```

停止服务、替换二进制、启动服务：

```bash
sudo systemctl stop sub2api
sudo cp /tmp/sub2api /opt/sub2api/sub2api
sudo chown sub2api:sub2api /opt/sub2api/sub2api
sudo chmod +x /opt/sub2api/sub2api
sudo systemctl start sub2api
```

检查状态和日志：

```bash
sudo systemctl status sub2api
sudo journalctl -u sub2api -n 100 --no-pager
```

确认健康检查：

```bash
curl -fsS http://127.0.0.1:8080/health
```

如果服务端口不是 `8080`，按实际端口调整。

## 数据库迁移注意事项

官方更新可能包含新的数据库迁移。

使用二进制部署时，通常是新程序启动后执行迁移逻辑。因此生产更新前必须备份数据库。

注意：

- 只备份旧二进制不等于完整回滚能力。
- 如果新版本启动后执行了数据库迁移，回滚旧二进制可能仍然不兼容新数据库结构。
- 出现严重问题时，最稳妥的回滚方式是同时恢复旧二进制和更新前数据库备份。

## 回滚流程

如果新版本启动失败，先查看日志：

```bash
sudo journalctl -u sub2api -n 200 --no-pager
```

如果需要回滚旧二进制：

```bash
sudo systemctl stop sub2api
sudo cp /opt/sub2api/sub2api.backup.<timestamp> /opt/sub2api/sub2api
sudo chown sub2api:sub2api /opt/sub2api/sub2api
sudo chmod +x /opt/sub2api/sub2api
sudo systemctl start sub2api
```

如果新版本已经执行了不兼容的数据库迁移，还需要恢复更新前的数据库备份。

## 每次更新前检查清单

- `main` 已同步 `upstream/main`。
- `my-template` 已合并最新 `main`。
- 所有冲突已解决。
- 前端已执行 `pnpm run build`。
- 后端已使用 `-tags embed` 构建。
- 本地关键测试已通过。
- 服务器旧二进制已备份。
- 服务器数据库已备份。
- 上传的是 `my-template` 构建产物，不是官方 Release。
- 更新后已检查 `systemctl status sub2api`。
- 更新后已检查 `journalctl -u sub2api`。
- 更新后已访问前端页面，确认模板改动仍然存在。

## 一句话原则

`main` 只追官方，`my-template` 保存自己的模板；本地合并和测试，服务器只替换自己构建的二进制；官方 `install.sh upgrade` 只适合纯官方版，不适合模板版。
